import { HashRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";

// Dynamic imports
const HomePage = lazy(() => import("@repo/ui/views/home"));
const AnalyticsPage = lazy(() => import("@repo/ui/views/analytics"));

// Loading component
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  );
}

function RouterApp() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<AnalyticsPage />} path="/analytics" />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default RouterApp;
