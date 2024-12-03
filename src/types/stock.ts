export interface StockApiResponse {
  Data: {
    TotalCount: number;
    Data: RawStockDataPoint[];
  };
  Message: string | null;
  Success: boolean;
}

export interface RawStockDataPoint {
  Ngay: string;
  GiaDieuChinh: number;
  GiaDongCua: number;
  ThayDoi: string;
  KhoiLuongKhopLenh: number;
  GiaTriKhopLenh: number;
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

export type TimeframeOption = '1W' | '1M' | '3M' | '6M';

export interface ChartProps {
  data: ChartData[];
  timeframe?: TimeframeOption;
  selectedTab: string;
  indicators: {
    sma: boolean;
    ema: boolean;
    macd: boolean;
    rsi: boolean;
    volume: boolean;
  };
}