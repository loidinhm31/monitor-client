import { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Maximize, Minimize } from "lucide-react";
import { CardFooter } from "@repo/ui/components/ui/card";
import HolographicButton from "@repo/ui/components/atoms/holographic-button";
import HolographicContainer from "@repo/ui/components/atoms/holographic-container";
import StatusIndicator from "@repo/ui/components/atoms/status-indicator";
import StreamingVideoControl from "@repo/ui/components/templates/controls/streaming-video-control";

interface ServerCameraProps {
  hostConnection: string | null;
}

const ServerCamera = ({ hostConnection }: ServerCameraProps) => {
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userId = useRef(Math.random().toString(36).substring(7));
  const room = "default-room";

  // Store the latest frame data for capture purposes
  const latestFrameRef = useRef<string | null>(null);

  const [error, setError] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  const [frameCount, setFrameCount] = useState<number>(0);
  const [lastFrameTime, setLastFrameTime] = useState<string>("");
  const [fps, setFps] = useState<number>(0);

  // FPS calculation
  const frameTimestamps = useRef<number[]>([]);

  useEffect(() => {
    if (hostConnection) {
      initializeWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [hostConnection]);

  const calculateFPS = () => {
    const now = Date.now();

    frameTimestamps.current.push(now);

    // Keep only the last second worth of timestamps
    frameTimestamps.current = frameTimestamps.current.filter((timestamp) => now - timestamp < 1000);

    setFps(frameTimestamps.current.length);
  };

  const initializeWebSocket = () => {
    if (!hostConnection) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${hostConnection}/ws`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setConnectionStatus("Connected");
        setError("");

        sendToServer({
          event: "join",
          room: room,
          from: userId.current,
          data: "",
        });
      };

      wsRef.current.onmessage = handleSignalingMessage;

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error. Please try refreshing the page.");
        setConnectionStatus("Error");
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setError("Connection closed. Please refresh the page to reconnect.");
        setIsStarted(false);
        setConnectionStatus("Disconnected");
        latestFrameRef.current = null;
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setError("Failed to create connection. Please check the host address.");
      setConnectionStatus("Failed");
    }
  };

  const handleSignalingMessage = (message: MessageEvent) => {
    try {
      const msg = JSON.parse(message.data);

      if (msg.event === "camera-frame" && msg.from === "server-camera") {
        const canvas = canvasRef.current;

        if (canvas) {
          const ctx = canvas.getContext("2d");

          if (ctx) {
            const img = new Image();

            img.onload = () => {
              try {
                // Clear canvas first
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw the new frame
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Store the latest frame for capture purposes
                const frameDataUrl = "data:image/jpeg;base64," + msg.data;

                latestFrameRef.current = frameDataUrl;

                // Update frame count and timestamp
                setFrameCount((prev) => prev + 1);
                setLastFrameTime(new Date().toLocaleTimeString());
                calculateFPS();

                // Clear any previous errors
                if (error) setError("");
              } catch (drawError) {
                console.error("Error drawing frame to canvas:", drawError);
                setError("Error rendering frame");
              }
            };

            img.onerror = (imgError) => {
              console.error("Error loading frame image:", imgError);
              setError("Error loading frame data");
            };

            // Set the image source with base64 data
            img.src = "data:image/jpeg;base64," + msg.data;
          } else {
            console.error("Canvas context not available");
            setError("Canvas context not available");
          }
        } else {
          console.error("Canvas not available");
          setError("Canvas not available");
        }
      } else {
        console.log("Received non-frame message:", msg);
      }
    } catch (e) {
      console.error("Error handling message:", e);
      setError("Error processing message");
    }
  };

  const sendToServer = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log("Sent message to server:", message.event);
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Error sending command to server");
      }
    } else {
      console.error("WebSocket not ready, state:", wsRef.current?.readyState);
      setError("Connection not ready");
    }
  };

  // Function to provide current frame to capture components
  const getCurrentFrame = (): string | null => {
    return latestFrameRef.current;
  };

  const handleStartCamera = () => {
    console.log("Starting camera...");
    sendToServer({
      event: "start-camera",
      room: room,
      from: userId.current,
      data: "",
    });
    setIsStarted(true);
    setFrameCount(0);
    setFps(0);
    frameTimestamps.current = [];
    setError("");
    latestFrameRef.current = null;
  };

  const handleStopCamera = () => {
    console.log("Stopping camera...");
    sendToServer({
      event: "stop-camera",
      room: room,
      from: userId.current,
      data: "",
    });
    setIsStarted(false);
    setFrameCount(0);
    setFps(0);
    setLastFrameTime("");
    frameTimestamps.current = [];
    latestFrameRef.current = null;
  };

  const enterFullScreen = () => {
    if (canvasRef.current && canvasRef.current.requestFullscreen) {
      canvasRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullScreen(true);
        })
        .catch((error) => {
          console.error("Error entering fullscreen:", error);
          setError("Could not enter fullscreen mode");
        });
    }
  };

  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullScreen(false);
        })
        .catch((error) => {
          console.error("Error exiting fullscreen:", error);
        });
    }
  };

  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="flex flex-col items-center w-full gap-4">
      {/* Error Display */}
      {error && (
        <HolographicContainer className="w-full p-4" variant="dark">
          <div className="text-red-400 text-sm font-mono bg-red-400/10 border border-red-400/30 rounded p-2">
            {error}
          </div>
        </HolographicContainer>
      )}

      {/* Connection Status */}
      <HolographicContainer className="w-full p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-cyan-400">Camera Stream</h3>
          <div className="flex items-center gap-2">
            <StatusIndicator online={connectionStatus === "Connected" && isStarted} />
            <span className="text-xs font-mono text-cyan-400">{connectionStatus}</span>
          </div>
        </div>

        {isStarted && (
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-cyan-400/70">Frames:</span>
              <span className="ml-2 text-cyan-400">{frameCount}</span>
            </div>
            <div>
              <span className="text-cyan-400/70">FPS:</span>
              <span className="ml-2 text-cyan-400">{fps}</span>
            </div>
            <div>
              <span className="text-cyan-400/70">Last Frame:</span>
              <span className="ml-2 text-cyan-400 text-xs">{lastFrameTime || "None"}</span>
            </div>
          </div>
        )}
      </HolographicContainer>

      {/* Main Camera Display */}
      <HolographicContainer className="w-full flex flex-col gap-4 p-4">
        <div ref={imageContainerRef} className="mx-auto flex justify-center relative">
          <div className="relative border-2 border-cyan-400/30 rounded-lg overflow-hidden bg-black">
            <TransformWrapper>
              <TransformComponent>
                <canvas
                  ref={canvasRef}
                  className={`object-contain transition-transform duration-300 ${
                    isFullScreen ? "w-full h-full" : "max-w-full max-h-full"
                  }`}
                  height={480}
                  width={640}
                />
              </TransformComponent>
            </TransformWrapper>

            {/* Overlay Controls */}
            <CardFooter className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-2 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <StatusIndicator online={isStarted} pulse={isStarted} />
                  <span className="font-mono text-xs text-cyan-400">{isStarted ? "LIVE" : "OFFLINE"}</span>
                </div>

                {isStarted && (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-cyan-400/70">{frameCount} frames</span>
                    <span className="text-cyan-400/70">{fps} fps</span>
                  </div>
                )}
              </div>

              <HolographicButton size="sm" onClick={toggleFullScreen}>
                {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </HolographicButton>
            </CardFooter>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="flex gap-4 justify-center mt-2">
          <HolographicButton
            disabled={!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isStarted}
            variant="primary"
            onClick={handleStartCamera}
          >
            Start Camera
          </HolographicButton>

          <HolographicButton disabled={!isStarted} variant="danger" onClick={handleStopCamera}>
            Stop Camera
          </HolographicButton>
        </div>
      </HolographicContainer>

      {/* Capture Controls */}
      {wsRef.current && (
        <StreamingVideoControl getCurrentFrame={getCurrentFrame} isStreaming={isStarted} wsConnection={wsRef.current} />
      )}
    </div>
  );
};

export default ServerCamera;
