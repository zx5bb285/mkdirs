"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type CustomPaginationProps = {
  totalPages: number;
  routePrefix: string;
};

/**
 * Crawlable pagination.
 *
 * The previous implementation rendered <span> elements with an onClick
 * handler, so search engines could not discover page 2+ at all. Every page
 * is now a real <a href>. URLs are locale-less (localePrefix: "never").
 */
export default function CustomPagination({
  totalPages,
  routePrefix,
}: CustomPaginationProps) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    const query = params.toString();
    const base = routePrefix === "/" ? "/" : routePrefix.replace(/\/$/, "");
    return `${base}${query ? `?${query}` : ""}`;
  };

  const allPages = generatePagination(currentPage, totalPages);
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="pagination" className="mx-auto flex w-full justify-center">
      <ul className="flex flex-row items-center gap-1">
        <li>
          <PaginationControl
            href={currentPage > 1 ? hrefFor(currentPage - 1) : undefined}
            label="Go to previous page"
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </PaginationControl>
        </li>

        {allPages.map((page, index) =>
          page === "..." ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis has no id
            <li key={`ellipsis-${index}`}>
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More pages</span>
              </span>
            </li>
          ) : (
            <li key={page}>
              {page === currentPage ? (
                <span
                  aria-current="page"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                  )}
                >
                  {page}
                </span>
              ) : (
                <Link
                  href={hrefFor(page)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                  )}
                >
                  {page}
                </Link>
              )}
            </li>
          ),
        )}

        <li>
          <PaginationControl
            href={
              currentPage < totalPages ? hrefFor(currentPage + 1) : undefined
            }
            label="Go to next page"
            disabled={currentPage >= totalPages}
          >
            <span className="sr-only">Next</span>
            <ChevronRight className="h-4 w-4" />
          </PaginationControl>
        </li>
      </ul>
    </nav>
  );
}

function PaginationControl({
  href,
  label,
  disabled,
  children,
}: {
  href?: string;
  label: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    buttonVariants({ variant: "ghost", size: "default" }),
    "gap-1",
    disabled && "pointer-events-none text-gray-300 dark:text-gray-600",
  );

  if (!href) {
    return (
      <span aria-label={label} aria-disabled="true" className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link aria-label={label} href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * Generate an array of page numbers to display in the pagination component
 */
const generatePagination = (
  currentPage: number,
  totalPages: number,
): (number | "...")[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages - 1, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};
