import { get, post, put, del } from "./client";

export interface AdItem {
  id: number;
  name: string;
  slot_position: string;
  ad_type: string;
  html_code: string;
  image_url: string;
  link_url: string;
  alt_text: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdListResponse {
  items: AdItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdFormData {
  name: string;
  slot_position: string;
  ad_type: string;
  html_code?: string;
  image_url?: string;
  link_url?: string;
  alt_text?: string;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

/** 前台获取活跃广告（按位置过滤） */
export async function getAds(slotPosition?: string): Promise<Record<string, unknown>[]> {
  const qs = slotPosition ? `?slot_position=${slotPosition}` : "";
  return get<Record<string, unknown>[]>(`/ads${qs}`);
}

/** 后台列表 */
export async function getAdminAds(
  params: { slot_position?: string; page?: number; page_size?: number } = {}
): Promise<AdListResponse> {
  const qs = new URLSearchParams();
  if (params.slot_position) qs.set("slot_position", params.slot_position);
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const q = qs.toString();
  return get<AdListResponse>(`/admin/ads${q ? `?${q}` : ""}`);
}

/** 新建广告 */
export async function createAd(data: AdFormData): Promise<{ success: boolean; message: string; id: number }> {
  return post(`/admin/ads`, data);
}

/** 编辑广告 */
export async function updateAd(id: number, data: Partial<AdFormData>): Promise<{ success: boolean; message: string }> {
  return put(`/admin/ads/${id}`, data);
}

/** 软删除广告 */
export async function deleteAd(id: number): Promise<{ success: boolean; message: string }> {
  return del(`/admin/ads/${id}`);
}

/** 切换启用/停用 */
export async function toggleAd(id: number): Promise<{ success: boolean; message: string; is_active: boolean }> {
  return post(`/admin/ads/${id}/toggle`);
}
