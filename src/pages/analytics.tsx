import TabbedAnalytics from "@/components/templates/Analytics/TabbedAnalytics";

export default function AnalyticsPage() {
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
          <TabbedAnalytics />
        </div>
      </IonContent>
    </IonPage>
  );
}
