# GSC / Bing / Core Web Vitals 操作清单

日期：2026-10-21
适用范围：dirhuntai.com

## 当前状态

- 仓库和 Vercel 中都没有 GSC、Bing Webmaster 或 CrUX API 凭证。
- PageSpeed Insights API 的匿名配额已被共享项目用完（HTTP 429），
  今天无法再通过该接口取数。
- 因此第 14 项（提交并请求索引）和第 15 项（用 CrUX/GSC 看 CWV）
  **还没有真正提交或拿到字段数据**，不能把下面的步骤当成已完成。

## 站内已准备好的部分

- `https://dirhuntai.com/sitemap.xml`：58 个可索引 URL。
- 空分类、空标签、空合集已从 sitemap 排除；对应页面输出 `noindex, follow`。
- 未知 slug 和未知路径返回 404；受保护页面未登录时 302 到登录页。
- `https://dirhuntai.com/llms.txt` 返回 200。
- 工具页、分类页、标签页、合集页有 Breadcrumb / ItemList；
  工具有 FAQPage 与 SoftwareApplication（只在有已核验起步价时输出 offers）。

## Google Search Console（约 10 分钟）

1. 打开 <https://search.google.com/search-console>，添加“网域”资源
   `dirhuntai.com`。
2. 按提示在 DNS 添加 `google-site-verification=...` TXT 记录，等待验证。
3. 进入“站点地图”，提交：
   `https://dirhuntai.com/sitemap.xml`
4. 用“网址检查”逐个检查并请求编入索引（每天有配额，分几天做）：
   - `/`
   - `/category/writing-text`
   - `/category/coding-development`
   - `/item/grammarly`
   - `/item/chatgpt`
   - `/item/claude`
   - `/item/cursor`
   - `/blog`
   - `/blog/chatgpt-vs-claude`
   - `/blog/grammarly-alternatives`
5. 观察 2–4 周：收录数、展现、点击、平均排名、抓取异常。
   不要每天重复提交同一批 URL。

## Bing Webmaster Tools（约 5 分钟）

1. 打开 <https://www.bing.com/webmasters>，选择“从 GSC 导入”。
2. 确认站点后提交同一份 sitemap。
3. 可选：启用 IndexNow。需要在站点根目录放一个 `<key>.txt`，
   并在发布时向 `https://api.indexnow.org/indexnow` 推送 URL。
   当前仓库没有实现，启用前需要先加 key 和部署。

## CrUX / Core Web Vitals

### 拿字段数据

1. 在 Google Cloud 启用 **Chrome UX Report API**，创建 API key。
2. 把 key 放进 `.env`（例如 `CRUX_API_KEY=...`），不要提交。
3. 查询 origin 或具体 URL：
   `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=...`
   请求体示例：
   ```json
   { "origin": "https://dirhuntai.com" }
   ```
   或 `{ "url": "https://dirhuntai.com/item/grammarly" }`。
4. 关注 p75 的 LCP、INP、CLS。CrUX 需要足够流量才会返回 URL 级数据；
   流量不足时只能看 origin。

### 2026-10-21 的本地 Lighthouse 结果

生产首页，Lighthouse 12，报告保存在 `backups/`：

| 设备 | 性能分 | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|
| 桌面 | 95 | 0.5 s | 1.0 s | 0.023 | 0 ms |
| 移动（模拟慢 4G + 4x CPU） | 38 | 5.6 s | 9.8 s | 0.156 | 470 ms |

服务器响应：本地生产进程 TTFB 约 31–81 ms；Lighthouse 报告中的
`server-response-time` 为 90–140 ms。桌面端不是瓶颈。

移动端 9.8 s 是**实验室模拟值**，不等于真实用户字段数据。
LCP 元素是首页 H1，TTFB 只占约 1 s，其余是渲染延迟；
首屏 H1 之前还有统计数字查询、客户端 JS 水合和 4 个字体文件。
在拿到 CrUX p75 之前，不建议为了分数盲目删功能。

### 触发优化的门槛

观察 2–4 周后：

- 若 CrUX p75 LCP ≤ 2.5 s、INP ≤ 200 ms、CLS ≤ 0.1：维持现状，
  只做小修。
- 若 p75 LCP > 2.5 s：优先处理首页首屏
  （统计查询不阻塞 H1、减少首屏客户端组件、检查字体加载）。
- 若 p75 CLS > 0.1：优先定位首屏图片尺寸和字体切换。
- 若 INP > 200 ms：检查搜索框、命令面板和筛选组件的长任务。

## 内容发布提醒

第二批 5 个工具页和 2 篇对比文章目前都是 **Sanity 草稿**，
没有发布。生产页面仍是旧内容，sitemap 也不会包含草稿。
必须先在 Studio 人工审核，再逐条发布。
