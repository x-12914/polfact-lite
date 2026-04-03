const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const BASE_HOST = API_BASE_URL.replace('/api/v1', '');

/**
 * Resolves a media path to a full URL.
 * If the path is already a full URL, it returns it.
 * If the path is relative (starts with /), it prepends the backend host.
 */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) {
    return 'https://via.placeholder.com/150?text=No+Image';
  }

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Ensure relative path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${BASE_HOST}${normalizedPath}`;
}
