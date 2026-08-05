import { supabase } from '../supabase/client';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

export interface ApiErrorShape {
  message: string;
  error_code?: string | null;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode?: string | null;
  readonly validation?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    errorCode?: string | null,
    validation?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.validation = validation;
  }

  /** First validation message, if any — handy for inline form errors. */
  firstError(): string | undefined {
    if (!this.validation) return undefined;
    const first = Object.values(this.validation)[0];
    return first?.[0];
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(await authHeader()),
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!res.ok) {
    const err = (payload ?? {}) as ApiErrorShape;
    throw new ApiError(res.status, err.message ?? 'Request failed', err.error_code, err.errors);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

/** Laravel API resources wrap single/collection payloads in `{ data: ... }`. */
export interface Wrapped<T> {
  data: T;
}
