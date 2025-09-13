import { ResolutionOption } from "@repo/ui/types/stock.js";

export type DataSource = "VNDIRECT" | "SSI";

export interface StockDataSourceConfig {
  name: DataSource;
  displayName: string;
  baseUrl: string;
  enabled: boolean;
  priority: number;
  rateLimit?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface IStockDataSource {
  getName(): DataSource;
  isEnabled(): boolean;
  getRateLimit(): { requestsPerMinute: number; burstLimit: number };

  // Core data fetching methods
  fetchHistoricalData(params: HistoricalDataParams): Promise<StandardStockData[]>;
  fetchCurrentData(symbol: string, resolution: ResolutionOption): Promise<StandardStockData>;
  fetchMultipleCurrentData(symbols: string[], resolution: ResolutionOption): Promise<StandardStockData[]>;

  // Optional real-time support
  fetchRealtimeData?(symbol: string): Promise<StandardStockData>;

  // Health and status
  healthCheck(): Promise<boolean>;
  getLastError(): Error | null;
}

export interface HistoricalDataParams {
  symbol: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string;
  resolution: ResolutionOption;
  page?: number;
}

export interface StandardStockData {
  // Core identification
  symbol: string;
  date: string; // DD/MM/YYYY format for UI compatibility
  dateObj: Date;

  // Price data
  openPrice: number;
  closePrice: number;
  highestPrice: number;
  lowestPrice: number;
  adjustedPrice: number;

  // Volume data
  volume: number;
  negotiatedVolume?: number;
  negotiatedValue?: number;

  // Calculated fields
  priceChange: {
    value: number;
    percentage: number;
  };

  // Metadata
  source: DataSource;
  fetchedAt: Date;
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

interface VNDHistoricalResponse {
  t: number[]; // timestamps
  c: number[]; // closing prices
  o: number[]; // opening prices
  h: number[]; // high prices
  l: number[]; // low prices
  v: number[]; // volume
  s: string; // status ("ok" or error)
}

export class VNDDataSource implements IStockDataSource {
  private baseUrl = "https://dchart-api.vndirect.com.vn/dchart";
  private config: StockDataSourceConfig;
  private rateLimiter: RateLimiter;
  private lastError: Error | null = null;

  constructor(config: StockDataSourceConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(
      config.rateLimit?.requestsPerMinute || 60,
      60 * 1000, // 1 minute
    );
  }

  getName(): DataSource {
    return "VNDIRECT";
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getRateLimit() {
    return this.config.rateLimit || { requestsPerMinute: 60, burstLimit: 10 };
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple historical data request for VND symbol
      const testEndDate = new Date();
      const testStartDate = new Date(testEndDate);

      testStartDate.setDate(testStartDate.getDate() - 7); // Last 7 days

      const endTimestamp = Math.floor(testEndDate.getTime() / 1000);
      const startTimestamp = Math.floor(testStartDate.getTime() / 1000);

      const response = await fetch(
        `${this.baseUrl}/history?resolution=1D&symbol=VND&from=${startTimestamp}&to=${endTimestamp}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        },
      );

      if (response.ok) {
        const data: VNDHistoricalResponse = await response.json();

        if (data.s === "ok") {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.lastError = error as Error;

      return false;
    }
  }

  async fetchHistoricalData(params: HistoricalDataParams): Promise<StandardStockData[]> {
    await this.rateLimiter.waitIfNeeded();

    try {
      // Convert date strings to timestamps for VND Direct API
      const startTimestamp = Math.floor(new Date(params.startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(params.endDate).getTime() / 1000);

      // VND Direct API endpoint and parameters
      const url = `${this.baseUrl}/history`;
      const queryParams = new URLSearchParams({
        resolution: params.resolution, // Daily resolution
        symbol: params.symbol, // Stock symbol
        from: startTimestamp.toString(),
        to: endTimestamp.toString(),
      });

      const response = await fetch(`${url}?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`VND Direct API error: ${response.status} - ${response.statusText}`);
      }

      const data: VNDHistoricalResponse = await response.json();

      // Check if VND Direct API returned success status
      if (data.s !== "ok") {
        throw new Error(`VND Direct API returned status: ${data.s}`);
      }

      return this.transformHistoricalData(data, params.symbol);
    } catch (error) {
      this.lastError = error as Error;
      throw error;
    }
  }

  async fetchCurrentData(symbol: string, resolution: ResolutionOption): Promise<StandardStockData> {
    await this.rateLimiter.waitIfNeeded();

    try {
      // For current data, fetch the most recent historical data (last 2 days)
      const endDate = new Date();
      const startDate = new Date(endDate);

      startDate.setDate(startDate.getDate() - 2); // Last 2 days to ensure we get latest data

      const historicalData = await this.fetchHistoricalData({
        symbol,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        resolution: resolution,
      });

      if (historicalData.length === 0) {
        throw new Error(`No current data available for ${symbol}`);
      }

      // Return the most recent data point (last in array)
      const latestData = historicalData[historicalData.length - 1];

      return latestData!;
    } catch (error) {
      this.lastError = error as Error;
      throw error;
    }
  }

  async fetchMultipleCurrentData(symbols: string[], resolution: ResolutionOption): Promise<StandardStockData[]> {
    const promises = symbols.map(async (symbol) => {
      try {
        return await this.fetchCurrentData(symbol, resolution);
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(promises);
    const successfulResults = results.filter((result): result is StandardStockData => result !== null);

    return successfulResults;
  }

  // REFACTORED: Complete rewrite to handle VND Direct array format and ensure OHLC data
  private transformHistoricalData(data: VNDHistoricalResponse, symbol: string): StandardStockData[] {
    const result: StandardStockData[] = [];

    // Validate that all arrays have the same length
    const length = data.t.length;

    if (!data.o || !data.h || !data.l || !data.c || !data.v) {
      throw new Error("Missing OHLC data in VND Direct response");
    }

    // Transform each data point to StandardStockData with full OHLC support
    for (let i = 0; i < length; i++) {
      const timestamp = data.t[i]! * 1000; // Convert to milliseconds
      const dateObj = new Date(timestamp);

      // Extract OHLC values
      const openPrice = data.o[i] || 0;
      const highPrice = data.h[i] || 0;
      const lowPrice = data.l[i] || 0;
      const closePrice = data.c[i] || 0;
      const volume = data.v[i] || 0;

      // Calculate price change from previous day (if available)
      const previousPrice = i > 0 ? data.c[i - 1]! : closePrice;
      const priceChange = closePrice - previousPrice;
      const priceChangePercentage = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

      // Create StandardStockData with full OHLC candlestick data
      const dataPoint: StandardStockData = {
        symbol,
        date: this.formatDateForUI(dateObj),
        dateObj,
        // CANDLESTICK OHLC DATA - Essential for candlestick charts
        openPrice, // Opening price
        closePrice, // Closing price
        highestPrice: highPrice, // Highest price (high)
        lowestPrice: lowPrice, // Lowest price (low)
        adjustedPrice: closePrice, // VND doesn't provide adjusted close, use close price
        volume, // Trading volume
        negotiatedVolume: 0, // VND doesn't provide this field
        negotiatedValue: 0, // VND doesn't provide this field
        priceChange: {
          value: priceChange,
          percentage: priceChangePercentage,
        },
        source: "TCBS" as DataSource, // Keep the source name as TCBS for compatibility
        fetchedAt: new Date(),
      };

      result.push(dataPoint);

      // Log first few data points for debugging
      if (i < 3) {
        console.log(
          `📈 ${i + 1}. ${dataPoint.date}: O=${openPrice}, H=${highPrice}, L=${lowPrice}, C=${closePrice}, V=${volume.toLocaleString()}`,
        );
      }
    }

    // Sort by date to ensure chronological order for proper candlestick display
    const sortedResult = result.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    return sortedResult;
  }

  // Helper method to format dates for API calls
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0]!; // YYYY-MM-DD format
  }

  private formatDateForUI(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }
}

export class SSIDataSource implements IStockDataSource {
  private baseUrl = "https://iboard-api.ssi.com.vn";
  private config: StockDataSourceConfig;
  private rateLimiter: RateLimiter;
  private lastError: Error | null = null;

  constructor(config: StockDataSourceConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit?.requestsPerMinute || 40, 60 * 1000);
  }

  getName(): DataSource {
    return "SSI";
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getRateLimit() {
    return this.config.rateLimit || { requestsPerMinute: 40, burstLimit: 8 };
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // SSI health check endpoint
      const response = await fetch(`${this.baseUrl}/statistics/financial/health`, {
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      this.lastError = error as Error;

      return false;
    }
  }

  async fetchHistoricalData(params: HistoricalDataParams): Promise<StandardStockData[]> {
    // TODO: Implement SSI historical data fetching
    throw new Error("SSI historical data not implemented yet");
  }

  async fetchCurrentData(symbol: string): Promise<StandardStockData> {
    // TODO: Implement SSI current data fetching
    throw new Error("SSI current data not implemented yet");
  }

  async fetchMultipleCurrentData(symbols: string[]): Promise<StandardStockData[]> {
    // TODO: Implement SSI batch data fetching
    throw new Error("SSI batch data not implemented yet");
  }
}

export class StockDataSourceManager {
  private sources = new Map<DataSource, IStockDataSource>();
  private config = new Map<DataSource, StockDataSourceConfig>();
  private defaultSource: DataSource = "VNDIRECT";
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor() {
    this.initializeConfigurations();
    this.initializeSources();
  }

  private initializeConfigurations() {
    const configs: StockDataSourceConfig[] = [
      {
        name: "VNDIRECT",
        displayName: "VND Direct",
        baseUrl: "https://dchart-api.vndirect.com.vn/dchart",
        enabled: true, // Enable VND Direct
        priority: 1,
        rateLimit: { requestsPerMinute: 60, burstLimit: 10 },
      },
      {
        name: "SSI",
        displayName: "SSI Securities",
        baseUrl: "https://iboard-api.ssi.com.vn",
        enabled: false, // Enable when implemented
        priority: 2,
        rateLimit: { requestsPerMinute: 40, burstLimit: 8 },
      },
    ];

    configs.forEach((config) => {
      this.config.set(config.name, config);
    });
  }

  private initializeSources() {
    // Initialize VND Direct source (new)
    const vndConfig = this.config.get("VNDIRECT")!;

    this.sources.set("VNDIRECT", new VNDDataSource(vndConfig));

    // Initialize SSI source (ready for when implemented)
    const ssiConfig = this.config.get("SSI")!;

    this.sources.set("SSI", new SSIDataSource(ssiConfig));
  }

  setDefaultSource(source: DataSource) {
    if (this.sources.has(source) && this.sources.get(source)!.isEnabled()) {
      this.defaultSource = source;
    } else {
      throw new Error(`Source ${source} is not available or enabled`);
    }
  }

  getDefaultSource(): DataSource {
    return this.defaultSource;
  }

  getAvailableSources(): Array<{ name: DataSource; displayName: string; enabled: boolean; priority: number }> {
    return Array.from(this.config.values())
      .filter((config) => config.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map((config) => ({
        name: config.name,
        displayName: config.displayName,
        enabled: config.enabled,
        priority: config.priority,
      }));
  }

  private getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.cache.delete(key);

    return null;
  }

  private setToCache<T>(key: string, data: T, ttlMs: number = 30000) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }

  async fetchHistoricalData(params: HistoricalDataParams, preferredSource?: DataSource): Promise<StandardStockData[]> {
    const cacheKey = this.getCacheKey("historical", params);
    const cached = this.getFromCache<StandardStockData[]>(cacheKey);

    if (cached) return cached;

    const source = preferredSource || this.defaultSource;
    const dataSource = this.sources.get(source);

    if (!dataSource || !dataSource.isEnabled()) {
      return this.fallbackFetchHistoricalData(params);
    }

    try {
      const data = await dataSource.fetchHistoricalData(params);

      this.setToCache(cacheKey, data, 60000); // Cache for 1 minute

      return data;
    } catch (error) {
      return this.fallbackFetchHistoricalData(params, source);
    }
  }

  async fetchCurrentData(
    symbol: string,
    resolution: ResolutionOption,
    preferredSource?: DataSource,
  ): Promise<StandardStockData> {
    const cacheKey = this.getCacheKey("current", { symbol });
    const cached = this.getFromCache<StandardStockData>(cacheKey);

    if (cached) return cached;

    const source = preferredSource || this.defaultSource;
    const dataSource = this.sources.get(source);

    if (!dataSource || !dataSource.isEnabled()) {
      return this.fallbackFetchCurrentData(symbol, resolution);
    }

    try {
      const data = await dataSource.fetchCurrentData(symbol, resolution);

      this.setToCache(cacheKey, data, 10000); // Cache for 10 seconds

      return data;
    } catch (_error) {
      return this.fallbackFetchCurrentData(symbol, resolution, source);
    }
  }

  async fetchMultipleCurrentData(
    symbols: string[],
    resolution: ResolutionOption,
    preferredSource?: DataSource,
  ): Promise<StandardStockData[]> {
    const source = preferredSource || this.defaultSource;
    const dataSource = this.sources.get(source);

    if (!dataSource || !dataSource.isEnabled()) {
      return this.fallbackFetchMultipleCurrentData(symbols, resolution);
    }

    try {
      return await dataSource.fetchMultipleCurrentData(symbols, resolution);
    } catch (error) {
      console.error(`Error fetching multiple from ${source}, trying fallback:`, error);

      return this.fallbackFetchMultipleCurrentData(symbols, resolution, source);
    }
  }

  private async fallbackFetchHistoricalData(
    params: HistoricalDataParams,
    excludeSource?: DataSource,
  ): Promise<StandardStockData[]> {
    const availableSources = Array.from(this.sources.entries())
      .filter(([name, source]) => name !== excludeSource && source.isEnabled())
      .sort((a, b) => (this.config.get(a[0])?.priority || 999) - (this.config.get(b[0])?.priority || 999));

    for (const [name, source] of availableSources) {
      try {
        return await source.fetchHistoricalData(params);
      } catch (error) {
        console.error(`Fallback source ${name} also failed:`, error);
      }
    }

    throw new Error(`All data sources failed to fetch historical data for ${params.symbol}`);
  }

  private async fallbackFetchCurrentData(
    symbol: string,
    resolution: ResolutionOption,
    excludeSource?: DataSource,
  ): Promise<StandardStockData> {
    const availableSources = Array.from(this.sources.entries())
      .filter(([name, source]) => name !== excludeSource && source.isEnabled())
      .sort((a, b) => (this.config.get(a[0])?.priority || 999) - (this.config.get(b[0])?.priority || 999));

    for (const [name, source] of availableSources) {
      try {
        return await source.fetchCurrentData(symbol, resolution);
      } catch (error) {
        console.error(`Fallback source ${name} also failed:`, error);
      }
    }

    throw new Error(`All data sources failed to fetch current data for ${symbol}`);
  }

  private async fallbackFetchMultipleCurrentData(
    symbols: string[],
    resolution: ResolutionOption,
    excludeSource?: DataSource,
  ): Promise<StandardStockData[]> {
    const availableSources = Array.from(this.sources.entries())
      .filter(([name, source]) => name !== excludeSource && source.isEnabled())
      .sort((a, b) => (this.config.get(a[0])?.priority || 999) - (this.config.get(b[0])?.priority || 999));

    for (const [name, source] of availableSources) {
      try {
        return await source.fetchMultipleCurrentData(symbols, resolution);
      } catch (error) {
        console.error(`Fallback source ${name} also failed:`, error);
      }
    }

    throw new Error(`All data sources failed to fetch multiple current data`);
  }

  async healthCheckAll(): Promise<Record<DataSource, boolean>> {
    const results: Record<DataSource, boolean> = {} as Record<DataSource, boolean>;

    const healthCheckPromises = Array.from(this.sources.entries()).map(async ([name, source]) => {
      if (source.isEnabled()) {
        try {
          results[name] = await source.healthCheck();
        } catch {
          results[name] = false;
        }
      } else {
        results[name] = false;
      }
    });

    await Promise.all(healthCheckPromises);

    return results;
  }

  getSourceErrors(): Record<DataSource, Error | null> {
    const errors: Record<DataSource, Error | null> = {} as Record<DataSource, Error | null>;

    for (const [name, source] of this.sources) {
      errors[name] = source.getLastError();
    }

    return errors;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const stockDataSourceManager = new StockDataSourceManager();

export const transformToLegacyFormat = (standardData: StandardStockData[]): any[] => {
  return standardData.map((item) => ({
    date: item.date,
    dateObj: item.dateObj,
    adjustedPrice: item.adjustedPrice,
    closePrice: item.closePrice,
    priceChange: item.priceChange,
    volume: item.volume,
    negotiatedVolume: item.negotiatedVolume || 0,
    negotiatedValue: item.negotiatedValue || 0,
    openPrice: item.openPrice,
    highestPrice: item.highestPrice,
    lowestPrice: item.lowestPrice,
  }));
};

export const transformSingleToLegacyFormat = (standardData: StandardStockData): any => {
  return {
    date: standardData.date,
    dateObj: standardData.dateObj,
    adjustedPrice: standardData.adjustedPrice,
    closePrice: standardData.closePrice,
    priceChange: standardData.priceChange,
    volume: standardData.volume,
    negotiatedVolume: standardData.negotiatedVolume || 0,
    negotiatedValue: standardData.negotiatedValue || 0,
    openPrice: standardData.openPrice,
    highestPrice: standardData.highestPrice,
    lowestPrice: standardData.lowestPrice,
  };
};
