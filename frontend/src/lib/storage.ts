import { getBackendUrl } from './api';

/**
 * Returns the backend URL for a clip's thumbnail served from local disk.
 * Uses the clip ID to build the URL to /api/clips/{id}/thumbnail.
 */
export function getThumbnailUrl(clipId: string): string {
  return getBackendUrl(`/api/clips/${clipId}/thumbnail`);
}
