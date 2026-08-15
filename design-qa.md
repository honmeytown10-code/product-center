# Claude Design 风格改造验收

## 验收范围

- 商品工作台：`components/web/WebProductWorkbench.tsx`
- 全渠道商品管理策略：`components/web/WebOmnichannelSettings.tsx`
- 本轮未改造其他菜单页面。

## 视觉基准与环境

- 视觉真源：`C:/Users/镇/Downloads/商品中台项目工作树/全渠道商品管理-PC后台原型.dc.html`
- 验收视口：1440 × 900，deviceScaleFactor 1
- 实现预览：`http://127.0.0.1:5183/`
- 工作台参考图：`design-handoff/audit/claude-reference-2026-08-02/01-workbench-reference.png`
- 策略页参考图：`design-handoff/audit/claude-reference-2026-08-02/02-strategy-reference.png`
- 工作台实现图：`design-handoff/audit/claude-style-current-2026-08-02/01-workbench.png`
- 策略页实现图：`design-handoff/audit/claude-style-current-2026-08-02/03-strategy-top.png`
- 策略页下半区：`design-handoff/audit/claude-style-current-2026-08-02/04-strategy-lower.png`

## 同视口对照证据

- 工作台并排图：`design-handoff/audit/claude-style-current-2026-08-02/compare-workbench-reference-current.png`
- 策略页并排图：`design-handoff/audit/claude-style-current-2026-08-02/compare-strategy-reference-current.png`
- 两组输入均为 1440 × 900，无缩放差异。
- 参考稿的核心视觉语言已对齐：浅灰页面底、细边框白卡、8px 圆角、19px 紧凑标题、低饱和状态色、单屏高信息密度和弱装饰层级。

## 差异判断

- 工作台右栏采用 380px，而不是逐像素复制参考稿更宽的右栏；这是为了保留现有任务明细表的首屏可用宽度，属于产品约束下的轻微差异（P3）。
- 工作台保留了参考稿没有展示的任务明细、批量处理、抽屉和流程弹窗；视觉层级沿用参考稿，但没有删减既有业务能力。
- 策略页的渠道名称、企迈参与能力和门店绑定状态按当前业务规则展示，不照抄参考稿示例数据；其中平台维护但使用企迈接单或上下架/库存的渠道仍需进入渠道商品库并建立映射。
- 未发现需要继续修复的 P0、P1 或 P2 视觉问题。

## 交互与运行检查

- 工作台进入时抽屉数为 0；点击“去处理”后抽屉正常打开，页面内容未被挤压。
- 工作台任务筛选、任务聚合入口、批量操作区和冻结操作列保留。
- 商品设置可进入全渠道商品管理策略页；上半区、下半区滚动状态均完成截图。
- 策略页三段式流程、管理方切换、企迈能力选择、协作模式选择、商品库编辑与渠道归属选择均保留。
- 两页均无横向溢出。
- 截图过程控制台错误：0。
- `npm.cmd run build`：通过。

## 对照历史

1. 初次实现后完成 1440 × 900 截图，确认页面结构与参考稿一致。
2. 并排对照后将工作台右栏由 340px 调整为 380px，使运行卡片与最近动态更接近参考稿比例。
3. 重新截图并复查工作台、抽屉、策略页上半区和下半区，未发现 P0/P1/P2 问题。

## 最终结果

passed

## 2026-08-02 菜单收口复验

- “差异巡检”已从“发布与治理”左侧菜单隐藏，工作台原“差异待处理”已合并为映射异常任务；历史页面与路由未删除。
- “商品模板”已从左侧菜单移除，并入“销售规则”页内，顺序为：门店售卖规则、商品模板、价格策略、属性互斥、必选商品。
- 验收截图：`design-handoff/audit/menu-consolidation-2026-08-02/sales-rules-template-tab.png`
- 自动检查：两个独立菜单均不可见；销售规则可进入；商品模板页签及页面可进入；1440 × 900 无横向溢出；控制台错误 0。
- `npm.cmd run build`：通过。

## 2026-08-02 工作台去重复验

- 已移除“待处理事项”下方重复的任务筛选与明细表，不再重复展示同一批待完善任务。
- 聚合事项、发布异常/未映射指标、已指派和审批中入口均直接打开对应任务详情抽屉。
- 待处理分类数量由实际聚合项动态计算，当前为 4 类、共 9 项。
- 验收截图：`design-handoff/audit/workbench-no-duplicate-2026-08-02/01-workbench.png`、`design-handoff/audit/menu-consolidation-2026-08-02/workbench-summary-drawer.png`。
- 自动检查：重复任务表不可见；聚合事项可打开抽屉；无横向溢出；控制台错误 0。

## 2026-08-06 稳定菜单、联合创建与权限方案验收

- 统一管理与分渠道协作均显示商品主档、渠道商品、渠道分类与属性；切换并保存统一管理后菜单结构不变化。
- 统一管理渠道商品页只展示品牌默认商品库，并可按品牌策略显示“新建商品”。
- 新建商品菜单只提供标准商品、套餐商品；标准商品仍进入原“选择商品类目”流程。
- 联合创建表单标题和章节明确区分主档基础/结构与渠道展示/售卖/补充/专属属性。
- 权限规则已写入补充产品方案、P09 需求和设计基线；原型按全部商品库权限模拟，不新增虚假权限配置页。
- 自动检查结果：稳定菜单、策略配置、统一默认商品库、新建入口、类目选择和联合表单全部通过；1440 × 900 无横向溢出；控制台错误 0。
- 截图：`design-handoff/audit/stable-menu-combined-create-2026-08-06/01-unified-channel-catalog.png`、`design-handoff/audit/stable-menu-combined-create-2026-08-06/02-combined-create-form.png`。
- `npm.cmd run build`：通过。`npx.cmd tsc --noEmit` 仍有工作树既存的移动端与旧 Web 原型类型错误，本轮未新增可归因错误；Vite 构建与本轮浏览器链路均通过。
