# FreeMusic Manager

FreeMusic 的独立曲库与发布管理后台。当前已完成响应式管理界面，以及桌面端单曲拖放导入、音频 Tag 分析、本地曲库保存、歌曲信息编辑和发布状态管理。

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

## 当前边界

- 这是独立仓库，不与 `FreeMusic` 前台代码混放。
- 当前不接入公开曲库 API、Cloudflare R2、登录、支付或订单系统。
- 桌面端可以选择或拖放单首音频，在浏览器分析 Tag，并把确认后的音频、内嵌封面和曲目记录保存到本地曲库。
- 桌面端和移动端都可以编辑已入库歌曲的标题、作者、专辑、风格、BPM、情绪、年份与备注；编辑不会重写音频文件。
- 桌面端和移动端都可以将歌曲从草稿发布、将已发布歌曲下架，并让下架歌曲恢复为草稿或重新发布；当前状态只保存在本地曲库，不会自动同步前台。
- 本地曲库默认包含 `storage/audio`、`storage/covers` 和 `storage/catalog/tracks.json`；整个运行目录不会进入 Git。
- 存储由适配器统一处理。`MUSIC_STORAGE_DRIVER=local` 使用本地目录，`MUSIC_LOCAL_STORAGE_PATH` 可以修改目录位置。
- `r2` 驱动名称已经预留，但本阶段没有实现 R2 适配器；将来实现后，业务保存链路只需通过环境变量切换，不需要改上传组件。
- 移动端只提供歌曲管理界面，不提供上传入口。
- 当前不生成可复制给前台的发布包，也不自动修改前台仓库。
- 每次只实现一个阶段，验收通过后再进入下一阶段。

本阶段尚未加入管理员登录，请不要把管理后台直接暴露到公网。

## 开发计划

- `docs/manager-development-plan.md`
