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
    <div className={`min-h-screen flex flex-col font-['Inter',sans-serif] overflow-x-hidden pb-20 transition-colors duration-500 ${isDarkMode ? 'bg-[#0B1020] text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} activePage="routine" />

      {/* Ambient Glows */}
      <div className={`fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-300/30'}`}></div>

      <div className="w-[96%] max-w-[1400px] mx-auto pt-8 md:pt-12 relative z-10 space-y-8">
        
        {/* NEW UNIFIED TOP BAR & CALIBRATOR */}
        <div className={`w-full rounded-[24px] p-6 md:p-8 flex flex-col xl:flex-row items-center justify-between gap-6 md:gap-8 border shadow-sm transition-colors ${isDarkMode ? 'bg-[#131A2B] border-white/[0.05]' : 'bg-white border-slate-200'}`}>
          
          {/* Left: Date & Quote */}
          <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
            <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {todayDay}
            </h1>
            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-3">
              <p className={`font-bold text-lg ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {new Date(todayDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <span className={`hidden sm:block w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
              <p className={`text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Sparkles size={16} className="text-indigo-500" /> Consistency today. Success tomorrow.
              </p>
            </div>
          </div>

          {/* Right: Instruments */}
          <div className={`flex flex-wrap justify-center items-center p-2 rounded-[1.5rem] shadow-inner border transition-colors ${isDarkMode ? 'bg-[#0B1020] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            
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
              <button onClick={() => adjustWakeUpTime(-15)} className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'}`}>-15</button>
              
              <div className="flex flex-col items-center justify-center w-24">
                <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-blue-500">
                  {formatTime(wakeUpTime).split(' ')[0]}
                </span>
                <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formatTime(wakeUpTime).split(' ')[1]}
                </span>
              </div>
              
              <button onClick={() => adjustWakeUpTime(15)} className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'}`}>+15</button>
              <button onClick={() => setWakeUpTime(8 * 60 + 30)} className={`w-12 h-12 ml-1 flex items-center justify-center rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Reset Wake Time">
                <RotateCcw size={18} />
              </button>
            </div>

            <div className={`hidden sm:block w-px h-12 mx-2 transition-colors ${isDarkMode ? 'bg-white/[0.05]' : 'bg-slate-200'}`}></div>

            {/* Settings */}
            <button 
              onClick={() => navigate('/routine/settings')}
              className={`w-14 h-14 ml-1 mr-1 rounded-[14px] transition-all active:scale-95 flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
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
            <div className="mb-8 flex items-center gap-4">
              <h2 className={`text-2xl font-bold flex items-center gap-3 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Today's Flow
              </h2>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                {processedRoutine.length} Steps
              </span>
            </div>

            <div className="relative">
              {/* Timeline Track - Perfectly centered behind nodes */}
              <div className={`absolute top-6 bottom-6 left-[28px] w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-b ${isDarkMode ? 'from-indigo-500/50 via-blue-500/20' : 'from-indigo-500/30 via-blue-500/20'} to-transparent`}></div>
              
              <div className="space-y-6">
                {processedRoutine.length === 0 ? (
                   <p className="pl-16 text-slate-500 italic py-6">No tasks configured for {todayDay}. Tap the gear icon to build your day.</p>
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
                            ? `border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] ${isDarkMode ? 'bg-[#0B1020] ring-[#0B1020]' : 'bg-slate-50 ring-slate-50'}`
                            : isActive 
                              ? `border-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.8)] scale-110 ${isDarkMode ? 'bg-[#0B1020] ring-[#0B1020]' : 'bg-slate-50 ring-slate-50'}`
                              : isDarkMode 
                                ? 'border-slate-700 bg-[#0B1020] ring-[#0B1020]' 
                                : 'border-slate-300 bg-slate-50 ring-slate-50'
                        }`}>
                          {isActive && <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-60 scale-150"></span>}
                        </div>

                        {/* Flex Horizontal Task Card */}
                        <div className={`flex flex-col md:flex-row items-center justify-between rounded-[20px] p-4 md:p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                          task.isCompleted 
                            ? (isDarkMode ? 'opacity-60 grayscale-[0.2] bg-[#131A2B] border-white/[0.04]' : 'opacity-60 grayscale-[0.2] bg-slate-100 border-slate-200')
                            : isActive
                              ? (isDarkMode ? 'bg-gradient-to-r from-indigo-900/20 to-[#131A2B] border-indigo-500/50 shadow-[0_8px_30px_rgba(99,102,241,0.15)]' : 'bg-indigo-50/50 border-indigo-300 shadow-[0_8px_30px_rgba(99,102,241,0.1)]')
                              : (isDarkMode ? 'bg-[#131A2B] border-white/[0.04] hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm')
                        }`}>
                          
                          {/* LEFT: Icon & Text Details */}
                          <div className="flex-1 flex items-center gap-4 md:gap-5 min-w-0 w-full">
                            {/* Icon Box */}
                            <div 
                              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105"
                              style={{ color: style.color, backgroundColor: style.backgroundColor, borderColor: style.borderColor }}
                            >
                              <Icon size={26} strokeWidth={1.5} />
                            </div>
                            
                            {/* Text Block */}
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className={`text-[17px] font-bold truncate transition-colors ${task.isCompleted ? 'line-through' : ''} ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                  {task.title}
                                </h3>
                                {isActive && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white shadow-sm">Current</span>}
                              </div>
                              <p className={`text-sm line-clamp-1 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{task.subtitle}</p>
                              
                              <div className="flex items-center gap-2 mt-2.5">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors ${isDarkMode ? 'bg-[#0B1020] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                  <Clock size={12} style={{ color: style.color }} />
                                  <span>{formatTime(task.startMins)} {task.duration > 0 && `→ ${formatTime(task.endMins)}`}</span>
                                </div>
                                {task.duration > 0 && <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{formatDuration(task.duration)}</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* RIGHT: Action & Checkbox (Vertical Center Alignment) */}
                          <div className="flex items-center justify-end gap-3 shrink-0 mt-4 md:mt-0 w-full md:w-auto">
                            
                            {/* POPPY Link Buttons */}
                            {linkedCourse && (
                              <button 
                                onClick={() => navigate(`/course/${linkedCourse.id}`)} 
                                className="relative w-28 h-14 rounded-[14px] overflow-hidden border transition-all duration-300 hover:scale-105 hover:shadow-lg group shrink-0"
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
                                className="w-28 h-14 px-3 flex justify-center items-center gap-2 rounded-[14px] border font-bold text-sm transition-transform hover:scale-105 shrink-0"
                                style={{ color: style.color, backgroundColor: style.backgroundColor, borderColor: style.borderColor }}
                              >
                                <LinkIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{task.customLink.label || 'Link'}</span>
                              </button>
                            )}

                            {/* Crisp Centered Checkbox */}
                            <button onClick={() => handleToggleTask(task.id)} className={`w-14 h-14 ml-2 rounded-[14px] flex items-center justify-center transition-all duration-300 border-[2.5px] active:scale-90 shrink-0 ${
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
            <div className={`rounded-[24px] p-6 border shadow-lg text-center ${isDarkMode ? 'bg-[#131A2B] border-white/[0.04]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Daily Progress</h3>
              <p className={`text-xs uppercase tracking-widest font-semibold mb-6 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{processedRoutine.filter(t => t.isCompleted).length} of {processedRoutine.length} complete</p>
              
              <div className={`rounded-2xl border flex items-center justify-center py-6 transition-colors ${isDarkMode ? 'bg-[#0B1020] border-white/[0.02]' : 'bg-slate-50 border-slate-100'}`}>
                <div className="relative inline-flex items-center justify-center w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" strokeWidth="12" className={`fill-none ${isDarkMode ? 'stroke-[#1e293b]' : 'stroke-slate-200'}`} />
                    <circle cx="50" cy="50" r="42" strokeWidth="12" strokeDasharray={264} strokeDashoffset={264 - (progressPercentage / 100) * 264} strokeLinecap="round" className="fill-none stroke-blue-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(progressPercentage)}%</span>
                    <span className={`text-[9px] uppercase tracking-widest font-bold mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Completed</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                 <div className={`rounded-xl p-3 text-center border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                   <div className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{processedRoutine.filter(t => t.isCompleted).length}</div>
                   <div className={`text-xs mt-1 uppercase tracking-wider font-semibold transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Done</div>
                 </div>
                 <div className={`rounded-xl p-3 text-center border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                   <div className={`text-2xl font-bold transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{processedRoutine.length - processedRoutine.filter(t => t.isCompleted).length}</div>
                   <div className={`text-xs mt-1 uppercase tracking-wider font-semibold transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Left</div>
                 </div>
              </div>
            </div>

            {/* UPCOMING EVENTS */}
            <div className={`rounded-[24px] p-6 border shadow-lg transition-colors ${isDarkMode ? 'bg-[#131A2B] border-white/[0.04]' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-5">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Upcoming Events</h3>
              </div>
              
              {upcomingEvents.length === 0 ? (
                <p className={`text-sm italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No events in the next 10 days.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((ev, idx) => (
                    <div key={idx} className={`p-3.5 rounded-2xl border transition-colors ${isDarkMode ? 'bg-[#0B1121] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
