import { Card, CardBody, CardHeader, Chip, Button, Divider } from "@heroui/react";
import { Play, MessageSquare, Users, ArrowRight, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

interface SignalingStep {
  step: number;
  device: 'host' | 'viewer';
  action: string;
  status: 'pending' | 'success' | 'error' | 'waiting';
  message?: string;
  data?: any;
  timestamp?: number;
}

interface StepTracerProps {
  isSharing: boolean;
  isViewing: boolean;
  roomId: string;
  peers: Array<{ id: string; connection: RTCPeerConnection }>;
}

const SignalingStepTracer: React.FC<StepTracerProps> = ({
                                                          isSharing,
                                                          isViewing,
                                                          roomId,
                                                          peers,
                                                        }) => {
  const [steps, setSteps] = useState<SignalingStep[]>([]);
  const [isTracing, setIsTracing] = useState(false);
  const [peerId] = useState(() => Math.random().toString(36).substring(7));

  // Define the expected signaling flow
  const expectedFlow: Omit<SignalingStep, 'status' | 'timestamp'>[] = [
    { step: 1, device: 'host', action: 'Start screen sharing', message: 'Host creates room and starts sharing screen' },
    { step: 2, device: 'host', action: 'Store room info', message: 'Room data saved to localStorage for discovery' },
    { step: 3, device: 'viewer', action: 'Join room request', message: 'Viewer enters room ID and clicks join' },
    { step: 4, device: 'viewer', action: 'Send room discovery', message: 'Viewer broadcasts room discovery message' },
    { step: 5, device: 'host', action: 'Receive discovery', message: 'Host receives room discovery from viewer' },
    { step: 6, device: 'host', action: 'Send room response', message: 'Host responds with room confirmation' },
    { step: 7, device: 'host', action: 'Create peer connection', message: 'Host creates RTCPeerConnection for viewer' },
    { step: 8, device: 'host', action: 'Add local stream', message: 'Host adds screen share stream to peer connection' },
    { step: 9, device: 'host', action: 'Create and send offer', message: 'Host creates SDP offer and sends to viewer' },
    { step: 10, device: 'viewer', action: 'Receive offer', message: 'Viewer receives SDP offer from host' },
    { step: 11, device: 'viewer', action: 'Create peer connection', message: 'Viewer creates RTCPeerConnection' },
    { step: 12, device: 'viewer', action: 'Set remote description', message: 'Viewer sets host offer as remote description' },
    { step: 13, device: 'viewer', action: 'Create and send answer', message: 'Viewer creates SDP answer and sends to host' },
    { step: 14, device: 'host', action: 'Receive answer', message: 'Host receives SDP answer from viewer' },
    { step: 15, device: 'host', action: 'Set remote description', message: 'Host sets viewer answer as remote description' },
    { step: 16, device: 'host', action: 'ICE candidates gathering', message: 'Host gathers and sends ICE candidates' },
    { step: 17, device: 'viewer', action: 'ICE candidates gathering', message: 'Viewer gathers and sends ICE candidates' },
    { step: 18, device: 'host', action: 'ICE connection established', message: 'Host ICE connection becomes connected' },
    { step: 19, device: 'viewer', action: 'ICE connection established', message: 'Viewer ICE connection becomes connected' },
    { step: 20, device: 'viewer', action: 'Receive video stream', message: 'Viewer receives and displays video stream' }
  ];

  // Initialize steps with expected flow
  useEffect(() => {
    setSteps(expectedFlow.map(step => ({ ...step, status: 'pending' })));
  }, []);

  // Monitor coordination messages
  useEffect(() => {
    if (!isTracing) return;

    let broadcastChannel: BroadcastChannel | null = null;

    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('screen-share-coordination');

      broadcastChannel.onmessage = (event) => {
        const message = event.data;
        console.log('🔄 BroadcastChannel message:', message);
        analyzeMessage(message);
      };
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key?.startsWith('screen-share-') && e.newValue) {
        try {
          const message = JSON.parse(e.newValue);
          console.log('🔄 localStorage message:', message);
          analyzeMessage(message);
        } catch (error) {
          console.error('Error parsing storage message:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [isTracing]);

  // Analyze messages and update steps
  const analyzeMessage = useCallback((message: any) => {
    const now = Date.now();

    setSteps(prev => {
      const updated = [...prev];

      // Room discovery messages
      if (message.type === 'room-discovery') {
        updateStep(updated, 4, 'success', `Discovery sent by ${message.viewerPeerId}`, message, now);
        if (isSharing) {
          updateStep(updated, 5, 'success', `Discovery received from ${message.viewerPeerId}`, message, now);
        }
      }

      // Room response messages
      else if (message.type === 'room-response') {
        updateStep(updated, 6, 'success', `Response sent by ${message.hostPeerId}`, message, now);
        if (isViewing) {
          updateStep(updated, 6, 'success', `Response received from ${message.hostPeerId}`, message, now);
        }
      }

      // Signaling messages
      else if (message.type === 'signaling' && message.payload) {
        const payload = message.payload;

        if (payload.type === 'offer') {
          updateStep(updated, 9, 'success', `Offer sent to ${payload.targetPeerId}`, payload, now);
          updateStep(updated, 10, 'success', `Offer received from ${payload.peerId}`, payload, now);
        }
        else if (payload.type === 'answer') {
          updateStep(updated, 13, 'success', `Answer sent to ${payload.targetPeerId}`, payload, now);
          updateStep(updated, 14, 'success', `Answer received from ${payload.peerId}`, payload, now);
        }
        else if (payload.type === 'ice-candidate') {
          updateStep(updated, 16, 'success', `ICE candidate exchanged`, payload, now);
          updateStep(updated, 17, 'success', `ICE candidate exchanged`, payload, now);
        }
      }

      return updated;
    });
  }, [isSharing, isViewing]);

  // Update step status
  const updateStep = (steps: SignalingStep[], stepNumber: number, status: SignalingStep['status'], message: string, data: any, timestamp: number) => {
    const stepIndex = steps.findIndex(s => s.step === stepNumber);
    if (stepIndex !== -1) {
      steps[stepIndex] = {
        ...steps[stepIndex],
        status,
        message: message || steps[stepIndex].message,
        data,
        timestamp
      };
    }
  };

  // Monitor component states
  useEffect(() => {
    setSteps(prev => {
      const updated = [...prev];
      const now = Date.now();

      if (isSharing) {
        updateStep(updated, 1, 'success', 'Screen sharing started', { roomId }, now);
        updateStep(updated, 2, 'success', 'Room info stored', { roomId }, now);
        updateStep(updated, 7, peers.length > 0 ? 'success' : 'pending', `Peer connections: ${peers.length}`, peers, now);
      }

      if (isViewing) {
        updateStep(updated, 3, 'success', 'Joined room', { roomId }, now);
        updateStep(updated, 11, peers.length > 0 ? 'success' : 'pending', `Peer connections: ${peers.length}`, peers, now);
      }

      return updated;
    });
  }, [isSharing, isViewing, roomId, peers]);

  // Monitor peer connection states
  useEffect(() => {
    if (peers.length === 0) return;

    setSteps(prev => {
      const updated = [...prev];
      const now = Date.now();

      peers.forEach(peer => {
        const pc = peer.connection;

        // Check connection states
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          if (isSharing) {
            updateStep(updated, 18, 'success', `Host ICE connected to ${peer.id}`, { peerId: peer.id, state: pc.iceConnectionState }, now);
          }
          if (isViewing) {
            updateStep(updated, 19, 'success', `Viewer ICE connected to ${peer.id}`, { peerId: peer.id, state: pc.iceConnectionState }, now);
          }
        }

        // Check for remote stream
        if (pc.getRemoteStreams && pc.getRemoteStreams().length > 0) {
          updateStep(updated, 20, 'success', 'Video stream received', { peerId: peer.id }, now);
        }
      });

      return updated;
    });
  }, [peers, isSharing, isViewing]);

  // Test coordination manually
  const testCoordination = useCallback(() => {
    if (!roomId) return;

    console.log('🧪 Testing coordination for room:', roomId);

    // Simulate room discovery
    const discoveryMessage = {
      type: 'room-discovery',
      roomId,
      viewerPeerId: peerId,
      timestamp: Date.now()
    };

    // Send via BroadcastChannel
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('screen-share-coordination');
      channel.postMessage(discoveryMessage);
      channel.close();
    }

    // Send via localStorage
    const storageKey = `screen-share-test-discovery-${Date.now()}`;
    localStorage.setItem(storageKey, JSON.stringify(discoveryMessage));
    setTimeout(() => localStorage.removeItem(storageKey), 5000);

    console.log('🧪 Test discovery message sent');
  }, [roomId, peerId]);

  // Check current localStorage state
  const checkStorageState = useCallback(() => {
    if (!roomId) return;

    console.log('🔍 Checking localStorage state for room:', roomId);

    // Check room data
    const roomData = localStorage.getItem(`screen-share-room-${roomId}`);
    console.log('📦 Room data:', roomData ? JSON.parse(roomData) : 'Not found');

    // Check signaling messages
    const signalingKeys = Object.keys(localStorage).filter(key => key.startsWith(`screen-share-${roomId}-`));
    console.log('📨 Signaling messages:', signalingKeys.length);

    signalingKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        console.log(`📨 ${key}:`, JSON.parse(data));
      }
    });
  }, [roomId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-danger" />;
      case 'waiting':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <div className="w-4 h-4 border-2 border-default-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success' as const;
      case 'error':
        return 'danger' as const;
      case 'waiting':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Signaling Flow Tracer</h3>
            <Chip color={isTracing ? "success" : "default"} size="sm" variant="flat">
              {isTracing ? "Tracing" : "Idle"}
            </Chip>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="flat" onClick={testCoordination}>
              Test Discovery
            </Button>
            <Button size="sm" variant="flat" onClick={checkStorageState}>
              Check Storage
            </Button>
            <Button
              size="sm"
              color={isTracing ? "danger" : "primary"}
              onClick={() => setIsTracing(!isTracing)}
            >
              {isTracing ? "Stop" : "Start"} Tracing
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="space-y-4">
          {/* Current Analysis */}
          <div className="bg-default-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">🔍 Current Analysis</h4>
            <div className="text-sm space-y-1">
              <p><strong>Issue:</strong> Both devices create separate peer connections instead of connecting to each other</p>
              <p><strong>Host peer:</strong> {peers.find(() => isSharing)?.id || 'none'}</p>
              <p><strong>Viewer peer:</strong> {peers.find(() => isViewing)?.id || 'none'}</p>
              <p><strong>Expected:</strong> Host should create connection FOR viewer's peer ID, not its own</p>
            </div>
          </div>

          {/* Steps Flow */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Expected Signaling Flow</h4>

            {steps.map((step, index) => (
              <div key={step.step} className="flex items-start gap-3 p-3 border border-default-200 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs bg-primary text-white px-2 py-1 rounded">
                    {step.step}
                  </span>
                  {getStatusIcon(step.status)}
                  <Chip color={step.device === 'host' ? 'primary' : 'secondary'} size="sm" variant="flat">
                    {step.device}
                  </Chip>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{step.action}</div>
                  <div className="text-xs text-default-600">{step.message}</div>
                  {step.timestamp && (
                    <div className="text-xs text-default-400 mt-1">
                      {formatTimestamp(step.timestamp)}
                    </div>
                  )}
                  {step.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-default-500 cursor-pointer">Show data</summary>
                      <pre className="text-xs font-mono bg-default-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Divider />

          {/* Debugging Actions */}
          <div>
            <h4 className="font-semibold text-sm mb-3">🔧 Debug Actions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <Button
                size="sm"
                variant="flat"
                onClick={() => {
                  console.log('=== SIGNALING FLOW ANALYSIS ===');
                  console.log('Steps completed:', steps.filter(s => s.status === 'success').length);
                  console.log('Steps failed:', steps.filter(s => s.status === 'error').length);
                  console.log('Current step:', steps.find(s => s.status === 'pending'));
                  console.log('All steps:', steps);
                }}
              >
                Log Analysis
              </Button>

              <Button
                size="sm"
                variant="flat"
                onClick={() => {
                  setSteps(expectedFlow.map(step => ({ ...step, status: 'pending' })));
                }}
              >
                Reset Steps
              </Button>

              <Button
                size="sm"
                variant="flat"
                onClick={() => {
                  const completedSteps = steps.filter(s => s.status === 'success');
                  navigator.clipboard.writeText(JSON.stringify(completedSteps, null, 2));
                }}
              >
                Copy Results
              </Button>

              <Button
                size="sm"
                variant="flat"
                color="warning"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                Clear & Reload
              </Button>
            </div>
          </div>

          {/* Quick Fix Instructions */}
          <div className="bg-warning-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">🚀 Quick Fix</h4>
            <div className="text-sm space-y-1">
              <p><strong>Problem:</strong> Peers aren't connecting to each other properly</p>
              <p><strong>Solution:</strong> Fix the peer targeting in signaling messages</p>
              <p><strong>Next Step:</strong> Start tracing, try to connect, and see which step fails</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default SignalingStepTracer;