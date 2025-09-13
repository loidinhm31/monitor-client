import { useRef, useState } from "react";
import { TauriFs, TauriPath } from "@repo/ui/types/tauri-type";
import { Button } from "@repo/ui/components/atoms/button";

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

  // Check if we're in a Tauri environment
  const isTauri = (): boolean => {
    return typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
  };

  const ensureDirectoryExists = async (path: string): Promise<void> => {
    if (!isTauri()) {
      console.log("Not in Tauri environment, skipping directory creation");

      return;
    }

    try {
      const fs = (await import("@tauri-apps/plugin-fs")) as TauriFs;
      const dirExists = await fs.exists(path);

      if (!dirExists) {
        await fs.mkdir(path, { recursive: true });
        console.log(`Directory created: ${path}`);
      }
    } catch (error) {
      console.log(`Error with directory: ${path}`, error);
    }
  };

  const captureCurrentFrame = async (): Promise<void> => {
    if (!isStreaming) {
      alert("Camera is not streaming");

      return;
    }

    const frameData = getCurrentFrame();

    if (!frameData) {
      console.error("No frame data available from camera");
      alert("No frame data available");

      return;
    }

    // Validate frame data format
    if (!frameData.includes("data:") || !frameData.includes(",")) {
      console.error("Invalid frame data format");
      alert("Invalid frame data format");

      return;
    }

    try {
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "_").split(".")[0];
      const fileName = `captured-image_${timestamp}.jpg`;

      if (isTauri()) {
        // Tauri native file saving
        const pathModule = (await import("@tauri-apps/api/path")) as TauriPath;
        const fsModule = (await import("@tauri-apps/plugin-fs")) as TauriFs;

        const downloadsPath = await pathModule.downloadDir();
        const dirPath = `${downloadsPath}monitor-client/images`;
        const fullPath = `${dirPath}/${fileName}`;

        await ensureDirectoryExists(dirPath);

        // Extract base64 data and convert to Uint8Array
        const base64Data = frameData.split(",")[1];

        if (!base64Data) {
          throw new Error("Invalid image data format");
        }

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        await fsModule.writeFile(fullPath, bytes);
        alert(`Image saved to: ${fullPath}`);
      } else {
        // Web browser file download
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

        alert(`Image downloaded: ${fileName}`);
      }

      setLastCaptureTime(now.toLocaleTimeString());
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

          if (isTauri()) {
            // Tauri native file saving
            const pathModule = (await import("@tauri-apps/api/path")) as TauriPath;
            const fsModule = (await import("@tauri-apps/plugin-fs")) as TauriFs;

            const downloadsPath = await pathModule.downloadDir();
            const dirPath = `${downloadsPath}monitor-client/videos`;
            const fullPath = `${dirPath}/${fileName}`;

            await ensureDirectoryExists(dirPath);

            // Convert blob to Uint8Array
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            await fsModule.writeFile(fullPath, uint8Array);
            alert(`Video saved to: ${fullPath}`);
          } else {
            // Web browser file download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert(`Video downloaded: ${fileName}`);
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

      {/* Control buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button disabled={!isStreaming} variant="holographic" onClick={captureCurrentFrame}>
          Capture Image
        </Button>

        <Button
          disabled={!isStreaming}
          variant={recording ? "holographic-destructive" : "holographic"}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </Button>
      </div>

      {/* Status information */}
      <div className="text-xs text-gray-400">
        Environment: {isTauri() ? "Tauri Native" : "Web Browser"}
        {lastCaptureTime && <div>Last capture: {lastCaptureTime}</div>}
      </div>

      {recording && <div className="text-xs text-red-400">Recording in progress...</div>}
    </div>
  );
};

export default SaveDataControl;
