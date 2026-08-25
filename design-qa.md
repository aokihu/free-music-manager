# Design QA: 编辑歌曲封面布局

- Source visual truth: `design/qa/source-cover-too-tall.png`，776 × 768 px；该截图明确显示 Cover 高度大于右侧 List，最终目标以用户提出的“Cover 高度与 List 高度一致”为准。
- Implementation screenshot: `design/qa/edit-dialog-cover-list-equal-height.png`，1280 × 720 px。
- Short viewport screenshot: `design/qa/edit-dialog-cover-list-equal-height-short.png`，760 × 300 px。
- Mobile screenshot: `design/qa/edit-dialog-cover-list-equal-height-mobile.png`，390 × 844 px。
- Comparison image: `design/qa/cover-list-equal-height-comparison.png`，1824 × 602 px。
- Latest source visual truth: `design/qa/source-cover-collapsed.png`，1626 × 738 px；该截图显示封面容器塌缩成一条边框，并残留“悬停图片可替换或删除”说明。
- Latest implementation screenshot: `design/qa/edit-dialog-cover-visible-no-note.png`，1280 × 720 px。
- Latest short viewport screenshot: `design/qa/edit-dialog-cover-short-viewport.png`，1100 × 600 px。
- Latest comparison image: `design/qa/cover-fix-comparison.png`，1800 × 540 px。
- Hover source visual truth: `design/qa/source-cover-buttons-top.png`，1626 × 738 px；该截图显示操作按钮偏向封面顶部。
- Hover implementation screenshot: `design/qa/edit-dialog-cover-centered-blur-hover.png`，1280 × 720 px。
- Hover comparison image: `design/qa/cover-centered-blur-comparison.png`，1800 × 540 px。
- Strict hover source visual truth: `design/qa/source-cover-hover-state.png`，788 × 738 px。
- Strict hover default screenshot: `design/qa/edit-dialog-cover-normal-hidden.png`，1280 × 720 px。
- Strict hover active screenshot: `design/qa/edit-dialog-cover-hover-buttons.png`，1280 × 720 px。
- Strict hover comparison image: `design/qa/cover-hover-state-comparison.png`，1800 × 480 px。
- Delete contrast source visual truth: `design/qa/source-delete-low-contrast.png`，788 × 738 px。
- Delete contrast implementation screenshot: `design/qa/edit-dialog-delete-solid-red.png`，1280 × 720 px。
- Delete contrast comparison image: `design/qa/delete-button-contrast-comparison.png`，1800 × 540 px。
- Cover layout source visual truth: `design/qa/source-cover-square-hover-corners.png`，788 × 738 px。
- Cover layout implementation screenshot: `design/qa/edit-dialog-cover-layout-redesign.png`，1280 × 720 px。
- Cover layout focused comparison: `design/qa/cover-rounded-hover-comparison.png`，1800 × 500 px。
- Desktop viewport: 1280 × 720 CSS px，device scale factor 1。
- Short viewport: 760 × 300 CSS px，device scale factor 1。
- State: 已有封面的编辑弹窗悬停状态；没有保存任何表单操作。
- Density normalization: 用户截图密度未知，因此比较图按相同最大面板宽度缩放，仅判断比例、层级和图标权重，不做像素级字号结论。

## Full-view comparison evidence

- 封面列和歌曲文件列继续保持 1:1 等宽。
- Cover 和歌曲 List 均固定为 176 CSS px 高，浏览器实测高度差为 0。
- 歌曲文件继续使用带分隔线的紧凑 List，去除黑底 lime 图标后视觉重心回到文件名和技术信息。
- 下方元数据表单位置保持不变，没有扩大本轮修改范围。

## Focused region comparison evidence

- 在 1280 × 720 常规视口中，Cover 与 List 均为 350 × 176 CSS px；在 760 × 300 短视口中两者仍同为 176px 高。
- 常规桌面截图中，封面与右侧两行歌曲 List 的视觉重量更接近；歌曲信息不再被图标抢夺注意力。
- 悬停操作仍位于封面内部，尺寸修正没有破坏替换、删除和触控端可达性。
- 最新实现中封面图片已完成加载，原始尺寸为 500 × 500 px；默认状态下不再渲染悬停说明，鼠标移入时替换和删除操作正常显示。
- 最新悬停状态中，按钮组中心与 Cover 中心均为 `(455, 273)` CSS px；封面图片从非悬停的 `filter: none` 过渡到悬停的 `blur(2px)`，按钮层保持清晰。
- 严格悬停状态中，默认按钮层 opacity 为 0、pointer-events 为 none；悬停时分别切换为 1 和 auto。两个按钮均为 10px 圆角、约 78 × 28px 的圆角矩形。
- 删除按钮现在使用实心红色背景和白色图标、文字；浏览器实测背景为 red-600、前景为纯白，尺寸与 10px 圆角保持不变。
- Cover 重新划分为外层裁切、图片视口、交互遮罩和内描边四个层级；悬停时只有图片视口执行 1.03 倍缩放与 2px 模糊，外层使用 12px clip-path 强制裁切，因此四个角不会出现方形滤镜边界。

## Required fidelity surfaces

- Fonts and typography: 延续现有字体、字号、字重和行高；移除图标后文件标签、文件名和技术信息的层级更清晰。
- Spacing and layout rhythm: 双栏等宽，Cover 与 List 统一使用 176px 高度；List 两行使用等高网格，保留一致的行内边距和分隔线。
- Colors and visual tokens: 删除高对比度黑底 lime 文件图标，保留 zinc 中性色和 destructive 删除语义色。
- Image quality and asset fidelity: 当前封面通过 `object-cover` 横向裁切，没有拉伸；缺省封面继续使用真实的 800 × 800 PNG 资产。
- Copy and content: 文件名、格式、时长、大小、码率、采样率和声道信息全部保留，没有因视觉降噪丢失内容。

## Findings

- 没有剩余的 P0、P1 或 P2 问题。
- 没有遗留的 P3 视觉问题。

## Interaction and runtime checks

- 已测试常规桌面视口、760 × 300 短视口、封面悬停状态和 390px 移动端布局；三种状态下 Cover 与 List 高度差均为 0。
- 针对最新回归又测试了 1280 × 720 和 1100 × 600：Cover 与 List 在两种状态下均为 350 × 176 CSS px，图片 `complete` 为 true，natural size 为 500 × 500，说明文案不在 DOM 中。
- 未点击“保存修改”，现有歌曲和封面数据未改变。
- ESLint、TypeScript 与生产构建检查通过；浏览器控制台无错误。

## Comparison history

- Pass 1: 常规视口下完成等宽双栏、悬停操作和音频 List；当时未覆盖极短视口。
- Pass 2 finding: 用户截图暴露 P1 封面比例失真，以及 P2 文件图标视觉权重过高。
- Pass 2 fix: 封面容器改为最大 288px、`aspect-square`、`shrink-0`；歌曲 List 完全移除图标。
- Pass 2 evidence: 短视口实测封面 288 × 288、ratio 1；并排比较确认 List 已降噪。
- Pass 3 finding: 用户要求 Cover 不再保持正方形，而是与右侧 List 高度严格一致。
- Pass 3 fix: Cover 与 List 统一为 176px；List 使用两行等高网格，图片继续使用 `object-cover`。
- Pass 3 evidence: 常规视口实测两侧均为 350 × 176，短视口高度也均为 176，height difference 为 0。
- Pass 4 finding: 用户截图暴露 P1 封面容器在当前窗口状态下塌缩，以及 P2 默认悬停说明造成冗余。
- Pass 4 fix: Cover 与 List 共享显式 `11rem` 高度约束，避免绝对定位图片失去父级高度；默认说明完全移除，仅在待替换或待删除时显示状态反馈。
- Pass 4 evidence: 最新常规与短窗口实测两侧均为 350 × 176；封面原图 500 × 500 已完成加载，默认说明不存在，悬停按钮可见，控制台无错误。并排比较图确认封面区域恢复且右侧 List 未发生布局漂移。
- Pass 5 finding: 用户截图暴露 P2 封面操作按钮垂直位置偏上，且图片与操作层之间缺少悬停层级反馈。
- Pass 5 fix: 操作层改为水平、垂直双向居中；仅在鼠标悬停时为封面图片添加 2px 模糊和轻度黑色遮罩，键盘焦点继续显示操作按钮但不会误触发图片模糊。
- Pass 5 evidence: 浏览器实测按钮组与 Cover 中心坐标完全一致；非悬停滤镜为 `none`，悬停滤镜为 `blur(2px)`。并排比较确认按钮位置居中，文字与图标未被模糊。
- Pass 6 finding: 用户截图暴露 P2 自动聚焦仍会在鼠标未悬停时显示操作层，按钮外形也未被明确约束为圆角矩形。
- Pass 6 fix: 移除操作层的 `focus-within` 显示条件，默认使用不可交互的透明状态，只允许 `group-hover` 显示；两个按钮统一使用 10px 圆角和水平内边距。
- Pass 6 evidence: 默认状态实测封面滤镜为 `none`、操作层 opacity 为 0 且 pointer-events 为 none；悬停状态实测滤镜为 `blur(2px)`、操作层 opacity 为 1 且 pointer-events 为 auto，按钮组仍与 Cover 中心完全重合。
- Pass 7 finding: 用户确认 P2 删除按钮在橙红色封面上对比度不足，半透明红底和红色文字容易融入图片。
- Pass 7 fix: 删除操作改为实心 red-600 背景、白色图标与文字、轻阴影；悬停时加深为 red-700，并保留清晰的焦点环。
- Pass 7 evidence: 浏览器实测删除按钮背景为 red-600、文字为 `rgb(255, 255, 255)`，按钮仍为约 78 × 28px、10px 圆角；并排比较确认其与封面色彩分离，危险操作识别更明确。
- Pass 8 finding: 用户截图暴露 P1 悬停模糊层在 Safari 中越过圆角边界，四角呈现方形；Cover 的图片、遮罩和裁切职责混在同一层。
- Pass 8 fix: 重构 Cover 内部布局，外层专职 `overflow-hidden`、圆角和 `clip-path` 裁切；图片放入独立的圆角视口并在悬停时轻微放大后模糊；操作层与内描边分别独立，按钮放入居中的半透明操作托盘。
- Pass 8 evidence: 浏览器实测外层 border-radius 为 14px、clip-path 为 `inset(0 round 12px)`、overflow 为 hidden；图片悬停 scale 为 1.03、blur 为 2px，内部视口与遮罩均继承 14px 圆角。Cover 和 List 仍同为 350 × 176，聚焦比较图确认四角保持圆润且没有白边或方形滤镜边界。

final result: passed
