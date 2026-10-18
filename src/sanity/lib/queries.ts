import groq, { defineQuery } from "groq";

/**
 * https://www.sanity.io/plugins/next-sanity#using-query-result-types
 * https://www.sanity.io/plugins/next-sanity#generate-typescript-types
 */

// ======================================================================================================================

/**
 * Item Queries
 */
const tagFields = /* groq */ `
  ...,
  "name": coalesce(nameZh, name),
  "description": coalesce(descriptionZh, description),
`;

const categoryFields = /* groq */ `
  ...,
  "name": coalesce(nameZh, name),
  "description": coalesce(descriptionZh, description),
`;

export const groupFields = /* groq */ `
  ...,
  "name": coalesce(nameZh, name),
  "description": coalesce(descriptionZh, description),
  "categories": *[_type=='category' && references(^._id)] | order(priority desc, _createdAt asc)
  { 
    ..., 
    "name": coalesce(nameZh, name),
    "description": coalesce(descriptionZh, description),
  }
`;

export const collectionFields = /* groq */ `
  ...,
  "name": coalesce(nameZh, name),
  "description": coalesce(descriptionZh, description),
  icon {
    ...,
    "blurDataURL": asset->metadata.lqip,
    "imageColor": asset->metadata.palette.dominant.background,
  },
`;

// also used in file data/item.ts and data/submission.ts
export const itemSimpleFields = /* groq */ `
  _id,
  _createdAt,
  _updatedAt,
  "name": coalesce(nameZh, name),
  slug,
  "description": coalesce(descriptionZh, description),
  link,
  affiliateLink,
  sponsor,
  sponsorStartDate,
  sponsorEndDate,
  note,
  featured,
  icon {
    ...,
    "blurDataURL": asset->metadata.lqip,
    "imageColor": asset->metadata.palette.dominant.background,
  },
  image {
    ...,
    "blurDataURL": asset->metadata.lqip,
    "imageColor": asset->metadata.palette.dominant.background,
  },
  publishDate,
  paid,
  order,
  pricePlan,
  freePlanStatus,
  proPlanStatus,
  sponsorPlanStatus,
  rejectionReason,
  submitter->,
  collections[]-> {
    ...,
    "name": coalesce(nameZh, name),
    "description": coalesce(descriptionZh, description),
  },
  categories[]-> {
    ...,
    "name": coalesce(nameZh, name),
    "description": coalesce(descriptionZh, description),
  },
  tags[]-> {
    ...,
    "name": coalesce(nameZh, name),
    "description": coalesce(descriptionZh, description),
  },
`;

const itemFields = /* groq */ `
  ${itemSimpleFields}
  "introduction": coalesce(introductionZh, introduction),
`;

// auto generate related items
const itemFieldsWithRelated = /* groq */ `
  introduction,
  "related": *[_type == "item" && defined(slug.current) 
    && defined(publishDate) 
    && forceHidden != true
    && sponsor != true
    && count(categories[@._ref in ^.^.categories[]._ref]) > 0 && _id != ^._id] 
    | order(publishedDate desc, _createdAt desc) [0...3] {
      ${itemSimpleFields}
  },
  ${itemSimpleFields}
`;

export const itemByIdQuery = defineQuery(`*[_type == "item" && _id == $id][0] {
  ${itemSimpleFields}
}`);

export const itemInfoBySlugQuery = defineQuery(`*[_type == "item" && slug.current == $slug][0] {
  ${itemSimpleFields}
}`);

export const itemFullInfoByIdQuery = defineQuery(`*[_type == "item" && _id == $id][0] {
  ${itemFields}
}`);

export const itemFullInfoBySlugQuery = defineQuery(`*[_type == "item" && slug.current == $slug 
&& forceHidden != true] [0] {
  ${itemFieldsWithRelated}
}`);

/**
 * NOTICE: this query is not used in the app,
 * but it is used to generate the type of ItemListQueryResult,
 * if you want to change this query, please update data/item.ts
 */
export const itemListQuery = defineQuery(`*[_type == "item" && defined(slug.current) 
  && defined(publishDate)
  && forceHidden != true
  && sponsor != true]
  | order(coalesce(featured, false) desc, publishDate desc) {
    ${itemSimpleFields}
}`);

// get sponsor items
export const sponsorItemListQuery = defineQuery(`*[_type == "item" && defined(slug.current) 
  && defined(publishDate)
  && forceHidden != true
  && sponsor == true
  && sponsorStartDate <= now()
  && sponsorEndDate >= now()] 
  | order(coalesce(featured, false) desc, publishDate desc) {
    ${itemSimpleFields}
}`);

export const itemListOfFeaturedQuery = defineQuery(`*[_type == "item" && defined(slug.current) 
  && defined(publishDate) 
  && forceHidden != true 
  && sponsor != true
  && featured == true] 
  | order(coalesce(featured, false) desc, publishDate desc) [0...$count] {
    ${itemSimpleFields}
}`);

export const itemListOfLatestQuery = defineQuery(`*[_type == "item" && defined(slug.current) 
  && defined(publishDate) 
  && forceHidden != true
  && sponsor != true] 
  | order(coalesce(featured, false) desc, publishDate desc) [0...$count] {
    ${itemSimpleFields}
}`);

export const collectionListQuery = defineQuery(`*[_type == "collection" && defined(slug.current)] 
  | order(priority desc) {
    ${collectionFields}
}`);

export const collectionQuery = defineQuery(`*[_type == "collection" && slug.current == $slug][0] {
  ${collectionFields}
}`);

export const groupListQuery = groq`*[_type=="group"] | order(priority desc, _createdAt asc) {
  ${groupFields}
}`;

// site-wide stats for the home hero badges
export const siteStatsQuery = defineQuery(`{
  "toolCount": count(*[_type=="item" && defined(publishDate) && forceHidden != true]),
  "categoryCount": count(*[_type=="category" && defined(slug.current)]),
}`);

// top-N items of one category (featured first, then newest)
export const itemTopOfCategoryQuery = defineQuery(`*[_type=="item"
  && defined(slug.current)
  && defined(publishDate)
  && forceHidden != true
  && sponsor != true
  && references(*[_type=="category" && slug.current == $categorySlug]._id)]
  | order(coalesce(featured, false) desc, publishDate desc) [0...$count] {
    ${itemSimpleFields}
}`);

// category groups with nested categories and public item counts
export const groupListWithCountQuery = defineQuery(`*[_type=="group"] | order(priority desc, _createdAt asc) {
  ...,
  "name": coalesce(nameZh, name),
  "categories": *[_type=='category' && references(^._id)] | order(priority desc, _createdAt asc) {
    ...,
    "name": coalesce(nameZh, name),
    "count": count(*[_type=="item" && defined(publishDate) && forceHidden != true && references(^._id)]),
  }
}`);

export const categoryListQuery = defineQuery(`*[_type == "category" && defined(slug.current)] 
  | order(priority desc) {
    ${categoryFields}
}`);

export const categoryQuery = defineQuery(`*[_type == "category" && slug.current == $slug][0] {
  ${categoryFields}
}`);

export const tagListQuery = defineQuery(`*[_type == "tag" && defined(slug.current)] 
  | order(slug.current asc) {
    ${tagFields}
}`);

export const tagQuery = defineQuery(`*[_type == "tag" && slug.current == $slug][0] {
  ${tagFields}
}`);

// ======================================================================================================================

/**
 * Submission Queries
 */

/**
 * NOTICE: this query is not used in the app,
 * but it is used to generate the type of SubmissionListQueryResult,
 * if you want to change this query, please update data/submission.ts
 */
export const submissionListQuery = defineQuery(`*[_type == "item" && defined(slug.current)
  && submitter._ref == $userId] 
  | order(_createdAt desc) {
    ${itemSimpleFields}
}`);

// Page Queries
export const pageQuery = defineQuery(`
  *[_type == "page" && slug.current == $slug][0] {
    ...,
    body[]{
      ...,
      markDefs[]{
        ...,
        _type == "internalLink" => {
          "slug": @.reference->slug
        }
      }
    },
  }
`);

// ======================================================================================================================

/**
 * Blog Queries
 */

// also used in file data/blog.ts
// `$locale` is optional: when omitted the Chinese fields are NOT preferred,
// which keeps sitemap/author queries deterministic.
export const blogPostSimpleFields = /* groq */ `
  _id,
  _createdAt,
  _updatedAt,
  slug,
  "title": select($locale == "zh-CN" => coalesce(titleZh, title), title),
  "excerpt": select($locale == "zh-CN" => coalesce(excerptZh, excerpt), excerpt),
  featured,
  image {
    ...,
    "blurDataURL": asset->metadata.lqip,
    "imageColor": asset->metadata.palette.dominant.background,
  },
  publishDate,
  lastReviewedAt,
  seoTitle,
  seoDescription,
  canonicalUrl,
  noIndex,
  externalId,
  author->,
  categories[]-> {
    ...,
    "name": select($locale == "zh-CN" => coalesce(nameZh, name), name),
    "description": select($locale == "zh-CN" => coalesce(descriptionZh, description), description),
  },
`;

// Portable Text body projection with internal-link references dereferenced.
const blockContentFields = /* groq */ `
  ...,
  markDefs[]{
    ...,
    _type == "internalLink" => {
      "type": @.reference->_type,
      "slug": @.reference->slug
    }
  }
`;

const blogPostFields = /* groq */ `
  relatedPosts[]-> {
    ${blogPostSimpleFields}
  },
  body[]{
    ${blockContentFields}
  },
  bodyZh[]{
    ${blockContentFields}
  },
  ${blogPostSimpleFields}
`;

const blogCategoryFields = /* groq */ `
  "name": select($locale == "zh-CN" => coalesce(nameZh, name), name),
  slug,
  "description": select($locale == "zh-CN" => coalesce(descriptionZh, description), description),
  priority,
`;

export const blogCategoryListQuery = defineQuery(`
  *[_type == "blogCategory" && defined(slug.current)] 
  | order(priority desc) {
    ${blogCategoryFields}
}`);

export const blogCategoryMetadateQuery = defineQuery(`
  *[_type == "blogCategory" && slug.current == $slug][0] {
    ${blogCategoryFields}
  }
`);

export const blogPostQuery = defineQuery(`
  *[_type == "blogPost" && slug.current == $slug && defined(publishDate) && publishDate <= now()][0] {
    ${blogPostFields}
}`);

export const blogPostMetadataQuery = defineQuery(`
  *[_type == "blogPost" && slug.current == $slug && defined(publishDate) && publishDate <= now()][0] {
    ${blogPostSimpleFields}
}`);

/**
 * Automatically related posts: same category, newest first. Used when the
 * editor did not hand-pick `relatedPosts`.
 */
export const blogRelatedPostsQuery = defineQuery(`
  *[
    _type == "blogPost"
    && slug.current != $slug
    && defined(slug.current)
    && defined(publishDate)
    && publishDate <= now()
    && count(categories[@._ref in $categoryIds]) > 0
  ] | order(publishDate desc) [0...$count] {
    ${blogPostSimpleFields}
  }
`);

export const authorBySlugQuery = defineQuery(`
  *[_type == "user" && (slug.current == $slug || _id == $slug)][0] {
    _id,
    name,
    image,
    link,
    slug,
    jobTitle,
    bio,
    expertise,
    twitter,
    linkedin,
    website
  }
`);

export const blogPostsByAuthorQuery = defineQuery(`
  *[
    _type == "blogPost"
    && defined(slug.current)
    && defined(publishDate)
    && publishDate <= now()
    && author._ref == $authorId
  ] | order(publishDate desc) {
    ${blogPostSimpleFields}
  }
`);

/**
 * NOTICE: this query is not directly used in the app,
 * but it is used to generate the type of BlogPostListQueryResult,
 * if you want to change this query, please update data/blog.ts
 */
export const blogPostListQuery = defineQuery(`
  *[_type == "blogPost" && defined(slug.current) && defined(publishDate) && publishDate <= now()]
  | order(publishDate desc) {
    ${blogPostSimpleFields}
}`);

export const blogPostListOfLatestQuery = defineQuery(`
  *[_type == "blogPost" && defined(slug.current) && defined(publishDate) && publishDate <= now()]
  | order(publishDate desc) [0...$count] {
    ${blogPostSimpleFields}
}`);

// search blog posts by keywords, not used in the app
export const searchBlogQuery = groq`
  *[_type == "blogPost" && defined(slug.current) && defined(publishDate) && _score > 0]
  | score(title match $query || excerpt match $query || pt::text(body) match $query)
  | order(_score desc) {
  _score,
  ${blogPostSimpleFields}
}`;

// get top 5 categories, not used in the app
export const blogCategoryWithCountQuery = groq`
  *[_type == "blogCategory"] {
  ${blogCategoryFields}
  "count": count(*[_type == "blogPost" && references(^._id)])
} | order(count desc) [0...5]`;

// ======================================================================================================================

/**
 * User Queries
 */

export const userWithAccountsQuery = defineQuery(`
  *[_type == "user" && _id == $id][0] {
    ...,
    accounts[]->,
  }
`);

// ======================================================================================================================

/**
 * Sitemap Queries
 */

export const itemListQueryForSitemap = groq`*[_type == "item" && defined(slug.current) && defined(publishDate) && forceHidden != true && sponsor != true] | order(_createdAt asc) {
  _id,
  _updatedAt,
  "slug": slug.current,
}`;

export const categoryListQueryForSitemap = groq`*[_type == "category" && defined(slug.current)] | order(_createdAt asc) {
  _id,  
  _updatedAt,
  "slug": slug.current,
  "count": count(*[_type == "item" && defined(publishDate) && forceHidden != true && references(^._id)])
}`;

export const tagListQueryForSitemap = groq`*[_type == "tag" && defined(slug.current)] | order(_createdAt asc) {
  _id,  
  _updatedAt,
  "slug": slug.current,
  "count": count(*[_type == "item" && defined(publishDate) && forceHidden != true && references(^._id)])
}`;

export const collectionListQueryForSitemap = groq`*[_type == "collection" && defined(slug.current)] | order(_createdAt asc) {
  _id,  
  _updatedAt,
  "slug": slug.current,
  "count": count(*[_type == "item" && defined(publishDate) && forceHidden != true && references(^._id)])
}`;

export const blogListQueryForSitemap = groq`*[_type == "blogPost" && defined(slug.current) && defined(publishDate) && publishDate <= now() && noIndex != true] | order(publishDate desc, _createdAt asc) {
  _id,  
  _updatedAt,
  "slug": slug.current,
}`;

export const blogCategoryListQueryForSitemap = groq`*[_type == "blogCategory" && defined(slug.current)] | order(_createdAt asc) {
  _id,  
  _updatedAt,
  "slug": slug.current,
  "count": count(*[_type == "blogPost" && defined(publishDate) && publishDate <= now() && noIndex != true && references(^._id)])
}`;

export const pageListQueryForSitemap = groq`*[_type == "page" && defined(slug.current)] | order(_createdAt asc) {
  _id,  
  _updatedAt,
  "slug": slug.current,
}`;

// ======================================================================================================================
