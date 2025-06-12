import { Card, CardBody, CardHeader, Chip, Button, Progress } from "@heroui/react";
import { Wifi, WifiOff, Globe, Router, AlertTriangle, CheckCircle, Play } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

interface NetworkDiagnosticsProps {
  isActive?: boolean;
}

interface STUNTestResult {
  server: string;
  success: boolean;
  responseTime?: number;
  localAddress?: string;
  publicAddress?: string;
  error?: string;
}

interface NetworkTest {
  name: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
  recommendation?: string;
}

const STUN_SERVERS = [
  'stun.l.google.com:19302',
  'stun1.l.google.com:19302',
  'stun.stunprotocol.org:3478',
  'stun.sipgate.net:3478'
];

const NetworkDiagnostics: React.FC<NetworkDiagnosticsProps> = ({ isActive = false }) => {
  const [tests, setTests] = useState<NetworkTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stunResults, setStunResults] = useState<STUNTestResult[]>([]);

  // Test STUN server connectivity
  const testSTUNServer = useCallback(async (stunServer: string): Promise<STUNTestResult> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: `stun:${stunServer}` }],
        iceCandidatePoolSize: 1
      });

      let resolved = false;
      let localAddress = '';
      let publicAddress = '';

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve({
            server: stunServer,
            success: false,
            error: 'Timeout - STUN server not responding'
          });
        }
      }, 10000);

      pc.onicecandidate = (event) => {
        if (event.candidate && !resolved) {
          const candidate = event.candidate.candidate;

          if (candidate.includes('typ srflx')) {
            // Server reflexive candidate (public IP)
            const matches = candidate.match(/(\d+\.\d+\.\d+\.\d+)\s+(\d+)/);
            if (matches) {
              publicAddress = `${matches[1]}:${matches[2]}`;
            }
          } else if (candidate.includes('typ host')) {
            // Host candidate (local IP)
            const matches = candidate.match(/(\d+\.\d+\.\d+\.\d+)\s+(\d+)/);
            if (matches) {
              localAddress = `${matches[1]}:${matches[2]}`;
            }
          }

          // If we got a server reflexive candidate, the STUN server is working
          if (candidate.includes('typ srflx')) {
            resolved = true;
            clearTimeout(timeout);
            pc.close();
            resolve({
              server: stunServer,
              success: true,
              responseTime: Date.now() - startTime,
              localAddress,
              publicAddress
            });
          }
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete' && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          pc.close();

          if (publicAddress) {
            resolve({
              server: stunServer,
              success: true,
              responseTime: Date.now() - startTime,
              localAddress,
              publicAddress
            });
          } else {
            resolve({
              server: stunServer,
              success: false,
              error: 'No server reflexive candidates received'
            });
          }
        }
      };

      // Start ICE gathering
      pc.createDataChannel('test');
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
      }).catch(error => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          pc.close();
          resolve({
            server: stunServer,
            success: false,
            error: `Failed to create offer: ${error.message}`
          });
        }
      });
    });
  }, []);

  // Test network connectivity
  const testNetworkConnectivity = useCallback(async (): Promise<NetworkTest> => {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });

      return {
        name: 'Internet Connectivity',
        status: 'success',
        message: 'Connected to internet',
        details: ['HTTP requests working', 'DNS resolution working']
      };
    } catch (error) {
      return {
        name: 'Internet Connectivity',
        status: 'error',
        message: 'No internet connection',
        details: ['Cannot reach external servers'],
        recommendation: 'Check your internet connection and try again'
      };
    }
  }, []);

  // Test WebRTC support
  const testWebRTCSupport = useCallback((): NetworkTest => {
    const hasRTCPeerConnection = !!window.RTCPeerConnection;
    const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
    const hasGetDisplayMedia = !!navigator.mediaDevices?.getDisplayMedia;

    if (hasRTCPeerConnection && hasGetUserMedia && hasGetDisplayMedia) {
      return {
        name: 'WebRTC Support',
        status: 'success',
        message: 'Full WebRTC support available',
        details: [
          'RTCPeerConnection: ✓',
          'getUserMedia: ✓',
          'getDisplayMedia: ✓'
        ]
      };
    } else {
      const missing = [];
      if (!hasRTCPeerConnection) missing.push('RTCPeerConnection');
      if (!hasGetUserMedia) missing.push('getUserMedia');
      if (!hasGetDisplayMedia) missing.push('getDisplayMedia');

      return {
        name: 'WebRTC Support',
        status: 'error',
        message: `Missing WebRTC features: ${missing.join(', ')}`,
        details: missing.map(feature => `${feature}: ✗`),
        recommendation: 'Update your browser to a version that supports WebRTC'
      };
    }
  }, []);

  // Test local network configuration
  const testLocalNetwork = useCallback(async (): Promise<NetworkTest> => {
    try {
      // Test if we can create a peer connection
      const pc = new RTCPeerConnection();

      // Test if we can create a data channel
      const channel = pc.createDataChannel('test');

      // Check if we can create an offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      pc.close();

      return {
        name: 'Local Network',
        status: 'success',
        message: 'Local WebRTC configuration working',
        details: [
          'Peer connection created successfully',
          'Data channel creation working',
          'SDP offer generation working'
        ]
      };
    } catch (error) {
      return {
        name: 'Local Network',
        status: 'error',
        message: 'Local WebRTC configuration failed',
        details: [`Error: ${error.message}`],
        recommendation: 'Check browser permissions and security settings'
      };
    }
  }, []);

  // Run comprehensive network diagnostics
  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setTests([]);
    setStunResults([]);

    const totalTests = 4 + STUN_SERVERS.length; // 4 basic tests + STUN tests
    let completedTests = 0;

    const updateProgress = () => {
      completedTests++;
      setProgress((completedTests / totalTests) * 100);
    };

    try {
      // Test 1: WebRTC Support
      const webrtcTest = testWebRTCSupport();
      setTests(prev => [...prev, webrtcTest]);
      updateProgress();

      // Test 2: Internet Connectivity
      const connectivityTest = await testNetworkConnectivity();
      setTests(prev => [...prev, connectivityTest]);
      updateProgress();

      // Test 3: Local Network
      const localTest = await testLocalNetwork();
      setTests(prev => [...prev, localTest]);
      updateProgress();

      // Test 4: STUN Server Tests
      const stunTestsResults: STUNTestResult[] = [];

      // Test STUN servers in parallel
      const stunPromises = STUN_SERVERS.map(async (server) => {
        const result = await testSTUNServer(server);
        stunTestsResults.push(result);
        updateProgress();
        return result;
      });

      await Promise.all(stunPromises);
      setStunResults(stunTestsResults);

      // Analyze STUN results
      const workingStunServers = stunTestsResults.filter(r => r.success);
      const averageResponseTime = workingStunServers.length > 0
        ? workingStunServers.reduce((sum, r) => sum + (r.responseTime || 0), 0) / workingStunServers.length
        : 0;

      let stunTest: NetworkTest;
      if (workingStunServers.length === 0) {
        stunTest = {
          name: 'STUN/NAT Traversal',
          status: 'error',
          message: 'All STUN servers failed',
          details: stunTestsResults.map(r => `${r.server}: ${r.error || 'Failed'}`),
          recommendation: 'Check firewall settings or try a different network. STUN servers may be blocked.'
        };
      } else if (workingStunServers.length < STUN_SERVERS.length / 2) {
        stunTest = {
          name: 'STUN/NAT Traversal',
          status: 'warning',
          message: `${workingStunServers.length}/${STUN_SERVERS.length} STUN servers working`,
          details: [
            ...workingStunServers.map(r => `✓ ${r.server}: ${r.responseTime}ms`),
            ...stunTestsResults.filter(r => !r.success).map(r => `✗ ${r.server}: ${r.error}`)
          ],
          recommendation: 'Some STUN servers are not reachable. Connection may be unstable.'
        };
      } else {
        stunTest = {
          name: 'STUN/NAT Traversal',
          status: 'success',
          message: `NAT traversal working (avg: ${Math.round(averageResponseTime)}ms)`,
          details: [
            ...workingStunServers.map(r => `✓ ${r.server}: ${r.responseTime}ms`),
            ...(workingStunServers[0]?.publicAddress ? [`Public IP: ${workingStunServers[0].publicAddress}`] : [])
          ]
        };
      }

      setTests(prev => [...prev, stunTest]);

    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setIsRunning(false);
      updateProgress();
    }
  }, [testSTUNServer, testNetworkConnectivity, testWebRTCSupport, testLocalNetwork]);

  // Auto-run diagnostics when component becomes active
  useEffect(() => {
    if (isActive && tests.length === 0) {
      runDiagnostics();
    }
  }, [isActive, tests.length, runDiagnostics]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-danger" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <Globe className="w-4 h-4 text-default-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success' as const;
      case 'warning':
        return 'warning' as const;
      case 'error':
        return 'danger' as const;
      default:
        return 'default' as const;
    }
  };

  const overallStatus = tests.length === 0 ? 'pending' :
    tests.some(t => t.status === 'error') ? 'error' :
      tests.some(t => t.status === 'warning') ? 'warning' : 'success';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Router className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Network Diagnostics</h3>
            <Chip color={getStatusColor(overallStatus)} size="sm" variant="flat">
              {overallStatus === 'success' ? 'All Good' :
                overallStatus === 'warning' ? 'Issues Found' :
                  overallStatus === 'error' ? 'Problems Detected' : 'Ready'}
            </Chip>
          </div>
          <Button
            color="primary"
            isDisabled={isRunning}
            size="sm"
            startContent={<Play className="w-4 h-4" />}
            onClick={runDiagnostics}
          >
            {isRunning ? 'Running...' : 'Test Network'}
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        <div className="space-y-4">
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running diagnostics...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} color="primary" />
            </div>
          )}

          {tests.map((test, index) => (
            <div key={index} className="border border-default-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-medium text-sm">{test.name}</p>
                    <p className="text-xs text-default-600">{test.message}</p>
                  </div>
                </div>
              </div>

              {test.details && (
                <div className="ml-7 mt-2 space-y-1">
                  {test.details.map((detail, i) => (
                    <p key={i} className="text-xs text-default-500 font-mono">
                      {detail}
                    </p>
                  ))}
                </div>
              )}

              {test.recommendation && (
                <div className="ml-7 mt-2 p-2 bg-warning-50 rounded text-xs text-warning-800">
                  <strong>Recommendation:</strong> {test.recommendation}
                </div>
              )}
            </div>
          ))}

          {stunResults.length > 0 && (
            <div className="border border-default-200 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-3">STUN Server Details</h4>
              <div className="space-y-2">
                {stunResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {result.success ?
                        <CheckCircle className="w-3 h-3 text-success" /> :
                        <WifiOff className="w-3 h-3 text-danger" />
                      }
                      <span className="font-mono">{result.server}</span>
                    </div>
                    <div className="text-right">
                      {result.success ? (
                        <span className="text-success">{result.responseTime}ms</span>
                      ) : (
                        <span className="text-danger">Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tests.length > 0 && (
            <div className="text-xs text-default-500 pt-4 border-t border-default-200">
              <div className="space-y-2">
                <h5 className="font-medium">Common Solutions:</h5>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>ICE candidate errors:</strong> Usually non-critical, WebRTC will try alternative connection paths</li>
                  <li>• <strong>STUN server failures:</strong> Check firewall settings, try different network, or contact IT admin</li>
                  <li>• <strong>Video autoplay blocked:</strong> User interaction required - click video to start playback</li>
                  <li>• <strong>Connection fails:</strong> Both devices should be on same network or have TURN server</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default NetworkDiagnostics;