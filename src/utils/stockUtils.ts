import type { RawStockDataPoint, TimeframeOption, TransformedStockData } from "@/types/stock";

// Helper type for price change parsing
export interface ParsedPriceChange {
  value: number;
  percentage: number;
}

export const parsePriceChange = (change: string): ParsedPriceChange => {
  const matches = change.match(/(-?\d+\.?\d*)\((-?\d+\.?\d*) %\)/);
  if (!matches) {
    return { value: 0, percentage: 0 };
  }
  return {
    value: parseFloat(matches[1]),
    percentage: parseFloat(matches[2]),
  };
};

export const transformStockData = (data: RawStockDataPoint): TransformedStockData => {
  const priceChange = parsePriceChange(data.ThayDoi);
  const [day, month, year] = data.Ngay.split("/");
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  return {
    date: data.Ngay,
    dateObj,
    adjustedPrice: data.GiaDieuChinh,
    closePrice: data.GiaDongCua,
    priceChange,
    volume: data.KhoiLuongKhopLenh,
    negotiatedVolume: data.KLThoaThuan,
    negotiatedValue: data.GtThoaThuan,
    openPrice: data.GiaMoCua,
    highestPrice: data.GiaCaoNhat,
    lowestPrice: data.GiaThapNhat,
  };
};

export const filterDataByTimeframe = (
  data: TransformedStockData[],
  timeframe: TimeframeOption,
): TransformedStockData[] => {
  const now = new Date();
  const timeframes: Record<TimeframeOption, number> = {
    "1W": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
  };

  const cutoffDate = new Date(now.getTime() - timeframes[timeframe] * 24 * 60 * 60 * 1000);
  return data.filter((item) => item.dateObj >= cutoffDate);
};

export const COLUMN_LABELS = {
  date: "Date",
  closePrice: "Close Price",
  change: "Change",
  volume: "Volume",
  openPrice: "Open Price",
  highestPrice: "High",
  lowestPrice: "Low",
};
