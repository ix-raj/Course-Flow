import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';

// --- PAGES & COMPONENTS ---
import LandingPage from './pages/LandingPage';
import CoursesView from './pages/CoursesView';
import PlaylistView from './pages/PlaylistView';
import GoalsPage from './pages/GoalsPage';
import AuthPage from './pages/AuthPage';
import AddPlaylistModal from './components/modals/AddPlaylistModal';
import EditPlaylistModal from './components/modals/EditPlaylistModal';

// --- UTILS & CONTEXT ---
import { useLocalStorage } from './hooks/useLocalStorage';
import { AuthProvider, useAuth } from './context/AuthContext';


function CourseRoute({ 
  playlists, sessionFiles, setSessionFiles, userData, 
  updateFileTime, toggleFileCompletion, addEntry, removeEntry, toggleTask, 
  isDarkMode, setIsDarkMode, navigate 
}) {
  const { id } = useParams();
  const playlist = (playlists || []).find(p => p.id === id);
  
  if (!playlist) return <Navigate to="/library" />;

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
      onHome={() => navigate('/')}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    />
  );
}


function AppContent() {
  const navigate = useNavigate();
  const { user, api, loading } = useAuth(); // Access auth state and database API
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [sessionFiles, setSessionFiles] = useState({});
  
  // Theme stays in fast local storage for instant UI paint
  const [isDarkMode, setIsDarkMode] = useLocalStorage('courseflow_theme', true); 
  
  // Cloud Data States
  const [playlists, setPlaylists] = useState([]);
  const [userData, setUserData] = useState({});

  const updateProductivity = async (updates) => {
    try {
      // This calls the PUT /api/productivity route built in Phase 3
      const { data } = await api.put('/productivity', updates);
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

  // Add this effect to sync theme changes to the user's cloud profile
  useEffect(() => {
    if (user) {
      api.put('/auth/preferences', { isDarkMode }).catch(err => 
        console.error("Failed to sync theme to cloud", err)
      );
    }
  }, [isDarkMode, user, api]); 



  useEffect(() => {
    if (!user) {
      setPlaylists([]);
      setUserData({});
      return;
    }

    const fetchWorkspaceData = async () => {
      try {
        const [courseRes, workspaceRes] = await Promise.all([
          api.get('/courses'),
          api.get('/workspace')
        ]);

        const cloudPlaylists = courseRes.data.map(c => ({ ...c, id: c._id }));
        setPlaylists(cloudPlaylists);

        const cloudUserData = {};
        workspaceRes.data.forEach(ws => {
           cloudUserData[ws.course] = {
              _COURSE_GOALS_: { tasks: ws.courseGoals || [] }
           };
           if (ws.videoProgress) {
              Object.keys(ws.videoProgress).forEach(key => {
                 cloudUserData[ws.course][key] = ws.videoProgress[key];
              });
           }
        });
        setUserData(cloudUserData);

      } catch (error) {
        console.error("Failed to sync with cloud database", error);
      }
    };

    fetchWorkspaceData();
  }, [user, api]);


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
    if (!fileList) return;

    const files = Array.from(fileList);
    const isVideo = (file) => (file.type || '').startsWith('video/') || /\.(mp4|webm|ogg|mkv|avi|mov|wmv|m4v)$/i.test(file.name);
    const isNote = (file) => file.type === 'application/pdf' || (file.type || '').startsWith('text/') || /\.(pdf|txt|md|doc|docx)$/i.test(file.name);
    
    try {
      const payload = {
        title: meta.title, description: meta.description, cover: meta.cover, 
        folderName: meta.folderName, videoCount: files.filter(isVideo).length, noteCount: files.filter(isNote).length,
      };
      
      const { data } = await api.post('/courses', payload);
      const newPlaylist = { ...data, id: data._id };

      setPlaylists(prev => [newPlaylist, ...prev]);
      setSessionFiles(prev => ({ ...prev, [newPlaylist.id]: fileList }));
      setIsAddModalOpen(false);
      navigate('/library'); 

    } catch (err) {
      console.error(err);
      alert("Failed to create course in cloud database.");
    }
  };

  const handleUpdatePlaylist = async (id, updates) => {
    try {
      await api.put(`/courses/${id}`, updates);
      
      setPlaylists(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      setEditingPlaylist(null);
    } catch (err) {
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
    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName] || { notes: [], doubts: [], tasks: [], completed: false }; 
      const newEntry = type === 'tasks' ? { id: Date.now().toString(), text: content, done: false } : content; 
      
      const updatedEntries = [...(fileData[type] || []), newEntry];
      const updatedPlaylistData = { ...plData, [fileName]: { ...fileData, [type]: updatedEntries } };
      
      // Cloud Sync: Update the specific video's map entry
      api.put(`/workspace/${playlistId}/video`, { 
        fileName, 
        [type]: updatedEntries 
      }).catch(err => console.error(`Failed to sync ${type}`, err));

      return { ...prev, [playlistId]: updatedPlaylistData }; 
    }); 
  };

  // 2. Remove Entry Sync
  const removeEntry = async (playlistId, fileName, type, index) => { 
    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName]; 
      if (!fileData) return prev; 
      
      const newArray = [...fileData[type]]; 
      newArray.splice(index, 1); 
      
      // Cloud Sync
      api.put(`/workspace/${playlistId}/video`, { 
        fileName, 
        [type]: newArray 
      }).catch(err => console.error(`Failed to sync deletion of ${type}`, err));

      return { ...prev, [playlistId]: { ...plData, [fileName]: { ...fileData, [type]: newArray } } }; 
    }); 
  };

  // 3. Toggle Video Task Sync
  const toggleTask = async (playlistId, fileName, index) => { 
    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName]; 
      if (!fileData) return prev; 
      
      const newTasks = fileData.tasks.map((t, i) => i === index ? { ...t, done: !t.done } : t); 
      
      // Cloud Sync
      api.put(`/workspace/${playlistId}/video`, { 
        fileName, 
        tasks: newTasks 
      }).catch(err => console.error("Failed to sync task toggle", err));

      return { ...prev, [playlistId]: { ...plData, [fileName]: { ...fileData, tasks: newTasks } } }; 
    }); 
  };

  // 4. Toggle Completion Sync
  const toggleFileCompletion = async (playlistId, fileName) => { 
    setUserData(prev => { 
      const plData = prev[playlistId] || {}; 
      const fileData = plData[fileName] || { notes: [], doubts: [], tasks: [], completed: false }; 
      const newCompletedState = !fileData.completed;

      // Cloud Sync
      api.put(`/workspace/${playlistId}/video`, { 
        fileName, 
        completed: newCompletedState 
      }).catch(err => console.error("Failed to sync completion", err));

      return { ...prev, [playlistId]: { ...plData, [fileName]: { ...fileData, completed: newCompletedState } } }; 
    }); 
  };

  // 5. Delete Course (Backend Cleanup)
  const handleDeletePlaylist = async (playlistId) => {
    requireAuth(async () => {
      if (window.confirm("Are you sure you want to delete this course? All cloud progress will be lost.")) {
        try {
          // This now triggers the cascading delete we added in Phase 2
          await api.delete(`/courses/${playlistId}`); 
          
          setPlaylists(prev => prev.filter(p => p.id !== playlistId));
          setUserData(prev => { const newData = { ...prev }; delete newData[playlistId]; return newData; });
          setSessionFiles(prev => { const newFiles = { ...prev }; delete newFiles[playlistId]; return newFiles; });
          navigate('/library'); 
        } catch (err) {
          console.error("Failed to delete course", err);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-bold tracking-widest uppercase ${isDarkMode ? 'bg-[#05050A] text-indigo-500' : 'bg-slate-50 text-indigo-600'}`}>
        Initializing...
      </div>
    );
  }


  return (
    <div className={`min-h-screen font-['Roboto',sans-serif] selection:bg-indigo-500/30 ${isDarkMode ? 'bg-[#05050A] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      <Routes>
        <Route path="/auth" element={<AuthPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
        
        <Route path="/" element={<LandingPage playlists={playlists || []} onViewCourses={() => navigate('/library')} onOpen={(id) => navigate(`/course/${id}`)} userData={userData || {}} onHome={() => navigate('/')} onAdd={handleOpenAddModal} onDelete={handleDeletePlaylist} onEdit={handleEditClick} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}/>} />
        
        <Route path="/library" element={<CoursesView playlists={playlists || []} onOpen={(id) => navigate(`/course/${id}`)} onAdd={handleOpenAddModal} onHome={() => navigate('/')} onDelete={handleDeletePlaylist} onEdit={handleEditClick} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onViewCourses={() => navigate('/library')}/>} />

        <Route path="/course/:id" element={<CourseRoute playlists={playlists} sessionFiles={sessionFiles} setSessionFiles={setSessionFiles} userData={userData} updateFileTime={updateFileTime} toggleFileCompletion={toggleFileCompletion} addEntry={addEntry} removeEntry={removeEntry} toggleTask={toggleTask} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} navigate={navigate}/>} />
        
        <Route 
          path="/goals" 
          element={
            <GoalsPage 
              playlists={playlists || []} 
              userData={userData || {}} 
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode}
              onSync={updateProductivity} // Pass the new sync function
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* MODALS */}
      {isAddModalOpen && (
        <AddPlaylistModal 
          onCancel={() => setIsAddModalOpen(false)} 
          onSubmit={handleCreatePlaylist} 
          onHome={() => navigate('/')}
        />
      )}

      {editingPlaylist && (
        <EditPlaylistModal 
          playlist={editingPlaylist}
          onCancel={() => setEditingPlaylist(null)}
          onSave={handleUpdatePlaylist}
        />
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