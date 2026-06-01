/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * 【当前未在前端使用】
 * 旧版桌面手机壳预览组件。
 * 当前产品已改为真实 H5 画布（见 App.tsx 的 h5-app-shell），此组件保留给后续需要
 * 做多机型桌面演示或设计对比时复用。
 */
interface PhoneFrameProps {
  children: React.ReactNode;
  phoneId?: string;
  phoneTitle?: string;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children, phoneId = 'A', phoneTitle }) => {
  return (
    <div className="flex flex-col items-center">
      {phoneTitle && (
        <span className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
          {phoneTitle}
        </span>
      )}
      <div 
        id={`phone-frame-${phoneId}`}
        className="relative w-[390px] h-[844px] rounded-[48px] bg-[#050f17] border-[10px] border-[#162535] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden select-none"
      >
        {/* 手机状态栏模拟区域 */}
        <div className="absolute top-0 inset-x-0 h-7 flex justify-between items-center px-6 z-50 text-white font-sans text-xs select-none">
          {/* 时间 */}
          <span className="font-semibold tracking-tight text-[11px]">9:41</span>
          
          {/* 灵动岛 / 听筒模拟 */}
          <div className="w-[110px] h-[18px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-[5px] flex items-center justify-end px-3">
            <div className="w-1.5 h-1.5 bg-[#0a101f] rounded-full mr-1 border border-[#1a203f]"></div>
            <div className="w-1 h-1 bg-[#152e5d] rounded-full"></div>
          </div>
          
          {/* 信号与电量模拟 */}
          <div className="flex items-center space-x-1.5 text-[10px]">
            {/* 蜂窝信号 */}
            <div className="flex items-end space-x-0.5 h-2 w-3.5">
              <div className="w-[2px] h-[3px] bg-white rounded-2xs"></div>
              <div className="w-[2px] h-[5px] bg-white rounded-2xs"></div>
              <div className="w-[2px] h-[7px] bg-white rounded-2xs"></div>
              <div className="w-[2px] h-[8px] bg-white rounded-2xs"></div>
            </div>
            
            {/* Wi-Fi 图标 */}
            <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 21l-12-11.6c1.1-1.1 2.3-1.9 3.7-2.5a18 18 0 0 1 16.6 0c1.4.6 2.6 1.4 3.7 2.5l-12 11.6z" />
            </svg>
            
            {/* 电池 */}
            <div className="w-5 h-2.5 border border-white/80 rounded-xs p-[1px] flex items-center">
              <div className="h-full w-[85%] bg-white rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* 页面内容容器 */}
        <div className="flex-1 w-full pt-0 pb-0 flex flex-col relative overflow-hidden">
          {children}
        </div>

        {/* 底部 Home 指示条 */}
        <div className="absolute bottom-1 inset-x-0 h-4 flex justify-center items-center z-50 pointer-events-none">
          <div className="w-32 h-[4px] bg-white/60 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
