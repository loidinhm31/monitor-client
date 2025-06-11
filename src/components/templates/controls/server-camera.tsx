import { Button } from "@heroui/button";
import { Card, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

interface ServerCameraProps {
  hostConnection: string | null;
}

const ServerCamera = ({ hostConnection }: ServerCameraProps) => {
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const [error, setError] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userId = useRef(Math.random().toString(36).substring(7));
  const room = "default-room";

  useEffect(() => {
    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${hostConnection}/ws`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      sendToServer({
        event: "join",
        room: room,
        from: userId.current,
        data: "",
      });
      setError("");
    };

    wsRef.current.onmessage = handleSignalingMessage;

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection error. Please try refreshing the page.");
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
      setError("Connection closed. Please refresh the page to reconnect.");
      setIsStarted(false);
    };
  };

  const handleSignalingMessage = (message: MessageEvent) => {
    try {
      const msg = JSON.parse(message.data);

      if (msg.event === "camera-frame" && msg.from === "server-camera") {
        const canvas = canvasRef.current;

        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = new Image();

          img.onload = () => {
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = "data:image/jpeg;base64," + msg.data;
        }
      }
    } catch (e) {
      console.error("Error handling message:", e);
    }
  };

  const sendToServer = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleStartCamera = () => {
    sendToServer({
      event: "start-camera",
      room: room,
      from: userId.current,
      data: "",
    });
    setIsStarted(true);
  };

  const handleStopCamera = () => {
    sendToServer({
      event: "stop-camera",
      room: room,
      from: userId.current,
      data: "",
    });
    setIsStarted(false);
  };

  const enterFullScreen = () => {
    if (canvasRef.current) {
      if (canvasRef.current.requestFullscreen) {
        canvasRef.current.requestFullscreen();
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
    <div className="flex flex-col items-center w-full gap-4">
      {error && <div className="text-red-500 mb-4 p-2 bg-red-100 rounded">{error}</div>}

      <div className="w-full flex flex-col flex-wrap gap-4">
        <div ref={imageContainerRef} className="mx-auto flex justify-center" style={{ overflow: "hidden" }}>
          <Card isFooterBlurred className="mx-auto border-none" radius="lg">
            <TransformWrapper>
              <TransformComponent>
                <canvas
                  ref={canvasRef}
                  className={`object-contain transition-transform duration-300 ${isFullScreen ? "w-full h-full" : "max-w-full max-h-full"}`}
                  height={750}
                  width={750}
                />
              </TransformComponent>
            </TransformWrapper>
            <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
              <Chip color="danger" style={{ color: "red" }} variant="dot">
                {isStarted ? "Streaming" : "Off"}
              </Chip>
            </CardFooter>
            <Button isIconOnly className="absolute bottom-0 right-1" variant="faded" onClick={toggleFullScreen}>
              {/*<IonIcon size="large" icon={isFullScreen ? chevronCollapseOutline : chevronExpandOutline}></IonIcon>*/}
            </Button>
          </Card>
        </div>
      </div>

      <div className="flex gap-4">
        <Button color="success" disabled={isStarted} onPress={handleStartCamera}>
          Start Camera
        </Button>
        <Button color="danger" disabled={!isStarted} onPress={handleStopCamera}>
          Stop Camera
        </Button>
      </div>
    </div>
  );
};

export default ServerCamera;
