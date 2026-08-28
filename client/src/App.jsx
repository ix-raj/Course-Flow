import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';

// --- PAGES & COMPONENTS ---
import LandingPage from './pages/LandingPage';
import CoursesView from './pages/CoursesView';
import PlaylistView from './pages/PlaylistView';
import RoutinePage from './pages/RoutinePage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import AddPlaylistModal from './components/modals/AddPlaylistModal';
import EditPlaylistModal from './components/modals/EditPlaylistModal';

// --- UTILS & CONTEXT ---
import { useLocalStorage } from './hooks/useLocalStorage';
import { AuthProvider, useAuth } from './context/AuthContext';

const getCoursesCacheKey = (userId) => `courseflow_courses_${userId}`;

const readCachedCourses = (userId) => {
  if (!userId) return [];

  try {
    const cached = localStorage.getItem(getCoursesCacheKey(userId));
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error("Failed to read cached courses", error);
    return [];
  }
};


function CourseRoute({ 
  playlists, sessionFiles, setSessionFiles, userData, 
  updateFileTime, toggleFileCompletion, addEntry, removeEntry, toggleTask, updateDoubtAnswer,
  updateCourseMeta, updateCourseLinks,
  isDarkMode, setIsDarkMode, navigate 
}) {
  const { id } = useParams();
  const playlist = (playlists || []).find(p => p.id === id);

  useEffect(() => {
    if (playlist?.isExternal && playlist.externalUrl) {
      window.location.replace(playlist.externalUrl);
    }
  }, [playlist]);
  
  if (!playlist) return <Navigate to="/library" />;
  if (playlist.isExternal && playlist.externalUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Opening external course...
      </div>
    );
  }

  return (
    <PlaylistView 
      playlist={playlist}
      files={sessionFiles[id]}
      onBack={() => navigate('/library')}
      onReconnect={(files) => setSessionFiles(prev => ({ ...prev, [id]: files }))}
      userData={(userData || {})[id] || {}}
      onUpdateProgress={updateFileTime}
      onToggleCompletion={toggleFileCompletion}
      onAddEntry={addEntry}
      onRemoveEntry={removeEntry}
      onToggleTask={toggleTask}
      onUpdateDoubtAnswer={updateDoubtAnswer}
      onUpdateCourseMeta={updateCourseMeta}
      onUpdateCourseLinks={updateCourseLinks}
      onHome={() => navigate('/')}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    />
  );
}


function AppContent() {
  const navigate = useNavigate();
  const { user, api } = useAuth(); // Access auth state and database API
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [sessionFiles, setSessionFiles] = useState({});
  
  // Theme stays in fast local storage for instant UI paint
  const [isDarkMode, setIsDarkMode] = useLocalStorage('courseflow_theme', true); 
  
  // Cloud Data States
  const [playlists, setPlaylists] = useState([]);
  const [userData, setUserData] = useState({});
  const [productivityData, setProductivityData] = useState({
    weeklyRoutine: {},
    completionLog: {},
    monthlyEvents: {}
  });
  const [toast, setToast] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const hydratedThemeForUserRef = useRef(null);

  const defaultFileData = {
    notes: [],
    doubts: [],
    tasks: [],
    completed: false
  };

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const updateProductivity = async (updates) => {
    try {
      const { data } = await api.put('/productivity', updates);
      setProductivityData(prev => ({
        weeklyRoutine: data.weeklyRoutine || prev.weeklyRoutine,
        completionLog: data.completionLog || prev.completionLog,
        monthlyEvents: data.monthlyEvents || prev.monthlyEvents
      }));
      return data;
    } catch (err) {
      console.error("Failed to sync productivity data", err);
      throw err;
    }
  };

  // Global Font Loader
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (!user?._id) {
      hydratedThemeForUserRef.current = null;
      return;
    }

    if (
      hydratedThemeForUserRef.current !== user._id &&
      typeof user.preferences?.isDarkMode === 'boolean'
    ) {
      setIsDarkMode(user.preferences.isDarkMode);
      hydratedThemeForUserRef.current = user._id;
    }
  }, [user, setIsDarkMode]);

  useEffect(() => {
    if (user?._id && hydratedThemeForUserRef.current === user._id) {
      api.put('/auth/preferences', { isDarkMode }).catch(err => 
        console.error("Failed to sync theme to cloud", err)
      );
    }
  }, [isDarkMode, user, api]); 



  useEffect(() => {
    if (!user) {
      setPlaylists([]);
      setUserData({});
      setProductivityData({
        weeklyRoutine: {},
        completionLog: {},
        monthlyEvents: {}
      });
      setCoursesLoading(false);
      return;
    }

    const cachedCourses = readCachedCourses(user._id);
    if (cachedCourses.length > 0) {
      setPlaylists(cachedCourses);
    }

    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const courseRes = await api.get('/courses');
        const cloudPlaylists = courseRes.data.map(c => ({ ...c, id: c._id }));
        setPlaylists(cloudPlaylists);
        localStorage.setItem(getCoursesCacheKey(user._id), JSON.stringify(cloudPlaylists));
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setCoursesLoading(false);
      }
    };

    const fetchWorkspaceData = async () => {
      try {
        const [workspaceRes, productivityRes] = await Promise.all([
          api.get('/workspace'),
          api.get('/productivity')
        ]);

        const cloudUserData = {};
        workspaceRes.data.forEach(ws => {
           cloudUserData[ws.course] = {
              _COURSE_GOALS_: { tasks: ws.courseGoals || [] },
              _COURSE_META_: {
                courseNotes: ws.courseMeta?.courseNotes || '',
                notionUrl: ws.courseMeta?.notionUrl || '',
                revisionList: ws.courseMeta?.revisionList || []
              }
           };
           if (ws.videoProgress) {
              Object.keys(ws.videoProgress).forEach(key => {
                 cloudUserData[ws.course][key] = ws.videoProgress[key];
              });
           }
        });
        setUserData(cloudUserData);
        setProductivityData({
          weeklyRoutine: productivityRes.data?.weeklyRoutine || {},
          completionLog: productivityRes.data?.completionLog || {},
          monthlyEvents: productivityRes.data?.monthlyEvents || {}
        });

      } catch (error) {
        console.error("Failed to sync workspace data", error);
      }
    };

    fetchCourses();
    fetchWorkspaceData();
  }, [user, api]);

  useEffect(() => {
    if (!user?._id) return;

    try {
      localStorage.setItem(getCoursesCacheKey(user._id), JSON.stringify(
        playlists.filter(playlist => !String(playlist.id || '').startsWith('temp-'))
      ));
    } catch (error) {
      console.error("Failed to cache courses", error);
    }
  }, [playlists, user]);


  const requireAuth = (actionCallback) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    actionCallback();
  };

  const handleOpenAddModal = () => requireAuth(() => setIsAddModalOpen(true));
  
  const handleEditClick = (playlist) => requireAuth(() => setEditingPlaylist(playlist));
  
  const handleCreatePlaylist = async (meta, fileList) => {
    const isExternal = meta.isExternal || false;
    const files = fileList ? Array.from(fileList) : [];
    
    const isVideo = (file) => (file.type || '').startsWith('video/') || /\.(mp4|webm|ogg|mkv|avi|mov|wmv|m4v)$/i.test(file.name);
    const isNote = (file) => file.type === 'application/pdf' || (file.type || '').startsWith('text/') || /\.(pdf|txt|md|doc|docx)$/i.test(file.name);
    
    const tempId = `temp-${Date.now()}`;
    const optimisticPlaylist = {
      id: tempId,
      _id: tempId,
      title: meta.title,
      description: meta.description,
      cover: meta.cover,
      folderName: meta.folderName || 'External',
      videoCount: isExternal ? 0 : files.filter(isVideo).length,
      noteCount: isExternal ? 0 : files.filter(isNote).length,
      isExternal: isExternal,
      externalUrl: meta.externalUrl || '',
      createdAt: new Date().toISOString(),
      isPending: true
    };
    
    setPlaylists(prev => [optimisticPlaylist, ...prev]);
    if (!isExternal) setSessionFiles(prev => ({ ...prev, [tempId]: fileList }));
    
    setIsAddModalOpen(false);
    navigate('/library');

    try {
      const payload = {
        title: meta.title, 
        description: meta.description, 
        cover: meta.cover, 
        folderName: meta.folderName || 'External', 
        videoCount: optimisticPlaylist.videoCount, 
        noteCount: optimisticPlaylist.noteCount,
        isExternal: optimisticPlaylist.isExternal,
        externalUrl: optimisticPlaylist.externalUrl
      };
      
      const { data } = await api.post('/courses', payload);
      const newPlaylist = { ...data, id: data._id };
      
      setPlaylists(prev => prev.map(playlist => (playlist.id === tempId ? newPlaylist : playlist)));
      
      if (!isExternal) {
        setSessionFiles(prev => {
          const updatedFiles = { ...prev, [newPlaylist.id]: prev[tempId] || fileList };
          delete updatedFiles[tempId];
          return updatedFiles;
        });
      }
    } catch (err) {
      console.error(err);
      setPlaylists(prev => prev.filter(playlist => playlist.id !== tempId));
      alert("Failed to create course in cloud database.");
    }
  };

  const handleUpdatePlaylist = async (id, updates) => {
    let previousPlaylist = null;

    setPlaylists(prev => prev.map(p => {
      if (p.id !== id) return p;
      previousPlaylist = p;
      return { ...p, ...updates };
    }));
    setEditingPlaylist(null);

    try {
      await api.put(`/courses/${id}`, updates);
    } catch (err) {
      if (previousPlaylist) {
        setPlaylists(prev => prev.map(p => p.id === id ? previousPlaylist : p));
      }
      console.error("Failed to update course in cloud", err);
      alert("Failed to save changes. The image might be too large.");
    }
  };



  const updateFileTime = async (playlistId, fileName, time, duration) => { 
    const isCompleted = (duration > 0 && time / duration > 0.9);
    
    // Update UI instantly
    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName] || { notes: [], doubts: [], tasks: [], completed: false }; 
      const finalCompleted = fileData.completed || isCompleted; 
      return { ...prev, [playlistId]: { ...plData, [fileName]: { ...fileData, time, completed: finalCompleted } } }; 
    }); 

    // Sync to Cloud
    try { 
      await api.put(`/workspace/${playlistId}/video`, { fileName, time, completed: isCompleted }); 
    } catch(e) { console.error("Timeline sync failed", e); }
  };
  

  
  

  // 1. Unified Entry Sync (Covers Notes, Doubts, and Video-Specific Tasks)
  const addEntry = async (playlistId, fileName, type, content) => { 
    let updatedEntries = [];

    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName] || defaultFileData; 
      const newEntry = type === 'tasks'
        ? { id: Date.now().toString(), text: content, done: false }
        : type === 'doubts'
          ? { id: Date.now().toString(), question: content, answer: '', resolved: false }
          : content; 
      
      updatedEntries = [...(fileData[type] || []), newEntry];

      if (fileName === '_COURSE_GOALS_' && type === 'tasks') {
        return {
          ...prev,
          [playlistId]: {
            ...plData,
            _COURSE_GOALS_: { tasks: updatedEntries }
          }
        };
      }

      return { 
        ...prev,
        [playlistId]: { 
          ...plData,
          [fileName]: { ...fileData, [type]: updatedEntries }
        }
      }; 
    });

    try {
      if (fileName === '_COURSE_GOALS_' && type === 'tasks') {
        await api.put(`/workspace/${playlistId}/goals`, { courseGoals: updatedEntries });
      } else {
        await api.put(`/workspace/${playlistId}/video`, { 
          fileName, 
          [type]: updatedEntries 
        });
      }
    } catch (err) {
      console.error(`Failed to sync ${type}`, err);
    }
  };

  // 2. Remove Entry Sync
  const removeEntry = async (playlistId, fileName, type, index) => { 
    let newArray = [];

    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName]; 
      if (!fileData) return prev; 
      
      newArray = [...(fileData[type] || [])]; 
      newArray.splice(index, 1); 

      if (fileName === '_COURSE_GOALS_' && type === 'tasks') {
        return {
          ...prev,
          [playlistId]: {
            ...plData,
            _COURSE_GOALS_: { tasks: newArray }
          }
        };
      }

      return { ...prev, [playlistId]: { ...plData, [fileName]: { ...fileData, [type]: newArray } } }; 
    }); 

    try {
      if (fileName === '_COURSE_GOALS_' && type === 'tasks') {
        await api.put(`/workspace/${playlistId}/goals`, { courseGoals: newArray });
      } else {
        await api.put(`/workspace/${playlistId}/video`, { 
          fileName, 
          [type]: newArray 
        });
      }
    } catch (err) {
      console.error(`Failed to sync deletion of ${type}`, err);
    }
  };

  // 3. Toggle Video Task Sync
  const toggleTask = async (playlistId, fileName, index) => { 
    let newTasks = [];

    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName]; 
      if (!fileData) return prev; 
      
      newTasks = (fileData.tasks || []).map((t, i) => i === index ? { ...t, done: !t.done } : t); 

      if (fileName === '_COURSE_GOALS_') {
        return {
          ...prev,
          [playlistId]: {
            ...plData,
            _COURSE_GOALS_: { tasks: newTasks }
          }
        };
      }

      return { ...prev, [playlistId]: { ...plData, [fileName]: { ...fileData, tasks: newTasks } } }; 
    }); 

    try {
      if (fileName === '_COURSE_GOALS_') {
        await api.put(`/workspace/${playlistId}/goals`, { courseGoals: newTasks });
      } else {
        await api.put(`/workspace/${playlistId}/video`, { 
          fileName, 
          tasks: newTasks 
        });
      }
    } catch (err) {
      console.error("Failed to sync task toggle", err);
    }
  };

  // 4. Toggle Completion Sync
  const toggleFileCompletion = async (playlistId, fileName) => { 
    let newCompletedState = false;

    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName] || defaultFileData; 
      newCompletedState = !fileData.completed;

      return { ...prev, [playlistId]: { ...plData, [fileName]: { ...fileData, completed: newCompletedState } } }; 
    }); 

    try {
      await api.put(`/workspace/${playlistId}/video`, { 
        fileName, 
        completed: newCompletedState 
      });
    } catch (err) {
      console.error("Failed to sync completion", err);
    }
  };

  const updateDoubtAnswer = async (playlistId, fileName, index, answer) => {
    let updatedDoubts = [];

    setUserData(prev => {
      const plData = prev[playlistId] || {};
      const fileData = plData[fileName] || defaultFileData;

      updatedDoubts = (fileData.doubts || []).map((doubt, doubtIndex) => {
        const normalizedDoubt = typeof doubt === 'string'
          ? { id: `${fileName}-${doubtIndex}`, question: doubt, answer: '', resolved: false }
          : doubt;

        return doubtIndex === index
          ? { ...normalizedDoubt, answer }
          : normalizedDoubt;
      });

      return {
        ...prev,
        [playlistId]: {
          ...plData,
          [fileName]: {
            ...fileData,
            doubts: updatedDoubts
          }
        }
      };
    });

    try {
      await api.put(`/workspace/${playlistId}/video`, {
        fileName,
        doubts: updatedDoubts
      });
    } catch (err) {
      console.error("Failed to sync doubt answer", err);
    }
  };

  const updateCourseMeta = async (playlistId, updates) => {
    setUserData(prev => {
      const plData = prev[playlistId] || {};
      const currentMeta = plData._COURSE_META_ || {
        courseNotes: '',
        notionUrl: '',
        revisionList: []
      };

      return {
        ...prev,
        [playlistId]: {
          ...plData,
          _COURSE_META_: {
            ...currentMeta,
            ...updates
          }
        }
      };
    });

    try {
      await api.put(`/workspace/${playlistId}/meta`, updates);
    } catch (err) {
      console.error("Failed to sync course metadata", err);
    }
  };

  const updateCourseLinks = async (playlistId, customLinks) => {
    setPlaylists(prev => prev.map(playlist => (
      playlist.id === playlistId ? { ...playlist, customLinks } : playlist
    )));

    try {
      await api.put(`/courses/${playlistId}`, { customLinks });
    } catch (err) {
      console.error("Failed to sync course links", err);
    }
  };

  // 5. Delete Course 
  const handleDeletePlaylist = async (playlistId) => {
  requireAuth(async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this course? All cloud progress will be lost."
      )
    ) {
      return;
    }

    // Save the current state for rollback
    const previousPlaylists = playlists;
    const previousUserData = userData;
    const previousSessionFiles = sessionFiles;

    // Optimistically update the UI immediately
    setPlaylists((prev) =>
      prev.filter((p) => p.id !== playlistId)
    );

    setUserData((prev) => {
      const newData = { ...prev };
      delete newData[playlistId];
      return newData;
    });

    setSessionFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[playlistId];
      return newFiles;
    });

    // Navigate immediately — don't wait for the API
    navigate("/library");

    try {
      await api.delete(`/courses/${playlistId}`);
    } catch (err) {
      console.error("Failed to delete course", err);

      // Roll back the optimistic update
      setPlaylists(previousPlaylists);
      setUserData(previousUserData);
      setSessionFiles(previousSessionFiles);

      // Show error toast
      showToast(
        "Couldn't delete the course. Your changes have been restored.",
        "error"
      );
    }
  });
};

  return (
    <div className={`min-h-screen font-['Roboto',sans-serif] selection:bg-indigo-500/30 ${isDarkMode ? 'bg-[#05050A] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      <Routes>
        <Route path="/auth" element={<AuthPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        
        <Route path="/" element={<LandingPage playlists={playlists || []} onViewCourses={() => navigate('/library')} onOpen={(id) => navigate(`/course/${id}`)} userData={userData || {}} productivityData={productivityData} onHome={() => navigate('/')} onAdd={handleOpenAddModal} onDelete={handleDeletePlaylist} onEdit={handleEditClick} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}/>} />
        
        <Route path="/library" element={<CoursesView playlists={playlists || []} isLoading={coursesLoading} onOpen={(id) => navigate(`/course/${id}`)} onAdd={handleOpenAddModal} onHome={() => navigate('/')} onDelete={handleDeletePlaylist} onEdit={handleEditClick} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} userData={userData} onViewCourses={() => navigate('/library')}/>} />

        <Route path="/course/:id" element={<CourseRoute playlists={playlists} sessionFiles={sessionFiles} setSessionFiles={setSessionFiles} userData={userData} updateFileTime={updateFileTime} toggleFileCompletion={toggleFileCompletion} addEntry={addEntry} removeEntry={removeEntry} toggleTask={toggleTask} updateDoubtAnswer={updateDoubtAnswer} updateCourseMeta={updateCourseMeta} updateCourseLinks={updateCourseLinks} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} navigate={navigate}/>} />
        
       <Route 
          path="/routine" 
          element={
            <RoutinePage 
              playlists={playlists || []} 
              productivityData={productivityData}
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode}
              onSync={updateProductivity} 
            />
          } 
        />
        <Route 
          path="/routine/settings" 
          element={
            <SettingsPage 
              playlists={playlists || []} 
              productivityData={productivityData}
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode}
              onSync={updateProductivity} 
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* MODALS */}
      {isAddModalOpen && (
        <AddPlaylistModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)} 
          onSubmit={handleCreatePlaylist} 
          isDarkMode={isDarkMode}
        />
      )}

      {editingPlaylist && (
        <EditPlaylistModal 
          playlist={editingPlaylist}
          onCancel={() => setEditingPlaylist(null)}
          onSave={handleUpdatePlaylist}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl
              text-sm font-medium
              animate-in fade-in slide-in-from-bottom-2 duration-200
              ${
                isDarkMode
                  ? "bg-slate-900 border-red-500/30 text-slate-100"
                  : "bg-white border-red-200 text-slate-800"
              }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
