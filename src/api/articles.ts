import { get, post, del } from "./client";

export interface ArticleItem {
  id: number;
  stockCode: string;
  stockName: string;
  sector: string | null;
  title: string;
  createdAt: string;
  summary: string | null;
  rating: string;
}

export interface ArticleListResponse {
  items: ArticleItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  dates: string[];
}

export interface ArticleDetailResponse {
  id: number;
  stockCode: string;
  stockName: string;
  sector: string | null;
  title: string;
  createdAt: string;
  summary: string | null;
  rating: string;
  stock: {
    code: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: string;
  } | null;
  content: Record<string, unknown> | null;
  relatedArticles: ArticleItem[];
}

interface ArticleQueryParams {
  search?: string;
  sector?: string;
  date?: string;
  rating?: string;
  page?: number;
  page_size?: number;
}

export async function getArticles(params: ArticleQueryParams = {}): Promise<ArticleListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.sector) qs.set("sector", params.sector);
  if (params.date) qs.set("date", params.date);
  if (params.rating) qs.set("rating", params.rating);
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const query = qs.toString();
  return get<ArticleListResponse>(`/articles${query ? `?${query}` : ""}`);
}

export async function getArticle(stockCode: string): Promise<ArticleDetailResponse> {
  return get<ArticleDetailResponse>(`/articles/${stockCode}`);
}

export async function deleteArticle(articleId: number): Promise<{ success: boolean; message: string }> {
  return del(`/articles/${articleId}`);
}

export async function regenerateArticle(stockCode: string): Promise<{ success: boolean; message: string }> {
  return post(`/articles/${stockCode}/regenerate`);
}
