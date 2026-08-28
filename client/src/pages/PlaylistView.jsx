import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, X, FileText, Video, 
  Trash2, CheckSquare, Square, Search,
  StickyNote, MessageCircleQuestion, ClipboardList, Check, Edit3, Link as LinkIcon,
  PlayCircle, CheckCircle2, ChevronRight, BookOpen, PenTool, Lock, Unlock, ChevronDown, ChevronUp, Bookmark
} from 'lucide-react';
import { Header } from '../components/ui/Header';
import { restoreHandle, scanDirectory, openDirectory } from '../utils/fileSystem';
import LocalVideoPlayer from '../components/player/LocalVideoPlayer';

// --- UTILITIES ---
import { calculateCourseProgress } from '../utils/metrics';

export default function PlaylistView({ playlist, files, onBack, onReconnect, userData, onUpdateProgress, onToggleCompletion, onAddEntry, onRemoveEntry, onToggleTask, onUpdateDoubtAnswer, onUpdateCourseMeta, onUpdateCourseLinks, isDarkMode, setIsDarkMode }) {
  const [activeTab, setActiveTab] = useState('videos'); 
  const [currentFile, setCurrentFile] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);

  // --- SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // --- REFS ---
  const activeNodeRef = useRef(null);
  const workspaceRef = useRef(null); 
  const timelineContainerRef = useRef(null); 

  // New States
  const [goalInput, setGoalInput] = useState('');
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(false); 
  const [isDoubtsModalOpen, setIsDoubtsModalOpen] = useState(false);
  const [selectedDoubtVideo, setSelectedDoubtVideo] = useState(null);
  const [isUnlockAll, setIsUnlockAll] = useState(true); 
  const doubtInputRef = useRef(null);
  const courseMeta = userData['_COURSE_META_'] || {
    courseNotes: '',
    notionUrl: '',
    revisionList: []
  };

  const formatFileName = (name) => {
    if (!name) return '';
    return name.replace(/\.[^/.]+$/, ""); // Strips the file extension
  };

  // Notes & Revision State
  const [notesMode, setNotesMode] = useState('local');
  const [courseNotes, setCourseNotes] = useState(() => courseMeta.courseNotes || '');
  const [notionUrl, setNotionUrl] = useState(() => courseMeta.notionUrl || '');
  
  // NEW: Revision tracking state
  const [revisionList, setRevisionList] = useState(() => courseMeta.revisionList || []);

  // Custom Editable Links State
  const [customLinks, setCustomLinks] = useState(() => {
    return playlist.customLinks?.length ? playlist.customLinks : [
      { label: 'A', url: '' },
      { label: 'B', url: '' },
      { label: 'C', url: '' },
      { label: 'D', url: '' }
    ];
  });

  // --- SEARCH DEBOUNCE EFFECT ---
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleUpdateLink = (index) => {
    const newUrl = prompt("Enter the URL for this button:", customLinks[index].url);
    if (newUrl !== null) {
       const newLabel = prompt("Enter a label for this button:", customLinks[index].label) || customLinks[index].label;
       const newLinks = [...customLinks];
       newLinks[index] = { label: newLabel, url: newUrl };
       setCustomLinks(newLinks);
       onUpdateCourseLinks(playlist.id, newLinks);
     }
   };

  const handleToggleRevision = (fileName) => {
    const newList = revisionList.includes(fileName) 
      ? revisionList.filter(name => name !== fileName)
      : [...revisionList, fileName];
    setRevisionList(newList);
    onUpdateCourseMeta(playlist.id, { revisionList: newList });
  };
  
  const fileList = useMemo(() => files ? Array.from(files) : [], [files]);
  
  const videos = useMemo(() => 
    fileList.filter(f => {
       const isVid = f.type.startsWith('video/') || /\.(mp4|webm|ogg|mkv|avi|mov|wmv|m4v)$/i.test(f.name);
       return isVid && f.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    }).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})), 
  [fileList, debouncedSearch]);
  
  const filesList = useMemo(() => 
    fileList.filter(f => {
       const isNote = f.type === 'application/pdf' || f.type.startsWith('text/') || /\.(pdf|txt|md|doc|docx)$/i.test(f.name);
       return isNote && f.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    }).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})), 
  [fileList, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (workspaceRef.current) {
        const yOffset = workspaceRef.current.getBoundingClientRect().top + window.scrollY - 55; // 80px accounts for the sticky header
        window.scrollTo({ top: yOffset, behavior: 'smooth' });
      }
    }, 150); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (videos.length > 0 && !currentFile) {
       const firstUnfinished = videos.find(v => !userData[v.name]?.completed);
       // eslint-disable-next-line react-hooks/set-state-in-effect
       setCurrentFile(firstUnfinished || videos[0]);
    }
  }, [currentFile, userData, videos]);


  useEffect(() => {
    if (activeNodeRef.current && timelineContainerRef.current && activeTab === 'videos') {
      const container = timelineContainerRef.current;
      const activeNode = activeNodeRef.current;
      
      const targetScrollTop = activeNode.offsetTop - (container.clientHeight / 2) + (activeNode.clientHeight / 2) ;
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [currentFile, activeTab]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (courseNotes !== courseMeta.courseNotes) {
        onUpdateCourseMeta(playlist.id, { courseNotes });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [courseNotes, courseMeta.courseNotes, onUpdateCourseMeta, playlist.id]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (notionUrl !== courseMeta.notionUrl) {
        onUpdateCourseMeta(playlist.id, { notionUrl });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [notionUrl, courseMeta.notionUrl, onUpdateCourseMeta, playlist.id]);
  const handleQuickReconnect = async () => {
    setIsReconnecting(true);
    let handle = await restoreHandle(playlist.folderName);
    if (!handle) { const confirm = window.confirm(`Permission expired. Select the folder '${playlist.folderName}' again.`); if(confirm) handle = await openDirectory(); }
    if (handle) { const list = await scanDirectory(handle); onReconnect(list); }
    setIsReconnecting(false);
  };

  const getSubtitleFile = (videoFile) => {
    if (!videoFile || !videoFile.name) return null;
    const baseName = videoFile.name.substring(0, videoFile.name.lastIndexOf('.'));
    return fileList.find(f => f.name.endsWith('.vtt') && f.name.startsWith(baseName));
  };

  const handleAddDoubt = (vidName, text) => {
    if(!text.trim()) return;
    onAddEntry(playlist.id, vidName, 'doubts', text);
  };

  const handleSaveAnswer = (vidName, idx, text) => {
    onUpdateDoubtAnswer(playlist.id, vidName, idx, text);
  };

  const getDoubtQuestion = (doubt) => {
    if (typeof doubt === 'string') return doubt;
    return doubt?.question || '';
  };

  const getDoubtAnswer = (doubt) => {
    if (typeof doubt === 'string') return '';
    return doubt?.answer || '';
  };

  if (!files || fileList.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-slate-50'}`}>
        <div className={`p-8 rounded-2xl shadow-xl max-w-md w-full border ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6"><Folder className="h-8 w-8" /></div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Resume Access</h2>
          <p className={`mb-8 leading-relaxed font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>To continue your progress in <strong>{playlist.folderName}</strong>, please verify access.</p>
          <button onClick={handleQuickReconnect} disabled={isReconnecting} className="w-full px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {isReconnecting ? "Connecting..." : <><Folder className="w-5 h-5" /> Restore Connection</>}
          </button>
          <button onClick={onBack} className={`mt-6 text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>Back to Library</button>
        </div>
      </div>
    );
  }

  // Analytics
  const courseGoals = userData['_COURSE_GOALS_']?.tasks || [];
  const completedVideos = videos.filter(f => userData[f.name]?.completed).length;
  const completedGoals = courseGoals.filter(g => g.done).length;
  
  // METRICS INTEGRATION
  const progressPercent = calculateCourseProgress(playlist, userData);
  const goalsProgress = courseGoals.length > 0 ? Math.round((completedGoals / courseGoals.length) * 100) : 0;

  const currentVideoIndex = videos.indexOf(currentFile);
  const nextVideo = currentVideoIndex >= 0 && currentVideoIndex < videos.length - 1 ? videos[currentVideoIndex + 1] : null;

  const firstUncompletedIdx = videos.findIndex(f => !userData[f.name]?.completed);
  const unlockedThreshold = firstUncompletedIdx === -1 ? videos.length : firstUncompletedIdx;

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 font-['Inter',sans-serif] ${isDarkMode ? 'bg-[#0F142A] text-slate-300' : 'bg-[#F8FAFC] text-slate-800'}`}>
      
      <Header 
         isDarkMode={isDarkMode} 
         setIsDarkMode={setIsDarkMode} 
         activePage="library" 
      />
      
      {/* HERO SECTION */}
      <div className={`border-b transition-colors duration-300 ${isDarkMode ? 'bg-[#0F142A] border-white/5' : 'bg-white border-slate-200'}`}>
           <div className="w-[96%] max-w-[1600px] mx-auto py-8 flex flex-col lg:flex-row items-start justify-between gap-8">
              
              <div className="flex-1 w-full">
                 <h1 className={`text-[1.85rem] sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{playlist.title}</h1>
                 <p className={`text-xs sm:text-base font-medium max-w-2xl pl-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{playlist.description || "Master this subject by completing the lessons and tracking your goals."}</p>
                 
                 {/* Progress Bar */}
                 <div className="mt-2 sm:mt-3 max-w-xl">
                    <div className="flex justify-between items-center mb-2">
                       <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Course Progress</span>
                       <span className="text-sm font-bold text-indigo-500">{progressPercent}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                       <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className={`text-xs mt-2 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{completedVideos} of {videos.length} lessons completed</p>
                 </div>
              </div>

              {/* Top Right Custom Buttons */}
              <div className="w-full lg:w-auto grid grid-cols-2 sm:flex sm:flex-row gap-3 shrink-0">
                 {customLinks.map((link, idx) => (
                   <div key={idx} className="relative group flex-1 sm:flex-none min-w-[100px]">
                     <button 
                       onClick={() => link.url ? window.open(link.url, '_blank') : handleUpdateLink(idx)}
                       className={`w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-all border shadow-sm 
                         ${link.url 
                           ? (isDarkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100') 
                           : (isDarkMode ? 'bg-slate-800/50 border-dashed border-slate-700 text-slate-500 hover:text-white' : 'bg-slate-50 border-dashed border-slate-300 text-slate-500 hover:text-slate-800')}`}
                     >
                       {link.label}
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); handleUpdateLink(idx); }} className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 shadow-md transition-all hover:scale-105 z-10 border border-slate-600">
                        <Edit3 className="w-3 h-3" />
                     </button>
                   </div>
                 ))}
              </div>
           </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div id="main-workspace" ref={workspaceRef} className="flex-1 w-[96%] max-w-[1600px] mx-auto py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
           
           {/* LEFT PANEL: PLAYER & GOALS */}
           <div className="xl:col-span-3 flex flex-col gap-6 relative">
               
               {/* EXPANDABLE COURSE GOALS */}
               <div className={`border rounded-2xl shadow-sm transition-colors duration-300 overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200'}`}>
                  <button 
                     onClick={() => setIsGoalsExpanded(!isGoalsExpanded)} 
                     className={`w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-cyan-50 border border-indigo-100'}`}>
                           <ClipboardList className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                        <div className="flex flex-col items-start flex-1 w-full">
                           <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Course Goals</h3>

                        </div>
                     </div>
                     {isGoalsExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  
                  {isGoalsExpanded && (
                     
                     <div className={`p-4 sm:p-6 border-t transition-colors ${isDarkMode ? 'bg-[#0F122A] border-white/10' : 'bg-slate-50/50 border-slate-100'}`}>
                           
                        <div className="flex items-center gap-3 w-full mt-1.5 mb-8">
                           <div className={`flex-1 h-2.5  rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`}>
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500" style={{width: `${goalsProgress}%`}}></div>
                           </div>
                           <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{completedGoals}/{courseGoals.length}</span>
                        </div>
                        
                    {/* COURSE GOALS LIST */}
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mb-5">
                    {courseGoals.length === 0 && (
                      <p className={`text-sm font-medium italic text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        No goals set yet. Add one below!
                      </p>
                    )}
                    
                    {courseGoals.map((task, i) => (
                      <div key={i} className={`group flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition-all border ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-sm'}`}>
                        
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Poppy Checkbox (Matches Routine Page) */}
                          <button 
                            onClick={() => onToggleTask(playlist.id, '_COURSE_GOALS_', i)} 
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 border-2 shrink-0 ${
                              task.done 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                                : isDarkMode 
                                  ? 'border-slate-600 hover:border-emerald-500/50 text-transparent' 
                                  : 'border-slate-300 hover:border-emerald-500/50 text-transparent'
                            }`}
                          >
                            <Check className={`w-4 h-4 transition-transform duration-300 ${task.done ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
                          </button>
                          
                          <span className={`text-sm font-semibold break-words transition-colors ${task.done ? (isDarkMode ? 'text-slate-500 line-through' : 'text-slate-400 line-through') : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                            {task.text}
                          </span>
                        </div>

                        {/* Hover Trash Action */}
                        <button 
                          onClick={() => onRemoveEntry(playlist.id, '_COURSE_GOALS_', 'tasks', i)} 
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* ADD GOAL INPUT */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <input 
                      type="text" 
                      value={goalInput} 
                      onChange={e => setGoalInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          onAddEntry(playlist.id, '_COURSE_GOALS_', 'tasks', goalInput);
                          setGoalInput('');
                        }
                      }}
                      placeholder="Add a new assignment or objective..."
                      className={`flex-1 px-4 py-3 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner ${isDarkMode ? 'bg-black/30 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                    />
                    <button 
                      onClick={() => {
                        if (goalInput.trim()) {
                          onAddEntry(playlist.id, '_COURSE_GOALS_', 'tasks', goalInput);
                          setGoalInput('');
                        }
                      }}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 shrink-0"
                    >
                      Add Goal
                    </button>
                  </div>
                     </div>
                  )}
               </div>
               
               {/* THE UNIFIED LESSON CARD (Player + Dashboard) */}
               {currentFile && (
                 <div className={`border p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col gap-4 sm:gap-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200'}`}>
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors">
                      <div className="flex-1 sm:pr-4">
                        <span className={`text-xs font-black uppercase tracking-widest mb-1 block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Lesson {currentVideoIndex + 1}</span>
                        <h2 className={`text-lg sm:text-xl md:text-2xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentFile.name}</h2>
                      </div>
                      
                      <div className="flex flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                        {/* Mark for Revision Button */}
                        <button 
                           onClick={() => handleToggleRevision(currentFile.name)}
                           title="Mark for Revision"
                           className={`flex-1 sm:flex-none p-2.5 rounded-xl border transition-all flex items-center justify-center
                             ${revisionList.includes(currentFile.name) 
                               ? (isDarkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm' : 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm')
                               : (isDarkMode ? 'bg-transparent border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-500/30' : 'bg-transparent border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300')}`}
                        >
                           <Bookmark className={`w-5 h-5 ${revisionList.includes(currentFile.name) ? 'fill-current' : ''}`} />
                        </button>

                        <button 
                          onClick={() => onToggleCompletion(playlist.id, currentFile.name)} 
                          className={`flex-1 sm:flex-none w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2
                            ${userData[currentFile.name]?.completed 
                               ? (isDarkMode ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100')
                               : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                        >
                          {userData[currentFile.name]?.completed ? <><CheckCircle2 className="w-4 h-4" /> Completed</> : <><CheckSquare className="w-4 h-4" /> Mark as Done</>}
                        </button>
                      </div>
                    </div>

                    {/* Integrated Player */}
                    <div className={`w-full rounded-2xl overflow-hidden border shadow-md ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <LocalVideoPlayer 
                         file={currentFile} 
                         subtitleFile={getSubtitleFile(currentFile)}
                         initialTime={currentFile ? (userData[currentFile.name]?.time || 0) : 0}
                         onProgress={(time, dur) => {
                            if (currentFile && currentFile.name) {
                               onUpdateProgress(playlist.id, currentFile.name, time, dur);
                            }
                         }}
                         onEnded={() => {
                            if (currentFile && !userData[currentFile.name]?.completed) onToggleCompletion(playlist.id, currentFile.name);
                            if (nextVideo) setCurrentFile(nextVideo);
                         }}
                         
                        hasNext={!!nextVideo}
                        hasPrevious={currentVideoIndex > 0}
                        onNext={() => nextVideo && setCurrentFile(nextVideo)}
                        onPrevious={() => currentVideoIndex > 0 && setCurrentFile(videos[currentVideoIndex - 1])}
                      />
                    </div>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                       <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${isDarkMode ? 'bg-[#0F172A] border-white/5 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}><StickyNote className="w-4 h-4 text-indigo-500" /></div>
                         <div className="text-left">
                            <span className={`block text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Notepad</span>
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Master Notepad</span>
                         </div>
                       </button>
                       <button onClick={() => { setSelectedDoubtVideo(currentFile.name); setIsDoubtsModalOpen(true); }} className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${isDarkMode ? 'bg-[#0F172A] border-white/5 hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}><MessageCircleQuestion className="w-4 h-4 text-amber-500" /></div>
                         <div className="text-left">
                            <span className={`block text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Log Doubts</span>
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Ask & answer later</span>
                         </div>
                       </button>
                    </div>

                    {nextVideo && (
                       <div className={`mt-2 p-4 rounded-xl flex items-center justify-between gap-4 border transition-colors ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">Up Next</p>
                            <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{nextVideo.name}</p>
                          </div>
                          <button onClick={() => setCurrentFile(nextVideo)} className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isDarkMode ? 'bg-slate-800 hover:bg-indigo-500 text-white' : 'bg-white hover:bg-indigo-50 text-indigo-700 shadow-sm border border-slate-200'}`}>
                             Play Next <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    )}
                 </div>
               )}

           </div>

           {/* RIGHT PANEL: DATABASE */}
           <div className={`xl:col-span-2 border rounded-2xl sm:rounded-3xl p-3 sm:p-6 flex flex-col min-h-[520px] xl:h-[850px] shadow-sm relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200'}`}>
               
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 z-10">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <BookOpen className="w-5 h-5 text-indigo-500" /> Course
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                     {/* UNLOCK TOGGLE BUTTON */}
                     <button
                        onClick={() => setIsUnlockAll(!isUnlockAll)}
                        className={`p-2 rounded-lg border transition-all flex items-center justify-center shrink-0 ${
                           isUnlockAll
                           ? (isDarkMode ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 shadow-sm' : 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm')
                           : (isDarkMode ? 'bg-[#0F172A] border-slate-700 text-slate-500 hover:text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600')
                        }`}
                        title={isUnlockAll ? "Lock unreached lessons" : "Unlock all lessons"}
                     >
                        {isUnlockAll ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                     </button>
                     
                     {/* TABS */}
                     <div className={`flex p-1 rounded-lg border flex-1 w-full transition-colors ${isDarkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                         <button onClick={() => setActiveTab('videos')} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'videos' ? (isDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}>Lectures</button>
                         <button onClick={() => setActiveTab('files')} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'files' ? (isDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}>Files</button>
                         <button onClick={() => setActiveTab('notes')} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'notes' ? (isDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}>Notepad</button>
                     </div>
                  </div>
               </div>

               {activeTab !== 'notes' && (
                 <div className="relative w-full mb-4 z-10">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border ${isDarkMode ? 'bg-[#0F172A] border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                    />
                 </div>
               )}

               {/* GRADIENT TIMELINE UI */}
               {activeTab === 'videos' && (
                 <div ref={timelineContainerRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                    <div className="relative px-3 sm:px-6 -mx-1 sm:-mx-2 pt-4 pb-16 sm:pb-20">
                       
                       {/* Timeline Track Background */}
                       <div className={`absolute left-8 sm:left-12 top-6 bottom-0 w-2 -translate-x-1/2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                       
                       {/* Timeline Gradient Progress Line */}
                       <div 
                         className={`absolute left-8 sm:left-12 top-6 w-2 -translate-x-1/2 rounded-full transition-all duration-1000 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]`}
                         style={{ height: `${videos.length > 0 ? ((completedVideos) / videos.length) * 100 : 0}%` }}
                       ></div>

                       {videos.length === 0 ? <p className="text-center py-10 text-slate-500 font-medium">No Lectures found.</p> : videos.map((file, idx) => {
                          const isActive = currentFile === file;
                          const fileData = userData[file.name] || {};
                          const isCompleted = fileData.completed;
                          const isMarkedForRevision = revisionList.includes(file.name);
                          
                          const isLocked = !isUnlockAll && !isCompleted && !isActive && idx > unlockedThreshold;

                          return (
                            <div 
                              key={idx} 
                              ref={isActive ? activeNodeRef : null}
                              onClick={() => !isLocked && setCurrentFile(file)}
                              className={`relative mb-4 sm:mb-8 flex gap-3 sm:gap-6 group items-center ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                            >
                               {/* Timeline Node */}
                               <div className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full border-[3px] sm:border-4 flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300
                                  ${isActive ? 'bg-gradient-to-br from-indigo-500 to-cyan-400 border-none text-white scale-110 shadow-lg shadow-indigo-500/30' 
                                  : isCompleted ? (isDarkMode ? 'bg-slate-800 border-indigo-500 text-indigo-500' : 'bg-white border-indigo-500 text-indigo-600') 
                                  : isLocked ? (isDarkMode ? 'bg-[#0F172A] border-slate-700 text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-400')
                                  : (isDarkMode ? 'bg-[#0F172A] border-slate-600 text-slate-400 group-hover:border-slate-500 group-hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-500 group-hover:border-indigo-300 group-hover:bg-indigo-50')}`}
                               >
                                  {isActive ? <PlayCircle className="w-5 h-5 fill-current" /> 
                                   : isCompleted ? <Check className="w-5 h-5 stroke-" /> 
                                   : isLocked ? <Lock className="w-4 h-4" /> : (idx + 1)}
                               </div>

                               {/* Timeline Card */}
                               <div className={`flex-1 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300
                                   ${isActive ? (isDarkMode ? 'bg-indigo-500/10 border-indigo-500/30 scale-[1.02]' : 'bg-indigo-50 border-indigo-200 shadow-sm scale-[1.02]')
                                   : isCompleted ? (isDarkMode ? 'bg-[#0F172A] border-white/5' : 'bg-slate-50 border-slate-100')
                                   : isLocked ? (isDarkMode ? 'bg-[#0F172A]/50 border-slate-800/50' : 'bg-slate-50 border-slate-100')
                                   : (isDarkMode ? 'bg-[#0F172A] border-slate-700 group-hover:border-slate-500 group-hover:translate-x-1' : 'bg-white border-slate-200 group-hover:border-slate-300 group-hover:translate-x-1')}`}
                               >
                                  <div className="flex justify-between items-center gap-3">
                                     <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Lesson {idx + 1}</p>
                                        <p className={`text-xs sm:text-sm font-semibold line-clamp-2 ${isActive ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-700') : isCompleted ? (isDarkMode ? 'text-slate-300' : 'text-slate-800') : (isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900')}`}>
                                          {formatFileName(file.name)}
                                        </p>
                                     </div>
                                     <div className="flex items-center gap-2 shrink-0">
                                        {isMarkedForRevision && <Bookmark className={`w-4 h-4 text-amber-500 fill-current ${isActive ? 'opacity-100' : 'opacity-70'}`} />}
                                        {isCompleted && <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />}
                                     </div>
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
               )}

           {/* FILES TAB CONTENT */}
            {activeTab === 'files' && (
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {selectedPdf ? (
                  <div className="flex flex-col h-full min-h-[600px]">
                    <div className="flex items-center justify-between mb-3">
                      <button 
                        onClick={() => setSelectedPdf(null)} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                      >
                        &larr; Back to Files
                      </button>
                      
                      {/* New Button to open the Blob PDF in a full tab where Zoom always works */}
                      <button 
                        onClick={() => window.open(selectedPdf, '_blank')} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        Open in Full Tab &#8599;
                      </button>
                    </div>
                    
                    {/* Swapped iframe for object, which sometimes handles native PDF UI slightly better */}
                    <object 
                      data={selectedPdf} 
                      type="application/pdf"
                      className={`w-full flex-1 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-300' : 'border-slate-200 bg-white'}`} 
                    >
                      <p className="p-4 text-center">Your browser does not support embedded PDFs.</p>
                    </object>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filesList.length === 0 && <p className={`text-sm italic p-4 text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No documents found.</p>}
                    {filesList.map((f, i) => (
                      <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${isDarkMode ? 'bg-black/20 border-white/5 hover:bg-white/5' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className={`w-5 h-5 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                          <span className={`text-sm font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            {formatFileName(f.name)}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            if (f.name.toLowerCase().endsWith('.pdf')) {
                              // Reverted back to clean URL creation
                              setSelectedPdf(URL.createObjectURL(f));
                            } else {
                              window.open(URL.createObjectURL(f), '_blank');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

               {/* Notepad Tab */}
               {activeTab === 'notes' && (
                 <div className="flex-1 flex flex-col h-full animate-in fade-in duration-200 mt-2">
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => setNotesMode('local')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${notesMode === 'local' ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700') : (isDarkMode ? 'bg-[#0F172A] text-slate-400 border border-slate-700' : 'bg-slate-50 text-slate-500 border border-slate-200')}`}>Local Pad</button>
                      <button onClick={() => setNotesMode('notion')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${notesMode === 'notion' ? (isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700') : (isDarkMode ? 'bg-[#0F172A] text-slate-400 border border-slate-700' : 'bg-slate-50 text-slate-500 border border-slate-200')}`}>Notion Link</button>
                    </div>

                    {notesMode === 'local' ? (
                      <textarea 
                        value={courseNotes}
                        onChange={(e) => setCourseNotes(e.target.value)}
                        placeholder="Write master notes here..."
                        className={`flex-1 w-full p-4 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium no-scrollbar ${isDarkMode ? 'bg-[#0F172A] border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'}`}
                      />
                    ) : (
                      <div className="flex-1 flex flex-col gap-3">
                         <input 
                           type="url" 
                           value={notionUrl}
                           onChange={(e) => setNotionUrl(e.target.value)}
                           placeholder="Paste public Notion URL..."
                           className={`px-4 py-2.5 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/30 ${isDarkMode ? 'bg-[#0F172A] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                         />
                         <div className={`flex-1 rounded-xl border overflow-hidden flex items-center justify-center ${isDarkMode ? 'border-slate-700 bg-[#0F172A]' : 'border-slate-200 bg-slate-50'}`}>
                           {notionUrl ? <iframe src={notionUrl} className="w-full h-full border-none" title="Notion Notepad" /> : <p className="text-slate-500 text-sm font-medium">Paste a shared Notion URL above.</p>}
                         </div>
                      </div>
                    )}
                 </div>
               )}
           </div>
        </div>

        {/* PROFESSIONAL DOUBTS MODAL */}
        {isDoubtsModalOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsDoubtsModalOpen(false)}></div>
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-5xl h-[88vh] md:h-[80vh] border rounded-2xl shadow-2xl z-50 flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200'}`}>
               
               <div className={`w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r max-h-[34vh] md:max-h-none ${isDarkMode ? 'border-white/10 bg-[#0F172A]/50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`p-5 border-b flex items-center justify-between ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                       <MessageCircleQuestion className="w-5 h-5 text-amber-500" /> Doubt Log
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-4">
                     {videos.map((v, i) => {
                        const doubtCount = userData[v.name]?.doubts?.length || 0;
                        if (doubtCount === 0 && v.name !== selectedDoubtVideo) return null; 
                        
                        return (
                          <button 
                            key={i}
                            onClick={() => setSelectedDoubtVideo(v.name)}
                            className={`w-full text-left p-3 rounded-xl mb-2 border transition-all ${selectedDoubtVideo === v.name ? (isDarkMode ? 'bg-slate-800 border-amber-500/30' : 'bg-white border-amber-300 shadow-sm') : (isDarkMode ? 'bg-[#0F172A] border-transparent hover:bg-slate-800' : 'bg-transparent border-transparent hover:bg-white')}`}
                          >
                             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Lesson {i + 1}</p>
                             <p className={`text-sm font-semibold line-clamp-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{v.name}</p>
                             {doubtCount > 0 && <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded">Has Doubts</span>}
                          </button>
                        )
                     })}
                  </div>
               </div>

               <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                     <h4 className={`font-bold text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {selectedDoubtVideo ? "Lesson Doubts" : "Select a lesson"}
                     </h4>
                     <button onClick={() => setIsDoubtsModalOpen(false)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}><X className="w-5 h-5" /></button>
                  </div>
                  
                  {selectedDoubtVideo ? (
                     <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-4 md:space-y-6">
                           {(!userData[selectedDoubtVideo]?.doubts || userData[selectedDoubtVideo].doubts.length === 0) && (
                              <p className="text-center text-slate-500 text-sm font-medium py-10">No doubts recorded for this lesson yet.</p>
                           )}
                           {(userData[selectedDoubtVideo]?.doubts || []).map((doubt, idx) => {
                              const question = getDoubtQuestion(doubt);
                              const ans = getDoubtAnswer(doubt);
                              return (
                                <div key={idx} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                   <div className="flex justify-between items-start gap-4 mb-3">
                                      <div className="flex gap-2.5 items-start">
                                         <MessageCircleQuestion className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                         <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{question}</p>
                                      </div>
                                      <button onClick={() => onRemoveEntry(playlist.id, selectedDoubtVideo, 'doubts', idx)} className="text-slate-500 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                   </div>
                                   <div className={`ml-4 md:ml-6 p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><PenTool className="w-3 h-3" /> Answer</p>
                                      <textarea 
                                         value={ans}
                                         onChange={(e) => handleSaveAnswer(selectedDoubtVideo, idx, e.target.value)}
                                         placeholder="Type the answer here..."
                                         className={`w-full bg-transparent border-none resize-none focus:outline-none text-sm font-medium ${isDarkMode ? 'text-slate-300 placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}`}
                                         rows={Math.max(1, ans.split('\n').length)}
                                      />
                                   </div>
                                </div>
                              )
                           })}
                        </div>
                        <div className={`p-5 border-t ${isDarkMode ? 'bg-[#0F172A] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                           <div className="flex gap-3">
                             <input 
                               ref={doubtInputRef}
                               type="text" 
                               placeholder="Log a new doubt..."
                               onKeyDown={(e) => { if(e.key === 'Enter') { handleAddDoubt(selectedDoubtVideo, e.target.value); e.target.value=''; } }}
                               className={`flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                             />
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-500 font-medium">Select a lesson from the left.</p>
                     </div>
                  )}
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
