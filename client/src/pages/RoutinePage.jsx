import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { getTodayDay, getTodayDateStr, getFutureDateArray } from '../utils/dateUtils';
import { 
  Sun, Moon, Code, Coffee, Monitor, Utensils, Gamepad2, 
  BookOpen, Dumbbell, Zap, Flame, Trophy, Check, 
  PlayCircle, Calendar as CalendarIcon, Settings, Link as LinkIcon,
  Sparkles, Clock, RotateCcw
} from 'lucide-react';

const ICON_MAP = {
  Sun, Moon, Code, Coffee, Monitor, Utensils, Gamepad2, 
  BookOpen, Dumbbell, Zap, Flame, Trophy
};

const formatTime = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours < 10 ? '0'+hours : hours}:${minutes < 10 ? '0'+minutes : minutes} ${ampm}`;
};

const formatDuration = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// Exact Color Engine from Original Routine App for perfect glows
const ICON_COLOR_PALETTE = {
  amber: '#f59e0b', sky: '#0ea5e9', violet: '#8b5cf6', emerald: '#10b981',
  rose: '#f43f5e', cyan: '#06b6d4', orange: '#f97316', blue: '#3b82f6',
  pink: '#ec4899', indigo: '#6366f1', slate: '#94a3b8'
};

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};

const getIconColorStyles = (colorKey = 'blue', isDarkMode) => {
  const hex = ICON_COLOR_PALETTE[colorKey] || ICON_COLOR_PALETTE.blue;
  const { r, g, b } = hexToRgb(hex);
  if (!isDarkMode) {
    return {
      color: hex,
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
    };
  }
  return {
    color: hex,
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
  };
};

export default function RoutinePage({ playlists, productivityData, isDarkMode, setIsDarkMode, onSync }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [wakeUpTime, setWakeUpTime] = useState(8 * 60 + 30); // 08:30 AM
  const shellBg = isDarkMode
    ? 'bg-slate-1000 text-slate-300'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_30%),linear-gradient(180deg,#F5F7FB_0%,#EEF2F8_100%)] text-slate-800';
  const heroSurface = isDarkMode
    ? 'bg-[#131A2B] border-white/[0.05] shadow-sm'
    : 'bg-white/90 border-slate-200/80 shadow-[0_12px_30px_rgba(15,23,42,0.06)]';
  const innerSurface = isDarkMode
    ? 'bg-[#0B1020] border-white/[0.05]'
    : 'bg-slate-50/90 border-slate-200/80';
  const cardSurface = isDarkMode
    ? 'bg-[#131A2B] border-white/[0.04]'
    : 'bg-white/90 border-slate-200/80 shadow-[0_10px_26px_rgba(15,23,42,0.05)]';
  const currentCardSurface = isDarkMode
    ? 'bg-gradient-to-r from-indigo-900/20 to-[#131A2B] border-indigo-500/50 shadow-[0_8px_30px_rgba(99,102,241,0.15)]'
    : 'bg-gradient-to-r from-indigo-50 to-white border-indigo-300 shadow-[0_8px_30px_rgba(99,102,241,0.10)]';
  const completedCardSurface = isDarkMode
    ? 'opacity-60 grayscale-[0.2] bg-[#131A2B] border-white/[0.04]'
    : 'opacity-75 grayscale-[0.15] bg-slate-100/90 border-slate-200/80';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayDay = getTodayDay();
  const todayDateStr = getTodayDateStr();
  
  const processedRoutine = useMemo(() => {
    const rawRoutine = productivityData?.weeklyRoutine?.[todayDay] || [];
    const completionLog = productivityData?.completionLog || {};
    return rawRoutine.reduce((acc, task) => {
      const startMins = acc.currentMins;
      const endMins = (startMins + (task.duration || 0)) % 1440;
      const isCompleted = !!completionLog[`${todayDateStr}_${task.id}`];
      return {
        currentMins: endMins,
        tasks: [...acc.tasks, { ...task, startMins, endMins, isCompleted }],
      };
    }, { currentMins: wakeUpTime, tasks: [] }).tasks;
  }, [productivityData?.weeklyRoutine, productivityData?.completionLog, todayDay, wakeUpTime, todayDateStr]);

  const progressPercentage = processedRoutine.length > 0 
    ? (processedRoutine.filter(t => t.isCompleted).length / processedRoutine.length) * 100 
    : 0;
  
  const firstIncompleteId = processedRoutine.find(t => !t.isCompleted)?.id;

  const tenDaysStr = getFutureDateArray(10);
  const upcomingEvents = useMemo(() => {
    const monthlyEvents = productivityData?.monthlyEvents || {};
    const events = [];
    Object.keys(monthlyEvents).forEach(date => {
      if (tenDaysStr.includes(date)) {
        monthlyEvents[date].forEach(ev => events.push({ ...ev, date }));
      }
    });
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [productivityData?.monthlyEvents, tenDaysStr]);

  const adjustWakeUpTime = (amount) => {
    setWakeUpTime(prev => {
      let newTime = prev + amount;
      if (newTime < 0) newTime += 1440;
      return newTime % 1440;
    });
  };

  const handleToggleTask = (taskId) => {
    const logKey = `${todayDateStr}_${taskId}`;
    const newLog = { ...(productivityData?.completionLog || {}) };
    if (newLog[logKey]) delete newLog[logKey];
    else newLog[logKey] = true;
    onSync({ completionLog: newLog });
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Inter',sans-serif] overflow-x-hidden pb-20 transition-colors duration-500 ${shellBg}`}>
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} activePage="routine" />

      {/* Fixed Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')` }}
        />
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-[#0B1121]/80 via-[#0B1121]/90 to-[#0B1121]' : 'bg-gradient-to-b from-white/30 via-[#F5F7FB]/55 to-[#EEF2F8]/90'}`} />
      </div>

      <div className="w-[96%] max-w-[1400px] mx-auto pt-8 md:pt-12 relative z-10 space-y-8">
        
        {/* NEW UNIFIED TOP BAR & CALIBRATOR */}
        <div className={`w-full rounded-[24px] p-6 md:p-8 flex flex-col xl:flex-row items-center justify-between gap-6 md:gap-8 border shadow-sm transition-colors ${heroSurface}`}>
          
          {/* Left: Date & Quote */}
          <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
            <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
             Hey It's {todayDay}
            </h1>
            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-3">
              <p className={`font-bold text-lg ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {new Date(todayDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <span className={`hidden sm:block w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
              <p className={`text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Sparkles size={16} className="text-indigo-500" /> So what are you upto today.
              </p>
            </div>
          </div>

          {/* Right: Instruments */}
          <div className={`flex flex-wrap justify-center items-center p-2 rounded-[1.5rem] shadow-inner border transition-colors ${innerSurface}`}>
            
            {/* Time */}
            <div className="flex items-center gap-2.5 px-5 py-3">
              <Clock size={20} className="text-indigo-500" />
              <span className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className={`hidden sm:block w-px h-12 mx-2 transition-colors ${isDarkMode ? 'bg-white/[0.05]' : 'bg-slate-200'}`}></div>

            {/* Calibrator */}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <button onClick={() => adjustWakeUpTime(-15)} className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-sm'}`}>-15</button>
              
              <div className="flex flex-col items-center justify-center w-24">
                <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-blue-500">
                  {formatTime(wakeUpTime).split(' ')[0]}
                </span>
                <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formatTime(wakeUpTime).split(' ')[1]}
                </span>
              </div>
              
              <button onClick={() => adjustWakeUpTime(15)} className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-sm'}`}>+15</button>
              <button onClick={() => setWakeUpTime(8 * 60 + 30)} className={`w-12 h-12 ml-1 flex items-center justify-center rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Reset Wake Time">
                <RotateCcw size={18} />
              </button>
            </div>

            <div className={`hidden sm:block w-px h-12 mx-2 transition-colors ${isDarkMode ? 'bg-white/[0.05]' : 'bg-slate-200'}`}></div>

            {/* Settings */}
            <button 
              onClick={() => navigate('/routine/settings')}
              className={`w-14 h-14 ml-1 mr-1 rounded-[14px] transition-all active:scale-95 flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm'}`}
              title="Routine Studio"
            >
              <Settings size={22} />
            </button>

          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: Timeline Track & Cards */}
          <div className="lg:col-span-8">

            <div className="relative">
              {/* Timeline Track */}
              <div className={`absolute top-6 bottom-6 left-[28px] w-[8px] -translate-x-1/2 rounded-full bg-gradient-to-b ${isDarkMode ? 'from-indigo-500/50 via-blue-500/20' : 'from-indigo-500/35 via-blue-500/15'} to-transparent`}></div>
              
              <div className="space-y-5">
                {processedRoutine.length === 0 ? (
                   <p className={`pl-16 italic py-6 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>No tasks configured for {todayDay}. Tap the gear icon to build your day.</p>
                ) : (
                  processedRoutine.map((task) => {
                    const isActive = task.id === firstIncompleteId;
                    const Icon = ICON_MAP[task.iconName] || Sun;
                    const style = getIconColorStyles(task.iconColor, isDarkMode);
                    const linkedCourse = task.linkedCourseId ? playlists.find(p => p.id === task.linkedCourseId) : null;
                    const hasCustomLink = task.customLink && task.customLink.url;

                    return (
                      <div key={task.id} className="relative w-full group pl-14 md:pl-16">
                        
                        {/* Perfect Center Timeline Node */}
                        <div className={`absolute top-1/2 -translate-y-1/2 left-[28px] -translate-x-1/2 w-[18px] h-[18px] rounded-full z-10 ring-4 border-[3px] transition-all duration-500 ${
                          task.isCompleted 
                            ? `border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)] ${isDarkMode ? 'bg-[#0B1020] ring-[#0B1020]' : 'bg-[#F4F6FB] ring-[#F4F6FB]'}`
                            : isActive 
                              ? `border-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.65)] scale-110 ${isDarkMode ? 'bg-[#0B1020] ring-[#0B1020]' : 'bg-[#F4F6FB] ring-[#F4F6FB]'}`
                              : isDarkMode 
                                ? 'border-slate-700 bg-[#0B1020] ring-[#0B1020]' 
                                : 'border-slate-300 bg-[#F4F6FB] ring-[#F4F6FB]'
                        }`}>
                          {isActive && <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-50 scale-150"></span>}
                        </div>

                        {/* Task Card */}
                        <div className={`grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-4 md:gap-5 rounded-[24px] p-4 md:p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                          task.isCompleted 
                            ? (isDarkMode ? 'opacity-60 grayscale-[0.2] bg-[#131A2B] border-white/[0.04]' : completedCardSurface)
                            : isActive
                              ? (isDarkMode ? 'bg-gradient-to-r from-indigo-900/20 to-[#131A2B] border-indigo-500/50 shadow-[0_8px_30px_rgba(99,102,241,0.15)]' : currentCardSurface)
                              : (isDarkMode ? 'bg-[#131A2B] border-white/[0.04] hover:border-white/10' : 'bg-white/92 border-slate-200/80 hover:border-indigo-200 shadow-sm')
                        }`}>
                          
                          {/* LEFT: Icon Rail */}
                          <div className={`flex items-center justify-center md:justify-start ${isDarkMode ? 'md:border-r md:border-white/[0.04] md:pr-5' : 'md:border-r md:border-slate-200/70 md:pr-5'}`}>
                            <div 
                              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105 shadow-sm"
                              style={{ color: style.color, backgroundColor: style.backgroundColor, borderColor: style.borderColor }}
                            >
                              <Icon size={26} strokeWidth={1.5} />
                            </div>
                          </div>
                          
                          {/* CENTER: Task Details */}
                          <div className={`min-w-0 rounded-[18px] px-1 md:px-0 md:pl-4 md:pr-2 py-0 md:py-1 flex flex-col justify-center ${isDarkMode ? 'md:bg-white/[0.02]' : 'md:bg-white/45'}`}>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className={`text-[17px] font-bold truncate transition-colors ${task.isCompleted ? 'line-through' : ''} ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                {task.title}
                              </h3>
                              {isActive && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white shadow-sm">Current</span>}
                            </div>
                            <p className={`text-sm line-clamp-2 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{task.subtitle}</p>
                            
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors ${isDarkMode ? 'bg-[#0B1020] border-white/5 text-slate-300' : 'bg-white/80 border-slate-200/80 text-slate-600'}`}>
                                <Clock size={12} style={{ color: style.color }} />
                                <span>{formatTime(task.startMins)} {task.duration > 0 && `→ ${formatTime(task.endMins)}`}</span>
                              </div>
                              {task.duration > 0 && <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{formatDuration(task.duration)}</span>}
                              {linkedCourse && <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${isDarkMode ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>Course linked</span>}
                              {hasCustomLink && !linkedCourse && <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${isDarkMode ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>External link</span>}
                            </div>
                          </div>

                          {/* RIGHT: Action Rail */}
                          <div className={`flex items-center justify-end gap-3 shrink-0 pt-2 md:pt-0 ${isDarkMode ? 'md:pl-5 md:border-l md:border-white/[0.04]' : 'md:pl-5 md:border-l md:border-slate-200/70'}`}>
                            {linkedCourse && (
                              <button 
                                onClick={() => navigate(`/course/${linkedCourse.id}`)} 
                                className="relative w-32 h-14 rounded-[14px] overflow-hidden border transition-all duration-300 hover:scale-105 hover:shadow-lg group shrink-0"
                                style={{ borderColor: style.borderColor }}
                              >
                                {linkedCourse.cover ? (
                                  <img src={linkedCourse.cover} alt="Course" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: style.backgroundColor, color: style.color }}>
                                    <PlayCircle className="w-6 h-6 opacity-60" />
                                  </div>
                                )}
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-[4px] bg-black/60 backdrop-blur-md text-[8px] font-black uppercase tracking-widest text-white shadow-sm">
                                  Course
                                </div>
                              </button>
                            )}

                            {hasCustomLink && !linkedCourse && (
                              <button 
                                onClick={() => window.open(task.customLink.url, '_blank')} 
                                className="w-32 h-14 px-3 flex justify-center items-center gap-2 rounded-[14px] border font-bold text-sm transition-transform hover:scale-105 shrink-0"
                                style={{ color: style.color, backgroundColor: style.backgroundColor, borderColor: style.borderColor }}
                              >
                                <LinkIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{task.customLink.label || 'Link'}</span>
                              </button>
                            )}

                            {(linkedCourse || hasCustomLink) && (
                              <div className={`w-px h-10 rounded-full ${isDarkMode ? 'bg-white/[0.08]' : 'bg-slate-200/80'}`} />
                            )}

                            <button onClick={() => handleToggleTask(task.id)} className={`w-14 h-14 rounded-[14px] flex items-center justify-center transition-all duration-300 border-[2.5px] active:scale-90 shrink-0 ${
                               task.isCompleted ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white' 
                               : isDarkMode ? 'bg-transparent border-slate-600 hover:border-emerald-500/50 text-[#0B1020]' : 'bg-white border-slate-300 hover:border-emerald-500/50 text-white'
                             }`}>
                               <Check size={24} strokeWidth={3.5} className={`transition-all duration-300 ${task.isCompleted ? 'opacity-100 scale-100 text-white' : 'opacity-0 scale-50 text-transparent'}`} />
                            </button>
                          </div>
                          
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Progress & Events */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Progress Box */}
            <div className={`rounded-[24px] p-6 border shadow-lg text-center transition-colors ${cardSurface}`}>
              <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Daily Progress</h3>
              <p className={`text-xs uppercase tracking-widest font-semibold mb-6 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{processedRoutine.filter(t => t.isCompleted).length} of {processedRoutine.length} complete</p>
              
              <div className={`rounded-2xl border flex items-center justify-center py-6 transition-colors ${isDarkMode ? 'bg-[#0B1020] border-white/[0.02]' : 'bg-[linear-gradient(180deg,#F9FBFF_0%,#EEF3FB_100%)] border-slate-200/80'}`}>
                <div className="relative inline-flex items-center justify-center w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" strokeWidth="12" className={`fill-none ${isDarkMode ? 'stroke-[#1e293b]' : 'stroke-slate-200'}`} />
                    <circle cx="50" cy="50" r="42" strokeWidth="12" strokeDasharray={264} strokeDashoffset={264 - (progressPercentage / 100) * 264} strokeLinecap="round" className="fill-none stroke-indigo-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(progressPercentage)}%</span>
                    <span className={`text-[9px] uppercase tracking-widest font-bold mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Completed</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                 <div className={`rounded-xl p-3 text-center border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/90 border-slate-200/80 shadow-sm'}`}>
                   <div className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{processedRoutine.filter(t => t.isCompleted).length}</div>
                   <div className={`text-xs mt-1 uppercase tracking-wider font-semibold transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Done</div>
                 </div>
                 <div className={`rounded-xl p-3 text-center border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/90 border-slate-200/80 shadow-sm'}`}>
                   <div className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{processedRoutine.length - processedRoutine.filter(t => t.isCompleted).length}</div>
                   <div className={`text-xs mt-1 uppercase tracking-wider font-semibold transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Left</div>
                 </div>
              </div>
            </div>

            {/* UPCOMING EVENTS */}
            <div className={`rounded-[24px] p-6 border shadow-lg transition-colors ${cardSurface}`}>
              <div className="flex items-center gap-3 mb-5">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Upcoming Events</h3>
              </div>
              
              {upcomingEvents.length === 0 ? (
                <p className={`text-sm italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No events in the next 10 days.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((ev, idx) => (
                    <div key={idx} className={`p-3.5 rounded-2xl border transition-colors ${isDarkMode ? 'bg-[#0B1121] border-slate-700' : 'bg-[linear-gradient(180deg,#FFFFFF_0%,#F3F7FD_100%)] border-slate-200/80 shadow-sm'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">
                        {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                      </p>
                      <div className="flex justify-between items-start gap-2">
                         <p className={`text-sm font-bold line-clamp-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{ev.title}</p>
                         {ev.time && <span className={`text-xs font-bold px-2 py-1 rounded-md ${isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{ev.time}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
