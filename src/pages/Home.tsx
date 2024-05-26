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
import React, { useEffect, useRef, useState } from "react";

import HostConnectionControl from "@/components/templates/HostConnectionControl";
import StreamingControl from "@/components/templates/StreamingControl";
import SystemInformationTemplate from "@/components/templates/SystemInformationTemplate";
import { HostConnection } from "@/models/connections";
import { Eyes, SystemInfo } from "@/models/sensors";

const Home = () => {
  const [appliedHostConnection, setAppliedHostConnection] = useState<HostConnection | null>(null);
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  const [audioBytes, setAudioBytes] = useState<Uint8Array | null>(null);

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyes, setSelectedEyes] = useState<Eyes | null>(null);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);

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

    fetchSystemInfo();
  }, [appliedHostConnection]);

  useEffect(() => {
    let socket: WebSocket;
    if (appliedHostConnection !== null && openEyes) {
      socket = new WebSocket(`ws://${appliedHostConnection?.host}/sensors/eyes/ws`);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connection established.");
        socket.send(auth);
      };

      socket.onmessage = (e) => {
        if (e.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);

            if (isImage(bytes)) {
              setImageBytes(bytes);
            } else {
              setAudioBytes(bytes);
            }
          };
          reader.readAsArrayBuffer(e.data);
        } else {
          console.log("Received:", e.data);
        }
      };

      socket.onclose = () => console.log("WebSocket connection closed.");
    }
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [appliedHostConnection, openEyes]);

  const isImage = (data: Uint8Array): boolean => {
    return data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  };

  const turnEyes = async (eyesStatus: boolean) => {
    try {
      const body = {
        action: eyesStatus ? "on" : "off",
        index: selectedEyes?.index,
      };

      if (appliedHostConnection !== null) {
        await axios.post(`http://${appliedHostConnection?.host}/sensors/eyes`, body, {
          headers: {
            Authorization: auth,
          },
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

                          {openEyes && imageBytes && (
                            <StreamingControl
                              socket={socketRef.current}
                              imageBytes={imageBytes}
                              audioBytes={audioBytes}
                            />
                          )}
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
