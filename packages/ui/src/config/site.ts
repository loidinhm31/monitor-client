import { Home, LogOut } from "lucide-react";

export const siteConfig = {
  name: "Monitor Client",
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
