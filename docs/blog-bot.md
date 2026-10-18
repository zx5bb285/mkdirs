# Blog Bot API

A protected endpoint that lets an external agent (Grok, n8n, Zapier, a cron
job, or your own script) publish bilingual blog posts.

```
POST /api/blog/generate
Authorization: Bearer $BLOG_BOT_SECRET
Content-Type: application/json
```

The endpoint is **disabled** until `BLOG_BOT_SECRET` is set to at least 16
characters. Requests are compared in constant time.

---

## 1. One-time setup

1. Choose the author. Either pick an existing user in `.env`:
   ```bash
   BLOG_BOT_AUTHOR_EMAIL=editor@example.com
   # or
   BLOG_BOT_AUTHOR_ID=user.<uuid>
   ```
   If neither matches, the oldest `ADMIN` user is used. On a fresh dataset
   with no users at all, the bot creates an author profile on first publish
   (`BLOG_BOT_AUTHOR_NAME`, default "Editorial Team"); it has no password
   and cannot log in.
2. For best E-E-A-T, open `/studio` → User and fill in `jobTitle`, `bio`,
   `expertise`, `twitter` / `linkedin`, and the `slug` used by the public
   author page (`/blog/author/<slug>`).
3. Set a secret:
   ```bash
   BLOG_BOT_SECRET="$(openssl rand -hex 32)"
   ```
4. Make sure `SANITY_API_TOKEN` has **Editor** (write) permission. The bot
   uploads images and creates documents with it.
5. For `mode=generate`, set `XAI_API_KEY` (and optionally `XAI_BLOG_MODEL`,
   default `grok-3`).
6. Restart the app.

Verify:

```bash
curl -s http://localhost:3000/api/blog/generate \
  -H "Authorization: Bearer $BLOG_BOT_SECRET"
```

---

## 2. Ingest a finished article (recommended)

Use this when the bot writes the article and supplies its own images.

```bash
curl -s http://localhost:3000/api/blog/generate \
  -H "Authorization: Bearer $BLOG_BOT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "ingest",
    "keywords": ["best free video editing software", "free video editor"],
    "autoPublish": true,
    "article": {
      "externalId": "grok-2026-10-17-free-video-editors",
      "title": "Best Free Video Editing Software in 2026",
      "titleZh": "2026 年最好的免费视频剪辑软件",
      "slug": "best-free-video-editing-software",
      "excerpt": "We compare the best free video editors for cutting, color, audio and export, including their real limitations.",
      "excerptZh": "我们对比了最好用的免费视频剪辑软件，涵盖剪辑、调色、音频与导出，并说明各自的真实限制。",
      "markdown": "# Best Free Video Editing Software in 2026\n\nIntro...\n\n## How we evaluated\n\n...\n\n![DaVinci Resolve timeline](https://cdn.example.com/resolve.jpg)\n\n## Comparison\n\n| Editor | Best for | Limit |\n| --- | --- | --- |\n| DaVinci Resolve | Color | Learning curve |\n",
      "markdownZh": "# 2026 年最好的免费视频剪辑软件\n\n……\n",
      "coverImageUrl": "https://cdn.example.com/cover.jpg",
      "categories": ["Video Editing", { "name": "AI Tools", "nameZh": "AI 工具" }],
      "seoTitle": "Best Free Video Editing Software (2026)",
      "seoDescription": "Compare the best free video editors for editing, color, audio and export, with honest limitations and use cases."
    }
  }'
```

### What happens

1. Request is validated with Zod.
2. Every image URL in both markdown bodies (plus the cover) is downloaded and
   uploaded to Sanity. Third-party hotlinks are never left in the post.
3. Markdown is converted to Portable Text: headings, paragraphs, lists,
   quotes, code, images, links, bold/italic, and GFM tables.
4. The quality gate runs (see below).
5. If it passes and `autoPublish` is true, `publishDate` is set and the post
   goes live at `/blog/...`. Both languages share that URL; the active
   language comes from the `NEXT_LOCALE` cookie (`localePrefix: "never"`).
   The route revalidates the homepage, blog index, post page, RSS feed and
   sitemap immediately. Otherwise it is saved with `publishDate: null` and
   stays invisible.
6. Sending the same `externalId` again updates the existing document instead
   of creating a duplicate.

### Response

```json
{
  "ok": true,
  "id": "abc123",
  "slug": "best-free-video-editing-software",
  "status": "published",
  "action": "created",
  "quality": { "pass": true, "score": 100, "issues": [], "warnings": [] },
  "imageCount": 3,
  "failedImages": [],
  "path": "/blog/best-free-video-editing-software",
  "publishedUrls": {
    "zh-CN": "https://example.com/blog/best-free-video-editing-software",
    "en": "https://example.com/blog/best-free-video-editing-software"
  },
  "studioUrl": "https://example.com/studio/structure/blogPost;abc123"
}
```

A failed quality gate still returns `200 ok: true` with `status: "draft"` and
the `issues` array. Fix the content and resend the same `externalId`.

---

## 3. Let the route call Grok

```bash
curl -s http://localhost:3000/api/blog/generate \
  -H "Authorization: Bearer $BLOG_BOT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "generate",
    "topic": "best free video editing software for beginners",
    "keywords": ["best free video editing software", "free video editor"],
    "imageUrls": ["https://cdn.example.com/cover.jpg"],
    "autoPublish": true
  }'
```

Grok produces a 1,400–2,000 word English article plus a Chinese translation,
comparison table, FAQ, SEO title/description and categories. The same quality
gate and image mirroring apply.

`imageUrls` are inserted into the body and the first one becomes the cover.
Without images, the post will fail the `missing_images` check and stay a
draft — by design.

---

## 4. Dry run (quality check only)

```bash
curl -s http://localhost:3000/api/blog/generate \
  -H "Authorization: Bearer $BLOG_BOT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "mode": "ingest", "dryRun": true, "article": { "title": "...", "markdown": "..." } }'
```

No documents or assets are written. Use it in the bot's self-correction loop.

---

## 5. Quality gate

| Check | Default | Override |
| --- | --- | --- |
| English word count | ≥ 800 | `BLOG_BOT_MIN_WORDS` |
| Chinese characters | ≥ 600 | `BLOG_BOT_MIN_ZH_CHARS` |
| H2/H3 sections | ≥ 2 | — |
| Title length | 15–90 chars | — |
| Excerpt | required, 50–220 chars warned | — |
| Images | ≥ 1 (cover or inline) | — |
| Target keyword | appears in title or first 2,500 chars | `keywords` |
| Placeholder text | rejected ("lorem ipsum", "as an AI", "[insert"…) | — |
| Slug | lowercase ASCII + hyphens | — |

Every failure blocks publishing. Warnings do not.

Set `BLOG_AUTO_PUBLISH=false` to force everything into the draft queue even
when it passes.

---

## 6. Editing after publication

Published posts are ordinary Sanity documents. Open the `studioUrl` returned
by the API to edit, change the cover, or use the **Last Reviewed** field to
update `dateModified` in structured data. `noIndex` and a syndication
`canonicalUrl` are available in the SEO fieldset.

---

## 7. Security notes

- The route is listed in `publicRoutes` so the auth middleware does not
  redirect it; the Bearer secret is the only gate. Use HTTPS in production.
- Image downloads block localhost/private IPs and enforce a 20 MB limit.
- Request bodies are capped at 3 MB (images are fetched by URL, not embedded).
- Rotate `BLOG_BOT_SECRET` if it leaks. The endpoint returns 503 when the
  secret is unset, and 401 for a wrong secret.
