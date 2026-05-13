import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Loader2, Tv, X } from 'lucide-react';
import { fetchXtreamApi, XtreamCredentials } from '../lib/xtream';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';

interface StreamButtonProps {
  credentials: XtreamCredentials;
  matchName: string; // e.g. Real Madrid vs Barcelona
  homeTeam: string;
  awayTeam: string;
}

export function StreamButton({ credentials, matchName, homeTeam, awayTeam }: StreamButtonProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleWatchClick = async () => {
    if (!credentials) {
      toast.error("يرجى تسجيل الدخول بخادم IPTV أولاً");
      return;
    }

    setLoading(true);
    try {
      const streams = await fetchXtreamApi(credentials, 'get_live_streams');
      
      if (!streams || !Array.isArray(streams)) {
        toast.error("لم يتم العثور على قنوات");
        return;
      }

      // Keyword matching logic (case insensitive)
      const keywords = ['bein', 'ssc', 'abu dhabi sports', 'alkass', homeTeam.toLowerCase(), awayTeam.toLowerCase()];
      
      // Filter streams that might be sports channels
      const matched = streams.filter(s => {
        if (!s.name) return false;
        const lowerName = s.name.toLowerCase();
        
        // Exact matching or sports category matching? We'll just check keywords
        return keywords.some(k => lowerName.includes(k)) || lowerName.includes('sport');
      });

      // Priority sort (beIN first, SSC second)
      matched.sort((a, b) => {
         const aName = a.name.toLowerCase();
         const bName = b.name.toLowerCase();
         const scoreA = aName.includes('bein') ? 10 : aName.includes('ssc') ? 9 : aName.includes('sport') ? 5 : 0;
         const scoreB = bName.includes('bein') ? 10 : bName.includes('ssc') ? 9 : bName.includes('sport') ? 5 : 0;
         return scoreB - scoreA;
      });

      const bestMatches = matched.slice(0, 15); // Show top 15 options

      if (bestMatches.length === 0) {
         toast.error("لم يتم العثور على قناة تنقل المباراة");
      } else if (bestMatches.length === 1 && bestMatches[0].name.toLowerCase().includes('bein')) {
         // Auto-redirect if only 1 highly probable match
         navigate(`/player/live/${bestMatches[0].stream_id}`);
      } else {
         setOptions(bestMatches);
         setShowModal(true);
      }
      
    } catch (err) {
      console.error(err);
      toast.error("فشل الاتصال بخادم القنوات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleWatchClick}
        disabled={loading}
        className="w-full bg-brand text-black font-bold py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-brand/90 transition-transform active:scale-95 shadow-[0_0_20px_rgba(var(--brand-rgb),0.3)] disabled:opacity-50 disabled:active:scale-100 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
        {loading ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} fill="currentColor" />}
        <span className="text-lg md:text-xl">شاهد الآن</span>
      </button>

      {/* Select Channel Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#121212] w-full max-w-lg md:rounded-2xl rounded-t-3xl border border-white/10 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#121212]/90 backdrop-blur z-10">
                 <div>
                    <h3 className="font-bold text-lg text-white">اختر القناة الناقلة</h3>
                    <p className="text-xs text-brand">تم العثور على قنوات محتملة للمباراة</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400">
                    <X size={20} />
                 </button>
              </div>

              <div className="overflow-y-auto styled-scrollbar p-2 flex-1">
                 {options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/player/live/${option.stream_id}`)}
                      className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-right relative overflow-hidden group border border-transparent hover:border-white/5 mb-1"
                    >
                       {/* TV Icon */}
                       <div className="w-12 h-12 rounded bg-black/40 flex items-center justify-center text-brand shrink-0 group-hover:bg-brand group-hover:text-black transition-colors">
                          {option.stream_icon ? <img src={option.stream_icon} className="w-8 h-8 object-contain" /> : <Tv size={24} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-200 truncate group-hover:text-white">{option.name}</h4>
                          <h5 className="text-[10px] text-gray-500 uppercase">{option.stream_type}</h5>
                       </div>
                       <Play size={16} className="text-gray-600 group-hover:text-white ml-2 shrink-0" />
                    </button>
                 ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
