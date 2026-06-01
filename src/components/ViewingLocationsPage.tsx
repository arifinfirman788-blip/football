/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, MapPin, Navigation, Clock, Phone } from 'lucide-react';

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
  phone: string;
  distance: string;
  lng: number;
  lat: number;
}

const viewingLocations: ViewingLocation[] = [
  {
    id: 'shanghai-jingan',
    city: '上海',
    name: '静安足球观影点',
    address: '静安区南京西路商圈',
    time: '18:00-赛后 30 分钟',
    phone: '现场咨询',
    distance: '约 2.4km',
    lng: 121.459,
    lat: 31.229,
  },
  {
    id: 'beijing-chaoyang',
    city: '北京',
    name: '朝阳球迷观赛区',
    address: '朝阳区工体周边商圈',
    time: '17:30-赛后 30 分钟',
    phone: '现场咨询',
    distance: '约 5.8km',
    lng: 116.447,
    lat: 39.930,
  },
  {
    id: 'shenzhen-nanshan',
    city: '深圳',
    name: '南山户外观影点',
    address: '南山区深圳湾体育中心周边',
    time: '18:00-赛后 30 分钟',
    phone: '现场咨询',
    distance: '约 8.6km',
    lng: 113.951,
    lat: 22.536,
  },
  {
    id: 'hangzhou-binjiang',
    city: '杭州',
    name: '滨江绿茵观影点',
    address: '滨江区奥体中心周边',
    time: '18:00-赛后 30 分钟',
    phone: '现场咨询',
    distance: '约 11.2km',
    lng: 120.234,
    lat: 30.239,
  },
];

const getAmapNavigationUrl = (location: ViewingLocation) => (
  `https://uri.amap.com/navigation?to=${location.lng},${location.lat},${encodeURIComponent(location.name)}&mode=car&policy=1&coordinate=gaode&callnative=1`
);

export const ViewingLocationsPage: React.FC<ViewingLocationsPageProps> = ({ isOpen, onClose }) => {
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

        {viewingLocations.map((location) => (
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
              <div className="rounded-xl bg-black/18 border border-white/5 px-2.5 py-2 flex items-center gap-1.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-[#ffd54f]" />
                <span className="truncate">{location.phone}</span>
              </div>
            </div>

            <a
              href={getAmapNavigationUrl(location)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 h-10 rounded-xl bg-gradient-to-b from-[#67d45d] to-[#16802b] text-white font-black text-[12px] flex items-center justify-center gap-1.5 shadow-[0_8px_18px_rgba(0,230,118,0.18)] active:scale-[0.98] transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>导航前往</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
