import AllPostsButton from "@/components/blog/all-posts-button";
import BlogCustomMdx from "@/components/blog/blog-custom-mdx";
import BlogGrid from "@/components/blog/blog-grid";
import { BlogToc } from "@/components/blog/blog-toc";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { UserAvatar } from "@/components/shared/user-avatar";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { type Locale, localePath } from "@/i18n/routing";
import { urlForImage } from "@/lib/image";
import { portableTextToMarkdown } from "@/lib/mdx";
import { constructMetadata } from "@/lib/metadata";
import { getTableOfContents } from "@/lib/toc";
import { getLocaleDate } from "@/lib/utils";
import type {
  BlogPostMetadataQueryResult,
  BlogPostQueryResult,
  BlogRelatedPostsQueryResult,
} from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blogPostMetadataQuery,
  blogPostQuery,
  blogRelatedPostsQuery,
} from "@/sanity/lib/queries";
import { FileTextIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

const RELATED_COUNT = 3;

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata | undefined> {
  const post = await sanityFetch<BlogPostMetadataQueryResult>({
    query: blogPostMetadataQuery,
    params: { slug: params.slug, locale: params.locale },
  });
  if (!post) {
    console.warn(`generateMetadata, post not found for slug: ${params.slug}`);
    return;
  }

  const imageProps = post?.image ? urlForImage(post?.image) : null;

  return constructMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || post.title,
    canonicalUrl: post.canonicalUrl || `${siteConfig.url}/blog/${params.slug}`,
    image: imageProps?.src,
    noIndex: !!post.noIndex,
    locale: params.locale,
    type: "article",
    publishedTime: post.publishDate || post._createdAt,
    modifiedTime: post.lastReviewedAt || post._updatedAt,
    authors: [post.author?.name].filter(Boolean) as string[],
    tags: post.categories?.map((category) => category.name).filter(Boolean),
    section: post.categories?.[0]?.name || undefined,
  });
}

interface PostPageProps {
  params: { locale: Locale; slug: string };
}

export default async function PostPage({ params }: PostPageProps) {
  const { locale, slug } = params;
  const post = await sanityFetch<BlogPostQueryResult>({
    query: blogPostQuery,
    params: { slug, locale },
  });
  if (!post) {
    console.error("PostPage, post not found");
    return notFound();
  }

  const imageProps = post?.image ? urlForImage(post?.image) : null;
  const imageBlurDataURL = post?.image?.blurDataURL || null;
  const publishDate = post.publishDate || post._createdAt;
  const date = getLocaleDate(publishDate);
  const modifiedDate = post.lastReviewedAt || post._updatedAt;
  const showModified = new Date(modifiedDate) > new Date(publishDate);

  // Dual-language articles: one document, two bodies. Fall back to the
  // primary body when a translation is missing.
  const body =
    locale === "zh-CN" && post.bodyZh && post.bodyZh.length > 0
      ? post.bodyZh
      : post.body;

  const markdownContent = portableTextToMarkdown(body, locale);
  const toc = await getTableOfContents(markdownContent);

  // Prefer editor-picked related posts; otherwise find posts that share a
  // category so every article has internal links.
  const categoryIds =
    post.categories?.map((category) => category._id).filter(Boolean) ?? [];
  let related = post.relatedPosts ?? [];
  if (related.length === 0 && categoryIds.length > 0) {
    related =
      (await sanityFetch<BlogRelatedPostsQueryResult>({
        query: blogRelatedPostsQuery,
        params: { slug, categoryIds, count: RELATED_COUNT, locale },
      })) ?? [];
  }

  const postUrl = `${siteConfig.url}${localePath(locale, `/blog/${slug}`)}`;
  const authorSlug = post.author?.slug?.current;
  const authorUrl = authorSlug
    ? `${siteConfig.url}${localePath(locale, `/blog/author/${authorSlug}`)}`
    : undefined;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: imageProps?.src ? [imageProps.src] : undefined,
    datePublished: publishDate,
    dateModified: modifiedDate,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    inLanguage: locale,
    ...(post.categories?.length && {
      articleSection: post.categories[0]?.name,
      keywords: post.categories.map((category) => category.name).join(", "),
    }),
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
          ...(authorUrl && { url: authorUrl }),
          ...(post.author.jobTitle && { jobTitle: post.author.jobTitle }),
          ...(post.author.bio && { description: post.author.bio }),
          ...(post.author.image && { image: post.author.image }),
          sameAs: [
            post.author.twitter,
            post.author.linkedin,
            post.author.website,
          ].filter(Boolean),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${siteConfig.logo}`,
      },
    },
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: `${siteConfig.url}${localePath(locale, "/")}` },
    { name: "Blog", url: `${siteConfig.url}${localePath(locale, "/blog")}` },
    { name: post.title, url: postUrl },
  ]);

  return (
    <div className="flex flex-col gap-8">
      <JsonLd data={[articleJsonLd, breadcrumb]} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span aria-hidden className="mx-1">
              /
            </span>
          </li>
          <li>
            <Link href="/blog" className="hover:underline">
              Blog
            </Link>
            <span aria-hidden className="mx-1">
              /
            </span>
          </li>
          <li aria-current="page" className="line-clamp-1">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* Content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Basic information */}
          <div className="space-y-8">
            {/* blog post image */}
            <div className="group overflow-hidden relative aspect-[16/9] rounded-lg transition-all border">
              {imageProps && (
                <Image
                  src={imageProps.src}
                  alt={post.image?.alt || post.title}
                  title={post.image?.alt || post.title}
                  priority
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                  {...(imageBlurDataURL && {
                    placeholder: "blur",
                    blurDataURL: imageBlurDataURL,
                  })}
                />
              )}
            </div>

            {/* blog post title */}
            <h1 className="text-3xl font-bold">{post.title}</h1>

            {/* dates */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <time dateTime={publishDate}>{date}</time>
              {showModified && (
                <span>
                  · Updated{" "}
                  <time dateTime={modifiedDate}>
                    {getLocaleDate(modifiedDate)}
                  </time>
                </span>
              )}
            </div>

            {/* blog post description */}
            {post.excerpt && (
              <p className="text-lg text-muted-foreground">{post.excerpt}</p>
            )}
          </div>

          {/* blog post content */}
          <div className="mt-4">
            {markdownContent && <BlogCustomMdx source={markdownContent} />}
          </div>

          {/* author bio */}
          {post.author && (post.author.bio || post.author.jobTitle) && (
            <div className="mt-12 rounded-lg border p-6">
              <div className="flex items-start gap-4">
                <div className="relative h-12 w-12 flex-shrink-0">
                  <UserAvatar
                    name={post.author.name || null}
                    image={post.author.image || null}
                    className="border"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">
                    {authorUrl ? (
                      <Link href={authorUrl} className="link-underline">
                        {post.author.name}
                      </Link>
                    ) : (
                      post.author.name
                    )}
                    {post.author.jobTitle && (
                      <span className="ml-2 font-normal text-sm text-muted-foreground">
                        {post.author.jobTitle}
                      </span>
                    )}
                  </p>
                  {post.author.bio && (
                    <p className="text-sm text-muted-foreground">
                      {post.author.bio}
                    </p>
                  )}
                  {post.author.expertise &&
                    post.author.expertise.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Expertise: {post.author.expertise.join(" · ")}
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-start mt-16">
            <AllPostsButton />
          </div>
        </div>

        {/* Right column (sidebar) */}
        <div>
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* author info */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Publisher</h2>
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 flex-shrink-0">
                  <UserAvatar
                    name={post.author?.name || null}
                    image={post.author?.image || null}
                    className="border"
                  />
                </div>
                <div>
                  {authorUrl ? (
                    <Link
                      href={authorUrl}
                      className="font-medium link-underline"
                    >
                      {post.author.name}
                    </Link>
                  ) : post.author?.link ? (
                    <Link
                      href={post.author.link}
                      target="_blank"
                      prefetch={false}
                      className="font-medium link-underline"
                    >
                      {post.author.name}
                    </Link>
                  ) : (
                    <span>{post.author?.name}</span>
                  )}

                  <p className="text-sm text-muted-foreground">{date}</p>
                </div>
              </div>
            </div>

            {/* categories */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Categories</h2>
              <ul className="flex flex-wrap gap-4">
                {post.categories?.map((category) => (
                  <li key={category._id}>
                    <Link
                      href={`/blog/category/${category.slug.current}`}
                      className="text-sm link-underline"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* table of contents */}
            <div className="bg-muted/50 rounded-lg p-6 hidden lg:block">
              <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
              <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
                <BlogToc toc={toc} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer section shows related posts */}
      {related.length > 0 && (
        <div className="flex flex-col gap-8 mt-8">
          <div className="flex items-center gap-2">
            <FileTextIcon className="w-4 h-4 text-indigo-500" />
            <h2 className="text-lg tracking-wider font-semibold text-gradient_indigo-purple">
              More Posts
            </h2>
          </div>

          <BlogGrid posts={related} />
        </div>
      )}
    </div>
  );
}
