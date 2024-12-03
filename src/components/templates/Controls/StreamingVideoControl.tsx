import { IonIcon } from "@ionic/react";
import { Button } from "@nextui-org/button";
import { Card, CardFooter } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { chevronCollapseOutline, chevronExpandOutline } from "ionicons/icons";
import React, { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import SaveDataControl from "@/components/templates/Controls/SaveDataControl";

interface StreamingControlProps {
  wsConnection: WebSocket | null;
}

const StreamingVideoControl = ({ wsConnection }: StreamingControlProps) => {
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  useEffect(() => {
    if (wsConnection) {
      wsConnection.onmessage = (e) => {
        if (e.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            setImageSrc(reader.result as string);
          };
          reader.readAsDataURL(e.data);
        } else {
          try {
            const data = JSON.parse(e.data);
            console.log("Received message:", data);
            // Handle any control messages or status updates here
          } catch (error) {
            console.log("Received non-JSON message:", e.data);
          }
        }
      };
    }
  }, [wsConnection]);

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
          <TransformWrapper>
            <TransformComponent>
              <img
                alt="Eyes Stream"
                className={`object-contain transition-transform duration-300 ${isFullScreen ? "w-full h-full" : "max-w-full max-h-full"}`}
                src={imageSrc === null || imageSrc === undefined ? "" : imageSrc}
                height={750}
                width={750}
              />
            </TransformComponent>
          </TransformWrapper>
          <CardFooter
            className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <Chip variant="dot" color="danger" style={{ color: "red" }}>
              Streaming
            </Chip>
          </CardFooter>
          <Button onClick={toggleFullScreen} className="absolute bottom-0 right-1" isIconOnly variant="faded">
            <IonIcon size="large" icon={isFullScreen ? chevronCollapseOutline : chevronExpandOutline}></IonIcon>
          </Button>
        </Card>
      </div>
      <div className="w-full flex flex-row flex-wrap gap-4">
        <SaveDataControl imageSrc={imageSrc} />
      </div>
    </div>
  );
};

export default StreamingVideoControl;