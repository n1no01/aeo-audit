"use client";

import { useState } from "react";

export default function Tooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block ml-1.5 align-middle group cursor-pointer"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {/* Mali sivi krug sa upitnikom */}
      <span className="w-3.5 h-3.5 bg-slate-200 hover:bg-slate-300 text-slate-500 font-black rounded-full flex items-center justify-center text-[9px] select-none transition duration-150">
        ?
      </span>

      {/* Prozorčić sa objašnjenjem */}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {text}
          {/* Mali trougao na dnu prozorčića */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}