import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Activity, Calendar, Trophy, AlertCircle, RefreshCw, ChevronUp, ChevronDown, MonitorPlay, Film, Tv } from 'lucide-react';
import { getTodaysFixtures, hasSportsApiConfigured } from '../services/sports';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default function Sports({ onLogout }: { onLogout: () => void }) {
  const [fixturesByLeague, setFixturesByLeague] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiMissing, setApiMissing] = useState(false);
  
  // Date selection (-1 = yesterday, 0 = today, 1 = tomorrow, 2 = day after, etc)
  const [dateOffset, setDateOffset] = useState(0);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

  const getDateStr = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const getDisplayDateInfo = (offset: number) => {
    if (offset === 0) return 'اليوم';
    if (offset === -1) return 'أمس';
    if (offset === 1) return 'غداً';
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const loadData = async (offset: number) => {
    setLoading(true);
    setError('');
    
    if (!hasSportsApiConfigured()) {
       setApiMissing(true);
       setLoading(false);
       return;
    }

    try {
      const data = await getTodaysFixtures(getDateStr(offset));
      
      const TOP_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 1, 4, 5, 6, 7, 9, 12, 17, 19, 307];

      // Sort fixtures by status, top leagues, or time
      const getStatusPriority = (statusShort: string) => {
        const liveStatus = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT'];
        const upcomingStatus = ['NS', 'TBD'];
        if (liveStatus.includes(statusShort)) return 1;
        if (upcomingStatus.includes(statusShort)) return 2;
        return 3;
      };

      const getLeaguePriority = (leagueId: number) => {
        return TOP_LEAGUES.includes(leagueId) ? 1 : 2;
      };

      // Group by league
      const grouped: Record<number, any> = {};
      data.forEach((item: any) => {
         const lID = item.league.id;
         if (!grouped[lID]) {
            grouped[lID] = {
               league: item.league,
               priority: getLeaguePriority(lID),
               fixtures: []
            };
         }
         grouped[lID].fixtures.push(item);
      });

      // Sort leagues
      const leaguesArray = Object.values(grouped).sort((a: any, b: any) => {
         if (a.priority !== b.priority) return a.priority - b.priority;
         return a.league.name.localeCompare(b.league.name);
      });

      // Sort matches inside leagues
      leaguesArray.forEach((group: any) => {
         group.fixtures.sort((a: any, b: any) => {
           const statusA = getStatusPriority(a.fixture.status.short);
           const statusB = getStatusPriority(b.fixture.status.short);
           if (statusA !== statusB) return statusA - statusB;

           const tA = new Date(a.fixture.date).getTime();
           const tB = new Date(b.fixture.date).getTime();
           return tA - tB;
         });
      });
      
      setFixturesByLeague(leaguesArray);
    } catch (err: any) {
      if (err.message === 'API_KEY_MISSING') {
         setApiMissing(true);
      } else {
         setError('حدث خطأ أثناء جلب المباريات.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateOffset);
  }, [dateOffset]);

  const toggleLeague = (id: string) => {
     setCollapsedLeagues(prev => ({
        ...prev,
        [id]: !prev[id]
     }));
  };

  const getStatusText = (status: any) => {
     switch(status.short) {
       case '1H': case '2H': case 'HT': case 'ET': case 'P':
         return <span className="text-brand font-bold animate-pulse">{status.elapsed}'</span>;
       case 'FT': case 'AET': case 'PEN':
         return <span className="text-gray-400">انتهت</span>;
       case 'NS':
         return <span className="text-gray-300">{new Date(status.date || new Date()).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</span>;
       case 'CANC': case 'PST':
         return <span className="text-orange-500">مؤجلة</span>;
       default:
         return <span className="text-gray-400">{status.short}</span>;
     }
  };

  const datesList = [-1, 0, 1, 2, 3, 4];

  return (
    <div className="flex min-h-[100vh] bg-black text-white selection:bg-brand/30 font-sans">
      <Navigation onLogout={onLogout} />
      
      <main className="flex-1 md:pr-[260px] pb-32 md:pb-12 relative bg-[#0A0A0A]">
        {/* Date Selector Header */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5">
           <div className="flex items-center justify-center overflow-x-auto styled-scrollbar hide-scrollbar px-4 w-full">
              <div className="flex gap-2 w-full max-w-4xl mx-auto md:justify-center">
                {datesList.map((offset) => (
                   <button 
                     key={offset}
                     onClick={() => setDateOffset(offset)}
                     className={clsx(
                        "px-4 md:px-6 py-4 font-bold whitespace-nowrap transition-colors border-b-2 text-sm md:text-base flex-1 md:flex-none text-center",
                        dateOffset === offset ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-white hover:bg-white/5"
                     )}
                   >
                     {getDisplayDateInfo(offset)}
                   </button>
                ))}
              </div>
           </div>
        </div>

        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 mt-4">
           {/* Section Title */}
           <div className="text-center mb-6">
              <h1 className="text-xl font-bold flex items-center justify-center gap-2">أتابع</h1>
              <p className="text-gray-500 text-sm mt-1">لا مباريات اليوم</p>
           </div>

           {apiMissing && (
             <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-6 text-orange-400">
                <div className="flex gap-4 items-start">
                   <AlertCircle size={24} className="shrink-0 mt-1" />
                   <div>
                     <h3 className="font-bold text-lg mb-2 text-orange-500">خاصية المباريات غير مفعلة</h3>
                     <p className="mb-4 text-sm text-orange-200">
                       بما أن هذا التطبيق مستقل، يحتاج مالك التطبيق إلى تفعيل ميزة المباريات عن طريق إضافة مفتاح <code className="bg-black/30 px-1 py-0.5 rounded text-white mx-1">VITE_SPORTS_API_KEY</code> من موقع api-football.com في إعدادات البيئة الخاصة بالتطبيق.
                     </p>
                   </div>
                </div>
             </div>
           )}

           {loading && !apiMissing && (
              <div className="flex items-center justify-center py-20">
                 <div className="w-10 h-10 border-4 border-white/10 border-t-brand rounded-full animate-spin"></div>
              </div>
           )}

           {error && !apiMissing && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-6 text-red-500 flex items-center justify-between">
                <p>{error}</p>
                <button onClick={() => loadData(dateOffset)} className="flex items-center gap-2 bg-red-500/20 px-4 py-2 hover:bg-red-500/30 rounded transition-colors">
                  <RefreshCw size={18} /> إعادة المحاولة
                </button>
              </div>
           )}

           {!loading && !apiMissing && !error && fixturesByLeague.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                 <Trophy size={48} className="mx-auto mb-4 opacity-30" />
                 <p className="text-xl">لا توجد مباريات مجدولة لهذا اليوم.</p>
              </div>
           )}

           {!loading && !apiMissing && fixturesByLeague.length > 0 && (
             <div className="space-y-4 shadow-xl">
               {fixturesByLeague.map((group: any) => {
                 const isCollapsed = collapsedLeagues[group.league.id];
                 
                 return (
                    <div key={group.league.id} className="bg-[#121212] border border-white/5 rounded-[16px] overflow-hidden">
                       <button 
                         onClick={() => toggleLeague(group.league.id)}
                         className="w-full bg-[#181818] p-4 flex items-center justify-between hover:bg-[#202020] transition-colors"
                       >
                          <div className="flex items-center gap-3">
                             <span className="text-gray-400">
                                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                             </span>
                             <span className="font-bold text-white text-base md:text-lg">{group.league.country} - {group.league.name}</span>
                             <img src={group.league.logo} alt={group.league.name} className="w-6 h-6 object-contain" />
                          </div>
                          {group.league.flag && <img src={group.league.flag} className="w-6 h-4 object-cover rounded-[2px] opacity-80" />}
                       </button>

                       <AnimatePresence>
                          {!isCollapsed && (
                             <motion.div 
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               style={{ overflow: 'hidden' }}
                             >
                                <div className="divide-y divide-white/5">
                                   {group.fixtures.map((item: any) => {
                                      const match = item.fixture;
                                      const teams = item.teams;
                                      const goals = item.goals;
                                      
                                      const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.status.short);

                                      return (
                                         <div 
                                           key={match.id}
                                           onClick={() => navigate(`/sports/match/${match.id}`)}
                                           className="p-4 md:p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer relative"
                                         >
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex opacity-50 gap-2">
                                              <Tv size={16} className="text-gray-400" />
                                            </div>

                                            <div className="flex-1 flex items-center justify-center w-full">
                                              {/* Home Team (Right Side in RTL) */}
                                              <div className="flex flex-1 items-center justify-end gap-2 md:gap-3 min-w-0">
                                                 <span className="font-bold text-xs md:text-sm lg:text-base truncate text-right" dir="auto">{teams.home.name}</span>
                                                 <img src={teams.home.logo} className="w-6 h-6 md:w-8 md:h-8 object-contain shrink-0" alt="" />
                                              </div>

                                              {/* Score / Time (Center) */}
                                              <div className="flex flex-col items-center justify-center shrink-0 w-[80px] md:w-[100px] mx-1 md:mx-2">
                                                 {(match.status.short === 'NS' || match.status.short === 'PST') ? (
                                                    <div className="font-bold text-gray-400 text-xs md:text-sm bg-white/5 py-1 px-3 rounded-full">
                                                       {getStatusText({ ...match.status, date: match.date })}
                                                    </div>
                                                 ) : (
                                                    <div className="flex flex-col items-center">
                                                       <div className="font-black text-sm md:text-xl text-white tracking-widest bg-black/60 px-3 py-1 rounded">
                                                          {goals.home ?? 0} <span className="px-1 text-gray-600">-</span> {goals.away ?? 0}
                                                       </div>
                                                       {isLive && <div className="text-[10px] md:text-[11px] text-brand font-bold mt-1 animate-pulse">{match.status.elapsed}' مباشر</div>}
                                                    </div>
                                                 )}
                                              </div>

                                              {/* Away Team (Left Side in RTL) */}
                                              <div className="flex flex-1 items-center justify-start gap-2 md:gap-3 min-w-0">
                                                 <img src={teams.away.logo} className="w-6 h-6 md:w-8 md:h-8 object-contain shrink-0" alt="" />
                                                 <span className="font-bold text-xs md:text-sm lg:text-base truncate text-left" dir="auto">{teams.away.name}</span>
                                              </div>
                                            </div>
                                         </div>
                                      );
                                   })}
                                </div>
                             </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                 );
               })}
             </div>
           )}
        </div>
      </main>
    </div>
  );
}

