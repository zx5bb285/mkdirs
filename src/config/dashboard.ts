import type { DashboardConfig } from "@/types";

// title values are message keys ("Nav.home" etc.), resolved with next-intl
export const dashboardConfig: DashboardConfig = {
  menus: [
    {
      title: "Nav.home",
      href: "/",
      icon: "home",
    },
    {
      title: "Nav.dashboard",
      href: "/dashboard",
      icon: "dashboard",
    },
    {
      title: "Nav.settings",
      href: "/settings",
      icon: "settings",
    },
    {
      title: "Nav.submit",
      href: "/submit",
      icon: "submit",
    },
  ],
};
