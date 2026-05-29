const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL?.replace(/\/+$/, '') || '';

export const apiUrl = (path: string) => `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
