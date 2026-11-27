export const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024; // 100MB

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'] as const;

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export const VIDEO_EXTENSIONS = ['.mp4', '.mov'];

export type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};
