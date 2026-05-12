import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { getFixtureDetails } from '../services/sports';
import { ChevronRight, ArrowLeft, Clock, MapPin, MonitorPlay, Activity, Zap, Play, Calendar, Tv, Cloud, Thermometer, Bell, Star, MoreVertical } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

export default function MatchDetails({ credentials, onLogout }: { credentials: any, onLogout: () => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'preview' | 'events' | 'lineups' | 'h2h'>('preview');
  const [h2hData, setH2hData] = useState<any[]>([]);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await getFixtureDetails(parseInt(id));
        setDetails(data);
        
        if (data?.teams?.home?.id && data?.teams?.away?.id) {
           import('../services/sports').then(module => {
              module.getH2H(`${data.teams.home.id}-${data.teams.away.id}`)
                .then(res => setH2hData(res))
                .catch(e => console.error(e));
           });
        }
      } catch (err: any) {
         setError('تعذر جلب تفاصيل المباراة');
      } finally {
         setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[100dvh] bg-[#0A0A0A]">
         <div className="w-10 h-10 border-4 border-white/10 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex min-h-[100dvh] bg-[#0A0A0A] text-white">
        <Navigation onLogout={onLogout} />
        <main className="flex-1 flex flex-col items-center justify-center md:pr-[260px] px-6">
          <div className="text-gray-400 mb-4">{error || 'تفاصيل غير متوفرة.'}</div>
          <button onClick={() => navigate('/sports')} className="bg-[#181818] border border-white/10 hover:border-brand hover:text-brand transition-colors px-6 py-2 rounded font-bold">العودة للرياضة</button>
        </main>
      </div>
    );
  }

  const { fixture, league, teams, goals, score, events, lineups, statistics } = details;

  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(fixture?.status?.short);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture?.status?.short);
  const isFuture = ['NS', 'PST', 'TBD'].includes(fixture?.status?.short);

  // Generate some dummy insights for UI purposes
  const dummyInsights = [
      `آخر 5 مباريات لـ ${teams?.home?.name} على أرضه شهدت معدل 2.8 في المباراة`,
      `${teams?.home?.name} فاز في 12 من أصل 19 مواجهة تاريخية أمام ${teams?.away?.name}`,
      `متوسط أهداف بين الفريقين 3.7 هدفاً في المباراة`
  ];

  return (
    <div className="flex min-h-[100dvh] bg-[#0A0A0A] text-white selection:bg-brand/30 font-sans">
      <Navigation onLogout={onLogout} />
      
      <main className="flex-1 md:pr-[260px] relative overflow-hidden bg-[#0A0A0A] flex flex-col h-[100dvh]">
        
        {/* Top Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-[#121212]">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/sports')} className="text-gray-400 hover:text-white transition-colors">
               <ArrowLeft size={24} />
             </button>
          </div>
          <div className="flex flex-col items-center justify-center">
             <div className="flex items-center gap-2 mb-1">
                <img src={league?.logo} className="w-4 h-4 object-contain brightness-200" alt="" />
                <span className="text-xs text-gray-400 tracking-wider font-medium">{league?.name}</span>
             </div>
             <div className="text-sm font-bold text-gray-200">
                {isFuture ? new Date(fixture.date).toLocaleDateString('ar-SA') : isLive ? <span className="text-brand flex items-center gap-1 animate-pulse"><span className="w-2 h-2 rounded-full bg-brand"></span> مباشر</span> : 'انتهت'}
             </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400 border-r border-white/10 pr-4">
             <Star size={20} className="hover:text-amber-400 transition-colors cursor-pointer" />
             <Bell size={20} className="hover:text-white transition-colors cursor-pointer" />
             <MoreVertical size={20} className="hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>

        {/* Hero Scoreboard */}
        <div className="px-4 py-6 bg-[#121212] border-b border-white/5">
           <div className="flex items-center justify-between max-w-lg mx-auto">
              
              {/* Home */}
              <div className="flex flex-col items-center w-[35%] gap-3">
                 <img src={teams?.home?.logo} alt={teams?.home?.name} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                 <h2 className="text-sm md:text-base font-bold text-center line-clamp-2 leading-tight">{teams?.home?.name}</h2>
              </div>

              {/* Score / Time */}
              <div className="flex flex-col items-center w-[30%]">
                 {isFuture ? (
                    <div className="text-2xl md:text-3xl font-mono text-center text-gray-400">
                       {new Date(fixture.date).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                 ) : (
                    <>
                       <div className="text-4xl md:text-5xl font-black font-mono tracking-wider flex items-center justify-center gap-2">
                          <span className={goals?.home > goals?.away ? 'text-white' : 'text-gray-300'}>{goals?.home ?? 0}</span>
                          <span className="text-gray-600 font-normal">:</span>
                          <span className={goals?.away > goals?.home ? 'text-white' : 'text-gray-300'}>{goals?.away ?? 0}</span>
                       </div>
                       {isLive && fixture?.status?.elapsed && (
                          <div className="text-brand font-bold mt-2 text-sm">
                             {fixture.status.elapsed}:00
                          </div>
                       )}
                    </>
                 )}
              </div>

              {/* Away */}
              <div className="flex flex-col items-center w-[35%] gap-3">
                 <img src={teams?.away?.logo} alt={teams?.away?.name} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                 <h2 className="text-sm md:text-base font-bold text-center line-clamp-2 leading-tight">{teams?.away?.name}</h2>
              </div>
           </div>
        </div>

        {/* Tabs Group */}
        <div className="bg-[#121212] border-b border-white/5 flex items-center overflow-x-auto styled-scrollbar hide-scrollbar px-2">
            <div className="flex w-full md:justify-center gap-2">
                {[
                   { id: 'preview', label: 'معاينة' },
                   { id: 'lineups', label: 'التشكيلة' },
                   { id: 'events', label: 'الأحداث' },
                   { id: 'h2h', label: 'المواجهات' }
                ].map(tab => (
                   <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={clsx(
                         "px-4 md:px-6 py-4 text-sm md:text-base font-bold whitespace-nowrap transition-colors relative flex-1 text-center md:flex-none",
                         activeTab === tab.id ? "text-brand" : "text-gray-400 hover:text-gray-200"
                      )}
                   >
                      {tab.label}
                      {activeTab === tab.id && (
                         <motion.div layoutId="activetabindicator" className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-brand" />
                      )}
                   </button>
                ))}
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto styled-scrollbar bg-[#0A0A0A] p-4 md:p-8 pb-32 md:pb-12 space-y-4">
            <div className="max-w-3xl mx-auto space-y-4">
               
               {/* -------------------- PREVIEW TAB -------------------- */}
               {activeTab === 'preview' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                     
                     {/* Smart Insights */}
                     <div className="bg-[#181818] rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 font-bold flex items-center gap-2">
                           <Zap size={16} className="text-brand" /> تحليلات
                        </div>
                        <div className="p-4 space-y-3">
                           {dummyInsights.map((insight, idx) => (
                              <div key={idx} className="bg-[#202020] p-3 rounded-lg border-r-2 border-brand text-sm md:text-base text-gray-200 font-medium">
                                 {insight}
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Voting Widget / Odds Simulation */}
                     <div className="bg-[#181818] rounded-xl border border-white/5 p-4 flex flex-col items-center">
                        <h4 className="font-bold mb-4 text-sm text-gray-400">من سيربح؟</h4>
                        <div className="flex gap-2 w-full">
                           <button className="flex-1 bg-[#202020] hover:bg-[#2A2A2A] transition-colors rounded-lg py-3 flex items-center justify-center gap-2 font-bold border border-white/5 hover:border-white/10">
                              <img src={teams?.home?.logo} className="w-5 h-5 object-contain" />
                              <span className="text-white">1</span>
                           </button>
                           <button className="flex-1 bg-[#202020] hover:bg-[#2A2A2A] transition-colors rounded-lg py-3 flex items-center justify-center font-bold text-gray-400 border border-white/5 hover:border-white/10">
                              تعادل (X)
                           </button>
                           <button className="flex-1 bg-[#202020] hover:bg-[#2A2A2A] transition-colors rounded-lg py-3 flex items-center justify-center gap-2 font-bold border border-white/5 hover:border-white/10">
                              <img src={teams?.away?.logo} className="w-5 h-5 object-contain" />
                              <span className="text-white">2</span>
                           </button>
                        </div>
                     </div>

                     {/* Match Info Block (Stadium & Weather) */}
                     <div className="bg-[#181818] rounded-xl border border-white/5">
                        <div className="p-4 flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-[#202020] flex items-center justify-center text-brand">
                              <MapPin size={20} />
                           </div>
                           <div className="flex-1">
                              <div className="font-bold text-gray-200">{fixture.venue?.name || 'غير متوفر'}</div>
                              <div className="text-xs text-gray-500">{fixture.venue?.city}</div>
                           </div>
                        </div>
                        <div className="border-t border-white/5 p-4 flex justify-between items-center bg-[#151515]">
                           <div className="flex items-center gap-2 text-sm text-gray-400">
                             <Thermometer size={16} /> أجواء المباراة
                           </div>
                           <div className="flex items-center gap-2 text-sm font-bold text-white">
                             <Cloud size={16} className="text-gray-400" /> غائم
                           </div>
                        </div>
                     </div>

                     {/* Broadcasters */}
                     <div className="bg-[#181818] rounded-xl border border-white/5 p-4">
                        <h4 className="font-bold mb-4 text-sm text-gray-400 flex items-center gap-2">
                           <Tv size={16} /> القنوات الناقلة
                        </h4>
                        <div className="flex flex-col gap-2">
                           <button 
                             onClick={() => navigate(`/live?search=bein`)} 
                             className="w-full bg-[#202020] hover:bg-[#2A2A2A] border border-white/5 p-3 rounded-lg flex items-center justify-between transition-colors group"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center text-brand">
                                    <Tv size={16} />
                                 </div>
                                 <span className="text-sm font-bold text-gray-200 group-hover:text-white">قنوات beIN Sports</span>
                              </div>
                              <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
                           </button>
                           
                           <button 
                             onClick={() => navigate(`/live?search=ssc`)} 
                             className="w-full bg-[#202020] hover:bg-[#2A2A2A] border border-white/5 p-3 rounded-lg flex items-center justify-between transition-colors group"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center text-brand">
                                    <Tv size={16} />
                                 </div>
                                 <span className="text-sm font-bold text-gray-200 group-hover:text-white">قنوات SSC الرياضية</span>
                              </div>
                              <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
                           </button>
                        </div>
                     </div>

                  </motion.div>
               )}

               {/* -------------------- LINEUPS TAB -------------------- */}
               {activeTab === 'lineups' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                     <div className="bg-[#181818] border border-white/5 rounded-xl p-4 text-center">
                        <h2 className="text-brand font-bold uppercase tracking-wider text-sm">
                           {isFuture ? 'التشكيلة المتوقعة' : 'التشكيلة الرسمية'}
                        </h2>
                        {isFuture && <p className="text-xs text-gray-500 mt-1">قد تتغير التشكيلة قبل بداية المباراة</p>}
                     </div>

                     {lineups && lineups.length === 2 ? lineups.map((lineup: any, idx: number) => {
                        // Parse grid for pitch view
                        const rows: Record<string, any[]> = {};
                        lineup.startXI.forEach((p: any) => {
                           const g = p.player.grid || "0:0"; // format e.g. "1:1", "2:4" (row:col)
                           const row = g.split(':')[0];
                           if (!rows[row]) rows[row] = [];
                           rows[row].push(p);
                        });
                        const sortedRows = Object.keys(rows).sort((a,b) => parseInt(a) - parseInt(b)).map(k => rows[k]);
                        const bgPitchColor = idx === 0 ? "bg-emerald-900/40" : "bg-blue-900/40"; // differentiate home/away

                        return (
                           <div key={idx} className="bg-[#181818] border border-white/5 rounded-xl p-4">
                              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/5">
                                 <img src={lineup.team.logo} className="w-8 h-8" />
                                 <div className="flex-1">
                                    <h3 className="font-bold text-sm">{lineup.team.name}</h3>
                                    <div className="text-xs text-gray-500">المدرب: {lineup.coach?.name}</div>
                                 </div>
                                 <div className="text-sm bg-[#202020] px-3 py-1 rounded-full text-brand font-mono font-bold">
                                    {lineup.formation}
                                 </div>
                              </div>

                              {/* Visual Pitch */}
                              <div className={clsx("relative w-full aspect-[4/5] max-w-sm mx-auto rounded-lg overflow-hidden border border-white/10 shadow-inner flex flex-col justify-between py-6 mb-6", bgPitchColor)}>
                                 {/* Pitch markings */}
                                 <div className="absolute inset-0 border border-white/30 m-3 rounded-sm pointer-events-none"></div>
                                 <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border border-t-0 border-white/30 pointer-events-none"></div>
                                 <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border border-b-0 border-white/30 pointer-events-none"></div>
                                 <div className="absolute top-1/2 left-3 right-3 border-t border-white/30 pointer-events-none"></div>
                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/30 pointer-events-none"></div>

                                 <div className="relative z-10 h-full flex flex-col items-center justify-between w-full">
                                    {sortedRows.reverse().map((rowPlayers, rIdx) => (
                                       <div key={rIdx} className="flex justify-around items-center w-full px-2" style={{ height: `${100 / sortedRows.length}%` }}>
                                          {rowPlayers.sort((a,b) => {
                                             const ca = parseInt(a.player.grid?.split(':')[1] || "0");
                                             const cb = parseInt(b.player.grid?.split(':')[1] || "0");
                                             return ca - cb;
                                          }).map((p, pIdx) => (
                                             <div key={pIdx} className="flex flex-col items-center">
                                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#1A1A1A] border-2 border-brand flex items-center justify-center font-bold text-[10px] md:text-xs text-white shadow-lg">
                                                   {p.player.number}
                                                </div>
                                                <div className="bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-white mt-1 max-w-[60px] truncate border border-white/10 backdrop-blur-sm">
                                                   {p.player.name.split(' ').pop()}
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <div>
                                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">الاحتياط</h4>
                                    <div className="space-y-1">
                                       {lineup.substitutes.map((player: any, i: number) => (
                                          <div key={i} className="flex items-center gap-3 bg-[#202020]/50 border border-white/5 p-2 rounded-lg">
                                             <div className="w-7 h-7 rounded-sm bg-[#121212] flex items-center justify-center font-bold text-[10px] text-gray-500 font-mono">
                                                {player.player.number}
                                             </div>
                                             <div className="font-medium text-sm text-gray-400">{player.player.name}</div>
                                             <div className="mr-auto text-[10px] text-gray-600 uppercase bg-black/10 px-2 py-0.5 rounded">{player.player.pos}</div>
                                          </div>
                                       ))}
                                   </div>
                                 </div>
                              </div>
                           </div>
                        );
                     }) : (
                        <div className="text-center py-12 text-gray-500 bg-[#181818] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2">
                           <Activity size={32} className="text-gray-600 mb-2" />
                           <p>التشكيلات غير متوفرة حالياً.</p>
                           {isFuture && <p className="text-xs text-gray-600">سيتم الإعلان عن التشكيلة المتوقعة أو الرسمية قريباً</p>}
                        </div>
                     )}
                  </motion.div>
               )}

               {/* -------------------- EVENTS & STATS TAB -------------------- */}
               {activeTab === 'events' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                     
                     {/* Timeline */}
                     <div className="bg-[#181818] border border-white/5 rounded-xl p-4 md:p-6">
                        <h3 className="font-bold text-sm text-gray-400 mb-6 uppercase tracking-wide">الأحداث البارزة</h3>
                        {events && events.length > 0 ? (
                          <div className="relative border-r-2 border-[#2A2A2A] pr-4 space-y-4">
                             {events.map((evt: any, i: number) => (
                                <div key={i} className="relative flex items-start gap-4">
                                   <div className="absolute -right-[23px] bg-[#121212] border-2 border-brand w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white z-10 pt-[1px]">
                                      {evt.time.elapsed}'
                                   </div>
                                   <div className="flex-1 bg-[#202020] p-3 rounded-lg flex items-center gap-3">
                                      {evt.team.logo && <img src={evt.team.logo} className="w-6 h-6 object-contain" />}
                                      <div>
                                         <div className="text-sm font-medium text-white leading-none mb-1">{evt.player.name}</div>
                                         <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                            {evt.type === 'Goal' && <span className="text-emerald-400 font-bold">⚽ هدف {evt.detail === 'Penalty' ? '(ضربة جزاء)' : ''}</span>}
                                            {evt.type === 'Card' && evt.detail.includes('Yellow') && <span className="text-yellow-400 font-bold">🟨 بطاقة صفراء</span>}
                                            {evt.type === 'Card' && evt.detail.includes('Red') && <span className="text-red-500 font-bold">🟥 بطاقة حمراء</span>}
                                            {evt.type === 'subst' && <span className="text-blue-400 font-bold">🔄 تبديل خروج: {evt.detail}</span>}
                                            {evt.assist?.name && <span className="text-gray-500 mr-2">(تمريرة: {evt.assist.name})</span>}
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-center py-4 text-sm pl-4 pr-1">لا توجد أحداث مسجلة.</div>
                        )}
                     </div>

                     {/* Stats comparison */}
                     <div className="bg-[#181818] border border-white/5 rounded-xl p-4 md:p-6">
                        <div className="flex justify-between items-center mb-6">
                           <img src={teams.home.logo} className="w-6 h-6" />
                           <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wide">الإحصائيات</h3>
                           <img src={teams.away.logo} className="w-6 h-6" />
                        </div>

                        {statistics && statistics.length === 2 ? (
                           <div className="space-y-4">
                              {statistics[0].statistics.map((stat: any, idx: number) => {
                                 const homeValRaw = stat.value;
                                 const awayValRaw = statistics[1].statistics[idx].value;
                                 
                                 const parseRawValue = (val: any) => {
                                    if (val === null) return 0;
                                    if (typeof val === 'string' && val.includes('%')) return parseInt(val);
                                    return Number(val);
                                 };

                                 const homeVal = parseRawValue(homeValRaw);
                                 const awayVal = parseRawValue(awayValRaw);
                                 
                                 const total = (homeVal + awayVal) || 1;
                                 const homePct = (homeVal / total) * 100;
                                 const awayPct = (awayVal / total) * 100;

                                 const isPossession = stat.type.toLowerCase().includes('possession');

                                 return (
                                   <div key={idx}>
                                      <div className="flex justify-between text-xs font-bold mb-1.5">
                                         <span className={homeVal >= awayVal && homeVal !== 0 ? 'text-white' : 'text-gray-500'}>
                                            {homeValRaw ?? 0}{isPossession && homeVal > 0 ? '%' : ''}
                                         </span>
                                         <span className="text-gray-400 text-[10px] tracking-wider uppercase text-center flex-1">{stat.type}</span>
                                         <span className={awayVal >= homeVal && awayVal !== 0 ? 'text-white' : 'text-gray-500'}>
                                            {awayValRaw ?? 0}{isPossession && awayVal > 0 ? '%' : ''}
                                         </span>
                                      </div>
                                      <div className="flex w-full h-1.5 bg-[#202020] rounded-full overflow-hidden">
                                         <div className="h-full bg-brand" style={{ width: `${homePct}%` }}></div>
                                         <div className="h-full bg-[#121212] w-0.5"></div>
                                         <div className="h-full bg-blue-500" style={{ width: `${awayPct}%` }}></div>
                                      </div>
                                   </div>
                                 );
                              })}
                           </div>
                        ) : (
                           <div className="text-center py-4 text-sm text-gray-500">الإحصائيات غير متوفرة بعد.</div>
                        )}
                     </div>

                  </motion.div>
               )}

               {/* -------------------- H2H TAB -------------------- */}
               {activeTab === 'h2h' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                     <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
                        <h3 className="font-bold text-sm text-gray-400 mb-4 uppercase tracking-wide">
                           المواجهات المباشرة السابقة
                        </h3>
                        
                        {h2hData && h2hData.length > 0 ? (
                           <div className="space-y-3">
                              {h2hData.slice(0, 5).map((match: any, idx: number) => {
                                 const hHome = match.teams.home;
                                 const hAway = match.teams.away;
                                 const sHome = match.goals.home ?? '-';
                                 const sAway = match.goals.away ?? '-';
                                 return (
                                    <div key={idx} className="bg-[#202020] border border-white/5 p-3 rounded-lg hover:border-brand/30 transition-colors">
                                       <div className="text-[10px] text-gray-500 mb-2 flex justify-between">
                                          <span>{new Date(match.fixture.date).toLocaleDateString('ar-SA')}</span>
                                          <span className="truncate max-w-[50%]">{match.league.name}</span>
                                       </div>
                                       <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-2 w-2/5 justify-end">
                                             <span className="text-xs font-bold text-gray-300 truncate">{hHome.name}</span>
                                             <img src={hHome.logo} className="w-5 h-5 rounded-full bg-white/10" />
                                          </div>
                                          <div className="font-bold text-sm bg-[#121212] px-2 py-0.5 rounded text-white tracking-widest min-w-[50px] text-center">
                                             {sHome} - {sAway}
                                          </div>
                                          <div className="flex items-center gap-2 w-2/5 justify-start">
                                             <img src={hAway.logo} className="w-5 h-5 rounded-full bg-white/10" />
                                             <span className="text-xs font-bold text-gray-300 truncate">{hAway.name}</span>
                                          </div>
                                       </div>
                                    </div>
                                 )
                              })}
                           </div>
                        ) : (
                           <div className="text-center py-8 text-sm text-gray-500">لا توجد مواجهات سابقة مسجلة.</div>
                        )}
                     </div>
                  </motion.div>
               )}

            </div>
        </div>

      </main>
    </div>
  );
}
