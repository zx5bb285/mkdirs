"use client";

import { Link } from "@/i18n/navigation";
import { urlForIcon } from "@/lib/image";
import { cn } from "@/lib/utils";
import type { CollectionInfo } from "@/types";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";

type CollectionCardProps = {
  collection: CollectionInfo;
};

/**
 * CollectionCard
 */
export default function CollectionCard({ collection }: CollectionCardProps) {
  const iconProps = collection?.icon ? urlForIcon(collection.icon) : null;
  const iconBlurDataURL = collection?.icon?.blurDataURL || null;
  // console.log(`CollectionCard, iconBlurDataURL:${iconBlurDataURL}`);
  const collectionUrlPrefix = "/collection";

  return (
    <div
      className={cn(
        "border rounded-lg flex flex-col justify-between p-6",
        "hover:bg-accent/60 transition-colors duration-300",
      )}
    >
      {/* top */}
      <div className="flex flex-col gap-4">
        {/* icon + name */}
        <div className="flex w-full items-center gap-4">
          {iconProps && (
            <Image
              src={iconProps?.src}
              alt={collection.icon.alt || `icon of ${collection.name}`}
              title={collection.icon.alt || `icon of ${collection.name}`}
              width={32}
              height={32}
              className="object-cover image-scale rounded-md"
              {...(iconBlurDataURL && {
                placeholder: "blur",
                blurDataURL: iconBlurDataURL,
              })}
            />
          )}

          <Link href={`${collectionUrlPrefix}/${collection.slug.current}`}>
            <h3
              className={cn(
                "flex-1 text-xl font-medium line-clamp-1 flex items-center gap-2",
              )}
            >
              {collection.name}
            </h3>
          </Link>
        </div>

        {/* min-h-[4.5rem] is used for making sure height of the card is the same */}
        <Link
          href={`${collectionUrlPrefix}/${collection.slug.current}`}
          className="block cursor-pointer"
        >
          <p className="text-sm line-clamp-3 leading-relaxed min-h-[4.5rem]">
            {collection.description}
          </p>
        </Link>
      </div>

      {/* bottom */}
      {/* <div className="mt-4 flex justify-end items-center"></div> */}
    </div>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="border rounded-lg flex flex-col justify-between p-6">
      {/* top */}
      <div className="flex flex-col gap-4">
        {/* icon + name */}
        <div className="flex w-full items-center gap-4">
          <Skeleton className="h-8 w-48" />
        </div>

        {/* description */}
        <Skeleton className="h-[4.5rem] w-full" />
      </div>
    </div>
  );
}
