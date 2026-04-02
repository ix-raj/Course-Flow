import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// --- UI COMPONENTS ---
import { Header } from '../components/ui/Header';
import { HeroIllustration } from '../components/illustrations/HeroIllustration';

// --- ICON IMPORTS ---
import { 
  BookOpen, Clock, Folder, Plus, 
  LayoutGrid, HardDrive, PenTool, CheckSquare, 
  TrendingUp, Monitor, Target, PlayCircle, ChevronRight,
  Shield, Sparkles, Coffee 
} from 'lucide-react';

// --- UTILS & HELPERS ---
import { getTodayDay, getTodayDateStr } from '../utils/dateUtils';
import { calculateCourseProgress, formatStudyHours } from '../utils/metrics';

// INLINE COMPONENT: DASHBOARD COURSE CARD
const DashboardCourseCard = ({ playlist, onClick, userData, isDarkMode }) => {

  const progress = calculateCourseProgress(playlist, userData);

  return (
    <div 
      onClick={onClick}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg cursor-pointer overflow-hidden
      ${isDarkMode ? 'bg-[#1E293B] border-white/10 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
    >
       <div className="relative h-40 w-full overflow-hidden bg-slate-800">
          {playlist.cover ? (
             <img src={playlist.cover} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-slate-800"><Monitor className="w-8 h-8 text-indigo-500" /></div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90" />
          
          {/* Hover Action (Play Button) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[2px]">
             <div className="bg-indigo-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-md">
                <PlayCircle className="w-4 h-4" /> Continue
             </div>
          </div>
       </div>

       <div className="p-4 flex flex-col flex-1">
          <h3 className={`text-base font-bold line-clamp-1 mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{playlist.title}</h3>
          <p className={`text-xs font-medium mb-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{playlist.videoCount} Lessons</p>
          
          <div className="mt-auto">
             <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Progress</span>
                <span className="text-xs font-bold text-indigo-500">{progress}%</span>
             </div>
             <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
             </div>
          </div>
       </div>
    </div>
  );
};

// INLINE COMPONENT: FEATURE CARD
const FeatureCard = ({ icon: Icon, colorClass, bgClass, title, desc, isDarkMode }) => (
  <div className={`p-6 rounded-2xl border transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-blue-400/20 border-slate-200 shadow-sm'}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${bgClass}`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
  </div>
);

export default function LandingPage({ playlists, onViewCourses, onOpen, userData, onAdd, isDarkMode, setIsDarkMode }) {
  const totalCourses = playlists.length;
  const navigate = useNavigate();
  
  // Stats Calculations
  const totalVideosWatched = Object.values(userData).reduce((acc, playlist) => {
    return acc + Object.values(playlist).filter(file => file.completed).length;
  }, 0);

  const totalSecondsWatched = Object.values(userData).reduce((acc, playlist) => {
    const playlistSeconds = Object.values(playlist).reduce((pAcc, file) => pAcc + (file.time || 0), 0);
    return acc + playlistSeconds;
  }, 0);

  const studyHours = formatStudyHours(totalSecondsWatched);

  // Daily Widget Calculations 
  const dailyStats = useMemo(() => {
    try {
      
      const todayDay = getTodayDay();
      const todayDateStr = getTodayDateStr();
      
      const weeklyPlan = JSON.parse(localStorage.getItem('cf_v3_weekly_plan') || '{}');
      const completionLog = JSON.parse(localStorage.getItem('cf_v3_completion_log') || '{}');
      
      const todaysData = weeklyPlan[todayDay] || { subjects: [] };
      const allTodaysTasks = todaysData.subjects.flatMap(s => s.tasks || []);
      const completedToday = allTodaysTasks.filter(t => completionLog[`${todayDateStr}_${t.id}`]).length;
      
      return { total: allTodaysTasks.length, completed: completedToday };
    } catch { return { total: 0, completed: 0 }; }
  }, []);

  const scrollToCourses = () => {
    const element = document.getElementById('courses-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    else onViewCourses();
  };

  return (
    <div className={`flex flex-col min-h-screen font-['Inter',sans-serif] transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
      
      {/* Universal Header Component */}
      <Header 
         isDarkMode={isDarkMode} 
         setIsDarkMode={setIsDarkMode} 
         activePage="home" 
         positionClass="sticky top-0"
      />

      {/* 1. HERO SECTION */}
      <div className="relative pt-24 pb-40 overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white">

        {/* Subtle Radial Highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />
        
        {/* Hero Content */}
        <div className="w-[96%] max-w-[1600px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between" >
          <div className="md:w-1/2 text-left pt-10 pr-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-6 text-white">
              Your Professional <br/> Learning Workspace
            </h1>
            <p className="text-base md:text-lg font-medium leading-relaxed mb-10 max-w-xl text-slate-400">
              Take control of your learning path with a clean, structured productivity system designed for serious learners.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <button 
                onClick={scrollToCourses}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm px-8 py-3.5 shadow-sm hover:shadow-md transform transition-all duration-200 hover:scale-105 rounded-xl"
              >
                Access Library
              </button>
              <button 
                onClick={() => navigate('/goals')}
                className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-semibold text-sm px-8 py-3.5 shadow-sm transform transition-all duration-200 rounded-xl"
              >
                Explore Goals
              </button>
            </div>
          </div>
          <div className="md:w-2/5 mt-16 md:mt-0 flex justify-center md:justify-end relative opacity-90 hover:-translate-y-2 transition-transform duration-700">
            <div className="w-full max-w-2xl transform scale-100">
               <HeroIllustration />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAILY SNAPSHOT WIDGET */}
      <div className="w-[96%] max-w-[1600px] mx-auto -mt-10 relative z-20 ">
         <div className={`p-5 rounded-2xl shadow-lg border grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x ${isDarkMode ? 'bg-[#1E293B] border-white/10 divide-white/5' : 'bg-white border-slate-200 divide-slate-100'}`}>
            
            <div className="flex items-center gap-4 md:px-4">
               <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5 text-indigo-500" />
               </div>
               <div>
                  <p className={`text-sm font-semibold mb-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Tasks Today</p>
                  <p className="text-xs font-medium text-slate-500">{dailyStats.completed} of {dailyStats.total} completed</p>
               </div>
            </div>

            <div className="flex items-center gap-4 md:px-4 pt-5 md:pt-0">
               <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-green-500" />
               </div>
               <div>
                  <p className={`text-sm font-semibold mb-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Focus Time</p>
                  <p className="text-xs font-medium text-slate-500">{studyHours} hrs total</p>
               </div>
            </div>

            <div className="flex items-center gap-4 md:px-4 pt-5 md:pt-0">
               <div className="w-12 h-12 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5 text-yellow-500" />
               </div>
               <div>
                  <p className={`text-sm font-semibold mb-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Active Courses</p>
                  <p className="text-xs font-medium text-slate-500">{totalCourses} enrolled</p>
               </div>
            </div>

         </div>
      </div>

      {/* 3. ADD GOAL SYSTEM HIGHLIGHT */}
      <div className={`py-20 border-b transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
         <div className="w-[96%] max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-10">
            <div className="lg:w-1/2">
               <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Stay Consistent, <br/>Not Just Motivated</h2>
               <p className={`text-base leading-relaxed mb-8 max-w-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Plan daily goals, track progress, and build learning habits. Course Flow features a unified productivity system built directly into your local learning environment.</p>
               <button onClick={() => navigate('/goals')} className="flex items-center gap-2 text-indigo-500 font-semibold hover:text-indigo-400 transition-colors group">
                  Configure Your Planner <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
            
            <div className="lg:w-1/2 w-full">
               <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-5">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-yellow-400/10 text-yellow-500"><CheckSquare className="w-5 h-5"/></div>
                        <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Today's Blueprint</span>
                     </div>
                     <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">In Progress</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                     {['Review documentation', 'Watch Lesson 4 & 5', 'Complete coding exercise'].map((task, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-[#0F172A] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                           <CheckSquare className={`w-4 h-4 ${i === 0 ? 'text-indigo-500' : 'text-slate-400'}`} />
                           <span className={`text-sm font-medium ${i === 0 ? (isDarkMode ? 'text-slate-500 line-through' : 'text-slate-400 line-through') : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{task}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. DASHBOARD STRIP (Progress) */}
      <div className={`py-16 transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'}`}>
         <div className="w-[96%] max-w-[1600px] mx-auto">
            <div className={`p-6 rounded-3xl flex flex-col md:flex-row items-center gap-8 border shadow-sm ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
               <div className="md:w-1/3 w-full">
                  <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Global Metrics</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your lifetime progress and consistency overview.</p>
               </div>
               
               <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Video Completion</span>
                        <span className="text-sm font-bold text-indigo-500">{totalVideosWatched} lessons</span>
                     </div>
                     <div className={`h-2 rounded-full w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }}></div>
                     </div>
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Library Depth</span>
                        <span className="text-sm font-bold text-green-500">{totalCourses} courses</span>
                     </div>
                     <div className={`h-2 rounded-full w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 5. FEATURE CARDS */}
      <div className={`pb-20 pt-8 relative z-10 transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white'}`}>
        <div className="w-[96%] max-w-[1600px] mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Everything you need. <br/>Nothing you don't.</h2>
            <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>A focused feature-set designed to respect your time and attention.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard isDarkMode={isDarkMode} icon={HardDrive} colorClass="text-indigo-500" bgClass="bg-indigo-500/10" title="Centralized Library" desc="Import folders directly from your computer. Organize all your video tutorials and resources in one dashboard." />
            <FeatureCard isDarkMode={isDarkMode} icon={TrendingUp} colorClass="text-green-500" bgClass="bg-green-500/10" title="Progress Tracking" desc="Never lose your place. Automatically track which videos you've watched and see completion status instantly." />
            <FeatureCard isDarkMode={isDarkMode} icon={PenTool} colorClass="text-yellow-500" bgClass="bg-yellow-400/10" title="Smart Notes & Doubts" desc="Take context-aware notes while watching. Jot down doubts linked to specific timestamps for review." />
            <FeatureCard isDarkMode={isDarkMode} icon={Shield} colorClass="text-blue-500" bgClass="bg-blue-500/10" title="Local First Privacy" desc="All your data stays safely on your machine. No cloud tracking, no subscriptions, just pure productivity." />
            <FeatureCard isDarkMode={isDarkMode} icon={Sparkles} colorClass="text-purple-500" bgClass="bg-purple-500/10" title="Immersive UI" desc="A premium dark-themed interface built with subtle glassmorphism to keep you focused and inspired." />
            <FeatureCard isDarkMode={isDarkMode} icon={Target} colorClass="text-red-500" bgClass="bg-red-500/10" title="Daily Planning" desc="Integrated weekly and daily goals to turn your learning intentions into consistent, actionable habits." />
          </div>
        </div>
      </div>

      {/* 6. COURSE GRID */}
      <div className={`py-20 border-t transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A] border-white/5' : 'bg-[#F8FAFC] border-slate-200'}`} id="courses-section">
        <div className="w-[96%] max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
             <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Courses</h2>
             <div className="flex gap-4">
               <button 
                  onClick={onViewCourses}
                  className={`flex items-center gap-2 border px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-sm ${isDarkMode ? 'bg-[#1E293B] text-slate-300 border-white/10 hover:border-slate-500' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Library</span>
                </button>

               <button 
                  onClick={onAdd}
                  className="flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-indigo-500 hover:bg-indigo-600"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
             </div>
          </div>
          
          {playlists.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#1E293B]/50 border-white/10' : 'bg-white/50 border-slate-200'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-slate-100'}`}>
                <Folder className={`h-8 w-8 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No courses added yet</h3>
              <p className={`max-w-sm mx-auto mb-6 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Get started by importing a folder containing your video tutorials and notes.</p>
              <button onClick={onAdd} className="text-indigo-500 font-semibold hover:text-indigo-400 transition-colors">
                Add your first playlist &rarr;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlists.slice(0, 4).map(playlist => (
                <DashboardCourseCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  onClick={() => onOpen(playlist.id)} 
                  userData={userData[playlist.id] || {}}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. ABOUT FOOTER  */}
      <div className="relative py-24 overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white mt-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
        <div className="w-[96%] max-w-[1600px] mx-auto relative z-10 text-center">
          <div className="flex flex-col items-center max-w-3xl mx-auto">
             <div className="p-3 rounded-2xl bg-indigo-500/10 mb-6">
                <Coffee className="w-8 h-8 text-indigo-400" />
             </div>
             <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for Focused Learning</h2>
             <p className="text-lg text-slate-400 leading-relaxed mb-10">
                      Course Flow brings together your learning and planning into one distraction-free environment — so you can focus on understanding, not managing tools             </p>
             <div className="flex items-center gap-8 py-6 border-t border-white/5 w-full justify-center">
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black text-white">Stay</span>
                   <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">Consistent</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black text-white">Learn</span>
                   <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">Faster</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col items-center">
                   <span className="text-2xl font-black text-white">Track</span>
                   <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">Progress</span>
                </div>
             </div>
          </div>
        </div>
      </div>




    </div>
  );
}