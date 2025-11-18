export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  targetSizeKB?: number;
  format?: 'jpeg' | 'webp';
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
}

function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  targetSizeKB: number,
  format: string,
  initialQuality: number
): Promise<Blob> {
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
  let quality = initialQuality;
  let blob: Blob | null = null;
  const minQuality = 0.6;

  while (quality >= minQuality) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType, quality);
    });

    if (!blob) break;

    const sizeKB = blob.size / 1024;
    if (sizeKB <= targetSizeKB || quality <= minQuality) {
      break;
    }

    quality -= 0.05;
  }

  return blob || (await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), mimeType, minQuality);
  }));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export async function compressImage(
  file: File,
  options?: Partial<CompressionOptions>
): Promise<CompressionResult> {
  const defaultOptions: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.82,
    format: 'webp',
  };

  const opts = { ...defaultOptions, ...options };

  try {
    const img = await loadImage(file);
    const originalSize = file.size;

    const { width, height } = calculateOptimalDimensions(
      img.naturalWidth,
      img.naturalHeight,
      opts.maxWidth,
      opts.maxHeight
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(img, 0, 0, width, height);

    let blob: Blob;
    if (opts.targetSizeKB) {
      blob = await compressToTargetSize(
        canvas,
        opts.targetSizeKB,
        opts.format || 'webp',
        opts.quality
      );
    } else {
      const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
      blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), mimeType, opts.quality);
      });
    }

    const extension = opts.format === 'webp' ? '.webp' : '.jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const compressedFile = new File([blob], `${baseName}${extension}`, {
      type: blob.type,
    });

    const compressedSize = compressedFile.size;
    const compressionRatio = Math.round(
      ((originalSize - compressedSize) / originalSize) * 100
    );

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      dimensions: { width, height },
    };
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
}

export function needsCompression(file: File): boolean {
  const sizeThresholdKB = 300;
  return file.size / 1024 > sizeThresholdKB;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
