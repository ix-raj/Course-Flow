import React, { useState, useRef } from 'react';
import { X, FolderUp, Globe, Link as LinkIcon, Video } from 'lucide-react';

export default function AddPlaylistModal({ isOpen, onClose, onSubmit }) {
  const [mode, setMode] = useState('local');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('');
  const [files, setFiles] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles);
      const firstPath = selectedFiles[0].webkitRelativePath || '';
      const rootFolder = firstPath.split('/')[0];
      setFolderName(rootFolder || 'Local Course');
      if (!title) setTitle(rootFolder || 'New Local Course');
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setCover(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'local' && (!files || files.length === 0)) {
      alert('Please select a local folder to track.');
      return;
    }

    if (mode === 'external' && !externalUrl.trim()) {
      alert('Please enter a valid external course URL.');
      return;
    }

    const meta = {
      title: title.trim() || (mode === 'local' ? folderName : 'External Course'),
      description: description.trim(),
      cover: cover.trim(),
      folderName: mode === 'local' ? folderName : 'External',
      isExternal: mode === 'external',
      externalUrl: mode === 'external' ? externalUrl.trim() : ''
    };

    onSubmit(meta, mode === 'local' ? files : null);
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-slate-200/80">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors">
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Course</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex p-1 rounded-xl border bg-slate-100 border-slate-200">
            <button
              type="button"
              onClick={() => setMode('local')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'local' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FolderUp className="w-4 h-4" /> Local Folder
            </button>
            <button
              type="button"
              onClick={() => setMode('external')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'external' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" /> Web Link
            </button>
          </div>

          {mode === 'local' ? (
            <div
              className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[16px] transition-all cursor-pointer group ${
                isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
              } ${files ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
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
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                files ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white shadow-sm text-indigo-600 group-hover:bg-indigo-50'
              }`}>
                <FolderUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold mb-1 text-slate-700">
                {files ? 'Folder Selected' : 'Select Course Folder'}
              </p>
              <p className="text-xs text-center px-4 text-slate-400">
                {files ? `Loaded ${files.length} files from /${folderName}` : 'Click to map a local directory to your workspace'}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Platform URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://coursera.org/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition-all bg-[#F6F8FC] border-slate-200/80 text-indigo-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Course Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={mode === 'local' ? 'Derived from folder name...' : 'e.g., Complete Web Development'}
                className="w-full bg-[#F6F8FC] border border-slate-200/80 rounded-lg px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will you learn?"
                rows={3}
                className="w-full bg-[#F6F8FC] border border-slate-200/80 rounded-lg px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition-all outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Cover Image</label>
              <div className="flex items-center gap-4">
                <div
                  className="h-20 w-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 relative group shadow-sm cursor-pointer"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {cover ? (
                    <img src={cover} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Video className="text-slate-400 h-8 w-8" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Change</span>
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={coverInputRef}
                    onChange={handleCoverSelect}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  <p className="text-xs text-slate-400 mt-2">Recommended: 16:9 aspect ratio</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-w-[160px] px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              Initialize Course Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
