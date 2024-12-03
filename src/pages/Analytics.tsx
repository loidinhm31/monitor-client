import { getLocalTimeZone, today } from "@internationalized/date";
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { Button, CalendarDate, DatePicker, Input, Spinner } from "@nextui-org/react";
import React, { useState } from "react";

import StockDashboard from "@/components/templates/Analytics/StockDashboard";
import { HttpService } from "@/core/services/HttpService";
import type { TransformedStockData } from "@/types/stock";
import { StockApiResponse } from "@/types/stock";
import { transformStockData } from "@/utils/stockUtils";
import { formatCustomDate } from "@/utils/dateFormatterUtils";

const PAGE_SIZE = 32;

const Analytics: React.FC = () => {
  const [mainSymbol, setMainSymbol] = useState<string>("");
  const [inputSymbol, setInputSymbol] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [mainStockData, setMainStockData] = useState<TransformedStockData[]>([]);
  const [compareStocksData, setCompareStocksData] = useState<Record<string, TransformedStockData[]>>({});

  // Initialize dateFormatterUtils.ts states
  const currentDate = today(getLocalTimeZone());
  const threeMonthsAgo = currentDate.subtract({ months: 3 });
  const [startDate, setStartDate] = useState<CalendarDate>(threeMonthsAgo);
  const [endDate, setEndDate] = useState<CalendarDate>(currentDate);

  const formatDateForApi = (date: CalendarDate): string => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  };

  const fetchDataPage = async (symbol: string, pageIndex: number): Promise<StockApiResponse> => {
    try {
      const response = await HttpService.getAxiosClient().get<StockApiResponse>(
        "https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx",
        {
          params: {
            Symbol: symbol,
            StartDate: formatDateForApi(startDate),
            EndDate: formatDateForApi(endDate),
            PageIndex: pageIndex,
            PageSize: PAGE_SIZE,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching page ${pageIndex} for ${symbol}:`, error);
      throw error;
    }
  };

  const fetchAllData = async (symbol: string): Promise<TransformedStockData[]> => {
    try {
      // Fetch first page to get total count
      const firstPage = await fetchDataPage(symbol, 1);

      if (!firstPage?.Data?.TotalCount || !Array.isArray(firstPage.Data.Data)) {
        throw new Error(`Invalid data format received from API for ${symbol}`);
      }

      const totalCount = firstPage.Data.TotalCount;
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);

      let allData: TransformedStockData[] = firstPage.Data.Data.map(transformStockData);

      // Fetch remaining pages if any
      if (totalPages > 1) {
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const promises = remainingPages.map((pageIndex) => fetchDataPage(symbol, pageIndex));

        const results = await Promise.all(promises);

        results.forEach((result: StockApiResponse) => {
          if (result?.Data?.Data && Array.isArray(result.Data.Data)) {
            const transformedData = result.Data.Data.map(transformStockData);
            allData = [...allData, ...transformedData];
          } else {
            console.warn(`Invalid data format in page response for ${symbol}`, result);
          }
        });
      }

      return allData;
    } catch (error) {
      console.error(`Error fetching all data for ${symbol}:`, error);
      throw error;
    }
  };

  const handleMainStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymbol) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchAllData(inputSymbol);
      setMainStockData(data);
      setMainSymbol(inputSymbol);
      setCompareStocksData({}); // Clear comparison data when loading new main stock
      console.log(`Loaded data for ${inputSymbol}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch stock data";
      setError(message);
      console.log(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompareStock = async (compareSymbol: string): Promise<void> => {
    if (compareSymbol === mainSymbol || compareSymbol in compareStocksData) {
      console.log("This stock is already being compared");
      return;
    }

    try {
      const data = await fetchAllData(compareSymbol);
      setCompareStocksData((prev) => ({
        ...prev,
        [compareSymbol]: data,
      }));
      console.log(`Added ${compareSymbol} to comparison`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch comparison data";
      console.log(message);
      throw error; // Re-throw to be handled by the calling component
    }
  };

  const handleRemoveCompareStock = (symbol: string): void => {
    setCompareStocksData((prev) => {
      const newData = { ...prev };
      delete newData[symbol];
      return newData;
    });
    console.log(`Removed ${symbol} from comparison`);
  };

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Stock Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" scrollY={true}>
        <div className="max-w-[1200px] mx-auto px-4">
          <form onSubmit={handleMainStockSubmit} className="mb-6 p-4 rounded-lg bg-content1 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-none w-32">
                <Input
                  type="text"
                  label="Stock Symbol"
                  value={inputSymbol}
                  onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                  size="sm"
                  isRequired
                  variant="bordered"
                  placeholder="e.g., AAPL"
                />
              </div>

              <div className="flex-none w-48">
                <DatePicker showMonthAndYearPickers label={`Start Date (${formatCustomDate(startDate)})`} value={startDate} onChange={setStartDate} isRequired />
              </div>

              <div className="flex-none w-48">
                <DatePicker showMonthAndYearPickers label={`End Date (${formatCustomDate(endDate)})`} value={endDate} onChange={setEndDate} isRequired />
              </div>

              <Button
                color="primary"
                type="submit"
                size="lg"
                isDisabled={loading || !inputSymbol}
                className="flex-none"
              >
                {loading ? <Spinner size="sm" color="white" /> : "Fetch Data"}
              </Button>
            </div>
          </form>

          {error && <div className="p-4 mb-4 text-danger rounded-lg bg-danger-50">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            mainStockData.length > 0 && (
              <div className="bg-content1 rounded-lg shadow-sm">
                <StockDashboard
                  stockData={mainStockData}
                  compareStocksData={compareStocksData}
                  symbol={mainSymbol}
                  onAddCompareStock={handleAddCompareStock}
                  onRemoveCompareStock={handleRemoveCompareStock}
                />
              </div>
            )
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Analytics;
