export type TimeframeOption = "1W" | "1M" | "3M" | "6M" | "1Y" | "2Y" | "ALL";
export type ResolutionOption = "1D" | "60" | "30" | "15" | "5" | "1";
export type DataSource = "VNDIRECT" | "SSI" | "VNGOLD";

export interface DataRow extends TransformedStockData {
  symbol?: string;
  actions?: string;
  sma?: number;
  ema?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  rsi?: number;
}

export type ColumnKey = keyof DataRow;

export interface Column {
  key: ColumnKey;
  label: string;
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
  pivotPoint?: number;
}

export interface DataSourceOption {
  name: DataSource;
  displayName: string;
  enabled: boolean;
  priority: number;
}
