# DirHunt AI 建站与上线 SOP

> 基于当前 Mkdirs 模板（Next.js 14 + Sanity + next-intl + NextAuth + Resend + Vercel AI SDK）整理。
>
> 域名：`dirhuntai.com`（Spaceship 注册）。第一期不接 Stripe 与 Google 登录。

---

## 进度看板（先看这里）

> **最后更新：2026-10-18**
>
> 每次推进后：① 更新本表「状态」与「完成日期」；② 在文末 [变更记录](#14-变更记录) 追加一行。
>
> 状态图例：✅ 已完成 · 🟡 进行中 · ⬜ 未开始 · ⛔ 阻塞

| 步骤 | 状态 | 完成 / 核查日期 | 依据与当前卡点 |
|---|---|---|---|
| 0. 上线前 3 个决策 | ✅ | 2026-10-18 核查 | 品牌、域名、语言策略均已落地；`localePrefix: "never"` 见 `src/i18n/routing.ts` |
| 1. 账号与基础设施 | 🟡 | 2026-10-18 | Sanity ✅；Vercel 项目已建并部署 ✅；GitHub 已合并到 `main` ✅；Resend 仍为占位符 ⛔；AI Key 未配 |
| 2. 本地环境跑通 | ✅ | 2026-10-18 核查 | `pnpm build` 通过，共 41 条路由；构建日志无错误 |
| 3. 品牌与全站配置 | ✅ | 2026-10-18 | 3.1 生产 URL ✅；3.2 视觉资产 ✅；3.3 文案 ✅；3.4 菜单 ✅；3.5 About / Privacy / Terms 已在 Sanity 建好并验证 200 |
| 4. 内容模型与首批数据 | ⬜ | — | Sanity 现状：3 items / 20 categories / 3 groups / 0 posts / 3 pages |
| 5. SEO 配置与检查 | ⬜ | — | 依赖步骤 4 的博客与工具数据 |
| 6. 支付、邮件与登录 | 🟡 | 2026-10-18 | 第一期裁剪 ✅：OAuth 按钮与 Pro/Sponsor 卡片已按环境变量隐藏；Free 套餐与 FAQ 文案已重写；Resend 代码已改为缺 Key 时显式报错，但真实 Key 仍缺 |
| 7. 部署上线 | 🟡 | 2026-10-18 | 已部署生产：https://dirhuntai.vercel.app ；`dirhuntai.com` / `www` 已加入 Vercel 项目，DNS 仍指向 Spaceship，待改 A 记录；GitHub 自动部署未连接 |
| 8. 上线验收清单 | ⬜ | — | 依赖步骤 7 |
| 9. 内容运营 SOP | ⬜ | — | 上线后启动 |
| 10. 安全与备份 | ⬜ | — | 上线前至少完成 Sanity 备份与密钥轮换计划 |

### 当前下一步（2026-10-18）

按优先级执行：

1. **7.1 DNS**：在 Spaceship 把 `dirhuntai.com` / `www` 指向 Vercel（见下方记录）
2. **6.2 配置 Resend**：当前 `RESEND_API_KEY` 未配置，开放注册前必须换成真实 Key 并验证域名
3. **1/7 连接 GitHub**：Vercel 项目尚未连上 GitHub 仓库，目前靠 CLI 部署；连接后才能每次 push 自动构建
4. **4 首批内容**：清理演示分类，补 50–100 个工具与 3 篇评测

### 已知阻塞项

| 阻塞项 | 影响 | 解除条件 |
|---|---|---|
| Resend 未配置 | 注册、找回密码、订阅全部不可用 | 真实 API Key + 已验证发信域名（SPF / DKIM / DMARC） |
| 域名 DNS 未指向 Vercel | `dirhuntai.com` 仍打开旧页面 | Spaceship 添加 `A @ 76.76.21.21` 与 `A www 76.76.21.21` |
| Vercel 未连接 GitHub | push 后不会自动部署 | 在 Vercel 安装 GitHub App 并授权 `zx5bb285/mkdirs` |

---

## 0. 上线前需要先确定的 3 件事

| 决策 | 当前建议 | 说明 |
|---|---|---|
| 品牌名 | DirHunt AI | AI 工具目录 + 独立评测 |
| 主域名 | `dirhuntai.com` | 已在 Spaceship 注册；同时绑定 `www` 并 301 到主域 |
| 语言策略 | 英文默认，中文通过 cookie 切换 | 当前 `localePrefix: "never"`，所有语言共用 `/blog/...` 这类无前缀 URL |

语言策略的取舍：

- 优点：URL 干净，英文内容集中在一个地址上
- 代价：Google 只会索引一个语言版本（默认英文）
- 如果以后要让中英文分别参与搜索排名，需要改为 `/zh-CN/...` + hreflang

---

## 1. 账号与基础设施

按顺序开通并记录凭据：

| 服务 | 第一期 | 用途 | 需要拿到 |
|---|---|---|---|
| Sanity | ✅ 必备 | CMS / 用户 / 订单等全部数据 | Project ID、Dataset、API Token |
| Vercel | ✅ 必备 | 部署 | 导入 GitHub 仓库 |
| Resend | ✅ 强烈建议 | 注册验证、找回密码、订阅、投稿通知 | API Key、已验证发信域名 |
| GitHub | ✅ 建议 | 代码托管（Vercel 部署来源） | 仓库访问权限 |
| xAI / OpenAI / DeepSeek | ✅ 按需 | 博客 bot | API Key |
| OpenPanel / GA / Umami | ⬜ 可选 | 访问分析 | 站点 ID |
| Stripe | ⬜ 第二期 | 付费提交 / 赞助 | Price ID、Webhook Secret |
| Google Cloud | ⬜ 第二期 | Google 登录 | OAuth Client ID / Secret |
| GitHub OAuth | ⬜ 可选 | GitHub 登录（与代码托管无关） | OAuth Client ID / Secret |

第一期只有 **Sanity** 是不可替代的内容与数据服务；**Resend** 在开放注册的前提下几乎是必需品（见 6.2）。

### Sanity CORS

Sanity 项目 → **API → CORS origins**，添加：

```
http://localhost:3000
http://localhost:3001
https://dirhuntai.com
https://www.dirhuntai.com
```

本地与生产都要能访问 Studio 和内容 API。

---

## 2. 本地环境跑通

```bash
cp .env.example .env
pnpm install
NODE_USE_ENV_PROXY=1 pnpm dev
```

> 本机直连 Sanity 可能超时，因此本地开发需要 `NODE_USE_ENV_PROXY=1`。

最小可运行变量：

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...
AUTH_SECRET=...          # openssl rand -base64 32

# 开放注册时需要，否则注册流程会在发送验证邮件时失败
RESEND_API_KEY=re_...
RESEND_EMAIL_FROM=hello@dirhuntai.com
```

> `AUTH_SECRET` 不是第三方服务，但必须设置。缺失时 NextAuth 会在运行时报错，`auth()` 调用（布局、middleware）都会受影响。

验证入口：

- 前台：http://localhost:3000
- 后台：http://localhost:3000/studio

---

## 3. 品牌与全站配置

### 3.1 站点身份

修改 `.env`：

```env
NEXT_PUBLIC_APP_URL=https://dirhuntai.com
NEXT_PUBLIC_SITE_NAME=DirHunt AI
NEXT_PUBLIC_SITE_DESCRIPTION=Independent reviews and comparisons of AI tools and software.
NEXT_PUBLIC_SITE_KEYWORDS=AI tools,software reviews,tool comparisons,free alternatives
NEXT_PUBLIC_SITE_AUTHOR=DirHunt AI Editorial
NEXT_PUBLIC_SITE_TWITTER=
NEXT_PUBLIC_SITE_GITHUB=
NEXT_PUBLIC_SITE_YOUTUBE=
NEXT_PUBLIC_SITE_MAIL=hello@dirhuntai.com
```

### 3.2 视觉资产

替换 `public/` 下：

- `logo.png`、`logo-dark.png`
- `og.png`（1200×630 社交分享图）
- `favicon.ico`、`favicon-32x32.png`、`apple-touch-icon.png`
- `site.webmanifest` 中的站点名

### 3.3 文案

修改：

- `src/messages/en.json`
- `src/messages/zh-CN.json`

重点替换：

- `Site.tagline`
- `Site.description`
- `Footer.copyright`
- 导航、页脚、定价页文案

> 模板中文文案仍是“这是 Mkdirs 的演示站点”，上线前必须替换。

### 3.4 导航与页脚

当前**不能在 Sanity 后台配置**，需要改代码：

| 位置 | 文件 |
|---|---|
| 网站顶部菜单 | `src/config/marketing.ts` |
| Dashboard 顶部菜单 | `src/config/dashboard.ts` |
| 页脚菜单 | `src/config/footer.ts` |

菜单 `title` 是翻译 key，需要在 `en.json` / `zh-CN.json` 中同步添加。

### 3.5 页面内容

在 Studio 的 **Pages** 中创建（✅ 2026-10-18 已完成）：

- About（`page-about`，slug `about`）
- Privacy Policy（`page-privacy`，slug `privacy`）
- Terms of Service（`page-terms`，slug `terms`）
- Changelog（可选，未建）

三个页面均为 Portable Text，已发布并验证 `/about`、`/privacy`、`/terms` 返回 200。
后续如需改文案，直接在 Studio → Pages 编辑，不需要改代码。

面向欧盟用户时，补充 Cookie 同意提示。

---

## 4. 内容模型与首批数据

### 4.1 清理演示数据

模板自带 19 个演示分类（Kotlin/Swift Boilerplates 等）和演示 item。

- 数据量少：直接在 Studio 删除
- 全新数据集：可以运行 `pnpm batch:remove`
- ⚠️ `pnpm batch:remove` 会删除**全部**目录数据，只能在确认无真实内容时使用

### 4.2 目录结构

```
Group（分组）
 └─ Category（分类）
     └─ Item（工具/产品）
```

建议首批分组：

- AI Writing
- AI Image
- AI Video
- AI Coding
- Productivity

每个分组下建 3–6 个分类，每个分类下 10–30 个工具。

Item 字段尽量完整：

- 名称、Slug、官网链接
- 简介、Logo / 截图
- 分类、标签
- 价格模式（免费 / Freemium / 付费）

### 4.3 博客内容

在 Studio 中：

1. **All Blog Categories**：创建评测分类
2. **Authors**：创建真实作者档案（姓名、职位、简介、专长、头像）
3. **Blog Posts**：发布首批 3–5 篇深度评测

> 不要使用虚构作者身份。Google 的 E-E-A-T 会评估作者真实性。

标准评测结构：

1. 一句话结论
2. 对比表
3. 评测方法 / 测试环境
4. 分项评分卡
5. 价格与免费额度
6. 优缺点
7. FAQ
8. 最后更新时间

### 4.4 定价页

- `src/config/price.ts`：套餐价格与权益
- `src/messages/*.json`：套餐文案

---

## 5. SEO 配置与检查

模板已内置：

- canonical
- Open Graph / Twitter Card
- JSON-LD（Article、Breadcrumb、Organization、WebSite）
- `sitemap.xml`
- `robots.txt`
- `feed.xml`

### 上线前逐项确认

- [ ] `NEXT_PUBLIC_APP_URL` 是生产域名
- [ ] `/robots.txt` 中的 Sitemap 地址正确
- [ ] `/sitemap.xml` 无 `/en`、`/zh-CN` 重复目录
- [ ] 文章页 JSON-LD 通过 Google Rich Results Test
- [ ] 每页只有一个 `h1`
- [ ] 正文标题层级从 `h2` 开始
- [ ] 每篇文章有唯一 title / description
- [ ] 图片全部有 alt
- [ ] 文章之间、文章与分类页之间有内链
- [ ] OG 图在社交平台预览正常

### 搜索平台

- Google Search Console：使用 **DNS TXT 验证**，提交 sitemap
- Bing Webmaster Tools：提交 sitemap
- 主要做英文流量时，GSC 国际化定位保持默认

---

## 6. 支付、邮件与登录

### 第一期范围

| 能力 | 第一期 | 说明 |
|---|---|---|
| 免费提交 | ✅ 可用 | 不经过 Stripe，提交后在 Dashboard 审核 |
| 付费提交 / 赞助 | ⬜ 不接 | 定价页的 Pro / Sponsor 按钮点击会报错，建议先隐藏 |
| 邮箱密码注册登录 | ✅ 可用 | 依赖 Resend 发送验证邮件 |
| Google / GitHub 登录 | ⬜ 不接 | 登录页按钮建议隐藏；GitHub OAuth 与 Google Cloud 无关 |
| 找回密码 / Newsletter | ✅ 可用 | 依赖 Resend |

### 6.1 Stripe（第二期）

> 第一期跳过本节。免费提交流程（`src/actions/submit.ts` → `submitToReview`）完全不依赖 Stripe。
> ✅ 已裁剪：`src/config/price.ts` 的 `visiblePricePlans` 只在
> `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` / `NEXT_PUBLIC_STRIPE_SPONSOR_PRICE_ID`
> 有值时渲染对应套餐卡，第一期定价页只显示 Free。

1. 创建产品：Pro、Sponsor
2. 填入 Price ID：

```env
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_SPONSOR_PRICE_ID=price_...
STRIPE_API_KEY=sk_...
```

3. 配置 Webhook：

```
https://dirhuntai.com/api/webhook
```

当前代码只处理 `checkout.session.completed`，勾选该事件即可。

4. 本地联调：

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

把生成的 `whsec_...` 填入 `STRIPE_WEBHOOK_SECRET`。

### 6.2 Resend（第一期必做，若开放注册）

为什么不能省：`src/actions/register.ts` 在创建 Sanity 用户后立即调用
`sendVerificationEmail`；未配置 Resend 会直接抛错，注册流程中断。同时
`auth.ts` 的 `signIn` 回调拒绝未验证邮箱的密码登录，所以没有验证邮件
就无法用邮箱密码登录。

1. 在 Resend 添加并验证域名（SPF / DKIM / DMARC）
2. 配置：

```env
RESEND_API_KEY=re_...
RESEND_EMAIL_FROM=hello@dirhuntai.com
RESEND_EMAIL_ADMIN=admin@dirhuntai.com
RESEND_AUDIENCE_ID=...
```

3. 触发一次注册/订阅邮件，确认送达

> 代码侧已加保护：`src/lib/mail.ts` 在 `RESEND_API_KEY` 缺失或仍是
> `re_placeholder` 时直接抛 `RESEND_API_KEY is not configured`，并把 Resend
> 返回的 `error` 转成异常，避免注册流程“看似成功、实际没收到验证邮件”。

### 6.3 OAuth（第二期）

> 第一期跳过。Google 登录需要 Google Cloud OAuth Client；GitHub 登录只需
> GitHub Developer Settings 的 OAuth App，不使用 Google Cloud。两者都不影响
> 邮箱密码登录。✅ 已裁剪：`src/lib/auth-providers.ts` 根据环境变量计算
> `hasSocialLogin`，登录 / 注册页只在配置了对应 ID/Secret 时显示 OAuth 按钮。

回调地址：

```
https://dirhuntai.com/api/auth/callback/google
https://dirhuntai.com/api/auth/callback/github
```

---

## 7. 部署上线

推荐 **Vercel**，这是 Next.js 14 + Sanity 最省事的路径。

### 7.1 部署步骤

> 2026-10-18 实际状态：代码已合并到 `main`；Vercel 项目
> `zoubobs-projects/dirhuntai` 已创建并通过 CLI 部署；生产别名
> https://dirhuntai.vercel.app 已验证。GitHub 自动部署尚未连接，域名 DNS 待改。

1. 推送到 GitHub ✅（PR #1 已 squash 合并到 `main`）
2. Vercel 导入仓库 🟡（项目已建，GitHub App 未授权 `zx5bb285/mkdirs`）
3. 在 Vercel 填入全部生产环境变量 ✅（production 已配 18 项；preview 未配）
4. 本地先验证：

```bash
pnpm lint
pnpm typegen
pnpm build
```

5. 部署后绑定域名：
   - `dirhuntai.com` → 主域名
   - `www.dirhuntai.com` → 301 跳转到主域名
6. 在 Sanity CORS 中添加生产域名 ✅（已加 `dirhuntai.com`、`www.dirhuntai.com`、`localhost:3000`、`dirhuntai.vercel.app`）
7. 更新 Stripe / OAuth / Resend 中的生产回调地址（第二期再做）

#### 当前待配置的 DNS（Spaceship）

Vercel 对 `dirhuntai.com` 与 `www.dirhuntai.com` 给出的推荐记录：

| 类型 | 主机 | 值 |
|---|---|---|
| A | `@` | `76.76.21.21` |
| A | `www` | `76.76.21.21` |

改完后在 Vercel 项目 → Domains 等待状态变为 Valid；如使用 Cloudflare 代理，需把记录设为 DNS only。

> Cloudflare Pages 需要额外的 OpenNext 适配，首站不建议。

### 7.2 环境变量清单

```env
# 站点
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SITE_NAME=
NEXT_PUBLIC_SITE_DESCRIPTION=
NEXT_PUBLIC_SITE_KEYWORDS=
NEXT_PUBLIC_SITE_AUTHOR=
NEXT_PUBLIC_SITE_MAIL=

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_TOKEN=

# 认证（第一期只需 AUTH_SECRET）
AUTH_SECRET=
# 第二期：AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_GITHUB_ID / AUTH_GITHUB_SECRET

# 支付（第二期，第一期留空）
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_SPONSOR_PRICE_ID=

# 邮件（第一期必填：注册验证、找回密码、订阅）
RESEND_API_KEY=
RESEND_EMAIL_FROM=
RESEND_EMAIL_ADMIN=
RESEND_AUDIENCE_ID=

# 分析
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=

# 博客 bot
BLOG_BOT_SECRET=
BLOG_BOT_AUTHOR_EMAIL=
BLOG_BOT_AUTHOR_ID=
BLOG_BOT_AUTHOR_NAME=Editorial Team
BLOG_BOT_AUTHOR_TITLE=Editorial Team
BLOG_BOT_AUTHOR_BIO=
XAI_API_KEY=
XAI_BLOG_MODEL=grok-3
BLOG_BOT_MIN_WORDS=800
BLOG_BOT_MIN_ZH_CHARS=600
BLOG_AUTO_PUBLISH=true
BLOG_BOT_MAX_IMAGE_BYTES=20971520
```

---

## 8. 上线验收清单

### 页面

- [ ] 首页 200，无布局错乱
- [ ] `/blog` 列表、分类页、文章页 200
- [ ] 文章目录锚点全部可跳转
- [ ] 表格、图片正常显示
- [ ] 手机端菜单与文章排版正常
- [ ] 404 页面正常

### 语言

- [ ] 默认打开为英文
- [ ] 切换中文后 URL 不变、界面变中文
- [ ] 刷新后语言选择被记住

### 账户

- [ ] `/dashboard` 未登录跳转 `/auth/login`
- [ ] 注册 → 收到验证邮件 → 登录成功
- [ ] Google / GitHub 登录按钮已隐藏（第一期不接）

### 内容与支付

- [ ] 提交工具流程可用
- [ ] 免费提交流程可用（提交 → 审核 → 发布）
- [ ] 付费计划入口已隐藏（第一期不接 Stripe）
- [ ] 第二期再验收：Stripe 测试支付、订单写入、客户门户

### SEO

- [ ] `/sitemap.xml` 正常
- [ ] `/robots.txt` 正常
- [ ] `/feed.xml` 正常
- [ ] canonical 是生产域名
- [ ] GSC 验证通过并提交 sitemap
- [ ] Rich Results Test 无错误

### 品牌

- [ ] 演示文案已全部替换
- [ ] 演示分类与工具已清理
- [ ] Logo、OG、favicon 已替换

---

## 9. 内容运营 SOP

### 9.1 每周节奏

| 时间 | 动作 |
|---|---|
| 周一 | 选 5–8 个关键词，确定标题与搜索意图 |
| 周二–周四 | 发布 3–5 篇评测 / 对比 |
| 周五 | 内链检查、更新旧文、查看 GSC |
| 每两周 | 更新 1 篇旧文的价格、功能与 `lastReviewedAt` |

### 9.2 Grok bot 发文

接口文档：`docs/blog-bot.md`

```
POST /api/blog/generate
Authorization: Bearer $BLOG_BOT_SECRET
```

两种模式：

- `mode: "ingest"`：外部写好 Markdown 后提交
- `mode: "generate"`：由 Grok 生成

自动处理：

- 图片镜像到 Sanity
- Markdown → Portable Text（含表格）
- 质量门槛检查
- 通过后自动发布
- 同一 `externalId` 只更新、不重复创建

建议流程：

1. 初期设置 `BLOG_AUTO_PUBLISH=false`，人工审核
2. 稳定后开启自动发布
3. 每篇发布后补充：首段结论、真实测试细节、内链
4. 保持真实作者身份，不使用虚构人设

---

## 10. 安全与备份

- `BLOG_BOT_SECRET` 使用至少 32 字节随机值，定期轮换
- 对 `/api/blog/generate` 增加速率限制或放在 Cloudflare 后面
- 定期轮换 Sanity Token、Stripe、Resend、OAuth Secret
- 开启 Sanity 自动备份，并定期导出：

```bash
sanity dataset export production backup.tar.gz
```

- 保持 GitHub 仓库为唯一代码来源，生产环境只从主分支部署

---

## 11. 时间线

| 天 | 任务 |
|---|---|
| D1 | 开通 Sanity / Vercel / Resend，绑定 `dirhuntai.com` |
| D2 | 本地跑通，替换品牌与文案 |
| D3–D4 | 建分组 / 分类 / 工具，首批 50–100 个条目 |
| D5 | 建作者、博客分类，发布 3 篇评测 |
| D6 | SEO 检查，邮件 / 注册登录联调（Stripe 留到第二期） |
| D7 | 部署、绑定域名、GSC 提交、验收 |
| D8 起 | 每周 3–5 篇内容 + 内链 + GSC 复盘 |

---

## 12. 常用命令

```bash
pnpm dev                 # 本地开发
pnpm build               # 生产构建
pnpm start               # 本地运行生产构建
pnpm lint                # Biome 检查
pnpm format              # 格式化
pnpm typegen             # 修改 Sanity schema 后生成类型
pnpm email               # 邮件模板预览（端口 3333）

pnpm batch:import        # 批量导入示例数据（groups/categories/tags/items）
pnpm batch:update        # 批量更新
pnpm batch:remove        # ⚠️ 删除全部目录数据
```

---

## 13. 关键文件索引

| 内容 | 文件 |
|---|---|
| 站点配置 | `src/config/site.ts` |
| 定价配置 | `src/config/price.ts` |
| 顶部菜单 | `src/config/marketing.ts` |
| Dashboard 菜单 | `src/config/dashboard.ts` |
| 页脚菜单 | `src/config/footer.ts` |
| 多语言路由 | `src/i18n/routing.ts` |
| 中英文文案 | `src/messages/en.json`、`src/messages/zh-CN.json` |
| SEO 元数据 | `src/lib/metadata.ts` |
| 站点地图 | `src/app/sitemap.ts` |
| RSS | `src/app/feed.xml/route.ts` |
| 博客 bot 接口 | `src/app/api/blog/generate/route.ts` |
| 博客 bot 文档 | `docs/blog-bot.md` |
| Sanity Schema | `src/sanity/schemas/` |
| Studio 结构 | `src/sanity/structure.tsx` |

---

## 14. 变更记录

按时间倒序记录每次推进，方便回溯「哪一天做到了哪一步」。

| 日期 | 更新内容 |
|---|---|
| 2026-10-18 | 推送并部署：260 个文件提交到 `feat/dirhuntai-launch-phase-1`，PR #1 squash 合并进 `main`；修复 `pnpm-lock.yaml` 与 `package.json` 不同步导致的 frozen-lockfile 失败；Vercel 项目 `dirhuntai` 创建并部署成功（https://dirhuntai.vercel.app），production 环境变量 18 项已配；Sanity CORS 补齐生产域名与 `localhost:3000`；`dirhuntai.com` / `www.dirhuntai.com` 已加入 Vercel 项目，DNS 待改；线上验证 `/`、`/about`、`/privacy`、`/terms`、`/pricing`、`/auth/login`、`/robots.txt`、`/sitemap.xml`、`/feed.xml`、`/studio` 均 200，定价页只渲染 Free、登录页无 OAuth 按钮 |
| 2026-10-18 | 完成 3.5：Sanity 建 `page-about` / `page-privacy` / `page-terms` 并发布，三页均验证 200；完成步骤 6 第一期裁剪：`src/lib/auth-providers.ts` 按环境变量决定是否显示 OAuth，`src/config/price.ts` 的 `visiblePricePlans` 按 Price ID 过滤 Pro/Sponsor，定价页只渲染 Free；重写 Free 套餐与 FAQ 文案（中英）；`src/lib/mail.ts` 缺 Key 时显式抛错；`pnpm build` 通过，运行时验证 `/auth/login` 无 OAuth 按钮、`/pricing` 仅 Free |
| 2026-10-18 | 完成 3.1 / 3.2：`NEXT_PUBLIC_APP_URL` 改为 `https://dirhuntai.com`，补齐 SITE_DESCRIPTION / KEYWORDS / AUTHOR；重做 `logo.png`、`logo-dark.png`、`og.png`（1200×630）、favicon 全套、android/apple 图标；启用 `logoDark`；`site.webmanifest` theme_color 改为 `#7C3AED`；删除模板遗留 `logo_mkdirs.png`；投稿页遗留的 `support@example.com` 改为 `siteConfig.mail`；`pnpm build` 通过 |
| 2026-10-18 | 建立进度看板；完成首次全量核查：步骤 0、2 确认完成；步骤 3 文案与菜单已完成、视觉资产与生产 URL 未完成；步骤 6 第一期裁剪未做；Sanity 数据为 3 items / 20 categories / 3 groups / 0 posts / 0 pages；`pnpm build` 通过；233 个改动未提交 |
| 2026-10-18 | 下一步锁定为：品牌资产替换、OAuth/付费入口隐藏、About/Privacy/Terms 页面、Resend 配置 |
