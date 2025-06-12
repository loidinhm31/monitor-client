import { Button, Card, CardBody, CardHeader, Chip, Divider, Input, Tab, Tabs } from "@heroui/react";
import { CheckCircle, Copy, Monitor, QrCode, Share, Smartphone, StopCircle, Users, Wifi } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";

import QRCodeDisplay from "@/components/qr-screen-share.tsx";

interface ServerlessScreenShareHostProps {
  isSharing: boolean;
  localStream: MediaStream | null;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  connectionState: RTCPeerConnectionState;
  peers: Array<{ id: string; connection: RTCPeerConnection }>;
  error: string | null;
  connectionInfo: any;
  onStartShare: (roomId: string) => Promise<void>;
  onStopShare: () => void;
  createShareableInfo: (roomId: string) => { shareUrl: string; qrData: string; connectionInfo: any };
  generateQRCode: () => string | null;
  hostConnection: string | null;
}

const ServerlessScreenShareHost: React.FC<ServerlessScreenShareHostProps> = ({
                                                                               isSharing,
                                                                               localStream,
                                                                               localVideoRef,
                                                                               connectionState,
                                                                               peers,
                                                                               error,
                                                                               connectionInfo,
                                                                               onStartShare,
                                                                               onStopShare,
                                                                               createShareableInfo,
                                                                               generateQRCode,
                                                                               hostConnection,
                                                                             }) => {
  const [roomId, setRoomId] = useState("");
  const [shareInfo, setShareInfo] = useState<{ shareUrl: string; qrData: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedShareMethod, setSelectedShareMethod] = useState("url");

  // Generate random room ID
  const generateRoomId = useCallback(() => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
    return id;
  }, []);

  // Update share info when room is created
  useEffect(() => {
    if (isSharing && roomId) {
      const info = createShareableInfo(roomId);
      setShareInfo(info);
    } else {
      setShareInfo(null);
    }
  }, [isSharing, roomId, createShareableInfo]);

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(async () => {
    if (!shareInfo?.shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  }, [shareInfo]);

  // Copy room ID only
  const copyRoomId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy room ID:", error);
    }
  }, [roomId]);

  // Handle start sharing
  const handleStartShare = useCallback(async () => {
    const finalRoomId = roomId.trim() || generateRoomId();
    setRoomId(finalRoomId);

    setLoading(true);
    try {
      await onStartShare(finalRoomId);
    } catch (error) {
      console.error("Failed to start sharing:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId, generateRoomId, onStartShare]);

  // Handle stop sharing
  const handleStopShare = useCallback(() => {
    onStopShare();
    setRoomId("");
    setShareInfo(null);
  }, [onStopShare]);

  // Get connection status info
  const getConnectionStatus = () => {
    switch (connectionState) {
      case "connected":
        return { color: "success" as const, text: "Connected", icon: <Wifi className="w-4 h-4" /> };
      case "connecting":
        return { color: "warning" as const, text: "Connecting", icon: <Wifi className="w-4 h-4" /> };
      case "disconnected":
      case "failed":
        return { color: "danger" as const, text: "Disconnected", icon: <Wifi className="w-4 h-4" /> };
      case "closed":
        return { color: "default" as const, text: "Closed", icon: <Wifi className="w-4 h-4" /> };
      default:
        return { color: "default" as const, text: "Ready", icon: <Monitor className="w-4 h-4" /> };
    }
  };

  const status = getConnectionStatus();

  return (
    <div className="flex flex-col gap-4">
      {/* Host Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Serverless Screen Share Host</h3>
            <Chip color={status.color} size="sm" startContent={status.icon} variant="flat">
              {status.text}
            </Chip>
            <Chip color="success" size="sm" variant="flat">
              No Server Required
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Room Configuration */}
          {!isSharing && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                label="Room ID"
                placeholder="Enter room ID or leave empty to generate"
                size="sm"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                endContent={
                  <Button isIconOnly size="sm" variant="light" onClick={generateRoomId} title="Generate random room ID">
                    🎲
                  </Button>
                }
              />
              <Button
                color="primary"
                isDisabled={loading}
                isLoading={loading}
                startContent={<Share className="w-4 h-4" />}
                onClick={handleStartShare}
              >
                Start Sharing
              </Button>
            </div>
          )}

          {/* Active Session Info */}
          {isSharing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Room: {roomId}</p>
                  <p className="text-xs text-default-500">
                    Viewers: {peers.length} • Status: {localStream ? "Streaming" : "Starting..."}
                  </p>
                </div>
                <Button
                  color="danger"
                  size="sm"
                  startContent={<StopCircle className="w-4 h-4" />}
                  onClick={handleStopShare}
                >
                  Stop Sharing
                </Button>
              </div>

              {/* Share Methods */}
              {shareInfo && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Share with viewers:</p>

                  <Tabs
                    selectedKey={selectedShareMethod}
                    size="sm"
                    onSelectionChange={(key) => setSelectedShareMethod(key.toString())}
                  >
                    <Tab
                      key="url"
                      title={
                        <div className="flex items-center gap-2">
                          <Copy className="w-4 h-4" />
                          <span>URL</span>
                        </div>
                      }
                    >
                      <div className="space-y-3 mt-3">
                        <div className="flex gap-2">
                          <Input
                            isReadOnly
                            size="sm"
                            value={shareInfo.shareUrl}
                            variant="bordered"
                            className="font-mono text-xs"
                          />
                          <Button isIconOnly size="sm" variant="bordered" onClick={copyShareUrl}>
                            {copied ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-default-500">
                          Send this URL to viewers or they can manually enter room ID: <strong>{roomId}</strong>
                        </p>
                      </div>
                    </Tab>

                    <Tab
                      key="qr"
                      title={
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4" />
                          <span>QR Code</span>
                        </div>
                      }
                    >
                      <div className="mt-3">
                        <QRCodeDisplay
                          data={shareInfo.qrData}
                          size={180}
                          title="Scan to Join"
                          description="Perfect for mobile devices"
                          shareUrl={shareInfo.shareUrl}
                        />
                      </div>
                    </Tab>

                    <Tab
                      key="manual"
                      title={
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          <span>Manual</span>
                        </div>
                      }
                    >
                      <div className="space-y-3 mt-3">
                        <div className="bg-default-50 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-2">Instructions for viewers:</p>
                          <ol className="text-sm text-default-600 space-y-1 list-decimal list-inside">
                            <li>Go to the Screen Share page</li>
                            <li>Select "Join Screen" tab</li>
                            <li>
                              Enter Room ID: <strong>{roomId}</strong>
                            </li>
                            <li>Click "Join Room"</li>
                          </ol>
                        </div>
                        <Button
                          size="sm"
                          variant="bordered"
                          startContent={<Copy className="w-4 h-4" />}
                          onClick={copyRoomId}
                        >
                          Copy Room ID
                        </Button>
                      </div>
                    </Tab>
                  </Tabs>
                </div>
              )}

              {/* Connected Viewers */}
              {peers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Connected Viewers ({peers.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {peers.map((peer, index) => (
                      <Chip key={peer.id} color="success" size="sm" variant="flat">
                        Viewer {index + 1}
                        <span className="ml-1 text-xs">
                          ({peer.connection.iceConnectionState})
                        </span>
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Local Preview */}
      {isSharing && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between w-full">
              <h4 className="text-md font-semibold">Your Screen Preview</h4>
              <div className="flex items-center gap-2">
                {localStream && (
                  <Chip color="success" size="sm" variant="flat">
                    {localStream.getVideoTracks()[0]?.label || 'Screen Share'}
                  </Chip>
                )}
                <Chip color="danger" size="sm" variant="solid">
                  ● LIVE
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="relative bg-black rounded-lg overflow-hidden min-h-[200px]">
              {localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-auto max-h-64 object-contain"
                  onLoadedMetadata={() => {
                    console.log('Local video loaded');
                    // Ensure local video plays
                    if (localVideoRef.current) {
                      localVideoRef.current.play().catch(error => {
                        console.log('Local video autoplay blocked:', error);
                      });
                    }
                  }}
                  onError={(e) => console.error('Local video error:', e)}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-default-500">
                  <div className="text-center">
                    <Monitor className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Starting screen capture...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stream Info */}
            {localStream && (
              <div className="mt-3 p-2 bg-default-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Video Tracks:</span> {localStream.getVideoTracks().length}
                  </div>
                  <div>
                    <span className="font-medium">Audio Tracks:</span> {localStream.getAudioTracks().length}
                  </div>
                  <div>
                    <span className="font-medium">Active Viewers:</span> {peers.length}
                  </div>
                  <div>
                    <span className="font-medium">Stream State:</span> {localStream.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Serverless Benefits */}
      {!isSharing && (
        <Card>
          <CardBody>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Serverless Screen Sharing:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold text-sm mb-2">✅ Advantages:</h5>
                  <ul className="text-sm text-default-600 space-y-1">
                    <li>• No dedicated server required</li>
                    <li>• Direct peer-to-peer connections</li>
                    <li>• Ultra-low latency on LAN</li>
                    <li>• Works with existing infrastructure</li>
                    <li>• Multiple sharing methods (URL/QR/Manual)</li>
                    <li>• Cross-tab coordination</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-sm mb-2">🔧 How it works:</h5>
                  <ul className="text-sm text-default-600 space-y-1">
                    <li>• Uses your existing WebSocket connection</li>
                    <li>• BroadcastChannel for same-device coordination</li>
                    <li>• localStorage for cross-tab communication</li>
                    <li>• QR codes for easy mobile joining</li>
                    <li>• WebRTC handles the actual streaming</li>
                  </ul>
                </div>
              </div>

              <Divider />

              <div className="space-y-2">
                <h5 className="font-semibold text-sm">Technical Features:</h5>
                <ul className="text-sm text-default-600 space-y-1">
                  <li>• High-quality video streaming (up to 1080p@30fps)</li>
                  <li>• Audio sharing with echo cancellation</li>
                  <li>• Encrypted communication (DTLS/SRTP)</li>
                  <li>• Automatic ICE/STUN for NAT traversal</li>
                  <li>• Multiple viewers supported</li>
                  <li>• Automatic connection recovery</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ServerlessScreenShareHost;