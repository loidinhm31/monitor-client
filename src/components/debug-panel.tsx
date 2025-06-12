import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Bug, RefreshCw, Trash2 } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";

interface DebugPanelProps {
  isSharing: boolean;
  isViewing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peers: Array<{ id: string; connection: RTCPeerConnection }>;
  connectionState: RTCPeerConnectionState;
  roomId: string;
  error: string | null;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
                                                 isSharing,
                                                 isViewing,
                                                 localStream,
                                                 remoteStream,
                                                 peers,
                                                 connectionState,
                                                 roomId,
                                                 error,
                                               }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Use useCallback to prevent function recreation on every render
  const addDebugMessage = useCallback((message: string) => {
    // Use functional update to avoid stale closure issues
    setLogs((prev) => [...prev.slice(-20), message]); // Keep last 20 logs
  }, []);

  // Capture console logs for debugging
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      if (
        args.some(
          (arg) =>
            typeof arg === "string" && (arg.includes("screen") || arg.includes("WebRTC") || arg.includes("peer"))
        )
      ) {
        // Use setTimeout to avoid setState during render
        setTimeout(() => {
          const timestamp = new Date().toLocaleTimeString();
          const message = `[${timestamp}] LOG: ${args.join(" ")}`;
          addDebugMessage(message);
        }, 0);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString();
        const message = `[${timestamp}] ERROR: ${args.join(" ")}`;
        addDebugMessage(message);
      }, 0);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString();
        const message = `[${timestamp}] WARN: ${args.join(" ")}`;
        addDebugMessage(message);
      }, 0);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [addDebugMessage]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getStreamInfo = useCallback((stream: MediaStream | null, label: string) => {
    if (!stream) return `${label}: None`;

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    return `${label}: ${videoTracks.length}V/${audioTracks.length}A (${stream.active ? "Active" : "Inactive"})`;
  }, []);

  const getPeerInfo = useCallback(() => {
    return peers.map((peer, index) => ({
      id: peer.id,
      state: peer.connection.connectionState,
      iceState: peer.connection.iceConnectionState,
      signalingState: peer.connection.signalingState,
    }));
  }, [peers]);

  const checkBrowserSupport = useCallback(() => {
    const features = [
      { name: "WebRTC", supported: !!window.RTCPeerConnection },
      { name: "getUserMedia", supported: !!navigator.mediaDevices?.getUserMedia },
      { name: "getDisplayMedia", supported: !!navigator.mediaDevices?.getDisplayMedia },
      { name: "BroadcastChannel", supported: "BroadcastChannel" in window },
      { name: "localStorage", supported: typeof Storage !== "undefined" },
      { name: "WebSocket", supported: "WebSocket" in window },
    ];

    return features;
  }, []);

  const checkLocalStorage = useCallback(() => {
    const keys = Object.keys(localStorage).filter((key) => key.includes("screen-share"));
    return keys.map((key) => ({ key, value: localStorage.getItem(key) }));
  }, []);

  if (!isExpanded) {
    return (
      <Card className="w-full">
        <CardBody>
          <Button
            size="sm"
            startContent={<Bug className="w-4 h-4" />}
            variant="flat"
            onClick={() => setIsExpanded(true)}
          >
            Show Debug Panel
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Debug Panel</h3>
          </div>
          <div className="flex gap-2">
            <Button isIconOnly size="sm" variant="flat" onClick={clearLogs}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button isIconOnly size="sm" variant="flat" onClick={() => setIsExpanded(false)}>
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Current State */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Current State</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Chip color={isSharing ? "success" : "default"} size="sm" variant="flat">
              Sharing: {isSharing ? "Yes" : "No"}
            </Chip>
            <Chip color={isViewing ? "primary" : "default"} size="sm" variant="flat">
              Viewing: {isViewing ? "Yes" : "No"}
            </Chip>
            <Chip color={peers.length > 0 ? "success" : "default"} size="sm" variant="flat">
              Peers: {peers.length}
            </Chip>
            <Chip color={connectionState === "connected" ? "success" : "warning"} size="sm" variant="flat">
              State: {connectionState}
            </Chip>
          </div>
          {roomId && (
            <p className="text-sm text-default-600">
              Room ID: <code className="bg-default-100 px-1 rounded">{roomId}</code>
            </p>
          )}
          {error && <p className="text-sm text-danger bg-danger-50 p-2 rounded">{error}</p>}
        </div>

        {/* Stream Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Streams</h4>
          <div className="text-sm space-y-1">
            <p>{getStreamInfo(localStream, "Local")}</p>
            <p>{getStreamInfo(remoteStream, "Remote")}</p>
          </div>
        </div>

        {/* Peer Connections */}
        {peers.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Peer Connections</h4>
            <div className="space-y-1">
              {getPeerInfo().map((peer, index) => (
                <div key={peer.id} className="text-sm bg-default-50 p-2 rounded">
                  <p>
                    <span className="font-medium">Peer {index + 1}:</span> {peer.id.substring(0, 8)}
                  </p>
                  <p>
                    <span className="font-medium">Connection:</span> {peer.state}
                  </p>
                  <p>
                    <span className="font-medium">ICE:</span> {peer.iceState}
                  </p>
                  <p>
                    <span className="font-medium">Signaling:</span> {peer.signalingState}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browser Support */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Browser Support</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {checkBrowserSupport().map((feature) => (
              <Chip key={feature.name} color={feature.supported ? "success" : "danger"} size="sm" variant="flat">
                {feature.name}: {feature.supported ? "✓" : "✗"}
              </Chip>
            ))}
          </div>
        </div>

        {/* LocalStorage Debug */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">LocalStorage</h4>
          <div className="space-y-1">
            {checkLocalStorage().map((item, index) => (
              <div key={index} className="text-xs bg-default-50 p-2 rounded">
                <p>
                  <span className="font-medium">{item.key}:</span>
                </p>
                <p className="text-default-600 break-all">{item.value}</p>
              </div>
            ))}
            {checkLocalStorage().length === 0 && (
              <p className="text-sm text-default-500">No screen-share data in localStorage</p>
            )}
          </div>
        </div>

        {/* Console Logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Console Logs</h4>
            <Button size="sm" startContent={<RefreshCw className="w-3 h-3" />} variant="flat" onClick={clearLogs}>
              Clear
            </Button>
          </div>
          <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs captured yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Quick Actions</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="flat"
              onClick={() => {
                console.log("=== DEBUG INFO ===");
                console.log("isSharing:", isSharing);
                console.log("isViewing:", isViewing);
                console.log("roomId:", roomId);
                console.log("connectionState:", connectionState);
                console.log("localStream:", localStream);
                console.log("remoteStream:", remoteStream);
                console.log("peers:", peers);
                console.log(
                  "localStorage keys:",
                  Object.keys(localStorage).filter((k) => k.includes("screen"))
                );
              }}
            >
              Log State
            </Button>
            <Button
              size="sm"
              variant="flat"
              onClick={() => {
                localStorage.removeItem(`screen-share-room-${roomId}`);
                localStorage.removeItem("screen-share-signal");
                console.log("Cleared localStorage");
              }}
            >
              Clear Storage
            </Button>
            <Button
              size="sm"
              variant="flat"
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(
                    {
                      isSharing,
                      isViewing,
                      roomId,
                      connectionState,
                      peersCount: peers.length,
                      localStreamActive: localStream?.active,
                      remoteStreamActive: remoteStream?.active,
                      browserSupport: checkBrowserSupport(),
                      localStorage: checkLocalStorage(),
                      logs: logs.slice(-5),
                    },
                    null,
                    2
                  )
                );
                console.log("Debug info copied to clipboard");
              }}
            >
              Copy Debug Info
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default DebugPanel;