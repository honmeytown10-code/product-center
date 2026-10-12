/** P12/P13/P14 local prototype rules; never calls production platform APIs. */
import type { Product } from './types';
import type { PublishBatch } from './components/web/WebPublishRecords';

export type TakeoutChannel = 'meituan' | 'taobao' | 'jd';
export const isTakeoutChannel = (id: string): id is TakeoutChannel => ['meituan', 'taobao', 'jd'].includes(id);
export type TakeoutSnapshot = {
  specGroupCount: number;
  skus: Array<{ id: string; name: string; price: string; stock: string; maxStock: string; autoRestock: boolean; packagingFee: string; inventoryMode?: string; amount?: string; amountUnit?: string; weightKg?: string }>;
  methods: Array<{ id?: string; name: string; price: string; groupName?: string }>;
  addonCount: number;
  comboGroupCount: number;
  comboGroups?: Array<{ id: string; name: string; min: number; max?: number; items: Array<{ productId: string; skuId: string; quantity: number }> }>;
  addonItems?: Array<{ id: string; name: string; groupName: string; price: string }>;
};
export type TakeoutIssue = { field: string; message: string };
type Input = { name: string; type?: string; image?: string; formData?: Record<string, any>; takeoutPreflightErrors?: string[] };

/** Product-local options only; never resolves shared sales rules. Stable IDs avoid same-name collisions. */
export function getMeituanMutexOptions(snapshot?: TakeoutSnapshot) {
  return [
    ...(snapshot?.methods || []).map(item => ({ id: `method:${item.id || JSON.stringify([item.groupName, item.name])}`, label: `${item.groupName || '做法'} · ${item.name}` })),
    ...(snapshot?.addonItems || []).map(item => ({ id: `addon:${item.id}`, label: `${item.groupName || '加料'} · ${item.name}` })),
  ];
}

export function checkMeituanMutexPairs(pairs: unknown, snapshot?: TakeoutSnapshot): string | null {
  if (!Array.isArray(pairs) || !pairs.length) return '请为当前商品添加至少一组互斥属性。';
  const optionIds = new Set(getMeituanMutexOptions(snapshot).map(item => item.id));
  const seen = new Set<string>();
  for (const encoded of pairs) {
    let pair: unknown;
    try { pair = JSON.parse(encoded); } catch { return '请重新选择互斥属性。'; }
    if (!Array.isArray(pair) || pair.length !== 2 || pair.some(id => typeof id !== 'string' || !id)) return '每组请选择两个互斥属性。';
    if (pair[0] === pair[1]) return '同一属性不能与自身互斥。';
    if (pair.some(id => !optionIds.has(id))) return '互斥属性已停用或移除，请重新选择。';
    const key = JSON.stringify([...pair].sort());
    if (seen.has(key)) return '存在重复互斥组合，请移除重复项。';
    seen.add(key);
  }
  return null;
}

export function checkTakeoutProduct(product: Input, channel: TakeoutChannel): TakeoutIssue[] {
  const data = product.formData || {};
  const snapshot = data.takeoutSnapshot as TakeoutSnapshot | undefined;
  const fields = data.channelSpecificValues?.[channel] || {};
  const issues: TakeoutIssue[] = [];
  const combo = product.type === 'combo' || product.type === '套餐商品' || product.type === 'Combo';
  const add = (field: string, message: string) => issues.push({ field, message });
  if (!snapshot || !snapshot.skus.length) add('商品结构', '尚未取得完整 SKU、做法和加料资料，请先在对应商品库或门店编辑页确认并保存，不能按不完整数据同步。');
  if (!String(fields.category || '').trim()) add('商品类目', '请选择平台商品类目；前台分类不能替代平台类目。');
  if (!product.image && !data.p_img) add('商品图片', '请在展示设置中上传商品主图。');
  if (channel === 'meituan') {
    if (!combo && fields.attributeMutex) {
      const mutexError = checkMeituanMutexPairs(fields.attributeMutexPairs, snapshot);
      if (mutexError) add('属性互斥', mutexError);
    }
    if (!combo && [...product.name].length > 30) add('商品名称', '美团外卖标准商品名称不能超过 30 字，请调整渠道名称。');
    const plainDescription = String(data.p_detail_desc || data.p_rich_desc || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    if (!combo && [...plainDescription].length > 255) add('商品描述', '美团外卖标准商品描述不能超过 255 字；不会自动截断。');
    if (combo && snapshot) {
      if (snapshot.skus.length !== 1) add('套餐规格', '美团外卖套餐只支持一个 SKU，请调整当前渠道套餐规格。');
      if (snapshot.skus.some(sku => !/^\d+人份$/.test(sku.name.replace(/\s/g, '')))) add('套餐份量', '美团外卖套餐份量需为“x人份”。');
      if (snapshot.methods.length || snapshot.addonCount) add('套餐做法 / 加料', '美团外卖暂不支持套餐头做法、加料；不会丢弃后继续同步。');
    }
  } else if (channel === 'taobao') {
    if (snapshot && snapshot.specGroupCount > 1) add('商品规格', '淘宝闪购只支持一层规格，不会自动合并多个规格维度。');
    if (snapshot?.methods.some(method => Number(method.price) !== 0)) add('商品做法', '淘宝闪购普通做法不支持加价，请调整该渠道做法；不会自动转为加料。');
    if (fields.noSingleDelivery === '是') add('单点不送', '旧菜单已有此配置，但新接口映射尚待联调；保留资料，不跳过此项同步。');
    if (Array.isArray(fields.features) && fields.features.length) add('商品特色', '旧菜单已有此配置，但新接口映射尚待联调；保留资料，不跳过此项同步。');
  } else {
    if (!product.name.trim() || [...product.name].length > 50) add('商品名称', '京东商品名称需为 1～50 字。');
    if (!String(fields.brandId || '').trim()) add('商品品牌', '请选择京东返回的商品品牌，不能用自定义名称代替品牌 ID。');
    if (!fields.categoryVerified || !fields.brandVerified) add('类目 / 品牌', '平台类目和品牌尚未核验，请通过京东推荐或查询确认；演示选项不能用于真实发布。');
    if (snapshot && snapshot.specGroupCount > 5) add('商品规格', '京东最多支持 5 组销售属性，不会合并规格维度。');
    const methodGroups = [...new Set(snapshot?.methods.map(m => m.groupName || '做法') || [])];
    if (methodGroups.length > 6) add('商品做法', '京东最多支持 6 组做法。');
    if (methodGroups.some(name => (snapshot?.methods.filter(m => (m.groupName || '做法') === name).length || 0) > 20)) add('商品做法', '京东每组最多支持 20 个做法项。');
    if (methodGroups.some(name => [...name].length > 20) || snapshot?.methods.some(m => [...m.name].length > 30)) add('商品做法', '京东做法组名最多 20 字，做法项最多 30 字。');
    if (snapshot?.methods.some(m => Number(m.price) !== 0)) add('商品做法', '京东做法不支持加价，请禁用该渠道的加价做法；不会自动转成小料或 SKU。');
    const gallery = Array.isArray(data.p_img_gallery) ? data.p_img_gallery : [];
    if (gallery.length > 6) add('商品图片', '京东最多支持 6 张商品图片。');
    const images = [product.image || data.p_img, ...gallery].filter(Boolean);
    if (images.some(image => typeof image !== 'string' || !/^https?:\/\//.test(image))) add('商品图片', '商品图片需先上传为公网地址，不能将本地文件或临时图片直接提交京东。');
    if (data.attributeMutexRules?.length || data.jdUnsupportedRules?.length) add('属性选择规则', '当前互斥或选择规则尚未确认京东等价能力，不会忽略规则继续发布。');
    if (combo && (!snapshot?.comboGroups || !snapshot.comboGroups.some(group => group.min > 0))) add('套餐结构', '京东只提交必选套餐组；请补齐结构，且至少保留一个最少选择数大于 0 的分组。');
    if (combo && snapshot?.comboGroups?.some(group => group.min > 0 && (group.items.length === 0 || group.items.some(item => !item.productId || !item.skuId)))) add('套餐子商品', '请补齐必选组中的子商品和完整 SKU，不能只按套餐组数量生成依赖。');
    if (combo && snapshot?.comboGroups?.some(group => group.min > 0 && group.max !== undefined)) add('套餐选择规则', '套餐分组最大选择数尚未确认京东等价能力，需联调确认后发布，不会静默丢弃限制。');
  }
  snapshot?.skus.forEach(sku => {
    if (!Number.isFinite(Number(sku.price)) || Number(sku.price) < 0 || !/^\d+(\.\d{1,2})?$/.test(sku.price)) add(`${sku.name || 'SKU'}售价`, '售价需为非负金额，最多两位小数。');
    if (channel === 'jd') {
      if (!sku.weightKg || !Number.isFinite(Number(sku.weightKg)) || Number(sku.weightKg) <= 0) add(`${sku.name || 'SKU'}重量`, '京东要求 SKU 重量（KG）；当前资料缺失，需完善来源资料或确认平台正式默认规则，不能用份量代替。');
      if (sku.inventoryMode === 'unlimited') add(`${sku.name || 'SKU'}库存`, '京东无限库存表达尚待联调，不能用超大库存伪装。');
      if (sku.name.split(' / ').some(value => [...value].length > 30)) add('商品规格', '京东单个销售属性值最多 30 字。');
      if (Number(sku.packagingFee) > 0) add(`${sku.name || 'SKU'}餐盒费`, '京东餐盒费尚无已确认映射，暂不能携带该费用发布。');
    }
    if (sku.packagingFee && (!/^\d+(\.\d{1,2})?$/.test(sku.packagingFee))) add(`${sku.name || 'SKU'}餐盒费`, '餐盒费需为非负金额，最多两位小数。');
    if (sku.inventoryMode !== 'unlimited' && !/^\d+$/.test(sku.stock)) add(`${sku.name || 'SKU'}库存`, '请填写非负整数库存，或选择不限库存。');
    const step = Number(fields[`packingStep:${sku.id}`] ?? 1);
    if (!Number.isInteger(step) || step < 1) add(`${sku.name || 'SKU'}餐盒费`, '计费步长需为大于 0 的整数。');
    if (channel === 'taobao' && step !== 1) add(`${sku.name || 'SKU'}餐盒费`, '淘宝闪购规格包装费没有已确认的阶梯计费映射，请改为每份计费或完成接口验证。');
    if (sku.autoRestock) add(`${sku.name || 'SKU'}自动补足`, `${channel === 'jd' ? '京东外卖' : channel === 'taobao' ? '淘宝闪购' : '美团外卖普通 SKU'}自动补足执行方式待确认，不会用“置满库存”替代；美团小料自动补足另按小料接口处理。`);
  });
  return issues;
}

/** Compact form feedback only. Execution still runs the complete platform checks above. */
export function checkTakeoutRequiredInfo(product: Input, channel: TakeoutChannel): TakeoutIssue[] {
  const data = product.formData || {};
  const fields = data.channelSpecificValues?.[channel] || {};
  const snapshot = data.takeoutSnapshot as TakeoutSnapshot | undefined;
  const issues: TakeoutIssue[] = [];
  const missing = (value: unknown) => value == null || String(value).trim() === '';
  const add = (field: string, message: string) => issues.push({ field, message });
  if (missing(product.name)) add('商品名称', '请填写商品名称。');
  if (missing(fields.category)) add('商品类目', '请选择该平台的商品类目。');
  if (missing(product.image) && missing(data.p_img)) add('商品主图', '请上传商品主图。');
  if (!snapshot?.skus?.length) add('商品规格', '请在来源商品中补齐并保存规格资料。');
  if (channel === 'jd' && missing(fields.brandId)) add('商品品牌', '请选择京东商品品牌。');
  snapshot?.skus?.forEach(sku => {
    if (missing(sku.price)) add(`${sku.name || 'SKU'}销售价`, '请填写销售价。');
    if (sku.inventoryMode !== 'unlimited' && missing(sku.stock)) add(`${sku.name || 'SKU'}库存`, '请填写库存，或选择不限库存。');
    if (channel === 'jd' && missing(sku.weightKg)) add(`${sku.name || 'SKU'}重量`, '请补充京东要求的 SKU 重量（KG）。');
  });
  if (channel === 'jd' && ['combo', '套餐商品', 'Combo'].includes(product.type || '')) {
    if (!snapshot?.comboGroups?.some(group => group.min > 0)) add('套餐分组', '请补充必选套餐分组。');
    else if (snapshot.comboGroups.some(group => group.min > 0 && (!group.items.length || group.items.some(item => !item.productId || !item.skuId)))) add('套餐子商品', '请补齐必选分组中的子商品与规格。');
  }
  return issues;
}

export function takeoutOperationPlan(channel: TakeoutChannel, operation: 'structure' | 'price' | 'shelf' | 'stock' | 'addon_shelf' | 'method' | 'delete') {
  const plans = channel === 'meituan' ? {
    structure: '预检 → 图片 / 分类 → 小料与小料组 → 标准商品完整 SKU → 做法 → 套餐 → 回查',
    price: 'SKU 改价 → 回查；不重传商品结构',
    shelf: 'SKU 上下架 → 回查；保留当前库存',
    stock: 'SKU 绝对库存 → 回查；保留当前上下架状态',
    addon_shelf: '仅更新企迈加料上下架；美团小料无独立上下架接口，不以删除或沽清替代',
    method: '简单做法全量绑定；加价 / 默认 / 互斥做法随标准商品完整结构更新',
    delete: '检查套餐引用 → 先处理套餐 → 删除指定已映射商品 → 回查；不删除平台自建商品',
  } : channel === 'taobao' ? {
    structure: '预检 → 分类 / 图片 hash → 子品与加料 SKU → 配料组 → 商品 / PACKAGE_V3 套餐 → 回查',
    price: '规格批量改价 → 回查；不重传商品结构',
    shelf: '商品上下架 → 回查；保留当前库存',
    stock: '规格绝对库存 → 回查；恢复企迈保存库存，不直接置满最大库存',
    addon_shelf: '加料选项启停 → 回查；需开通 L2 接口权限',
    method: '做法选项启停 → 回查；需开通 L2 接口权限，加价做法不能直接提交',
    delete: '检查套餐 / 配料组引用 → 删除指定已映射商品 → 回查；不删除平台自建商品',
  } : {
    structure: '检测门店建品 / 门店分类能力 → 企迈依赖对象 → 京东分类 → 小料 → 标准商品 → 必选组套餐 → 平台处理 / 回查',
    price: '标准商品 / 小料走价格接口（同门店每批最多 50 SKU）；套餐走 savePackage 售价 → 回查',
    shelf: 'saveSpu / savePackage 状态 1 或 2 → 回查；保留当前库存',
    stock: '标准商品 / 小料走绝对库存；套餐走 savePackage 库存 → 回查；保留当前上下架状态',
    addon_shelf: '独立小料（productType=8）上下架 → 回查；不删除主商品的小料关联',
    method: '仅同步 0 元做法；按 customAttrList 完整目标结构更新，保留原 SKU',
    delete: '引用检查 → 下架 → saveSpu / savePackage 状态 4 → 回查确认；不连带删除共享小料或子商品',
  };
  return plans[operation];
}

export function takeoutConversionNotes(product: Input, channel: TakeoutChannel): string[] {
  if (channel !== 'jd') return [];
  const groups = (product.formData?.takeoutSnapshot as TakeoutSnapshot | undefined)?.comboGroups || [];
  const omitted = groups.filter(group => group.min <= 0);
  return omitted.length ? [`京东不提交非必选套餐组：${omitted.map(group => group.name).join('、')}；仅转换平台快照，企迈结构保持不变，也不为这些组单独创建依赖商品。`] : [];
}

export type JdStoreReadiness = { authorized: boolean; bound: boolean; productMode: number; categoryMode: number; mappingVerified: boolean };
export function checkJdStoreReadiness(facts?: JdStoreReadiness): TakeoutIssue[] {
  if (!facts) return [{ field: '门店连接', message: '京东授权、门店绑定与建品能力尚未检测，不能直接提交平台任务。' }];
  const issues: TakeoutIssue[] = [];
  if (!facts.authorized || !facts.bound) issues.push({ field: '门店连接', message: '请重新授权并完成京东门店绑定。' });
  if (facts.productMode !== 0 || facts.categoryMode !== 0) issues.push({ field: '京东建品模式', message: '仅支持门店建品和门店分类模式；不会自动切换为总部建品。' });
  if (!facts.mappingVerified) issues.push({ field: '门店分类', message: '京东门店分类映射尚未确认，商品需等待分类节点成功。' });
  return issues;
}

export const getTakeoutSnapshot = (product: Product) => (product as Product & { formData?: Record<string, any> }).formData;

let nextTakeoutBatchId = 0;
export function createTakeoutStoreBatch(product: Input & { id: string; storeId: string; storeName: string }, channelIds: string[], operation: Parameters<typeof takeoutOperationPlan>[1], fields: string[] = []): PublishBatch | undefined {
  const channels = [...new Set(channelIds.filter(isTakeoutChannel))].filter(channel => !(channel === 'meituan' && operation === 'addon_shelf'));
  if (!channels.length) return undefined;
  const id = `STORE-${Date.now()}-${++nextTakeoutBatchId}`;
  const now = new Date().toLocaleString('sv-SE', { hour12: false });
  const label = (channel: TakeoutChannel) => channel === 'meituan' ? '美团外卖' : channel === 'jd' ? '京东外卖' : '淘宝闪购';
  const details: NonNullable<PublishBatch['details']> = channels.flatMap(channel => {
    const validation = operation === 'structure' ? checkTakeoutProduct(product, channel) : operation === 'price' ? checkTakeoutProduct(product, channel).filter(issue => issue.field === '商品结构' || issue.field.endsWith('售价')) : [];
    const readiness = channel === 'jd' ? checkJdStoreReadiness(product.formData?.jdStoreReadiness) : [];
    const error = [...(product.takeoutPreflightErrors || []), ...validation.map(issue => `${issue.field}：${issue.message}`), ...readiness.map(issue => `${issue.field}：${issue.message}`)].join('；');
    const common = { productName: product.name, productId: product.id, skuName: '', skuId: '', storeName: product.storeName, storeId: product.storeId, channel: label(channel), fields };
    return [{ ...common, id: `${id}-${channel}-qimai`, taskType: 'qimai', status: 'success', action: '保存企迈门店商品', finishedAt: now }, { ...common, id: `${id}-${channel}-platform`, taskType: 'platform', status: error ? 'failed' : 'waiting', action: takeoutOperationPlan(channel, operation), finishedAt: error ? now : '等待平台执行（演示）', ...(error ? { error } : {}) }];
  });
  return { id, recordType: 'store_publish', title: `${product.name} · 门店经营操作`, action: operation, sourceType: '门店商品', sourceName: product.storeName, snapshot: `${fields.join('；')}（本地演示，不调用平台接口）`, channels: channels.map(label), storeScope: product.storeName, storeCount: 1, productCount: 1, skuCount: 0, status: 'success', createdAt: now, creator: '当前用户', details,
    tasks: [{ id: `${id}-qimai`, type: 'qimai', target: '企迈门店商品', channels: channels.map(label), status: 'success', progress: 100, productCount: 1, skuCount: 0, storeCount: 1, successCount: channels.length, failedCount: 0, waitingCount: 0, startedAt: now, finishedAt: now }, ...channels.map(channel => {
      const error = details.find(detail => detail.channel === label(channel) && detail.taskType === 'platform')?.error;
      return { id: `${id}-${channel}`, type: 'platform' as const, target: `${label(channel)}门店商品`, channels: [label(channel)], status: error ? 'failed' as const : 'waiting' as const, progress: error ? 100 : 0, productCount: 1, skuCount: 0, storeCount: 1, successCount: 0, failedCount: error ? 1 : 0, waitingCount: error ? 0 : 1, startedAt: now, waitingReason: [takeoutOperationPlan(channel, operation), ...takeoutConversionNotes(product, channel)].join('；'), ...(error ? { error } : {}) };
    })] };
}
