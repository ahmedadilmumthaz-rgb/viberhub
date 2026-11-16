const API_BASE = '/api/v1';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; meta?: any }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vh_token') : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('vh_workspace_id') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (workspaceId) {
    headers['x-workspace-id'] = workspaceId;
  }

  // If body is FormData (file upload), remove Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const text = await response.text();
    return { data: text as unknown as T };
  }

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    json = {};
  }

  if (!response.ok) {
    const err = json.error || {};
    throw new ApiError(
      err.message || response.statusText || 'Request failed',
      err.code || 'UNKNOWN_ERROR',
      response.status,
      err.details
    );
  }

  return json;
}
