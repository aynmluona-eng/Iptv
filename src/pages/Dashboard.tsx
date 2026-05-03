import { useState, useEffect } from 'react';
import { XtreamCredentials, fetchXtreamApi } from '../lib/xtream';
import { LogOut, MonitorPlay, Film, Tv, Heart, Info, Clock, AlertCircle, RefreshCw, X, Search, Bell, Sparkles, User, ShieldCheck, Activity, Calendar, ArrowUpRight, Play } from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [data, moviesData, seriesData] = await Promise.all([
          fetchXtreamApi(credentials),
          fetchXtreamApi(credentials, 'get_vod_streams').catch(() => []),
          fetchXtreamApi(credentials, 'get_series').catch(() => [])
        ]);
        if (data.user_info) {
          setUserInfo(data.user_info);
          setServerInfo(data.server_info);
          
          let combined: any[] = [];
          if (Array.isArray(moviesData)) {
            combined = combined.concat(
              moviesData.sort(() => 0.5 - Math.random()).slice(0, 4).map(m => ({
                id: m.stream_id,
                title: m.name,
                subtitle: m.rating ? `تقييم ${m.rating} • فيلم` : 'فيلم',
                img: m.stream_icon,
                type: 'movie'
              }))
            );
          }
          if (Array.isArray(seriesData)) {
            combined = combined.concat(
              seriesData.sort(() => 0.5 - Math.random()).slice(0, 4).map(s => ({
                id: s.series_id,
                title: s.name,
                subtitle: s.rating ? `تقييم ${s.rating} • مسلسل` : 'مسلسل',
                img: s.cover,
                type: 'series'
              }))
            );
          }
          setSuggestions(combined.sort(() => 0.5 - Math.random()).slice(0, 6));

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

  return (
    <div className="flex min-h-[100dvh] bg-dark text-white selection:bg-brand/30">
      <Navigation onLogout={onLogout} />
      
      <main className="flex-1 md:pr-[260px] pb-24 md:pb-12 relative overflow-hidden bg-dark">
        {/* Full-width Hero Banner overlaying top bar */}
        <div className="relative w-full min-h-[60vh] md:min-h-[500px] flex flex-col justify-end pb-12 md:pb-20 pt-32">
          <div className="absolute inset-0 bg-black">
              <img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" alt="Live TV" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-dark/80 via-transparent to-transparent"></div>
          
          {/* Top bar inside hero */}
          <header className="absolute top-0 left-0 right-0 p-6 md:p-8 flex justify-between items-center z-50">
            <div className="flex items-center gap-3 relative z-50">
              <button 
                onClick={() => navigate('/settings')}
                className="w-12 h-12 rounded-full overflow-hidden bg-brand flex items-center justify-center text-xl font-bold border-2 border-white/10 hover:scale-105 transition-transform cursor-pointer text-black shadow-lg"
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
              <button onClick={() => navigate('/movies')} className="w-10 h-10 rounded-sm bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" title="بحث">
                <Search size={20} />
              </button>
              <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 rounded-sm bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors relative" title="الإشعارات">
                <Bell size={20} />
                {hasUnreadNotifications && <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border-2 border-dark"></span>}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-14 left-0 w-[300px] bg-dark border border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-panel">
                        <h3 className="font-bold text-white">الإشعارات</h3>
                        <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer bg-white/5 border-r-2 border-brand">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-brand text-sm">تم إضافة فيلم جديد</h4>
                            <span className="text-[10px] text-gray-500">منذ ساعتين</span>
                          </div>
                          <p className="text-xs text-gray-400">فيلم الأكشن والمغامرة الجديد متاح الآن للمشاهدة.</p>
                        </div>
                        <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer border-r-2 border-transparent">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-white text-sm">تحديث النظام</h4>
                            <span className="text-[10px] text-gray-500">أمس</span>
                          </div>
                          <p className="text-xs text-gray-400">لقد تم تحسين سرعة المشغل وإضافة ميزات جديدة.</p>
                        </div>
                      </div>
                      <div className="p-3 text-center bg-panel hover:bg-white/10 transition-colors cursor-pointer" onClick={() => { setHasUnreadNotifications(false); setShowNotifications(false); }}>
                        <button className="text-xs font-bold text-gray-400 hover:text-white">تحديد الكل كمقروء</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </header>

          <div className="relative px-6 md:px-12 flex flex-col items-start z-20 mt-auto">
             <span className="bg-brand text-black font-bold px-3 py-1 text-sm uppercase mb-4 inline-block">مباشر الآن</span>
             <h2 className="text-4xl md:text-[3.5rem] font-black mb-4 text-white uppercase leading-[1.3] md:leading-[1.4]">دوري أبطال<br/>أوروبا</h2>
             <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">شاهد أمتع المباريات والمنافسات الرياضية على قنواتنا المتخصصة بأعلى جودة وثبات تام.</p>
             <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/live')} className="bg-brand text-black px-8 py-3.5 rounded-sm font-bold text-lg hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(212,249,51,0.3)]">
                   <Play fill="black" size={20} /> شاهد الآن
                </button>
                <button onClick={() => navigate('/movies')} className="bg-white/10 backdrop-blur border border-white/10 text-white px-8 py-3.5 rounded-sm font-bold text-lg hover:bg-white/20 transition-colors flex items-center gap-2">
                   <Film size={20} /> استكشف الأفلام
                </button>
             </div>
          </div>
        </div>

        {/* Content Rows */}
        <div className="px-6 md:px-12 -mt-8 relative z-30 flex flex-col gap-12">
            
            {/* Quick Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div onClick={() => navigate('/live')} className="bg-panel hover:bg-panel-hover border border-white/5 rounded-sm p-6 cursor-pointer transition-colors flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-white/5 rounded-sm flex items-center justify-center text-white group-hover:bg-brand group-hover:text-black transition-colors">
                        <Tv size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase text-sm md:text-base">البث المباشر</h3>
                    </div>
                </div>
                <div onClick={() => navigate('/series')} className="bg-panel hover:bg-panel-hover border border-white/5 rounded-sm p-6 cursor-pointer transition-colors flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-white/5 rounded-sm flex items-center justify-center text-white group-hover:bg-brand group-hover:text-black transition-colors">
                        <MonitorPlay size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase text-sm md:text-base">المسلسلات</h3>
                    </div>
                </div>
                <div onClick={() => navigate('/favorites')} className="bg-panel hover:bg-panel-hover border border-white/5 rounded-sm p-6 cursor-pointer transition-colors flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-white/5 rounded-sm flex items-center justify-center text-white group-hover:bg-brand group-hover:text-black transition-colors">
                        <Heart size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase text-sm md:text-base">المفضلة</h3>
                    </div>
                </div>
                <div onClick={() => navigate('/settings')} className="bg-panel hover:bg-panel-hover border border-white/5 rounded-sm p-6 cursor-pointer transition-colors flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-white/5 rounded-sm flex items-center justify-center text-white group-hover:bg-brand group-hover:text-black transition-colors">
                        <ShieldCheck size={24} className={isActive ? 'text-white group-hover:text-black' : 'text-red-500 group-hover:text-black'} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase text-sm md:text-base">الإعدادات</h3>
                    </div>
                </div>
            </div>

            {/* Recommendations Row */}
            <section className="mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 uppercase">
                  <Sparkles size={24} className="text-brand" />
                  اقتراحات لك
                </h2>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-6 styled-scrollbar snap-x">
                {suggestions.length > 0 ? suggestions.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (idx * 0.1) }}
                    className="w-[300px] md:w-[360px] shrink-0 group cursor-pointer snap-start relative"
                    onClick={() => navigate(item.type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`)}
                  >
                    <div className="relative aspect-video bg-panel border-2 border-transparent group-hover:border-brand transition-colors rounded-sm overflow-hidden">
                      <img 
                        src={item.img || "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&q=80&w=800"} 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&q=80&w=800";
                        }}
                        loading="lazy"
                        className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-500" 
                        alt={item.title} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/90 to-transparent"></div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-bold text-lg text-white uppercase mb-1 truncate">{item.title}</h3>
                        <p className="text-xs text-brand font-medium tracking-wide truncate">{item.subtitle}</p>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="w-full py-12 flex items-center justify-center border border-white/5 rounded-sm">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-brand rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </section>
            
        </div>
      </main>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 p-4 md:p-0"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-auto md:w-[450px] bg-dark border border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-sm bg-brand flex items-center justify-center text-3xl font-black text-black">
                      {userInfo?.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{userInfo?.username}</h2>
                      <div className={clsx(
                        "inline-flex items-center gap-1.5 px-2 bg-black py-1 rounded-sm text-xs font-bold uppercase",
                        isActive ? "text-brand" : "text-red-500"
                      )}>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", isActive ? "bg-brand animate-pulse" : "bg-red-500")}></span>
                        {isActive ? 'نشط' : 'منتهي'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowProfile(false)} className="bg-white/5 hover:bg-white/10 p-2 rounded-sm text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="bg-panel border border-white/5 rounded-sm p-5 mb-6">
                  <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} /> حالة الاشتراك
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark p-4 border border-white/5 rounded-sm text-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2"><Calendar size={14} /></div>
                      <span className="text-xs text-gray-500 mb-1">تاريخ الانتهاء</span>
                      <span className="font-mono text-white font-bold">{expDate}</span>
                    </div>
                    <div className="bg-dark p-4 border border-white/5 rounded-sm text-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2"><User size={14} /></div>
                      <span className="text-xs text-gray-500 mb-1">متصل الآن</span>
                      <span className="font-mono text-white font-bold">{userInfo?.active_cons || '0'}</span>
                    </div>
                  </div>
                </div>

                {serverInfo && (
                  <>
                    <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Tv size={14} /> معلومات الاتصال
                    </h3>
                    <div className="space-y-3 mb-8">
                      <div className="bg-panel border border-white/5 p-4 rounded-sm">
                        <div className="text-xs text-gray-300 mb-2 font-bold">رابط الخادم</div>
                        <div className="font-mono text-white text-sm dir-ltr break-all bg-white/5 p-3 rounded-sm border border-white/5">{serverInfo.url || credentials.serverUrl}</div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 bg-dark border border-white/5 p-4 rounded-sm text-center">
                          <div className="text-xs text-gray-500 mb-1">المنفذ</div>
                          <div className="font-mono text-white font-bold">{serverInfo.port}</div>
                        </div>
                        <div className="flex-1 bg-dark border border-white/5 p-4 rounded-sm text-center">
                          <div className="text-xs text-gray-500 mb-1">النوع</div>
                          <div className="font-mono text-white font-bold">{serverInfo.https_port ? 'HTTPS' : 'HTTP'}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black rounded-sm font-bold uppercase transition-all mt-2 border border-red-500/20 group"
                >
                  <LogOut size={18} className="rotate-180" />
                  تسجيل الخروج من الحساب
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
