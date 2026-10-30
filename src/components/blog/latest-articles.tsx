import BlogGrid from "@/components/blog/blog-grid";
import type { BlogLatestPostsQueryResult } from "@/sanity.types";
import { NewspaperIcon } from "lucide-react";

/**
 * "Latest Articles" module shared by item and blog detail pages. Renders
 * nothing when there is nothing to show, so pages without published posts
 * stay unchanged.
 */
export default function LatestArticles({
  posts,
}: {
  posts: BlogLatestPostsQueryResult;
}) {
  if (!posts?.length) return null;

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <NewspaperIcon className="w-4 h-4 text-indigo-500" />
        <h2 className="text-lg tracking-wider font-semibold text-gradient_indigo-purple">
          Latest Articles
        </h2>
      </div>

      <BlogGrid posts={posts} />
    </section>
  );
}
