import React, { useState, useRef, useEffect } from 'react';
import { X, FolderUp, Globe, Link as LinkIcon, Image as ImageIcon, Type, AlignLeft } from 'lucide-react';

export default function AddPlaylistModal({ isOpen, onClose, onSubmit, isDarkMode }) {
  // Common State
  const [mode, setMode] = useState('local'); // 'local' or 'external'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  
  // Local Course State
  const [files, setFiles] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // External Course State
  const [externalUrl, setExternalUrl] = useState('');

  useEffect(() => {
    return () => {
      if (coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles);
      // Extract root folder name from the first file's relative path
      const firstPath = selectedFiles[0].webkitRelativePath || '';
      const rootFolder = firstPath.split('/')[0];
      setFolderName(rootFolder || 'Local Course');
      if (!title) setTitle(rootFolder || 'New Local Course');
    }
  };

  const handleCoverFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (coverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setCoverFile(file);
    setCover('');
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (mode === 'local' && (!files || files.length === 0)) {
      alert("Please select a local folder to track.");
      return;
    }

    if (mode === 'external' && !externalUrl.trim()) {
      alert("Please enter a valid external course URL.");
      return;
    }

    const meta = {
      title: title.trim() || (mode === 'local' ? folderName : 'External Course'),
      description: description.trim(),
      cover: coverFile ? coverPreviewUrl : cover.trim(),
      folderName: mode === 'local' ? folderName : 'External',
      isExternal: mode === 'external',
      externalUrl: mode === 'external' ? externalUrl.trim() : ''
    };

    onSubmit(meta, mode === 'local' ? files : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-[24px] border shadow-2xl flex flex-col overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0F172A] border-slate-700' : 'bg-white border-slate-200'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Add Course
          </h2>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col p-5 space-y-5">
          
          {/* Mode Toggle */}
          <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-black/30 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setMode('local')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'local' ? (isDarkMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 shadow-sm') : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
            >
              <FolderUp className="w-4 h-4" /> Local Folder
            </button>
            <button
              type="button"
              onClick={() => setMode('external')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'external' ? (isDarkMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 shadow-sm') : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
            >
              <Globe className="w-4 h-4" /> Web Link
            </button>
          </div>

          {/* Conditional Content based on Mode */}
          {mode === 'local' ? (
            <div 
              className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[16px] transition-all cursor-pointer group ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : isDarkMode ? 'border-slate-600 hover:border-slate-500 bg-black/20' : 'border-slate-300 hover:border-slate-400 bg-slate-50'} ${files ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                   handleFileSelect({ target: { files: e.dataTransfer.files } });
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                webkitdirectory="true" 
                directory="" 
                multiple 
                className="hidden" 
              />
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${files ? 'bg-emerald-500/20 text-emerald-500' : isDarkMode ? 'bg-slate-800 text-indigo-400 group-hover:bg-indigo-500/20' : 'bg-white shadow-sm text-indigo-600 group-hover:bg-indigo-50'}`}>
                <FolderUp className="w-6 h-6" />
              </div>
              <p className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {files ? 'Folder Selected' : 'Select Course Folder'}
              </p>
              <p className={`text-xs text-center px-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {files ? `Loaded ${files.length} files from /${folderName}` : 'Click to map a local directory to your workspace'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Platform URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LinkIcon className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <input 
                  type="url" 
                  required
                  placeholder="https://coursera.org/..." 
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isDarkMode ? 'bg-black/30 border-slate-700 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'}`}
                />
              </div>
            </div>
          )}

          {/* Common Metadata Fields */}
          <div className="space-y-3 pt-2">
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest pl-1 mb-1 block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Course Title</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Type className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <input 
                  type="text" 
                  required
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder={mode === 'local' ? "Derived from folder name..." : "e.g., Complete Web Development"}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isDarkMode ? 'bg-black/30 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest pl-1 mb-1 block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Short Description (Optional)</label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3.5 pointer-events-none">
                  <AlignLeft className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="What will you learn?"
                  rows={2}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none ${isDarkMode ? 'bg-black/30 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest pl-1 mb-1 block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Cover Image URL (Optional)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <ImageIcon className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                  <input 
                    type="url" 
                    value={cover}
                    onChange={(e) => {
                      if (coverPreviewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(coverPreviewUrl);
                      }
                      setCoverFile(null);
                      setCoverPreviewUrl('');
                      setCover(e.target.value);
                    }} 
                    placeholder="https://... or upload file"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isDarkMode ? 'bg-black/30 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                  />
                </div>

                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className={`px-4 py-3 rounded-xl font-bold text-xs border transition-colors shrink-0 ${isDarkMode ? 'bg-white/5 border-slate-700 hover:bg-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'}`}
                >
                  Browse File
                </button>
              </div>
              {coverFile && (
                <p className={`text-[11px] font-semibold pt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Selected file: {coverFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className={`w-full py-4 rounded-xl font-black text-sm shadow-lg transition-transform active:scale-[0.98] ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
            >
              Initialize Course Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
