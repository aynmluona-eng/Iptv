import React, { useEffect, useState, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { XtreamCredentials, fetchXtreamApi } from '../lib/xtream';
import Navigation from '../components/Navigation';
import ImageWithFallback from '../components/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Search, Tv, Clock, ArrowLeft, ArrowLeftCircle, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function Live({ credentials }: { credentials: XtreamCredentials }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [channelsByCategory, setChannelsByCategory] = useState<Record<string, any[]>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(24);
  
  const { ref: observerRef, inView } = useInView({
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView) {
      setVisibleCount(prev => prev + 24);
    }
  }, [inView]);

  useEffect(() => {
    setVisibleCount(24);
  }, [activeCategory, search]);

  const navigate = useNavigate();

  // Load favorites from local storage
  useEffect(() => {
    const storedFavs = localStorage.getItem('xtream_favorites_live');
    if (storedFavs) {
      setFavorites(new Set(JSON.parse(storedFavs)));
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newFavs = new Set(favorites);
    if (newFavs.has(id)) {
      newFavs.delete(id);
    } else {
      newFavs.add(id);
    }
    setFavorites(newFavs);
    localStorage.setItem('xtream_favorites_live', JSON.stringify(Array.from(newFavs)));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, chs] = await Promise.all([
          fetchXtreamApi(credentials, 'get_live_categories').catch(() => []),
          fetchXtreamApi(credentials, 'get_live_streams').catch(() => [])
        ]);
        
        if (Array.isArray(cats)) {
          setCategories(cats);
        }
        
        if (Array.isArray(chs)) {
          setChannels(chs);
          const grouped: Record<string, any[]> = {};
          chs.forEach((c: any) => {
            if (!grouped[c.category_id]) grouped[c.category_id] = [];
            grouped[c.category_id].push(c);
          });
          setChannelsByCategory(grouped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [credentials]);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory ? c.category_id === activeCategory : true;
      return matchSearch && matchCategory;
    });
  }, [channels, search, activeCategory]);

  const favoriteChannelsList = useMemo(() => {
    return channels.filter(c => favorites.has(String(c.stream_id)));
  }, [channels, favorites]);
  
  const validCategories = useMemo(() => {
    return categories.filter(c => channelsByCategory[c.category_id]?.length > 0);
  }, [categories, channelsByCategory]);

  return (
    <div className="flex min-h-[100dvh] bg-dark text-white">
      <Navigation />
      
      <main className="flex-1 md:pr-[260px] px-4 md:px-8 pt-8 md:pt-12 pb-24 md:pb-12 flex flex-col h-[100dvh] overflow-hidden">
        
        {/* Mobile Header */}
        <header className="mb-6 shrink-0 md:flex md:justify-between md:items-center">
          <div className="flex justify-between items-center mb-4 md:mb-0">
             <div className="flex items-center gap-3">
               <button onClick={() => activeCategory ? setActiveCategory(null) : navigate('/')} className="w-10 h-10 bg-white/5 hover:bg-brand hover:text-black rounded-sm flex items-center justify-center transition-colors">
                 <ArrowLeft size={24} />
               </button>
               <h1 className="text-2xl font-bold tracking-tight">
                 {activeCategory 
                   ? `قنوات / ${categories.find(c => c.category_id === activeCategory)?.category_name || ''}` 
                   : 'القنوات المباشرة'
                 }
               </h1>
             </div>
             <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden text-gray-400 hover:text-white transition-colors" title="بحث">
               <Search size={22} />
             </button>
          </div>
          
          <div className={clsx("relative w-full md:w-auto md:block", showMobileSearch ? "block" : "hidden")}>
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن القنوات..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-panel border border-white/5 rounded-sm pr-12 pl-6 py-3 text-sm text-white focus:outline-none focus:border-brand w-full md:w-[320px] transition-all"
            />
          </div>
        </header>

        {/* Categories Pills */}
        <div className="shrink-0 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
           <div className="flex overflow-x-auto gap-3 pb-2 styled-scrollbar">
             {loading ? (
               <div className="text-sm text-gray-500 py-2">جاري التحميل...</div>
             ) : (
               <>
                 <button
                   onClick={() => setActiveCategory(null)}
                   className={clsx(
                     "whitespace-nowrap px-6 py-2 rounded-sm text-sm font-bold transition-all shrink-0",
                     activeCategory === null 
                       ? "bg-brand text-black shadow-lg" 
                       : "bg-panel text-gray-400 hover:bg-white/10 hover:text-white border border-white/5"
                   )}
                 >
                   الرئيسية
                 </button>
                 {validCategories.map(cat => (
                   <button
                     key={cat.category_id}
                     onClick={() => setActiveCategory(cat.category_id)}
                     className={clsx(
                       "whitespace-nowrap px-6 py-2 rounded-sm text-sm font-bold transition-all shrink-0",
                       activeCategory === cat.category_id 
                         ? "bg-brand text-black shadow-lg" 
                         : "bg-panel text-gray-400 hover:bg-white/10 hover:text-white border border-white/5"
                     )}
                   >
                     {cat.category_name}
                   </button>
                 ))}
               </>
             )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-6 styled-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full">
               <div className="w-10 h-10 border-4 border-white/10 border-t-brand rounded-full animate-spin mb-4"></div>
               <p className="text-gray-400">جاري تحميل القنوات...</p>
             </div>
          ) : search || activeCategory ? (
            /* Search Results or Category Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
              {filteredChannels.slice(0, visibleCount).map((stream, idx) => {
                const isFav = favorites.has(String(stream.stream_id));
                return (
                  <motion.div
                    key={stream.stream_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.01, 0.1) }}
                    className="group cursor-pointer transition-all flex flex-col items-center justify-center text-center p-4 bg-panel border border-white/5 rounded-sm hover:border-brand"
                    onClick={() => navigate(`/live/${stream.stream_id}`)}
                  >
                    <div className="w-20 h-20 bg-black/40 rounded-full p-2 flex items-center justify-center shrink-0 border border-white/5 overflow-hidden mb-3 group-hover:scale-110 transition-transform duration-300">
                      <ImageWithFallback 
                        src={stream.stream_icon} 
                        alt={stream.name} 
                        type="live" 
                        loading="lazy"
                        className="w-full h-full object-contain filter" 
                      />
                    </div>
                    <h3 className="text-white text-sm font-bold line-clamp-1 group-hover:text-brand transition-colors w-full px-2">
                      {stream.name}
                    </h3>
                    <button 
                       onClick={(e) => toggleFavorite(e, String(stream.stream_id))}
                       className="absolute top-2 left-2 p-1.5 transition-colors group-hover:bg-black/40 rounded-full z-10"
                    >
                       <Heart size={16} className={clsx(isFav ? "fill-red-500 text-red-500" : "text-gray-500")} />
                    </button>
                  </motion.div>
                );
              })}
              {filteredChannels.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                   <Tv size={48} className="mb-4 opacity-20" />
                   <p>لا توجد نتائج</p>
                 </div>
              )}
              {visibleCount < filteredChannels.length && (
                <div ref={observerRef} className="col-span-full h-20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-brand animate-spin"></div>
                </div>
              )}
            </div>
          ) : (
            /* Home Layout - Rows */
            <div className="flex flex-col gap-10">
              
              {/* Favorites Row */}
              {favoriteChannelsList.length > 0 && (
                <section>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-brand to-white/80 bg-clip-text text-transparent flex items-center gap-2">
                      <Heart className="text-brand fill-brand" size={20} /> قنواتي المفضلة
                    </h2>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 styled-scrollbar snap-x">
                    {favoriteChannelsList.map((stream, idx) => (
                      <div 
                        key={stream.stream_id} 
                        className="w-[140px] md:w-[160px] shrink-0 snap-start group cursor-pointer"
                        onClick={() => navigate(`/live/${stream.stream_id}`)}
                      >
                        <div className="aspect-square relative rounded-sm overflow-hidden mb-2 border border-white/5 bg-panel group-hover:border-brand transition-colors flex items-center justify-center p-4">
                          <ImageWithFallback 
                            src={stream.stream_icon} 
                            alt={stream.name} 
                            type="live" 
                            loading="lazy"
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                          />
                          <button 
                             onClick={(e) => toggleFavorite(e, String(stream.stream_id))}
                             className="absolute top-2 left-2 p-1.5 transition-colors z-10 bg-black/40 rounded-full"
                          >
                             <Heart size={14} className="fill-red-500 text-red-500" />
                          </button>
                        </div>
                        <h3 className="text-gray-300 text-xs font-bold line-clamp-1 group-hover:text-brand transition-colors text-center w-full">
                          {stream.name}
                        </h3>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              
              {/* Categories Rows */}
              {validCategories.slice(0, visibleCount).map((cat) => (
                <section key={cat.category_id}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{cat.category_name}</h2>
                    <button 
                      onClick={() => setActiveCategory(cat.category_id)}
                      className="text-sm font-medium text-brand hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span>عرض الكل</span>
                      <ArrowLeftCircle size={16} />
                    </button>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 styled-scrollbar snap-x">
                    {channelsByCategory[cat.category_id]?.slice(0, 15).map((stream, idx) => {
                      const isFav = favorites.has(String(stream.stream_id));
                      return (
                        <div 
                          key={stream.stream_id} 
                          className="w-[140px] md:w-[160px] shrink-0 snap-start group cursor-pointer"
                          onClick={() => navigate(`/live/${stream.stream_id}`)}
                        >
                          <div className="aspect-square relative rounded-sm overflow-hidden mb-2 border border-white/5 bg-panel group-hover:border-brand transition-colors flex items-center justify-center p-4">
                            <ImageWithFallback 
                              src={stream.stream_icon} 
                              alt={stream.name} 
                              type="live" 
                              loading="lazy"
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <button 
                               onClick={(e) => toggleFavorite(e, String(stream.stream_id))}
                               className="absolute top-2 left-2 p-1.5 transition-colors z-10Opacity-0 group-hover:opacity-100 bg-black/40 rounded-full"
                            >
                               <Heart size={14} className={clsx(isFav ? "fill-red-500 text-red-500" : "text-gray-300")} />
                            </button>
                          </div>
                          <h3 className="text-gray-300 text-xs font-bold line-clamp-1 group-hover:text-brand transition-colors text-center w-full">
                            {stream.name}
                          </h3>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
              {visibleCount < validCategories.length && (
                <div ref={observerRef} className="col-span-full h-20 flex items-center justify-center mt-6">
                  <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-brand animate-spin"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
