import { TimeframeOption, TransformedStockData } from "@repo/ui/types/stock";

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
    "1Y": 365,
    "2Y": 730,
    ALL: Infinity,
  };

  const cutoffDate =
    timeframe === "ALL"
      ? new Date(0) // Beginning of time for "ALL"
      : new Date(now.getTime() - timeframes[timeframe] * 24 * 60 * 60 * 1000);

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
