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
  sma20?: number;
  ema20?: number;
  macd?: number;
  signal?: number;
  rsi?: number;
}

export type TimeframeOption = '1W' | '1M' | '3M' | '6M';


export interface ChartProps {
  data: ChartData[];
  timeframe: TimeframeOption;
}