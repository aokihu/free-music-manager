# FreeMusic Manager

FreeMusic 的独立曲库与发布管理后台。当前已完成响应式管理界面、桌面端歌曲文件夹批量导入、双版本音频 Tag 分析、本地曲库维护，以及面向前台的只读公开曲库 API。

## 技术栈

- React / Next.js App Router
- Shadcn UI
- Zustand
- Tailwind CSS v4

## 本地运行

```bash
npm install
npm run dev
```

默认使用项目内的 `storage` 目录保存运行数据。可以先复制环境变量示例：

```bash
cp .env.example .env.local
npm run dev
```

默认访问 `http://localhost:3000`。如果前台项目占用 3000 端口，可使用：

```bash
npm run dev -- --port 3001
```

Next.js 在本地开发时自动使用 `NODE_ENV=development`。该模式固定选择本地文件适配器和 JSON 曲库仓库，不需要配置存储路径或存储驱动。

正式部署使用 `NODE_ENV=production`，并通过一个额外变量选择部署平台：

```env
DEPLOYMENT_PROVIDER=cloudflare
```

规划的平台值为 `cloudflare`、`aws` 和 `server`。Cloudflare 适配器已经实现；AWS 与普通云服务器适配器尚未实现，生产环境不会静默回退到本地存储。

## Cloudflare 部署基础

Wrangler 与 OpenNext 均安装在本项目中，不需要全局安装。当前已经实现 R2 对象存储、D1 曲库仓库及 Cloudflare 生产适配器组合，并将后台自定义域名配置为 `manager.tingever.com`；尚未创建 Cloudflare 远程资源。

```bash
# 生成 Cloudflare 绑定类型
npm run cf:typegen

# 将数据库迁移应用到 Wrangler 本地 D1
npm run db:migrate:local

# 生成可由 Cloudflare Workers 运行的构建产物
npm run build:cloudflare

# 启动使用本地 R2 / D1 数据的 Workers 预览
npm run preview:cloudflare
```

`npm run deploy:cloudflare` 是正式部署命令。执行前必须先创建 `freemusic-media` R2 Bucket 和 `freemusic-catalog` D1 数据库、补充 D1 的 `database_id`、执行远程数据库迁移并完成管理员认证。当前阶段不要执行该命令。

## 当前边界

- 这是独立仓库，不与 `FreeMusic` 前台代码混放。
- 当前不接入登录、支付或订单系统；Cloudflare 已完成 R2 对象存储、D1 曲库仓库与生产适配器组合，公开 API 在本地开发时仍使用本地文件和 JSON 曲库，不开放管理操作。
- 桌面端可以选择一个批量根目录或拖放多个歌曲文件夹；每个歌曲文件夹必须包含 `{name}__h.{audio}` 高清版、`{name}__l.ogg` 低清版，以及 `cover.png`、`cover.jpg` 或 `cover.jpeg`。
- 高清版支持 AAC、AIFF、FLAC、M4A、MP3、OGG、OPUS 和 WAV；低清版只支持真实 OGG 文件；封面只支持真实 PNG 或 JPEG，单张最大 20 MB。
- 批量导入会逐个分析歌曲文件夹，以高清版 Tag 生成可编辑草稿；保存前可以在高清版与低清 OGG 之间切换试听，所有歌曲共用一个本地播放器。保存时按歌曲顺序逐个提交，避免整批大文件同时上传。
- 桌面端和移动端都可以编辑已入库歌曲的标题、作者、专辑、风格、BPM、情绪、年份与备注，并可单独替换或删除 PNG/JPEG 封面；没有封面时管理后台和公开曲库使用默认占位图，编辑不会重写音频文件。
- 桌面端和移动端都可以将歌曲从草稿发布、将已发布歌曲下架，并让下架歌曲恢复为草稿或重新发布；开发模式保存到本地 JSON，Cloudflare 部署模式保存到 D1。
- 桌面端和移动端都可以在确认后永久删除歌曲；删除会依次清理高清音频、低清 OGG、封面和曲库记录，并移除空的本地歌曲目录。
- 每首歌曲保存在 `storage/tracks/{trackId}/` 独立目录，目录中包含高清版、低清版和封面；曲库索引位于 `storage/catalog/tracks.json`。整个运行目录不会进入 Git。
- 对象文件和曲库数据分别通过存储适配器、曲库仓库适配器处理。开发模式使用 `storage/` 本地文件和 `storage/catalog/tracks.json`；上传、编辑、发布和删除业务不依赖具体部署平台。
- 正式部署时根据 `DEPLOYMENT_PROVIDER` 选择整组适配器：Cloudflare 使用 R2 + D1；AWS 计划使用 S3 + 托管数据库，普通云服务器计划使用本地磁盘 + SQL 数据库。
- 移动端只提供歌曲管理界面，不提供上传入口。
- `GET /api/tracks` 返回已发布歌曲；`GET /api/tracks/{trackId}/cover` 和 `/preview` 返回封面与低清 OGG，媒体接口支持 Range、ETag、HEAD 和公开只读 CORS。
- 高清下载 API 尚未开放，公开列表暂时返回 `download.state=unavailable`；当前也不会自动修改前台仓库。
- 双版本结构是当前唯一数据模型，不读取或迁移旧单音频结构。
- 每次只实现一个阶段，验收通过后再进入下一阶段。

本阶段尚未加入管理员登录，请不要把管理后台直接暴露到公网。

## 开发计划

- `docs/manager-development-plan.md`
- `docs/public-catalog-api.md`
