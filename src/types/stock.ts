export interface RawStockData {
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

export interface StockData {
  date: string;
  adjustedPrice: number;
  closePrice: number;
  change: string;
  volume: number;
  value: number;
  matchedVolume: number;
  matchedValue: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  timestamp: number;
}

export interface ChartData extends StockData {
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

export interface IndicatorOptions {
  showVolume: boolean;
  showOpenPrice: boolean;
  showHighLow: boolean;
}