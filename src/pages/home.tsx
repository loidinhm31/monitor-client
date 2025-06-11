import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import axios from "axios";
import { useEffect, useState } from "react";

import AudioControl from "@/components/templates/controls/audio-control.tsx";
import ServerCamera from "@/components/templates/controls/server-camera.tsx";
import StreamingVideoControl from "@/components/templates/controls/streaming-video-control.tsx";
import SystemInformationTemplate from "@/components/templates/controls/system-information-template.tsx";
import { HostConnection } from "@/models/connections";
import { Eyes, SystemInfo } from "@/models/sensors";
import DefaultLayout from "@/layouts/default";
import HostConnectionControl from "@/components/templates/controls/host-connection-control.tsx";

export default function HomePage() {
  const [appliedHostConnection, setAppliedHostConnection] = useState<HostConnection | null>(null);
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyes, setSelectedEyes] = useState<Eyes | null>(null);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const auth = "Basic " + btoa("admin:password");

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        if (appliedHostConnection !== null) {
          const response = await axios.get(`http://${appliedHostConnection?.host}/system`, {
            headers: {
              Authorization: auth,
            },
          });

          const systemInfo: SystemInfo = await response.data;

          systemInfo.eyes.unshift({
            index: -1,
            name: "Select eyes",
          });
          setSystemInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching system information:", error);
      }
    };

    setSystemInfo(null);
    fetchSystemInfo();
  }, [appliedHostConnection]);

  useEffect(() => {
    let socket: WebSocket;

    if (appliedHostConnection !== null) {
      socket = new WebSocket(`ws://${appliedHostConnection.host}/sensors/eyes/ws`);

      socket.onopen = () => {
        console.log("WebSocket connection established.");
        socket.send(auth);
        setWsConnection(socket);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed.");
        setWsConnection(null);
      };
    }

    return () => {
      if (socket) {
        socket.close();
        setWsConnection(null);
      }
    };
  }, [appliedHostConnection]);

  const turnEyes = async (eyesStatus: boolean) => {
    try {
      if (wsConnection && selectedEyes?.index !== undefined && selectedEyes.index >= 0) {
        const control = {
          type: "control",
          action: eyesStatus ? "on" : "off",
          index: selectedEyes.index,
        };

        wsConnection.send(JSON.stringify(control));

        if (eyesStatus) {
          setOpenEyes(true);
          setEyesStatus(false);
        } else {
          setOpenEyes(false);
          setEyesStatus(true);
        }
      }
    } catch (error) {
      console.error("Error occurred at change eyes:", error);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="mx-auto px-1">
          <HostConnectionControl
            appliedHostConnection={appliedHostConnection}
            setAppliedHostConnection={setAppliedHostConnection}
          />

          {appliedHostConnection !== null && (
            <>
              <div className="w-full flex flex-col flex-wrap gap-4">
                {systemInfo ? (
                  <>
                    <SystemInformationTemplate
                      openEyes={openEyes}
                      selectedEyes={selectedEyes}
                      setEyesStatus={setEyesStatus}
                      setSelectedEyes={setSelectedEyes}
                      systemInfo={systemInfo}
                    />

                    <div>
                      <Button
                        color={
                          eyesStatus && !openEyes && selectedEyes !== null && selectedEyes.index >= 0
                            ? "primary"
                            : "danger"
                        }
                        disabled={selectedEyes === null || selectedEyes.index < 0 || !wsConnection}
                        variant={selectedEyes === null || selectedEyes.index < 0 ? "faded" : "solid"}
                        onPress={() => turnEyes(eyesStatus)}
                      >
                        {eyesStatus && !openEyes && selectedEyes !== null && selectedEyes.index >= 0
                          ? "Turn Eyes On"
                          : "Turn Eyes Off"}
                      </Button>
                    </div>

                    <ServerCamera hostConnection={appliedHostConnection?.host} />

                    {openEyes && <StreamingVideoControl wsConnection={wsConnection} />}
                    <AudioControl hostConnection={appliedHostConnection?.host} />
                  </>
                ) : (
                  <Spinner color="warning" label="Loading system information..." />
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </DefaultLayout>
  );
}
