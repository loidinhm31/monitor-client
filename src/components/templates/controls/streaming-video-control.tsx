import { useEffect, useState } from "react";

import SaveDataControl from "@/components/templates/controls/save-data-control.tsx";
import HolographicContainer from "@/components/atoms/holographic-container.tsx";
import { CardContent, CardHeader } from "@/components/ui/card.tsx";

interface StreamingControlProps {
  wsConnection: WebSocket | null;
  isStreaming: boolean;
  getCurrentFrame: () => string | null;
}

const StreamingVideoControl = ({ wsConnection, isStreaming, getCurrentFrame }: StreamingControlProps) => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugMessage = (message: string) => {
    setDebugInfo((prev) => {
      const newMessages = [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`];

      console.log("StreamingControl Debug:", message);

      return newMessages;
    });
  };

  useEffect(() => {
    if (wsConnection) {
      addDebugMessage("WebSocket connection established for capture controls");

      // We don't need to process messages here anymore since the main camera handles that
      // Just monitor connection status
      const originalOnClose = wsConnection.onclose;
      const originalOnError = wsConnection.onerror;

      wsConnection.onclose = (e) => {
        addDebugMessage(`Connection closed: ${e.code} ${e.reason}`);

        if (originalOnClose) {
          originalOnClose.call(wsConnection, e);
        }
      };

      wsConnection.onerror = (e) => {
        addDebugMessage(`Connection error: ${e.type}`);

        if (originalOnError) {
          originalOnError.call(wsConnection, e);
        }
      };

      return () => {
        if (wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.onclose = originalOnClose;
          wsConnection.onerror = originalOnError;
        }
      };
    } else {
      addDebugMessage("No WebSocket connection provided");
    }
  }, [wsConnection]);

  // Reset state when connection changes
  useEffect(() => {
    setDebugInfo([]);
  }, [wsConnection]);

  return (
    <div className="w-full flex flex-row gap-4">
      {/* Save Data Controls */}
      <HolographicContainer className="w-full p-4">
        <h3 className="text-sm font-semibold text-cyan-400 mb-4">Image & Video Capture</h3>
        <SaveDataControl getCurrentFrame={getCurrentFrame} isStreaming={isStreaming} />
      </HolographicContainer>

      {/* Debug Information */}
      <HolographicContainer className="w-full p-4">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-cyan-400">Debug Log</h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <div className="text-xs text-cyan-400/50 font-mono">No debug messages yet...</div>
            ) : (
              debugInfo.map((msg, i) => (
                <div key={i} className="text-xs text-cyan-400/70 font-mono">
                  {msg}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </HolographicContainer>
    </div>
  );
};

export default StreamingVideoControl;
