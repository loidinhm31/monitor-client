import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import HolographicButton from "@repo/ui/components/atoms/holographic-button";

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

  // Tauri command để tạo thư mục nếu cần
  const ensureDirectoryExists = async (path: string): Promise<boolean> => {
    try {
      // Gọi custom Tauri command để tạo thư mục
      await invoke('ensure_directory', { path });
      return true;
    } catch (error) {
      console.log(`Không thể tạo thư mục ${path}:`, error);
      return false;
    }
  };

  // Tauri command để lưu file
  const saveFileWithTauri = async (fileName: string, data: string, path: string): Promise<boolean> => {
    try {
      await invoke('save_file', {
        fileName,
        data,
        path
      });
      return true;
    } catch (error) {
      console.error('Lỗi khi lưu file với Tauri:', error);
      return false;
    }
  };

  const captureCurrentFrame = (): string | null => {
    // Lấy frame hiện tại từ camera chính
    const frameData = getCurrentFrame();

    if (!frameData) {
      console.error("Không có dữ liệu frame từ camera");
      return null;
    }

    const canvas = captureCanvasRef.current;

    if (!canvas) {
      console.error("Canvas capture không khả dụng");
      return null;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Canvas context không khả dụng");
      return null;
    }

    // Vẽ frame vào canvas
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = frameData;

    return frameData;
  };

  const captureImage = async () => {
    if (!isStreaming) {
      alert("Camera không đang streaming");
      return;
    }

    try {
      const frameData = captureCurrentFrame();

      if (!frameData) {
        alert("Không thể capture frame");
        return;
      }

      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, "_").replace(/:/g, "_").split(".")[0];
      const fileName = `captured-image_${timestamp}.jpg`;
      const path = "monitor-client/images/";

      // Kiểm tra môi trường Tauri
      if (window.__TAURI__) {
        // Chạy trong môi trường Tauri
        const base64Data = frameData.split(",")[1];

        await ensureDirectoryExists(path);

        const success = await saveFileWithTauri(fileName, base64Data, path);

        if (success) {
          setLastCaptureTime(now.toLocaleTimeString());
          alert("Hình ảnh đã được lưu vào thiết bị");
        } else {
          alert("Lỗi khi lưu hình ảnh");
        }
      } else {
        // Fallback cho web browser - tải xuống file
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
        alert("Hình ảnh đã được tải xuống");
      }
    } catch (error) {
      console.error("Lỗi khi capture hình ảnh:", error);
      alert(`Lỗi khi capture hình ảnh: ${error}`);
    }
  };

  const startRecording = () => {
    if (!isStreaming) {
      alert("Camera không đang streaming");
      return;
    }

    const canvas = captureCanvasRef.current;

    if (!canvas) {
      alert("Canvas capture không khả dụng");
      return;
    }

    try {
      // Bắt đầu capture frames theo khoảng thời gian cho việc ghi
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
      }, 100); // Capture ở 10fps cho việc ghi

      // Capture stream từ canvas
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

          if (window.__TAURI__) {
            // Chạy trong môi trường Tauri
            const reader = new FileReader();

            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(",")[1];

              await ensureDirectoryExists(path);
              const success = await saveFileWithTauri(fileName, base64Data, path);

              if (success) {
                alert("Video đã được lưu vào thiết bị");
              } else {
                alert("Lỗi khi lưu video");
              }
            };

            reader.readAsDataURL(blob);
          } else {
            // Fallback cho web browser - tải xuống file
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
            alert("Video đã được tải xuống");
          }

          // Reset chunks cho lần ghi tiếp theo
          recordedChunksRef.current = [];
        } catch (error) {
          console.error("Lỗi khi lưu video:", error);
          alert(`Lỗi khi lưu video: ${error}`);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);

      console.log("Bắt đầu ghi");
    } catch (error) {
      console.error("Lỗi khi bắt đầu ghi:", error);
      alert(`Lỗi khi bắt đầu ghi: ${error}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);

      // Dừng tất cả tracks trong stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      console.log("Dừng ghi");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas ẩn chỉ dùng cho capture/recording */}
      <canvas ref={captureCanvasRef} height={480} style={{ display: "none" }} width={640} />

      {/* Thông tin trạng thái */}
      <div className="text-center">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className={`font-mono ${isStreaming ? "text-green-400" : "text-red-400"}`}>
              Stream: {isStreaming ? "ON" : "OFF"}
            </span>
          </div>
          <div>
            <span className={`font-mono ${recording ? "text-red-400" : "text-cyan-400"}`}>
              Recording: {recording ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      </div>

      {/* Các nút điều khiển */}
      <div className="flex gap-2 justify-center">
        <HolographicButton
          disabled={!isStreaming}
          size="sm"
          variant="primary"
          onClick={captureImage}
        >
          Capture Ảnh
        </HolographicButton>

        <HolographicButton
          disabled={!isStreaming}
          size="sm"
          variant={recording ? "danger" : "primary"}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? "Dừng Ghi" : "Bắt Đầu Ghi"}
        </HolographicButton>
      </div>

      {lastCaptureTime && (
        <div className="text-center text-xs text-cyan-400">
          Lần capture cuối: {lastCaptureTime}
        </div>
      )}
    </div>
  );
};

export default SaveDataControl;