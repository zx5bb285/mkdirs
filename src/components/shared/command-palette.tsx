"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  BookOpenIcon,
  BoxesIcon,
  CornerDownLeftIcon,
  FolderTreeIcon,
  HomeIcon,
  PlusCircleIcon,
  SearchIcon,
  TagIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export interface CommandPaletteCategory {
  id: string;
  name: string;
  slug: string;
}

interface CommandPaletteProps {
  categories?: CommandPaletteCategory[];
}

/**
 * Global ⌘K / Ctrl+K command palette.
 * Jumps to pages & categories; free-text submits to /search?q=
 */
export function CommandPalette({ categories = [] }: CommandPaletteProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", down);
    // allow buttons elsewhere (e.g. the hero search box) to open the palette
    const openHandler = () => setOpen(true);
    window.addEventListener("open-command-palette", openHandler);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", openHandler);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the palette on navigation only
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const submitSearch = (value: string) => {
    const query = value.trim();
    if (!query) return;
    go(`/search?q=${encodeURIComponent(query)}`);
  };

  const pages = [
    { href: "/", label: t("Nav.home"), icon: HomeIcon },
    { href: "/search", label: t("Nav.search"), icon: SearchIcon },
    { href: "/category", label: t("Nav.category"), icon: FolderTreeIcon },
    { href: "/tag", label: t("Nav.tag"), icon: TagIcon },
    { href: "/collection", label: t("Nav.collection"), icon: BoxesIcon },
    { href: "/blog", label: t("Nav.blog"), icon: BookOpenIcon },
    { href: "/pricing", label: t("Nav.pricing"), icon: CornerDownLeftIcon },
    { href: "/submit", label: t("Nav.submit"), icon: PlusCircleIcon },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={t("Search.placeholder")}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            submitSearch(event.currentTarget.value);
          }
        }}
      />
      <CommandList>
        <CommandEmpty>{t("Search.noResults")}</CommandEmpty>

        <CommandGroup heading={t("Nav.search")}>
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              value={`page ${page.label}`}
              onSelect={() => go(page.href)}
            >
              <page.icon className="mr-2 size-4" />
              {page.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {categories.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("Nav.category")}>
              {categories.slice(0, 30).map((category) => (
                <CommandItem
                  key={category.id}
                  value={`category ${category.name}`}
                  onSelect={() => go(`/category/${category.slug}`)}
                >
                  <FolderTreeIcon className="mr-2 size-4" />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Small kbd-style button that opens the command palette
 * (the palette itself is mounted once in the layout)
 */
export function CommandKbd({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Open command palette"
      onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
      className={`inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${className || ""}`}
    >
      <SearchIcon className="size-3" />
      <span>⌘K</span>
    </button>
  );
}
