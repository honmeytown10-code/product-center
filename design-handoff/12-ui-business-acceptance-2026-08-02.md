# 商品中心 PC 后台 UI / 交互与业务逻辑验收

验收日期：2026-08-02  
验收视口：1898 × 1046（Chrome）  
验收范围：分渠道协作、统一商品维护、13 个主菜单、4 个销售规则子页、关键创建/抽屉/策略切换流程。

## 1. 本轮验收结论

- P0 阻断问题：0。
- 已修复 P1/P2：工作台首次自动打开抽屉、默认勾选任务、操作列未冻结；商品模板与销售规则混为同一组页签；发布中心宽屏未铺满；核心样式依赖在线 Tailwind CDN。
- 13 个分渠道模式主菜单均可进入，统一模式菜单按策略正确收敛；页面无全局横向溢出，当前巡检未捕获运行时控制台错误。
- UI / 交互原型已形成较完整的页面覆盖，但不能标记为“全部业务逻辑已完成”。开放接口、任务路由、价格明细等仍存在生产业务缺口，见第 4 节。

## 2. 验收步骤与健康度

1. **商品工作台初始状态 — 健康**  
   初始详情抽屉 0 个、默认勾选 0 项；筛选和批量按钮保持可理解的禁用态。证据：[01-workbench-initial.png](audit/current/01-workbench-initial.png)。
2. **工作台详情抽屉 — 健康**  
   点击“去处理”后抽屉覆盖展示；内容区打开前后宽度均为 1682px，没有挤压列表。证据：[02-workbench-drawer.png](audit/current/02-workbench-drawer.png)。
3. **工作台操作列 — 健康**  
   表头操作列计算样式为 `position: sticky; right: 0px`；横向滚动前后右边界都贴合列表容器右边界 1877px。
4. **商品主档与创建入口 — 健康**  
   分渠道模式使用后台分类；新建仍区分标准商品/套餐商品，并先选择各自类目。证据：[03-product-master.png](audit/current/03-product-master.png)、[16-product-master-create.png](audit/current/16-product-master-create.png)。
5. **分类、属性、配方与营养 — 健康（生产接口待接）**  
   主页面骨架、子页签、行操作与关键确认均可达。证据：[04-category-attribute.png](audit/current/04-category-attribute.png)、[05-recipe-nutrition.png](audit/current/05-recipe-nutrition.png)。
6. **渠道商品与渠道分类属性 — 健康**  
   仅在分渠道协作显示；渠道商品使用前台分类筛选，并按渠道商品库切换。证据：[06-channel-product.png](audit/current/06-channel-product.png)、[07-channel-category-attribute.png](audit/current/07-channel-category-attribute.png)。
7. **商品模板 — 健康**  
   现在是独立页面，只承担模板分组、商品来源、适用渠道、范围和启停等职责；创建弹窗按全渠道策略自动计算来源。证据：[08-product-template.png](audit/current/08-product-template.png)、[17-template-create.png](audit/current/17-template-create.png)。
8. **销售规则 — 健康（价格明细有缺口）**  
   独立保留“售卖范围、价格策略、属性互斥、必选商品”四个子页，不再与商品模板共用页面。证据：[18-sales-scope.png](audit/current/18-sales-scope.png)、[19-price-strategy.png](audit/current/19-price-strategy.png)、[20-attribute-mutex.png](audit/current/20-attribute-mutex.png)、[21-required-product.png](audit/current/21-required-product.png)。
9. **推荐、发布、映射、差异治理 — 健康（外部平台接口待接）**  
   页面可达、操作有反馈或明确禁用；发布中心已修复宽屏未铺满。证据：[10-recommendation.png](audit/current/10-recommendation.png)、[11-publish-center.png](audit/current/11-publish-center.png)、[12-mapping.png](audit/current/12-mapping.png)、[13-difference.png](audit/current/13-difference.png)。
10. **门店商品与子页 — 健康（演示图片依赖外网）**  
    门店商品、门店分类、门店属性、门店区域入口完整；门店高频经营操作集中在门店商品域。证据：[14-store-product.png](audit/current/14-store-product.png)。
11. **商品设置与策略切换 — 健康**  
    全渠道策略只保留在商品设置内；切换策略有影响确认。证据：[15-settings.png](audit/current/15-settings.png)、[22-omnichannel-strategy.png](audit/current/22-omnichannel-strategy.png)、[23-unified-impact-confirm.png](audit/current/23-unified-impact-confirm.png)。
12. **统一商品维护模式 — 健康**  
    保存后菜单显示“商品管理”，隐藏“渠道商品/渠道分类与属性”；列表同时提供前台分类和后台分类。证据：[24-unified-product-management.png](audit/current/24-unified-product-management.png)。

自动化原始结果：[audit.json](audit/current/audit.json)。

## 3. 本轮已修复内容

1. 工作台 `selected` 初始值改为空数组，`drawerTask` 初始值改为 `null`。
2. 工作台操作列表头和单元格使用右侧粘性定位，并补充分隔线、背景和阴影。
3. 商品模板不再进入“商品销售方案”页签组；销售规则改为独立四子页。
4. 发布中心根容器加入 `min-w-0 flex-1`，宽屏完整利用内容区。
5. Tailwind 从运行时 CDN 改为本地 PostCSS 构建；同时移除无必要的 CDN importmap，避免受限网络下整站无样式。

## 4. 尚未闭环的业务逻辑问题

### P1：需在生产开发前确认或补齐

1. **工作台任务机制仍是原型数据。** 任务生成条件、负责人职责路由、SLA、升级提醒、转交权限和处理结果回写尚未接入。推荐保持“系统内置领域任务 + 可配置职责路由”，但配置字段不能在未确认前自行增加。
2. **开放接口模块未实现。** 设计基线要求按客户能力/权限提供应用管理、凭证与 Webhook、调用记录与文档；当前代码既没有能力开关，也没有原业务字段。为遵守字段冻结规则，本轮没有凭空创建字段或默认菜单，需要产品/旧系统业务定义后单独补齐。
3. **价格策略缺少商品价格明细编辑器。** 当前可以维护策略、门店、渠道和时间，但“价格管理”中的具体商品价格仍明确禁用，无法形成完整价格发布快照。
4. **大部分页面仍为前端原型状态。** 列表、权限、分页、导入、异步任务、部分成功、并发冲突和审计记录尚未接真实服务；当前验收证明的是 UI/交互闭环，不等同于生产业务闭环。

### P2：需要产品规则或工程化收口

1. **平台维护渠道与模板的边界已确认。** 商品模板允许选择平台维护的三方渠道；只要启用了企迈接单或上下架/库存能力，就从该渠道所属商品库读取公共经营资料，生成并下发企迈侧门店渠道商品，但不维护、不发布该平台的专属商品字段。企迈侧商品下发后，按企迈 SKU ID、商家商品标识或人工方式建立映射，以支撑接单识别、上下架和库存等经营能力。此类渠道不得从模板适用渠道中排除。
2. **差异巡检的菜单与任务应由渠道策略派生。** 当前菜单和工作台差异任务是稳定展示；当不存在任何“企迈管理”的三方渠道时，理论上应隐藏或给出不适用态，不能继续生成平台资料差异任务。
3. **全渠道策略页的未保存离开拦截只覆盖页内返回。** 直接点击左侧其他菜单会卸载页面并绕过拦截，生产路由需要统一导航守卫。
4. **演示商品图片依赖 Unsplash 等外部地址。** 受限网络下会显示空白或破图；生产应使用素材服务或随环境提供稳定的本地测试资源。

## 5. 验收边界

- 截图与 DOM 检查不能证明真实 ACL、接口幂等、数据权限、平台授权、并发写入或异步重试正确。
- 本次未改变商品、类目、主档、渠道商品和全渠道配置的业务字段；发现字段或对象边界问题时只记录，没有擅自重构数据模型。
- 构建必须继续作为每轮回归门槛；关键流程建议保留本次 Chrome 自动验收脚本做后续回归。
