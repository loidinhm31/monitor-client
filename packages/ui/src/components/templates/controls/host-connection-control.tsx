import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { HostConnection } from "@repo/ui/types/connections";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Input } from "@repo/ui/components/ui/input";
import HolographicButton from "@repo/ui/components/atoms/holographic-button";
import HolographicContainer from "@repo/ui/components/atoms/holographic-container";
import StatusIndicator from "@repo/ui/components/atoms/status-indicator";

interface HostConnectionControlProps {
  appliedHostConnection: HostConnection | null;
  setAppliedHostConnection: (connection: HostConnection | null) => void;
}

const HostConnectionControl: React.FC<HostConnectionControlProps> = ({
  appliedHostConnection,
  setAppliedHostConnection,
}) => {
  const [hostConnections, setHostConnections] = useState<HostConnection[]>([]);
  const [hostConnectionValue, setHostConnectionValue] = useState<string>("");
  const [selectedHostConnection, setSelectedHostConnection] = useState<HostConnection | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    const storedHostConnections = JSON.parse(localStorage.getItem("hostConnections") || "[]");

    if (storedHostConnections) {
      setHostConnections(storedHostConnections);
    }
  }, []);

  const saveHostConnection = () => {
    if (hostConnectionValue !== "") {
      if (isEditing) {
        setHostConnections(
          hostConnections.map((conn) => {
            if (conn.key === selectedHostConnection?.key) {
              return { ...conn, host: hostConnectionValue };
            }

            return conn;
          }),
        );
        setIsEditing(false);
      } else {
        const newConnection = { key: hostConnections.length + 1, host: hostConnectionValue };

        setHostConnections([...hostConnections, newConnection]);
      }
      localStorage.setItem("hostConnections", JSON.stringify(hostConnections));
      setHostConnectionValue("");
    }
  };

  const applyHostConnection = () => {
    if (appliedHostConnection === null) {
      setAppliedHostConnection(selectedHostConnection);
    } else {
      setAppliedHostConnection(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Connection Status */}
        <HolographicContainer className="p-4 md:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusIndicator online={appliedHostConnection !== null} />
            <span className="font-mono text-sm text-cyan-400">
              {appliedHostConnection ? `Connected to ${appliedHostConnection.host}` : "Disconnected"}
            </span>
          </div>

          <div className="space-y-4">
            <Select
              onValueChange={(value) => {
                const connection = hostConnections.find((conn) => conn.key === Number(value));

                setSelectedHostConnection(connection || null);
              }}
            >
              <SelectTrigger className="w-full bg-black/20 border-cyan-400/30 text-cyan-400">
                <SelectValue placeholder="Select connection" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-cyan-400/30">
                {hostConnections.map((connection) => (
                  <SelectItem key={connection.key} value={connection.key?.toString() || "0"}>
                    {connection.host}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedHostConnection && (
              <HolographicButton
                className="w-full"
                variant={appliedHostConnection === null ? "primary" : "danger"}
                onClick={applyHostConnection}
              >
                {appliedHostConnection === null ? "Connect" : "Disconnect"}
              </HolographicButton>
            )}

            <div className="flex gap-2">
              <Input
                className="flex-1 bg-black/20 border-cyan-400/30 text-cyan-400 placeholder:text-cyan-400/50"
                disabled={appliedHostConnection !== null}
                placeholder="Host connection (e.g., 192.168.1.100)"
                value={hostConnectionValue}
                onChange={(e) => setHostConnectionValue(e.target.value)}
              />
              <HolographicButton size="sm" onClick={saveHostConnection}>
                <Plus className="w-4 h-4 mr-1" />
                {isEditing ? "Save" : "Add"}
              </HolographicButton>
            </div>
          </div>
        </HolographicContainer>
      </div>
    </div>
  );
};

export default HostConnectionControl;
