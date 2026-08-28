import React, { useState, useEffect, useMemo } from 'react';

// --- ICON IMPORTS ---
import { 
  Search, Plus, SortDesc, BookOpen, Columns
} from 'lucide-react';

// --- COMPONENT IMPORTS ---
import { CourseCard } from '../components/ui/CourseCard';
import { Header } from '../components/ui/Header';

export default function CoursesView({ 
  playlists, isLoading = false, onOpen, onAdd, onDelete, onEdit, isDarkMode, setIsDarkMode, userData = {} 
}) {
  
  // --- STATE: UI CONTROLS ---
  const [sortOrder, setSortOrder] = useState('oldest'); 
  const [gridCols, setGridCols] = useState(5);
  const [showGridMenu, setShowGridMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // --- STATE: SEARCH & DEBOUNCE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // --- EFFECT: SEARCH DEBOUNCE ---
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowSortMenu(false);
        setShowGridMenu(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc); // Cleanup
  }, []);

  // --- LOGIC: FILTER & SORT ---
  const filteredAndSortedPlaylists = useMemo(() => {
    const lowerSearch = debouncedSearch.toLowerCase();

    let result = [...(playlists || [])].filter(p => 
      p.title?.toLowerCase().includes(lowerSearch)
    );

    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortOrder === 'a-z') {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return result;
  }, [playlists, debouncedSearch, sortOrder]);

  // --- LOGIC: DYNAMIC GRID COLUMNS ---
  const getGridClass = () => {
    if (gridCols === 4) return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4";
    if (gridCols === 5) return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
    if (gridCols === 6) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
  };


  
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 font-['Inter',sans-serif] ${isDarkMode ? 'bg-slate-1000 text-slate-200' : 'bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_30%),linear-gradient(180deg,#F5F7FB_0%,#EEF2F8_100%)] text-slate-800'}`}>
      
      {/* 1. GLOBAL HEADER COMPONENT */}
      <Header 
         isDarkMode={isDarkMode} 
         setIsDarkMode={setIsDarkMode} 
         activePage="library" 
         positionClass="sticky top-0"
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 w-[96%] max-w-[1400px] mx-auto py-4 sm:py-8">
        <div className="relative w-full flex flex-col pb-12 animate-in fade-in duration-700 min-h-[calc(100vh-80px)]">
        
          {/* FIXED BACKGROUND OVERLAY */}
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
             <div 
               className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
               style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')` }}
             />
             <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-[#0B1121]/80 via-[#0B1121]/90 to-[#0B1121]' : 'bg-gradient-to-b from-white/30 via-[#F5F7FB]/55 to-[#EEF2F8]/90'}`} />
          </div>
          
          <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
            {/* PAGE TITLE */}
            <div className="z-30 max-w-xl">
               <h1 className={`text-[1.9rem] sm:text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Library</h1>
                <p className={`text-xs sm:text-sm font-medium mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage and access your local and external courses.</p>
            </div>

            {/* PREMIUM TOOLBAR */}
            <div className={`relative z-30 p-2.5 sm:p-3 w-full lg:w-[70%] rounded-2xl shadow-sm mb-2 sm:mb-3 lg:mb-8 flex flex-row gap-2 sm:gap-4 items-center justify-between transition-colors border backdrop-blur-xl
              ${isDarkMode ? 'bg-slate-800/70 border-white/10' : 'bg-white/78 border-slate-200/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]'}`}
              >
               
               {/* Search Input */}
               <div className="relative w-2/3 md:max-w-sm group">
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                  <input 
                    type="text" 
                    placeholder="Search courses..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 rounded-xl text-xs sm:text-sm font-medium outline-none transition-all duration-200 ease-out focus:ring-2 focus:ring-indigo-500/30 border
                      ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-[#F6F8FC] border-slate-200/80 text-slate-900 placeholder:text-slate-400'}`}
                  />
               </div>

               {/* Controls */}
               <div className="flex items-stretch sm:items-center gap-2 w-1/3 md:w-auto">
                  
                  {/* Sort Dropdown */}
                  <div className="relative w-10 sm:w-auto shrink-0">
                    <button 
                      onClick={() => { setShowSortMenu(!showSortMenu); setShowGridMenu(false); }}
                      className={`w-10 sm:w-full flex items-center justify-center gap-2 px-0 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ease-out hover:brightness-110 border
                        ${isDarkMode ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500' : 'bg-[#F6F8FC] text-slate-700 border-slate-200/80 hover:border-slate-300'}`}
                    >
                      <SortDesc className="w-4 h-4" /> <span className="hidden sm:inline">Sort</span>
                    </button>
                    {showSortMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                        <div className={`absolute right-0 mt-2 w-40 rounded-xl border shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200
                          ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80 shadow-[0_20px_40px_rgba(15,23,42,0.08)]'}`}>
                          {[ {id:'oldest', label:'Oldest First'}, {id:'newest', label:'Newest First'},{id:'a-z', label:'Alphabetical'}].map(opt => (
                             <button 
                                key={opt.id}
                                onClick={() => { setSortOrder(opt.id); setShowSortMenu(false); }}
                                className={`w-full px-4 py-2.5 text-sm font-semibold text-left transition-colors 
                                  ${sortOrder === opt.id 
                                    ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600') 
                                    : (isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')}`}
                             >
                                {opt.label}
                             </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>



                  {/* Grid Layout Dropdown */}
                  <div className="relative hidden lg:block">
                    <button 
                      onClick={() => { setShowGridMenu(!showGridMenu); setShowSortMenu(false); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out hover:brightness-110 border
                        ${isDarkMode ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500' : 'bg-[#F6F8FC] text-slate-700 border-slate-200/80 hover:border-slate-300'}`}
                    >
                      <Columns className="w-4 h-4" /> {gridCols} Cols
                    </button>
                    {showGridMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowGridMenu(false)}></div>
                        <div className={`absolute right-0 mt-2 w-32 rounded-xl border shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200
                          ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/80 shadow-[0_20px_40px_rgba(15,23,42,0.08)]'}`}>
                          {[4,5,6].map(num => (
                             <button 
                                key={num}
                                onClick={() => { setGridCols(num); setShowGridMenu(false); }}
                                className={`w-full px-4 py-2.5 text-sm font-semibold text-left transition-colors
                                  ${gridCols === num 
                                    ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600') 
                                    : (isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')}`}
                             >
                                {num} Columns
                             </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Add Course Button */}
                  <button 
                    onClick={onAdd}
                    className="flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-2.5 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-transform duration-200 hover:scale-105 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Course</span>
                  </button>

               </div>
            </div>
          </div>

          {/* 3. GRID SYSTEM */}
          {isLoading && filteredAndSortedPlaylists.length === 0 ? (
            <div className={`grid ${getGridClass()} gap-3 sm:gap-5 pb-16 sm:pb-20`}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                    className={`rounded-2xl overflow-hidden border animate-pulse ${
                    isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className={`aspect-video w-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200/80'}`} />
                  <div className="p-5 space-y-3">
                    <div className={`h-4 w-3/4 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200/80'}`} />
                    <div className={`h-3 w-1/2 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                    <div className={`h-2 w-full rounded ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedPlaylists.length === 0 ? (
            <div className={`text-center py-24 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-colors
               ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/85 border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]'}`}>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/80'}`}>
                <BookOpen className={`h-10 w-10 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No courses found</h3>
              <p className={`text-sm font-medium mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                 {debouncedSearch ? "Try adjusting your search criteria." : "Your library is empty. Let's add something to learn."}
              </p>
              {!debouncedSearch && (
                <button onClick={onAdd} className="text-indigo-500 font-semibold hover:text-indigo-400 transition-colors">
                   Import a new course &rarr;
                </button>
              )}
            </div>
          ) : (
            <div className={`mt-2 sm:mt-4 grid ${getGridClass()} gap-5 pb-20`}>
              {filteredAndSortedPlaylists.map(playlist => (
                <CourseCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  onClick={() => {
                    if (playlist.isExternal && playlist.externalUrl) {
                      window.open(playlist.externalUrl, '_blank', 'noopener,noreferrer');
                      return;
                    }
                    onOpen(playlist.id);
                  }} 
                  onDelete={onDelete} 
                  onEdit={onEdit}
                  isDarkMode={isDarkMode}
                  userData={userData?.[playlist.id] || {}} 
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
