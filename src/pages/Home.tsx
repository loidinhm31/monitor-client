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
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  setupIonicReact
} from "@ionic/react";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

import { SystemInfo } from "@/models/sensors";

setupIonicReact();

const App = () => {
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyesIndex, setSelectedEyesIndex] = useState<number>(-1);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const auth = "Basic " + btoa("admin:password"); // Use the same credentials as in the server

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8081/system", {
          headers: {
            Authorization: auth
          }
        });
        const systemInfo: SystemInfo = await response.data;
        systemInfo.eyes.unshift({
          name: "Select eyes"
        });
        setSystemInfo(response.data);
      } catch (error) {
        console.error("Error fetching system information:", error);
      }
    };

    fetchSystemInfo();
  }, []);

  useEffect(() => {
    let eventSource: EventSource;
    if (openEyes) {
      eventSource = new EventSource("http://127.0.0.1:8081/sensors/eyes/event", {
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

  const turnEyes = async (eyesStatus: boolean) => {
    try {
      const body = {
        action: eyesStatus ? "on" : "off",
        index: selectedEyesIndex
      };

      await axios.post("http://127.0.0.1:8081/sensors/eyes", body, {
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
    } catch (error) {
      console.error("Error occurred at change eyes:", error);
    }
  };

  const selectEyes = (index: string) => {
    const currIndex = Number(index);
    if (selectedEyesIndex >= 0 && currIndex !== selectedEyesIndex) {
      if (openEyes) {
        setEyesStatus(false);
      }
    } else {
      if (!openEyes) {
        setEyesStatus(true);
      }
    }
    setSelectedEyesIndex(currIndex);
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

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>
            Monitor System
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div>
          {systemInfo ? (
            <div>
              <h2>System Information</h2>
              <p>OS Type: {systemInfo.os_type}</p>
              <p>OS Release: {systemInfo.os_release}</p>
              <h2>Available Cameras</h2>
              <select
                onChange={(event) => {
                  selectEyes(event.target.value);
                }}
              >
                {systemInfo.eyes.map((eye, index) => (
                  <option key={index} value={eye.index}>
                    {eye.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p>Loading system information...</p>
          )}
          <button onClick={() => turnEyes(eyesStatus)} disabled={selectedEyesIndex < 0}>
            {eyesStatus && !openEyes && selectedEyesIndex >= 0 ? "Turn Eyes On" : "Turn Eyes Off"}
          </button>
          {openEyes && imageSrc ? (
            <>
              <img src={imageSrc} alt="Camera Stream" />
              <button onClick={captureImage}>Capture Image</button>
              <button onClick={recording ? stopRecording : startRecording}>
                {recording ? "Stop Recording" : "Start Recording"}
              </button>
              <canvas ref={canvasRef} style={{ display: "none" }} width="640" height="480"></canvas>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default App;
