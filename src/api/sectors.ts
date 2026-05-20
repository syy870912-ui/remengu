import { get } from "./client";

export interface SectorStatsItem {
  sector: string;
  count: number;
  avgChange: number;
}

export interface DashboardStats {
  totalStocks: number;
  totalArticles: number;
  todayArticles: number;
  risingCount: number;
  fallingCount: number;
  limitUpCount: number;
  limitDownCount: number;
  sectorCount: number;
  lastUpdateTime: string | null;
  taskSuccessRate: string | null;
  ratingDistribution: {
    buy: number;
    hold: number;
    sell: number;
  };
}

export async function getSectors(): Promise<SectorStatsItem[]> {
  return get<SectorStatsItem[]>("/sectors");
}

export async function getStats(): Promise<DashboardStats> {
  return get<DashboardStats>("/stats");
}
