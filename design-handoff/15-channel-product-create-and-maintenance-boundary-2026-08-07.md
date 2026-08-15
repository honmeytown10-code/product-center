# 渠道商品创建与联合维护边界（2026-08-07）

> 后续修正：本文件中的“维护主档与渠道”联合编辑方案已被 `16-channel-product-separate-edit-actions-2026-08-07.md` 替代。

## 已确认问题

- 渠道商品库“新建商品”下拉中的套餐商品入口被父容器裁切，并非业务能力缺失。
- 开启“同时创建主档与渠道商品”后仍需要“选择已有主档”，用于避免重复建主档以及补建仅有主档、尚无渠道商品的数据。
- “维护资料”会让用户无法判断修改的是主档还是渠道商品，必须显式区分。

## 原型决策

1. 新建菜单完整展示“新建标准商品”“新建套餐商品”，分别进入原有类型类目选择。
2. 两种协作模式均保留“选择已有主档”；已存在当前商品库渠道商品的主档不重复创建。
3. 行操作拆为“维护渠道资料”和“维护主档与渠道”。原型默认具备双重权限；正式产品按主档权限、商品库范围、渠道编辑权限控制。
4. 联合维护页分别展示“主档商品名称”和“当前渠道商品名称”。渠道名称默认跟随主档，可独立设置或恢复跟随。
5. 主档改名只同步仍跟随主档的渠道名称；独立渠道名称不变。渠道改名不回写主档。
6. 规格、做法、加料的结构归主档；渠道只维护启用子集及价格、库存、加价等销售值。
7. 主档结构变化需要影响分析和渠道确认任务，不能在渠道表单静默改写结构。

## 已修改原型

- `components/web/WebChannelProductLibrary.tsx`
- `components/WebAdmin.tsx`
- `components/web/WebProductForm.tsx`

## 已同步文档与设计技能

- `docs/plans/全渠道商品管理_稳定菜单_联合创建与商品库权限补充方案.md`
- `docs/需求文档/全渠道商品管理/P09-渠道商品库联合创建与权限控制.md`
- `.agents/skills/product-center-next-design/references/product-model.md`
- `.agents/skills/product-center-next-design/references/information-architecture.md`
- `.agents/skills/product-center-next-design/references/workflow-and-states.md`
- `.agents/skills/product-center-next-design/references/approved-ui-and-workflow.md`

## 校验

- `npm.cmd run build`：通过。
