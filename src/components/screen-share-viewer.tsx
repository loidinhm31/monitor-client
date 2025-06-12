import { Button, Card, CardBody, CardHeader, Chip, Input, Spinner } from "@heroui/react";
import { Eye, EyeOff, LogOut, Maximize, Minimize, Monitor, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";

interface ScreenShareViewerProps {
  isViewing: boolean;
  remoteStream: MediaStream | null;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  connectionState: RTCPeerConnectionState;
  error: string | null;
  roomId: string;
  onJoinRoom: (roomId: string) => Promise<void>;
  onLeaveRoom: () => void;
  hostConnection: string | null;
}

const ScreenShareViewer: React.FC<ScreenShareViewerProps> = ({
                                                               isViewing,
                                                               remoteStream,
                                                               remoteVideoRef,
                                                               connectionState,
                                                               error,
                                                               roomId: currentRoomId,
                                                               onJoinRoom,
                                                               onLeaveRoom,
                                                               hostConnection,
                                                             }) => {
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoStats, setVideoStats] = useState<{
    resolution: string;
    frameRate: number;
    bitrate: number;
  } | null>(null);

  // Initialize room ID from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const roomFromUrl = urlParams.get("room");
    if (roomFromUrl && !currentRoomId) {
      setRoomId(roomFromUrl);
      // Auto-join if we have both room and host from URL
      const hostFromUrl = urlParams.get("host");
      if (hostFromUrl && hostConnection === hostFromUrl) {
        handleJoinRoom(roomFromUrl);
      }
    }
  }, [currentRoomId, hostConnection]);

  // Monitor video stats
  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;

    const video = remoteVideoRef.current;
    const updateStats = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoStats({
          resolution: `${video.videoWidth}x${video.videoHeight}`,
          frameRate: 30, // WebRTC typically delivers 30fps
          bitrate: 0, // This would require RTCStatsReport for accurate measurement
        });
      }
    };

    video.addEventListener("loadedmetadata", updateStats);
    const interval = setInterval(updateStats, 5000);

    return () => {
      video.removeEventListener("loadedmetadata", updateStats);
      clearInterval(interval);
    };
  }, [remoteStream, remoteVideoRef]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle join room
  const handleJoinRoom = useCallback(async (targetRoomId?: string) => {
    const finalRoomId = targetRoomId || roomId.trim();
    if (!finalRoomId) return;

    setLoading(true);
    try {
      await onJoinRoom(finalRoomId.toUpperCase());
    } catch (error) {
      console.error("Failed to join room:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId, onJoinRoom]);

  // Handle leave room
  const handleLeaveRoom = useCallback(() => {
    onLeaveRoom();
    // Don't clear roomId if it came from URL
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
    if (!urlParams.get("room")) {
      setRoomId("");
    }
  }, [onLeaveRoom]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!remoteVideoRef.current) return;

    try {
      if (!isFullscreen) {
        await remoteVideoRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, [isFullscreen, remoteVideoRef]);

  // Toggle audio
  const toggleMute = useCallback(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted, remoteVideoRef]);

  // Get connection status
  const getConnectionStatus = () => {
    switch (connectionState) {
      case "connected":
        return { color: "success" as const, text: "Connected", icon: <Wifi className="w-4 h-4" /> };
      case "connecting":
        return { color: "warning" as const, text: "Connecting", icon: <Wifi className="w-4 h-4" /> };
      case "disconnected":
      case "failed":
        return { color: "danger" as const, text: "Disconnected", icon: <WifiOff className="w-4 h-4" /> };
      case "closed":
        return { color: "default" as const, text: "Not Connected", icon: <WifiOff className="w-4 h-4" /> };
      default:
        return { color: "default" as const, text: "Ready", icon: <Eye className="w-4 h-4" /> };
    }
  };

  const status = getConnectionStatus();

  return (
    <div className="flex flex-col gap-4">
      {/* Viewer Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Screen Share Viewer</h3>
            <Chip color={status.color} size="sm" startContent={status.icon} variant="flat">
              {status.text}
            </Chip>
            {hostConnection && (
              <Chip color="primary" size="sm" variant="flat">
                {hostConnection}
              </Chip>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Room Join */}
          {!isViewing && (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  label="Room ID"
                  placeholder="Enter room ID to join"
                  size="sm"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && roomId.trim()) {
                      handleJoinRoom();
                    }
                  }}
                />
                <Button
                  color="primary"
                  isDisabled={!roomId.trim() || loading}
                  isLoading={loading}
                  startContent={<Eye className="w-4 h-4" />}
                  onClick={() => handleJoinRoom()}
                >
                  Join Room
                </Button>
              </div>

              {/* Quick Test Instructions */}
              <div className="bg-default-50 p-3 rounded-lg">
                <p className="text-sm text-default-700 mb-2">
                  <strong>Quick Test:</strong> Open this page in another tab/window, go to "Share Screen" tab, start
                  sharing, then return here and enter the same room ID.
                </p>
                <p className="text-xs text-default-500">
                  This works because both tabs share the same origin and can coordinate via BroadcastChannel and
                  localStorage.
                </p>
              </div>
            </>
          )}

          {/* Active Session Info */}
          {isViewing && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Room: {currentRoomId}</p>
                <p className="text-xs text-default-500">
                  Status: {remoteStream ? "Receiving video" : "Waiting for stream..."}
                </p>
                {connectionState !== 'new' && (
                  <p className="text-xs text-default-400">
                    Connection: {connectionState}
                  </p>
                )}
              </div>
              <Button color="danger" size="sm" startContent={<LogOut className="w-4 h-4" />} onClick={handleLeaveRoom}>
                Leave Room
              </Button>
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

      {/* Video Stream */}
      {isViewing && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <h4 className="text-md font-semibold">Shared Screen</h4>
                {videoStats && (
                  <Chip color="primary" size="sm" variant="flat">
                    {videoStats.resolution}
                  </Chip>
                )}
              </div>

              {/* Video Controls */}
              <div className="flex gap-2">
                <Button isIconOnly size="sm" variant="flat" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="relative bg-black rounded-lg overflow-hidden min-h-[300px]">
              {remoteStream ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto max-h-[70vh] object-contain"
                    controls={false}
                    muted={isMuted}
                    onLoadedMetadata={() => {
                      console.log('Remote video loaded');
                      // Auto-play with user interaction check
                      if (remoteVideoRef.current) {
                        remoteVideoRef.current.play().catch(error => {
                          console.log('Remote video autoplay blocked, user interaction required:', error);
                        });
                      }
                    }}
                    onError={(e) => console.error('Remote video error:', e)}
                    onCanPlay={() => {
                      console.log('Remote video can play');
                      // Ensure video is playing
                      if (remoteVideoRef.current && remoteVideoRef.current.paused) {
                        remoteVideoRef.current.play().catch(error => {
                          console.log('Remote video play failed:', error);
                        });
                      }
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <Chip color="success" size="sm" variant="solid">
                      ● LIVE
                    </Chip>
                  </div>
                  {videoStats && (
                    <div className="absolute bottom-2 right-2">
                      <Chip color="default" size="sm" variant="flat">
                        {videoStats.resolution} @ {videoStats.frameRate}fps
                      </Chip>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-default-500">
                  {connectionState === "connecting" ? (
                    <>
                      <Spinner size="lg" />
                      <p className="mt-4 text-sm">Connecting to host...</p>
                      <p className="text-xs text-default-400 mt-2">
                        Establishing WebRTC connection...
                      </p>
                    </>
                  ) : connectionState === "connected" ? (
                    <>
                      <Spinner size="lg" />
                      <p className="mt-4 text-sm">Connected! Waiting for video stream...</p>
                      <p className="text-xs text-default-400 mt-2">
                        Host may need to start screen sharing
                      </p>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-12 h-12 mb-4" />
                      <p className="text-sm">Waiting for screen share to start...</p>
                      <p className="text-xs text-default-400 mt-2">
                        Make sure the host has started sharing their screen
                      </p>
                      {connectionState !== 'new' && (
                        <p className="text-xs text-warning mt-2">
                          Connection state: {connectionState}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Stream Debug Info */}
            {isViewing && (
              <div className="mt-3 p-2 bg-default-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Connection State:</span> {connectionState}
                  </div>
                  <div>
                    <span className="font-medium">Remote Stream:</span> {remoteStream ? 'Active' : 'None'}
                  </div>
                  <div>
                    <span className="font-medium">Video Tracks:</span> {remoteStream?.getVideoTracks().length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Audio Tracks:</span> {remoteStream?.getAudioTracks().length || 0}
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Instructions */}
      {!isViewing && (
        <Card>
          <CardBody>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">How to join a screen share:</h4>
              <ol className="text-sm text-default-600 space-y-1 list-decimal list-inside">
                <li>Get the room ID from the person sharing their screen (or use the shared URL)</li>
                <li>Enter the room ID in the field above</li>
                <li>Click "Join Room" to connect</li>
                <li>You'll see their screen once the connection is established</li>
              </ol>

              <div className="mt-4 space-y-2">
                <h5 className="font-semibold text-sm">Viewer Features:</h5>
                <ul className="text-sm text-default-600 space-y-1">
                  <li>• High-quality video reception (up to 1080p)</li>
                  <li>• Audio playback with mute control</li>
                  <li>• Fullscreen viewing mode</li>
                  <li>• Real-time connection status</li>
                  <li>• Automatic reconnection attempts</li>
                  <li>• URL-based room joining</li>
                </ul>
              </div>

              <div className="mt-4 space-y-2">
                <h5 className="font-semibold text-sm">Troubleshooting:</h5>
                <ul className="text-sm text-default-600 space-y-1">
                  <li>• If connection fails, check that the host is sharing</li>
                  <li>• Try refreshing the page if connection gets stuck</li>
                  <li>• Ensure both devices are on the same network</li>
                  <li>• Check browser console for detailed error messages</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ScreenShareViewer;