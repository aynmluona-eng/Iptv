import { useState, useEffect } from 'react';
import { XtreamCredentials, fetchXtreamApi } from '../lib/xtream';
import { LogOut, MonitorPlay, Film, Tv, Heart, Info, Clock, AlertCircle, RefreshCw, X, Search, Bell, Sparkles, User, ShieldCheck, Activity, Calendar, ArrowUpRight, Play, TrendingUp } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface DashboardProps {
  credentials: XtreamCredentials;
  onLogout: () => void;
}

export default function Dashboard({ credentials, onLogout }: DashboardProps) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [heroItem, setHeroItem] = useState<any>(null);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [liveHighlights, setLiveHighlights] = useState<any[]>([]);
  
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [data, moviesData, seriesData, liveData] = await Promise.all([
          fetchXtreamApi(credentials),
          fetchXtreamApi(credentials, 'get_vod_streams').catch(() => []),
          fetchXtreamApi(credentials, 'get_series').catch(() => []),
          fetchXtreamApi(credentials, 'get_live_streams').catch(() => [])
        ]);
        
        if (data.user_info) {
          setUserInfo(data.user_info);
          setServerInfo(data.server_info);
          
          let allContent: any[] = [];
          
          if (Array.isArray(moviesData)) {
            allContent = allContent.concat(
              moviesData.filter(m => m.stream_icon).map(m => ({
                id: m.stream_id,
                title: m.name,
                subtitle: m.rating ? `تقييم ${m.rating} • فيلم` : 'فيلم',
                img: m.stream_icon,
                type: 'movie',
                added: parseInt(m.added) || 0
              }))
            );
          }
          
          if (Array.isArray(seriesData)) {
            allContent = allContent.concat(
              seriesData.filter(s => s.cover).map(s => ({
                id: s.series_id,
                title: s.name,
                subtitle: s.rating ? `تقييم ${s.rating} • مسلسل` : 'مسلسل',
                img: s.cover,
                type: 'series',
                added: parseInt(s.last_modified || s.added) || 0
              }))
            );
          }
          
          // Sort by newly added
          allContent.sort((a, b) => b.added - a.added);
          
          const validHeroItems = allContent.filter(item => item.img && !item.img.includes('default') && !item.img.includes('empty'));
          if (validHeroItems.length > 0) {
              setHeroItem(validHeroItems[0]);
              setRecentItems(validHeroItems.slice(1, 10));
          } else if (allContent.length > 0) {
              setHeroItem(allContent[0]);
              setRecentItems(allContent.slice(1, 10));
          }

          // Pick some live highlights (e.g. Sports channels)
          if (Array.isArray(liveData)) {
              let highlights = liveData.filter(c => 
                 (c.category_name && (c.category_name.toLowerCase().includes('sport') || c.category_name.includes('رياضة'))) || 
                 (c.name && (c.name.toLowerCase().includes('bein') || c.name.toLowerCase().includes('ssc')))
              );
              if (highlights.length === 0) highlights = liveData.slice(0, 20); // Fallback
              
              setLiveHighlights(
                 highlights.sort(() => 0.5 - Math.random()).slice(0, 6).map(c => ({
                    id: c.stream_id,
                    title: c.name,
                    subtitle: c.category_name || 'بث مباشر',
                    img: c.stream_icon,
                    type: 'live'
                 }))
              );
          }

        } else {
          setError("بيانات غير صالحة من الخادم");
        }
      } catch (error: any) {
        console.error("Failed to load dashboard data", error);
        
        const isTimeout = error.response?.status === 504 || (error.message && error.message.toLowerCase().includes('timeout')) || (error.response?.data?.details && error.response.data.details.includes('timeout'));
        
        if (isTimeout) {
            setError("انتهى وقت الاتصال. قد يقوم مزود الخدمة بحظر اتصالات الخوادم السحابية (مما يمنع تطبيقنا من الوصول إليه) أو أن الخادم متوقف مؤقتاً.");
        } else {
            setError("تعذر الاتصال بالخادم. رسالة الخطأ: " + (error.response?.data?.details || error.message) + ". قد يقوم الخادم بحظر الاتصال لتجنب مشاركة الحسابات.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [credentials]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[100dvh] bg-dark">
         <div className="w-12 h-12 border-4 border-white/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] bg-dark text-white">
        <Navigation onLogout={onLogout} />
        <main className="flex-1 flex items-center justify-center md:pr-[260px] px-6">
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-sm max-w-lg text-center backdrop-blur-sm">
             <h2 className="text-xl font-bold mb-2">خطأ في الاتصال!</h2>
             <p className="mb-4">{error}</p>
             <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-sm transition-colors font-medium shadow-lg shadow-red-500/20">تسجيل الخروج</button>
          </div>
        </main>
      </div>
    );
  }

  const expDate = userInfo?.exp_date ? new Date(userInfo.exp_date * 1000).toLocaleDateString('ar-SA') : 'غير محدد';
  const isActive = userInfo?.status === 'Active';

  const savedProfile = localStorage.getItem('xtream_user_profile');
  const profileDetails = savedProfile ? JSON.parse(savedProfile) : null;
  const avatarUrl = profileDetails?.avatar;
  const displayName = profileDetails?.name || userInfo?.username;

  // Render horizontal list
  const HorizontalList = ({ title, items, icon: Icon, isLive = false }: any) => (
    <section className="mb-10 w-full">
      <div className="flex justify-between items-center mb-6 pl-2">
        <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-wide border-r-4 border-brand pr-3">
          {Icon && <Icon size={22} className="text-brand" />}
          {title}
        </h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-6 styled-scrollbar snap-x">
        {items.length > 0 ? items.map((item: any, idx: number) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * idx }}
            className={clsx("shrink-0 group cursor-pointer snap-start relative", isLive ? "w-[240px] md:w-[280px]" : "w-[160px] md:w-[200px]")}
            onClick={() => navigate(
               item.type === 'movie' ? `/movie/${item.id}` : 
               item.type === 'series' ? `/series/${item.id}` : 
               `/live/${item.id}`
            )}
          >
            <div className={clsx("relative bg-panel border border-white/5 group-hover:border-brand/40 transition-all duration-300 rounded-sm overflow-hidden mb-3", isLive ? "aspect-video" : "aspect-[2/3]")}>
              <img 
                src={item.img || "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&q=80&w=800"} 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&q=80&w=800";
                }}
                loading="lazy"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                alt={item.title} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
              
              {isLive && (
                 <div className="absolute top-3 right-3 bg-red-600 animate-pulse text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                    مباشر
                 </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                 <div className="w-10 h-10 rounded-full bg-brand text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mb-2 shadow-lg shadow-brand/20">
                    <Play size={18} fill="black" className="ml-1" />
                 </div>
              </div>
            </div>
            <h3 className="font-bold text-sm md:text-base text-white/90 group-hover:text-brand transition-colors line-clamp-1">{item.title}</h3>
            <p className="text-xs text-brand/70 font-medium tracking-wide truncate mt-1">{item.subtitle}</p>
          </motion.div>
        )) : (
          <div className="w-full py-12 flex items-center justify-center border border-white/5 rounded-sm bg-panel/30">
            <div className="w-8 h-8 border-2 border-white/20 border-t-brand rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="flex min-h-[100dvh] bg-dark text-white selection:bg-brand/30 font-sans">
      <Navigation onLogout={onLogout} />
      
      <main className="flex-1 md:pr-[260px] pb-24 md:pb-12 relative overflow-hidden bg-dark">
        {/* Dynamic Hero Banner */}
        <div className="relative w-full min-h-[65vh] md:min-h-[550px] flex flex-col justify-end pb-12 md:pb-16 pt-32 mb-12 border-b border-white/5">
          <div className="absolute inset-0 bg-black overflow-hidden">
             <motion.img 
                key={heroItem?.id || 'default'}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ duration: 1.5 }}
                src={heroItem?.img || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1920"} 
                className="w-full h-full object-cover blur-[4px] md:blur-none opacity-40 mix-blend-luminosity" 
                alt="Banner" 
             />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-dark/90 via-dark/40 to-transparent"></div>
          
          {/* Top Header inside hero */}
          <header className="absolute top-0 left-0 right-0 p-6 md:p-8 flex justify-between items-center z-50">
            <div className="flex items-center gap-3 relative z-50">
              <button 
                onClick={() => navigate('/settings')}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-panel flex items-center justify-center text-lg font-bold border border-white/10 hover:border-brand transition-all cursor-pointer text-white shadow-lg"
                title="إعدادات الحساب"
              >
                {avatarUrl ? (
                   <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover relative z-10" />
                ) : (
                   <span className="relative z-10">{displayName?.charAt(0)?.toUpperCase()}</span>
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-3 relative z-50">
              <button onClick={() => navigate('/movies')} className="w-10 h-10 rounded-sm bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 transition-all" title="بحث">
                <Search size={20} />
              </button>
              <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 rounded-sm bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 transition-all relative" title="الإشعارات">
                <Bell size={20} />
                {hasUnreadNotifications && <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border border-dark animate-pulse"></span>}
              </button>
            </div>
          </header>

          <div className="relative px-6 md:px-12 flex flex-col items-start z-20 mt-auto max-w-4xl">
             <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
               className="flex items-center gap-3 mb-4"
             >
               <span className="bg-white/10 text-brand backdrop-blur border border-white/10 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                 {heroItem?.type === 'movie' ? 'تمت إضافته مؤخراً - فيلم' : 'تمت إضافته مؤخراً - مسلسل'}
               </span>
             </motion.div>
             <motion.h2 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
               className="text-4xl md:text-[3.5rem] lg:text-[4.5rem] font-black mb-4 text-white uppercase leading-[1.1] md:leading-[1.2] drop-shadow-2xl"
             >
               {heroItem?.title || 'أحدث الإضافات'}
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
               className="text-base md:text-xl text-gray-300 max-w-2xl mb-8 line-clamp-3"
             >
               لا تفوت فرصة مشاهدة أحدث الأعمال الرائعة التي تمت إضافتها للتو. استمتع بتجربة سينمائية لا تُنسى بأعلى جودة عرض متوفرة الآن على منصتنا.
             </motion.p>
             <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
               className="flex flex-wrap gap-4"
             >
                <button 
                  onClick={() => {
                     if (heroItem) {
                       navigate(heroItem.type === 'movie' ? `/movie/${heroItem.id}` : `/series/${heroItem.id}`);
                     } else {
                       navigate('/movies');
                     }
                  }} 
                  className="bg-brand text-black px-8 py-4 rounded-sm font-black text-sm md:text-base hover:bg-white transition-colors flex items-center gap-2 shadow-[0_4px_20px_rgba(212,249,51,0.2)] md:min-w-[160px] justify-center hover:-translate-y-1"
                >
                   <Play fill="black" size={20} className="ml-1" /> شاهد الآن
                </button>
             </motion.div>
          </div>
        </div>

        {/* Content Rows */}
        <div className="px-6 md:px-12 relative z-30 flex flex-col gap-4">
            
            {/* Quick Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { title: 'البث المباشر', icon: Tv, link: '/live' },
                  { title: 'الأفلام', icon: Film, link: '/movies' },
                  { title: 'المسلسلات', icon: MonitorPlay, link: '/series' },
                  { title: 'المفضلة', icon: Heart, link: '/favorites' }
                ].map((cat, i) => (
                  <div key={i} onClick={() => navigate(cat.link)} className="bg-panel/40 backdrop-blur hover:bg-panel border border-white/5 hover:border-brand/30 rounded-sm p-4 md:p-6 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group hover:-translate-y-1">
                      <div className="text-gray-400 group-hover:text-brand transition-colors group-hover:scale-110">
                          <cat.icon size={28} strokeWidth={1.5} />
                      </div>
                      <h3 className="font-bold text-white text-xs md:text-sm uppercase tracking-wide">{cat.title}</h3>
                  </div>
                ))}
            </div>

            {/* Dynamic Event Rows */}
            <HorizontalList title="فعاليات رياضية ومباشرة" items={liveHighlights} icon={Activity} isLive={true} />
            
            <HorizontalList title="أحدث الإضافات" items={recentItems} icon={Sparkles} />
            
        </div>
      </main>

    </div>
  );
}
