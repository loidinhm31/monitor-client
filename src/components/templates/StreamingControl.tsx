import { Button } from "@nextui-org/button";
import { Card, CardFooter } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import React, { useEffect, useRef, useState } from "react";

import { CameraIcon } from "@/icons/CameraIcon";

interface StreamingControlProps {
  imageSrc: string | null;
}

const StreamingControl = ({imageSrc}: StreamingControlProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [recording, setRecording] = useState<boolean>(false);

  useEffect(() => {
    if (imageSrc !== null && imageSrc !== undefined) {
      drawImage(imageSrc);
    }
  }, [imageSrc]);

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

  return (
    <>
      <div className="w-full flex flex-col flex-wrap gap-4">
        <div className="mx-auto">
          <Card isFooterBlurred radius="lg" className="border-none">
            <img
              alt="Eyes Stream"
              className="object-cover"
              src={imageSrc === null || imageSrc === undefined ? "" : imageSrc}
              height={500}
              width={500}
            />
            <CardFooter
              className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
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
    </>
  );
};

export default StreamingControl;