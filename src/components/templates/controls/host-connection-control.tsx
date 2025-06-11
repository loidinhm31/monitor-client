import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useEffect, useRef, useState } from "react";

import { HostConnection } from "@/models/connections";

interface HostConnectionControlProps {
  appliedHostConnection: HostConnection | null;
  setAppliedHostConnection: (hostConnection: HostConnection | null) => void;
}

const HostConnectionControl = ({ appliedHostConnection, setAppliedHostConnection }: HostConnectionControlProps) => {
  const hostConnectionRef = useRef<HTMLInputElement | null>(null);

  const [hostConnections, setHostConnections] = useState<HostConnection[]>([]);
  const [hostConnectionValue, setHostConnectionValue] = useState<string>("");
  const [selectedHostConnection, setSelectedHostConnection] = useState<HostConnection | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [action, setAction] = useState("");

  useEffect(() => {
    const storedHostConnections = JSON.parse(localStorage.getItem("hostConnections") || "[]");

    if (storedHostConnections) {
      setHostConnections(storedHostConnections);
    }
  }, []);

  useEffect(() => {
    if (action !== "") {
      // Store data
      localStorage.setItem("hostConnections", JSON.stringify(hostConnections));

      if (action === "delete") {
        setSelectedHostConnection(hostConnections[0]);
      }
    }
  }, [action, hostConnections]);

  const editHostConnection = () => {
    setHostConnectionValue(selectedHostConnection ? selectedHostConnection?.host : "");
    setIsEditing(true);
  };

  const saveHostConnection = () => {
    if (hostConnectionValue !== "") {
      if (isEditing) {
        setHostConnections(
          hostConnections.map((conn) => {
            if (conn.key === selectedHostConnection?.key) {
              return { ...conn, host: hostConnectionValue };
            } else {
              return conn;
            }
          }),
        );
        setAction("edit");
        setIsEditing(false);
      } else {
        setHostConnections([...hostConnections, { key: hostConnections.length + 1, host: hostConnectionValue }]);

        setAction("add");
      }
      // Reset input
      setHostConnectionValue("");
    }
  };

  const deleteHostConnection = () => {
    setHostConnections(hostConnections.filter((conn) => conn.key !== selectedHostConnection?.key));

    setAction("delete");
  };

  const applyHostConnection = () => {
    if (appliedHostConnection === null) {
      setAppliedHostConnection(selectedHostConnection);
    } else {
      setAppliedHostConnection(null);
    }
  };

  const updateSelectedHostConnection = (key: string) => {
    const currentHostConnection = hostConnections.find((connection) => connection?.key === Number(key));

    setSelectedHostConnection(currentHostConnection ? currentHostConnection : null);
  };

  return (
    <>
      <div className="p-1">
        <div className="w-full flex flex-row flex-wrap gap-2">
          <Select
            label="Select Connection"
            placeholder="Select Connection"
            selectedKeys={[
              selectedHostConnection === null || selectedHostConnection === undefined
                ? 0
                : selectedHostConnection.key === undefined
                  ? 0
                  : selectedHostConnection.key,
            ]}
            onChange={(e) => updateSelectedHostConnection(e.target.value)}
          >
            {hostConnections.map((connection) => (
              <SelectItem key={connection.key === undefined ? 0 : connection.key}>{connection.host}</SelectItem>
            ))}
          </Select>

          {selectedHostConnection && (
            <>
              <Button
                color="success"
                variant={appliedHostConnection === null ? "solid" : "flat"}
                onPress={() => applyHostConnection()}
              >
                {appliedHostConnection === null ? "Apply" : "Withdraw"}
              </Button>

              <Button color="warning" onPress={editHostConnection}>
                Edit
              </Button>
              <Button color="danger" onPress={deleteHostConnection}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-1">
        <div className="w-full flex flex-row flex-wrap gap-2">
          <Input
            ref={hostConnectionRef}
            isDisabled={appliedHostConnection !== null}
            label="Host Connection"
            type="text"
            value={hostConnectionValue}
            onChange={(e) => setHostConnectionValue(e.target.value)}
          />

          <Button color="primary" onPress={saveHostConnection}>
            {isEditing ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default HostConnectionControl;
