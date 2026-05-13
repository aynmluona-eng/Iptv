import React from 'react';
import { motion } from 'motion/react';
import { Tv, Activity } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export interface MatchCardProps {
  item: any;
  getStatusText?: (status: any) => any;
  featured?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ item, getStatusText, featured = false }) => {
  const navigate = useNavigate();
  const match = item.fixture;
  const teams = item.teams;
  const goals = item.goals;
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status.short);

  // If we don't have custom getStatusText, fallback
  const renderStatus = () => {
    if (getStatusText) return getStatusText({ ...match.status, date: match.date });
    if (match.status.short === 'FT') return 'انتهت';
    return match.status.short;
  };

  return (
    <motion.div
      onClick={() => navigate(`/sports/match/${match.id}`)}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "cursor-pointer overflow-hidden rounded-[16px] transition-all duration-300 relative border border-white/5",
        featured ? "bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#0A0A0A] p-6 shadow-2xl h-[160px] flex flex-col justify-center border-brand/20" : "bg-[#121212] p-4 hover:bg-[#1a1a1a] hover:border-white/10"
      )}
    >
      {featured && isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-brand/20 text-brand px-2.5 py-1 rounded-full text-[10px] font-bold border border-brand/30 z-10 animate-pulse">
           <Activity size={12} /> مباشر {match.status.elapsed}'
        </div>
      )}
      
      {!featured && isLive && (
         <div className="absolute top-3 right-3 flex items-center gap-1 bg-brand/20 text-brand px-2 py-0.5 rounded-full text-[9px] font-bold border border-brand/30 z-10 animate-pulse">
           <div className="w-1.5 h-1.5 rounded-full bg-brand"></div> {match.status.elapsed}'
         </div>
      )}

      {featured && item.league && (
         <div className="absolute top-4 left-4 text-[10px] text-gray-400 bg-black/40 px-2 py-1 rounded-full backdrop-blur z-10 border border-white/5 line-clamp-1 max-w-[120px]">
            {item.league.name}
         </div>
      )}

      <div className={clsx(
        "grid items-center gap-2 md:gap-3 w-full z-10 relative",
        featured ? "grid-cols-[1fr_auto_100px_auto_1fr]" : "grid-cols-[1fr_auto_80px_auto_1fr] md:grid-cols-[1fr_auto_120px_auto_1fr]"
      )}>
        {/* Home */}
        <div className="flex justify-start min-w-0 w-full" dir="rtl">
           <span className={clsx("font-bold truncate text-right block w-full", featured ? "text-sm md:text-lg text-white" : "text-xs md:text-sm lg:text-base text-gray-200")}>{teams.home.name}</span>
        </div>
        <div className={clsx("flex items-center justify-center shrink-0", featured ? "w-10 sm:w-12 h-10 sm:h-12" : "w-6 h-6 md:w-8 md:h-8")}>
           <img src={teams.home.logo} className="w-full h-full object-contain drop-shadow-lg" alt="" />
        </div>

        {/* Center / Score */}
        <div className="flex flex-col items-center justify-center shrink-0">
           {(match.status.short === 'NS' || match.status.short === 'PST') ? (
              <div className={clsx("font-bold text-gray-400 bg-white/5 rounded-full whitespace-nowrap", featured ? "py-1.5 px-3 md:px-4 text-xs md:text-sm" : "py-1 px-2 md:px-3 text-[11px] md:text-sm")}>
                 {renderStatus()}
              </div>
           ) : (
              <div className="flex flex-col items-center">
                 <div className={clsx("font-black tracking-widest text-white rounded bg-black/60", featured ? "text-lg md:text-2xl px-4 py-1 border border-white/10" : "text-sm md:text-xl px-3 py-1")}>
                    {goals.home ?? 0} <span className="px-1 text-gray-600">-</span> {goals.away ?? 0}
                 </div>
                 {!featured && isLive && <div className="text-[10px] md:text-[11px] text-brand font-bold mt-1 opacity-0 h-0">.</div>} {/* Spacer if needed */}
              </div>
           )}
        </div>

        {/* Away */}
        <div className={clsx("flex items-center justify-center shrink-0", featured ? "w-10 sm:w-12 h-10 sm:h-12" : "w-6 md:w-8")}>
           <img src={teams.away.logo} className="w-full h-full object-contain drop-shadow-lg" alt="" />
        </div>
        <div className="flex justify-end min-w-0 w-full" dir="ltr">
           <span className={clsx("font-bold truncate text-left block w-full", featured ? "text-sm md:text-lg text-white" : "text-xs md:text-sm lg:text-base text-gray-200")}>{teams.away.name}</span>
        </div>
      </div>
      
      {/* Background effects for featured */}
      {featured && (
         <>
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-brand/10 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>
         </>
      )}
    </motion.div>
  );
}
