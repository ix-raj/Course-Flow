import React from 'react';
import { Play, Video, FileText, Trash2, Edit2, Link as LinkIcon } from 'lucide-react';

// --- UTILS ---
import { calculateCourseProgress } from '../../utils/metrics';

export function CourseCard({ playlist, onClick, onDelete, onEdit, isDarkMode, userData }) {
  
  const progress = calculateCourseProgress(playlist, userData);
  const platformName = playlist.isExternal
    ? (() => {
        const lowerUrl = (playlist.externalUrl || '').toLowerCase();
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'YouTube';
        if (lowerUrl.includes('coursera.org')) return 'Coursera';
        if (lowerUrl.includes('udemy.com')) return 'Udemy';
        if (lowerUrl.includes('scrimba.com')) return 'Scrimba';
        return 'Web Link';
      })()
    : '';

  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col h-full rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl relative cursor-pointer
        ${isDarkMode 
          ? 'bg-[#1E293B] border-white/10 hover:border-slate-500 hover:shadow-black/40' 
          : 'bg-white/95 border-slate-200/80 hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]'}`}
    >
      {/* Card Image */}
      <div className={`aspect-video w-full relative overflow-hidden border-b ${isDarkMode ? 'bg-[#0F172A] border-white/5' : 'bg-slate-100/80 border-slate-100'}`}>
        {playlist.cover ? (
          <img src={playlist.cover} alt={playlist.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gradient-to-br from-slate-50 to-slate-200'}`}>
            <Video className={`h-10 w-10 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
          </div>
        )}

        {playlist.isExternal && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md shadow-sm">
            <LinkIcon className="h-3 w-3 text-indigo-300" />
            <span>{platformName}</span>
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
          <div className="bg-indigo-500 text-white p-3 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            <Play className="h-5 w-5 fill-white" />
          </div>
        </div>

        {/* Action Buttons*/}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(playlist); }}
                className={`p-2 rounded-lg shadow-sm transition-colors hover:brightness-110 ${isDarkMode ? 'bg-[#1E293B]/90 text-slate-300 hover:bg-indigo-500 hover:text-white' : 'bg-white/90 text-slate-500 hover:bg-indigo-500 hover:text-white'}`}
                title="Edit Course"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(playlist.id); }}
                className={`p-2 rounded-lg shadow-sm transition-colors hover:brightness-110 ${isDarkMode ? 'bg-[#1E293B]/90 text-slate-300 hover:bg-red-500 hover:text-white' : 'bg-white/90 text-slate-500 hover:bg-red-500 hover:text-white'}`}
                title="Delete Course"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
        </div>
      </div>

      {/* Card Content */}
        <div className={`p-3 sm:p-5 flex-1 flex flex-col ${isDarkMode ? '' : 'bg-gradient-to-b from-white to-slate-50/40'}`}>
          <h3 className={`text-sm sm:text-base font-semibold line-clamp-1 mb-1 transition-colors duration-200 ${isDarkMode ? 'text-slate-100 group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-indigo-700'}`}>
            {playlist.title}
          </h3>
          {playlist.isExternal && (
            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              External course
            </p>
          )}
       
        {/* Progress & Meta Area */}
        <div className="mt-auto">
           <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                 <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {playlist.videoCount}</span>
                 <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {playlist.noteCount}</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-500">{progress}%</span>
           </div>
           
           {/* Progress Bar */}
           <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
           </div>
        </div>
      </div>
    </div>
  );
}
