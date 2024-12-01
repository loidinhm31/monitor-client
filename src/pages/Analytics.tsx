import React, { useEffect, useState } from "react";
import StockDashboard from "@/components/templates/StockDashboard";
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { StockApiResponse, TransformedStockData } from "@/types/stock";
import { transformStockData } from "@/utils/stockUtils";

const Analytics = () => {
  const [stockData, setStockData] = useState<TransformedStockData[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiResponse = await fetch(
          "https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=FPT&StartDate=2022-05-01&EndDate=2024-08-01&PageIndex=1&PageSize=32",
        );
        const data: StockApiResponse = await apiResponse.json();

        const transformedStockData = data.Data.Data.map(transformStockData);
        setStockData(transformedStockData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" id="main-content">
        <div className="mx-auto px-1">{!loading && <StockDashboard stockData={stockData} />}</div>
      </IonContent>
    </IonPage>
  );
};

export default Analytics;
