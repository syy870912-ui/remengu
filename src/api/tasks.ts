import { get, post } from "./client";

export interface TaskLogItem {
  id: number;
  startTime: string;
  endTime: string | null;
  status: string;
  articleCount: number;
  errorCount: number;
  duration: string | null;
}

export interface TaskListResponse {
  items: TaskLogItem[];
  total: number;
}

export interface TriggerResponse {
  success: boolean;
  message: string;
  taskId: number;
}

export async function getTasks(page = 1, pageSize = 20): Promise<TaskListResponse> {
  return get<TaskListResponse>(`/tasks?page=${page}&page_size=${pageSize}`);
}

export async function triggerTask(): Promise<TriggerResponse> {
  return post<TriggerResponse>("/tasks/trigger");
}
