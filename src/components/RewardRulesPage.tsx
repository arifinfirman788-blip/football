/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Gift, Headphones, Medal, Trophy, WalletCards, X } from 'lucide-react';
import { assetUrl } from '../utils/assets';
import { getEnterpriseCustomerServiceFallbackWechatId, openEnterpriseCustomerService } from '../utils/wechatBridge';

interface RewardRulesPageProps {
  isOpen: boolean;
  onClose: () => void;
}

// 规则文案集中维护，运营规则调整时只需要修改这里。
const pointRules = [
  { title: '截至时间', content: '每场比赛开赛前 10 分钟截止提交竞猜。' },
  { title: '结算范围', content: '竞猜仅针对常规时间（90 分钟及伤停补时），加时赛与点球大战结果不计入本活动结算。' },
  { title: '积分获取', content: '猜对 1 场（胜/平/负）+1 分，猜错或未参与不加分。' },
  { title: '提交限制', content: '同一场比赛仅可提交一次，提交后不可修改或重复提交。赛后以官方最终公布结果为准进行结算。' },
  { title: '积分口径', content: '按累计积分从高到低排序。【若积分相同，则按玩家提交最后一次正确竞猜的时间先后进行排名，先提交者排名靠前】。' },
  { title: '周排行', content: '每周五更新。累计周期为：上周五 00:00 至本周四 24:00。' },
  { title: '总排行', content: '整个世界杯活动期间，所有竞猜场次的总积分累计排名。' },
];

const rewardClaimRules = {
  claimChannel: {
    title: '兑奖渠道',
    intro: '获奖用户可在名单公示后，在有效期内通过以下任一方式主动联系官方客服进行领奖：',
    items: [
      '在线客服：点击本页面下方【联系客服】按钮，发送暗号“世界杯领奖”。',
      '客服热线：400-996-0051（工作日 8:30-18:00）。',
    ],
  },
  publishWindow: {
    title: '公示时间与领奖时限',
    items: [
      '周排行：前 1-21 名，每周五上午在周榜单进行公示，领奖有效期为公示之日起 5 个自然日内。',
      '总排行：前 1-55 名，总决赛结束后 1 个工作日进行公示，领奖有效期为公示之日起 10 个自然日内。',
    ],
  },
  claimNotice: {
    title: '领奖须知',
    content:
      '请中奖用户务必在上述有效时限内主动联系客服。若因用户未自主联系，或因手机停机、拒接、无法提供有效中奖证明等个人原因导致无法取得联系的，均视为自动放弃奖品，奖品不予补发。',
  },
};

const prizeUsageRules = [
  {
    title: '贵阳=曼谷往返机票',
    items: [
      '航班：九元航空直飞 AQ1207 / AQ1208。',
      '兑换政策：世界杯结束后根据总榜单排名进行兑换，每个航班仅可兑换 1 张，先到先得（兑换前需提前咨询航班日期是否支持兑换，客服将根据航班情况告知）。',
      '兑换有效期：兑奖之日起至 2026 年 7 月 31 日，超时失效。',
      '兑换班期：2026 年 7 月 21 日至 2026 年 9 月 22 日，其余班期不可兑换。',
      '费用说明：兑换机票不含燃油费和机场税，燃油费和机场税需要自行支付，具体价格以九元官网公布为准。',
      '退改说明：兑换后若需退票，根据航司退改规定只能退机场税费，燃油费无法退回；机票无法改签。',
      '兑换说明：兑奖人需与乘机人保持一致，机票仅限本人使用。',
      '以上最终解释权归赞助商贵人之旅所有。',
    ],
  },
  {
    title: '贵州省内支支串飞往返机票',
    items: [
      '航班：多彩航空执飞贵州省内支支串飞航班往返机票，具体航线以多彩航空官网为准。',
      '兑换政策：获奖用户提前 5 天在工作日（上午 9:00-12:00、下午 14:00-18:00）将姓名、联系方式、身份证号码、航班日期及航班号发送至黄小西客服出票。',
      '兑换班期：兑奖之日起至 2026 年 10 月 20 日（中秋、十一黄金周不可兑换）。',
      '费用说明：兑换机票不含基建及燃油费，出行之前需将基建及燃油费付清，基建及燃油费不可开具发票。',
      '退改说明：若因不可抗力原因导致无法出行，仅退基建及燃油费。',
      '兑换说明：兑奖人需与乘机人保持一致，机票仅限本人使用。',
      '以上最终解释权归赞助商贵旅服务所有。',
    ],
  },
  {
    title: '黄果树瀑布门票',
    items: [
      '兑换政策：榜单公示后联系客服兑换。',
      '兑换日期：兑奖之日起三个月内，景区剩有余票即可兑换。',
      '兑换说明：兑奖人需与景区游览人保持一致，门票仅限本人使用。',
      '以上最终解释权归赞助商贵旅数网所有。',
    ],
  },
  {
    title: '加榜梯田门票 / 岜沙苗寨门票 / 云峰屯堡门票 / 中国天眼免门票（观光车票）',
    items: [
      '兑换政策：榜单公示后联系客服兑换。',
      '兑换方式：纸质票邮寄。',
      '使用规则：以门票上规则为准。',
      '兑换说明：兑奖人需与景区游览人保持一致，门票仅限本人使用，不可倒卖。',
      '以上最终解释权归赞助商风景贵州所有。',
    ],
  },
  {
    title: '美式咖啡月卡',
    items: [
      '兑换政策：榜单公示后联系客服登记，并在 7 个自然日内到【车厘子机车咖啡馆】完成开卡。',
      '使用规则：从到店开卡之日起 30 天内，每天可到店领取一杯美式咖啡。',
      '使用说明：月卡仅限本人使用，不得倒卖。',
      '以上最终解释权归赞助商车厘子机车咖啡馆所有。',
    ],
  },
  {
    title: 'BN机车机油(10w-40)',
    items: [
      '兑换政策：榜单公示后联系客服登记，有效期为发放后 30 天。',
      '兑换方式：奖品仅限到【车厘子机车咖啡馆】使用。',
      '使用说明：仅限本人使用，不得倒卖。',
      '以上最终解释权归赞助商车厘子机车咖啡馆所有。',
    ],
  },
  {
    title: '车厘子机车咖啡馆摩托车优惠券',
    items: [
      '兑换政策：榜单公示后联系客服登记，领取 1000 元购车优惠券，有效期为发放后 30 天。',
      '使用规则：所有【车厘子机车咖啡馆】在售车型均可使用。',
      '使用说明：仅限本人使用，不得倒卖。',
      '以上最终解释权归赞助商车厘子机车咖啡馆所有。',
    ],
  },
  {
    title: '多彩黄小西小程序通用优惠券',
    items: [
      '兑换政策：榜单公示后联系客服登记，领取 20 元多彩黄小西优惠券，有效期为发放后 5 天。',
      '使用规则：优惠券仅限在多彩黄小西微信小程序使用，可抵扣多彩黄小西小程序平台上的景区门票及活动线路产品。',
      '以上最终解释权归赞助商贵旅数网所有。',
    ],
  },
];

const complianceRules = [
  '本活动秉承公平、公正、公开原则，禁止使用外挂、作弊软件或一人多号等恶意刷奖行为，一经发现，主办方有权取消其竞猜资格及中奖成绩。',
  '如遇不可抗力因素（包括但不限于自然灾害、赛事临时调整/取消、系统遭受网络攻击等）导致活动无法继续进行，主办方有权暂停或提前终止活动，并有权调整开奖方案。',
  '所有活动最终解释权归多彩黄小西官方所有。本次活动如有未尽事宜，主办方有权后续予以解释、补充、说明。',
  '对于任何试图通过非法手段获取中奖资格的行为，主办方将保留追究其法律责任的权利。',
];

const rewardCarouselImages = [
  assetUrl('assets/rewards/carousel/prize-1.png'),
  assetUrl('assets/rewards/carousel/prize-2.png'),
  assetUrl('assets/rewards/carousel/prize-3.png'),
  assetUrl('assets/rewards/carousel/prize-4.png'),
  assetUrl('assets/rewards/carousel/prize-5.png'),
  assetUrl('assets/rewards/carousel/prize-6.png'),
  assetUrl('assets/rewards/carousel/prize-7.png'),
];
const REWARD_CAROUSEL_INTERVAL_MS = 4800;

export const RewardRulesPage: React.FC<RewardRulesPageProps> = ({ isOpen, onClose }) => {
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [activePrizeRule, setActivePrizeRule] = React.useState<(typeof prizeUsageRules)[number] | null>(null);
  const [activeRewardImageIndex, setActiveRewardImageIndex] = React.useState(0);
  const rewardTouchStartXRef = React.useRef<number | null>(null);
  const rewardTouchDeltaXRef = React.useRef(0);
  const rewardCarouselTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!toastMessage) return undefined;

    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  React.useEffect(() => {
    if (!isOpen || rewardCarouselImages.length <= 1) return undefined;

    const clearRewardCarouselTimer = () => {
      if (rewardCarouselTimerRef.current !== null) {
        window.clearInterval(rewardCarouselTimerRef.current);
        rewardCarouselTimerRef.current = null;
      }
    };

    const startRewardCarouselTimer = () => {
      clearRewardCarouselTimer();
      rewardCarouselTimerRef.current = window.setInterval(() => {
        setActiveRewardImageIndex((prev) => (prev + 1) % rewardCarouselImages.length);
      }, REWARD_CAROUSEL_INTERVAL_MS);
    };

    startRewardCarouselTimer();

    return () => {
      clearRewardCarouselTimer();
    };
  }, [isOpen]);

  const handleOpenCustomerService = async () => {
    try {
      await openEnterpriseCustomerService();
    } catch {
      setToastMessage(`当前环境暂不支持，请联系微信客服：${getEnterpriseCustomerServiceFallbackWechatId()}`);
    }
  };

  const restartRewardCarouselTimer = () => {
    if (rewardCarouselImages.length <= 1) return;
    if (rewardCarouselTimerRef.current !== null) {
      window.clearInterval(rewardCarouselTimerRef.current);
    }
    rewardCarouselTimerRef.current = window.setInterval(() => {
      setActiveRewardImageIndex((prev) => (prev + 1) % rewardCarouselImages.length);
    }, REWARD_CAROUSEL_INTERVAL_MS);
  };

  const goToPrevRewardImage = () => {
    setActiveRewardImageIndex((prev) => (
      prev === 0 ? rewardCarouselImages.length - 1 : prev - 1
    ));
    restartRewardCarouselTimer();
  };

  const goToNextRewardImage = () => {
    setActiveRewardImageIndex((prev) => (
      prev === rewardCarouselImages.length - 1 ? 0 : prev + 1
    ));
    restartRewardCarouselTimer();
  };

  const handleRewardTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    rewardTouchStartXRef.current = event.touches[0]?.clientX ?? null;
    rewardTouchDeltaXRef.current = 0;
  };

  const handleRewardTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (rewardTouchStartXRef.current === null) return;
    rewardTouchDeltaXRef.current = (event.touches[0]?.clientX ?? 0) - rewardTouchStartXRef.current;
  };

  const handleRewardTouchEnd = () => {
    const deltaX = rewardTouchDeltaXRef.current;
    rewardTouchStartXRef.current = null;
    rewardTouchDeltaXRef.current = 0;

    if (Math.abs(deltaX) < 36) return;

    if (deltaX > 0) {
      goToPrevRewardImage();
      return;
    }

    goToNextRewardImage();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#040c14] text-white flex flex-col overflow-hidden select-none">
      <div className="relative h-[132px] shrink-0 overflow-hidden bg-gradient-to-b from-[#1e3415] via-[#0a1b10] to-[#040c14] px-4 pt-4 pb-3">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,213,79,0.46),transparent_58%)]" />

        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-20 h-9 rounded-full bg-black/38 backdrop-blur-md border border-white/10 pl-2 pr-3 flex items-center gap-1.5 text-white/90 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] font-bold">返回</span>
        </button>

        <div className="relative z-10 h-full flex flex-col items-center justify-end text-center">
          <span className="text-[10px] text-[#ffd54f] font-bold tracking-[3px] uppercase">Reward Center</span>
          <h2 className="text-[23px] font-black tracking-[3px] mt-1">奖励兑换规则</h2>
          <p className="text-[10.5px] text-slate-300 mt-2 leading-relaxed">
            竞猜得积分，按周榜与总榜排名发放奖励
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3 space-y-3">
        <div className="rounded-2xl overflow-hidden border border-[#ffd54f]/18 bg-[#071521] shadow-[0_12px_24px_rgba(0,0,0,0.36)]">
          <div className="px-3.5 py-2.5 flex items-center justify-between bg-gradient-to-r from-[#2b2309] to-[#071521] border-b border-white/5">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#ffd54f]" />
              <span className="text-xs font-black text-white">奖励是什么</span>
            </div>
            <button
              type="button"
              onClick={() => setActivePrizeRule(prizeUsageRules[0] ?? null)}
              className="text-[9px] text-[#ffd54f] font-mono active:opacity-80 transition-opacity"
            >
              奖励使用说明
            </button>
          </div>

          <div
            className="relative overflow-hidden bg-[#00160c]"
            onTouchStart={handleRewardTouchStart}
            onTouchMove={handleRewardTouchMove}
            onTouchEnd={handleRewardTouchEnd}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeRewardImageIndex * 100}%)` }}
            >
              {rewardCarouselImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={`奖励海报 ${index + 1}`}
                  className="w-full shrink-0 h-auto object-contain bg-[#00160c]"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ))}
            </div>

            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur-sm">
              {rewardCarouselImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => {
                    setActiveRewardImageIndex(index);
                    restartRewardCarouselTimer();
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    activeRewardImageIndex === index ? 'w-4 bg-[#ffd54f]' : 'w-1.5 bg-white/55'
                  }`}
                  aria-label={`查看第 ${index + 1} 张奖励图`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-[#071521] border border-white/6 p-3 text-center">
            <Trophy className="w-5 h-5 text-[#ffd54f] mx-auto" />
            <span className="block text-[9px] text-slate-400 mt-1.5">周榜奖励</span>
            <strong className="block text-xs text-white mt-0.5">前 21 名</strong>
          </div>
          <div className="rounded-2xl bg-[#071521] border border-white/6 p-3 text-center">
            <Medal className="w-5 h-5 text-[#00e676] mx-auto" />
            <span className="block text-[9px] text-slate-400 mt-1.5">总榜奖励</span>
            <strong className="block text-xs text-white mt-0.5">前 55 名</strong>
          </div>
          <div className="rounded-2xl bg-[#071521] border border-white/6 p-3 text-center">
            <WalletCards className="w-5 h-5 text-[#ffd54f] mx-auto" />
            <span className="block text-[9px] text-slate-400 mt-1.5">领奖方式</span>
            <strong className="block text-xs text-white mt-0.5">联系客服</strong>
          </div>
        </div>

        <section className="rounded-2xl bg-[#071521]/95 border border-[#00e676]/12 p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.3)]">
          <h3 className="text-sm font-black text-[#00e676] flex items-center gap-1.5">
            <Medal className="w-4 h-4" />
            积分获取规则
          </h3>
          <div className="mt-3 space-y-2">
            {pointRules.map((rule, index) => (
              <div key={rule.title} className="flex gap-2 text-[11px] text-slate-300 leading-relaxed">
                <span className="mt-[2px] w-4 h-4 rounded-full bg-[#00e676]/12 border border-[#00e676]/18 text-[#00e676] flex items-center justify-center text-[9px] font-black shrink-0">
                  {index + 1}
                </span>
                <div>
                  <span className="font-black text-white">{rule.title}：</span>
                  <span>{rule.content}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-[#071521]/95 border border-[#ffd54f]/12 p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.3)]">
          <h3 className="text-sm font-black text-[#ffd54f] flex items-center gap-1.5">
            <Gift className="w-4 h-4" />
            奖励领取规则
          </h3>
          <div className="mt-3 space-y-3 text-[11px] text-slate-300 leading-relaxed">
            <div className="rounded-xl border border-[#ffd54f]/10 bg-black/12 px-3 py-2.5">
              <div className="font-black text-white">{rewardClaimRules.claimChannel.title}</div>
              <div className="mt-1">{rewardClaimRules.claimChannel.intro}</div>
              <div className="mt-2 space-y-1.5 pl-4">
                {rewardClaimRules.claimChannel.items.map((item) => (
                  <div key={item} className="flex gap-2">
                    <span className="text-[#ffd54f] shrink-0">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#ffd54f]/10 bg-black/12 px-3 py-2.5">
              <div className="font-black text-white">{rewardClaimRules.publishWindow.title}</div>
              <div className="mt-2 space-y-1.5 pl-4">
                {rewardClaimRules.publishWindow.items.map((item) => (
                  <div key={item} className="flex gap-2">
                    <span className="text-[#ffd54f] shrink-0">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#ffd54f]/10 bg-black/12 px-3 py-2.5">
              <div className="font-black text-white">{rewardClaimRules.claimNotice.title}</div>
              <div className="mt-1">{rewardClaimRules.claimNotice.content}</div>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-white/6 bg-black/16 p-3 text-[10px] text-slate-500 leading-relaxed">
          <div className="mb-2 text-[11px] font-black text-white">免责与合规声明</div>
          {complianceRules.map((rule) => (
            <div key={rule} className="mb-2 last:mb-0">
              {rule}
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-2 bg-gradient-to-t from-[#040c14] via-[#040c14]/96 to-transparent">
        <button
          onClick={handleOpenCustomerService}
          className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#00e676] to-[#35f29b] text-[#05210f] font-black text-[13px] shadow-[0_10px_24px_rgba(0,230,118,0.22)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Headphones className="w-4 h-4" />
          <span>联系客服</span>
        </button>
      </div>

      {toastMessage && (
        <div className="absolute left-1/2 bottom-20 z-[70] -translate-x-1/2 max-w-[300px] rounded-2xl border border-white/10 bg-black/85 px-4 py-2.5 text-center text-[11px] text-white shadow-[0_10px_24px_rgba(0,0,0,0.4)]">
          {toastMessage}
        </div>
      )}

      {activePrizeRule && (
        <div className="absolute inset-0 z-[80] bg-black/72 backdrop-blur-[2px] px-4 py-8">
          <div className="mx-auto flex h-full max-w-[360px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#071521] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between border-b border-white/6 px-4 py-3">
              <div>
                <div className="text-[10px] font-bold tracking-[2px] text-[#00e676] uppercase">Prize Rules</div>
                <h4 className="mt-1 text-[15px] font-black text-white">奖品使用规则</h4>
              </div>
              <button
                type="button"
                onClick={() => setActivePrizeRule(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/80 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                {prizeUsageRules.map((rule, index) => (
                  <button
                    key={rule.title}
                    type="button"
                    onClick={() => setActivePrizeRule(rule)}
                    className={`rounded-xl border px-3 py-2 text-left transition-all ${
                      activePrizeRule.title === rule.title
                        ? 'border-[#00e676]/40 bg-[#00e676]/10'
                        : 'border-white/8 bg-black/12'
                    }`}
                  >
                    <div className="flex gap-2 text-[11px] leading-relaxed">
                      <span className="mt-[2px] w-4 h-4 rounded-full bg-white/8 border border-white/10 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-black text-white line-clamp-2">{rule.title}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-white/8 bg-black/14 px-3 py-3">
                <div className="text-[12px] font-black text-white">{activePrizeRule.title}</div>
                <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-slate-300">
                  {activePrizeRule.items.map((item, index) => (
                    <div key={item} className="flex gap-2">
                      <span className="mt-[2px] w-4 h-4 rounded-full bg-white/8 border border-white/10 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
