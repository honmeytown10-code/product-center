import React from 'react';
import { CheckCircle2, ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { OmnichannelBrandConfig } from '../../types';
import { THIRD_PARTY_CHANNELS } from '../../omnichannel';
import { Switch } from './OpsCommon';

type Props = {
  value: OmnichannelBrandConfig;
  onChange: (value: OmnichannelBrandConfig) => void;
};

export const OpsOmnichannelConfigSection: React.FC<Props> = ({ value, onChange }) => (
  <section>
    <div className="mb-4 flex items-center">
      <div className="mr-4 h-6 w-1.5 bg-orange-500" />
      <div>
        <h4 className="text-lg font-bold text-gray-900">全渠道商品能力开通</h4>
        <p className="mt-1 text-xs font-medium text-gray-400">OP 仅控制租户能力与交付边界，不代替商家配置日常经营策略</p>
      </div>
    </div>

    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-start gap-3 border-b border-blue-200 bg-blue-50 px-6 py-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <div className="text-sm font-black text-blue-900">配置边界已拆分</div>
          <div className="mt-1 text-xs leading-5 text-blue-700">
            OP 负责能力开通、商品资料管理方式与交付范围；三方商品维护位置和日常经营策略由商家在 Web 后台配置。
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <div>
            <div className="text-base font-black text-gray-900">开通全渠道商品管理</div>
            <div className="mt-1 text-xs text-gray-400">关闭后商家 Web 不展示全渠道管理策略和渠道商品库。</div>
          </div>
          <Switch active={value.enabled} onClick={() => onChange({ ...value, enabled: !value.enabled })} />
        </div>

        {value.enabled && (
          <>
            <fieldset className="rounded-md border border-gray-200 p-4">
              <legend className="px-2 text-sm font-bold text-gray-900">商品资料管理方式</legend>
              <div className="flex flex-wrap gap-6">{([['unified', '各渠道共用一套商品资料'], ['channel_division', '各渠道分别维护商品资料']] as const).map(([mode, label]) => <label key={mode} className="flex items-center gap-2 text-sm"><input type="radio" name="ops-collaboration-mode" checked={value.collaborationMode === mode} onChange={() => onChange({ ...value, collaborationMode: mode })} className="accent-orange-500" />{label}</label>)}</div>
              <p className="mt-3 text-xs leading-5 text-gray-500">共用资料：在商品库维护一次，POS、小程序、外卖等渠道使用同一套资料。分别维护：先建商品主档，再按渠道维护售卖资料；同组渠道可共用资料。商家后台只读展示，正式切换需迁移资料与权限；此处仅演示配置与菜单联动。</p>
            </fieldset>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['商家策略配置', '允许品牌管理员维护三方商品维护位置'],
                ['渠道授权中心', '允许按门店完成接单、商品操作所需授权'],
                ['服务商费用中心', '允许展示平台账单状态并进入充值流程'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center text-sm font-black text-gray-900"><CheckCircle2 size={16} className="mr-2 text-emerald-500" />{title}</div>
                  <p className="mt-2 text-xs leading-5 text-gray-500">{description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="text-sm font-black text-gray-800">已开放三方渠道</div>
                <span className="text-xs text-gray-400">具体管理方式由商家配置</span>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4">
                {THIRD_PARTY_CHANNELS.map(channel => (
                  <div key={channel.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-3">
                    <span className="text-sm font-bold text-gray-700">{channel.name}</span>
                    <span className="text-[11px] text-gray-400">{channel.supportsServiceProviderBilling ? '支持服务商计费' : '标准授权'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <LockKeyhole size={16} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <div className="text-xs font-black text-amber-900">商家策略变更需品牌管理员权限并保留审计记录</div>
                  <div className="mt-1 text-xs text-amber-700">涉及商品来源切换、渠道分组调整时，商家端需完成影响校验后才能保存。</div>
                </div>
              </div>
              <button type="button" className="flex items-center text-xs font-bold text-amber-800">查看商家端配置 <ExternalLink size={13} className="ml-1" /></button>
            </div>
          </>
        )}
      </div>
    </div>
  </section>
);
