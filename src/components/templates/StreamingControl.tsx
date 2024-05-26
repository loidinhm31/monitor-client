import { Capacitor } from "@capacitor/core";
import { Directory,Filesystem } from "@capacitor/filesystem";
import { IonIcon } from "@ionic/react";
import { Button } from "@nextui-org/button";
import { Card, CardFooter } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { chevronCollapseOutline, chevronExpandOutline } from "ionicons/icons";
import React, { useEffect, useRef, useState } from "react";

import { CameraIcon } from "@/icons/CameraIcon";

interface StreamingControlProps {
  imageSrc: string | null;
}

const StreamingControl = ({ imageSrc }: StreamingControlProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const [recording, setRecording] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false); // State for full-screen mode

  useEffect(() => {
    if (imageSrc !== null && imageSrc !== undefined) {
      drawImage(imageSrc);
    }
  }, [imageSrc]);

  const ensureDirectoryExists = async (path: string) => {
    const parts = path.split("/");
    let currentPath = "";

    for (const part of parts) {
      if (part === "") continue; // skip empty parts
      currentPath += `/${part}`;
      try {
        await Filesystem.mkdir({
          path: currentPath,
          directory: Directory.Documents,
          recursive: false,
        });
      } catch (error) {
        console.warn(error);
      }
    }
  };

  const captureImage = async () => {
    if (imageSrc) {
      const path = "monitor-client/images/";
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "_").split(".")[0];
      const fileName = `captured-image_${timestamp}.jpg`;

      if (Capacitor.isNativePlatform()) {
        const base64Data = imageSrc.split(",")[1];
        await ensureDirectoryExists(path);

        try {
          await Filesystem.writeFile({
            path: path + fileName,
            data: base64Data,
            directory: Directory.Documents,
          });
          alert("Image saved to device");
        } catch (error) {
          alert(error);
        }
      } else {
        const link = document.createElement("a");
        link.href = imageSrc;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "_").split(".")[0];
      const fileName = `recorded-video_${timestamp}.webm`;
      const path = "monitor-client/videos/";

      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          await ensureDirectoryExists(path);
          await Filesystem.writeFile({
            path: path + fileName,
            data: base64Data.split(",")[1],
            directory: Directory.Documents,
          });
          alert("Video saved to device");
        };
        reader.readAsDataURL(blob);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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

  const drawImage = (imageSrc: string) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = imageSrc;
    }
  };

  const zoomIn = () => {
    setZoomLevel((prevZoomLevel) => Math.min(prevZoomLevel + 0.1, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 0.1, 1));
  };

  const enterFullScreen = () => {
    if (imageContainerRef.current) {
      if (imageContainerRef.current.requestFullscreen) {
        imageContainerRef.current.requestFullscreen();
      }
      setIsFullScreen(true);
    }
  };

  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullScreen(false);
  };

  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  };

  return (
    <div className="w-full flex flex-col flex-wrap gap-4">
      <div className="mx-auto flex justify-center" style={{ overflow: "hidden" }} ref={imageContainerRef}>
        <Card isFooterBlurred radius="lg" className="mx-auto border-none">
          <img
            alt="Eyes Stream"
            className={`object-contain transition-transform duration-300 ${isFullScreen ? "w-full h-full" : "max-w-full max-h-full"}`} // Apply full-screen and normal styles
            src={imageSrc === null || imageSrc === undefined ? "" : imageSrc}
            height={750}
            width={750}
            style={{ transform: `scale(${zoomLevel})` }}
          />
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <Chip variant="dot" color="danger" style={{ color: "red" }}>
              Streaming
            </Chip>
          </CardFooter>
        </Card>

        <Button onClick={toggleFullScreen} className="absolute bottom-0 right-1" isIconOnly variant="faded">
          <IonIcon size="large" icon={isFullScreen ? chevronCollapseOutline : chevronExpandOutline}></IonIcon>
        </Button>
      </div>
      <div className="w-full flex flex-row flex-wrap gap-4">
        <Button onClick={captureImage} color="success" endContent={<CameraIcon />}>
          Capture Image
        </Button>
        <Button onClick={recording ? stopRecording : startRecording} color="secondary">
          {recording ? "Stop Recording" : "Start Recording"}
        </Button>
        <Button onClick={zoomIn} color="primary">
          Zoom In
        </Button>
        <Button onClick={zoomOut} color="primary">
          Zoom Out
        </Button>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} width="640" height="480"></canvas>
    </div>
  );
};

export default StreamingControl;