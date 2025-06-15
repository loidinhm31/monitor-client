import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { useRef, useState } from "react";

import HolographicButton from "@/components/atoms/holographic-button.tsx";

interface SaveDataControlProps {
  getCurrentFrame: () => string | null;
  isStreaming: boolean;
}

const SaveDataControl = ({ getCurrentFrame, isStreaming }: SaveDataControlProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [recording, setRecording] = useState<boolean>(false);
  const [lastCaptureTime, setLastCaptureTime] = useState<string>("");

  const ensureDirectoryExists = async (path: string) => {
    const parts = path.split("/").filter((part) => part !== "");
    let currentPath = "";

    for (const part of parts) {
      currentPath += `/${part}`;
      try {
        await Filesystem.mkdir({
          path: currentPath,
          directory: Directory.Documents,
          recursive: false,
        });
      } catch (error) {
        // Directory might already exist, which is fine
        console.log(`Directory ${currentPath} might already exist`);
      }
    }
  };

  const captureCurrentFrame = (): string | null => {
    // Get the current frame from the main camera
    const frameData = getCurrentFrame();

    if (!frameData) {
      console.error("No frame data available from camera");

      return null;
    }

    const canvas = captureCanvasRef.current;

    if (!canvas) {
      console.error("Capture canvas not available");

      return null;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Canvas context not available");

      return null;
    }

    try {
      const img = new Image();

      // This needs to be synchronous for capture, so we'll use a different approach
      // We'll draw directly from the provided frame data
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };

      img.src = frameData;

      // Return the frame data for immediate use
      return frameData;
    } catch (error) {
      console.error("Error capturing frame:", error);

      return null;
    }
  };

  const captureImage = async () => {
    if (!isStreaming) {
      alert("Camera is not streaming");

      return;
    }

    try {
      const frameData = captureCurrentFrame();

      if (!frameData) {
        alert("No frame available to capture");

        return;
      }

      const path = "monitor-client/images/";
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "_").split(".")[0];
      const fileName = `captured-image_${timestamp}.jpg`;

      if (Capacitor.getPlatform() === "android") {
        // Extract base64 data
        const base64Data = frameData.split(",")[1];

        await ensureDirectoryExists(path);

        await Filesystem.writeFile({
          path: path + fileName,
          data: base64Data,
          directory: Directory.Documents,
        });

        setLastCaptureTime(now.toLocaleTimeString());
        alert("Image saved to device");
      } else {
        // For web platforms - convert to blob and download
        const response = await fetch(frameData);
        const blob = await response.blob();

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        setLastCaptureTime(now.toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      alert(`Error capturing image: ${error}`);
    }
  };

  const startRecording = () => {
    if (!isStreaming) {
      alert("Camera is not streaming");

      return;
    }

    const canvas = captureCanvasRef.current;

    if (!canvas) {
      alert("Capture canvas not available");

      return;
    }

    try {
      // Start capturing frames at intervals for recording
      const recordingInterval = setInterval(() => {
        if (!recording) {
          clearInterval(recordingInterval);

          return;
        }

        const frameData = getCurrentFrame();

        if (frameData && canvas) {
          const ctx = canvas.getContext("2d");

          if (ctx) {
            const img = new Image();

            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = frameData;
          }
        }
      }, 100); // Capture at 10fps for recording

      // Capture stream from canvas
      const stream = canvas.captureStream(10); // 10fps

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        clearInterval(recordingInterval);

        try {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const now = new Date();
          const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "_").split(".")[0];
          const fileName = `recorded-video_${timestamp}.webm`;
          const path = "monitor-client/videos/";

          if (Capacitor.isNativePlatform()) {
            const reader = new FileReader();

            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(",")[1];

              await ensureDirectoryExists(path);
              await Filesystem.writeFile({
                path: path + fileName,
                data: base64Data,
                directory: Directory.Documents,
              });
              alert("Video saved to device");
            };

            reader.readAsDataURL(blob);
          } else {
            // For web platforms
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
          }

          // Reset chunks for next recording
          recordedChunksRef.current = [];
        } catch (error) {
          console.error("Error saving video:", error);
          alert(`Error saving video: ${error}`);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);

      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(`Error starting recording: ${error}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);

      // Stop all tracks in the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      console.log("Recording stopped");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden canvas used only for capture/recording */}
      <canvas ref={captureCanvasRef} height={480} style={{ display: "none" }} width={640} />

      {/* Status indicator */}
      <div className="text-center">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className={`font-mono ${isStreaming ? "text-green-400" : "text-red-400"}`}>
              Stream: {isStreaming ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <span className="text-cyan-400/70">Last Capture:</span>
            <span className="ml-1 text-cyan-400 text-xs">{lastCaptureTime || "None"}</span>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-4 justify-center">
        <HolographicButton disabled={!isStreaming} variant="primary" onClick={captureImage}>
          Capture Image
        </HolographicButton>

        <HolographicButton
          disabled={!isStreaming}
          variant={recording ? "danger" : "primary"}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </HolographicButton>
      </div>

      {/* Recording status */}
      {recording && (
        <div className="text-center">
          <span className="text-red-400 font-mono text-sm animate-pulse">● RECORDING</span>
        </div>
      )}
    </div>
  );
};

export default SaveDataControl;
