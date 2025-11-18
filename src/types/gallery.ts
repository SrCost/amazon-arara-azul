export interface GalleryImage {
  id: string;
  file_name: string;
  storage_path: string;
  alt_text: string;
  category: 'experiences' | 'bungalows' | 'food' | 'nature' | 'wildlife';
  display_order: number;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImageUpload {
  file: File;
  alt_text: string;
  category: string;
  preview: string; // Data URL
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}
