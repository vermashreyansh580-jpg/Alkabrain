const ENV_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const API_HOST = ENV_BASE && ENV_BASE.length > 0 ? ENV_BASE.replace(/\/+$/, "") : "";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (API_HOST) return `${API_HOST}${p}`;
  return `${import.meta.env.BASE_URL}${p.replace(/^\//, "")}`;
}
