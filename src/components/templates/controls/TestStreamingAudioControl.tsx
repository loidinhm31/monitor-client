import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import React, { useEffect, useRef, useState } from "react";

class AudioStreamPlayer {
  private audioContext: AudioContext | null;
  private sourceNode: AudioBufferSourceNode | null;
  private bufferQueue: Float32Array[];
  private isPlaying: boolean;
  private readonly sampleRate: number;
  private readonly channels: number;
  private readonly bufferSize: number;
  private scheduledTime: number;
  private nextScheduleTime: number;
  private readonly scheduleAheadTime: number;
  private processingInterval: number;

  constructor(sampleRate = 44100, channels = 2, bufferSize = 4096) {
    this.audioContext = null;
    this.sourceNode = null;
    this.bufferQueue = [];
    this.isPlaying = false;
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.bufferSize = bufferSize;
    this.scheduledTime = 0;
    this.nextScheduleTime = 0;
    this.scheduleAheadTime = 0.1;
    this.processingInterval = null;
  }

  async initialize() {
    try {
      await this.cleanup();

      if (typeof AudioContext !== "undefined") {
        this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
      } else if (typeof (window as any).webkitAudioContext !== "undefined") {
        this.audioContext = new (window as any).webkitAudioContext({ sampleRate: this.sampleRate });
      } else {
        throw new Error("AudioContext not supported");
      }

      // Suspend immediately after creation
      await this.audioContext.suspend();

      await this.createInitialBuffer();
      this.startProcessing();
    } catch (error) {
      console.error("Initialization error:", error);
      throw error;
    }
  }

  async processAudioData(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }

    try {
      // Convert Int16Array to Float32Array
      const int16Data = new Int16Array(arrayBuffer);
      const floatData = new Float32Array(int16Data.length);

      for (let i = 0; i < int16Data.length; i++) {
        // Convert from Int16 (-32768 to 32767) to Float32 (-1 to 1)
        floatData[i] = int16Data[i] / 32768.0;
      }

      // Add to buffer queue
      this.bufferQueue.push(floatData);

      // Start playing if not already
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.nextScheduleTime = this.audioContext.currentTime;
        this.scheduleBuffers();
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      throw error;
    }
  }

  private async createInitialBuffer() {
    if (!this.audioContext) return;

    // Create a short silent buffer
    const silentBuffer = this.audioContext.createBuffer(this.channels, this.bufferSize, this.sampleRate);

    // Add some very quiet noise to prevent complete silence
    for (let channel = 0; channel < this.channels; channel++) {
      const channelData = silentBuffer.getChannelData(channel);

      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() - 0.5) * 0.0001; // Very quiet white noise
      }
    }

    // Convert to Float32Array and add to queue
    const initialData = new Float32Array(silentBuffer.length * this.channels);

    for (let i = 0; i < silentBuffer.length; i++) {
      for (let channel = 0; channel < this.channels; channel++) {
        initialData[i * this.channels + channel] = silentBuffer.getChannelData(channel)[i];
      }
    }

    // Add multiple copies of initial buffer to ensure smooth start
    for (let i = 0; i < 3; i++) {
      this.bufferQueue.push(initialData);
    }
  }

  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.scheduleBuffers();
    }, 50); // Check every 50ms
  }

  private scheduleBuffers() {
    if (!this.audioContext || !this.isPlaying || this.bufferQueue.length === 0) return;

    const currentTime = this.audioContext.currentTime;

    while (this.nextScheduleTime < currentTime + this.scheduleAheadTime) {
      const buffer = this.bufferQueue.shift();

      if (!buffer) break;

      this.scheduleBuffer(buffer, this.nextScheduleTime);
      this.nextScheduleTime += buffer.length / (this.channels * this.sampleRate);
    }
  }

  private scheduleBuffer(pcmData: Float32Array, startTime: number) {
    if (!this.audioContext) return;

    try {
      // Create AudioBuffer
      const audioBuffer = this.audioContext.createBuffer(
        this.channels,
        pcmData.length / this.channels,
        this.sampleRate,
      );

      // Fill audio buffer
      for (let channel = 0; channel < this.channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);

        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = pcmData[i * this.channels + channel];
        }
      }

      // Create and schedule source
      const source = this.audioContext.createBufferSource();

      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(startTime);

      // Cleanup when done
      source.onended = () => {
        source.disconnect();
      };
    } catch (error) {
      console.error("Error scheduling buffer:", error);
    }
  }

  async stop() {
    try {
      this.isPlaying = false;

      // Clear the buffer queue
      this.bufferQueue = [];

      // Stop the processing interval
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }

      await this.suspend();
    } catch (error) {
      console.warn("Error in stop:", error);
    }
  }

  private async cleanup() {
    this.isPlaying = false;
    this.bufferQueue = [];

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.audioContext?.state !== "closed") {
      try {
        await this.audioContext?.close();
      } catch (error) {
        console.warn("Error closing AudioContext:", error);
      }
    }

    this.audioContext = null;
    this.sourceNode = null;
  }

  async resume() {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async suspend() {
    if (this.audioContext?.state === "running") {
      await this.audioContext.suspend();
    }
  }

  getAudioState(): string {
    return this.audioContext?.state || "closed";
  }

  getBufferQueueSize(): number {
    return this.bufferQueue.length;
  }
}
interface AudioStreamProps {
  hostConnection: string | null;
  onError?: (error: Error) => void;
}

const TestAudioStreamPlayer = ({ hostConnection, onError }: AudioStreamProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugInfo, setDebugMsg] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [bufferSize, setBufferSize] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<AudioStreamPlayer>(new AudioStreamPlayer());
  const bufferUpdateInterval = useRef<number | undefined>(undefined);
  const [countdown, setCountdown] = useState<number | null>(null);

  const addDebugMessage = (message: string) => {
    setDebugMsg((prev) => {
      const newMessages = [...prev.slice(-4), message];

      console.log("Debug:", message);

      return newMessages;
    });
  };

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = async () => {
    try {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (bufferUpdateInterval.current) {
        clearInterval(bufferUpdateInterval.current);
        bufferUpdateInterval.current = null;
      }
      await playerRef.current.stop();
    } catch (error) {
      console.warn("Cleanup error:", error);
    }
  };

  const updateBufferSize = () => {
    setBufferSize(playerRef.current.getBufferQueueSize());
  };

  const startPlayback = async () => {
    if (!socketRef.current) return;

    addDebugMessage("Starting audio in 5 seconds...");

    // Start countdown
    setCountdown(8);
    for (let i = 8; i > 0; i--) {
      setCountdown(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    // Resume audio context and start streaming
    await playerRef.current.resume();
    socketRef.current.send("start_audio");
    setIsPlaying(true);
    addDebugMessage("Audio streaming started");

    // Start buffer size monitoring
    bufferUpdateInterval.current = setInterval(() => {
      setBufferSize(playerRef.current.getBufferQueueSize());
    }, 1000);
  };

  const startPlaying = async () => {
    if (!hostConnection || isInitializing) return;

    setIsInitializing(true);
    try {
      await cleanupResources();
      await playerRef.current.initialize();

      const socket = new WebSocket(`ws://${hostConnection}/sensors/ears/ws`);

      socketRef.current = socket;

      socket.onopen = () => {
        addDebugMessage("Audio WebSocket connected");
        socket.send("Basic " + btoa("admin:password"));
      };

      socket.onmessage = async (event) => {
        try {
          if (event.data instanceof Blob) {
            const arrayBuffer = await event.data.arrayBuffer();

            await playerRef.current.processAudioData(arrayBuffer);
            updateBufferSize();
          } else if (event.data === "Authenticated") {
            addDebugMessage("Authentication successful");
            startPlayback(); // Start the delayed playback process
          }
        } catch (error) {
          handleError(error as Error);
        }
      };

      socket.onclose = () => {
        addDebugMessage("Audio WebSocket closed");
        stopPlaying();
      };

      socket.onerror = (error) => {
        handleError(new Error(`WebSocket error: ${error.type}`));
        stopPlaying();
      };
    } catch (error) {
      handleError(error as Error);
      stopPlaying();
    } finally {
      setIsInitializing(false);
    }
  };

  const stopPlaying = async () => {
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send("stop_audio");
        socketRef.current.close();
        socketRef.current = null;
      }
      if (bufferUpdateInterval.current) {
        clearInterval(bufferUpdateInterval.current);
        bufferUpdateInterval.current = null;
      }

      await playerRef.current.stop();
      setIsPlaying(false);
      setBufferSize(0);
      setCountdown(null);
      addDebugMessage("Audio streaming stopped");
    } catch (error) {
      handleError(error as Error);
    }
  };

  const handleError = (error: Error) => {
    console.error("Audio player error:", error);
    addDebugMessage(`Error: ${error.message}`);
    if (onError) {
      onError(error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4 items-center flex-wrap">
        <Button
          color={isPlaying ? "danger" : "primary"}
          disabled={!hostConnection}
          isLoading={isInitializing || countdown !== null}
          onClick={() => (isPlaying ? stopPlaying() : startPlaying())}
        >
          {isInitializing
            ? "Initializing..."
            : countdown !== null
              ? `Starting in ${countdown}...`
              : isPlaying
                ? "Stop Audio"
                : "Start Audio"}
        </Button>
        {isPlaying && <span className="text-sm">Buffer Size: {bufferSize}</span>}
      </div>

      <Card>
        <CardHeader>
          <div className="font-semibold">Debug Log</div>
        </CardHeader>
        <CardBody>
          <div className="space-y-1">
            {debugInfo.map((msg, i) => (
              <div key={i} className="font-mono text-small">
                {msg}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TestAudioStreamPlayer;
