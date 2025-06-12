import { Route, Routes } from "react-router-dom";

import HomePage from "@/pages/home";
import Mirorr from "@/pages/mirror.tsx";

function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<Mirorr />} path="/mirror" />
    </Routes>
  );
}

export default App;
