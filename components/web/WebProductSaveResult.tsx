import React from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Send } from 'lucide-react';

// Prototype equivalent of the Console result page; navigation reuses the existing task flows.
export const WebProductSaveResult: React.FC<{
  productName: string;
  mode: 'create' | 'edit';
  intent: 'draft' | 'save' | 'publish';
  storeCount: number;
  channelCount: number;
  platformNote?: string;
  onOnlineProducts?: () => void;
  withdrawalPending?: boolean;
  allowTemplate?: boolean;
  allowDirectPublish?: boolean;
  onBack: () => void;
  onContinueCreate: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onTemplate: () => void;
  onRecords: () => void;
  onStoreProducts: () => void;
}> = ({ productName, mode, intent, storeCount, channelCount, platformNote, onOnlineProducts, withdrawalPending, allowTemplate = true, allowDirectPublish = true, onBack, onContinueCreate, onEdit, onPublish, onTemplate, onRecords, onStoreProducts }) => {
  const published = intent === 'publish';
  const focusClass = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B460]';
  return <div className="rounded-lg bg-white px-6 pb-10 pt-10" data-testid="product-save-result">
    <div className="mx-auto max-w-[1040px]">
      <div className="mx-auto flex max-w-[720px] flex-col items-center text-center" role="status">
        <CheckCircle2 size={64} strokeWidth={1.5} className="mb-5 text-[#00B460]" aria-hidden="true" />
        <h2 className="max-w-full break-words text-xl font-semibold leading-8 text-[#1D2129]">{published ? '商品已保存，下发任务已提交' : `商品“${productName}”${intent === 'draft' ? '草稿已保存' : mode === 'edit' ? '编辑成功' : '创建成功'}`}</h2>
        <p className="mt-3 text-sm leading-6 text-[#667085]">{published ? `已创建 ${storeCount} 家门店、${channelCount} 个渠道的下发任务。请在同步任务中查看进度和明细，任务完成后门店商品才会更新。` : intent === 'draft' ? '完善商品资料后，请下发至门店进行售卖。' : mode === 'edit' ? '本次修改已保存，请将更新后的商品资料下发至门店。' : '商品创建完成，请将商品下发至门店进行售卖。'}</p>
        {intent !== 'draft' && platformNote && <p className="mt-2 text-sm leading-6 text-[#667085]">{platformNote}{onOnlineProducts && <button type="button" onClick={onOnlineProducts} className={'ml-1 text-[#008F4C] hover:underline ' + focusClass}>前往在线点商品</button>}</p>}
        {withdrawalPending && <p className="mt-2 text-sm leading-6 text-[#667085]">取消渠道的门店商品下架任务已提交。<button type="button" onClick={onRecords} className={'ml-1 text-[#008F4C] hover:underline ' + focusClass}>查看下架任务</button></p>}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {published && <button type="button" onClick={onRecords} className={'h-9 rounded-md bg-[#00B460] px-5 text-sm font-medium text-white hover:bg-[#009F55] ' + focusClass}>查看同步任务</button>}
        <button type="button" onClick={onBack} className={'h-9 rounded-md border border-[#D9DDE3] bg-white px-5 text-sm text-[#4E5969] hover:bg-[#F7F8FA] ' + focusClass}>返回商品列表</button>
        {published ? <button type="button" onClick={onStoreProducts} className={'h-9 rounded-md border border-[#D9DDE3] bg-white px-5 text-sm text-[#4E5969] hover:bg-[#F7F8FA] ' + focusClass}>查看门店商品</button> : <>
          {mode === 'create' && <button type="button" onClick={onContinueCreate} className={'h-9 rounded-md border border-[#D9DDE3] bg-white px-5 text-sm text-[#4E5969] hover:bg-[#F7F8FA] ' + focusClass}>继续创建</button>}
          <button type="button" onClick={onEdit} className={'h-9 rounded-md border border-[#D9DDE3] bg-white px-5 text-sm text-[#4E5969] hover:bg-[#F7F8FA] ' + focusClass}>继续编辑</button>
        </>}
      </div>
      {!published && intent !== 'draft' && <section className="mt-10" aria-label="下发至门店">
        <h3 className="mb-4 text-base font-medium text-[#1D2129]">将商品下发至门店</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {allowDirectPublish && <button type="button" onClick={onPublish} className={'group flex min-h-[172px] items-center justify-between gap-5 rounded-lg bg-[#F7F8FA] p-6 text-left transition-colors hover:bg-[#EEF8F3] ' + focusClass}>
            <span className="min-w-0"><span className="block text-base font-semibold text-[#1D2129]">商品直接下发至门店</span><span className="mt-3 block min-h-12 text-sm leading-6 text-[#667085]">按商品库资料下发，选择门店及需要覆盖的属性。</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#008F4C]">下发至门店<ArrowRight size={16} aria-hidden="true" /></span></span>
            <Send size={40} strokeWidth={1.5} className="shrink-0 text-[#00B460]" aria-hidden="true" />
          </button>}
          {allowTemplate && <button type="button" onClick={onTemplate} className={'group flex min-h-[172px] items-center justify-between gap-5 rounded-lg bg-[#F7F8FA] p-6 text-left transition-colors hover:bg-[#EEF8F3] ' + focusClass}>
            <span className="min-w-0"><span className="block text-base font-semibold text-[#1D2129]">商品通过模板下发至门店</span><span className="mt-3 block min-h-12 text-sm leading-6 text-[#667085]">区域或门店商品有差异时，先通过模板维护差异，再下发至对应门店。</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#008F4C]">{mode === 'edit' ? '更新商品下发模板' : '加入商品下发模板'}<ArrowRight size={16} aria-hidden="true" /></span></span>
            <ClipboardList size={40} strokeWidth={1.5} className="shrink-0 text-[#00B460]" aria-hidden="true" />
          </button>}
        </div>
      </section>}
    </div>
  </div>;
};
