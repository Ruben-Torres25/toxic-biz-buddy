// src/lib/api.ts (o donde lo tengas)

export class ApiError extends Error {
  status?: number;
  data?: any;
  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class Api {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // ✅ OK
    if (response.ok) {
      // 204 / sin cuerpo
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const raw = await response.text();
      if (!raw) {
        return undefined as unknown as T;
      }

      // intenta parsear JSON; si no, devolvé texto
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    }

    // ❌ ERROR
    const status = response.status;

    // intentamos leer texto y luego JSON
    let message = `Error ${status}: ${response.statusText}`;
    let body: any = null;
    try {
      const raw = await response.text();
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }
    } catch {
      // noop
    }

    // Nest suele mandar: { statusCode, message, error }
    const msgFromBody =
      (body && (body.message || body.error || body.detail)) ||
      (typeof body === 'string' ? body : null);

    throw new ApiError(msgFromBody || message, status, body);
  }

  private buildUrl(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        // soporta arrays ?a=1&a=2
        if (Array.isArray(v)) {
          v.forEach((vv) => url.searchParams.append(k, String(vv)));
        } else {
          url.searchParams.append(k, String(v));
        }
      });
    }
    return url.toString();
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await fetch(this.buildUrl(endpoint, params), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de conexión con el servidor',
        0
      );
    }
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de conexión con el servidor',
        0
      );
    }
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de conexión con el servidor',
        0
      );
    }
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de conexión con el servidor',
        0
      );
    }
  }
}

export const api = new Api();
