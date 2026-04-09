import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- UI COMPONENTS ---
import { Header } from '../components/ui/Header';

// --- ICON IMPORTS ---
import { 
  Calendar as CalendarIcon, CheckSquare, Square, Clock, 
  BookOpen, ChevronRight, Copy, ChevronLeft, Plus, Trash2, PlayCircle, Bell,
  X, Target, LayoutGrid, PenTool,MessageCircleQuestion,ChevronDown, AlignLeft
} from 'lucide-react';

// --- HOOKS & UTILS ---
import { getTodayDay, getTodayDateStr, formatFullDate, getFutureDateArray } from '../utils/dateUtils';
import { calculateCourseProgress } from '../utils/metrics';


export default function GoalsPage({ playlists, userData, initialProductivityData, isDarkMode, setIsDarkMode, onSync }) {
    const navigate = useNavigate();
    const { api } = useAuth();
    const initialWeeklyPlan = useMemo(() => initialProductivityData?.weeklyPlan || {}, [initialProductivityData]);
    const initialCompletionLog = useMemo(() => initialProductivityData?.completionLog || {}, [initialProductivityData]);
    const initialMonthlyEvents = useMemo(() => initialProductivityData?.monthlyEvents || {}, [initialProductivityData]);
  
  // Base States
  const [activeTab, setActiveTab] = useState('daily'); 
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Data States
  const [weeklyPlan, setWeeklyPlan] = useState(() => ({
    Monday: { focus: "", subjects: [] },
    Tuesday: { focus: "", subjects: [] },
    Wednesday: { focus: "", subjects: [] },
    Thursday: { focus: "", subjects: [] },
    Friday: { focus: "", subjects: [] },
    Saturday: { focus: "", subjects: [] },
    Sunday: { focus: "", subjects: [] },
    ...initialWeeklyPlan
  }));
  const [monthlyEvents, setMonthlyEvents] = useState(() => initialMonthlyEvents);
  const [completionLog, setCompletionLog] = useState(() => initialCompletionLog);

  // Floating Elements
  const [reminderPopup, setReminderPopup] = useState(null);

  // --- CENTRALIZED DATE LOGIC ---
  const todayDay = getTodayDay();
  const todayDateStr = getTodayDateStr();
  const formattedToday = formatFullDate(new Date());
  
  // Maintained your exact state structure (Array) to preserve your existing working logic
  const tenDaysStr = getFutureDateArray(10); 
  
  const todaysData = weeklyPlan[todayDay] || { focus: "", subjects: [] };
  const goalsTabs = [
    { id: 'daily', label: 'Daily View', mobileLabel: 'Daily', icon: CheckSquare },
    { id: 'weekly', label: 'Weekly Plan', mobileLabel: 'Weekly', icon: LayoutGrid },
    { id: 'monthly', label: 'Monthly Plan', mobileLabel: 'Monthly', icon: CalendarIcon }
  ];
  const activeTabMeta = goalsTabs.find(tab => tab.id === activeTab) || goalsTabs[0];
  const ActiveTabIcon = activeTabMeta.icon;
  
  // Progress Logic
  const allTodaysTasks = todaysData.subjects.flatMap(s => s.tasks || []);

  // Upcoming Events
  const upcomingEvents = useMemo(() => {
      const events = [];
      Object.keys(monthlyEvents).forEach(date => {
          // Check if the date is present in the 10-day window array
          if (tenDaysStr.includes(date)) {
              (monthlyEvents[date] || []).forEach(ev => events.push({ ...ev, date }));
          }
      });
      return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [monthlyEvents, tenDaysStr]);

  useEffect(() => {
    const hasInitialProductivity =
      Object.keys(initialWeeklyPlan).length > 0 ||
      Object.keys(initialCompletionLog).length > 0 ||
      Object.keys(initialMonthlyEvents).length > 0;

    if (hasInitialProductivity) return;

    const loadProductivity = async () => {
        try {
            // Use the api instance from your AuthContext if available, 
            // or a fetcher passed from App.jsx
            const { data } = await api.get('/productivity');
            if (data) {
                if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
                if (data.completionLog) setCompletionLog(data.completionLog);
                if (data.monthlyEvents) setMonthlyEvents(data.monthlyEvents);
            }
        } catch (err) {
            console.error("Failed to load cloud productivity data", err);
        }
    };
    loadProductivity();
}, [api, initialCompletionLog, initialMonthlyEvents, initialWeeklyPlan]);

  // Notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") Notification.requestPermission();
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      allTodaysTasks.forEach(task => {
        if (task?.time === currentTime && !completionLog[`${todayDateStr}_${task?.id}`]) {
          const notifKey = `notified_${todayDateStr}_${task.id}`;
          if (!sessionStorage.getItem(notifKey)) {
             setReminderPopup(task);
             setTimeout(() => setReminderPopup(null), 8000);
             if ("Notification" in window && Notification.permission === "granted") {
                new Notification('Course Flow Reminder', { body: `Time for: ${task.text}` });
             }
             sessionStorage.setItem(notifKey, 'true');
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [allTodaysTasks, todayDateStr, completionLog]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tick Checkbox Handler
  const handleToggleTask = (day, subjectId, taskId) => {
      setCompletionLog(prev => {
          const logKey = `${todayDateStr}_${taskId}`;
          const updatedLog = { ...prev };

          if (updatedLog[logKey]) {
              delete updatedLog[logKey];
          } else {
              updatedLog[logKey] = true;
          }

          onSync({ completionLog: updatedLog });
          return updatedLog;
      });
  };

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 font-['Inter',sans-serif] ${isDarkMode ? 'bg-[#0B1121] text-slate-300' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 1. GLOBAL HEADER */}
      <Header 
         isDarkMode={isDarkMode} 
         setIsDarkMode={setIsDarkMode} 
         activePage="goals" 
      />
  
      
      <div className="flex-1 w-[96%] max-w-[1600px] mx-auto pt-1 sm:pt-3 pb-8  z-10">
      
        <div className="sticky top-[70px] sm:top-[80px] z-40 mb-4 sm:mb-5 mr-12">
          <div className="flex justify-end relative">
            <button
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-md backdrop-blur-2xl transition-all ${
                isDarkMode
                  ? 'bg-[#0f172a]/72 border-white/10 text-slate-100 shadow-black/10 hover:bg-[#0f172a]/82'
                  : 'bg-white/78 border-slate-200/90 text-slate-800 shadow-slate-200/50 hover:bg-white/90'
              }`}
            >
              <ActiveTabIcon className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className="text-sm font-semibold">
                {activeTabMeta.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} ${
                  isMobileNavOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isMobileNavOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsMobileNavOpen(false)}
                ></div>
                <div
                  className={`absolute right-0 top-[calc(100%+10px)] z-40 w-56 rounded-[1.25rem] border p-2 shadow-xl backdrop-blur-3xl ${
                    isDarkMode
                      ? 'bg-[#0f172a]/92 border-white/10 shadow-black/20'
                      : 'bg-white/94 border-slate-200 shadow-slate-300/30'
                  }`}
                >
                  {goalsTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 rounded-[0.95rem] px-4 py-3 text-left transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm'
                            : isDarkMode
                            ? 'text-slate-300 hover:bg-white/5'
                            : 'text-slate-700 hover:bg-slate-100/90'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <p className="text-sm font-bold">{tab.label}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="min-w-0">
            {/* --- REDESIGNED DAILY TAB VIEW --- */}
                {activeTab === 'daily' && (
                  <DailyView 
                    todaysData={todaysData}
                    completionLog={completionLog}
                    handleToggleTask={handleToggleTask}
                    setWeeklyPlan={setWeeklyPlan}
                    todayDay={todayDay}
                    playlists={playlists}
                    userData={userData} // Passed correctly for metrics utility
                    navigate={navigate}
                    isDarkMode={isDarkMode}
                    formattedToday={formattedToday}
                    todayDateStr={todayDateStr}
                    upcomingEvents={upcomingEvents}
                    onSync={onSync}

                  />
                )}

                {/* --- WEEKLY TAB VIEW (Redesigned Grid) --- */}
                {activeTab === 'weekly' && (
                  <WeeklyConfig 
                      plan={weeklyPlan} 
                      setPlan={setWeeklyPlan} 
                      playlists={playlists} 
                      isDarkMode={isDarkMode} 
                      todayDay={todayDay}
                      onSync={onSync}
                  />
                )}

                {/* --- MONTHLY TAB VIEW (Redesigned Calendar & Agenda) --- */}
                {activeTab === 'monthly' && (
                  <MonthlyConfig 
                      events={monthlyEvents} 
                      setEvents={setMonthlyEvents} 
                      todayDateStr={todayDateStr} 
                      isDarkMode={isDarkMode} 
                      onSync={onSync}
                   />
                )}
        </div>
      </div>

        {/* FLOATING ELEMENTS */}
        {reminderPopup && (
          <div className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-blue-400 animate-bounce" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Reminder</p>
                <p className="text-sm font-bold text-white line-clamp-2">{reminderPopup.text}</p>
              </div>
              <button onClick={() => setReminderPopup(null)} className="p-1 text-slate-500 hover:text-white absolute top-2 right-2"><X className="w-4 h-4"/></button>
          </div>
        )}

    </div>
  );
}


// CUSTOM TIME PICKER COMPONENT

function CustomTimePicker({ value, onChange, isDarkMode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Default empty (No Time)
  const [internalTime, setInternalTime] = React.useState("");

  // Sync with parent value
  React.useEffect(() => {
    if (typeof value === "string" && value.includes(":")) {
      const parts = value.split(":");

      const hour = String(parts[0] || "00").padStart(2, "0");
      const minute = String(parts[1] || "00").padStart(2, "0");

      setInternalTime(`${hour}:${minute}`);
    } else {
      setInternalTime(""); // No Time
    }
  }, [value]);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Data
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const [currentHour = "00", currentMinute = "00"] =
    internalTime?.split(":") || [];

  // Handlers
  const handleHourClick = (h) => {
    const newTime = `${h}:${currentMinute}`;
    setInternalTime(newTime);
    onChange && onChange(newTime);
  };

  const handleMinuteClick = (m) => {
    const newTime = `${currentHour}:${m}`;
    setInternalTime(newTime);
    onChange && onChange(newTime);
    setIsOpen(false);
  };

  const handleClearTime = () => {
    setInternalTime("");
    onChange && onChange("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-[110px] px-3 py-2.5 rounded-xl border text-sm font-semibold outline-none flex items-center justify-between transition-all shadow-inner
        ${
          isDarkMode
            ? "bg-[#0F172A]/50 border-slate-700 text-slate-300 hover:border-[#38bdf8]"
            : "bg-slate-50 border-slate-300 text-slate-700 hover:border-[#38bdf8]"
        }`}
      >
        <span>{internalTime || "No Time"}</span>
        <Clock className="w-3.5 h-3.5 opacity-50" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute bottom-[calc(100%+8px)] left-0 w-52 p-3 rounded-2xl border backdrop-blur-3xl z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200
          ${
            isDarkMode
              ? "bg-[#0B1121]/95 border-slate-700"
              : "bg-white/95 border-slate-200"
          }`}
        >

          {/* Time Picker */}
          <div className="flex gap-2">
            {/* Hours */}
            <div className="flex-1 h-40 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1 border-r border-slate-500/20">
              {hours.map((h) => (
                <button
                  key={h}
                  onClick={() => handleHourClick(h)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors
                  ${
                    currentHour === h
                      ? "bg-[#38bdf8] text-slate-900 shadow-sm"
                      : isDarkMode
                      ? "text-slate-400 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div className="flex-1 h-40 overflow-y-auto custom-scrollbar flex flex-col gap-1 pl-1">
              {minutes.map((m) => (
                <button
                  key={m}
                  onClick={() => handleMinuteClick(m)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors
                  ${
                    currentMinute === m
                      ? "bg-[#38bdf8] text-slate-900 shadow-sm"
                      : isDarkMode
                      ? "text-slate-400 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleClearTime}
            className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-colors border
              ${
                isDarkMode
                  ? "text-blue-400 border-red-400/30 hover:bg-red-400/10"
                  : "text-red-600 border-red-300 hover:bg-red-50"
              }`}
          >
            Clear Time
          </button>
          
        </div>
      )}
    </div>
  );
}


// ==========================================
// DAILY VIEW
function DailyView({ 
  todaysData, 
  completionLog, 
  handleToggleTask,
  setWeeklyPlan,
  todayDay,
  playlists, 
  userData,
  navigate, 
  isDarkMode, 
  formattedToday, 
  todayDateStr,
  upcomingEvents,
  onSync
}) {
  const carouselRef = useRef(null);
  const [taskInputs, setTaskInputs] = useState({});
  const hasMultipleSubjects = (todaysData?.subjects?.length || 0) > 1;

  const openActionLink = useCallback((url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleAddDailyTask = (subId) => {
    const text = taskInputs[subId]?.text;
    const time = taskInputs[subId]?.time || ''; 
    if (!text || !text.trim()) return;
    
    setWeeklyPlan(prev => {
      const updatedSubs = prev[todayDay].subjects.map(s => {
        if(s.id !== subId) return s;
        return { ...s, tasks: [...(s.tasks||[]), { id: Date.now().toString(), text, time }] };
      });
      const newPlan = { ...prev, [todayDay]: { ...prev[todayDay], subjects: updatedSubs } };
      
      onSync({ weeklyPlan: newPlan });
      return newPlan;
    });

    setTaskInputs(prev => ({ ...prev, [subId]: { text: '', time: '' } }));
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -window.innerWidth * 1, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: window.innerWidth * 1, behavior: 'smooth' });
    }
  };

  const CircularProgress = ({ progress }) => {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <div className="relative mt-3 flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/5 shadow-inner shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-blue-500/10" />
          <circle 
             cx="26" cy="26" r={radius} 
             stroke="currentColor" strokeWidth="6" fill="transparent" 
             strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
             strokeLinecap="round"
             className="text-[#b76cfc] transition-all duration-1000 ease-out" 
          />
        </svg>
        <span className={`absolute text-2xs font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
           {progress}%
        </span>
      </div>
    );
  };

  return (
    <div className="relative w-full flex flex-col pb-12 animate-in fade-in duration-700 min-h-[calc(100vh-80px)]">
      
      {/* FIXED BACKGROUND OVERLAY */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
           style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')` }}
         />
         <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-[#0B1121]/80 via-[#0B1121]/90 to-[#0B1121]' : 'bg-gradient-to-b from-slate-50/80 via-slate-50/90 to-slate-50'}`} />
      </div>

      {/* HERO SECTION */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 mb-6 sm:mb-8 shrink-0 pt-2">
         <p className={`text-sm font-bold tracking-widest uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {formattedToday}
         </p>
         <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight pl-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Today's Goals
         </h1>
         <p className={`text-base md:text-lg font-medium italic max-w-3xl leading-relaxed pl-1 mt-1 ${isDarkMode ? 'text-blue-300/80' : 'text-blue-600/80'}`}>
            "{todaysData?.focus || "Focus on consistency. Execution builds mastery."}"
         </p>
      </div>

      {/* SCROLLABLE SUBJECT PANELS (CAROUSEL) */}
      <div className="relative z-10 w-full shrink-0 group/carousel">
        
        {hasMultipleSubjects && (
          <>
            <button onClick={scrollLeft} className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-2 transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 hover:scale-110 text-white/50 hover:text-white drop-shadow-lg">
               <ChevronLeft className="w-12 h-12" />
            </button>
            <button onClick={scrollRight} className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-2 transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 hover:scale-110 text-white/50 hover:text-white drop-shadow-lg">
               <ChevronRight className="w-12 h-12" />
            </button>
          </>
        )}

        <div
          ref={carouselRef}
          className={`w-full no-scrollbar flex items-stretch pb-6 sm:pb-8 ${
            hasMultipleSubjects
              ? 'overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 sm:gap-8 lg:gap-12 px-1 sm:px-0'
              : 'overflow-visible justify-center'
          }`}
        >
          {(!todaysData?.subjects || todaysData.subjects.length === 0) ? (
            <div className={`w-full shrink-0 p-12 rounded-[2rem] border backdrop-blur-3xl flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10 shadow-lg shadow-black/20' : 'bg-white/40 border-slate-200 shadow-md'}`}>
               <LayoutGrid className={`w-12 h-12 mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
               <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>No subjects scheduled</h2>
               <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Use the "Weekly Plan" button to configure your week.</p>
            </div>
          ) : (
            todaysData.subjects.map(sub => {
              const course = (playlists || []).find(p => p.id === sub.courses?.[0]); 
              
              // NEW OPTIMIZED PROGRESS LOGIC USING UTILITIES
              let progress = 0;
              if (course && course.videoCount > 0) {
                 progress = calculateCourseProgress(course, userData?.[course.id]);
              }

              return (
                <div
                  key={sub.id}
                  className={`flex flex-col ${
                    hasMultipleSubjects
                      ? 'shrink-0 snap-center w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)] lg:w-[calc(100vw-6rem)] max-w-[1020px] mx-1 sm:mx-4 lg:mx-6'
                      : 'w-full max-w-[1020px]'
                  }`}
                >
                   <div className={`rounded-[1.75rem] p-3 sm:p-4 lg:p-5 border backdrop-blur-3xl shadow-lg transition-all h-full ${
                     isDarkMode ? 'bg-[#07101f]/60 border-white/10 shadow-black/20' : 'bg-white/55 border-white/70 shadow-slate-300/40'
                   }`}>
                   <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 h-full min-h-[300px]">
                      
                      {/* LEFT: TO-DO CARD */}
                      <div className={`xl:col-span-3 rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 lg:p-6 border backdrop-blur-3xl flex flex-col transition-all relative overflow-hidden
                         ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10 shadow-lg shadow-black/20' : 'bg-white/40 border-white/60 shadow-md'}`}
                      >
                         <div className="absolute top-0 right-0 max-w-[70%] px-3 sm:px-5 py-2 bg-[#1e1b4b]/60 backdrop-blur-md rounded-bl-3xl rounded-tr-[1.25rem] sm:rounded-tr-[1.5rem]">
                            <span className="block truncate text-xs sm:text-sm font-black tracking-widest text-[#84c8fc] drop-shadow-md">{sub.name}</span>
                         </div>

                         <div className="flex items-center gap-4 mb-4 relative z-10 ">
                           <h3 className={`text-base font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900/60'}`}>To Do List</h3>
                         </div>
                         
                         <div className="flex flex-col flex-1 gap-1.5 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 max-h-[220px] relative z-10">
                            {(sub.tasks || []).length === 0 && <p className="text-slate-500 italic text-xs">No tasks assigned.</p>}
                            {(sub.tasks || []).map(task => {
                               const isDone = !!completionLog[`${todayDateStr}_${task.id}`];
                               return (
                                 <div key={task.id} onClick={() => handleToggleTask(todayDay, sub.id,task.id)} className={`group flex items-start justify-between gap-3 px-2.5 sm:px-3 py-2 rounded-xl cursor-pointer transition-all border
                                   ${isDone 
                                     ? (isDarkMode ? 'bg-[#38bdf8]/10 border-[#38bdf8]/20' : 'bg-[#7dd3fc]/30 border-[#38bdf8]/30') 
                                     : (isDarkMode ? 'bg-transparent border-transparent hover:bg-white/5' : 'bg-transparent border-transparent hover:bg-white hover:shadow-sm')}`}
                                 >
                                    <div className="flex items-start gap-3 min-w-0">
                                      <button className={`transition-colors ${isDone ? 'text-[#38bdf8]' : (isDarkMode ? 'text-slate-500 group-hover:text-[#38bdf8]' : 'text-slate-400 group-hover:text-blue-500')}`}>
                                         {isDone ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                      </button>
                                      <span className={`text-xs sm:text-sm font-medium transition-all break-words ${isDone ? (isDarkMode ? 'text-slate-400 line-through opacity-60' : 'text-slate-500 line-through opacity-60') : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                                         {task.text}
                                         {task.time && <span className={`ml-2 text-xs opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>(Today {task.time})</span>}
                                      </span>
                                    </div>
                                 </div>
                               );
                            })}
                         </div>

                        {/* Direct Inline Add Task with Time Picker */}
                        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 border-t border-white/10 pt-4">
                          <input 
                            value={taskInputs[sub.id]?.text || ''}
                            onChange={e => setTaskInputs({...taskInputs, [sub.id]: { ...taskInputs[sub.id], text: e.target.value }})}
                            onKeyDown={e => e.key === 'Enter' && handleAddDailyTask(sub.id)}
                            placeholder="Add a new task for today..."
                            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:border-[#38bdf8] transition-all shadow-inner ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white/60 border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                          />
                          
                          <CustomTimePicker 
                            value={taskInputs[sub.id]?.time || ''}
                            onChange={(newTime) => setTaskInputs({...taskInputs, [sub.id]: { ...taskInputs[sub.id], time: newTime }})}
                            isDarkMode={isDarkMode}
                          />

                          <button onClick={() => handleAddDailyTask(sub.id)} className="w-full sm:w-auto px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs bg-[#5ebbea] hover:bg-[#2dd4bf] text-slate-900 shadow-md transition-colors shrink-0">
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>
                      </div>

                      {/* RIGHT: COURSE & ACTIONS */}
                      <div className="xl:col-span-2 flex flex-col gap-3 sm:gap-5">
                         
                         {/* 1. FEATURED COURSE CARD */}
                         <div className={`flex-1 rounded-[1.25rem] sm:rounded-[1.5rem] p-3 sm:p-4 border backdrop-blur-3xl flex flex-col justify-center transition-all
                            ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10 shadow-lg shadow-black/20' : 'bg-white/40 border-white/60 shadow-md'}`}
                         >
                            <div className="flex justify-between items-start ">
                               <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Featured Course</h3>
                               <CircularProgress progress={progress} />
                            </div>
                            
                            {course ? (
                               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 ">
                                  <div className="w-full sm:w-36 h-24 rounded-xl bg-slate-800 overflow-hidden relative shadow-sm shrink-0 border border-white/5">
                                     {course.cover ? (
                                        <img src={course.cover} className="w-full h-full object-cover" alt="cover" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center"><PlayCircle className="w-6 h-6 text-blue-500" /></div>
                                     )}
                                  </div>
                                  
                                  <div className="flex-1 w-full flex flex-col justify-center overflow-hidden pr-0 sm:pr-2">
                                     <h4 className={`text-sm font-bold truncate mb-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{course.title}</h4>
                                     <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{course.videoCount || 0} modules</p>
                                  </div>
                                  
                                  <button onClick={() => navigate(`/course/${course.id}`)} className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-[#7dd3fc] hover:bg-[#38bdf8] text-slate-900 rounded-full text-xs font-bold shadow-sm transition-colors flex items-center justify-center">
                                     Continue Course
                                  </button>
                               </div>
                            ) : (
                               <div className={`mt-5 rounded-xl border border-dashed flex flex-row items-center justify-center gap-3 p-6 ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                                  <BookOpen className="w-5 h-5 opacity-50" />
                                  <p className="text-sm font-medium">No course attached.</p>
                               </div>
                            )}
                         </div>

                         {/* 2. QUICK ACTIONS CARD */}
                         <div className={`rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 lg:p-6 border backdrop-blur-3xl transition-all ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10 shadow-lg shadow-black/20' : 'bg-white/40 border-white/60 shadow-md'}`}  >
                            <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                               <button
                                 onClick={() => openActionLink(sub.actionUrls?.notes?.url)}
                                 disabled={!sub.actionUrls?.notes?.url}
                                 className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-full border transition-all min-w-0 ${
                                   sub.actionUrls?.notes?.url ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                                 }
                                 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-700 shadow-sm'}`}>
                                  <PenTool className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                                  <span className="text-xs font-bold truncate">{sub.actionUrls?.notes?.label || "Notes"}</span>
                               </button>

                               <button
                                 onClick={() => openActionLink(sub.actionUrls?.doubts?.url)}
                                 disabled={!sub.actionUrls?.doubts?.url}
                                 className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-full border transition-all min-w-0 ${
                                   sub.actionUrls?.doubts?.url ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                                 }
                                 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-700 shadow-sm'}`}>
                                  <MessageCircleQuestion className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                                  <span className="text-xs font-bold truncate">{sub.actionUrls?.doubts?.label || "Resources"}</span>
                               </button>

                               <button
                                 onClick={() => openActionLink(sub.actionUrls?.goals?.url)}
                                 disabled={!sub.actionUrls?.goals?.url}
                                 className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-full border transition-all min-w-0 ${
                                   sub.actionUrls?.goals?.url ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                                 }
                                 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-700 shadow-sm'}`}>
                                  <Target className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                                  <span className="text-xs font-bold truncate">{sub.actionUrls?.goals?.label || "Goals"}</span>
                               </button>

                               <button
                                 onClick={() => openActionLink(sub.actionUrls?.calendar?.url)}
                                 disabled={!sub.actionUrls?.calendar?.url}
                                 className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-full border transition-all min-w-0 ${
                                   sub.actionUrls?.calendar?.url ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                                 }
                                 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-700 shadow-sm'}`}>
                                  <CalendarIcon className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                                  <span className="text-xs font-bold truncate">{sub.actionUrls?.calendar?.label || "Workshop"}</span>
                               </button>
                            </div>
                         </div>

                      </div>
                   </div>
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- UPCOMING EVENTS --- */}
      <div className={`relative z-10 w-full px-4 sm:px-6 lg:px-12 mt-auto transition-opacity duration-500 ${upcomingEvents?.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
        <div className={`w-full rounded-[1.5rem] p-5 md:p-6 flex flex-col md:flex-row gap-5 items-center shadow-lg border ${isDarkMode ? 'bg-[#0B1121]/90 backdrop-blur-xl border-slate-700' : 'bg-white/90 backdrop-blur-xl border-slate-200'}`}>
           <div className="shrink-0 flex flex-col items-center md:items-start text-center md:text-left md:w-40 md:border-r md:border-slate-500/20 md:pr-5">
              <CalendarIcon className="w-6 h-6 text-blue-500 mb-1.5" />
              <h3 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Upcoming</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Next 10 Days</p>
           </div>
           <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar w-full">
              {(upcomingEvents || []).map((ev, idx) => (
                <div key={idx} className={`shrink-0 w-56 p-4 rounded-xl border ${isDarkMode ? 'bg-[#151E32]/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                   <p className="text-[12px] font-black uppercase tracking-widest text-blue-500 mb-1.5">
                     {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                   </p>
                   <p className={`text-sm font-bold line-clamp-2 leading-snug ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                     {ev.title}
                   </p>
                </div>
              ))}
           </div>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// WEEKLY CONFIG 

function WeeklyConfig({ plan, setPlan, playlists, isDarkMode, todayDay, onSync }) {
  const [selectedDay, setSelectedDay] = useState(todayDay || 'Monday');
  const [taskInputs, setTaskInputs] = useState({}); 
  const [editingLink, setEditingLink] = useState({}); 
  const [openCourseSelect, setOpenCourseSelect] = useState(null); 

  const [copyMenuOpen, setCopyMenuOpen] = useState(null);
  const [selectedCopyDays, setSelectedCopyDays] = useState([]);

  const handleCopySubject = (subId) => {
    if (selectedCopyDays.length === 0) return;

    const subjectToCopy = plan[selectedDay].subjects.find(s => s.id === subId);
    if (!subjectToCopy) return;

    const newWeeklyPlan = { ...plan };

    selectedCopyDays.forEach(day => {
      const duplicatedSubject = {
        ...subjectToCopy,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        tasks: (subjectToCopy.tasks || []).map(t => ({
          ...t,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }))
      };

      const daySubjects = newWeeklyPlan[day].subjects || [];
      newWeeklyPlan[day] = {
        ...newWeeklyPlan[day],
        subjects: [...daySubjects, duplicatedSubject]
      };
    });

    setPlan(newWeeklyPlan);
    onSync({ weeklyPlan: newWeeklyPlan });
    
    // Reset states
    setCopyMenuOpen(null);
    setSelectedCopyDays([]);
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayData = plan[selectedDay] || { focus: '', subjects: [] };

  useEffect(() => {
    if (!dayData.subjects || dayData.subjects.length === 0) {
      setPlan(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          subjects: [{ 
            id: Date.now().toString(), 
            name: "", 
            tasks: [], 
            courses: [], 
            actionUrls: {} 
          }]
        }
      }));
    }
  }, [dayData.subjects, selectedDay, setPlan]);

  const updateFocus = (val) => setPlan(prev => ({ ...prev, [selectedDay]: { ...prev[selectedDay], focus: val } }));
  
  const handleAddSubject = () => {
    const newSub = { id: Date.now().toString(), name: "", tasks: [], courses: [], actionUrls: {} };
    const newWeeklyPlan = { 
      ...plan, 
      [selectedDay]: { ...plan[selectedDay], subjects: [...(plan[selectedDay]?.subjects||[]), newSub] } 
    };
    setPlan(newWeeklyPlan);
    onSync({ weeklyPlan: newWeeklyPlan });
  };

  const deleteSubject = (subId) => {
    const newWeeklyPlan = { 
      ...plan, 
      [selectedDay]: { ...plan[selectedDay], subjects: plan[selectedDay].subjects.filter(s => s.id !== subId) } 
    };
    setPlan(newWeeklyPlan);
    onSync({ weeklyPlan: newWeeklyPlan });
  };

  const updateSubjectField = (subId, field, val) => {
    const updatedSubs = plan[selectedDay].subjects.map(s => s.id === subId ? { ...s, [field]: val } : s);
    const newWeeklyPlan = { ...plan, [selectedDay]: { ...plan[selectedDay], subjects: updatedSubs } };
    
    setPlan(newWeeklyPlan);
    onSync({ weeklyPlan: newWeeklyPlan });
  };

  const updateActionUrl = (subId, key, field, val) => {
    const updatedSubs = plan[selectedDay].subjects.map(s => {
      if (s.id !== subId) return s;
      const currentAction = s.actionUrls?.[key] || { label: '', url: '' };
      return { ...s, actionUrls: { ...(s.actionUrls || {}), [key]: { ...currentAction, [field]: val } } };
    });
    const newWeeklyPlan = { ...plan, [selectedDay]: { ...plan[selectedDay], subjects: updatedSubs } };
    
    setPlan(newWeeklyPlan);
    onSync({ weeklyPlan: newWeeklyPlan });
  };

  // Example: Add Task in Weekly View
  const handleAddTask = (subId) => {
      const text = taskInputs[subId]?.text;
      const time = taskInputs[subId]?.time || ''; 
      if (!text?.trim()) return;
      
      setPlan(prev => {
          const updatedSubs = (prev[selectedDay]?.subjects || []).map(s => {
              if (s.id !== subId) return s;
              return { ...s, tasks: [...(s.tasks || []), { id: Date.now().toString(), text, time }] };
          });
          const newWeeklyPlan = { ...prev, [selectedDay]: { ...prev[selectedDay], subjects: updatedSubs } };
          
          onSync({ weeklyPlan: newWeeklyPlan });
          return newWeeklyPlan;
      });

      setTaskInputs(prev => ({ ...prev, [subId]: { text: '', time: '' } }));
  };

  const deleteTask = (subId, taskId) => {
    const updatedSubs = plan[selectedDay].subjects.map(s => {
      if(s.id !== subId) return s;
      return { ...s, tasks: s.tasks.filter(t => t.id !== taskId) };
    });
    const newWeeklyPlan = { ...plan, [selectedDay]: { ...plan[selectedDay], subjects: updatedSubs } };
    
    setPlan(newWeeklyPlan);
    onSync({ weeklyPlan: newWeeklyPlan });
  };

  const linkTypes = [
    { key: 'notes', icon: PenTool, defaultLabel: 'Notes', colorStyle: isDarkMode ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-400' },
    { key: 'doubts', icon: MessageCircleQuestion, defaultLabel: 'Doubts', colorStyle: isDarkMode ? 'text-amber-400 border-amber-400' : 'text-amber-600 border-amber-400' },
    { key: 'goals', icon: Target, defaultLabel: 'Goals', colorStyle: isDarkMode ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-400' },
    { key: 'calendar', icon: CalendarIcon, defaultLabel: 'Calendar', colorStyle: isDarkMode ? 'text-purple-400 border-purple-400' : 'text-purple-600 border-purple-400' }
  ];

  return (
    <div className="relative w-full flex flex-col pb-12 animate-in fade-in duration-700 min-h-[calc(100vh-80px)]">
      
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
           style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')` }}
         />
         <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-[#0B1121]/80 via-[#0B1121]/90 to-[#0B1121]' : 'bg-gradient-to-b from-slate-50/80 via-slate-50/90 to-slate-50'}`} />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col px-4 sm:px-6 lg:px-12 pt-6 sm:pt-8 pb-12 h-full">
         
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-7 sm:mb-9">
               <h3 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Configure <span className="text-blue-500">{selectedDay}</span>
               </h3>
               <div className="flex flex-col w-full sm:max-w-xl">
                  <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 pl-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}></label>
                  <input 
                     type="text" value={dayData.focus} onChange={e => updateFocus(e.target.value)} 
                     placeholder="Day's Focus Theme- WebDev "
                     className={`w-full px-5 py-3.5 rounded-xl border text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-lg backdrop-blur-2xl ${isDarkMode ? 'bg-[#0f172a]/40 border-white/10 text-white placeholder:text-slate-500 shadow-black/20' : 'bg-white/60 border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-slate-200/50'}`}
                  />
               </div>
            </div>

         <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 items-start w-full">

         <div className={`w-full lg:w-1/4 shrink-0 flex flex-col gap-3 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 border backdrop-blur-3xl shadow-lg shadow-black/20 ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10' : 'bg-white/40 border-white/60'}`}>
            <h2 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Weekly Plan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
               {days.map(day => (
                 <button 
                   key={day} onClick={() => setSelectedDay(day)}
                   className={`p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 ${
                     selectedDay === day 
                       ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/50 shadow-md shadow-blue-500/10' : 'bg-blue-50 border-blue-300 shadow-sm') 
                       : (isDarkMode ? 'bg-transparent border-transparent hover:bg-white/5' : 'bg-transparent border-transparent hover:bg-white/50')
                   }`}
                 >
                   <div className="flex justify-between items-center">
                     <span className={`font-bold ${selectedDay === day ? 'text-blue-400' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{day}</span>
                     <span className={`text-xs font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{(plan[day]?.subjects || []).length} Subs</span>
                   </div>
                 </button>
               ))}
            </div>
         </div>

         <div className="w-full lg:w-3/4 flex flex-col gap-6 sm:gap-10 overflow-y-visible pb-10 px-1 sm:px-2">

            {(dayData.subjects || []).map(sub => {
               const course = playlists.find(p => p.id === sub.courses?.[0]);
               const isDropdownOpen = editingLink[sub.id] || openCourseSelect === sub.id || copyMenuOpen === sub.id;
               
               return (
                  <div key={sub.id} className={`flex flex-col relative group transition-all duration-200 ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                     
                      <div className="absolute top-3 right-3 z-50 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
   
                        <div className="relative">
                            <button 
                              onClick={() => { setCopyMenuOpen(copyMenuOpen === sub.id ? null : sub.id); setSelectedCopyDays([]); }} 
                              className="p-2.5 rounded-full bg-blue-500 text-white shadow-lg hover:scale-110 hover:bg-blue-600 transition-all"
                              title="Copy to other days"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            
                            {copyMenuOpen === sub.id && (
                              <div className={`absolute top-full right-0 mt-2 p-4 rounded-2xl border backdrop-blur-3xl shadow-2xl w-48 ${isDarkMode ? 'bg-[#151E32]/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
                                  <h4 className="text-[10px] font-black mb-2 uppercase tracking-widest text-slate-400">Copy to:</h4>
                                  <div className="flex flex-col gap-1.5 mb-4">
                                    {days.filter(d => d !== selectedDay).map(day => (
                                        <label key={day} className="flex items-center gap-2 text-sm cursor-pointer group/label">
                                          <input type="checkbox" 
                                              className="w-4 h-4 rounded border-slate-500 text-blue-500 focus:ring-blue-500"
                                              checked={selectedCopyDays.includes(day)}
                                              onChange={(e) => {
                                                if(e.target.checked) setSelectedCopyDays(prev => [...prev, day]);
                                                else setSelectedCopyDays(prev => prev.filter(d => d !== day));
                                              }} 
                                          />
                                          <span className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-slate-300 group-hover/label:text-white' : 'text-slate-700 group-hover/label:text-slate-900'}`}>{day}</span>
                                        </label>
                                    ))}
                                  </div>
                                  <div className="flex justify-between gap-2">
                                    <button onClick={() => setCopyMenuOpen(null)} className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>Cancel</button>
                                    <button onClick={() => handleCopySubject(sub.id)} disabled={selectedCopyDays.length === 0} className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Copy</button>
                                  </div>
                              </div>
                            )}
                        </div>

                        <button onClick={() => deleteSubject(sub.id)} className="p-2.5 rounded-full bg-red-500 text-white shadow-lg hover:scale-110 hover:bg-red-600 transition-all" title="Delete Subject">
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                     <div className={`rounded-[1.75rem] p-3 sm:p-4 lg:p-5 border backdrop-blur-3xl shadow-lg transition-all h-full ${
                       isDarkMode ? 'bg-[#07101f]/60 border-white/10 shadow-black/20' : 'bg-white/55 border-white/70 shadow-slate-300/40'
                     }`}>
                     <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 h-full min-h-[300px]">
                        
                        <div className={`xl:col-span-3 rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 lg:p-6 border backdrop-blur-3xl flex flex-col shadow-lg shadow-black/20 transition-all relative overflow-hidden
                           ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10' : 'bg-white/40 border-white/60'}`}
                        >
                           <div className="absolute top-0 right-0 max-w-[75%] px-3 sm:pr-4 py-2 bg-[#1e1b4b]/60 backdrop-blur-md rounded-bl-3xl rounded-tr-[1.25rem] sm:rounded-tr-[1.5rem] flex items-center shadow-md z-20">
                              <input 
                                value={sub.name} 
                                onChange={e => updateSubjectField(sub.id, 'name', e.target.value)} 
                                placeholder="Subject Name..."
                                className="bg-transparent text-xs sm:text-sm font-black tracking-widest text-[#84c8fc] outline-none text-right placeholder:text-[#84c8fc]/30 w-full focus:border-b focus:border-[#84c8fc]/50"
                              />
                           </div>

                           <div className="flex items-center gap-4 mb-4 relative z-10 pt-2 border-b border-white/10 pb-4">
                             <h3 className={`text-base font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>To Do List</h3>
                           </div>
                           
                           <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 max-h-[250px] relative z-10">
                              {(sub.tasks || []).length === 0 && <p className="text-slate-500 italic text-xs font-semibold">Start adding tasks below.</p>}
                              {(sub.tasks || []).map(task => (
                                 <div key={task.id} className={`flex items-start justify-between gap-3 px-3 sm:px-4 py-2.5 rounded-xl transition-all border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white/50 border-slate-200 shadow-sm'}`}>
                                    <div className="flex items-start gap-3 min-w-0">
                                      <Square className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                      <span className={`text-xs sm:text-sm font-medium break-words ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{task.text}</span>
                                    </div>
                                    <button onClick={() => deleteTask(sub.id, task.id)} className="text-slate-500 hover:text-red-500 transition-colors p-1.5"><X className="w-4 h-4" /></button>
                                 </div>
                              ))}
                           </div>

                          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 border-t border-white/10 pt-4">
                            <input 
                              value={taskInputs[sub.id]?.text || ''}
                              onChange={e => setTaskInputs({...taskInputs, [sub.id]: { ...taskInputs[sub.id], text: e.target.value }})}
                              onKeyDown={e => e.key === 'Enter' && handleAddTask(sub.id)}
                              placeholder="Type a task and press Enter..."
                              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:border-[#38bdf8] transition-all shadow-inner ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white/60 border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                            />
                            
                            <CustomTimePicker 
                              value={taskInputs[sub.id]?.time || ''}
                              onChange={(newTime) => setTaskInputs({...taskInputs, [sub.id]: { ...taskInputs[sub.id], time: newTime }})}
                              isDarkMode={isDarkMode}
                            />

                            <button onClick={() => handleAddTask(sub.id)} className="w-full sm:w-auto px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm bg-[#5eead4] hover:bg-[#2dd4bf] text-slate-900 shadow-md transition-colors shrink-0">
                              <Plus className="w-4 h-4" /> Add
                            </button>
                          </div>
                        </div>

                        <div className="xl:col-span-2 flex flex-col gap-3 sm:gap-5 relative">
                           
                           <div className={`flex-1 rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 lg:p-6 border backdrop-blur-3xl flex flex-col shadow-lg shadow-black/20 transition-all relative ${openCourseSelect === sub.id ? 'z-50' : 'z-10'} ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10' : 'bg-white/40 border-white/60'}`}>
                              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Featured Course</h3>
                              
                              <div className="relative mb-4 z-20">
                                 <button 
                                   onClick={() => setOpenCourseSelect(openCourseSelect === sub.id ? null : sub.id)}
                                   className={`w-full p-3 pr-4 rounded-xl border text-xs sm:text-sm font-bold outline-none flex justify-between items-center gap-3 transition-all shadow-md backdrop-blur-md ${isDarkMode ? 'bg-[#151E32]/80 border-white/10 text-white hover:border-blue-500/50' : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400'}`}
                                 >
                                    <span className="truncate">{course ? course.title : '-- Choose a Local Course --'}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openCourseSelect === sub.id ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                                 </button>

                                 {openCourseSelect === sub.id && (
                                   <>
                                     <div className="fixed inset-0 z-30" onClick={() => setOpenCourseSelect(null)}></div>
                                     <div className={`absolute top-[calc(100%+8px)] left-0 w-full rounded-xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#0B1121] border-slate-600' : 'bg-white border-slate-200'}`}>
                                       <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col py-1 relative z-50">
                                         <button 
                                            onClick={() => { updateSubjectField(sub.id, 'courses', []); setOpenCourseSelect(null); }}
                                            className={`px-4 py-3 text-sm font-medium text-left transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}
                                         >
                                            -- Choose a Local Course --
                                         </button>
                                         {playlists.map(p => {
                                            const isSelected = sub.courses?.[0] === p.id;
                                            return (
                                              <button 
                                                key={p.id}
                                                onClick={() => { updateSubjectField(sub.id, 'courses', [p.id]); setOpenCourseSelect(null); }}
                                                className={`px-4 py-3 text-sm font-bold text-left transition-colors ${isSelected ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50')}`}
                                              >
                                                {p.title}
                                              </button>
                                            )
                                         })}
                                       </div>
                                     </div>
                                   </>
                                 )}
                              </div>

                              {course ? (
                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm">
                                    <div className="w-20 h-12 rounded-lg bg-slate-800 overflow-hidden relative shrink-0 shadow-sm border border-white/5">
                                       {course.cover ? <img src={course.cover} className="w-full h-full object-cover" alt="cover" /> : <div className="w-full h-full flex items-center justify-center"><PlayCircle className="w-5 h-5 text-blue-500" /></div>}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                       <h4 className={`text-xs font-bold truncate mb-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{course.title}</h4>
                                       <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{course.videoCount || 0} modules</p>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="flex flex-row items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 opacity-60">
                                    <BookOpen className="w-4 h-4 text-slate-500 ml-2" />
                                    <p className="text-xs font-semibold text-slate-500">Unassigned</p>
                                 </div>
                              )}
                           </div>

                           <div className={`rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 lg:p-6 border backdrop-blur-3xl shadow-lg shadow-black/20 transition-all relative z-10 ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10' : 'bg-white/40 border-white/60'}`}>
                              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Action Links</h3>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
                                 {linkTypes.map(lt => {
                                    const isActive = editingLink[sub.id] === lt.key;
                                    const hasData = sub.actionUrls?.[lt.key]?.url || sub.actionUrls?.[lt.key]?.label;
                                    return (
                                      <button 
                                        key={lt.key}
                                        onClick={() => setEditingLink({...editingLink, [sub.id]: isActive ? null : lt.key})}
                                        className={`p-3 rounded-2xl border transition-all relative flex items-center justify-center
                                          ${isActive ? (isDarkMode ? 'bg-white/20 border-white/50 text-white shadow-lg' : 'bg-slate-200 border-slate-400 text-slate-900 shadow-md') : 
                                           hasData ? (isDarkMode ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' : 'bg-white/80 border-slate-300 hover:bg-white text-slate-800') : 
                                           (isDarkMode ? 'bg-transparent border-white/5 hover:bg-white/5 text-slate-500' : 'bg-transparent border-slate-200 hover:bg-slate-100 text-slate-400')}
                                        `}
                                      >
                                         <lt.icon className="w-5 h-5" />
                                      </button>
                                    )
                                 })}
                              </div>

                              {editingLink[sub.id] && (
                                 <div className={`absolute top-[calc(100%+8px)] left-0 w-full p-5 rounded-2xl border backdrop-blur-3xl z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-[#0B1121]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                                    
                                    <div className="flex justify-between items-center mb-4">
                                       <h4 className={`text-xs font-black uppercase tracking-widest ${linkTypes.find(l => l.key === editingLink[sub.id]).colorStyle.split(' ')}`}>
                                          Configure {editingLink[sub.id]}
                                       </h4>
                                       <button onClick={() => setEditingLink({...editingLink, [sub.id]: null})} className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                       <div>
                                          <label className={`text-[10px] font-bold uppercase tracking-wider pl-1 mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Display Name</label>
                                          <input 
                                             value={sub.actionUrls?.[editingLink[sub.id]]?.label || ''}
                                             onChange={e => updateActionUrl(sub.id, editingLink[sub.id], 'label', e.target.value)}
                                             placeholder={linkTypes.find(l => l.key === editingLink[sub.id]).defaultLabel}
                                             className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all shadow-inner ${isDarkMode ? 'bg-black/40 border-slate-700 text-white focus:border-indigo-500/50 placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-400 placeholder:text-slate-400'}`}
                                          />
                                       </div>
                                       <div>
                                          <label className={`text-[10px] font-bold uppercase tracking-wider pl-1 mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>URL Destination</label>
                                          <input 
                                             value={sub.actionUrls?.[editingLink[sub.id]]?.url || ''}
                                             onChange={e => updateActionUrl(sub.id, editingLink[sub.id], 'url', e.target.value)}
                                             placeholder="https://"
                                             className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all shadow-inner ${isDarkMode ? 'bg-black/40 border-slate-700 text-blue-400 focus:border-indigo-500/50 placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-blue-600 focus:border-indigo-400 placeholder:text-slate-400'}`}
                                          />
                                       </div>
                                       <button onClick={() => setEditingLink({...editingLink, [sub.id]: null})} className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-colors">
                                          Done
                                       </button>
                                    </div>
                                 </div>
                              )}
                           </div>

                        </div>
                     </div>
                     </div>
                  </div>
               );
            })}

            <button 
               onClick={handleAddSubject} 
               className={`w-full py-8 mt-4 rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group shadow-lg shadow-black/10
                 ${isDarkMode ? 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 bg-[#0f172a]/20 backdrop-blur-md' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 bg-white/40 backdrop-blur-md'}`}
            >
               <div className={`p-4 rounded-full shadow-inner transition-colors ${isDarkMode ? 'bg-white/5 group-hover:bg-blue-500/20 text-slate-400 group-hover:text-blue-400' : 'bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600'}`}>
                 <Plus className="w-8 h-8" />
               </div>
               <span className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400 group-hover:text-blue-300' : 'text-slate-500 group-hover:text-blue-600'}`}>
                 Add Subject Card
               </span>
            </button>

         </div>
      </div>
      
     </div>
    </div>
  );
}


// ==========================================
// MONTHLY CONFIG 
function MonthlyConfig({ events, setEvents, todayDateStr, isDarkMode, onSync }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleAddEvent = () => {
    if(!selectedDate || !formTitle.trim()) return;
    
    const newEvent = { id: Date.now().toString(), title: formTitle, time: formTime };
    const newMonthlyEvents = { 
       ...events, 
       [selectedDate]: [...(events[selectedDate] || []), newEvent] 
    };
    
    setEvents(newMonthlyEvents);
    onSync({ monthlyEvents: newMonthlyEvents });
    
    setFormTitle('');
    setFormTime('');
  };

  const handleDeleteEvent = (date, id) => {
    const newMonthlyEvents = { 
       ...events, 
       [date]: events[date].filter(e => e.id !== id) 
    };
    
    setEvents(newMonthlyEvents);
    onSync({ monthlyEvents: newMonthlyEvents });
  };

  const selectedDateEvents = events[selectedDate] || [];

  return (
    <div className="relative w-full flex flex-col pb-12 animate-in fade-in duration-700 min-h-[calc(100vh-80px)]">
      
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
           style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')` }}
         />
         <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-[#0B1121]/80 via-[#0B1121]/90 to-[#0B1121]' : 'bg-gradient-to-b from-slate-50/80 via-slate-50/90 to-slate-50'}`} />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8 px-6 lg:px-12 pt-8 pb-12 items-start h-full">
         
         <div className={`w-full lg:w-3/5 shrink-0 rounded-[1.5rem] p-6 lg:p-10 border backdrop-blur-3xl flex flex-col shadow-lg shadow-black/20 transition-all ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10' : 'bg-white/40 border-white/60'}`}>
            
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {monthNames[currentMonth]} <span className="text-blue-400">{currentYear}</span>
                  </h2>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => { if(currentMonth===0){setCurrentMonth(11);setCurrentYear(y=>y-1)}else setCurrentMonth(m=>m-1) }} className={`p-3 rounded-full border transition-all hover:scale-105 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-700 shadow-sm'}`}>
                     <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => { if(currentMonth===11){setCurrentMonth(0);setCurrentYear(y=>y+1)}else setCurrentMonth(m=>m+1) }} className={`p-3 rounded-full border transition-all hover:scale-105 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white/50 border-slate-200 hover:bg-white text-slate-700 shadow-sm'}`}>
                     <ChevronRight className="w-6 h-6" />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                 <div key={d} className={`text-center text-xs font-black uppercase tracking-widest pb-4 border-b ${isDarkMode ? 'text-slate-500 border-white/10' : 'text-slate-400 border-slate-200'}`}>
                    {d}
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4 flex-1">
               {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="p-2" />)}
               {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayEvents = events[dateStr] || [];
                  const isSelected = selectedDate === dateStr;
                  const isToday = todayDateStr === dateStr;

                  return (
                     <button 
                        key={d} 
                        onClick={() => setSelectedDate(dateStr)}
                        className={`relative aspect-square md:aspect-auto md:min-h-[71px] p-2 md:p-4 rounded-2xl flex flex-col items-center md:items-start justify-center md:justify-start transition-all border group
                          ${isSelected 
                             ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-blue-50 border-blue-400 shadow-sm') 
                             : (isDarkMode ? 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10' : 'bg-white/40 border-transparent hover:bg-white hover:shadow-sm')}
                          ${isToday && !isSelected ? (isDarkMode ? 'ring-1 ring-blue-500/50' : 'ring-1 ring-blue-400') : ''}
                        `}
                     >
                        <span className={`text-lg md:text-xl font-bold transition-colors 
                           ${isSelected ? 'text-blue-500' : isToday ? 'text-blue-500' : (isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900')}
                        `}>
                           {d}
                        </span>
                        
                        {dayEvents.length > 0 && (
                           <div className="mt-auto w-full flex flex-wrap justify-center md:justify-start gap-1 pt-2">
                             {dayEvents.slice(0, 3).map((_, eIdx) => (
                               <div key={eIdx} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                             ))}
                             {dayEvents.length > 3 && <span className="text-[10px] font-black text-slate-500 leading-none">+</span>}
                           </div>
                        )}
                     </button>
                  )
               })}
            </div>
         </div>

         <div className="w-full lg:w-2/5 flex flex-col gap-6">
            
            <div className={`rounded-[1.5rem] p-6 lg:p-8 border backdrop-blur-3xl shadow-lg shadow-black/20 transition-all ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10' : 'bg-white/40 border-white/60'}`}>
               <h3 className={`text-xl font-black mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <Plus className="w-5 h-5 text-blue-400" /> Add Event
               </h3>
               
               <div className="flex flex-col gap-4">
                  <div className="flex flex-col">
                     <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 pl-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selected Date</label>
                     <div className={`w-full px-4 py-3 rounded-xl border text-sm font-bold flex items-center gap-3 ${isDarkMode ? 'bg-white/5 border-white/10 text-blue-400' : 'bg-white/50 border-slate-200 text-blue-600'}`}>
                        <CalendarIcon className="w-4 h-4" />
                        {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                     </div>
                  </div>

                  <div className="flex flex-col">
                     <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 pl-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Event Title</label>
                     <input 
                        type="text" 
                        value={formTitle} 
                        onChange={e => setFormTitle(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                        placeholder="e.g. Final Exam, Team Meeting..." 
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-inner ${isDarkMode ? 'bg-[#0f172a]/40 border-white/10 text-white placeholder:text-slate-500' : 'bg-white/60 border-slate-300 text-slate-900 placeholder:text-slate-400'}`} 
                     />
                  </div>

                  <div className="flex flex-col">
                     <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 pl-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Time (Optional)</label>
                     <input 
                        type="time" 
                        value={formTime} 
                        onChange={e => setFormTime(e.target.value)} 
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-inner ${isDarkMode ? 'bg-[#0f172a]/40 border-white/10 text-white' : 'bg-white/60 border-slate-300 text-slate-900'}`} 
                     />
                  </div>

                  <button 
                     onClick={handleAddEvent} 
                     className="mt-2 w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-900 font-black text-sm tracking-wide shadow-lg shadow-blue-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                     <Plus className="w-4 h-4" /> Save Event
                  </button>
               </div>
            </div>

            <div className={`flex-1 rounded-[1.5rem] p-6 lg:p-8 border backdrop-blur-3xl shadow-lg shadow-black/20 transition-all flex flex-col ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10' : 'bg-white/40 border-white/60'}`}>
               <h3 className={`text-xl font-black mb-6 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <span className="flex items-center gap-2"><AlignLeft className="w-5 h-5 text-blue-400" /> Plans</span>
                 <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                   {selectedDateEvents.length} Events
                 </span>
               </h3>

               <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                  {selectedDateEvents.length === 0 ? (
                     <div className="flex flex-col items-center justify-center text-center py-10 opacity-50">
                        <CalendarIcon className={`w-12 h-12 mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your schedule is clear.</p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No events for this date.</p>
                     </div>
                  ) : (
                     selectedDateEvents.map(ev => (
                        <div key={ev.id} className={`group flex items-start justify-between p-4 rounded-xl transition-all border ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white/50 border-slate-200 hover:bg-white shadow-sm'}`}>
                           <div className="flex flex-col gap-1.5">
                              <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{ev.title}</span>
                              {ev.time && (
                                <span className={`flex items-center gap-1.5 text-xs font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  <Clock className="w-3 h-3" /> {ev.time}
                                </span>
                              )}
                           </div>
                           <button 
                             onClick={() => handleDeleteEvent(selectedDate, ev.id)} 
                             className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     ))
                  )}
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
