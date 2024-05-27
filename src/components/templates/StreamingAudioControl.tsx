import { Button } from "@nextui-org/button";
import React, { useEffect, useRef, useState } from "react";

interface StreamingControlProps {
  hostConnection: string | null;
}

const StreamingVideoControl = ({ hostConnection }: StreamingControlProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const audioBufferQueueRef = useRef<Float32Array[]>([]);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  const auth = "Basic " + btoa("admin:password");

  useEffect(() => {
    let socket: WebSocket;
    if (hostConnection !== null && isAudioContextReady) {
      socket = new WebSocket(`ws://${hostConnection}/sensors/ears/ws`);

      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connection established.");
        socket.send(auth);
      };

      socket.onmessage = (e) => {
        if (e.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);
            processAudioData(bytes);
          };
          reader.readAsArrayBuffer(e.data);
        }
      };

      socket.onclose = () => console.log("WebSocket connection closed.");
    }
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [hostConnection, isAudioContextReady]);

  const handleAudioData = (data: ArrayBuffer) => {
    if (audioContextRef) {
      audioContextRef.current.decodeAudioData(
        data,
        (buffer) => {
          const audioBufferSourceNode = audioContextRef.current.createBufferSource();
          audioBufferSourceNode.buffer = buffer;
          audioBufferSourceNode.connect(audioContextRef.current.destination);
          audioBufferSourceNode.start();
        },
        (error) => {
          console.error("Error decoding audio data", error);
        },
      );
    }
  };

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
    if (socketRef.current !== null) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send("start_audio");
      }
    }
  };

  const stopAudioStream = () => {
    if (socketRef.current !== null) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send("stop_audio");
      }
    }
  };

  return (
    <div className="w-full flex flex-col flex-wrap gap-4">
      <div className="w-full flex flex-row flex-wrap gap-4">
        {!isAudioContextReady && <Button onClick={initializeAudioContext}>Start Audio</Button>}

        {isAudioContextReady && (
          <>
            <Button onClick={startAudioStream}>Turn On Audio</Button>
            <Button onClick={stopAudioStream}>Turn Off Audio</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default StreamingVideoControl;
