import { get, put, post } from "./client";

export interface SettingItem {
  key: string;
  value: string;
  value_type: string;
  description: string;
}

export interface SettingsBatch {
  [key: string]: string;
}

/** 获取所有设置 */
export async function getSettings(): Promise<SettingItem[]> {
  return get<SettingItem[]>("/admin/settings");
}

/** 更新单个设置 */
export async function updateSetting(key: string, value: string, valueType?: string): Promise<{ success: boolean; message: string }> {
  return put(`/admin/settings/${key}`, {
    value,
    ...(valueType ? { value_type: valueType } : {}),
  });
}

/** 批量更新设置 */
export async function batchUpdateSettings(settings: Record<string, string>): Promise<{ success: boolean; message: string }> {
  return post("/admin/settings/batch", { settings });
}
