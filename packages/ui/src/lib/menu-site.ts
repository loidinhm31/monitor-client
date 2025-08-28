import { ComponentType, lazy } from "react";

export interface RouteConfig {
  id: string;
  path: string;
  component: ComponentType;
  title?: string;
}

// Dynamic imports
const SystemRemoteControl = lazy(() => import("@repo/ui/views/system-remote-control"));
const AnalyticsPage = lazy(() => import("@repo/ui/views/analytics"));

export const getRoutes = (): RouteConfig[] => [
  {
    id: "system-remote",
    path: "/system-remote",
    component: SystemRemoteControl,
    title: "System Remote Control",
  },
  {
    id: "analytics",
    path: "/analytics",
    component: AnalyticsPage,
    title: "Analytics Dashboard",
  },
];
