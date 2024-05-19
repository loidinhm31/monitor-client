import axios from "axios";
import { useEffect, useState } from "react";

import { SystemInfo } from "./models/sensors.tsx";

const App = () => {
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyesIndex, setSelectedEyesIndex] = useState<number | null>(null);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);

  const auth = "Basic " + btoa("admin:password"); // Use the same credentials as in the server

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8081/sensors/eyes", {
          headers: {
            Authorization: auth
          }
        });
        const systemInfo: SystemInfo = await response.data;
        systemInfo.eyes.unshift({
          index: null,
          name: "Select eyes"
        });
        setSystemInfo(response.data);
      } catch (error) {
        console.error("Error fetching system information:", error);
      }
    };

    fetchSystemInfo();
  }, []);

  useEffect(() => {
    let eventSource: EventSource;
    if (openEyes) {
      eventSource = new EventSource("http://127.0.0.1:8081/sensors/eyes/event", {
        withCredentials: true
      });
      eventSource.onmessage = (event) => {
        const base64Image = event.data;
        setImageSrc(`data:image/jpeg;base64,${base64Image}`);
      };
      eventSource.onerror = (event: Event) => {
        console.error("Event source has failed");
        if ((event as unknown as EventSource).readyState === EventSource.CLOSED) {
          (eventSource as EventSource).close();
        }
      };
    }
    return () => {
      if (eventSource) {
        console.log(`Closing stream...`);
        eventSource.close();
        console.log(`Closed stream, trying to close eyes if needed...`);

        turnEyes(false).then(() => {
          console.log("End => Eyes closed");
        });
      }
    };
  }, [openEyes]);

  const turnEyes = async (eyesStatus: boolean) => {
    try {
      const body = {
        action: eyesStatus ? "on" : "off",
        index: selectedEyesIndex
      };

      await axios.post("http://127.0.0.1:8081/sensors/eyes", body, {
        headers: {
          Authorization: auth
        },
      });
      if (eyesStatus) {
        setOpenEyes(true);
        setEyesStatus(false);
      } else {
        setOpenEyes(false);
        setEyesStatus(true);
      }
    } catch (error) {
      console.error("Error occurred at change eyes:", error);
    }
  };

  const selectEyes = (index: string) => {
    const currIndex = Number(index);
    if (selectedEyesIndex !== null && currIndex !== selectedEyesIndex) {
      if (openEyes) {
        setEyesStatus(false);
      }
    } else {
      if (!openEyes) {
        setEyesStatus(true);
      }
    }
    setSelectedEyesIndex(currIndex);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Monitor System</h1>
        {systemInfo ? (
          <div>
            <h2>System Information</h2>
            <p>OS Type: {systemInfo.os_type}</p>
            <p>OS Release: {systemInfo.os_release}</p>
            <h2>Available Cameras</h2>
            <select onChange={(event) => {
              selectEyes(event.target.value);
            }}>
              {systemInfo.eyes.map((eye) => (
                <option key={eye.index} value={eye.index || -1}>
                  {eye.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p>Loading system information...</p>
        )}
        <button onClick={() => turnEyes(eyesStatus)} disabled={selectedEyesIndex === null || selectedEyesIndex < 0}>
          {eyesStatus && !openEyes && (selectedEyesIndex !== null && selectedEyesIndex >= 0) ?
            "Turn Eyes On" :
            "Turn Eyes Off"
          }
        </button>
        {openEyes && imageSrc ? <img src={imageSrc} alt="Camera Stream" /> : <p>Loading...</p>}
      </header>
    </div>
  );
};

export default App;
