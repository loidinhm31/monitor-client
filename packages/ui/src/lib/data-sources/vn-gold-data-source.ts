import {
  DataSource,
  HistoricalDataParams,
  IStockDataSource,
  StandardStockData,
  StockDataSourceConfig,
} from "@repo/ui/lib/data-sources/stock-data-source-manager";
import { ResolutionOption } from "@repo/ui/types/stock";

interface SJCGoldResponse {
  success: boolean;
  data: Array<{
    Id: number;
    TypeName: string;
    BranchName: string;
    Buy: string;
    BuyValue: number;
    Sell: string;
    SellValue: number;
    BuyDiffer: string | null;
    BuyDifferValue: number;
    SellDiffer: string | null;
    SellDifferValue: number;
    GroupDate: string; // "/Date(1753981200000)/"
  }>;
}

class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();

    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(now);
  }
}

export class VNGoldDataSource implements IStockDataSource {
  private baseUrl = "api/sjc";
  private config: StockDataSourceConfig;
  private rateLimiter: RateLimiter;
  private lastError: Error | null = null;
  private cache = new Map<string, { data: StandardStockData[]; timestamp: number; ttl: number }>();

  constructor(config: StockDataSourceConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(
      config.rateLimit?.requestsPerMinute || 30, // Conservative rate limit
      60 * 1000, // 1 minute
    );
  }

  getName(): DataSource {
    return "VNGOLD" as DataSource;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getRateLimit() {
    return this.config.rateLimit || { requestsPerMinute: 30, burstLimit: 5 };
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testEndDate = new Date();
      const testStartDate = new Date(testEndDate);

      testStartDate.setDate(testStartDate.getDate() - 7); // Last 7 days

      const response = await this.makeApiCall(testStartDate, testEndDate);

      return response.success && response.data.length > 0;
    } catch (error) {
      this.lastError = error as Error;

      return false;
    }
  }

  private async makeApiCall(startDate: Date, endDate: Date): Promise<SJCGoldResponse> {
    await this.rateLimiter.waitIfNeeded();

    const formData = new URLSearchParams();

    formData.append("method", "GetGoldPriceHistory");
    formData.append("fromDate", this.formatDateForSJC(startDate));
    formData.append("toDate", this.formatDateForSJC(endDate));
    formData.append("goldPriceId", "1"); // SJC Gold 1L, 10L, 1KG

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "vi",
        Connection: "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        Referer: "https://sjc.com.vn/bieu-do-gia-vang",
        Origin: "https://sjc.com.vn",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body: formData,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`SJC API request failed: ${response.status} ${response.statusText}`);
    }

    const data: SJCGoldResponse = await response.json();

    if (!data.success) {
      throw new Error("SJC API returned unsuccessful response");
    }

    return data;
  }

  private formatDateForSJC(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private parseSJCDate(dateString: string): Date {
    // Parse "/Date(1753981200000)/" format
    const match = dateString.match(/\/Date\((\d+)\)\//);

    if (match) {
      return new Date(parseInt(match[1]!));
    }
    throw new Error(`Invalid SJC date format: ${dateString}`);
  }

  private formatDateForUI(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private convertSJCDataToStandard(sjcData: SJCGoldResponse["data"]): StandardStockData[] {
    const result: StandardStockData[] = [];

    for (const item of sjcData) {
      try {
        const dateObj = this.parseSJCDate(item.GroupDate);

        // Convert from VND thousands to actual VND (multiply by 1000)
        const buyPrice = item.BuyValue / 1000; // Convert from 119900000 to 119900
        const sellPrice = item.SellValue / 1000;

        // Calculate average price for open/close (SJC only provides buy/sell)
        const avgPrice = (buyPrice + sellPrice) / 2;

        const dataPoint: StandardStockData = {
          symbol: "VNGOLD",
          date: this.formatDateForUI(dateObj),
          dateObj,
          openPrice: buyPrice, // Use average as open
          closePrice: buyPrice, // Use average as close
          highestPrice: sellPrice,
          lowestPrice: sellPrice,
          adjustedPrice: avgPrice,
          volume: 0, // Gold prices don't have volume data
          negotiatedVolume: 0,
          negotiatedValue: 0,
          priceChange: {
            value: 0, // Will be calculated later when we have previous data
            percentage: 0,
          },
          source: "VNGOLD" as DataSource,
          fetchedAt: new Date(),
        };

        result.push(dataPoint);
      } catch (error) {
        console.warn(`Failed to parse SJC data point:`, item, error);
      }
    }

    // Sort by date and calculate price changes
    result.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    for (let i = 1; i < result.length; i++) {
      const current = result[i]!;
      const previous = result[i - 1]!;

      current.priceChange.value = current.closePrice - previous.closePrice;
      current.priceChange.percentage =
        previous.closePrice !== 0 ? (current.priceChange.value / previous.closePrice) * 100 : 0;
    }

    return result;
  }

  private getCacheKey(params: HistoricalDataParams): string {
    return `vngold_${params.startDate}_${params.endDate}_${params.resolution}`;
  }

  private getFromCache(key: string): StandardStockData[] | null {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);

    return null;
  }

  private setToCache(key: string, data: StandardStockData[], ttlMs: number = 300000) {
    // 5 minutes
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }

  async fetchHistoricalData(params: HistoricalDataParams): Promise<StandardStockData[]> {
    // Only handle VNGOLD symbol
    if (params.symbol !== "VNGOLD") {
      throw new Error("VN Gold data source only supports VNGOLD symbol");
    }

    // Only support daily resolution
    if (params.resolution !== "1D") {
      throw new Error("VN Gold data source only supports 1D resolution");
    }

    const cacheKey = this.getCacheKey(params);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      // Calculate date difference
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let allData: StandardStockData[] = [];

      if (diffDays <= 90) {
        // Single API call for periods <= 90 days
        const response = await this.makeApiCall(startDate, endDate);

        allData = this.convertSJCDataToStandard(response.data);
      } else {
        // Multiple API calls for periods > 90 days
        const chunks: Array<{ start: Date; end: Date }> = [];
        let currentStart = new Date(startDate);

        while (currentStart < endDate) {
          const currentEnd = new Date(currentStart);

          currentEnd.setDate(currentEnd.getDate() + 89); // 90 days chunk

          if (currentEnd > endDate) {
            currentEnd.setTime(endDate.getTime());
          }

          chunks.push({ start: new Date(currentStart), end: new Date(currentEnd) });

          currentStart = new Date(currentEnd);
          currentStart.setDate(currentStart.getDate() + 1);
        }

        // Process chunks sequentially to respect rate limits
        for (const chunk of chunks) {
          const response = await this.makeApiCall(chunk.start, chunk.end);
          const chunkData = this.convertSJCDataToStandard(response.data);

          allData.push(...chunkData);

          // Add delay between chunks to be respectful to the API
          if (chunks.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
          }
        }

        // Remove duplicates and sort
        const uniqueData = new Map<string, StandardStockData>();

        allData.forEach((item) => {
          uniqueData.set(item.date, item);
        });

        allData = Array.from(uniqueData.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        // Recalculate price changes for the merged data
        for (let i = 1; i < allData.length; i++) {
          const current = allData[i]!;
          const previous = allData[i - 1]!;

          current.priceChange.value = current.closePrice - previous.closePrice;
          current.priceChange.percentage =
            previous.closePrice !== 0 ? (current.priceChange.value / previous.closePrice) * 100 : 0;
        }
      }

      this.setToCache(cacheKey, allData);

      return allData;
    } catch (error) {
      this.lastError = error as Error;
      throw error;
    }
  }

  async fetchCurrentData(symbol: string, resolution: ResolutionOption): Promise<StandardStockData> {
    if (symbol !== "VNGOLD") {
      throw new Error("VN Gold data source only supports VNGOLD symbol");
    }

    if (resolution !== "1D") {
      throw new Error("VN Gold data source only supports 1D resolution");
    }

    try {
      // Get last 7 days to ensure we have recent data
      const endDate = new Date();
      const startDate = new Date(endDate);

      startDate.setDate(startDate.getDate() - 7);

      const response = await this.makeApiCall(startDate, endDate);
      const data = this.convertSJCDataToStandard(response.data);

      if (data.length === 0) {
        throw new Error("No current gold price data available");
      }

      // Return the most recent data point
      return data[data.length - 1]!;
    } catch (error) {
      this.lastError = error as Error;
      throw error;
    }
  }

  async fetchMultipleCurrentData(symbols: string[], resolution: ResolutionOption): Promise<StandardStockData[]> {
    // Only support VNGOLD
    const vnGoldSymbols = symbols.filter((symbol) => symbol === "VNGOLD");

    if (vnGoldSymbols.length === 0) {
      return [];
    }

    if (vnGoldSymbols.length === 1) {
      const currentData = await this.fetchCurrentData("VNGOLD", resolution);

      return [currentData];
    }

    // Multiple VNGOLD requests would return the same data
    const currentData = await this.fetchCurrentData("VNGOLD", resolution);

    return vnGoldSymbols.map(() => ({ ...currentData }));
  }
}

// Hook for Vietnamese Gold data with caching
export const useVNGoldData = () => {
  const goldConfig: StockDataSourceConfig = {
    name: "VNGOLD" as DataSource,
    displayName: "Vietnamese Gold (SJC)",
    baseUrl: "https://sjc.com.vn/GoldPrice/Services/PriceService.ashx",
    enabled: true,
    priority: 3,
    rateLimit: { requestsPerMinute: 30, burstLimit: 5 },
  };

  const goldDataSource = new VNGoldDataSource(goldConfig);

  const fetchGoldData = async (params: HistoricalDataParams) => {
    return await goldDataSource.fetchHistoricalData(params);
  };

  const fetchCurrentGoldPrice = async () => {
    return await goldDataSource.fetchCurrentData("VNGOLD", "1D");
  };

  const isGoldSymbol = (symbol: string): boolean => {
    return symbol === "VNGOLD";
  };

  const isGoldResolutionSupported = (resolution: ResolutionOption): boolean => {
    return resolution === "1D";
  };

  return {
    goldDataSource,
    fetchGoldData,
    fetchCurrentGoldPrice,
    isGoldSymbol,
    isGoldResolutionSupported,
  };
};
