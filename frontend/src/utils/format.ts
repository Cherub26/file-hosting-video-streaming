// Shared formatting utilities

export function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }); // HH:mm
  return `${date} ${time}`;
}

export function formatFileSize(size: string | number) {
  const num = typeof size === 'string' ? parseInt(size, 10) : size;
  if (isNaN(num)) return '-';
  if (num < 1024) return `${num} bytes`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(2)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
} 