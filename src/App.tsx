import axios from "axios";
import { useEffect, useState } from "react";

const App = () => {
  const [openCamera, setOpenCamera] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const auth = "Basic " + btoa("admin:password"); // Use the same credentials as in the server

  useEffect(() => {
    let eventSource: EventSource;
    if (openCamera) {
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
        console.log(`Closed stream, trying to close camera if needed...`);

        turnCameraOff().then(() => {
          console.log("End => Camera closed");
        });
      }
    };
  }, [openCamera]);

  const turnCameraOn = async () => {
    try {
      await axios.post("http://127.0.0.1:8081/sensors/eyes/on", null, {
        headers: {
          Authorization: auth
        },
      });
      setOpenCamera(true);
    } catch (error) {
      console.error("Error turning camera on:", error);
    }
  };

  const turnCameraOff = async () => {
    try {
      await axios.post("http://127.0.0.1:8081/sensors/eyes/off", null, {
        headers: {
          Authorization: auth
        },
      });
      setOpenCamera(false);
    } catch (error) {
      console.error("Error turning camera off:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Camera Stream</h1>
        <button onClick={turnCameraOn}>Turn Camera On</button>
        <button onClick={turnCameraOff}>Turn Camera Off</button>
        {openCamera && imageSrc ? <img src={imageSrc} alt="Camera Stream" /> : <p>Loading...</p>}
      </header>
    </div>
  );
};

export default App;
