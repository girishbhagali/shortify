/**
 * api.ts — Centralized backend API client
 *
 * SECURITY RULE: Never hardcode backend URLs in component or hook files.
 * All calls to the FastAPI backend must go through this module.
 * Set NEXT_PUBLIC_BACKEND_URL in .env.local (or the hosting platform's env config).
 */

// Falls back to localhost for local development only.
// In production this MUST be set to your deployed backend URL.
const BACKEND_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    ""
  ); // strip trailing slash

export function getBackendUrl(path: string): string {
  // Ensure path always starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${normalizedPath}`;
}

// ─── Typed response helpers ───────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}

/**
 * Wraps fetch with consistent error handling.
 * Throws an Error with the API's `detail` message on non-2xx responses.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(getBackendUrl(path), options);

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body: ApiError = await response.json();
      if (body.detail) detail = body.detail;
    } catch {
      // Response body was not JSON — keep the generic message
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

/**
 * POST JSON to the backend.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * POST FormData (multipart) to the backend.
 * Do NOT set Content-Type header — the browser sets it with the correct boundary.
 */
export async function apiPostForm<T>(
  path: string,
  formData: FormData
): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: formData,
  });
}
