
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Gauge, 
  Maximize, Minimize, PictureInPicture2, 
  Rewind, FastForward, MonitorPlay, AlertTriangle, Check,
  SkipBack, SkipForward
} from 'lucide-react';
import { formatDuration } from '../../utils/helpers';

export default function LocalVideoPlayer({ 
  file, subtitleFile, initialTime = 0, onProgress, onEnded,
  onNext, onPrevious, hasNext, hasPrevious 
}) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [subUrl, setSubUrl] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [hasSetInitialTime, setHasSetInitialTime] = useState(false); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [seekOverlay, setSeekOverlay] = useState(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const clickTimer = useRef(null);

  useEffect(() => {
    let vUrl = null;
    let sUrl = null;

    if (file) {
      try {
        if (file instanceof Blob || file instanceof File) {
          vUrl = URL.createObjectURL(file);
          setVideoUrl(vUrl);
          setVideoError(false);
        } else if (file.url) {
          setVideoUrl(file.url);
          setVideoError(false);
        } else {
          throw new Error("Not a valid File or Blob");
        }

        setIsPlaying(true); 
        setProgress(0);
        setCurrentTime(0);
        setHasSetInitialTime(false);

        if (subtitleFile && (subtitleFile instanceof Blob || subtitleFile instanceof File)) {
          sUrl = URL.createObjectURL(subtitleFile);
          setSubUrl(sUrl);
        } else {
          setSubUrl(null);
        }
      } catch (error) {
        console.error("Video Loading Error:", error);
        setVideoError(true);
      }
    }

    return () => {
      if (vUrl && vUrl.startsWith('blob:')) URL.revokeObjectURL(vUrl);
      if (sUrl && sUrl.startsWith('blob:')) URL.revokeObjectURL(sUrl);
    };
  }, [file, subtitleFile]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && initialTime > 0 && !hasSetInitialTime) {
      videoRef.current.currentTime = initialTime;
      setCurrentTime(initialTime);
      setHasSetInitialTime(true);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) setIsFakeFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); } 
      else { videoRef.current.pause(); setIsPlaying(false); }
    }
  };

  const skipTime = (seconds) => { if (videoRef.current) videoRef.current.currentTime += seconds; };
  const handleSeek = (e) => {
    const newTime = (e.target.value / 100) * duration;
    if (videoRef.current) { videoRef.current.currentTime = newTime; setProgress(e.target.value); }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(dur);
      setProgress((current / dur) * 100);
      onProgress(current, dur);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol); setIsMuted(vol === 0);
    if (videoRef.current) { videoRef.current.volume = vol; videoRef.current.muted = vol === 0; }
  };

  const toggleMute = useCallback(() => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (videoRef.current) {
        videoRef.current.muted = newMuteState;
        if (!newMuteState && (videoRef.current.volume === 0 || volume === 0)) {
            setVolume(1.0);
            videoRef.current.volume = 1.0;
        }
    }
  }, [isMuted, volume]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!document.fullscreenElement && !isFakeFullscreen) {
        container.requestFullscreen().catch(() => setIsFakeFullscreen(true));
    } else {
        if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
        setIsFakeFullscreen(false);
    }
  }, [isFakeFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      switch(e.key.toLowerCase()) {
        case ' ': e.preventDefault(); handlePlayPause(); break;
        case 'arrowright': skipTime(5); break;
        case 'arrowleft': skipTime(-5); break;
        case 'm': toggleMute(); break;
        case 'f': toggleFullscreen(); break;
        case 'p': togglePiP(); break;
        case 'escape': if (isFakeFullscreen) setIsFakeFullscreen(false); if (document.fullscreenElement) document.exitFullscreen().catch(()=>{}); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFakeFullscreen, toggleFullscreen, toggleMute]);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (videoRef.current) await videoRef.current.requestPictureInPicture();
    } catch (err) { console.error(err); }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false); 
  };

  const handleSingleClick = () => {
    if (clickTimer.current) return;
    clickTimer.current = setTimeout(() => { handlePlayPause(); clickTimer.current = null; }, 250); 
  };

  const handleDoubleClick = (e) => {
    if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) { skipTime(-10); triggerSeekAnimation('backward'); } 
    else if (x > rect.width * 0.65) { skipTime(10); triggerSeekAnimation('forward'); } 
    else { toggleFullscreen(); }
  };

  const triggerSeekAnimation = (type) => {
    setSeekOverlay({ type, id: Date.now() }); 
    setTimeout(() => setSeekOverlay(null), 500); 
  };

  if (!file) return (
    <div className="w-full aspect-video bg-slate-900 flex flex-col items-center justify-center p-6 text-center border border-slate-800 rounded-3xl shadow-xl">
       <MonitorPlay className="h-12 w-12 mb-3 text-slate-700" />
       <p className="text-sm font-medium text-slate-500">Select a level from the timeline to start playing</p>
    </div>
  );

  if (videoError) return (
    <div className="w-full aspect-video bg-slate-900 flex flex-col items-center justify-center p-8 text-center border border-slate-800 rounded-3xl shadow-xl">
      <div className="bg-red-500/20 p-4 rounded-full mb-4"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
      <h3 className="text-xl font-bold text-white mb-2">Playback Error</h3>
      <p className="text-slate-400 max-w-md mb-6">Cannot play this file. It may be an unsupported format (like MKV/HEVC) or corrupted.</p>
    </div>
  );

  const containerStyle = isFakeFullscreen ? { position: 'fixed', inset: 0, zIndex: 100 } : { position: 'relative' };

  return (
    <div 
      ref={containerRef}
      className={`w-full bg-black shrink-0 relative flex flex-col justify-center items-center shadow-2xl transition-all duration-500 ease-out group ${
        (isFullscreen || isFakeFullscreen) ? 'fixed inset-0 z-50 h-full w-full' : 'relative z-10 overflow-hidden border border-slate-800'
      }`}
      style={containerStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isFakeFullscreen && (<button onClick={() => setIsFakeFullscreen(false)} className="absolute top-4 right-4 z- bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-colors"><Minimize className="h-6 w-6" /></button>)}
      {showSpeedMenu && (<div className="absolute inset-0 z-40" onClick={() => setShowSpeedMenu(false)}></div>)}

      <div className={`relative w-full flex flex-col ${(isFullscreen || isFakeFullscreen) ? 'h-full' : ''}`} style={{ maxHeight: (isFullscreen || isFakeFullscreen) ? '100vh' : '70vh' }}>
         <div className="relative w-full aspect-video bg-black flex-1 overflow-hidden group/video">
             <video 
               ref={videoRef} 
               key={videoUrl} 
               src={videoUrl} 
               autoPlay
               className="w-full h-full object-contain bg-black cursor-pointer" 
               onClick={handleSingleClick}
               onDoubleClick={handleDoubleClick}
               onTimeUpdate={handleTimeUpdate} 
               onLoadedMetadata={handleLoadedMetadata}
               onEnded={() => { setIsPlaying(false); onEnded(); }} 
               onError={() => setVideoError(true)}
             >
               {subUrl && <track kind="subtitles" src={subUrl} srcLang="en" label="English" default />}
             </video>

             {seekOverlay && (
               <div key={seekOverlay.id} className={`absolute inset-y-0 ${seekOverlay.type === 'backward' ? 'left-[15%]' : 'right-[15%]'} w-40 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in duration-200`}>
                  <div className="absolute w-24 h-24 bg-white/10 rounded-full animate-ping opacity-50"></div>
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/60 backdrop-blur-md shadow-2xl relative z-10">
                     {seekOverlay.type === 'backward' ? <><Rewind className="w-8 h-8 text-white" /><span className="text-xs font-black text-white mt-2">-10s</span></> : <><FastForward className="w-8 h-8 text-white" /><span className="text-xs font-black text-white mt-2">+10s</span></>}
                  </div>
               </div>
             )}

             <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${!isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover/video:opacity-100 group-hover/video:scale-100'}`}>
                {!seekOverlay && (
                  <div className="p-6 rounded-full bg-black/40 backdrop-blur-md shadow-2xl hover:bg-black/60 transition-colors border border-white/10">
                     {isPlaying ? <Pause className="w-10 h-10 text-white fill-white" /> : <Play className="w-10 h-10 text-white fill-white ml-1" />}
                  </div>
                )}
             </div>

             {/* Bottom Controls Bar */}
             <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pt-12 transition-all duration-300 ${showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                
                {/* Progress Bar */}
                <div className="relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 group/progress hover:h-2 transition-all">
                   <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute -top-2 left-0 w-full h-6 opacity-0 cursor-pointer z-20" />
                   <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full pointer-events-none z-10 transition-all" style={{ width: `${progress}%` }}></div>
                   <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform pointer-events-none z-10" style={{ left: `${progress}%`, marginLeft: '-8px' }}></div>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      
                      {/* NEW: Previous Button */}
                      <button 
                         onClick={(e) => { e.stopPropagation(); if (onPrevious) onPrevious(); }} 
                         disabled={!hasPrevious}
                         className={`transition-colors ${hasPrevious ? 'text-white hover:text-indigo-400' : 'text-white/30 cursor-not-allowed'}`}
                      >
                         <SkipBack className="w-5 h-5 fill-current" />
                      </button>

                      <button onClick={handlePlayPause} className="text-white hover:text-indigo-400 transition-colors">
                         {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                      </button>

                      {/* NEW: Next Button */}
                      <button 
                         onClick={(e) => { e.stopPropagation(); if (onNext) onNext(); }} 
                         disabled={!hasNext}
                         className={`transition-colors ${hasNext ? 'text-white hover:text-indigo-400' : 'text-white/30 cursor-not-allowed'}`}
                      >
                         <SkipForward className="w-5 h-5 fill-current" />
                      </button>

                      {/* Volume */}
                      <div className="flex items-center gap-3 group/volume ml-2">
                         <button onClick={toggleMute} className="text-white hover:text-indigo-400">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                         <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                      
                      <div className="text-xs font-medium text-slate-300 font-mono tracking-wide ml-2"><span className="text-white">{formatDuration(currentTime)}</span> / {formatDuration(duration)}</div>
                   </div>

                   <div className="flex items-center gap-4">
                      <div className="relative">
                         <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="flex items-center gap-1.5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors group/speed">
                            <Gauge className="w-4 h-4 text-slate-300 group-hover/speed:text-white" />
                            <span className="text-xs font-bold text-white w-8 text-center">{playbackSpeed}x</span>
                         </button>
                         {showSpeedMenu && (
                           <div className="absolute bottom-full right-0 mb-4 w-32 bg-[#0f172a]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 backdrop-blur-md">
                             {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(speed => (
                               <button key={speed} onClick={() => handleSpeedChange(speed)} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold ${playbackSpeed === speed ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{speed}x {playbackSpeed === speed && <Check className="w-3 h-3" />}</button>
                             ))}
                           </div>
                         )}
                      </div>
                      <button onClick={togglePiP} className="text-white hover:text-indigo-400"><PictureInPicture2 className="w-5 h-5" /></button>
                      <button onClick={toggleFullscreen} className="text-white hover:text-indigo-400">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</button>
                   </div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}
