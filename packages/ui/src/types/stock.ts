export interface StockApiResponse {
  Data: {
    TotalCount: number;
    Data: RawStockDataPoint[];
  };
  Message: string | null;
  Success: boolean;
}

export type TimeframeOption = "1W" | "1M" | "3M" | "6M" | "1Y" | "2Y" | "ALL";

export interface RawStockDataPoint {
  Ngay: string;
  GiaDongCua: number;
  ThayDoi: string;
  KhoiLuongKhopLenh: number;
  GiaTriKhopLenh: number;
  GiaDieuChinh: number;
  KLThoaThuan: number;
  GtThoaThuan: number;
  GiaMoCua: number;
  GiaCaoNhat: number;
  GiaThapNhat: number;
}

export interface TransformedStockData {
  date: string;
  dateObj: Date;
  adjustedPrice: number;
  closePrice: number;
  priceChange: {
    value: number;
    percentage: number;
  };
  volume: number;
  negotiatedVolume: number;
  negotiatedValue: number;
  openPrice: number;
  highestPrice: number;
  lowestPrice: number;
}

export interface ChartData extends TransformedStockData {
  sma?: number;
  ema?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  rsi?: number;
}

export interface ChartProps {
  data: ChartData[];
}
