import React, { useState } from 'react';
import { Upload, X, Folder, Video } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { openDirectory, scanDirectory } from '../../utils/fileSystem';

export default function AddPlaylistModal({ onCancel, onSubmit, onHome }) {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cover, setCover] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFolderSelect = async () => {
    try {
      const handle = await openDirectory();
      if (!handle) return; 

      setIsScanning(true);
      
      const fileList = await scanDirectory(handle);
      
      if (fileList.length > 0) {
        setFiles(fileList);
        setFolderName(handle.name);
        setTitle(handle.name);
        setStep(2);
      } else {
        alert("No files found in this folder.");
      }
    } catch (error) {
      console.error("Failed to load folder:", error);
      alert("Error loading folder. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCover(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!files || !title) return;

    try {
      setIsSubmitting(true);
      await onSubmit({ title, description: desc, cover, folderName }, files);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#06142e] backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="absolute top-0 left-0 w-full p-6 z-50 pointer-events-none">
           <div className="max-w-7xl mx-auto px-6 lg:px-8 pointer-events-auto inline-block">
             <BrandLogo onClick={onHome} />
           </div>
      </div>

      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl relative mt-12">
        <button onClick={onCancel} disabled={isSubmitting} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 disabled:opacity-50">
            <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {step === 1 ? 'Import Course' : 'Course Details'}
        </h2>
        
        {step === 1 && (
          <div className="flex flex-col gap-4">

              <button 
              onClick={handleFolderSelect}
              disabled={isScanning || isSubmitting}
              className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group cursor-pointer w-full flex flex-col items-center justify-center"
            >
              {isScanning ? (
                <div className="flex flex-col items-center animate-pulse">
                   <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                     <Upload className="h-8 w-8 text-blue-600 animate-bounce" />
                   </div>
                   <p className="text-lg font-bold text-slate-700">Scanning Folder...</p>
                   <p className="mt-2 text-sm text-slate-500">This might take a moment.</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Folder className="h-10 w-10 text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-700">Select Folder</p>
                  <p className="mt-2 text-sm text-slate-500 font-medium">Click to open system picker</p>
                </>
              )}
            </button>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Course Title</label>
                <input type="text" value={title} disabled={isSubmitting} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-70" />
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                <textarea value={desc} disabled={isSubmitting} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-70" placeholder="What will you learn?" />
            </div>
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Cover Image</label>
                <div className="flex items-center gap-4">
                    <div className="h-16 w-24 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                        {cover ? <img src={cover} alt="Preview" className="h-full w-full object-cover" /> : <Video className="text-slate-400" />}
                    </div>
                    <input type="file" accept="image/*" disabled={isSubmitting} onChange={handleCoverSelect} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-70" />
                </div>
            </div>
            
            <div className="pt-6 flex justify-end gap-3">
                <button onClick={() => setStep(1)} disabled={isSubmitting} className="px-5 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors disabled:opacity-50">Back</button>
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !title} 
                    className="min-w-[168px] px-6 py-2.5 bg-[#06142e] hover:bg-blue-900 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Creating...
                      </>
                    ) : 'Create Playlist'}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
