# 商品中心实现规则

## 生产 Vue 页面

- 使用 Vue 2.7 和目标仓库既有 Options API 风格。
- 组件标签使用 kebab-case。
- 路由放在目标子应用 `src/router`，不在基座复制子应用路由。
- API 放在目标仓库 `src/api/` 并复用已有 request 封装，不在视图散落 URL。
- 文案进入目标仓库国际化资源。
- 从目标应用现有 Store 读取品牌、门店、角色、主题和权限上下文。
- 复用同目录 `activated`、KeepAlive、分页恢复和缓存策略。
- 在销毁阶段清理监听器、定时器、图表和观察器。

## 组件文档与接口

实现前必须：

1. 搜索目标目录的相似页面和私有组件。
2. 对 `vue-kylin`、`qm-form`、`qmai-ui` 查询当前组件文档。
3. 阅读目标 `src/api/` 中最相似的请求函数。
4. 确认分页字段、时间单位、金额精度、空值和错误结构。
5. 确认页面、按钮和敏感字段权限。

若组件文档服务不可用，停止编造 API；保留清晰的待接入标记，并以同仓库已验证用法为唯一降级依据。

## React/HTML 高保真原型

当前仓库的 React + Tailwind 页面用于验证信息架构和交互，不代表生产组件 API。

- 复用 `components/web` 中同类页面和弹窗模式。
- 原型的控件必须可操作，不能只画静态外观。
- 在方案或代码注释中说明生产组件映射。
- 原型可暂用本地数据，但必须覆盖加载、空、失败、权限和提交状态。
- 生产迁移时将硬编码颜色替换为主题变量，将本地状态替换为真实 API、权限和国际化。

## 推荐页面契约

所有商品中心 Web 页面实现前均使用以下通用结构；只填当前业务需要的字段，不把示例固定成价格体系：

```yaml
page:
  productArea: 商品档案 | 配方管理 | 商品运营 | 门店商品 | 平台商品管理 | 商品设置
  domain: 当前业务对象
  route: /goodsCenter/**
  type: list | config | form | detail | selector | dialog | log
  primaryTask: 当前页面唯一主任务
  accountView: 集团 | 品牌 | 门店
  globalScope:
    organization: required | optional | hidden
    store: optional
    channel: optional
  objects: [SPU, SKU, 分类, 属性, 配料, 配方, 模板, 平台商品]
  filters: []
  primaryAction: null
  secondaryActions: []
  rowActions: []
  states: [loading, success, firstEmpty, filteredEmpty, error, noPermission, partialPermission, submitting]
  risks: []
  referencePages: []
```

选择参考页时按“同业务对象 → 同页面类型 → 同组件技术栈”排序，不因提供了某个历史链接就复制该页面的专属结构。价格体系的策略卡片、商品管理的分类树表、同步页的任务步骤均为各自场景模式，不是全域模板。

## 权限与敏感信息

- 复用现有 `v-permission`、权限工具或 Store Getter。
- 无权限时遵循同模块的隐藏/禁用策略，不在新页面自行混用。
- 成本价、内部价、会员价、门店范围和批量下发可有独立字段权限。
- 即使按钮隐藏，也要检查敏感字段、导出内容和接口参数是否越权。

## 提交与反馈

- 查询变化后回到第一页。
- 保存、提交、同步防重复触发。
- 删除、禁用、覆盖、作废、取消沽清的确认文案包含对象名称、范围和后果。
- 批量和异步任务提供总数、成功数、失败数、失败原因及重试/导出入口。
- 错误信息给出下一步，不只展示“操作失败”。

## 验证顺序

1. 静态检查：类型、lint、组件 API、主题变量、国际化。
2. 功能检查：查询、重置、分页、选择、保存、取消、权限。
3. 状态检查：加载、四类空状态、失败、部分成功。
4. 视觉检查：1440px、横向滚动、长文案、弹窗高度、固定操作区。
5. 业务检查：SPU/SKU、门店/渠道、价格/库存口径和危险操作。
