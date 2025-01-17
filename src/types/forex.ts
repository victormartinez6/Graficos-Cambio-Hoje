export interface ForexRate {
  currency: string;
  rate: number;
  change24h: number;
  changeToday: number;
  timestamp: number;
  createDate: string;
}

export interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
}

export interface SpreadConfig {
  currency: string;
  spread: number;
  updatedAt: Date;
  updatedBy: string;
}