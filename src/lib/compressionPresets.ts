import { CompressionOptions } from './imageCompression';

export const COMPRESSION_PRESETS: Record<string, CompressionOptions> = {
  experiences: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.82,
    targetSizeKB: 500,
    format: 'webp',
  },
  bungalows: {
    maxWidth: 2400,
    maxHeight: 1600,
    quality: 0.85,
    targetSizeKB: 700,
    format: 'webp',
  },
  food: {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.80,
    targetSizeKB: 400,
    format: 'webp',
  },
  nature: {
    maxWidth: 2048,
    maxHeight: 1536,
    quality: 0.82,
    targetSizeKB: 600,
    format: 'webp',
  },
  wildlife: {
    maxWidth: 2048,
    maxHeight: 1536,
    quality: 0.85,
    targetSizeKB: 650,
    format: 'webp',
  },
};
