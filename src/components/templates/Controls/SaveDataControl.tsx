import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Button } from "@nextui-org/button";
import React, { useEffect, useRef, useState } from "react";

import { CameraIcon } from "@/icons/CameraIcon";

interface SaveDataControlProps {
  imageSrc: string | null;
}

const SaveDataControl = ({ imageSrc }: SaveDataControlProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [recording, setRecording] = useState<boolean>(false);

  useEffect(() => {
    if (imageSrc !== null && imageSrc !== undefined) {
      drawImage(imageSrc);
    }
  }, [imageSrc]);

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

      if (Capacitor.getPlatform() === "android") {
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

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} width="640" height="480"></canvas>

      <Button onClick={captureImage} color="success" endContent={<CameraIcon />}>
        Capture Image
      </Button>
      <Button onClick={recording ? stopRecording : startRecording} color="secondary">
        {recording ? "Stop Recording" : "Start Recording"}
      </Button>
    </>
  );
};

export default SaveDataControl;
