import type { RawStockData, StockData, TimeframeOption } from "@/types/stock";

export const transformStockData = (rawData: RawStockData): StockData => ({
  date: rawData.Ngay,
  adjustedPrice: rawData.GiaDieuChinh,
  closePrice: rawData.GiaDongCua,
  change: rawData.ThayDoi,
  volume: rawData.KhoiLuongKhopLenh,
  value: rawData.GiaTriKhopLenh,
  matchedVolume: rawData.KLThoaThuan,
  matchedValue: rawData.GtThoaThuan,
  openPrice: rawData.GiaMoCua,
  highPrice: rawData.GiaCaoNhat,
  lowPrice: rawData.GiaThapNhat,
});

export const filterDataByTimeframe = (data: StockData[], timeframe: TimeframeOption): StockData[] => {
  // const now = new Date();
  // const timeframes = {
  //   "1W": 7,
  //   "1M": 30,
  //   "3M": 90,
  //   "6M": 180,
  // };
  //
  // const cutoffDate = new Date(now.getTime() - timeframes[timeframe] * 24 * 60 * 60 * 1000);
  // return data.filter((item) => {
  //   return new Date(item.date.split("/").reverse().join("-")) >= cutoffDate;
  // });
  return data;
};

export const COLUMN_LABELS = {
  date: "Date",
  closePrice: "Close Price",
  change: "Change",
  volume: "Volume",
  openPrice: "Open Price",
  highPrice: "High",
  lowPrice: "Low",
};