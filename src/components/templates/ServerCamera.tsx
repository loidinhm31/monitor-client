import React, { useEffect, useRef, useState } from 'react';

const ServerCamera = () => {
  const wsRef = useRef(null);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const userId = useRef(Math.random().toString(36).substring(7));
  const room = 'default-room';

  useEffect(() => {
    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${`127.0.0.1:8081`}/ws`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      sendToServer({
        event: 'join',
        room: room,
        from: userId.current,
        data: ''
      });
    };

    wsRef.current.onmessage = handleSignalingMessage;

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Please try refreshing the page.');
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');
      setError('Connection closed. Please refresh the page to reconnect.');
    };
  };

  const handleSignalingMessage = (message) => {
    try {
      const msg = JSON.parse(message.data);

      if (msg.event === 'camera-frame' && msg.from === 'server-camera') {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = 'data:image/jpeg;base64,' + msg.data;
        }
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  };

  const sendToServer = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-100 rounded">
          {error}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full bg-gray-800 rounded-lg aspect-video"
        width={320}
        height={240}
      />
    </div>
  );
};

export default ServerCamera;