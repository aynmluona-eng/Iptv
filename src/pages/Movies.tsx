import { useEffect, useState, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { XtreamCredentials, fetchXtreamApi } from '../lib/xtream';
import Navigation from '../components/Navigation';
import ImageWithFallback from '../components/ImageWithFallback';
import MovieCard from '../components/MovieCard';
import { motion } from 'motion/react';
import { Search, Star, Film, ArrowLeft, ArrowLeftCircle, Play, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function Movies({ credentials }: { credentials: XtreamCredentials }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [moviesByCategory, setMoviesByCategory] = useState<Record<string, any[]>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
  }, [activeCategory, search, selectedYear]);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, mvs] = await Promise.all([
          fetchXtreamApi(credentials, 'get_vod_categories').catch(() => []),
          fetchXtreamApi(credentials, 'get_vod_streams').catch(() => [])
        ]);
        
        if (Array.isArray(cats)) {
          setCategories(cats);
        }
        
        if (Array.isArray(mvs)) {
          setMovies(mvs);
          const grouped: Record<string, any[]> = {};
          mvs.forEach((m: any) => {
            if (!grouped[m.category_id]) grouped[m.category_id] = [];
            grouped[m.category_id].push(m);
          });
          setMoviesByCategory(grouped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [credentials]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    movies.forEach(m => {
      const match = m.name?.match(/\b((?:19|20)\d{2})\b/);
      if (match) years.add(match[1]);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory ? m.category_id === activeCategory : true;
      let matchYear = true;
      if (selectedYear) {
         const yearMatch = m.name?.match(/\b((?:19|20)\d{2})\b/);
         matchYear = yearMatch ? yearMatch[1] === selectedYear : false;
      }
      return matchSearch && matchCategory && matchYear;
    });
  }, [movies, search, activeCategory, selectedYear]);

  // Mock continue watching for now
  const continueWatching = useMemo(() => movies.slice(0, 10), [movies]);

  // Categories with movies
  const validCategories = useMemo(() => {
    return categories.filter(c => moviesByCategory[c.category_id]?.length > 0);
  }, [categories, moviesByCategory]);

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
                   ? `أفلام / ${categories.find(c => c.category_id === activeCategory)?.category_name || ''}` 
                   : 'الأفلام'
                 }
               </h1>
             </div>
             <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden text-gray-400 hover:text-white transition-colors" title="بحث">
               <Search size={22} />
             </button>
          </div>
          
          <div className={clsx("flex flex-col md:flex-row gap-3 w-full md:w-auto", showMobileSearch ? "flex" : "hidden md:flex")}>
            {availableYears.length > 0 && (
              <div className="relative">
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-panel border border-white/5 rounded-sm outline-none appearance-none pr-12 pl-8 py-3 text-sm text-white focus:outline-none focus:border-brand w-full md:w-[140px] transition-all cursor-pointer"
                >
                  <option value="">سنة الإصدار</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="relative w-full md:w-[320px]">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث عن فيلم..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-panel border border-white/5 rounded-sm pr-12 pl-6 py-3 text-sm text-white focus:outline-none focus:border-brand w-full transition-all"
              />
            </div>
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
               <p className="text-gray-400">جاري تحميل الأفلام...</p>
             </div>
          ) : search || activeCategory || selectedYear ? (
            /* Search Results or Category Grid */
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
              {filteredMovies.slice(0, visibleCount).map((movie, idx) => (
                <MovieCard key={movie.stream_id} movie={movie} credentials={credentials} idx={idx} />
              ))}
              {filteredMovies.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                   <Film size={48} className="mb-4 opacity-20" />
                   <p>لا توجد نتائج</p>
                 </div>
              )}
              {visibleCount < filteredMovies.length && (
                <div ref={observerRef} className="col-span-full h-20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-brand animate-spin"></div>
                </div>
              )}
            </div>
          ) : (
            /* Home Layout - Rows */
            <div className="flex flex-col gap-10">
              {/* Continue Watching */}
              {continueWatching.length > 0 && (
                <section>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-brand to-white/80 bg-clip-text text-transparent">متابعة المشاهدة</h2>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 styled-scrollbar snap-x">
                    {continueWatching.map((movie, idx) => (
                      <div 
                        key={movie.stream_id} 
                        className="w-[280px] shrink-0 snap-start group cursor-pointer"
                        onClick={() => navigate(`/movie/${movie.stream_id}`)}
                      >
                        <div className="aspect-video relative rounded-sm overflow-hidden mb-3 border border-white/5 bg-panel group-hover:border-brand transition-colors">
                          <ImageWithFallback 
                            src={movie.stream_icon} 
                            alt={movie.name} 
                            type="movie" 
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                          
                          {/* Progress bar mock */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div className="h-full bg-brand" style={{ width: `${Math.max(20, Math.random() * 80)}%` }}></div>
                          </div>
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="w-12 h-12 bg-brand/90 text-black rounded-full flex items-center justify-center shadow-lg">
                               <Play className="w-5 h-5 ml-1 fill-black" />
                             </div>
                          </div>
                        </div>
                        <h3 className="text-white text-sm font-bold line-clamp-1">{movie.name}</h3>
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
                    {moviesByCategory[cat.category_id]?.slice(0, 15).map((movie, idx) => (
                      <MovieCard 
                        key={movie.stream_id} 
                        movie={movie} 
                        credentials={credentials} 
                        idx={idx} 
                        className="w-[140px] md:w-[160px] shrink-0 snap-start" 
                      />
                    ))}
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
