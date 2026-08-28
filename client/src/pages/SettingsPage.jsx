import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Header } from '../components/ui/Header';
import { getTodayDay, getTodayDateStr } from '../utils/dateUtils';
import { 
  ArrowLeft, GripVertical, Trash2, Plus, Copy, Link as LinkIcon, 
  X, Sun, Moon, Code, Coffee, Monitor, Check,
  Utensils, Gamepad2, BookOpen, Dumbbell, Zap, Flame, Trophy,
  ChevronDown, CalendarIcon, ChevronLeft, ChevronRight
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ICON_MAP = {
  Sun, Moon, Code, Coffee, Monitor, Utensils, Gamepad2, 
  BookOpen, Dumbbell, Zap, Flame, Trophy
};

const COLORS = ['amber', 'emerald', 'rose', 'cyan', 'indigo', 'purple', 'blue'];

const DEFAULT_MONDAY_TASKS = [
  { id: 'boot_1', title: 'Wake Up', subtitle: 'Start your day right', duration: 0, iconName: 'Sun', iconColor: 'amber', linkedCourseId: null, customLink: { label: '', url: '' } },
  { id: 'boot_2', title: 'Deep Work Session', subtitle: 'Focus on primary tasks', duration: 120, iconName: 'Monitor', iconColor: 'blue', linkedCourseId: null, customLink: { label: '', url: '' } },
  { id: 'boot_3', title: 'Practice DSA', subtitle: 'Solve 3 problems', duration: 60, iconName: 'Code', iconColor: 'cyan', linkedCourseId: null, customLink: { label: 'LeetCode', url: 'https://leetcode.com' } },
  { id: 'boot_4', title: 'Wind Down & Sleep', subtitle: '7-8 hours recommended', duration: 0, iconName: 'Moon', iconColor: 'indigo', linkedCourseId: null, customLink: { label: '', url: '' } }
];

const getColorStyles = (colorName = 'blue', isDarkMode) => {
  const map = {
    amber: { bg: isDarkMode ? 'bg-amber-500/20' : 'bg-amber-500/10', text: isDarkMode ? 'text-amber-400' : 'text-amber-600', ring: 'ring-amber-500/50', border: isDarkMode ? 'border-amber-500/30' : 'border-amber-200' },
    emerald: { bg: isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-500/10', text: isDarkMode ? 'text-emerald-400' : 'text-emerald-600', ring: 'ring-emerald-500/50', border: isDarkMode ? 'border-emerald-500/30' : 'border-emerald-200' },
    rose: { bg: isDarkMode ? 'bg-rose-500/20' : 'bg-rose-500/10', text: isDarkMode ? 'text-rose-400' : 'text-rose-600', ring: 'ring-rose-500/50', border: isDarkMode ? 'border-rose-500/30' : 'border-rose-200' },
    cyan: { bg: isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-500/10', text: isDarkMode ? 'text-cyan-400' : 'text-cyan-600', ring: 'ring-cyan-500/50', border: isDarkMode ? 'border-cyan-500/30' : 'border-cyan-200' },
    indigo: { bg: isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-500/10', text: isDarkMode ? 'text-indigo-400' : 'text-indigo-600', ring: 'ring-indigo-500/50', border: isDarkMode ? 'border-indigo-500/30' : 'border-indigo-200' },
    purple: { bg: isDarkMode ? 'bg-purple-500/20' : 'bg-purple-500/10', text: isDarkMode ? 'text-purple-400' : 'text-purple-600', ring: 'ring-purple-500/50', border: isDarkMode ? 'border-purple-500/30' : 'border-purple-200' },
    blue: { bg: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10', text: isDarkMode ? 'text-blue-400' : 'text-blue-600', ring: 'ring-blue-500/50', border: isDarkMode ? 'border-blue-500/30' : 'border-blue-200' },
  };
  return map[colorName] || map.blue;
};

const buildRoutineMap = (weeklyRoutine = {}) => {
  const safeMap = {};
  DAYS.forEach(day => { safeMap[day] = weeklyRoutine[day] || []; });
  return safeMap;
};

export default function SettingsPage({ playlists, productivityData, isDarkMode, setIsDarkMode, onSync }) {
  const navigate = useNavigate();
  
  // Local Working State
  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [routineMap, setRoutineMap] = useState(() => {
    let cloudData = productivityData?.weeklyRoutine || {};
    if (!cloudData.Monday || cloudData.Monday.length === 0) {
      cloudData = { ...cloudData, Monday: [...DEFAULT_MONDAY_TASKS] };
    }
    return buildRoutineMap(cloudData);
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Calendar States
  const [monthlyEvents, setMonthlyEvents] = useState(productivityData?.monthlyEvents || {});
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [eventModalDate, setEventModalDate] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');

  // Modals
  const [activePicker, setActivePicker] = useState(null); 
  const [linkModalTarget, setLinkModalTarget] = useState(null); 
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState([]);

  const currentTasks = routineMap[selectedDay] || [];
  
  // Calendar Logic
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleAddEvent = () => {
    if(!eventModalDate || !formTitle.trim()) return;
    const newEvent = { id: Date.now().toString(), title: formTitle, time: formTime };
    const newMonthlyEvents = {
        ...monthlyEvents,
        [eventModalDate]: [...(monthlyEvents[eventModalDate] || []), newEvent]
    };
    setMonthlyEvents(newMonthlyEvents);
    onSync({ monthlyEvents: newMonthlyEvents });
    setEventModalDate(null);
    setFormTitle('');
    setFormTime('');
  };

  const saveToCloud = async () => {
    try {
      await onSync({ weeklyRoutine: routineMap });
      setHasUnsavedChanges(false);
    } catch (e) { console.error(e); }
  };

  const updateTask = (taskId, field, value) => {
    setRoutineMap(prev => ({ ...prev, [selectedDay]: prev[selectedDay].map(t => t.id === taskId ? { ...t, [field]: value } : t) }));
    setHasUnsavedChanges(true);
  };

  const addTask = () => {
    const randomIcon = Object.keys(ICON_MAP)[Math.floor(Math.random() * Object.keys(ICON_MAP).length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newTask = {
      id: Date.now().toString(), title: 'New Activity', subtitle: '', duration: 30,
      iconName: randomIcon, iconColor: randomColor, linkedCourseId: null, customLink: { label: '', url: '' }
    };
    setRoutineMap(prev => ({ ...prev, [selectedDay]: [...prev[selectedDay], newTask] }));
    setHasUnsavedChanges(true);
  };

  const removeTask = (taskId) => {
    setRoutineMap(prev => ({ ...prev, [selectedDay]: prev[selectedDay].filter(t => t.id !== taskId) }));
    setHasUnsavedChanges(true);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const listCopy = [...currentTasks];
    const [movedItem] = listCopy.splice(sourceIndex, 1);
    listCopy.splice(destIndex, 0, movedItem);

    setRoutineMap(prev => ({ ...prev, [selectedDay]: listCopy }));
    setHasUnsavedChanges(true);
  };

  const handleExecuteCopy = (strategy) => {
    if (copyTargets.length === 0) return;
    const sourceTasks = routineMap[selectedDay] || [];
    setRoutineMap(prev => {
      const nextMap = { ...prev };
      copyTargets.forEach(targetDay => {
        const duplicatedTasks = sourceTasks.map(t => ({ ...t, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }));
        if (strategy === 'replace') nextMap[targetDay] = duplicatedTasks;
        else nextMap[targetDay] = [...(nextMap[targetDay] || []), ...duplicatedTasks];
      });
      return nextMap;
    });
    setCopyTargets([]);
    setCopyModalOpen(false);
    setHasUnsavedChanges(true);
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Inter',sans-serif] transition-colors duration-300 ${isDarkMode ? 'bg-[#0B1121] text-slate-300' : 'bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_30%),linear-gradient(180deg,#F5F7FB_0%,#EEF2F8_100%)] text-slate-800'}`}>
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} activePage="routine" />

      <div className="w-[96%] max-w-[1400px] mx-auto pt-6 pb-12 flex-1 flex flex-col">
        
        {/* STUDIO HEADER */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b pb-6 ${isDarkMode ? 'border-white/5' : 'border-slate-200/80'}`}>
          <div>
            <button onClick={() => navigate('/routine')} className={`flex items-center gap-2 text-sm font-bold mb-4 transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Routine Setup
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setCopyModalOpen(true); setCopyTargets([]); }}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all border ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/80 shadow-sm'}`}
            >
              <Copy className="w-4 h-4" /> Export Routine
            </button>
            <button 
              onClick={saveToCloud}
              disabled={!hasUnsavedChanges}
              className={`px-6 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-md ${hasUnsavedChanges ? (isDarkMode ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white') : (isDarkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}`}
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
          
          {/* LEFT: Dropdown & Tasks */}
          <div className="lg:col-span-8 pb-20">
            
            {/* Custom Day Dropdown */}
            <div className="relative mb-6 z-30 inline-block">
               <button 
                 onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                 className={`flex items-center justify-between gap-4 px-5 py-3 rounded-2xl border font-black text-lg transition-all shadow-sm ${isDarkMode ? 'bg-[#151E32] border-slate-700 text-white hover:border-slate-500' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'}`}
               >
                 <span>Editing: <span className="text-indigo-500">{selectedDay}</span></span>
                 <ChevronDown className={`w-5 h-5 transition-transform ${isDayDropdownOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
               </button>
               {isDayDropdownOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsDayDropdownOpen(false)}></div>
                   <div className={`absolute top-full left-0 mt-2 w-full rounded-2xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 ${isDarkMode ? 'bg-[#151E32] border-slate-700' : 'bg-white border-slate-200'}`}>
                     {DAYS.map(day => (
                       <button 
                         key={day} 
                         onClick={() => { setSelectedDay(day); setIsDayDropdownOpen(false); }}
                         className={`w-full text-left px-5 py-3 font-bold transition-colors ${selectedDay === day ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'}`}
                       >
                         {day}
                       </button>
                     ))}
                   </div>
                 </>
               )}
            </div>

            {/* Task Editor List */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="routine-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {currentTasks.map((task, index) => {
                      const Icon = ICON_MAP[task.iconName] || Sun;
                      const style = getColorStyles(task.iconColor, isDarkMode);

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              className={`p-4 sm:p-5 rounded-[24px] border transition-all duration-200 flex flex-col sm:flex-row gap-5 items-center relative bg-clip-padding ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] z-50 ring-2 ring-indigo-500' : 'shadow-sm'} ${isDarkMode ? 'bg-[#0F172A] border-white/10' : 'bg-white/90 border-slate-200/80 shadow-[0_10px_26px_rgba(15,23,42,0.05)]'}`}
                            >
                              {/* Drag Handle & Trash */}
                              <div {...provided.dragHandleProps} className={`absolute left-0 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing ${isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500'}`}>
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <button onClick={() => removeTask(task.id)} className={`absolute right-4 top-4 p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-600 hover:bg-red-500/20 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}>
                                <Trash2 className="w-5 h-5" />
                              </button>

                              {/* Centered Icon Picker Box */}
                              <div className="shrink-0 flex items-center justify-center pl-6">
                                <button 
                                  onClick={(e) => setActivePicker({ taskId: task.id, anchor: e.currentTarget })} 
                                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-transform hover:scale-105 ${style.bg} ${style.border} ${style.text}`}
                                >
                                  <Icon size={28} />
                                </button>
                              </div>

                              {/* Inputs Area */}
                              <div className="flex-1 w-full space-y-3 pr-8">
                                
                                {/* Top Row: Title & Mins */}
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 flex flex-col">
                                    <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Title</label>
                                    <input 
                                      type="text" value={task.title} onChange={e => updateTask(task.id, 'title', e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isDarkMode ? 'bg-black/30 border-slate-700 text-white' : 'bg-[#F6F8FC] border-slate-200/80 text-slate-900'}`}
                                    />
                                  </div>
                                  <div className="w-24 shrink-0 flex flex-col">
                                    <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Mins</label>
                                    <input 
                                      type="number" min="0" value={task.duration} onChange={e => updateTask(task.id, 'duration', parseInt(e.target.value)||0)}
                                      className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isDarkMode ? 'bg-black/30 border-slate-700 text-white' : 'bg-[#F6F8FC] border-slate-200/80 text-slate-900'}`}
                                    />
                                  </div>
                                </div>
                                
                                {/* Bottom Row: Description & Link Button */}
                                <div className="flex items-end gap-3">
                                  <div className="flex-1 flex flex-col">
                                    <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Description</label>
                                    <input 
                                      type="text" value={task.subtitle} onChange={e => updateTask(task.id, 'subtitle', e.target.value)}
                                      className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isDarkMode ? 'bg-black/30 border-slate-700 text-slate-300' : 'bg-[#F6F8FC] border-slate-200/80 text-slate-600'}`}
                                    />
                                  </div>
                                  <div className="shrink-0 w-36">
                                    <button onClick={() => setLinkModalTarget(task.id)} className={`h-11 w-full px-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-colors ${task.linkedCourseId || task.customLink?.url ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100') : (isDarkMode ? 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-slate-700 shadow-sm')}`}>
                                      <LinkIcon className="w-3.5 h-3.5" /> 
                                      <span className="truncate">{task.linkedCourseId ? 'Course' : task.customLink?.url ? 'External Link' : 'Attach'}</span>
                                    </button>
                                  </div>
                                </div>

                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    <button onClick={addTask} className={`w-full py-5 rounded-[24px] border-2 border-dashed flex items-center justify-center gap-2 font-bold transition-all ${isDarkMode ? 'border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5' : 'border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                      <Plus className="w-5 h-5" /> Add Task Block
                    </button>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* RIGHT: Events Calendar */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`rounded-[24px] p-6 border shadow-lg flex flex-col ${isDarkMode ? 'bg-[#0F172A]/40 border-white/10' : 'bg-white/90 border-slate-200/80 shadow-[0_12px_30px_rgba(15,23,42,0.06)]'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}><CalendarIcon className="w-5 h-5 text-indigo-500"/> Events</h3>
                <div className="flex gap-2">
                  <button onClick={() => { if(currentMonth===0){setCurrentMonth(11);setCurrentYear(y=>y-1)}else setCurrentMonth(m=>m-1) }} className={`p-1.5 rounded-lg border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700 shadow-sm'}`}><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => { if(currentMonth===11){setCurrentMonth(0);setCurrentYear(y=>y+1)}else setCurrentMonth(m=>m+1) }} className={`p-1.5 rounded-lg border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700 shadow-sm'}`}><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className={`text-center font-black mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{monthNames[currentMonth]} {currentYear}</div>
              
              <div className="grid grid-cols-7 gap-1 text-center flex-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className={`text-xs font-bold pb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>)}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasEvents = monthlyEvents[dateStr]?.length > 0;
                  const isToday = getTodayDateStr() === dateStr;
                  return (
                    <button key={dateStr} onClick={() => setEventModalDate(dateStr)} className={`relative p-2 aspect-square rounded-xl font-bold text-sm transition-colors border ${isToday ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : isDarkMode ? 'border-transparent text-slate-300 hover:bg-white/10' : 'border-transparent text-slate-700 hover:bg-white shadow-sm'}`}>
                      {day}
                      {hasEvents && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500"></div>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- EVENT MODAL --- */}
      {eventModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-white/95 border-slate-200/80'}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Add Event for {new Date(eventModalDate).toLocaleDateString()}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Event Title" value={formTitle} onChange={e => setFormTitle(e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDarkMode ? 'bg-black/30 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
              <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDarkMode ? 'bg-black/30 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEventModalDate(null)} className={`flex-1 py-3 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Cancel</button>
                <button onClick={handleAddEvent} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- UNIFIED ICON/COLOR PICKER MODAL --- */}
      {activePicker && (() => {
        const t = currentTasks.find(x => x.id === activePicker.taskId);
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActivePicker(null)}></div>
            <div className={`absolute z-50 p-5 rounded-[24px] shadow-2xl border flex gap-6 ${isDarkMode ? 'bg-[#151E32] border-slate-700' : 'bg-white border-slate-200'}`} style={{ top: activePicker.anchor.getBoundingClientRect().bottom + window.scrollY + 10, left: activePicker.anchor.getBoundingClientRect().left }}>
              
              {/* Left Column: Icons */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-slate-500">Icon</h4>
                <div className="grid grid-cols-4 gap-2 w-48">
                  {Object.keys(ICON_MAP).map(key => {
                    const Ico = ICON_MAP[key];
                    const isSelected = t?.iconName === key;
                    return (
                      <button key={key} onClick={() => updateTask(activePicker.taskId, 'iconName', key)} className={`p-2 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 text-white shadow-md' : isDarkMode ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                        <Ico className="w-5 h-5" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className={`w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>

              {/* Right Column: Colors */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-slate-500">Color</h4>
                <div className="grid grid-cols-3 gap-2 w-32">
                  {COLORS.map(color => {
                    const style = getColorStyles(color, isDarkMode);
                    const isSelected = t?.iconColor === color;
                    return (
                      <button key={color} onClick={() => updateTask(activePicker.taskId, 'iconColor', color)} className={`w-10 h-10 rounded-xl border-2 transition-transform hover:scale-110 flex items-center justify-center ${style.bg} ${style.border}`}>
                        {isSelected && <Check className={`w-4 h-4 ${style.text}`} strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )
      })()}

      {/* --- OR RESOURCE LINKER MODAL --- */}
      {linkModalTarget && (() => {
        const t = currentTasks.find(x => x.id === linkModalTarget);
        if(!t) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md p-6 rounded-[24px] border shadow-2xl ${isDarkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Attach Resource</h3>
                <button onClick={() => setLinkModalTarget(null)} className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X className="w-5 h-5"/></button>
              </div>

              <div className="space-y-4">
                
                {/* Option 1: Course Link */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Local Course Module</label>
                  <select value={t.linkedCourseId || ''} onChange={e => { updateTask(t.id, 'linkedCourseId', e.target.value === '' ? null : e.target.value); updateTask(t.id, 'customLink', {label:'', url:''}); }} className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none ${isDarkMode ? 'bg-[#151E32] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                    <option value="">-- Select Course --</option>
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-4 py-1">
                  <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>OR</span>
                  <div className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                </div>

                {/* Option 2: Custom URL */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>External Web Link</label>
                  <input type="text" placeholder="Label (e.g. LeetCode)" value={t.customLink?.label || ''} onChange={e => { updateTask(t.id, 'customLink', { ...t.customLink, label: e.target.value }); updateTask(t.id, 'linkedCourseId', null); }} className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold mb-2 outline-none ${isDarkMode ? 'bg-[#151E32] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                  <input type="url" placeholder="URL (https://...)" value={t.customLink?.url || ''} onChange={e => { updateTask(t.id, 'customLink', { ...t.customLink, url: e.target.value }); updateTask(t.id, 'linkedCourseId', null); }} className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none ${isDarkMode ? 'bg-[#151E32] border-slate-600 text-blue-400' : 'bg-white border-slate-300 text-blue-600'}`} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { updateTask(t.id, 'linkedCourseId', null); updateTask(t.id, 'customLink', {label:'', url:''}); }} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Clear Links</button>
                  <button onClick={() => setLinkModalTarget(null)} className="flex-[2] py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md">Save & Close</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* --- EXPORT ROUTINE MODAL --- */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Export {selectedDay}</h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Select the days you want to apply this routine to.</p>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {DAYS.filter(d => d !== selectedDay).map(day => (
                <label key={day} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${copyTargets.includes(day) ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-500' : 'bg-indigo-50 border-indigo-500') : (isDarkMode ? 'bg-black/20 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                  <input type="checkbox" checked={copyTargets.includes(day)} onChange={(e) => setCopyTargets(e.target.checked ? [...copyTargets, day] : copyTargets.filter(d => d !== day))} className="w-4 h-4 rounded text-indigo-500" />
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{day}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button disabled={copyTargets.length === 0} onClick={() => handleExecuteCopy('replace')} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors disabled:opacity-50">Replace Routine</button>
              <button disabled={copyTargets.length === 0} onClick={() => handleExecuteCopy('merge')} className={`w-full py-3 rounded-xl border font-bold text-sm transition-colors disabled:opacity-50 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>Merge Routine</button>
              <button onClick={() => setCopyModalOpen(false)} className={`w-full py-3 mt-2 text-sm font-bold ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
