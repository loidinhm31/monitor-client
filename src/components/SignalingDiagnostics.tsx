import { Card, CardBody, CardHeader, Chip, Button, Divider } from "@heroui/react";
import { MessageSquare, RefreshCw, Trash2, Play, User, Users, Radio } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

interface SignalingDiagnosticsProps {
  isSharing: boolean;
  isViewing: boolean;
  roomId: string;
  peers: Array<{ id: string; connection: RTCPeerConnection }>;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

interface SignalingEvent {
  timestamp: number;
  type: 'sent' | 'received' | 'localStorage' | 'broadcastChannel' | 'system';
  channel: string;
  message: any;
  source: string;
}

const SignalingDiagnostics: React.FC<SignalingDiagnosticsProps> = ({
                                                                     isSharing,
                                                                     isViewing,
                                                                     roomId,
                                                                     peers,
                                                                     localStream,
                                                                     remoteStream,
                                                                   }) => {
  const [events, setEvents] = useState<SignalingEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [signalingMessages, setSignalingMessages] = useState<any[]>([]);

  // Monitor localStorage changes
  useEffect(() => {
    if (!isMonitoring) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('screen-share')) {
        const event: SignalingEvent = {
          timestamp: Date.now(),
          type: 'localStorage',
          channel: 'localStorage',
          message: {
            key: e.key,
            oldValue: e.oldValue,
            newValue: e.newValue
          },
          source: 'StorageEvent'
        };
        setEvents(prev => [...prev.slice(-49), event]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isMonitoring]);

  // Monitor BroadcastChannel
  useEffect(() => {
    if (!isMonitoring || !('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel('screen-share-coordination');

    const originalPostMessage = channel.postMessage.bind(channel);
    channel.postMessage = (message: any) => {
      const event: SignalingEvent = {
        timestamp: Date.now(),
        type: 'sent',
        channel: 'BroadcastChannel',
        message: message,
        source: 'BroadcastChannel.postMessage'
      };
      setEvents(prev => [...prev.slice(-49), event]);
      return originalPostMessage(message);
    };

    channel.onmessage = (e) => {
      const event: SignalingEvent = {
        timestamp: Date.now(),
        type: 'received',
        channel: 'BroadcastChannel',
        message: e.data,
        source: 'BroadcastChannel.onmessage'
      };
      setEvents(prev => [...prev.slice(-49), event]);
    };

    return () => channel.close();
  }, [isMonitoring]);

  // Scan for room data and signaling messages
  const scanLocalStorage = useCallback(() => {
    if (!roomId) return;

    // Get room data
    const roomKey = `screen-share-room-${roomId}`;
    const storedRoom = localStorage.getItem(roomKey);
    setRoomData(storedRoom ? JSON.parse(storedRoom) : null);

    // Get all signaling messages for this room
    const messages = Object.keys(localStorage)
      .filter(key => key.startsWith(`screen-share-${roomId}-`))
      .map(key => ({
        key,
        data: JSON.parse(localStorage.getItem(key) || '{}'),
        age: Date.now() - (JSON.parse(localStorage.getItem(key) || '{}').timestamp || 0)
      }))
      .sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0));

    setSignalingMessages(messages);
  }, [roomId]);

  // Auto-scan when room changes
  useEffect(() => {
    if (roomId) {
      scanLocalStorage();
      const interval = setInterval(scanLocalStorage, 2000);
      return () => clearInterval(interval);
    }
  }, [roomId, scanLocalStorage]);

  // Test coordination channels
  const testCoordination = useCallback(() => {
    const testId = Math.random().toString(36).substring(7);

    // Test localStorage
    const storageTestKey = `screen-share-test-${testId}`;
    const storageTestData = {
      type: 'test',
      source: 'diagnostics',
      timestamp: Date.now(),
      testId
    };

    localStorage.setItem(storageTestKey, JSON.stringify(storageTestData));
    setTimeout(() => localStorage.removeItem(storageTestKey), 5000);

    // Test BroadcastChannel
    if ('BroadcastChannel' in window) {
      const testChannel = new BroadcastChannel('screen-share-coordination');
      testChannel.postMessage({
        type: 'test',
        source: 'diagnostics',
        timestamp: Date.now(),
        testId
      });
      testChannel.close();
    }

    // Log system event
    const systemEvent: SignalingEvent = {
      timestamp: Date.now(),
      type: 'system',
      channel: 'diagnostics',
      message: { action: 'test-coordination', testId },
      source: 'manual-test'
    };
    setEvents(prev => [...prev.slice(-49), systemEvent]);
  }, []);

  // Simulate room discovery
  const simulateRoomDiscovery = useCallback(() => {
    if (!roomId) return;

    const discoveryMessage = {
      type: 'room-discovery',
      roomId,
      viewerPeerId: 'diagnostic-viewer',
      timestamp: Date.now()
    };

    // Send via localStorage
    const storageKey = `screen-share-discovery-${Date.now()}`;
    localStorage.setItem(storageKey, JSON.stringify(discoveryMessage));
    setTimeout(() => localStorage.removeItem(storageKey), 5000);

    // Send via BroadcastChannel
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('screen-share-coordination');
      channel.postMessage(discoveryMessage);
      channel.close();
    }

    console.log('Simulated room discovery for room:', roomId);
  }, [roomId]);

  // Clear all room data
  const clearRoomData = useCallback(() => {
    if (!roomId) return;

    // Clear room info
    localStorage.removeItem(`screen-share-room-${roomId}`);

    // Clear signaling messages
    Object.keys(localStorage)
      .filter(key => key.startsWith(`screen-share-${roomId}-`))
      .forEach(key => localStorage.removeItem(key));

    // Clear general signaling
    localStorage.removeItem('screen-share-signal');

    scanLocalStorage();
    console.log('Cleared all room data for:', roomId);
  }, [roomId, scanLocalStorage]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <Play className="w-3 h-3 text-primary" />;
      case 'received':
        return <Radio className="w-3 h-3 text-success" />;
      case 'localStorage':
        return <MessageSquare className="w-3 h-3 text-warning" />;
      case 'broadcastChannel':
        return <Radio className="w-3 h-3 text-info" />;
      default:
        return <User className="w-3 h-3 text-default-400" />;
    }
  };

  const getCurrentState = () => {
    return {
      mode: isSharing ? 'host' : isViewing ? 'viewer' : 'idle',
      roomId: roomId || 'none',
      peers: peers.length,
      peerStates: peers.map(p => ({
        id: p.id.substring(0, 8),
        connectionState: p.connection.connectionState,
        iceConnectionState: p.connection.iceConnectionState
      })),
      streams: {
        local: localStream ? 'active' : 'none',
        remote: remoteStream ? 'active' : 'none'
      },
      coordination: {
        broadcastChannel: 'BroadcastChannel' in window,
        localStorage: typeof Storage !== 'undefined'
      }
    };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Signaling Flow Diagnostics</h3>
            <Chip color={isMonitoring ? "success" : "default"} size="sm" variant="flat">
              {isMonitoring ? "Monitoring" : "Idle"}
            </Chip>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? "Stop" : "Start"} Monitor
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onClick={() => setEvents([])}
              title="Clear events"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onClick={scanLocalStorage}
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="space-y-6">
          {/* Current State */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Current State</h4>
            <div className="bg-default-50 p-3 rounded-lg">
              <pre className="text-xs font-mono text-default-700">
                {JSON.stringify(getCurrentState(), null, 2)}
              </pre>
            </div>
          </div>

          {/* Room Data */}
          {roomId && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Room Data (localStorage)</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onClick={simulateRoomDiscovery}>
                    <Users className="w-3 h-3 mr-1" />
                    Test Discovery
                  </Button>
                  <Button size="sm" variant="flat" color="warning" onClick={clearRoomData}>
                    Clear Room Data
                  </Button>
                </div>
              </div>

              {roomData ? (
                <div className="bg-success-50 p-3 rounded-lg">
                  <p className="text-success text-xs font-medium mb-2">✓ Room info found</p>
                  <pre className="text-xs font-mono text-success-700">
                    {JSON.stringify(roomData, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-danger-50 p-3 rounded-lg">
                  <p className="text-danger text-xs font-medium">✗ No room info found in localStorage</p>
                  <p className="text-danger text-xs">Key: screen-share-room-{roomId}</p>
                </div>
              )}
            </div>
          )}

          {/* Signaling Messages */}
          {roomId && (
            <div>
              <h4 className="font-semibold text-sm mb-3">
                Signaling Messages ({signalingMessages.length})
              </h4>

              {signalingMessages.length > 0 ? (
                <div className="space-y-2">
                  {signalingMessages.map((msg, index) => (
                    <div key={index} className="border border-default-200 rounded p-2">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono text-primary">{msg.key}</span>
                        <span className="text-xs text-default-500">
                          {Math.round(msg.age / 1000)}s ago
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-default-600 bg-default-50 p-2 rounded">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-warning-50 p-3 rounded-lg">
                  <p className="text-warning text-xs font-medium">⚠ No signaling messages found</p>
                  <p className="text-warning text-xs">This means coordination is not working properly</p>
                </div>
              )}
            </div>
          )}

          {/* Live Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Live Events ({events.length})</h4>
              <Button size="sm" variant="flat" onClick={testCoordination}>
                Test Coordination
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {events.length === 0 ? (
                <div className="text-center py-4 text-default-500 text-sm">
                  {isMonitoring ? "Waiting for signaling events..." : "Start monitoring to see live events"}
                </div>
              ) : (
                events.slice(-20).map((event, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-default-50 rounded text-xs">
                    <div className="flex items-center gap-1 min-w-0">
                      {getEventIcon(event.type)}
                      <span className="font-mono text-default-500">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-default-700">
                        {event.channel} - {event.source}
                      </div>
                      <div className="font-mono text-default-600 break-all">
                        {JSON.stringify(event.message).substring(0, 100)}
                        {JSON.stringify(event.message).length > 100 && "..."}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Divider />

          {/* Manual Actions */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Manual Actions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                size="sm"
                variant="flat"
                onClick={() => {
                  console.log('=== COMPLETE SIGNALING STATE ===');
                  console.log('Current State:', getCurrentState());
                  console.log('Room Data:', roomData);
                  console.log('Signaling Messages:', signalingMessages);
                  console.log('Recent Events:', events.slice(-10));
                  console.log('All localStorage keys:', Object.keys(localStorage).filter(k => k.includes('screen')));
                }}
              >
                Log State
              </Button>

              <Button
                size="sm"
                variant="flat"
                onClick={() => {
                  localStorage.clear();
                  scanLocalStorage();
                  setEvents([]);
                }}
              >
                Clear All Storage
              </Button>

              <Button
                size="sm"
                variant="flat"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({
                    state: getCurrentState(),
                    roomData,
                    signalingMessages,
                    events: events.slice(-10)
                  }, null, 2));
                }}
              >
                Copy Debug Info
              </Button>

              <Button
                size="sm"
                variant="flat"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>

          {/* Troubleshooting Steps */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Troubleshooting Steps</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-mono bg-primary text-white px-1 rounded text-xs">1</span>
                <span>Host starts sharing → Check if room data appears in localStorage</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono bg-primary text-white px-1 rounded text-xs">2</span>
                <span>Viewer joins room → Check if room discovery message is sent</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono bg-primary text-white px-1 rounded text-xs">3</span>
                <span>Host receives discovery → Check if offer is created and sent</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono bg-primary text-white px-1 rounded text-xs">4</span>
                <span>Viewer receives offer → Check if answer is created and sent</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono bg-primary text-white px-1 rounded text-xs">5</span>
                <span>ICE candidates exchanged → Check peer connection states</span>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default SignalingDiagnostics;