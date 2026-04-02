import React, { useState } from 'react';
import { X, Video, Save } from 'lucide-react';

export default function EditPlaylistModal({ playlist, onCancel, onSave }) {
  const [title, setTitle] = useState(playlist.title);
  const [desc, setDesc] = useState(playlist.description || '');
  const [cover, setCover] = useState(playlist.cover);

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCover(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave(playlist.id, { title, description: desc, cover });
  };

  return (
    <div className="fixed inset-0 bg-[#06142e] backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors">
            <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit Course Details</h2>
        
        <div className="space-y-5">

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Course Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
                />
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                <textarea 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                  rows={3} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none" 
                />
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Cover Image</label>
                <div className="flex items-center gap-4">
                    <div className="h-20 w-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 relative group">
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
                         onChange={handleCoverSelect} 
                         className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                       />
                       <p className="text-xs text-slate-400 mt-2">Recommended: 16:9 aspect ratio</p>
                    </div>
                </div>
            </div>
            
            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-2">
                <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button 
                    onClick={handleSubmit} 
                    disabled={!title.trim()} 
                    className="px-6 py-2.5 bg-[#06142e] hover:bg-blue-900 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4 " />
                    Save Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}