import {
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import { Button } from "@nextui-org/button";
import { Spinner } from "@nextui-org/spinner";
import axios from "axios";
import React, { useEffect, useState } from "react";

import HostConnectionControl from "@/components/templates/HostConnectionControl";
import StreamingControl from "@/components/templates/StreamingControl";
import SystemInformationTemplate from "@/components/templates/SystemInformationTemplate";
import { HostConnection } from "@/models/connections";
import { Eyes, SystemInfo } from "@/models/sensors";

const Home = () => {
  const [appliedHostConnection, setAppliedHostConnection] = useState<HostConnection | null>(null);
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyes, setSelectedEyes] = useState<Eyes | null>(null);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);


  const auth = "Basic " + btoa("admin:password");

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        if (appliedHostConnection !== null) {
          const response = await axios.get(`${appliedHostConnection?.host}/system`, {
            headers: {
              Authorization: auth
            }
          });

          const systemInfo: SystemInfo = await response.data;
          systemInfo.eyes.unshift({
            index: -1,
            name: "Select eyes"
          });
          setSystemInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching system information:", error);
      }
    };

    fetchSystemInfo();
  }, [appliedHostConnection]);

  useEffect(() => {
    let eventSource: EventSource;
    if (appliedHostConnection !== null && openEyes) {
      eventSource = new EventSource(`${appliedHostConnection?.host}/sensors/eyes/event`, {
        withCredentials: true
      });
      eventSource.onmessage = (event) => {
        const base64Image = event.data;
        setImageSrc(`data:image/jpeg;base64,${base64Image}`);
      };
      eventSource.onerror = (event: Event) => {
        console.error("Event source has failed");
        if ((event as unknown as EventSource).readyState === EventSource.CLOSED) {
          (eventSource as EventSource).close();
        }
      };
    }
    return () => {
      if (eventSource) {
        console.log(`Closing stream...`);
        eventSource.close();
        console.log(`Closed stream, trying to close eyes if needed...`);

        turnEyes(false).then(() => {
          console.log("End => Eyes closed");
        });
      }
    };
  }, [openEyes]);

  const turnEyes = async (eyesStatus: boolean) => {
    try {
      const body = {
        action: eyesStatus ? "on" : "off",
        index: selectedEyes?.index
      };

      if (appliedHostConnection !== null) {
        await axios.post(`${appliedHostConnection?.host}/sensors/eyes`, body, {
          headers: {
            Authorization: auth
          }
        });
        if (eyesStatus) {
          setOpenEyes(true);
          setEyesStatus(false);
        } else {
          setOpenEyes(false);
          setEyesStatus(true);
        }
      }
    } catch (error) {
      console.error("Error occurred at change eyes:", error);
    }
  };



  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>Monitor System</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="mx-auto px-1">
          <HostConnectionControl
            appliedHostConnection={appliedHostConnection}
            setAppliedHostConnection={setAppliedHostConnection}
          />

          <IonGrid>
            <IonRow>
              <IonCol>
                {appliedHostConnection !== null && (
                  <>
                    <div className="w-full flex flex-col flex-wrap gap-4">
                      {systemInfo ? (
                        <>
                          <SystemInformationTemplate
                            systemInfo={systemInfo}
                            openEyes={openEyes}
                            setEyesStatus={setEyesStatus}
                            selectedEyes={selectedEyes}
                            setSelectedEyes={setSelectedEyes}
                          />

                          <div>
                            <Button
                              color={
                                eyesStatus && !openEyes && selectedEyes !== null && selectedEyes.index >= 0
                                  ? "primary"
                                  : "danger"
                              }
                              variant={selectedEyes === null || selectedEyes.index < 0 ? "faded" : "solid"}
                              onClick={() => turnEyes(eyesStatus)}
                              disabled={selectedEyes === null || selectedEyes.index < 0}
                            >
                              {eyesStatus && !openEyes && selectedEyes !== null && selectedEyes.index >= 0
                                ? "Turn Eyes On"
                                : "Turn Eyes Off"}
                            </Button>
                          </div>

                          {openEyes && imageSrc &&
                            <StreamingControl
                              imageSrc={imageSrc}
                            />
                          }
                        </>
                      ) : (
                        <Spinner label="Loading system information..." color="warning" />
                      )}
                    </div>
                  </>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
