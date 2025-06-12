import { useCallback, useEffect, useRef, useState } from 'react';

interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
}

interface ScreenShareState {
  isSharing: boolean;
  isViewing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peers: PeerConnection[];
  roomId: string;
  error: string | null;
  connectionState: RTCPeerConnectionState;
  connectionInfo: ConnectionInfo | null;
}

interface ConnectionInfo {
  roomId: string;
  hostIP: string;
  sessionKey: string;
  timestamp: number;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-request' | 'peer-joined' | 'peer-left' | 'room-discovery' | 'room-response';
  roomId: string;
  peerId: string;
  data?: any;
  timestamp: number;
}

// Serializable ICE candidate format
interface SerializableIceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
  usernameFragment: string | null;
}

// Convert RTCIceCandidate to serializable format
const serializeIceCandidate = (candidate: RTCIceCandidate): SerializableIceCandidate => {
  return {
    candidate: candidate.candidate,
    sdpMLineIndex: candidate.sdpMLineIndex,
    sdpMid: candidate.sdpMid,
    usernameFragment: candidate.usernameFragment
  };
};

// Convert serializable format back to RTCIceCandidate
const deserializeIceCandidate = (data: SerializableIceCandidate): RTCIceCandidate => {
  return new RTCIceCandidate({
    candidate: data.candidate,
    sdpMLineIndex: data.sdpMLineIndex,
    sdpMid: data.sdpMid,
    usernameFragment: data.usernameFragment
  });
};

// Enhanced ICE servers with multiple STUN/TURN options
const ICE_SERVERS = [
  // Google STUN servers
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },

  // Additional public STUN servers for redundancy
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.sipgate.net:3478' },

  // If you have TURN servers, add them here:
  // {
  //   urls: 'turn:your-turn-server.com:3478',
  //   username: 'your-username',
  //   credential: 'your-password'
  // }
];

// Enhanced RTCConfiguration for better connectivity
const createRTCConfiguration = (): RTCConfiguration => ({
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all', // Allow both STUN and TURN
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  // Enable ICE restart capability
  iceRestart: false
});

export const useServerlessScreenShare = (hostConnection: string | null) => {
  const [state, setState] = useState<ScreenShareState>({
    isSharing: false,
    isViewing: false,
    localStream: null,
    remoteStream: null,
    peers: [],
    roomId: '',
    error: null,
    connectionState: 'new',
    connectionInfo: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerId = useRef(Math.random().toString(36).substring(7));
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  const processedMessages = useRef<Set<string>>(new Set());
  const peerCreationInProgress = useRef<Set<string>>(new Set());

  // Use refs to avoid stale closures
  const stateRef = useRef(state);
  const peersRef = useRef<PeerConnection[]>([]);
  const videoUpdateTimeoutRef = useRef<number | null>(null);

  // Update refs when state changes
  useEffect(() => {
    stateRef.current = state;
    peersRef.current = state.peers;
  }, [state]);

  // Safe video element updater to prevent play() interruptions
  const safeUpdateVideoElement = useCallback((
    videoElement: HTMLVideoElement | null,
    stream: MediaStream | null,
    elementName: string
  ) => {
    if (!videoElement || !stream) return;

    // Clear any pending video updates
    if (videoUpdateTimeoutRef.current) {
      clearTimeout(videoUpdateTimeoutRef.current);
    }

    // Check if the stream is already set
    if (videoElement.srcObject === stream) {
      console.log(`${elementName} video already has correct stream`);
      return;
    }

    console.log(`Setting ${elementName} video srcObject`);

    // Pause current video to prevent conflicts
    if (!videoElement.paused) {
      videoElement.pause();
    }

    // Set new stream
    videoElement.srcObject = stream;

    // Wait a bit before trying to play to avoid interruptions
    videoUpdateTimeoutRef.current = setTimeout(async () => {
      try {
        if (videoElement.srcObject === stream) {
          await videoElement.play();
          console.log(`${elementName} video playing successfully`);
        }
      } catch (error) {
        // Only log significant errors, ignore common autoplay blocks
        if (error.name !== 'AbortError') {
          console.warn(`${elementName} video play failed:`, error.message);
        }
      }
    }, 100);
  }, []);

  // Create peer connection with enhanced error handling and ICE configuration
  const createPeerConnection = useCallback((targetPeerId: string, isInitiator: boolean = false) => {
    console.log(`Creating peer connection for: ${targetPeerId}, isInitiator: ${isInitiator}`);

    const pc = new RTCPeerConnection(createRTCConfiguration());

    // Enhanced connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${targetPeerId}:`, pc.iceConnectionState);

      // Handle specific ICE states
      switch (pc.iceConnectionState) {
        case 'failed':
          console.warn(`ICE connection failed for ${targetPeerId}, attempting restart...`);
          // Automatically restart ICE on failure
          setTimeout(() => {
            if (pc.iceConnectionState === 'failed') {
              console.log(`Restarting ICE for ${targetPeerId}`);
              pc.restartIce();
            }
          }, 2000);
          break;
        case 'disconnected':
          console.warn(`ICE connection disconnected for ${targetPeerId}`);
          // Wait a bit before restart to allow automatic recovery
          setTimeout(() => {
            if (pc.iceConnectionState === 'disconnected') {
              console.log(`ICE still disconnected, restarting for ${targetPeerId}`);
              pc.restartIce();
            }
          }, 5000);
          break;
      }

      // Update overall connection state based on peer states
      const currentPeers = peersRef.current;
      const connectedPeers = currentPeers.filter(p =>
        p.connection.iceConnectionState === 'connected' ||
        p.connection.iceConnectionState === 'completed'
      );

      let newConnectionState: RTCPeerConnectionState = 'new';
      if (connectedPeers.length > 0) {
        newConnectionState = 'connected';
      } else if (currentPeers.some(p => p.connection.iceConnectionState === 'connecting')) {
        newConnectionState = 'connecting';
      } else if (currentPeers.some(p => p.connection.iceConnectionState === 'failed')) {
        newConnectionState = 'failed';
      }

      setState(prev => ({ ...prev, connectionState: newConnectionState }));
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${targetPeerId}:`, pc.connectionState);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to: ${targetPeerId}`);

        const serializedCandidate = serializeIceCandidate(event.candidate);
        const message: SignalingMessage = {
          type: 'ice-candidate',
          roomId: stateRef.current.roomId,
          peerId: peerId.current,
          data: serializedCandidate,
          timestamp: Date.now(),
        };

        broadcastSignalingMessage({
          type: 'signaling',
          roomId: stateRef.current.roomId,
          payload: message,
          targetPeerId
        });
      }
    };

    // Enhanced ICE candidate error handling
    pc.onicecandidateerror = (event) => {
      // Filter out common non-critical ICE errors
      const error = event as RTCPeerConnectionIceErrorEvent;

      // Log only if it's a significant error
      if (error.errorCode && error.errorCode >= 400) {
        console.warn(`ICE candidate error for ${targetPeerId}:`, {
          errorCode: error.errorCode,
          errorText: error.errorText,
          url: error.url,
          address: error.address
        });
      }

      // Don't set error state for common ICE gathering issues
      // These are often non-critical and ICE can still succeed with other candidates
    };

    // For viewers: handle incoming stream with safe video updates
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      const remoteStream = event.streams[0];

      setState(prev => ({ ...prev, remoteStream }));

      // Use safe video update with delay
      setTimeout(() => {
        safeUpdateVideoElement(remoteVideoRef.current, remoteStream, 'remote');
      }, 200);
    };

    // Handle ICE gathering state changes
    pc.onicegatheringstatechange = () => {
      console.log(`ICE gathering state for ${targetPeerId}:`, pc.iceGatheringState);
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log(`Signaling state for ${targetPeerId}:`, pc.signalingState);
    };

    return pc;
  }, [safeUpdateVideoElement]);

  // Broadcast signaling message to coordination channels
  const broadcastSignalingMessage = useCallback((message: any) => {
    console.log('Broadcasting signaling message:', message.type, message.payload?.type);

    try {
      // Method 1: BroadcastChannel (same origin)
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage(message);
      }

      // Method 2: localStorage events (same origin fallback)
      if (!('BroadcastChannel' in window)) {
        const storageMessage = {
          ...message,
          timestamp: Date.now(),
          sender: peerId.current
        };
        localStorage.setItem('screen-share-signal', JSON.stringify(storageMessage));
        setTimeout(() => {
          localStorage.removeItem('screen-share-signal');
        }, 100);
      }

      // Method 3: Use existing WebSocket if available
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'screen-share-relay',
          payload: message
        }));
      }

      // Store signaling message in localStorage for discovery
      if (message.type === 'signaling') {
        const storageKey = `screen-share-${message.roomId}-${message.payload.type}`;
        localStorage.setItem(storageKey, JSON.stringify({
          ...message,
          timestamp: Date.now()
        }));

        // Clean up old messages after 30 seconds
        setTimeout(() => {
          localStorage.removeItem(storageKey);
        }, 30000);
      }
    } catch (error) {
      console.error('Error broadcasting signaling message:', error);
    }
  }, []);

  // Handle WebRTC signaling messages with better error handling and ICE restart
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    const messageId = `${message.type}-${message.peerId}-${message.roomId}-${message.timestamp}`;

    // Prevent duplicate processing
    if (processedMessages.current.has(messageId)) {
      console.log('Ignoring duplicate signaling message:', messageId);
      return;
    }
    processedMessages.current.add(messageId);

    // Clean up old message IDs
    if (processedMessages.current.size > 100) {
      const entries = Array.from(processedMessages.current);
      processedMessages.current.clear();
      entries.slice(-50).forEach(id => processedMessages.current.add(id));
    }

    console.log('Handling signaling message:', message.type, 'from:', message.peerId);

    try {
      const currentState = stateRef.current;

      switch (message.type) {
        case 'offer':
          if (currentState.isViewing && message.roomId === currentState.roomId) {
            console.log('Viewer handling offer from host');

            // Check if peer already exists
            const existingPeer = peersRef.current.find(p => p.id === message.peerId);
            if (existingPeer) {
              console.log('Peer already exists, updating connection');
              try {
                await existingPeer.connection.setRemoteDescription(message.data);
                const answer = await existingPeer.connection.createAnswer();
                await existingPeer.connection.setLocalDescription(answer);

                const response: SignalingMessage = {
                  type: 'answer',
                  roomId: message.roomId,
                  peerId: peerId.current,
                  data: answer,
                  timestamp: Date.now(),
                };

                broadcastSignalingMessage({
                  type: 'signaling',
                  roomId: message.roomId,
                  payload: response,
                  targetPeerId: message.peerId
                });
              } catch (error) {
                console.error('Error handling offer for existing peer:', error);
                // Try to restart the connection
                existingPeer.connection.restartIce();
              }
              return;
            }

            const pc = createPeerConnection(message.peerId, false);

            await pc.setRemoteDescription(message.data);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const response: SignalingMessage = {
              type: 'answer',
              roomId: message.roomId,
              peerId: peerId.current,
              data: answer,
              timestamp: Date.now(),
            };

            broadcastSignalingMessage({
              type: 'signaling',
              roomId: message.roomId,
              payload: response,
              targetPeerId: message.peerId
            });

            setState(prev => ({
              ...prev,
              peers: [...prev.peers, { id: message.peerId, connection: pc }],
              connectionState: 'connecting'
            }));
          }
          break;

        case 'answer':
          if (currentState.isSharing && message.roomId === currentState.roomId) {
            console.log('Host handling answer from viewer');
            const peer = peersRef.current.find(p => p.id === message.peerId);
            if (peer) {
              try {
                await peer.connection.setRemoteDescription(message.data);
                console.log('Answer processed successfully');
              } catch (error) {
                console.error('Error processing answer:', error);
                // Try to restart ICE on error
                peer.connection.restartIce();
              }
            } else {
              console.warn('Received answer for unknown peer:', message.peerId);
            }
          }
          break;

        case 'ice-candidate':
          const peer = peersRef.current.find(p => p.id === message.peerId);
          if (peer && message.roomId === currentState.roomId) {
            console.log('Adding ICE candidate from:', message.peerId);
            try {
              const iceCandidate = deserializeIceCandidate(message.data);

              // Only add candidate if connection is in appropriate state
              if (peer.connection.remoteDescription) {
                await peer.connection.addIceCandidate(iceCandidate);
                console.log('ICE candidate added successfully');
              } else {
                console.warn('Cannot add ICE candidate: no remote description set');
              }
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
              // Don't restart ICE for candidate errors, they're often non-critical
            }
          } else {
            console.warn('Received ICE candidate for unknown peer or wrong room:', message.peerId, message.roomId);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      setState(prev => ({ ...prev, error: `Signaling error: ${error.message}` }));
    }
  }, [createPeerConnection, broadcastSignalingMessage]);

  // Create offer for new peer with enhanced configuration
  const createOfferForPeer = useCallback(async (targetPeerId: string, localStream: MediaStream) => {
    // Prevent duplicate peer creation
    if (peerCreationInProgress.current.has(targetPeerId)) {
      console.log('Peer creation already in progress for:', targetPeerId);
      return;
    }

    const existingPeer = peersRef.current.find(p => p.id === targetPeerId);
    if (existingPeer) {
      console.log('Peer already exists:', targetPeerId);
      return;
    }

    peerCreationInProgress.current.add(targetPeerId);

    try {
      console.log('Creating offer for peer:', targetPeerId);
      const pc = createPeerConnection(targetPeerId, true);

      // Add local stream to peer connection with error handling
      localStream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind, track.label);
        try {
          pc.addTrack(track, localStream);
        } catch (error) {
          console.error('Error adding track:', error);
        }
      });

      // Create offer with enhanced options
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: false
      });
      await pc.setLocalDescription(offer);

      const message: SignalingMessage = {
        type: 'offer',
        roomId: stateRef.current.roomId,
        peerId: peerId.current,
        data: offer,
        timestamp: Date.now(),
      };

      broadcastSignalingMessage({
        type: 'signaling',
        roomId: stateRef.current.roomId,
        payload: message,
        targetPeerId
      });

      setState(prev => ({
        ...prev,
        peers: [...prev.peers, { id: targetPeerId, connection: pc }]
      }));

      console.log('Offer created and sent to:', targetPeerId);
    } catch (error) {
      console.error('Error creating offer:', error);
      setState(prev => ({ ...prev, error: `Failed to create offer: ${error.message}` }));
    } finally {
      peerCreationInProgress.current.delete(targetPeerId);
    }
  }, [createPeerConnection, broadcastSignalingMessage]);

  // Handle coordination messages from other tabs/windows
  const handleCoordinationMessage = useCallback(async (message: any) => {
    const messageId = `coord-${message.type}-${message.viewerPeerId || message.hostPeerId}-${message.roomId}-${message.timestamp}`;

    if (processedMessages.current.has(messageId)) {
      console.log('Ignoring duplicate coordination message:', messageId);
      return;
    }
    processedMessages.current.add(messageId);

    console.log('Received coordination message:', message);

    try {
      const currentState = stateRef.current;

      if (message.type === 'signaling' && message.roomId === currentState.roomId) {
        await handleSignalingMessage(message.payload);
      } else if (message.type === 'room-discovery' && message.roomId === currentState.roomId && currentState.isSharing) {
        console.log('Host received room discovery request from:', message.viewerPeerId);

        // Respond with room info
        broadcastSignalingMessage({
          type: 'room-response',
          roomId: currentState.roomId,
          hostPeerId: peerId.current,
          connectionInfo: currentState.connectionInfo,
          targetPeerId: message.viewerPeerId,
          timestamp: Date.now()
        });

        // Create offer for the new viewer after a short delay
        setTimeout(async () => {
          if (stateRef.current.localStream && stateRef.current.isSharing) {
            await createOfferForPeer(message.viewerPeerId, stateRef.current.localStream);
          }
        }, 500);
      } else if (message.type === 'room-response' && message.roomId === currentState.roomId && currentState.isViewing) {
        console.log('Viewer received room response from host:', message.hostPeerId);
        setState(prev => ({
          ...prev,
          connectionInfo: message.connectionInfo,
          connectionState: 'connecting'
        }));
      }
    } catch (error) {
      console.error('Error processing coordination message:', error);
    }
  }, [handleSignalingMessage, broadcastSignalingMessage, createOfferForPeer]);

  // Initialize coordination mechanisms
  useEffect(() => {
    console.log('Initializing coordination mechanisms');

    if ('BroadcastChannel' in window) {
      broadcastChannel.current = new BroadcastChannel('screen-share-coordination');
      broadcastChannel.current.onmessage = (event) => {
        handleCoordinationMessage(event.data);
      };
    }

    return () => {
      if (broadcastChannel.current) {
        broadcastChannel.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (videoUpdateTimeoutRef.current) {
        clearTimeout(videoUpdateTimeoutRef.current);
      }
    };
  }, [handleCoordinationMessage]);

  // Listen for localStorage events
  useEffect(() => {
    if ('BroadcastChannel' in window) {
      return;
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'screen-share-signal' && e.newValue) {
        try {
          const message = JSON.parse(e.newValue);
          if (message.sender !== peerId.current) {
            handleCoordinationMessage(message);
          }
        } catch (error) {
          console.error('Error parsing storage message:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [handleCoordinationMessage]);

  // Initialize WebSocket coordination
  const initializeCoordination = useCallback(() => {
    if (!hostConnection || hostConnection === 'your-host-connection' ||
      (!hostConnection.includes('.') && !hostConnection.includes(':'))) {
      console.log('Skipping WebSocket coordination - no valid host connection');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${hostConnection}/ws`;

    console.log('Attempting WebSocket coordination to:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket coordination connected');
      setState(prev => ({ ...prev, error: null }));

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    wsRef.current.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'screen-share-relay') {
          await handleCoordinationMessage(message.payload);
        }
      } catch (error) {
        console.error('Error handling coordination message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.warn('WebSocket coordination error (falling back to local coordination):', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket coordination closed');
      const currentState = stateRef.current;
      if ((currentState.isSharing || currentState.isViewing) && !reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          initializeCoordination();
        }, 5000);
      }
    };
  }, [hostConnection, handleCoordinationMessage]);

  // Generate connection info for sharing
  const generateConnectionInfo = useCallback((roomId: string): ConnectionInfo => {
    return {
      roomId,
      hostIP: hostConnection || window.location.host,
      sessionKey: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
    };
  }, [hostConnection]);

  // Create shareable URL or QR code data
  const createShareableInfo = useCallback((roomId: string) => {
    const connectionInfo = generateConnectionInfo(roomId);

    const currentUrl = window.location.origin;
    const shareUrl = `${currentUrl}/#/mirror?room=${roomId}&host=${hostConnection}&key=${connectionInfo.sessionKey}`;

    const qrData = JSON.stringify({
      type: 'screen-share',
      room: roomId,
      host: hostConnection,
      key: connectionInfo.sessionKey,
      timestamp: connectionInfo.timestamp
    });

    return { shareUrl, qrData, connectionInfo };
  }, [generateConnectionInfo, hostConnection]);

  // Start screen sharing
  const startScreenShare = useCallback(async (roomId: string) => {
    try {
      console.log('Starting screen share for room:', roomId);
      setState(prev => ({ ...prev, error: null }));

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const { connectionInfo } = createShareableInfo(roomId);

      setState(prev => ({
        ...prev,
        localStream: stream,
        isSharing: true,
        roomId,
        connectionInfo,
        connectionState: 'new',
        peers: [],
      }));

      // Set local video preview with safe updater
      setTimeout(() => {
        safeUpdateVideoElement(localVideoRef.current, stream, 'local');
      }, 200);

      // Handle stream end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen share ended by user');
        stopScreenShare();
      });

      // Initialize coordination
      initializeCoordination();

      // Store room info in localStorage for discovery
      localStorage.setItem(`screen-share-room-${roomId}`, JSON.stringify(connectionInfo));

      console.log('Screen share started successfully');

    } catch (error) {
      console.error('Error starting screen share:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start screen share'
      }));
    }
  }, [createShareableInfo, initializeCoordination, safeUpdateVideoElement]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    console.log('Stopping screen share');

    setState(prev => {
      if (prev.localStream) {
        prev.localStream.getTracks().forEach(track => track.stop());
      }

      prev.peers.forEach(peer => {
        peer.connection.close();
      });

      localStorage.removeItem(`screen-share-room-${prev.roomId}`);

      // Clear video elements safely
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      processedMessages.current.clear();
      peerCreationInProgress.current.clear();

      return {
        ...prev,
        isSharing: false,
        localStream: null,
        peers: [],
        connectionInfo: null,
        connectionState: 'closed',
        roomId: '',
      };
    });
  }, []);

  // Join as viewer
  const joinAsViewer = useCallback(async (roomId: string) => {
    try {
      console.log('Joining as viewer for room:', roomId);

      setState(prev => ({
        ...prev,
        isViewing: true,
        roomId,
        error: null,
        connectionState: 'new',
        peers: [],
      }));

      // Initialize coordination
      initializeCoordination();

      // Look for room info in localStorage first
      const storedRoom = localStorage.getItem(`screen-share-room-${roomId}`);
      if (storedRoom) {
        const connectionInfo = JSON.parse(storedRoom);
        setState(prev => ({ ...prev, connectionInfo }));
        console.log('Found stored room info');
      }

      // Look for existing signaling messages
      const existingMessages = Object.keys(localStorage)
        .filter(key => key.startsWith(`screen-share-${roomId}-`))
        .map(key => {
          try {
            return JSON.parse(localStorage.getItem(key) || '');
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (existingMessages.length > 0) {
        console.log('Found existing signaling messages, processing...');
        for (const message of existingMessages) {
          if (message.payload) {
            await handleSignalingMessage(message.payload);
          }
        }
      }

      // Send discovery request
      console.log('Sending room discovery request');
      broadcastSignalingMessage({
        type: 'room-discovery',
        roomId,
        viewerPeerId: peerId.current,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error joining room:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join room'
      }));
    }
  }, [initializeCoordination, broadcastSignalingMessage, handleSignalingMessage]);

  // Leave viewing
  const leaveViewing = useCallback(() => {
    console.log('Leaving viewing');

    setState(prev => {
      prev.peers.forEach(peer => {
        peer.connection.close();
      });

      // Clear remote video safely
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      processedMessages.current.clear();
      peerCreationInProgress.current.clear();

      return {
        ...prev,
        isViewing: false,
        remoteStream: null,
        peers: [],
        connectionInfo: null,
        connectionState: 'closed',
        roomId: '',
      };
    });
  }, []);

  // Generate QR code data
  const generateQRCode = useCallback(() => {
    if (!state.isSharing || !state.connectionInfo) return null;

    const qrData = JSON.stringify({
      type: 'screen-share',
      room: state.roomId,
      host: hostConnection,
      timestamp: state.connectionInfo.timestamp
    });

    return qrData;
  }, [state.isSharing, state.connectionInfo, state.roomId, hostConnection]);

  return {
    ...state,
    localVideoRef,
    remoteVideoRef,
    startScreenShare,
    stopScreenShare,
    joinAsViewer,
    leaveViewing,
    createOfferForPeer: (targetPeerId: string) => {
      if (state.localStream) {
        createOfferForPeer(targetPeerId, state.localStream);
      }
    },
    createShareableInfo,
    generateQRCode,
  };
};