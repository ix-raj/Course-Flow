import React from 'react';

export const BrandLogo = ({ isDarkMode, onClick, className = "" }) => (

   <button onClick={onClick}
       className={`flex items-center gap-1.5 group z-50 focus:outline-none ${className}`}
       >
        <span className="text-[26px] font-black tracking-[-0.02em] leading-none flex items-end">
           <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent transition-all duration-300 group-hover:from-cyan-400 group-hover:to-indigo-500"> Course </span>
           <span className={`relative ml-2 transition-all duration-300 ${isDarkMode ? 'text-white/85 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-600'}`}> Flow </span>
        </span>
    </button>

);