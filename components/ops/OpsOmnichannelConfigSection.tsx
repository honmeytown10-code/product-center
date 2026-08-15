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
            OP 负责能力开通、合同范围和可用授权模式；组织协作、商品维护位置、企迈接单及商品操作由商家在 Web 后台自行配置。
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
            <div className="grid grid-cols-3 gap-3">
              {[
                ['商家策略配置', '允许品牌管理员维护组织协作与三方商品维护位置'],
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
