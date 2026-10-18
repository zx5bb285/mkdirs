import BlogGrid from "@/components/blog/blog-grid";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import EmptyGrid from "@/components/shared/empty-grid";
import { HeaderSection } from "@/components/shared/header-section";
import { UserAvatar } from "@/components/shared/user-avatar";
import { siteConfig } from "@/config/site";
import { type Locale, localePath } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import type {
  AuthorBySlugQueryResult,
  BlogPostsByAuthorQueryResult,
} from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  authorBySlugQuery,
  blogPostsByAuthorQuery,
} from "@/sanity/lib/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata | undefined> {
  const author = await sanityFetch<AuthorBySlugQueryResult>({
    query: authorBySlugQuery,
    params: { slug: params.slug },
  });
  if (!author) return;

  return constructMetadata({
    title: author.name || params.slug,
    description:
      author.bio ||
      `${author.name || params.slug} writes reviews and guides for ${siteConfig.name}.`,
    canonicalUrl: `${siteConfig.url}/blog/author/${params.slug}`,
    image: author.image || undefined,
    locale: params.locale,
    type: "profile",
  });
}

export default async function AuthorPage({
  params,
}: {
  params: { locale: Locale; slug: string };
}) {
  const author = await sanityFetch<AuthorBySlugQueryResult>({
    query: authorBySlugQuery,
    params: { slug: params.slug },
  });
  if (!author) return notFound();

  const posts =
    (await sanityFetch<BlogPostsByAuthorQueryResult>({
      query: blogPostsByAuthorQuery,
      params: { authorId: author._id, locale: params.locale },
    })) ?? [];

  const authorUrl = `${siteConfig.url}${localePath(params.locale, `/blog/author/${params.slug}`)}`;
  const sameAs = [author.twitter, author.linkedin, author.website].filter(
    Boolean,
  );

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: authorUrl,
    ...(author.image && { image: author.image }),
    ...(author.jobTitle && { jobTitle: author.jobTitle }),
    ...(author.bio && { description: author.bio }),
    ...(author.expertise?.length && { knowsAbout: author.expertise }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  const breadcrumb = breadcrumbJsonLd([
    {
      name: "Home",
      url: `${siteConfig.url}${localePath(params.locale, "/")}`,
    },
    {
      name: "Blog",
      url: `${siteConfig.url}${localePath(params.locale, "/blog")}`,
    },
    { name: author.name || params.slug, url: authorUrl },
  ]);

  return (
    <div className="mb-16">
      <JsonLd data={[personJsonLd, breadcrumb]} />

      <div className="my-8 flex flex-col items-center gap-4 text-center">
        <UserAvatar
          name={author.name || null}
          image={author.image || null}
          className="h-20 w-20 border"
        />
        <HeaderSection
          labelAs="h1"
          label={author.name || params.slug}
          titleAs="h2"
          title={author.jobTitle || ""}
        />
        {author.bio && (
          <p className="max-w-2xl text-muted-foreground">{author.bio}</p>
        )}
        {author.expertise && author.expertise.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Expertise: {author.expertise.join(" · ")}
          </p>
        )}
        {sameAs.length > 0 && (
          <ul className="flex gap-4 text-sm">
            {author.twitter && (
              <li>
                <a
                  href={author.twitter}
                  rel="me noopener"
                  className="link-underline"
                >
                  X / Twitter
                </a>
              </li>
            )}
            {author.linkedin && (
              <li>
                <a
                  href={author.linkedin}
                  rel="me noopener"
                  className="link-underline"
                >
                  LinkedIn
                </a>
              </li>
            )}
            {author.website && (
              <li>
                <a
                  href={author.website}
                  rel="me noopener"
                  className="link-underline"
                >
                  Website
                </a>
              </li>
            )}
          </ul>
        )}
      </div>

      {posts.length === 0 ? <EmptyGrid /> : <BlogGrid posts={posts} />}
    </div>
  );
}
