import type { UserButtonConfig } from "@/types";

// title values are message keys ("Nav.dashboard" etc.), resolved with next-intl
export const userButtonConfig: UserButtonConfig = {
  menus: [
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
