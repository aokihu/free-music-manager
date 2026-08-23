# Code Guide

- Less Code, More Power。
- 遵循“快速开发、快速发现问题、快速解决问题”。
- 避免一步到位，执行小步快行策略。
- 使用语义明确的函数命名。
- 先读现有实现，再决定是否修改。
- 优先补全现有职责边界，不额外发散新功能。
- 只有确认出现明确重复、冲突或扩展阻塞时，才做重构。
- 每个阶段完成后运行 lint、类型检查和生产构建。
- 未经明确要求，不自动提交、推送或配置远程仓库。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
