import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XtreamCredentials, fetchXtreamApi } from '../lib/xtream';
import Navigation from '../components/Navigation';
import ImageWithFallback from '../components/ImageWithFallback';
import { motion } from 'motion/react';
import { Play, ArrowLeft, Heart, Clock, Calendar, Tv, Radio } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

export default function LiveDetails({ credentials }: { credentials: XtreamCredentials }) {
  const { id } = useParams<{ id: string }>();
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [epgData, setEpgData] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    
    // Check favorites
    const favs = JSON.parse(localStorage.getItem('xtream_favorites_live') || '[]');
    setIsFavorite(favs.includes(id));

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch channel info
        const streams = await fetchXtreamApi(credentials, 'get_live_streams').catch(() => []);
        if (Array.isArray(streams)) {
          const channel = streams.find((s: any) => String(s.stream_id) === String(id));
          if (channel) {
            setChannelInfo(channel);
          }
        }

        // Fetch short EPG
        const epg = await fetchXtreamApi(credentials, 'get_short_epg', { stream_id: id, limit: "50" }).catch(() => null);
        if (epg && epg.epg_listings) {
          setEpgData(epg.epg_listings);
        }
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, credentials]);

  const toggleFavorite = () => {
    if (!id) return;
    const favs = JSON.parse(localStorage.getItem('xtream_favorites_live') || '[]');
    if (isFavorite) {
      const newFavs = favs.filter((f: string) => f !== id);
      localStorage.setItem('xtream_favorites_live', JSON.stringify(newFavs));
      setIsFavorite(false);
      toast.info('تم الإزالة من المفضلة');
    } else {
      favs.push(id);
      localStorage.setItem('xtream_favorites_live', JSON.stringify(favs));
      setIsFavorite(true);
      toast.success('تم الإضافة إلى المفضلة');
    }
  };

  const currentProgram = epgData.find((p: any) => {
    const now = new Date();
    const start = new Date(p.start_timestamp * 1000 || p.start);
    const end = new Date(p.stop_timestamp * 1000 || p.end);
    return now >= start && now <= end;
  });

  return (
    <div className="flex min-h-[100dvh] bg-dark text-white">
      <Navigation />
      
      <main className="flex-1 md:pr-[260px] relative h-[100dvh] overflow-y-auto styled-scrollbar pb-20">
        <div className="relative min-h-[50vh] flex flex-col justify-end pt-32 pb-16 px-6 md:px-12 bg-panel">
          <div className="absolute inset-0 z-0 overflow-hidden">
            {channelInfo?.stream_icon && (
               <div 
                 className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125"
                 style={{ backgroundImage: `url(${channelInfo.stream_icon})` }}
               />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/10 via-dark/40 to-dark opacity-60"></div>
          </div>

          <button onClick={() => navigate(-1)} className="absolute top-8 right-6 md:right-12 z-20 w-12 h-12 bg-black/40 backdrop-blur-md hover:bg-brand text-white hover:text-black border border-white/10 rounded-full flex items-center justify-center transition-all">
            <ArrowLeft size={24} />
          </button>

          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-end">
            <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 overflow-hidden p-4">
              {channelInfo?.stream_icon ? (
                 <ImageWithFallback src={channelInfo.stream_icon} alt={channelInfo.name} type="live" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              ) : (
                 <Radio size={48} className="text-brand opacity-80" />
              )}
            </div>

            <div className="flex-1 w-full text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                 <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-sm uppercase tracking-wider animate-pulse shadow-lg">
                   بث مباشر
                 </span>
                 {channelInfo?.category_name && (
                   <span className="inline-block px-3 py-1 bg-white/10 text-brand text-xs font-bold rounded-sm uppercase tracking-wider backdrop-blur-md">
                     {channelInfo.category_name}
                   </span>
                 )}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">
                {channelInfo?.name || `قناة ${id}`}
              </h1>

              {currentProgram && (
                <div className="mb-6">
                  <p className="text-brand font-medium mb-1 flex items-center justify-center md:justify-start gap-2">
                    <Clock size={16} /> يُعرض الآن
                  </p>
                  <p className="text-xl md:text-2xl font-bold">{atob(currentProgram.title).replace(/\+/g, ' ')}</p>
                  {currentProgram.description && (
                    <p className="text-sm text-gray-400 mt-2 max-w-2xl mx-auto md:mx-0">
                       {atob(currentProgram.description).replace(/\+/g, ' ')}
                    </p>
                  )}
                </div>
              )}

              {!currentProgram && epgData.length === 0 && !loading && (
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto md:mx-0">
                  لا توجد معلومات للبرامج الحالية لهذه القناة.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-8">
                <button 
                  onClick={() => navigate(`/player/live/${id}`)}
                  className="bg-brand text-black px-10 py-4 rounded-sm font-bold text-lg hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(212,249,51,0.4)]"
                >
                  <Play fill="black" size={20} /> تشغيل القناة
                </button>
                <button 
                  onClick={toggleFavorite}
                  className={`px-8 py-4 rounded-sm font-bold text-lg border transition-all flex items-center justify-center gap-3 ${
                    isFavorite 
                      ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                  {isFavorite ? 'مضافة للمفضلة' : 'إضافة للمفضلة'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
          {epgData.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Tv size={24} className="text-brand" />
                دليل البرامج (EPG)
              </h2>
              
              <div className="flex flex-col gap-3 relative">
                {/* Timeline vertical line for visual effect */}
                <div className="absolute right-6 top-0 bottom-0 w-[2px] bg-white/5 md:block hidden"></div>
                
                {epgData.map((program: any, idx: number) => {
                  const start = new Date(program.start_timestamp * 1000 || program.start);
                  const end = new Date(program.stop_timestamp * 1000 || program.end);
                  const now = new Date();
                  const isCurrent = now >= start && now <= end;
                  const isPast = now > end;
                  const isUpcoming = now < start;
                  const title = program.title ? atob(program.title).replace(/\+/g, ' ') : 'برنامج مجهول';
                  const desc = program.description ? atob(program.description).replace(/\+/g, ' ') : '';
                  const durationMs = end.getTime() - start.getTime();
                  const durationMins = Math.round(durationMs / 60000);
                  
                  let progress = 0;
                  if (isCurrent) {
                    const elapsedMs = now.getTime() - start.getTime();
                    progress = Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100));
                  }

                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                      className={clsx(
                        "relative p-5 rounded-md border transition-all flex flex-col md:flex-row md:items-start gap-5 pr-14 md:pr-16",
                        isCurrent 
                          ? "bg-brand/10 border-brand/50 shadow-[0_0_15px_rgba(212,249,51,0.1)]" 
                          : isPast 
                            ? "bg-black/40 border-white/5 opacity-60" 
                            : "bg-panel border-white/5 hover:border-white/10"
                      )}
                    >
                      {/* Timeline Dot */}
                      <div className={clsx(
                        "absolute right-4 md:right-5 top-7 w-3 h-3 rounded-full z-10",
                        isCurrent ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" : isPast ? "bg-gray-600" : "bg-brand border-2 border-dark"
                      )}></div>

                      <div className="flex-1 w-full flex flex-col gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className={clsx("font-bold text-lg", isCurrent ? "text-brand" : isPast ? "text-gray-400" : "text-white")}>{title}</h3>
                          
                          {isCurrent && <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-red-500/30">مباشر الآن</span>}
                          {isUpcoming && <span className="bg-white/10 text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-white/10">قادم</span>}
                        </div>
                        
                        {desc && <p className={clsx("text-sm pr-1", isCurrent ? "text-gray-300" : isPast ? "text-gray-500" : "text-gray-400")}>{desc}</p>}
                        
                        {isCurrent && (
                          <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
                            <div className="bg-brand h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="shrink-0 flex items-center justify-between md:flex-col md:items-end gap-2 bg-black/40 px-4 py-3 rounded-md w-full md:w-auto border border-white/5">
                        <div className={clsx("flex items-center gap-2 font-mono text-sm", isCurrent ? "text-brand font-bold" : isPast ? "text-gray-500" : "text-gray-300")}>
                          <Clock size={14} className={isCurrent ? "text-brand" : "text-gray-500"} />
                          <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-gray-600">-</span>
                          <span>{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>{start.toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-gray-400 font-medium bg-white/5 px-2 py-0.5 rounded-sm">
                            {durationMins} دقيقة
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
