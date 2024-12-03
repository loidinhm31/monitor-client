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
  IonToolbar,
} from "@ionic/react";
import { Button } from "@nextui-org/button";
import { Spinner } from "@nextui-org/spinner";
import axios from "axios";
import React, { useEffect, useState } from "react";

import AudioControl from "@/components/templates/Controls/AudioControl";
import HostConnectionControl from "@/components/templates/Controls/HostConnectionControl";
import ServerCamera from "@/components/templates/Controls/ServerCamera";
import StreamingVideoControl from "@/components/templates/Controls/StreamingVideoControl";
import SystemInformationTemplate from "@/components/templates/Controls/SystemInformationTemplate";
import { HostConnection } from "@/models/connections";
import { Eyes, SystemInfo } from "@/models/sensors";

const Home = () => {
  const [appliedHostConnection, setAppliedHostConnection] = useState<HostConnection | null>(null);
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyes, setSelectedEyes] = useState<Eyes | null>(null);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const auth = "Basic " + btoa("admin:password");

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        if (appliedHostConnection !== null) {
          const response = await axios.get(`http://${appliedHostConnection?.host}/system`, {
            headers: {
              Authorization: auth,
            },
          });

          const systemInfo: SystemInfo = await response.data;
          systemInfo.eyes.unshift({
            index: -1,
            name: "Select eyes",
          });
          setSystemInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching system information:", error);
      }
    };

    setSystemInfo(null);
    fetchSystemInfo();
  }, [appliedHostConnection]);

  useEffect(() => {
    let socket: WebSocket;
    if (appliedHostConnection !== null) {
      socket = new WebSocket(`ws://${appliedHostConnection.host}/sensors/eyes/ws`);

      socket.onopen = () => {
        console.log("WebSocket connection established.");
        socket.send(auth);
        setWsConnection(socket);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed.");
        setWsConnection(null);
      };
    }

    return () => {
      if (socket) {
        socket.close();
        setWsConnection(null);
      }
    };
  }, [appliedHostConnection]);

  const turnEyes = async (eyesStatus: boolean) => {
    try {
      if (wsConnection && selectedEyes?.index !== undefined && selectedEyes.index >= 0) {
        const control = {
          type: "control",
          action: eyesStatus ? "on" : "off",
          index: selectedEyes.index,
        };
        wsConnection.send(JSON.stringify(control));

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

      <IonContent className="ion-padding" id="main-content">
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
                              disabled={selectedEyes === null || selectedEyes.index < 0 || !wsConnection}
                            >
                              {eyesStatus && !openEyes && selectedEyes !== null && selectedEyes.index >= 0
                                ? "Turn Eyes On"
                                : "Turn Eyes Off"}
                            </Button>
                          </div>

                          <ServerCamera hostConnection={appliedHostConnection?.host} />

                          {openEyes && <StreamingVideoControl wsConnection={wsConnection} />}
                          <AudioControl hostConnection={appliedHostConnection?.host} />
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
