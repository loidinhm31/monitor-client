import { IonIcon } from "@ionic/react";
import { Button } from "@nextui-org/button";
import { Card, CardFooter } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { chevronCollapseOutline, chevronExpandOutline } from "ionicons/icons";
import React, { useEffect, useRef, useState } from "react";

import SaveDataControl from "@/components/templates/SaveDataControl";

interface StreamingControlProps {
  socket: WebSocket | null;
  imageBytes: Uint8Array | null;
  audioBytes: Uint8Array | null;
}

const StreamingControl = ({ socket, imageBytes, audioBytes }: StreamingControlProps) => {
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const audioBufferQueueRef = useRef<Float32Array[]>([]);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false); // State for full-screen mode

  useEffect(() => {
    initializeAudioContext();
  }, []);

  useEffect(() => {
    if (imageBytes !== null) {
      setImageSrc(URL.createObjectURL(new Blob([imageBytes], { type: "image/jpeg" })));
    }
  }, [imageBytes]);

  useEffect(() => {
    if (audioBytes !== null) {
      processAudioData(audioBytes);
    }
  }, [audioBytes]);

  const processAudioData = (data: Uint8Array) => {
    if (!audioContextRef.current) return;

    // Convert Uint8Array to Float32Array
    const float32Array = new Float32Array(data.buffer);

    audioBufferQueueRef.current.push(float32Array);

    if (audioBufferQueueRef.current.length === 1) {
      playNextAudioBuffer();
    }
  };

  const playNextAudioBuffer = async () => {
    if (!audioContextRef.current) return;

    const float32Array = audioBufferQueueRef.current.shift();
    if (!float32Array) return;

    const audioBuffer = audioContextRef.current.createBuffer(
      1,
      float32Array.length,
      audioContextRef.current.sampleRate,
    );
    audioBuffer.copyToChannel(float32Array, 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      if (audioBufferQueueRef.current.length > 0) {
        playNextAudioBuffer();
      }
    };
    source.start();
  };

  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    setIsAudioContextReady(true);
  };

  const startAudioStream = () => {
    if (socket !== null) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("start_audio");
      }
    }
  };

  const stopAudioStream = () => {
    if (socket !== null) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("stop_audio");
      }
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
        {!isAudioContextReady && <Button onClick={initializeAudioContext}>Start Audio</Button>}

        {isAudioContextReady && (
          <>
            <Button onClick={startAudioStream}>Turn On Audio</Button>
            <Button onClick={stopAudioStream}>Turn Off Audio</Button>
          </>
        )}

        <SaveDataControl imageSrc={imageSrc} />

        <Button onClick={zoomIn} color="primary">
          Zoom In
        </Button>
        <Button onClick={zoomOut} color="primary">
          Zoom Out
        </Button>
      </div>
    </div>
  );
};

export default StreamingControl;
