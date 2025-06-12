import { Card, CardBody, CardHeader, Chip, Tab, Tabs } from "@heroui/react";
import { Eye, Monitor, Server, Wifi, WifiOff, Zap, Router, MessageSquare } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";

import DefaultLayout from "@/layouts/default";
import { useServerlessScreenShare } from "@/hooks/useServerlessScreenShare";
import ServerlessScreenShareHost from "@/components/sharing-host.tsx";
import ScreenShareViewer from "@/components/screen-share-viewer.tsx";
import DebugPanel from "@/components/debug-panel.tsx";
import TroubleshootingChecklist from "@/components/troubleshooting-checklist.tsx";
import NetworkDiagnostics from "@/components/NetworkDiagnostics.tsx";
import SignalingStepTracer from "@/components/SignalingStepTracer.tsx";
import SignalingDiagnostics from "@/components/SignalingDiagnostics.tsx";

export default function Mirror() {
  const [selectedTab, setSelectedTab] = useState("host");
  const [hostConnection, setHostConnection] = useState<string | null>(null);

  // Load host connection from localStorage or URL params
  useEffect(() => {
    // First check URL params for host connection
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const hostFromUrl = urlParams.get("host");

    if (hostFromUrl && hostFromUrl !== "your-host-connection") {
      setHostConnection(hostFromUrl);
      // If we have a room parameter and host, switch to viewer mode
      const roomFromUrl = urlParams.get("room");
      if (roomFromUrl) {
        setSelectedTab("viewer");
      }
    } else {
      // Fallback to stored host connections
      try {
        const storedConnections = JSON.parse(localStorage.getItem("hostConnections") || "[]");
        if (storedConnections.length > 0 && storedConnections[0].host !== "your-host-connection") {
          setHostConnection(storedConnections[0].host);
        } else {
          // Set to null for local-only mode (no WebSocket coordination)
          setHostConnection(null);
          console.log("No valid host connection found, using local-only coordination");
        }
      } catch (error) {
        console.error("Error loading host connections:", error);
        setHostConnection(null);
      }
    }
  }, []);

  const {
    isSharing,
    isViewing,
    localStream,
    remoteStream,
    peers,
    roomId,
    error,
    connectionState,
    connectionInfo,
    localVideoRef,
    remoteVideoRef,
    startScreenShare,
    stopScreenShare,
    joinAsViewer,
    leaveViewing,
    createShareableInfo,
    generateQRCode,
  } = useServerlessScreenShare(hostConnection);

  // Handle local video stream setup
  const setupLocalVideo = useCallback(() => {
    if (localStream && localVideoRef.current && localVideoRef.current.srcObject !== localStream) {
      console.log('Setting local video stream');
      localVideoRef.current.srcObject = localStream;

      // Ensure video plays
      localVideoRef.current.play().catch(error => {
        console.log('Local video autoplay blocked:', error);
      });
    }
  }, [localStream, localVideoRef]);

  // Handle remote video stream setup
  const setupRemoteVideo = useCallback(() => {
    if (remoteStream && remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
      console.log('Setting remote video stream');
      remoteVideoRef.current.srcObject = remoteStream;

      // Ensure video plays
      remoteVideoRef.current.play().catch(error => {
        console.log('Remote video autoplay blocked:', error);
      });
    }
  }, [remoteStream, remoteVideoRef]);

  // Setup video streams when they change
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      setupLocalVideo();
    });
  }, [setupLocalVideo]);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      setupRemoteVideo();
    });
  }, [setupRemoteVideo]);

  // Debug logging (use useEffect to avoid setState during render)
  useEffect(() => {
    console.log('Mirror page state update:', {
      isSharing,
      isViewing,
      roomId,
      connectionState,
      localStreamActive: localStream?.active,
      remoteStreamActive: remoteStream?.active,
      peersCount: peers.length,
      error,
      hostConnection
    });
  }, [isSharing, isViewing, roomId, connectionState, localStream, remoteStream, peers.length, error, hostConnection]);

  // Check if WebRTC is supported
  const isWebRTCSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.RTCPeerConnection);
  };

  // Check available coordination methods
  const getAvailableCoordinationMethods = () => {
    const methods = [];

    if ("BroadcastChannel" in window) {
      methods.push("BroadcastChannel (same-origin)");
    }

    if (typeof Storage !== "undefined") {
      methods.push("localStorage events");
    }

    if (hostConnection) {
      methods.push("WebSocket relay");
    } else {
      methods.push("Local coordination only");
    }

    return methods;
  };

  // Get overall connection status
  const getOverallStatus = () => {
    if (!hostConnection) {
      return { color: "warning" as const, text: "Local Only", icon: <WifiOff className="w-4 h-4" /> };
    }
    if (isSharing || isViewing) {
      return { color: "success" as const, text: "Active", icon: <Wifi className="w-4 h-4" /> };
    }
    return { color: "default" as const, text: "Ready", icon: <Wifi className="w-4 h-4" /> };
  };

  const overallStatus = getOverallStatus();
  const coordinationMethods = getAvailableCoordinationMethods();

  if (!isWebRTCSupported()) {
    return (
      <DefaultLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <h2 className="text-xl font-bold text-danger">Browser Not Supported</h2>
            </CardHeader>
            <CardBody>
              <div className="text-center space-y-4">
                <p className="text-default-600">
                  Your browser doesn't support screen sharing. Please use a modern browser like:
                </p>
                <ul className="text-sm text-default-500 space-y-1">
                  <li>• Chrome 72+</li>
                  <li>• Firefox 66+</li>
                  <li>• Safari 13+</li>
                  <li>• Edge 79+</li>
                </ul>
              </div>
            </CardBody>
          </Card>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-6 py-8 md:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">Serverless Screen Share</h1>
              <Chip color="success" size="sm" startContent={<Zap className="w-3 h-3" />} variant="flat">
                No Server Required
              </Chip>
            </div>
            <p className="text-default-600">Direct peer-to-peer screen sharing without dedicated servers</p>
          </div>

          <div className="flex items-center gap-3">
            <Chip color={overallStatus.color} startContent={overallStatus.icon} variant="flat">
              {overallStatus.text}
            </Chip>
            {hostConnection && (
              <Chip color="primary" variant="flat">
                {hostConnection}
              </Chip>
            )}
          </div>
        </div>

        {/* Coordination Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-primary-200">
          <CardBody>
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-primary mb-2">Serverless Coordination Active</h3>
                <p className="text-sm text-default-700 mb-3">
                  Using multiple coordination methods for peer discovery without requiring a dedicated signaling server:
                </p>
                <div className="flex flex-wrap gap-2">
                  {coordinationMethods.map((method, index) => (
                    <Chip key={index} color="primary" size="sm" variant="flat">
                      {method}
                    </Chip>
                  ))}
                </div>
                {!hostConnection && (
                  <p className="text-xs text-default-600 mt-2">
                    💡 Running in local-only mode. Configure a host connection for enhanced cross-device coordination.
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto w-full">
          <Tabs
            aria-label="Screen share modes"
            className="w-full"
            selectedKey={selectedTab}
            size="lg"
            onSelectionChange={(key) => setSelectedTab(key.toString())}
          >
            <Tab
              key="host"
              title={
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>Share Screen</span>
                  {isSharing && (
                    <Chip color="success" size="sm" variant="dot">
                      Live
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="mt-6">
                <ServerlessScreenShareHost
                  connectionState={connectionState}
                  connectionInfo={connectionInfo}
                  createShareableInfo={createShareableInfo}
                  error={error}
                  generateQRCode={generateQRCode}
                  hostConnection={hostConnection}
                  isSharing={isSharing}
                  localStream={localStream}
                  localVideoRef={localVideoRef}
                  peers={peers}
                  onStartShare={startScreenShare}
                  onStopShare={stopScreenShare}
                />
              </div>
            </Tab>

            <Tab
              key="viewer"
              title={
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>Join Screen</span>
                  {isViewing && (
                    <Chip color="primary" size="sm" variant="dot">
                      Viewing
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="mt-6">
                <ScreenShareViewer
                  connectionState={connectionState}
                  error={error}
                  hostConnection={hostConnection}
                  isViewing={isViewing}
                  remoteStream={remoteStream}
                  remoteVideoRef={remoteVideoRef}
                  roomId={roomId}
                  onJoinRoom={joinAsViewer}
                  onLeaveRoom={leaveViewing}
                />
              </div>
            </Tab>

            <Tab
              key="diagnostics"
              title={
                <div className="flex items-center gap-2">
                  <Router className="w-4 h-4" />
                  <span>Network Test</span>
                </div>
              }
            >
              <div className="mt-6">
                <NetworkDiagnostics isActive={selectedTab === 'diagnostics'} />
              </div>
            </Tab>

            <Tab
              key="signaling"
              title={
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Signaling Debug</span>
                </div>
              }
            >
              <div className="mt-6 space-y-6">
                <SignalingStepTracer
                  isSharing={isSharing}
                  isViewing={isViewing}
                  roomId={roomId}
                  peers={peers}
                />
                <SignalingDiagnostics
                  isSharing={isSharing}
                  isViewing={isViewing}
                  roomId={roomId}
                  peers={peers}
                  localStream={localStream}
                  remoteStream={remoteStream}
                />
              </div>
            </Tab>
          </Tabs>
        </div>

        {/* Troubleshooting Checklist - Only show when sharing or viewing */}
        {(isSharing || isViewing) && (
          <div className="max-w-4xl mx-auto w-full">
            <TroubleshootingChecklist
              isSharing={isSharing}
              isViewing={isViewing}
              localStream={localStream}
              remoteStream={remoteStream}
              peers={peers}
              connectionState={connectionState}
              roomId={roomId}
              error={error}
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
            />
          </div>
        )}

        {/* Debug Panel - Only show when sharing or viewing */}
        {(isSharing || isViewing) && (
          <div className="max-w-4xl mx-auto w-full">
            <DebugPanel
              isSharing={isSharing}
              isViewing={isViewing}
              localStream={localStream}
              remoteStream={remoteStream}
              peers={peers}
              connectionState={connectionState}
              roomId={roomId}
              error={error}
            />
          </div>
        )}

        {/* Enhanced Features Info */}
        <Card className="max-w-4xl mx-auto w-full">
          <CardHeader>
            <h3 className="text-lg font-semibold">Serverless Architecture Benefits</h3>
          </CardHeader>
          <CardBody>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-success">🚀 No Infrastructure</h4>
                <ul className="space-y-2 text-sm text-default-600">
                  <li>• No dedicated signaling server needed</li>
                  <li>• Uses your existing WebSocket connection (optional)</li>
                  <li>• BroadcastChannel for same-device coordination</li>
                  <li>• localStorage for cross-tab communication</li>
                  <li>• Automatic fallback coordination methods</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-primary">⚡ High Performance</h4>
                <ul className="space-y-2 text-sm text-default-600">
                  <li>• Direct UDP streaming via WebRTC</li>
                  <li>• Ultra-low latency (&lt;50ms on LAN)</li>
                  <li>• Up to 1920x1080 @ 30fps video</li>
                  <li>• High-quality stereo audio</li>
                  <li>• Adaptive bitrate based on network</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-secondary">🔒 Security & Privacy</h4>
                <ul className="space-y-2 text-sm text-default-600">
                  <li>• End-to-end encrypted streams (DTLS/SRTP)</li>
                  <li>• No media data through any server</li>
                  <li>• Local network operation</li>
                  <li>• Temporary room IDs</li>
                  <li>• No persistent data storage</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-default-200">
              <h4 className="font-semibold mb-3">Coordination Methods</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Same Device (Cross-tab):</h5>
                  <ul className="text-sm text-default-600 space-y-1">
                    <li>• BroadcastChannel API for real-time messaging</li>
                    <li>• localStorage events for state synchronization</li>
                    <li>• Automatic peer discovery within browser</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Cross-Device:</h5>
                  <ul className="text-sm text-default-600 space-y-1">
                    <li>• QR codes for easy mobile joining</li>
                    <li>• Shareable URLs with embedded connection info</li>
                    <li>• WebSocket relay via existing host connection (optional)</li>
                    <li>• Manual room ID entry</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-default-200">
              <h4 className="font-semibold mb-3">Troubleshooting Common Issues</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2 text-warning">ICE Candidate Errors:</h5>
                  <ul className="text-sm text-default-600 space-y-1">
                    <li>• Usually non-critical IPv6 connectivity issues</li>
                    <li>• WebRTC automatically tries alternative paths</li>
                    <li>• Fixed by multiple STUN servers for redundancy</li>
                    <li>• Use Network Test tab to diagnose connectivity</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium mb-2 text-info">Video Autoplay Issues:</h5>
                  <ul className="text-sm text-default-600 space-y-1">
                    <li>• Browser security prevents automatic video play</li>
                    <li>• Click video area to start playback manually</li>
                    <li>• Fixed with improved video element management</li>
                    <li>• Troubleshooting panel shows detailed status</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}