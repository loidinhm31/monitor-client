import { Route, Routes } from "react-router-dom";

import HomePage from "@/pages/home";

function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      {/*<Route element={<AnalyticsPage />} path="/analytics" />*/}
    </Routes>
  );
}

export default App;
