import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { XtreamCredentials, getStreamUrl, getOriginalStreamUrl } from '../lib/xtream';
import { 
  ArrowLeft, Loader2, Play, Pause, Volume2, VolumeX, Maximize, 
  Minimize, Settings, MonitorPlay, ExternalLink, SkipForward, SkipBack 
} from 'lucide-react';
import screenfull from 'screenfull';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function Player({ credentials }: { credentials: XtreamCredentials }) {
  const { type, id } = useParams<{ type: 'live' | 'movie' | 'series', id: string }>();
  const [searchParams] = useSearchParams();
  const ext = searchParams.get('ext') || (type === 'live' ? 'm3u8' : 'mp4');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Player State
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // New features state
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>('contain');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioMode, setAudioMode] = useState<'normal' | 'enhanced' | 'dolby'>('normal');
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaElementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [mpegtsInstance, setMpegtsInstance] = useState<any>(null);
  const [qualityLevels, setQualityLevels] = useState<{height: number, bitrate: number}[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 is auto
  const [hlsSupported, setHlsSupported] = useState(false);

  useEffect(() => {
    if (screenfull.isEnabled) {
      const handleFullscreenChange = () => {
        setIsFullscreen(screenfull.isFullscreen);
        if (screenfull.isFullscreen) {
          try {
            // @ts-ignore
            if (window.screen.orientation && window.screen.orientation.lock) {
              // @ts-ignore
              window.screen.orientation.lock('landscape').catch(() => {});
            }
          } catch(e) {}
        } else {
          try {
            if (window.screen.orientation && window.screen.orientation.unlock) {
              window.screen.orientation.unlock();
            }
          } catch(e) {}
        }
      };
      
      screenfull.on('change', handleFullscreenChange);
      return () => {
        screenfull.off('change', handleFullscreenChange);
      };
    }
  }, []);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    const handleMouseMove = () => resetControlsTimeout();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleMouseMove);
    resetControlsTimeout();
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!type || !id || !videoRef.current) return;
    const streamUrl = getStreamUrl(credentials, id, type, ext);
    let hls: Hls | null = null;
    const video = videoRef.current;

    let flvPlayer: any = null;

    const initPlayer = () => {
      setLoading(true);
      setError('');

      if (Hls.isSupported() && ext === 'm3u8') {
        setHlsSupported(true);
        hls = new Hls({
          maxBufferLength: 120, // Target 120 seconds of buffer
          maxMaxBufferLength: 600, // Allow up to 10 minutes of buffer
          maxBufferSize: 300 * 1000 * 1000, // Default is 60MB, boost to ~300MB
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90, // Keep 90s behind to prevent re-fetching on small seeks
          fragLoadingMaxRetry: 10,
          manifestLoadingMaxRetry: 10,
          levelLoadingMaxRetry: 10,
          abrEwmaDefaultEstimate: 5000000, // Default 5Mbps estimate to start high quality fast
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        setHlsInstance(hls);
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => { 
          setLoading(false); 
          if (data.levels) {
             setQualityLevels(data.levels.map(l => ({ height: l.height, bitrate: l.bitrate })));
          }
          video.play().catch(e => console.error("Play failed", e)); 
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS Error:', data);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('fatal network error encountered, try to recover');
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('fatal media error encountered, try to recover');
                hls?.recoverMediaError();
                break;
              default:
                if (hls) hls.destroy();
                const hlsErr = 'تعذر تشغيل الفيديو. يرجى التأكد من توفر القناة أو المحتوى.';
                setError(hlsErr);
                toast.error(hlsErr);
                setLoading(false);
                break;
            }
          }
        });
      } else if (mpegts.getFeatureList().mseLivePlayback && ext === 'ts') {
         flvPlayer = mpegts.createPlayer({
             type: 'mse',
             isLive: type === 'live',
             url: streamUrl
         }, {
            enableStashBuffer: true,
            stashInitialSize: 5242880, // 5MB stash initially
            lazyLoad: false,
            autoCleanupSourceBuffer: true,
            autoCleanupMaxBackwardDuration: 5 * 60,
            autoCleanupMinBackwardDuration: 2 * 60,
         });
         
         flvPlayer.attachMediaElement(video);
         flvPlayer.load();
         setMpegtsInstance(flvPlayer);

         flvPlayer.on(mpegts.Events.MEDIA_INFO, () => {
             setLoading(false);
             video.play().catch(e => console.error("Play failed", e));
         });

         flvPlayer.on(mpegts.Events.ERROR, (err: any, errDet: any) => {
             console.error("MPEGTS Error", err, errDet);
             flvPlayer.destroy();
             // Native fallback
             video.src = streamUrl;
             video.play().catch(e => {
                  const mpegtssErr = 'تعذر تشغيل البث. حاول استخدام مشغل خارجي (VLC/MX).';
                  setError(mpegtssErr);
                  toast.error(mpegtssErr);
                  setLoading(false);
             });
         });
      } else if (video.canPlayType('application/vnd.apple.mpegurl') && ext === 'm3u8') {
        // Native HLS (Safari/iOS)
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => { 
          setLoading(false); 
          video.play().catch(e => console.error("Play failed", e)); 
        });
      } else {
        // MP4 / Other formats
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => { 
          setLoading(false); 
          video.play().catch(e => console.error("Play failed", e)); 
        });
        
        video.addEventListener('playing', () => setLoading(false));

        video.addEventListener('error', (e) => {
          console.error("Video Error:", video.error);
          let errorMsg = 'تعذر تشغيل الفيديو.';
          if (video.error) {
            errorMsg += ` (Code: ${video.error.code})`;
          }
          if (ext && ext !== 'mp4' && ext !== 'm3u8') {
             errorMsg += ` الصيغة ${ext.toUpperCase()} قد لا تكون مدعومة في المتصفح. استخدم زر VLC أو MX أعلاه.`;
          }
          setError(errorMsg);
          toast.error(errorMsg);
          setLoading(false);
        });
      }
    };

    initPlayer();
    
    const handleTimeUpdate = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => { 
      hls?.destroy(); 
      if (flvPlayer) {
          flvPlayer.unload();
          flvPlayer.detachMediaElement();
          flvPlayer.destroy();
      }
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.pause(); 
    };
  }, [type, id, credentials, ext]);

  const togglePlay = (e?: React.MouseEvent) => { 
    e?.stopPropagation();
    if (videoRef.current) { 
      if (isPlaying) videoRef.current.pause(); 
      else videoRef.current.play(); 
    } 
  };
  
  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const skip = (amount: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const openExternalPlayer = (playerExt: 'vlc' | 'mx', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!type || !id) return;
    const streamUrl = getOriginalStreamUrl(credentials, id, type, ext);
    const encodedUrl = encodeURIComponent(streamUrl);
    
    // Simple intent handling based on userAgent
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (playerExt === 'vlc') {
      if (isIOS) {
        window.location.href = `vlc-x-callback://x-callback-url/stream?url=${encodedUrl}`;
      } else if (isAndroid) {
        window.location.href = `intent://${streamUrl.replace(/^https?:\/\//i, '')}#Intent;package=org.videolan.vlc;type=video/*;scheme=http;end`;
      } else {
        window.open(streamUrl, '_blank');
      }
    } else if (playerExt === 'mx') {
      if (isAndroid) {
         window.location.href = `intent:${streamUrl}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end`;
      } else {
         window.open(streamUrl, '_blank');
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMoveProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !tooltipRef.current || duration === 0) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    
    tooltipRef.current.style.left = `${percent * 100}%`;
    tooltipRef.current.textContent = formatTime(percent * duration);
  };

  const handlePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    toast.success(`تم تغيير السرعة إلى ${rate}x`);
    setShowSettings(false);
  };

  const handleQualityChange = (level: number) => {
    setCurrentQuality(level);
    if (hlsInstance) {
      hlsInstance.currentLevel = level;
    }
    toast.info('تم تغيير الجودة، قد يستغرق التطبيق ثوانٍ للتبديل');
    setShowSettings(false);
  };

  const setAudioEffect = (mode: 'normal' | 'enhanced' | 'dolby') => {
    if (!videoRef.current) return;
    
    try {
      if (!audioContextRef.current && mode !== 'normal') {
        // @ts-ignore
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaElementSource(videoRef.current);
        mediaElementSourceRef.current = source;

        const compressor = ctx.createDynamicsCompressor();
        compressorRef.current = compressor;
        compressor.threshold.setValueAtTime(-24, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(1, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);

        const bassFilter = ctx.createBiquadFilter();
        bassFilterRef.current = bassFilter;
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.setValueAtTime(150, ctx.currentTime);
        bassFilter.gain.setValueAtTime(0, ctx.currentTime); // Initially off

        const trebleFilter = ctx.createBiquadFilter();
        trebleFilterRef.current = trebleFilter;
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.setValueAtTime(4000, ctx.currentTime);
        trebleFilter.gain.setValueAtTime(0, ctx.currentTime); // Initially off

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.9, ctx.currentTime);

        source.connect(compressor);
        compressor.connect(bassFilter);
        bassFilter.connect(trebleFilter);
        trebleFilter.connect(gainNode);
        gainNode.connect(ctx.destination);
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
         ctx.resume();
      }

      const bass = bassFilterRef.current;
      const treble = trebleFilterRef.current;
      const comp = compressorRef.current;

      if (mode === 'enhanced') {
         // Clear voices and crisp highs
         bass?.frequency.setTargetAtTime(150, ctx.currentTime, 0.1);
         bass?.gain.setTargetAtTime(2, ctx.currentTime, 0.1); 
         treble?.frequency.setTargetAtTime(4000, ctx.currentTime, 0.1);
         treble?.gain.setTargetAtTime(4, ctx.currentTime, 0.1); 
         comp?.ratio.setTargetAtTime(8, ctx.currentTime, 0.1); 
         toast.success('تم تفعيل وضع النقاء');
      } else if (mode === 'dolby') {
         // Deep cinematic bass, crisp highs, strong compression
         bass?.frequency.setTargetAtTime(60, ctx.currentTime, 0.1);
         bass?.gain.setTargetAtTime(8, ctx.currentTime, 0.1); 
         treble?.frequency.setTargetAtTime(8000, ctx.currentTime, 0.1);
         treble?.gain.setTargetAtTime(6, ctx.currentTime, 0.1); 
         comp?.ratio.setTargetAtTime(16, ctx.currentTime, 0.1);
         toast.success('تم تفعيل وضع Dolby المحيطي');
      } else {
         bass?.gain.setTargetAtTime(0, ctx.currentTime, 0.1); 
         treble?.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
         comp?.ratio.setTargetAtTime(1, ctx.currentTime, 0.1);
         toast.info('تم الرجوع لوضع الصوت الأصلي');
      }
      setAudioMode(mode);
    } catch (e) {
      console.error("Audio enhancement failed:", e);
      toast.error('لم يتمكن المتصفح من تفعيل معالجة الصوت');
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 overflow-hidden flex items-center justify-center">
      <video 
        ref={videoRef} 
        className="w-full h-full transition-all duration-300"
        style={{ objectFit }}
        preload="auto"
        autoPlay 
        playsInline 
        onClick={() => setShowControls(!showControls)} 
      />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10"
          >
            <div className="w-16 h-16 border-4 border-white/20 border-t-brand rounded-full animate-spin mb-4"></div>
            <p className="text-white font-medium">جاري معالجة البث...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 px-6 text-center">
          <MonitorPlay size={64} className="text-red-500 mb-4 opacity-50" />
          <p className="text-white text-lg font-bold mb-2">خطأ في التشغيل</p>
          <p className="text-gray-400 mb-8">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={20} /> للـخـلـف
          </button>
        </div>
      )}
      
      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute right-4 md:right-12 bottom-24 bg-dark/95 border border-white/10 rounded-xl p-4 w-64 z-50 backdrop-blur-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <h3 className="text-white font-bold">الإعدادات</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto styled-scrollbar pr-2">
              {/* Playback Speed */}
              {type !== 'live' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-2">السرعة</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[0.5, 1, 1.5, 2].map(rate => (
                      <button 
                        key={rate} 
                        onClick={() => handlePlaybackRate(rate)}
                        className={clsx(
                          "py-1 text-xs rounded transition-colors", 
                          playbackRate === rate ? "bg-brand text-black font-bold" : "bg-white/5 text-white hover:bg-white/20"
                        )}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Settings */}
              {hlsSupported && qualityLevels.length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 block mb-2">الجودة</label>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleQualityChange(-1)}
                      className={clsx(
                        "text-right px-2 py-1.5 text-sm rounded transition-colors", 
                        currentQuality === -1 ? "bg-brand text-black font-bold" : "text-white hover:bg-white/10"
                      )}
                    >
                      تلقائي
                    </button>
                    {qualityLevels.map((level, index) => (
                      <button 
                         key={index} 
                         onClick={() => handleQualityChange(index)}
                         className={clsx(
                           "text-right px-2 py-1.5 text-sm rounded transition-colors", 
                           currentQuality === index ? "bg-brand text-black font-bold" : "text-white hover:bg-white/10"
                         )}
                      >
                        {level.height}p {level.bitrate ? `(${Math.round(level.bitrate / 1000)}kbps)` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Audio Enhancement */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">تأثيرات الصوت</label>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setAudioEffect('normal')}
                    className={clsx(
                      "w-full py-1.5 text-xs rounded transition-colors font-bold",
                      audioMode === 'normal' ? "bg-brand text-black" : "bg-white/5 text-white hover:bg-white/20"
                    )}
                  >
                    عادي
                  </button>
                  <button 
                    onClick={() => setAudioEffect('enhanced')}
                    className={clsx(
                      "w-full py-1.5 text-xs rounded transition-colors font-bold",
                      audioMode === 'enhanced' ? "bg-brand text-black" : "bg-white/5 text-white hover:bg-white/20"
                    )}
                  >
                    نقاء الصوت وحوار واضح
                  </button>
                  <button 
                    onClick={() => setAudioEffect('dolby')}
                    className={clsx(
                      "w-full py-1.5 text-xs rounded transition-colors font-bold shadow-[0_0_15px_rgba(212,249,51,0)]",
                      audioMode === 'dolby' ? "bg-brand text-black shadow-[0_0_15px_rgba(212,249,51,0.5)]" : "bg-white/5 text-white hover:bg-white/20"
                    )}
                  >
                    Dolby / محيطي سينمائي
                  </button>
                </div>
              </div>

              {/* Zoom Setting */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">الشاشة</label>
                <div className="flex gap-2">
                   <button 
                     onClick={() => { setObjectFit('contain'); setShowSettings(false); }}
                     className={clsx(
                       "flex-1 py-1.5 text-xs rounded transition-colors", 
                       objectFit === 'contain' ? "bg-brand text-black font-bold" : "bg-white/5 text-white hover:bg-white/20"
                     )}
                   >
                     احتواء
                   </button>
                   <button 
                     onClick={() => { setObjectFit('cover'); setShowSettings(false); }}
                     className={clsx(
                       "flex-1 py-1.5 text-xs rounded transition-colors", 
                       objectFit === 'cover' ? "bg-brand text-black font-bold" : "bg-white/5 text-white hover:bg-white/20"
                     )}
                   >
                     ملء
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && !loading && !error && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between pointer-events-none"
          >
            {/* Top Bar */}
            <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 md:p-6 pt-safe flex justify-between items-start pointer-events-auto">
              <button 
                onClick={() => navigate(-1)} 
                className="w-12 h-12 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-brand transition-colors border border-white/10"
              >
                <ArrowLeft size={24} />
              </button>
              
              <div className="flex gap-2">
                 <button 
                   onClick={(e) => openExternalPlayer('vlc', e)} 
                   className="px-4 py-2 bg-orange-500/80 backdrop-blur-md text-white font-bold text-sm rounded-full flex items-center gap-2 hover:bg-orange-500 transition-colors shadow-lg"
                 >
                   <MonitorPlay size={16} /> VLC
                 </button>
                 <button 
                   onClick={(e) => openExternalPlayer('mx', e)} 
                   className="hidden md:flex px-4 py-2 bg-blue-500/80 backdrop-blur-md text-white font-bold text-sm rounded-full items-center gap-2 hover:bg-blue-500 transition-colors shadow-lg"
                 >
                   <MonitorPlay size={16} /> MX
                 </button>
              </div>
            </div>

            {/* Center Play/Pause (Mobile optimized) */}
            <div className="flex-1 flex justify-center items-center pointer-events-auto gap-8">
               {type !== 'live' && (
                 <button onClick={(e) => skip(-10, e)} className="w-16 h-16 flex items-center justify-center text-white/70 hover:text-white hover:scale-110 transition-all bg-black/20 rounded-full backdrop-blur-sm">
                   <SkipBack size={32} />
                 </button>
               )}
               
               <button 
                 onClick={togglePlay} 
                 className="w-20 h-20 bg-brand backdrop-blur-md text-black rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-[0_0_20px_rgba(212,249,51,0.2)]"
               >
                 {isPlaying ? <Pause size={40} className="fill-black" /> : <Play size={40} className="fill-black ml-2" />}
               </button>

               {type !== 'live' && (
                 <button onClick={(e) => skip(10, e)} className="w-16 h-16 flex items-center justify-center text-white/70 hover:text-white hover:scale-110 transition-all bg-black/20 rounded-full backdrop-blur-sm">
                   <SkipForward size={32} />
                 </button>
               )}
            </div>
            
            {/* Bottom Controls */}
            <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pb-safe md:p-8 pointer-events-auto flex flex-col gap-4">
              
              {/* Progress Bar (VOD only) */}
              {type !== 'live' && duration > 0 && (
                <div className="flex items-center gap-4 w-full">
                  <span className="text-white font-mono text-sm shadow-black ">{formatTime(progress)}</span>
                  <div 
                    ref={progressContainerRef}
                    className="flex-1 relative h-6 flex items-center group cursor-pointer"
                    onMouseMove={handleMouseMoveProgress}
                  >
                    <input 
                      type="range" 
                      min={0} 
                      max={duration} 
                      value={progress} 
                      onChange={handleSeek}
                      className="absolute w-full h-full opacity-0 cursor-pointer z-30"
                    />
                    
                    {/* Tooltip */}
                    <div 
                      ref={tooltipRef}
                      className="absolute top-[-30px] -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-dark/90 border border-white/10 text-brand text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 font-mono shadow-xl"
                    ></div>

                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-brand relative transition-all duration-100"
                         style={{ width: `${(progress / duration) * 100}%` }}
                       ></div>
                    </div>
                    
                    {/* Playhead Indicator */}
                    <div 
                      className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(212,249,51,0.5)] scale-0 group-hover:scale-100 transition-transform pointer-events-none z-20 top-1/2 -translate-y-1/2"
                      style={{ left: `calc(${(progress / duration) * 100}% - 8px)` }}
                    ></div>
                  </div>
                  <span className="text-white/60 font-mono text-sm">{formatTime(duration)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {/* Play/Pause bottom */}
                  <button onClick={togglePlay} className="text-white hover:text-brand transition-colors">
                    {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current" />}
                  </button>
                  
                  {/* Volume Desk/Tablet */}
                  <div className="hidden md:flex items-center gap-2 group">
                    <button onClick={toggleMute} className="text-white hover:text-brand transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-0 group-hover:w-24 transition-all opacity-0 group-hover:opacity-100 h-1.5 bg-white/20 rounded-full accent-brand outline-none"
                    />
                  </div>
                  
                  {type === 'live' && (
                    <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">
                       <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                       بث مباشر
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={() => setShowSettings(!showSettings)} className="text-white hover:text-brand transition-colors">
                    <Settings size={24} />
                  </button>
                  
                  {screenfull.isEnabled && (
                    <button 
                      onClick={() => {
                        if (screenfull.isFullscreen) {
                          screenfull.exit();
                        } else if (containerRef.current) {
                          screenfull.request(containerRef.current);
                        }
                      }} 
                      className="text-white hover:text-brand transition-colors"
                    >
                      {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
