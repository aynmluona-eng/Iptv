import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Activity, Trophy, AlertCircle, RefreshCw, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { getTodaysFixtures, hasSportsApiConfigured } from '../services/sports';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { MatchCard } from '../components/MatchCard';

export default function Sports({ onLogout }: { onLogout: () => void }) {
  const [fixturesByLeague, setFixturesByLeague] = useState<any[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiMissing, setApiMissing] = useState(false);
  
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

      // Extract some featured matches (Top league + live or upcoming today)
      let featured: any[] = [];
      if (offset === 0) {
         featured = data.filter((m: any) => TOP_LEAGUES.includes(m.league.id));
         featured.sort((a: any, b: any) => getStatusPriority(a.fixture.status.short) - getStatusPriority(b.fixture.status.short));
         featured = featured.slice(0, 5); // Take top 5
      }
      setFeaturedMatches(featured);

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
    <div className="flex min-h-[100vh] bg-black text-white selection:bg-brand/30 font-sans w-full overflow-x-hidden">
      <Navigation onLogout={onLogout} />
      
      <main className="flex-1 md:pr-[260px] pb-32 md:pb-12 relative bg-[#0A0A0A] w-full max-w-[100vw] overflow-x-hidden">
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

        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 mt-2">
           
           {/* Featured Matches Slider (Modern Style) */}
           {!loading && !apiMissing && !error && featuredMatches.length > 0 && dateOffset === 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                   <Activity className="text-brand" size={24} /> أبرز المباريات
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar styled-scrollbar">
                   {featuredMatches.map((match: any, idx: number) => (
                      <div key={idx} className="min-w-[280px] sm:min-w-[340px] snap-center">
                         <MatchCard item={match} getStatusText={getStatusText} featured={true} />
                      </div>
                   ))}
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

           {/* All Leagues List */}
           {!loading && !apiMissing && fixturesByLeague.length > 0 && (
             <div className="space-y-4">
               {fixturesByLeague.map((group: any) => {
                 const isCollapsed = collapsedLeagues[group.league.id];
                 
                 return (
                    <div key={group.league.id} className="bg-[#121212] border border-white/5 rounded-[16px] overflow-hidden">
                       <button 
                         onClick={() => toggleLeague(group.league.id)}
                         className="w-full bg-[#161616] p-4 flex items-center justify-between hover:bg-[#1f1f1f] transition-colors"
                       >
                          <div className="flex items-center gap-3">
                             <img src={group.league.logo} alt={group.league.name} className="w-6 h-6 object-contain" />
                             <span className="font-bold text-white text-sm md:text-base">{group.league.country} - {group.league.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             {group.league.flag && <img src={group.league.flag} className="w-6 h-4 object-cover rounded-[2px] opacity-80" />}
                             <span className="text-gray-500">
                                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                             </span>
                          </div>
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
                                   {group.fixtures.map((item: any) => (
                                       <MatchCard key={item.fixture.id} item={item} getStatusText={getStatusText} />
                                   ))}
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

