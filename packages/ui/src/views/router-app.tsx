import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import { DefaultLayout } from "@repo/ui/views/default-layout";
import { getRoutes } from "@repo/ui/lib/menu-site";

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
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Navigate replace to="/system-remote" />} path="/" />
          {getRoutes().map((route) => {
            const Component = route.component;

            return <Route key={route.path} element={<DefaultLayout children={<Component />} />} path={route.path} />;
          })}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default RouterApp;
