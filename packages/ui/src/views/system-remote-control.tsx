import { useEffect, useState } from "react";
import axios from "axios";
import { Spinner } from "@repo/ui/components/atoms/spinner";
import HolographicContainer from "@repo/ui/components/atoms/holographic-container";
import { Eyes, SystemInfo } from "@repo/ui/types/sensors";
import SystemInformationTemplate from "@repo/ui/components/templates/controls/system-information-template";
import HostConnectionControl from "@repo/ui/components/templates/controls/host-connection-control";
import ServerCamera from "@repo/ui/components/templates/controls/server-camera";
import AudioControl from "@repo/ui/components/templates/controls/audio-control";
import { HostConnection } from "@repo/ui/types/connections";

export default function SystemRemoteControl() {
  const [appliedHostConnection, setAppliedHostConnection] = useState<HostConnection | null>(null);
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyes, setSelectedEyes] = useState<Eyes | null>(null);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);

  const auth = "Basic " + btoa("admin:password");

  // Fetch system info when connection changes
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        if (appliedHostConnection !== null) {
          const response = await axios.get(`http://${appliedHostConnection?.host}/system`, {
            headers: { Authorization: auth },
          });

          const systemInfo = await response.data;

          systemInfo.eyes.unshift({ index: -1, name: "Select eyes" });
          setSystemInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching system information:", error);
      }
    };

    setSystemInfo(null);
    fetchSystemInfo();
  }, [appliedHostConnection]);

  return (
    <div className="space-y-6 font-mono">
      <div>
        <h2 className="text-xl md:text-2xl  text-cyan-400 mb-4 uppercase tracking-wider">System Dashboard</h2>

        {/* Connection Status */}
        <HostConnectionControl
          appliedHostConnection={appliedHostConnection}
          setAppliedHostConnection={setAppliedHostConnection}
        />

        {/* System Controls */}
        {appliedHostConnection && (
          <HolographicContainer className="p-4 md:p-6">
            {/* System Information */}
            {systemInfo ? (
              <>
                <div className="space-y-4">
                  <SystemInformationTemplate
                    openEyes={openEyes}
                    selectedEyes={selectedEyes}
                    setEyesStatus={setEyesStatus}
                    setSelectedEyes={setSelectedEyes}
                    systemInfo={systemInfo}
                  />
                </div>

                <ServerCamera hostConnection={appliedHostConnection?.host} />

                <AudioControl hostConnection={appliedHostConnection?.host} />
              </>
            ) : (
              <div className="flex items-center gap-2 justify-center py-8">
                <Spinner size="sm" variant="liquid" />
                <span className="text-sm text-cyan-400/70 ">Loading system information...</span>
              </div>
            )}
          </HolographicContainer>
        )}
      </div>
    </div>
  );
}
