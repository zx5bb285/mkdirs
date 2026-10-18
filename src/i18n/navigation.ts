import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware aliases for next/link, next/navigation
// https://next-intl.dev/docs/routing/navigation
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
