# 全渠道商品管理策略 — 交互与状态规格

> 逐控件、逐状态、逐转移的精确规格。配合 `01-context-brief.md`（业务模型）与 `02-current-ui-snapshot.html`（视觉基线）使用。
> 本文描述的是**现状实现**。重设计可以改变这些交互，但必须先理解它们各自在守护什么业务约束。

---

## 1. 数据模型

```ts
type ThirdPartyChannelId =
  | 'meituan' | 'taobao' | 'jingdong'
  | 'douyin' | 'meituan_dine' | 'meituan_pinhaofan';

type PrivateChannelId = 'pos' | 'mini_program_dine_in' | 'mini_program_delivery';

type OmnichannelChannelId = PrivateChannelId | ThirdPartyChannelId;

type ThirdPartyManagementMode   = 'qimai' | 'platform';
type OmnichannelCollaborationMode = 'unified' | 'channel_division';
type QimaiChannelCapability     = 'order_receiving' | 'product_operations';

interface OmnichannelChannelGroup {
  id: string;
  name: string;
  channels: OmnichannelChannelId[];
}

interface OmnichannelBrandConfig {
  enabled: boolean;
  collaborationMode: OmnichannelCollaborationMode;
  thirdPartyStrategies: Record<ThirdPartyChannelId, ThirdPartyManagementMode>;
  channelConnections:  Record<ThirdPartyChannelId, { capabilities: QimaiChannelCapability[] }>;
  channelGroups: OmnichannelChannelGroup[];
}
```

### 派生值（不存储，实时计算）

| 派生值 | 计算规则 | 用途 |
|---|---|---|
| `managedChannels` | 全部 private 渠道 + `thirdPartyStrategies[id] === 'qimai'` 的三方渠道 | 分组弹窗里可分配的渠道全集 |
| `assignedChannelIds` | 所有分组 `channels` 的并集 | 判断哪些渠道已分组 |
| `unassignedChannels` | `managedChannels` 中不在 `assignedChannelIds` 里的 | 阻止保存 / 橙色警示 |
| `requiresAuth(channel)` | `strategy === 'qimai'` **或** `capabilities.length > 0` | 「门店连接要求」badge |

> `requiresAuth` 是纯派生的，界面上**不可直接编辑**，但当前视觉没有把它和可编辑控件区分开。

---

## 2. 编辑与提交模型

- 页面加载时把持久化配置拷贝进本地 `draft`。
- **所有编辑只改 `draft`，不落库。**
- 分组弹窗内的新增 / 编辑 / 删除同样只改 `draft`；关闭弹窗不丢失改动。
- 只有点击 Header 的「保存策略」才写入。
- **没有离开页面时的未保存提醒**，点返回箭头会静默丢弃全部改动。← 现状缺陷

---

## 3. 控件规格

### 3.1 组织协作方式（两张 radio 卡片）

| 属性 | 值 |
|---|---|
| 控件类型 | 二选一，互斥，必选，无空值 |
| 选中反馈 | 边框 `#00B460` + 底色 `#F2FFF8` + radio 圆点填充 |
| 禁用态 | 无 |
| 切换代价 | 无确认。切到 `unified` 时分组数据**保留在 draft 里但界面隐藏**；切回来还在 |

**转移**

```
unified ──点击「按渠道职责协作」──► channel_division
   └─ 展开分组摘要条；若有未分组渠道立刻显示橙色计数

channel_division ──点击「统一商品维护」──► unified
   └─ 分组摘要条整条消失；channelGroups 数据保留但不可见、不参与校验
```

### 3.2 分组摘要条（仅 `channel_division` 可见）

| 区域 | 内容 | 空/异常表现 |
|---|---|---|
| 主文案 | `当前共 {N} 个渠道商品库` | N 可以为 0 |
| 次文案 | 分组名以「、」拼接，单行截断 | 无分组时显示「尚未配置渠道商品库」 |
| 警示 | `另有 {M} 个渠道未分组`（`#D46B08`） | M = 0 时不渲染 |
| 操作 | 「管理渠道商品库分组 ›」→ 打开弹窗，同时清空 `feedback`、重置编辑态 | — |

### 3.3 三方渠道表 — 每行四列

**列 1 渠道名** — 静态文本。9 个渠道里只有 6 个三方渠道出现在这里；3 个自有渠道全页不可见。

**列 2 商品资料维护位置** — 两个并排 radio，必选：

```
选中 qimai：
  capabilities := ['order_receiving', 'product_operations']   // 强制两个全开
  channelGroups 不变（该渠道可被分配）

选中 platform：
  若原本是 qimai → capabilities := []                        // 清空
  若原本已是 platform → capabilities 保持不变                  // 幂等
  channelGroups：从所有分组的 channels 里移除该渠道             // 静默移除，无提示 ← 缺陷
```

**列 3 企迈参与能力** — 形态随列 2 切换：

| 列 2 = | 列 3 渲染 | 可交互 |
|---|---|---|
| `qimai` | 两个绿色标签：`企迈接单`、`商品发布、上下架与库存` | ❌ 只读。点击被 `if (strategy === 'qimai') return` 拦截 |
| `platform` | 两个 checkbox：`企迈接单`、`上下架/库存` | ✅ 各自独立开关 |
| `platform` 且 0 勾选 | 两个 checkbox **加上**灰字「企迈不参与」 | ✅ |

> ⚠️ 只读绿标签与可勾选 checkbox 在同一列同一位置交替出现，形态相近但可点性相反。这是现状最容易误导用户的地方。
> ⚠️ 「企迈不参与」是追加在两个 checkbox 之后的第三个元素，不是替代它们，容易被读成第三个选项。

**列 4 门店连接要求** — 纯派生 badge：

| 条件 | 渲染 |
|---|---|
| `requiresAuth === true` | 橙色 badge「需门店绑定」 |
| `requiresAuth === false` | 灰色 badge「无需绑定」 |

无跳转、无 tooltip，不解释「去哪儿绑定」——绑定入口在 section 头部右上角一个远离此列的外链按钮上。

### 3.4 外链「前往门店绑定」

`window.open('https://console.qmai.co/commonCenter/takeaway/binding', '_blank')`
离开商品中心进入另一个系统，**不带任何渠道上下文参数**，用户到了那边要自己再找一遍渠道。

---

## 4. 分组弹窗规格

尺寸 `920 × 720px`，`max-height: calc(100vh - 48px)`，遮罩 `rgba(29,33,41,.55)`，居中。

### 4.1 左栏（330px）

- 顶部绿色主按钮「+ 新增渠道商品库」→ 进入新增编辑态（`id` = `channel-group-${Date.now()}`，`name` = 空，`channels` = []）
- 分组卡片列表，当前编辑中的卡片边框变绿
- 每卡：名称（截断）、`{N} 个渠道`、编辑 ✎ / 删除 🗑 图标按钮、渠道简称灰色 chip 组
- **列表不可排序、不可拖拽、不可搜索**

### 4.2 右栏

**空态**（未选中任何分组）：居中图标 + 「选择左侧商品库进行编辑」+ 「也可以新增一个渠道商品库并分配渠道。」

**编辑态**：

| 字段 | 规格 |
|---|---|
| 标题 | 已存在于 `channelGroups` → 「编辑渠道商品库」；否则「新增渠道商品库」 |
| 商品库名称 | 必填（红星），单行输入，placeholder「如：外卖商品库」，保存时 `trim()`。**不校验重名**，**不限制长度** |
| 适用渠道 | 必填（红星），2 列 checkbox 卡片网格，来源 = `managedChannels`（随三方策略动态变化，本例 8 个） |
| 跨分组提示 | 若某渠道已属于**其他**分组，卡片右侧显示橙色「当前：{分组名}」（最宽 120px 截断，带 title） |
| 操作 | 「取消」（丢弃编辑，回空态）/ 「保存分组」（绿色主按钮） |

### 4.3 保存分组的写入语义 ⚠️

```
校验：name.trim() 非空 且 channels.length > 0
      → 否则设置 feedback = '渠道商品库名称和适用渠道不能为空。'
      → feedback 渲染在【页面顶部】，而弹窗此时正盖在上面，用户看不见 ← 严重缺陷

写入：把本次勾选的渠道从所有其他分组中【强制移除】，再写入当前分组
      → 这是一个抢占式操作，没有二次确认
      → 被抢走渠道的原分组可能因此变成 0 渠道，但不会被自动删除
```

### 4.4 删除分组

使用浏览器原生 `window.confirm`：
`删除"{名称}"后，其中渠道将变为未分组，确定删除吗？`

不符合设计规范（应使用统一确认弹窗组件），也没有说明这些渠道下已有的渠道商品资料会怎样。

### 4.5 底部条

| 条件 | 文案 |
|---|---|
| 有未分组渠道 | 橙色 `未分组：{渠道名以、拼接}` |
| 全部已分组 | 灰色 `全部企迈管理渠道均已分组` |

右侧「完成」按钮**只关闭弹窗**，不做校验、不落库。

---

## 5. 校验与反馈

现状只有 **一个** `feedback: string` 状态，渲染在页面顶部橙色条。

| 触发 | 文案 | 问题 |
|---|---|---|
| `channel_division` 下点保存但有未分组渠道 | `请先将{渠道名}加入渠道商品库分组。` | 不定位到具体控件；用户得自己打开弹窗找 |
| 分组名或适用渠道为空时点「保存分组」 | `渠道商品库名称和适用渠道不能为空。` | 渲染在弹窗**背后**，完全不可见 |

**没有任何字段级错误态**（输入框不会变红、checkbox 组不会标错）。

---

## 6. 状态矩阵 — 现状 vs 设计规范要求

设计基线要求每个数据页面至少设计 9 个状态。现状覆盖情况：

| 状态 | 现状 | 说明 |
|---|---|---|
| loading | ❌ 缺失 | 配置直接从 context 同步读取，无加载态 |
| success | ✅ | 正常渲染 |
| first-empty | ⚠️ 部分 | 分组弹窗右栏有空态；但「一个分组都没有」时左栏是纯空白，无引导 |
| filtered-empty | — | 本页无筛选，不适用 |
| error | ❌ 缺失 | 无接口失败态、无重试 |
| no-permission | ❌ 缺失 | 品牌级配置通常需要高权限，但无任何权限判断 |
| partial-permission | ❌ 缺失 | 未考虑「只能看不能改」的角色 |
| submitting | ❌ 缺失 | 保存按钮无 loading、无禁用，可重复点击 |
| partial-success | ❌ 缺失 | 保存是全量覆盖，无部分成功概念 |
| 保存成功 | ⚠️ 弱 | 仅按钮文案变「已保存」2.2 秒，无 Toast、不说明生效范围 |
| 未保存离开 | ❌ 缺失 | 点返回静默丢弃全部改动 |

---

## 7. 危险操作清单（改版必须妥善处理）

按影响面从大到小：

| # | 操作 | 实际影响 | 现状确认方式 |
|---|---|---|---|
| 1 | 切换 `collaborationMode` | 改变整个商品中心的商品编辑入口结构与分权模型 | **无** |
| 2 | 三方渠道 `qimai` → `platform` | 该渠道退出企迈发布链路；静默从所有分组移除；商品中心出现「商品映射」模块 | **无** |
| 3 | 保存分组时抢占其他分组的渠道 | 该渠道已有的渠道商品资料归属迁移 | 仅一行橙色小字提示 |
| 4 | 删除渠道商品库分组 | 组内渠道变为未分组，阻断保存 | 原生 `window.confirm` |
| 5 | 三方渠道 `platform` → `qimai` | 能力被强制设为全开，可能触发门店绑定要求 | **无** |
| 6 | 取消勾选某个企迈能力 | 可能使该渠道从「需门店绑定」变为「无需绑定」 | **无** |

设计基线明确要求：**修改影响历史商品或下游渠道时必须先解释影响范围，再允许保存。** 现状 6 条里有 4 条完全没有任何确认。

---

## 8. 未在界面暴露、但改版可以利用的业务数据

这些字段在代码里真实存在，会影响用户决策，但当前 UI 一个都没显示：

| 字段 | 含义 | 各渠道取值 |
|---|---|---|
| `platformProductScope` | 平台商品的作用域 | 抖音在线点、美团在线点 = `brand_and_store`（品牌级+门店级）；其余四个三方 = `store_only`（仅门店级） |
| `requiresBrandReview` | 是否需要品牌审核 | 仅抖音在线点 = `true` |
| `supportsServiceProviderBilling` | 是否支持服务商计费 | 美团外卖、淘宝闪购 = `true` |
| `type` | 渠道类别 | private（3 个，恒为企迈管理）/ third_party（6 个，可切换） |

---

## 9. 关联页面（跳转与依赖）

| 页面 | 关系 |
|---|---|
| 商品设置（`general_settings`） | 本页的父页面，返回箭头回到这里。同层还有「渠道商品常用字段设置」「渠道字段覆盖规则」 |
| 门店绑定中心（外部系统） | 外链跳出，维护门店级授权与计费 |
| 渠道商品库 | 由本页策略决定是否出现在左侧菜单 |
| 商品映射 | 有渠道设为 `platform`、或有 `platform` 渠道启用了企迈能力时才出现 |
| 商品模板下发 | 若模板覆盖渠道跨越多个商品库，会被拒绝：「所选渠道对应多个商品来源，请拆分为不同模板后分别下发。」 |
| 商品工作台 | 顶部按渠道商品库分 tab（全渠道总览 / 商品主档 / 堂食商品库 / 外卖商品库 / 在线点商品库），tab 结构直接来自本页的分组配置 |
