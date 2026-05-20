// Auth API - login, getMe, changePassword

interface BaseResponse {
  message?: string;
  detail?: string;
}

const TOKEN_KEY = "stock-analysis-token";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  username: string;
}

export async function loginApi(
  data: LoginRequest
): Promise<LoginResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "登录失败");
  }
  return res.json();
}

export async function getMeApi(): Promise<{
  username: string;
  is_active: boolean;
  last_login: string | null;
}> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("获取用户信息失败");
  return res.json();
}

export async function changePasswordApi(data: {
  old_password: string;
  new_password: string;
}): Promise<BaseResponse> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE || ""}/api/auth/change-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "修改密码失败");
  }
  return res.json();
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}
