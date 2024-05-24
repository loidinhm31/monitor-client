/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
/* Theme variables */
import "@/theme/variables.scss";

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
import { Card, CardFooter } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Spinner } from "@nextui-org/spinner";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

import { CameraIcon } from "@/icons/CameraIcon";
import { HostConnection } from "@/models/connections";
import { Eyes, SystemInfo } from "@/models/sensors";


const Home = () => {
  const [hostConnections, setHostConnections] = useState<HostConnection[]>([]);
  const [hostConnectionValue, setHostConnectionValue] = useState<string>("");
  const [selectedHostConnection, setSelectedHostConnection] = useState<HostConnection | null>(null);
  const [appliedHostConnection, setAppliedHostConnection] = useState<HostConnection | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyes, setSelectedEyes] = useState<Eyes | null>(null);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [action, setAction] = useState("");

  const hostConnectionRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const auth = "Basic " + btoa("admin:password");

  useEffect(() => {
    const storedHostConnections = JSON.parse(localStorage.getItem("hostConnections") || "[]");
    if (storedHostConnections) {
      setHostConnections(storedHostConnections);
    }
  }, []);

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
        drawImage(base64Image);
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

  useEffect(() => {
    if (action !== "") {
      // Store data
      localStorage.setItem("hostConnections", JSON.stringify(hostConnections));

      if (action === "delete") {
        setSelectedHostConnection(hostConnections[0]);
      }
    }
  }, [action, hostConnections]);

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

  const selectEyes = (selection: React.ChangeEvent<HTMLSelectElement>) => {
    const currEye = systemInfo?.eyes.find((_, i) => i === Number(selection.target.value));
    if (selectedEyes !== null && currEye?.index !== selectedEyes.index) {
      if (openEyes) {
        setEyesStatus(false);
      }
    } else {
      if (!openEyes) {
        setEyesStatus(true);
      }
    }
    setSelectedEyes(currEye ? currEye : null);
  };

  const captureImage = () => {
    if (imageSrc) {
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "_").split(".")[0];
      const fileName = `captured-image_${timestamp}.jpg`;

      const link = document.createElement("a");
      link.href = imageSrc;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const drawImage = (base64Image: string) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = `data:image/jpeg;base64,${base64Image}`;
    }
  };

  const startRecording = () => {
    if (!canvasRef.current) return;

    const stream = canvasRef.current.captureStream();
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "_").split(".")[0];
      const fileName = `recorded-video_${timestamp}.webm`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const editHostConnection = () => {
    setHostConnectionValue(selectedHostConnection ? selectedHostConnection?.host : "");
    setIsEditing(true);
  };

  const saveHostConnection = () => {
    if (hostConnectionValue !== "") {
      if (isEditing) {
        setHostConnections(hostConnections.map((conn) => {
          if (conn.key === selectedHostConnection?.key) {
            return { ...conn, host: hostConnectionValue };
          } else {
            return conn;
          }
        }));
        setAction("edit");
        setIsEditing(false);
      } else {
        setHostConnections(
          [
            ...hostConnections,
            { key: hostConnections.length + 1, host: hostConnectionValue }
          ]
        );

        setAction("add");
      }
      // Reset input
      setHostConnectionValue("");
    }
  };

  const deleteHostConnection = () => {
    setHostConnections(hostConnections.filter((conn) => conn.key !== selectedHostConnection?.key));

    setAction("delete");
  };

  const applyHostConnection = () => {
    if (appliedHostConnection === null) {
      setAppliedHostConnection(selectedHostConnection);
    } else {
      setAppliedHostConnection(null);
    }
  };

  const updateSelectedHostConnection = (key: string) => {
    const currentHostConnection = hostConnections.find((connection) =>
      connection?.key === Number(key)
    );
    setSelectedHostConnection(currentHostConnection ? currentHostConnection : null);
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
          <IonGrid>
            <IonRow className="flex items-center ion-align-items-start">
              <IonCol>
                <div className="w-full flex flex-row flex-wrap gap-2">
                  <Select
                    label="Select Connection"
                    placeholder="Select Connection"
                    selectedKeys={[selectedHostConnection === null || selectedHostConnection === undefined ? 0 : (
                      selectedHostConnection.key === undefined ? 0 : selectedHostConnection.key
                    )]}
                    onChange={(e) => updateSelectedHostConnection(e.target.value)}
                  >
                    {hostConnections.map((connection) => (
                      <SelectItem key={connection.key === undefined ? 0 : connection.key} value={connection.key}>
                        {connection.host}
                      </SelectItem>
                    ))
                    }

                  </Select>

                  {selectedHostConnection && (
                    <>
                      <Button
                        variant={appliedHostConnection === null ? "solid" : "flat"}
                        color="success"
                        onClick={() => applyHostConnection()}>
                        {appliedHostConnection === null ? "Apply" : "Withdraw"}
                      </Button>

                      <Button
                        color="warning"
                        onClick={editHostConnection}>
                        Edit
                      </Button>
                      <Button
                        color="danger"
                        onClick={deleteHostConnection}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonCol>
                  <div className="w-full flex flex-row flex-wrap gap-2">
                    <Input
                      ref={hostConnectionRef}
                      type="text"
                      label="Host Connection"
                      isDisabled={appliedHostConnection !== null}
                      value={hostConnectionValue}
                      onChange={(e) => setHostConnectionValue(e.target.value)}
                    />

                    <Button color="primary" onClick={saveHostConnection}>
                      {isEditing ? "Save" : "Add"}
                    </Button>
                  </div>
                </IonCol>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                {appliedHostConnection !== null && (
                  <>
                    <div className="w-full flex flex-col flex-wrap gap-4">
                      {systemInfo ? (
                        <>
                          <div>
                            <Chip className="max-w" color="warning" size="lg">
                              System Information
                            </Chip>
                          </div>

                          <IonRow className="w-full flex flex-row flex-wrap gap-2">
                            <IonCol size="auto" className="w-full flex flex-row flex-wrap gap-1">
                              <Chip>OS Type</Chip>
                              <p>{systemInfo.os_type}</p>
                            </IonCol>

                            <IonCol className="w-full flex flex-row flex-wrap gap-1">
                              <Chip>OS Release</Chip>
                              <p>{systemInfo.os_release}</p>
                            </IonCol>
                          </IonRow>

                          <Chip className="max-w" color="success" size="md" variant="dot">
                            Available Eyes
                          </Chip>

                          <Select label="Select eyes" className="max-w-xs" onChange={(k) => selectEyes(k)}>
                            {systemInfo.eyes.map((eye, index) => (
                              <SelectItem key={index} value={"item" + index}>
                                {eye.name}
                              </SelectItem>
                            ))}
                          </Select>

                          <div>
                            <Button
                              color={eyesStatus && !openEyes && selectedEyes !== null && selectedEyes.index >= 0 ? "primary" : "danger"}
                              variant={selectedEyes === null || selectedEyes.index < 0 ? "faded" : "solid"}
                              onClick={() => turnEyes(eyesStatus)}
                              disabled={selectedEyes === null || selectedEyes.index < 0}
                            >
                              {eyesStatus && !openEyes && selectedEyes !== null && selectedEyes.index >= 0
                                ? "Turn Eyes On"
                                : "Turn Eyes Off"}
                            </Button>
                          </div>

                          {openEyes && imageSrc && (
                            <div className="w-full flex flex-col flex-wrap gap-4">
                              <div className="mx-auto">
                                <Card isFooterBlurred radius="lg" className="border-none">
                                  <img
                                    alt="Eyes Stream"
                                    className="object-cover"
                                    src={imageSrc}
                                    height={500}
                                    width={500}
                                  />
                                  <CardFooter
                                    className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10"
                                  >
                                    <Chip variant="dot" color="danger" style={{ color: "red" }}>
                                      Streaming
                                    </Chip>
                                  </CardFooter>
                                </Card>
                              </div>
                              <div className="w-full flex flex-row flex-wrap gap-4">
                                <Button onClick={captureImage} color="success" endContent={<CameraIcon />}>
                                  Capture Image
                                </Button>
                                <Button onClick={recording ? stopRecording : startRecording} color="secondary">
                                  {recording ? "Stop Recording" : "Start Recording"}
                                </Button>
                              </div>
                              <canvas ref={canvasRef} style={{ display: "none" }} width="640" height="480"></canvas>
                            </div>
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
