import { useState } from "react";
import useWebSocket from "react-use-websocket";
import axios from "axios";

const App = () => {
  const [openCamera, setOpenCamera] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const auth = "Basic " + btoa("admin:password"); // Use the same credentials as in the server

  useWebSocket("ws://127.0.0.1:8080/ws/", {
    onOpen: () => console.log("WebSocket connection established."),
    onMessage: (message) => {
      if (message.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          setImageSrc(reader.result as string);
        };
        reader.readAsDataURL(message.data);
      }
    },
    onClose: () => console.log("WebSocket connection closed.")
  });

  const turnCameraOn = async () => {
    try {
      await axios.post("http://127.0.0.1:8080/camera/on", {}, {
        headers: {
          Authorization: auth
        }
      });
      setOpenCamera(true);
    } catch (error) {
      console.error("Error turning camera on:", error);
    }
  };

  const turnCameraOff = async () => {
    try {
      await axios.post("http://127.0.0.1:8080/camera/off", {}, {
        headers: {
          Authorization: auth
        }
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
