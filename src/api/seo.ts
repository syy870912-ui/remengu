import { get, put } from "./client";

export interface SEOSettingItem {
  id: number;
  page_type: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  updated_at: string;
}

export interface SEOUpdateData {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

/** 获取所有 SEO 设置 */
export async function getSEOSettings(): Promise<SEOSettingItem[]> {
  return get<SEOSettingItem[]>("/admin/seo");
}

/** 更新某页面 SEO 设置 */
export async function updateSEOSetting(
  pageType: string,
  data: SEOUpdateData
): Promise<{ success: boolean; message: string }> {
  return put(`/admin/seo/${pageType}`, data);
}

/** 前台获取当前路径 meta（暂未用） */
export async function getMeta(path: string): Promise<Record<string, string>> {
  return get<Record<string, string>>(`/seo/meta?path=${encodeURIComponent(path)}`);
}
