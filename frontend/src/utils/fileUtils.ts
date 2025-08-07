// Utility functions for file operations

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}