import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { Button, DatePicker, Input, Spinner } from "@nextui-org/react";
import React, { useEffect, useState } from "react";

import StockDashboard from "@/components/templates/Analytics/StockDashboard";
import { HttpService } from "@/core/services/HttpService";
import type { TransformedStockData } from "@/types/stock";
import { StockApiResponse } from "@/types/stock";
import { transformStockData } from "@/utils/stockUtils";

const PAGE_SIZE = 32;

const Analytics = () => {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stockData, setStockData] = useState<TransformedStockData[]>();

  // Initialize date states with current date - 3 months
  const currentDate = today(getLocalTimeZone());
  const threeMonthsAgo = currentDate.subtract({ months: 3 });

  const [startDate, setStartDate] = useState<CalendarDate>(threeMonthsAgo);
  const [endDate, setEndDate] = useState<CalendarDate>(currentDate);

  const formatDateForApi = (date: CalendarDate) => {
    return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
  };

  const fetchDataPage = async (pageIndex: number): Promise<StockApiResponse> => {
    try {
      const response = await HttpService.getAxiosClient().get<StockApiResponse>(
        `https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=${symbol}&StartDate=${formatDateForApi(startDate)}&EndDate=${formatDateForApi(endDate)}&PageIndex=${pageIndex}&PageSize=${PAGE_SIZE}`,
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching page ${pageIndex}:`, error);
      throw error;
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch first page to get total count
      const firstPage = await fetchDataPage(1);

      if (!firstPage?.Data?.TotalCount || !Array.isArray(firstPage.Data.Data)) {
        throw new Error("Invalid data format received from API");
      }

      const totalCount = firstPage.Data.TotalCount;
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);

      let allData: TransformedStockData[] = firstPage.Data.Data.map(transformStockData);

      // Fetch remaining pages if any
      if (totalPages > 1) {
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const promises = remainingPages.map((pageIndex) => fetchDataPage(pageIndex));

        const results = await Promise.all(promises);

        results.forEach((result: StockApiResponse) => {
          if (result?.Data?.Data && Array.isArray(result.Data.Data)) {
            const transformedData = result.Data.Data.map(transformStockData);
            allData = [...allData, ...transformedData];
          } else {
            console.warn("Invalid data format in page response", result);
          }
        });
      }

      setStockData(allData);
    } catch (error) {
      console.error("Error fetching all data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch stock data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
    }
  }, [symbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAllData();
  };

  const handleStartDateChange = (date: CalendarDate) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: CalendarDate) => {
    setEndDate(date);
  };

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" scrollY={true}>
        <div className="max-w-[1200px] mx-auto px-4">
          <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg bg-content1 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-none w-32">
                <Input
                  type="text"
                  label="Stock Symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  size="sm"
                  isRequired
                  variant="bordered"
                />
              </div>

              <div className="flex-none w-48">
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  defaultValue={startDate}
                  onChange={handleStartDateChange}
                  variant="bordered"
                  isRequired
                />
              </div>

              <div className="flex-none w-48">
                <DatePicker
                  label="End Date"
                  value={endDate}
                  defaultValue={endDate}
                  onChange={handleEndDateChange}
                  variant="bordered"
                  isRequired
                />
              </div>

              <Button color="primary" type="submit" isDisabled={loading} size="lg" className="flex-none">
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
            stockData && (
              <div className="bg-content1 rounded-lg shadow-sm">
                <StockDashboard stockData={stockData} />
              </div>
            )
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Analytics;