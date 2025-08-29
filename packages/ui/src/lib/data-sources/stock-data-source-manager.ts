export type DataSource = "TCBS" | "VIETCAP" | "SSI";

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

// Standard interface all sources must implement
export interface IStockDataSource {
  getName(): DataSource;
  isEnabled(): boolean;
  getRateLimit(): { requestsPerMinute: number; burstLimit: number };

  // Core data fetching methods
  fetchHistoricalData(params: HistoricalDataParams): Promise<StandardStockData[]>;
  fetchCurrentData(symbol: string): Promise<StandardStockData>;
  fetchMultipleCurrentData(symbols: string[]): Promise<StandardStockData[]>;

  // Optional real-time support
  fetchRealtimeData?(symbol: string): Promise<StandardStockData>;

  // Health and status
  healthCheck(): Promise<boolean>;
  getLastError(): Error | null;
}

// Standardized parameters for API calls
export interface HistoricalDataParams {
  symbol: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string;
  limit?: number; // Max records to fetch
  page?: number;
}

// Standardized data format that replaces TransformedStockData
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

// Rate limiting helper
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

export class TCBSDataSource implements IStockDataSource {
  private baseUrl = "/api/tcbs"; // Use proxy endpoint instead of direct API
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
    return "TCBS";
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
      const response = await fetch(`${this.baseUrl}/tcanalysis/v1/ticker/TCB/overview`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        console.log("✅ TCBS health check passed");
        return true;
      } else {
        console.warn(`⚠️ TCBS health check failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      this.lastError = error as Error;
      console.error("❌ TCBS health check error:", error);
      return false;
    }
  }

  async fetchHistoricalData(params: HistoricalDataParams): Promise<StandardStockData[]> {
    await this.rateLimiter.waitIfNeeded();

    try {
      const endTimestamp = Math.floor(new Date(params.endDate).getTime() / 1000);

      const url = `${this.baseUrl}/stock-insight/v2/stock/bars-long-term`;

      const queryParams = new URLSearchParams({
        resolution: "D", // Daily resolution
        ticker: params.symbol,
        type: "stock",
        to: endTimestamp.toString(),
        countBack: (params.limit || 365).toString(),
      });

      console.log(`📊 Fetching TCBS historical data for ${params.symbol}`);

      const response = await fetch(`${url}?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`TCBS API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✅ Successfully fetched ${data.data.length} historical records for ${params.symbol}`);
      return this.transformHistoricalData(data.data, params.symbol);
    } catch (error) {
      this.lastError = error as Error;
      console.error("❌ TCBS fetchHistoricalData error:", error);
      throw error;
    }
  }

  async fetchCurrentData(symbol: string): Promise<StandardStockData> {
    await this.rateLimiter.waitIfNeeded();

    try {
      const url = `${this.baseUrl}/tcanalysis/v1/ticker/${symbol}/overview`;

      console.log(`📈 Fetching TCBS current data for ${symbol}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`TCBS API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched current data for ${symbol}`);
      return this.transformCurrentData(data, symbol);
    } catch (error) {
      this.lastError = error as Error;
      console.error(`❌ TCBS fetchCurrentData error for ${symbol}:`, error);
      throw error;
    }
  }

  async fetchMultipleCurrentData(symbols: string[]): Promise<StandardStockData[]> {
    console.log(`📊 Fetching current data for ${symbols.length} symbols: ${symbols.join(", ")}`);

    const promises = symbols.map(async (symbol) => {
      try {
        return await this.fetchCurrentData(symbol);
      } catch (error) {
        console.error(`❌ Error fetching data for ${symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const successfulResults = results.filter((result): result is StandardStockData => result !== null);

    console.log(`✅ Successfully fetched data for ${successfulResults.length}/${symbols.length} symbols`);
    return successfulResults;
  }

  private transformHistoricalData(data: any[], symbol: string): StandardStockData[] {
    return data.map((item) => ({
      symbol,
      date: this.formatDateForUI(item.tradingDate),
      dateObj: new Date(item.tradingDate),
      openPrice: item.open || 0,
      closePrice: item.close || 0,
      highestPrice: item.high || 0,
      lowestPrice: item.low || 0,
      adjustedPrice: item.adjClose || item.close || 0,
      volume: item.volume || 0,
      negotiatedVolume: item.dealVolume || 0,
      negotiatedValue: item.dealValue || 0,
      priceChange: {
        value: item.change || 0,
        percentage: item.pctChange || 0,
      },
      source: "TCBS" as DataSource,
      fetchedAt: new Date(),
    }));
  }

  private transformCurrentData(data: any, symbol: string): StandardStockData {
    return {
      symbol,
      date: this.formatDateForUI(new Date()),
      dateObj: new Date(),
      openPrice: data.openPrice || 0,
      closePrice: data.lastPrice || 0,
      highestPrice: data.highestPrice || 0,
      lowestPrice: data.lowestPrice || 0,
      adjustedPrice: data.lastPrice || 0,
      volume: data.totalVol || 0,
      negotiatedVolume: data.nmVolume || 0,
      negotiatedValue: data.nmValue || 0,
      priceChange: {
        value: data.change || 0,
        percentage: data.pctChange || 0,
      },
      source: "TCBS" as DataSource,
      fetchedAt: new Date(),
    };
  }

  private formatDateForUI(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  }
}

export class VietCapDataSource implements IStockDataSource {
  private baseUrl = "https://api.vietcap.com.vn/data-mt";
  private config: StockDataSourceConfig;
  private rateLimiter: RateLimiter;
  private lastError: Error | null = null;

  constructor(config: StockDataSourceConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit?.requestsPerMinute || 30, 60 * 1000);
  }

  getName(): DataSource {
    return "VIETCAP";
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
      const response = await fetch(`${this.baseUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ __typename }" }),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      this.lastError = error as Error;
      return false;
    }
  }

  async fetchHistoricalData(params: HistoricalDataParams): Promise<StandardStockData[]> {
    // TODO: Implement VietCap historical data fetching
    // Using GraphQL endpoint based on vnstock research
    throw new Error("VietCap historical data not implemented yet");
  }

  async fetchCurrentData(symbol: string): Promise<StandardStockData> {
    // TODO: Implement VietCap current data fetching
    throw new Error("VietCap current data not implemented yet");
  }

  async fetchMultipleCurrentData(symbols: string[]): Promise<StandardStockData[]> {
    // TODO: Implement VietCap batch data fetching
    throw new Error("VietCap batch data not implemented yet");
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
  private defaultSource: DataSource = "TCBS";
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor() {
    this.initializeConfigurations();
    this.initializeSources();
  }

  private initializeConfigurations() {
    const configs: StockDataSourceConfig[] = [
      {
        name: "TCBS",
        displayName: "TCBS Securities",
        baseUrl: "https://apipubaws.tcbs.com.vn",
        enabled: true,
        priority: 1,
        rateLimit: { requestsPerMinute: 60, burstLimit: 10 },
      },
      {
        name: "VIETCAP",
        displayName: "VietCap Securities",
        baseUrl: "https://api.vietcap.com.vn/data-mt",
        enabled: false, // Enable when implemented
        priority: 2,
        rateLimit: { requestsPerMinute: 30, burstLimit: 5 },
      },
      {
        name: "SSI",
        displayName: "SSI Securities",
        baseUrl: "https://iboard-api.ssi.com.vn",
        enabled: false, // Enable when implemented
        priority: 3,
        rateLimit: { requestsPerMinute: 40, burstLimit: 8 },
      },
    ];

    configs.forEach((config) => {
      this.config.set(config.name, config);
    });
  }

  private initializeSources() {
    // Initialize TCBS source
    const tcbsConfig = this.config.get("TCBS")!;
    this.sources.set("TCBS", new TCBSDataSource(tcbsConfig));

    // Initialize VietCap source (ready for when implemented)
    const vietcapConfig = this.config.get("VIETCAP")!;
    this.sources.set("VIETCAP", new VietCapDataSource(vietcapConfig));

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
      console.error(`Error fetching from ${source}, trying fallback:`, error);
      return this.fallbackFetchHistoricalData(params, source);
    }
  }

  async fetchCurrentData(symbol: string, preferredSource?: DataSource): Promise<StandardStockData> {
    const cacheKey = this.getCacheKey("current", { symbol });
    const cached = this.getFromCache<StandardStockData>(cacheKey);
    if (cached) return cached;

    const source = preferredSource || this.defaultSource;
    const dataSource = this.sources.get(source);

    if (!dataSource || !dataSource.isEnabled()) {
      return this.fallbackFetchCurrentData(symbol);
    }

    try {
      const data = await dataSource.fetchCurrentData(symbol);
      this.setToCache(cacheKey, data, 10000); // Cache for 10 seconds
      return data;
    } catch (error) {
      console.error(`Error fetching from ${source}, trying fallback:`, error);
      return this.fallbackFetchCurrentData(symbol, source);
    }
  }

  async fetchMultipleCurrentData(symbols: string[], preferredSource?: DataSource): Promise<StandardStockData[]> {
    const source = preferredSource || this.defaultSource;
    const dataSource = this.sources.get(source);

    if (!dataSource || !dataSource.isEnabled()) {
      return this.fallbackFetchMultipleCurrentData(symbols);
    }

    try {
      return await dataSource.fetchMultipleCurrentData(symbols);
    } catch (error) {
      console.error(`Error fetching multiple from ${source}, trying fallback:`, error);
      return this.fallbackFetchMultipleCurrentData(symbols, source);
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
        console.log(`Trying fallback source for historical data: ${name}`);
        return await source.fetchHistoricalData(params);
      } catch (error) {
        console.error(`Fallback source ${name} also failed:`, error);
      }
    }

    throw new Error(`All data sources failed to fetch historical data for ${params.symbol}`);
  }

  private async fallbackFetchCurrentData(symbol: string, excludeSource?: DataSource): Promise<StandardStockData> {
    const availableSources = Array.from(this.sources.entries())
      .filter(([name, source]) => name !== excludeSource && source.isEnabled())
      .sort((a, b) => (this.config.get(a[0])?.priority || 999) - (this.config.get(b[0])?.priority || 999));

    for (const [name, source] of availableSources) {
      try {
        console.log(`Trying fallback source for current data: ${name}`);
        return await source.fetchCurrentData(symbol);
      } catch (error) {
        console.error(`Fallback source ${name} also failed:`, error);
      }
    }

    throw new Error(`All data sources failed to fetch current data for ${symbol}`);
  }

  private async fallbackFetchMultipleCurrentData(
    symbols: string[],
    excludeSource?: DataSource,
  ): Promise<StandardStockData[]> {
    const availableSources = Array.from(this.sources.entries())
      .filter(([name, source]) => name !== excludeSource && source.isEnabled())
      .sort((a, b) => (this.config.get(a[0])?.priority || 999) - (this.config.get(b[0])?.priority || 999));

    for (const [name, source] of availableSources) {
      try {
        console.log(`Trying fallback source for multiple current data: ${name}`);
        return await source.fetchMultipleCurrentData(symbols);
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
          const isHealthy = await source.healthCheck();
          results[name] = isHealthy;
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
