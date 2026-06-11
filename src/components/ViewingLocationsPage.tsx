/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, MapPin, Navigation, Clock, Phone } from 'lucide-react';
import { openWechatLocation } from '../utils/wechatBridge';

interface ViewingLocationsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ViewingLocation {
  id: string;
  city: string;
  name: string;
  address: string;
  time: string;
  phone?: string;
  distance: string;
  lng: number;
  lat: number;
}

const viewingLocations: ViewingLocation[] = [
  {
    id: 'timore',
    city: '花溪区',
    name: '缇漫Timore',
    address: '汉批街道花跟大道十里河滩湿地公园(南广场观乌亭)地铁A口进入',
    time: '10:00-21:30',
    phone: '1726360557',
    distance: '观影点',
    lng: 106.678469,
    lat: 26.438111,
  },
  {
    id: 'cherry-motor',
    city: '云岩区',
    name: '车厘子机车咖啡馆',
    address: '贵阳市云岩区水东路与温泉大道交叉口南440米',
    time: '10:00-22:00',
    phone: '13765013728',
    distance: '观影点',
    lng: 106.764971,
    lat: 26.606122,
  },
  {
    id: 'colorful-guizhou-city',
    city: '南明区',
    name: '多彩贵州城大草坪',
    address: '龙洞堡老里坡1号',
    time: '待确认',
    distance: '观影点',
    lng: 106.789304,
    lat: 26.52904,
  },
];

export const ViewingLocationsPage: React.FC<ViewingLocationsPageProps> = ({ isOpen, onClose }) => {
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleNavigate = async (location: ViewingLocation) => {
    try {
      await openWechatLocation({
        latitude: location.lat,
        longitude: location.lng,
        name: location.name,
        address: location.address,
      });
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : '当前无法打开微信地图导航。');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#040c14] text-white flex flex-col overflow-hidden select-none">
      <div className="relative h-[154px] shrink-0 overflow-hidden bg-gradient-to-b from-[#12361f] via-[#071a12] to-[#040c14] px-4 pt-4 pb-3">
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_50%_0%,rgba(0,230,118,0.45),transparent_58%)]" />

        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-20 h-9 rounded-full bg-black/38 backdrop-blur-md border border-white/10 pl-2 pr-3 flex items-center gap-1.5 text-white/90 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] font-bold">返回</span>
        </button>

        <div className="relative z-10 h-full flex flex-col items-center justify-end text-center">
          <span className="text-[10px] text-[#00e676] font-bold tracking-[3px] uppercase">Offline Viewing</span>
          <h2 className="text-[23px] font-black tracking-[3px] mt-1">线下观影地点</h2>
          <p className="text-[10.5px] text-slate-300 mt-2 leading-relaxed">
            选择附近观影点，点击导航前往现场一起看球
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 space-y-3">
        <div className="rounded-2xl border border-[#00e676]/14 bg-[#061a11]/70 p-3 text-[10.5px] text-slate-300 leading-relaxed">
          实际开放场次、入场要求和活动权益以后续主办方公告为准，建议出发前再次确认。
        </div>

        {[...viewingLocations].reverse().map((location) => (
          <div
            key={location.id}
            className="rounded-2xl border border-white/[0.08] bg-[#071521]/95 p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.34)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#00e676]/12 border border-[#00e676]/20 px-2 py-0.5 text-[9px] font-bold text-[#00e676]">
                    {location.city}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">{location.distance}</span>
                </div>
                <h3 className="mt-2 text-[14px] font-black text-white tracking-wide">{location.name}</h3>
                <div className="mt-1.5 flex items-start gap-1.5 text-[10.5px] text-slate-400 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 mt-[1px] shrink-0 text-[#00e676]" />
                  <span>{location.address}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-xl bg-black/18 border border-white/5 px-2.5 py-2 flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-[#ffd54f]" />
                <span className="truncate">{location.time}</span>
              </div>
              <a
                href={location.phone ? `tel:${location.phone}` : undefined}
                className={`rounded-xl bg-black/18 border border-white/5 px-2.5 py-2 flex items-center gap-1.5 text-slate-300 ${
                  location.phone ? 'active:scale-[0.98] transition-all' : 'pointer-events-none opacity-70'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-[#ffd54f]" />
                <span className="truncate">{location.phone || '暂无联系电话'}</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => handleNavigate(location)}
              className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl border border-[#a5f07e]/35 bg-gradient-to-b from-[#7be35f] via-[#32a73c] to-[#156e23] text-[12px] font-black text-white shadow-[0_10px_24px_rgba(0,230,118,0.22),inset_0_1px_0_rgba(255,255,255,0.24)] active:scale-[0.985] transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>导航前往</span>
            </button>
          </div>
        ))}
      </div>

      {toastMessage && (
        <div className="absolute left-1/2 bottom-6 z-[70] -translate-x-1/2 max-w-[320px] rounded-2xl border border-white/10 bg-black/85 px-4 py-2.5 text-center text-[11px] leading-relaxed text-white shadow-[0_10px_24px_rgba(0,0,0,0.4)] whitespace-pre-wrap break-words">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
