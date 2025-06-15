import { Home, LogOut } from "lucide-react";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Monitor Client",
  description: "Direct peer-to-peer screen sharing and device monitoring.",

  navMenuItems: [
    {
      id: "home",
      label: "Home",
      href: "/",
      icon: Home,
    },
    {
      id: "logout",
      label: "Logout",
      href: "/logout",
      icon: LogOut,
    },
  ],
};
