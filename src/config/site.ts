export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Vite + HeroUI",
  description: "Make beautiful websites regardless of your design experience.",

  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Analytics",
      href: "/analytics",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    docs: "https://heroui.com",
  },
};
