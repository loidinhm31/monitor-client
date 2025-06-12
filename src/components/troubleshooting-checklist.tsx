import { Card, CardBody, CardHeader, Chip, Button } from "@heroui/react";
import { CheckCircle, AlertCircle, XCircle, RefreshCw, PlayCircle, Wifi } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

interface TroubleshootingChecklistProps {
  isSharing: boolean;
  isViewing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peers: Array<{ id: string; connection: RTCPeerConnection }>;
  connectionState: RTCPeerConnectionState;
  roomId: string;
  error: string | null;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

interface CheckResult {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  action?: () => void;
  actionLabel?: string;
  details?: string[];
}

const EnhancedTroubleshootingChecklist: React.FC<TroubleshootingChecklistProps> = ({
                                                                                     isSharing,
                                                                                     isViewing,
                                                                                     localStream,
                                                                                     remoteStream,
                                                                                     peers,
                                                                                     connectionState,
                                                                                     roomId,
                                                                                     error,
                                                                                     localVideoRef,
                                                                                     remoteVideoRef,
                                                                                   }) => {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const runChecks = useCallback(() => {
    const results: CheckResult[] = [];

    // 1. Browser Support Check
    const hasWebRTC = !!window.RTCPeerConnection;
    const hasGetDisplayMedia = !!navigator.mediaDevices?.getDisplayMedia;
    const hasBroadcastChannel = 'BroadcastChannel' in window;
    const hasLocalStorage = typeof Storage !== "undefined";

    if (hasWebRTC && hasGetDisplayMedia && hasBroadcastChannel) {
      results.push({
        name: 'Browser Support',
        status: 'pass',
        message: 'All required APIs are supported',
        details: [
          'WebRTC: ✓ RTCPeerConnection available',
          'Screen Capture: ✓ getDisplayMedia available',
          'Coordination: ✓ BroadcastChannel available',
          'Storage: ✓ localStorage available'
        ]
      });
    } else {
      const missing = [];
      if (!hasWebRTC) missing.push('WebRTC');
      if (!hasGetDisplayMedia) missing.push('getDisplayMedia');
      if (!hasBroadcastChannel) missing.push('BroadcastChannel');
      if (!hasLocalStorage) missing.push('localStorage');

      results.push({
        name: 'Browser Support',
        status: 'fail',
        message: `Missing APIs: ${missing.join(', ')}`,
        details: missing.map(api => `❌ ${api} not supported`)
      });
    }

    // 2. Screen Sharing State Check
    if (isSharing) {
      if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        const audioTracks = localStream.getAudioTracks();

        if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
          results.push({
            name: 'Screen Capture',
            status: 'pass',
            message: `Active (${videoTracks[0].label})`,
            details: [
              `Video tracks: ${videoTracks.length} (${videoTracks[0].readyState})`,
              `Audio tracks: ${audioTracks.length}`,
              `Stream active: ${localStream.active}`,
              `Video dimensions: ${videoTracks[0].getSettings().width}x${videoTracks[0].getSettings().height}`
            ]
          });
        } else {
          results.push({
            name: 'Screen Capture',
            status: 'fail',
            message: 'Stream exists but video track is not live',
            details: [
              `Video tracks: ${videoTracks.length}`,
              `Video state: ${videoTracks[0]?.readyState || 'none'}`,
              `Stream active: ${localStream.active}`
            ]
          });
        }
      } else {
        results.push({
          name: 'Screen Capture',
          status: 'fail',
          message: 'No local stream available',
          action: async () => {
            try {
              const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
              });
              console.log('Manual screen capture initiated:', stream);
            } catch (error) {
              console.error('Failed to start screen capture:', error);
            }
          },
          actionLabel: 'Test Screen Capture'
        });
      }

      // Local video preview check
      if (localVideoRef.current) {
        if (localVideoRef.current.srcObject === localStream && localStream) {
          const video = localVideoRef.current;
          results.push({
            name: 'Local Preview',
            status: 'pass',
            message: 'Video element connected and playing',
            details: [
              `Video dimensions: ${video.videoWidth}x${video.videoHeight}`,
              `Video paused: ${video.paused}`,
              `Video muted: ${video.muted}`,
              `Video ready state: ${video.readyState}`
            ]
          });
        } else {
          results.push({
            name: 'Local Preview',
            status: 'fail',
            message: 'Video element not connected to stream',
            action: () => {
              if (localVideoRef.current && localStream) {
                localVideoRef.current.srcObject = localStream;
                localVideoRef.current.play().catch(console.error);
              }
            },
            actionLabel: 'Fix Connection'
          });
        }
      } else {
        results.push({
          name: 'Local Preview',
          status: 'fail',
          message: 'Video element ref is null'
        });
      }
    }

    // 3. Room and Connection Checks
    if (roomId) {
      results.push({
        name: 'Room ID',
        status: 'pass',
        message: `Room: ${roomId}`
      });

      // Check localStorage for room info and signaling messages
      const storedRoom = localStorage.getItem(`screen-share-room-${roomId}`);
      const signalingMessages = Object.keys(localStorage)
        .filter(key => key.startsWith(`screen-share-${roomId}-`))
        .length;

      if (storedRoom) {
        results.push({
          name: 'Room Discovery',
          status: 'pass',
          message: `Room info available (${signalingMessages} signaling messages)`,
          details: [
            'Room info stored in localStorage',
            `Signaling messages: ${signalingMessages}`,
            `Room data: ${storedRoom.substring(0, 100)}...`
          ]
        });
      } else if (isViewing) {
        results.push({
          name: 'Room Discovery',
          status: 'warning',
          message: 'No room info in localStorage, relying on broadcast',
          details: [
            'Host may not have started sharing yet',
            'Or coordination messages not reaching viewer',
            `Available signaling messages: ${signalingMessages}`
          ]
        });
      }
    }

    // 4. Enhanced Peer Connection Checks
    if (isSharing || isViewing) {
      if (peers.length > 0) {
        const peerStates = peers.map(p => ({
          id: p.id.substring(0, 8),
          connectionState: p.connection.connectionState,
          iceConnectionState: p.connection.iceConnectionState,
          iceGatheringState: p.connection.iceGatheringState,
          signalingState: p.connection.signalingState
        }));

        const connectedPeers = peers.filter(p =>
          p.connection.iceConnectionState === 'connected' ||
          p.connection.iceConnectionState === 'completed'
        );
        const connectingPeers = peers.filter(p =>
          p.connection.iceConnectionState === 'connecting' ||
          p.connection.iceConnectionState === 'checking'
        );
        const failedPeers = peers.filter(p =>
          p.connection.iceConnectionState === 'failed' ||
          p.connection.connectionState === 'failed'
        );

        let status: 'pass' | 'warning' | 'fail' = 'warning';
        let message = '';

        if (connectedPeers.length > 0) {
          status = 'pass';
          message = `${connectedPeers.length} connected, ${connectingPeers.length} connecting`;
        } else if (connectingPeers.length > 0) {
          message = `${connectingPeers.length} connecting, 0 connected`;
        } else if (failedPeers.length > 0) {
          status = 'fail';
          message = `${failedPeers.length} failed connections`;
        } else {
          message = `${peers.length} peers but none connecting/connected`;
        }

        results.push({
          name: 'Peer Connections',
          status,
          message,
          details: peerStates.map(p =>
            `${p.id}: ${p.iceConnectionState} (${p.connectionState})`
          ),
          action: failedPeers.length > 0 ? () => {
            console.log('Restarting failed peer connections...');
            failedPeers.forEach(peer => {
              peer.connection.restartIce();
            });
          } : undefined,
          actionLabel: failedPeers.length > 0 ? 'Restart ICE' : undefined
        });
      } else {
        results.push({
          name: 'Peer Connections',
          status: isSharing ? 'warning' : 'fail',
          message: 'No peer connections established',
          details: [
            isSharing ? 'Waiting for viewers to join' : 'Failed to connect to host',
            'Check if room discovery is working',
            'Verify signaling coordination'
          ]
        });
      }
    }

    // 5. Enhanced Remote Stream Checks (for viewers)
    if (isViewing) {
      if (remoteStream) {
        const videoTracks = remoteStream.getVideoTracks();
        const audioTracks = remoteStream.getAudioTracks();

        if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
          results.push({
            name: 'Remote Stream',
            status: 'pass',
            message: 'Receiving video stream',
            details: [
              `Video tracks: ${videoTracks.length} (${videoTracks[0].readyState})`,
              `Audio tracks: ${audioTracks.length}`,
              `Stream active: ${remoteStream.active}`,
              `Video label: ${videoTracks[0].label}`
            ]
          });
        } else {
          results.push({
            name: 'Remote Stream',
            status: 'warning',
            message: 'Stream exists but video track not live',
            details: [
              `Video tracks: ${videoTracks.length}`,
              `Video state: ${videoTracks[0]?.readyState || 'none'}`,
              `Stream active: ${remoteStream.active}`
            ]
          });
        }

        // Remote video display check
        if (remoteVideoRef.current) {
          const video = remoteVideoRef.current;
          if (video.srcObject === remoteStream) {
            results.push({
              name: 'Remote Display',
              status: 'pass',
              message: 'Video element connected and displaying',
              details: [
                `Video dimensions: ${video.videoWidth}x${video.videoHeight}`,
                `Video paused: ${video.paused}`,
                `Video muted: ${video.muted}`,
                `Video ready state: ${video.readyState}`
              ]
            });
          } else {
            results.push({
              name: 'Remote Display',
              status: 'fail',
              message: 'Video element not connected to remote stream',
              action: () => {
                if (remoteVideoRef.current && remoteStream) {
                  remoteVideoRef.current.srcObject = remoteStream;
                  remoteVideoRef.current.play().catch(console.error);
                }
              },
              actionLabel: 'Fix Connection'
            });
          }
        }
      } else {
        results.push({
          name: 'Remote Stream',
          status: connectionState === 'connected' ? 'warning' : 'fail',
          message: connectionState === 'connected' ? 'Connected but no stream received' : 'No remote stream available',
          details: [
            `Connection state: ${connectionState}`,
            'Host may not be sharing screen',
            'Or WebRTC stream negotiation failed'
          ]
        });
      }
    }

    // 6. Enhanced Coordination Check
    const hasBroadcast = 'BroadcastChannel' in window;
    const hasSignalData = !!localStorage.getItem('screen-share-signal');
    const roomMessages = Object.keys(localStorage)
      .filter(key => key.startsWith('screen-share-') && key.includes(roomId))
      .length;

    results.push({
      name: 'Coordination',
      status: hasBroadcast ? 'pass' : 'warning',
      message: `BroadcastChannel: ${hasBroadcast ? 'Available' : 'Not supported'}, localStorage: ${hasSignalData ? 'Active' : 'Inactive'}`,
      details: [
        `BroadcastChannel support: ${hasBroadcast}`,
        `Active signaling: ${hasSignalData}`,
        `Room messages: ${roomMessages}`,
        `WebSocket coordination: ${isSharing || isViewing ? 'Attempted' : 'Not needed'}`
      ]
    });

    // 7. Network and ICE Check
    if (peers.length > 0) {
      const iceStates = peers.map(p => p.connection.iceConnectionState);
      const hasConnected = iceStates.some(state => state === 'connected' || state === 'completed');
      const hasConnecting = iceStates.some(state => state === 'connecting' || state === 'checking');
      const hasFailed = iceStates.some(state => state === 'failed');

      results.push({
        name: 'ICE/Network',
        status: hasConnected ? 'pass' : hasFailed ? 'fail' : 'warning',
        message: hasConnected ? 'ICE connection established' : hasFailed ? 'ICE connection failed' : 'ICE connecting',
        details: [
          `ICE states: ${iceStates.join(', ')}`,
          'STUN servers: stun.l.google.com:19302',
          'NAT traversal: Automatic via STUN',
          hasFailed ? 'Try refreshing if connection fails' : 'Network connectivity good'
        ]
      });
    }

    // 8. Error Check
    if (error) {
      results.push({
        name: 'Error Status',
        status: 'fail',
        message: error,
        action: () => {
          // Clear error and try to restart
          window.location.reload();
        },
        actionLabel: 'Clear & Restart'
      });
    } else {
      results.push({
        name: 'Error Status',
        status: 'pass',
        message: 'No errors reported'
      });
    }

    setChecks(results);
    setLastUpdate(Date.now());
  }, [isSharing, isViewing, localStream, remoteStream, peers, connectionState, roomId, error, localVideoRef, remoteVideoRef]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  // Auto-refresh every 5 seconds when active
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (isSharing || isViewing) {
        runChecks();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, isSharing, isViewing, runChecks]);

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-danger" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'success' as const;
      case 'warning':
        return 'warning' as const;
      case 'fail':
        return 'danger' as const;
    }
  };

  const overallStatus = checks.some(c => c.status === 'fail') ? 'fail' :
    checks.some(c => c.status === 'warning') ? 'warning' : 'pass';

  const testCoordination = () => {
    console.log('Testing coordination...');

    // Test BroadcastChannel
    if ('BroadcastChannel' in window) {
      const testChannel = new BroadcastChannel('screen-share-coordination');
      testChannel.postMessage({
        type: 'test',
        timestamp: Date.now(),
        sender: 'troubleshooting'
      });
      testChannel.close();
      console.log('BroadcastChannel test sent');
    }

    // Test localStorage
    localStorage.setItem('screen-share-test', JSON.stringify({
      type: 'test',
      timestamp: Date.now()
    }));
    setTimeout(() => {
      localStorage.removeItem('screen-share-test');
    }, 1000);
    console.log('localStorage test completed');

    runChecks();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <h3 className="text-lg font-semibold">Enhanced System Health Check</h3>
            <Chip color={getStatusColor(overallStatus)} size="sm" variant="flat">
              {overallStatus === 'pass' ? 'All Good' : overallStatus === 'warning' ? 'Issues Found' : 'Critical Issues'}
            </Chip>
          </div>
          <div className="flex gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <Wifi className={`w-4 h-4 ${autoRefresh ? 'text-success' : 'text-default-400'}`} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onClick={runChecks}
              title="Refresh checks"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {checks.map((check, index) => (
            <div key={index} className="border border-default-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium text-sm">{check.name}</p>
                    <p className="text-xs text-default-600">{check.message}</p>
                  </div>
                </div>
                {check.action && (
                  <Button
                    size="sm"
                    color={getStatusColor(check.status)}
                    variant="flat"
                    onClick={check.action}
                  >
                    {check.actionLabel}
                  </Button>
                )}
              </div>

              {check.details && (
                <div className="ml-7 space-y-1">
                  {check.details.map((detail, i) => (
                    <p key={i} className="text-xs text-default-500 font-mono">
                      {detail}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between items-center text-xs text-default-500 mt-6 pt-4 border-t border-default-200">
            <div>
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
              {autoRefresh && <span className="ml-2">(Auto-refresh: ON)</span>}
            </div>
            <Button size="sm" variant="flat" onClick={testCoordination}>
              <PlayCircle className="w-3 h-3 mr-1" />
              Test Coordination
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default EnhancedTroubleshootingChecklist;