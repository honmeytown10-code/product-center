# 商品中心 UI / 交互优化 Skill 清单

## 工作树内领域 Skill

| Skill | 位置 | 用途 |
| --- | --- | --- |
| `product-center-next-design` | `.agents/skills/product-center-next-design/` | 产品结构、菜单、对象边界、跨页面流程与全量页面工作树 |
| `product-center-console-design` | `.agents/skills/product-center-console-design/` | Console 2.0 页面骨架、视觉密度、组件、状态、实现与验收 |

两套领域 Skill 已复制到当前工作树，后续以工作树内版本为准。

## Codex 全局外部 Skill

这些 Skill 由 Codex 插件或全局 Skill 目录管理，不复制进项目，以免版本漂移或破坏插件更新。

| Skill | 当前版本/位置 | 本任务使用场景 |
| --- | --- | --- |
| `product-design:index` | Product Design `0.1.52` | 用户明确调用 Product Design，或需要选择其审计、探索、实现流程时 |
| `product-design:audit` | Product Design `0.1.52` | 对已运行页面截图后做 UX、视觉与可访问性评审 |
| `product-design:ideate` | Product Design `0.1.52` | 需要多套视觉方向或图片化设计探索时 |
| `product-design:image-to-code` | Product Design `0.1.52` | 将已选截图或视觉稿忠实实现为前端页面时 |
| `product-design:url-to-code` | Product Design `0.1.52` | 需要从指定 URL 复刻前端体验时 |
| `frontend-design` | `C:\Users\镇\.codex\skills\frontend-design` | 提升视觉方向、层级、排版和辨识度；不得覆盖商品中心业务事实与 Console 规范 |
| `browser:control-in-app-browser` | Browser `26.715.31925` | 打开、操作、截图和验证 localhost 原型 |
| `imagegen` | Codex System Skill | 需要生成位图视觉探索或编辑图片时；代码原生后台页面通常不优先使用 |

## 调用顺序

商品中心页面默认按以下顺序工作：

1. `AGENTS.md` 与 `design-handoff/04-conversation-ui-baseline.md`。
2. `product-center-next-design`：确认菜单、对象、职责与跨页面流程。
3. `product-center-console-design`：确认页面骨架、字段、按钮、弹窗、状态和验收。
4. 当前工作树真实代码：字段、类目、枚举、默认值和校验的最高事实来源。
5. Product Design / `frontend-design`：只补充视觉探索、审计和忠实实现，不改业务字段。
6. Browser：运行后做交互与视觉验证。

## 持久化说明

- 工作树内领域 Skill 和设计上下文不依赖对话长度。
- 外部 Skill 安装在 Codex 全局目录，切换本仓库工作树仍可读取。
- 外部插件升级后路径版本可能变化，因此每次触发时必须从 Skill 目录重新读取 `SKILL.md`，不能依赖旧对话记忆。
- 若迁移到另一台机器，需要重新安装全局外部插件；工作树内两套领域 Skill 会随项目文件保留。

