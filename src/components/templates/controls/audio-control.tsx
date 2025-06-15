import { useRef, useState } from "react";

import { CardContent, CardHeader } from "@/components/ui/card.tsx";
import HolographicButton from "@/components/atoms/holographic-button.tsx";
import HolographicContainer from "@/components/atoms/holographic-container.tsx";

class WavRecorder {
  private chunks: Int16Array[];
  private readonly sampleRate: number;
  private readonly numChannels: number;
  private recordingStartTime: number;

  constructor(sampleRate = 44100, numChannels = 2) {
    this.chunks = [];
    this.sampleRate = sampleRate;
    this.numChannels = numChannels;
    this.recordingStartTime = 0;
  }

  startRecording() {
    this.chunks = [];
    this.recordingStartTime = Date.now();
  }

  addData(data: Int16Array) {
    this.chunks.push(data);
  }

  stopRecording(): Blob {
    const totalLength = this.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const fullBuffer = new Int16Array(totalLength);
    let offset = 0;

    for (const chunk of this.chunks) {
      fullBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Create WAV header
    const bytesPerSample = 2;
    const blockAlign = this.numChannels * bytesPerSample;
    const byteRate = this.sampleRate * blockAlign;
    const dataSize = fullBuffer.length * bytesPerSample;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF"); // RIFF identifier
    view.setUint32(4, totalSize - 8, true); // File size - 8
    writeString(8, "WAVE"); // WAVE identifier
    writeString(12, "fmt "); // fmt chunk
    view.setUint32(16, 16, true); // Length of format data
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, this.numChannels, true); // Number of channels
    view.setUint32(24, this.sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bytesPerSample * 8, true); // Bits per sample
    writeString(36, "data"); // data chunk
    view.setUint32(40, dataSize, true); // Data size

    // Write audio data
    const audioData = new Int16Array(buffer, headerSize);

    audioData.set(fullBuffer);

    this.chunks = [];

    return new Blob([buffer], { type: "audio/wav" });
  }

  getDuration(): number {
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }
}

interface AudioControlProps {
  hostConnection: string | null;
}

const AudioControl = ({ hostConnection }: AudioControlProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [debugInfo, setDebugMsg] = useState<string[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const recorderRef = useRef<WavRecorder>(new WavRecorder());

  const addDebugMessage = (message: string) => {
    setDebugMsg((prev) => [...prev.slice(-4), message]);
  };

  const startRecording = async () => {
    if (!hostConnection) return;

    try {
      recorderRef.current = new WavRecorder();
      recorderRef.current.startRecording();
      recordingStartTimeRef.current = Date.now();

      const socket = new WebSocket(`ws://${hostConnection}/sensors/ears/ws`);

      socketRef.current = socket;

      socket.onopen = () => {
        addDebugMessage("Recording WebSocket connected");
        socket.send("Basic " + btoa("admin:password"));
      };

      socket.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          const int16Array = new Int16Array(arrayBuffer);

          recorderRef.current.addData(int16Array);
        } else if (event.data === "Authenticated") {
          addDebugMessage("Recording started");
          socket.send("start_audio");
          setIsRecording(true);
          timerRef.current = window.setInterval(() => {
            setRecordingDuration(recorderRef.current.getDuration());
          }, 1000);
        }
      };

      socket.onclose = () => {
        addDebugMessage("Recording WebSocket closed");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      socket.onerror = (error) => {
        addDebugMessage(`Recording error: ${error.type}`);
        stopRecording();
      };
    } catch (error: any) {
      addDebugMessage(`Recording error: ${error.message}`);
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send("stop_audio");
      socketRef.current.close();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const wavBlob = recorderRef.current.stopRecording();
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `recording_${new Date().toISOString()}.wav`;
      a.click();
      URL.revokeObjectURL(url);

      setIsRecording(false);
      setRecordingDuration(0);
      addDebugMessage("Recording saved successfully");
    } catch (error: any) {
      addDebugMessage(`Error saving recording: ${error.message}`);
    }
  };

  return (
    <>
      <div className="w-full flex flex-row gap-4 items-center flex-wrap">
        <HolographicButton
          variant={isRecording ? "danger" : "primary"}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </HolographicButton>

        {isRecording && (
          <span className="text-sm">
            Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
          </span>
        )}
      </div>

      <HolographicContainer>
        <CardHeader>
          <h3 className="text-sm font-semibold">Debug Log</h3>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">
            {debugInfo.map((msg, i) => (
              <div key={i} className="font-mono">
                {msg}
              </div>
            ))}
          </div>
        </CardContent>
      </HolographicContainer>
    </>
  );
};

export default AudioControl;
