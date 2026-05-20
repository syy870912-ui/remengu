/**
 * API Client - Base fetch wrapper with error handling
 * Automatically injects JWT token for authenticated requests.
 */

import { getToken } from "./auth";

const BASE_URL = "/api";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    // Auto-logout on 401
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      if (data.detail === "Token expired" || data.detail === "Invalid token") {
        if (typeof window !== "undefined") {
          import("./auth").then((m) => m.removeToken());
          window.location.href = "/login";
        }
      }
    }
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint);
}

export async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function del<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: "DELETE" });
}

export async function put<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}
