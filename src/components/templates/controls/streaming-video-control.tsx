import { Button } from "@heroui/button";
import { Card, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Maximize, Minimize } from "lucide-react";

import SaveDataControl from "@/components/templates/controls/save-data-control.tsx";

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
      <div ref={imageContainerRef} className="mx-auto flex justify-center" style={{ overflow: "hidden" }}>
        <Card isFooterBlurred className="mx-auto border-none" radius="lg">
          <TransformWrapper>
            <TransformComponent>
              <img
                alt="Eyes Stream"
                className={`object-contain transition-transform duration-300 ${isFullScreen ? "w-full h-full" : "max-w-full max-h-full"}`}
                height={750}
                src={imageSrc === null || imageSrc === undefined ? "" : imageSrc}
                width={750}
              />
            </TransformComponent>
          </TransformWrapper>
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <Chip color="danger" style={{ color: "red" }} variant="dot">
              Streaming
            </Chip>
          </CardFooter>
          <Button isIconOnly className=" bottom-0 right-1" variant="faded" onPress={toggleFullScreen}>
            {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
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
