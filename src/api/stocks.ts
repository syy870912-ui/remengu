import { get, post, put, del } from "./client";

export interface StockItem {
  rank: number;
  code: string;
  name: string;
  sector: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: string | null;
  hasArticle: boolean;
  market?: string | null;
}

export interface StockListResponse {
  items: StockItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StockDetailResponse extends StockItem {
  latestArticle: {
    id: number;
    stockCode: string;
    stockName: string;
    title: string;
    rating: string;
  } | null;
}

interface StockQueryParams {
  sector?: string;
  change_type?: string;
  search?: string;
  page?: number;
  page_size?: number;
  date?: string;
}

export async function getStocks(params: StockQueryParams = {}): Promise<StockListResponse> {
  const qs = new URLSearchParams();
  if (params.sector) qs.set("sector", params.sector);
  if (params.change_type) qs.set("change_type", params.change_type);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.date) qs.set("date", params.date);
  const query = qs.toString();
  return get<StockListResponse>(`/stocks${query ? `?${query}` : ""}`);
}

export async function getStock(code: string): Promise<StockDetailResponse> {
  return get<StockDetailResponse>(`/stocks/${code}`);
}

export interface StockCreateData {
  code: string;
  name: string;
  market?: string;
  sector?: string;
  price?: number | null;
  change?: number | null;
  change_percent?: number | null;
  volume?: number | null;
  amount?: number | null;
}

export interface StockUpdateData {
  name?: string;
  market?: string;
  sector?: string;
  price?: number | null;
  change?: number | null;
  change_percent?: number | null;
  volume?: number | null;
  amount?: number | null;
  rank?: number;
  hidden?: boolean;
}

// ... existing code...

export async function createStock(data: StockCreateData): Promise<{ success: boolean; message: string; id: number }> {
  return post(`/admin/stocks`, data);
}

export async function updateStock(code: string, data: StockUpdateData): Promise<{ success: boolean; message: string }> {
  return put(`/admin/stocks/${code}`, data);
}

export async function deleteStock(code: string): Promise<{ success: boolean; message: string }> {
  return del(`/admin/stocks/${code}`);
}

export interface AdminStockQueryParams {
  sector?: string;
  change_type?: string;
  search?: string;
  page?: number;
  page_size?: number;
  date?: string;
  include_hidden?: boolean;
}

export async function getAdminStocks(params: AdminStockQueryParams = {}): Promise<StockListResponse> {
  const qs = new URLSearchParams();
  if (params.sector) qs.set("sector", params.sector);
  if (params.change_type) qs.set("change_type", params.change_type);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.date) qs.set("date", params.date);
  if (params.include_hidden) qs.set("include_hidden", "true");
  const query = qs.toString();
  return get<StockListResponse>(`/stocks${query ? `?${query}` : ""}`);
}
