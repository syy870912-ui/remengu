import { get, put } from "./client";

export interface TemplateItem {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_enabled: boolean;
  sort_order: number;
}

/** 获取模板列表 */
export async function getTemplates(): Promise<TemplateItem[]> {
  return get<TemplateItem[]>("/admin/templates");
}

/** 切换启用/禁用 */
export async function toggleTemplate(id: number): Promise<{ success: boolean; message: string; is_enabled: boolean }> {
  return put(`/admin/templates/${id}/toggle`);
}

/** 调整排序（传入 ID 列表） */
export async function reorderTemplates(order: number[]): Promise<{ success: boolean; message: string }> {
  return put("/admin/templates/reorder", order);
}
