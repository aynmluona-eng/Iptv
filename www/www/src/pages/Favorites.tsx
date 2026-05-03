import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { motion } from 'motion/react';
import { Heart, Play, Film, MonitorPlay, Tv, Trash2, ArrowLeft, Star } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { XtreamCredentials } from '../lib/xtream';
import { toast } from 'sonner';

export default function Favorites({ credentials }: { credentials: XtreamCredentials }) {
  const [activeTab, setActiveTab] = useState<'live' | 'movies' | 'series'>('live');
  const [liveFavs, setLiveFavs] = useState<string[]>([]);
  const [movieFavs, setMovieFavs] = useState<any[]>([]);
  const [seriesFavs, setSeriesFavs] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedLive = localStorage.getItem('xtream_favorites_live');
    if (storedLive) setLiveFavs(JSON.parse(storedLive));

    const storedMovies = localStorage.getItem('xtream_favorites_movies');
    if (storedMovies) setMovieFavs(JSON.parse(storedMovies));

    const storedSeries = localStorage.getItem('xtream_favorites_series');
    if (storedSeries) setSeriesFavs(JSON.parse(storedSeries));
  }, []);

  const removeLiveFav = (id: string) => {
    const newFavs = liveFavs.filter(fav => fav !== id);
    setLiveFavs(newFavs);
    localStorage.setItem('xtream_favorites_live', JSON.stringify(newFavs));
    toast.info('تم إزالة القناة من المفضلة');
  };

  const removeMovieFav = (id: string) => {
    const newFavs = movieFavs.filter(fav => String(fav.id) !== String(id));
    setMovieFavs(newFavs);
    localStorage.setItem('xtream_favorites_movies', JSON.stringify(newFavs));
    toast.info('تم إزالة الفيلم من المفضلة');
  };

  const removeSeriesFav = (id: string) => {
    const newFavs = seriesFavs.filter(fav => String(fav.id) !== String(id));
    setSeriesFavs(newFavs);
    localStorage.setItem('xtream_favorites_series', JSON.stringify(newFavs));
    toast.info('تم إزالة المسلسل من المفضلة');
  };

  const tabs = [
    { id: 'live', label: 'القنوات', icon: Tv },
    { id: 'movies', label: 'الأفلام', icon: Film },
    { id: 'series', label: 'المسلسلات', icon: MonitorPlay },
  ] as const;

  return (
    <div className="flex min-h-[100dvh] bg-dark text-white">
      <Navigation />
      
      <main className="flex-1 md:pr-[260px] px-4 md:px-8 pt-8 md:pt-12 pb-24 md:pb-12 flex flex-col h-[100dvh] overflow-hidden">
        <header className="mb-6 shrink-0 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-white/5 hover:bg-brand hover:text-black rounded-sm flex items-center justify-center transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="w-12 h-12 bg-white/5 rounded-sm flex items-center justify-center text-brand ml-2">
            <Heart size={24} className="fill-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">المفضلة</h1>
            <p className="text-gray-400 text-sm">محتواك المفضل للوصول السريع</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="shrink-0 mb-6 flex gap-2 overflow-x-auto styled-scrollbar pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-bold transition-all shrink-0",
                  activeTab === tab.id 
                    ? "bg-brand text-black shadow-lg" 
                    : "bg-panel text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto pb-6 styled-scrollbar pr-1 md:pr-4">
          {activeTab === 'live' && (
            liveFavs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Heart size={48} className="mb-4 opacity-20" />
                <p>لا توجد قنوات مفضلة</p>
                <p className="text-xs mt-2">اضغط على علامة القلب لإضافة قنوات</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {liveFavs.map((streamId, idx) => (
                  <motion.div
                    key={streamId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                    className="flex items-center gap-4 bg-panel hover:bg-white/10 border border-white/5 rounded-sm p-3 cursor-pointer transition-all group"
                    onClick={() => navigate(`/live/${streamId}`)}
                  >
                    <div className="w-16 h-16 bg-black/40 rounded-sm flex items-center justify-center shrink-0 border border-white/5">
                      <Tv size={24} className="text-gray-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-base font-bold truncate group-hover:text-brand transition-colors mb-1">
                        Channel #{streamId}
                      </h3>
                      <p className="text-xs text-brand truncate flex items-center gap-1.5">
                         <Play size={10} className="fill-brand" />
                         العب الان
                      </p>
                    </div>

                    <div className="shrink-0 pl-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); removeLiveFav(streamId); }}
                         className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-sm transition-colors"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
          
          {activeTab === 'movies' && (
            movieFavs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Film size={48} className="mb-4 opacity-20" />
                <p>لا توجد أفلام مفضلة</p>
                <p className="text-xs mt-2">اضغط على علامة القلب لإضافة أفلام</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {movieFavs.map((movie, idx) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                    className="group cursor-pointer transition-all relative flex flex-col"
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  >
                    <div className="aspect-[2/3] relative rounded-sm overflow-hidden mb-3 border border-white/5 bg-panel group-hover:border-brand transition-colors">
                      <ImageWithFallback 
                        src={movie.cover} 
                        alt={movie.name} 
                        type="movie" 
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      
                      {movie.rating && movie.rating > 0 && (
                        <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 flex items-center gap-1 rounded text-[10px] font-bold z-10 w-fit">
                          <Star size={8} className="text-yellow-400 fill-yellow-400" />
                          <span>{Number(movie.rating).toFixed(1)}</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeMovieFav(movie.id); }}
                        className="absolute top-2 left-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-sm transition-colors z-20 opacity-0 group-hover:opacity-100"
                        title="إزالة"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                         <Play className="text-brand w-8 h-8 fill-brand" />
                      </div>
                    </div>
                    <h3 className="text-gray-300 text-sm font-bold line-clamp-1 group-hover:text-brand transition-colors mt-auto">
                      {movie.name}
                    </h3>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {activeTab === 'series' && (
            seriesFavs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MonitorPlay size={48} className="mb-4 opacity-20" />
                <p>لا توجد مسلسلات مفضلة</p>
                <p className="text-xs mt-2">اضغط على علامة القلب لإضافة مسلسلات</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {seriesFavs.map((seriesItem, idx) => (
                  <motion.div
                    key={seriesItem.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                    className="group cursor-pointer transition-all relative flex flex-col"
                    onClick={() => navigate(`/series/${seriesItem.id}`)}
                  >
                    <div className="aspect-[2/3] relative rounded-sm overflow-hidden mb-3 border border-white/5 bg-panel group-hover:border-brand transition-colors">
                      <ImageWithFallback 
                        src={seriesItem.cover} 
                        alt={seriesItem.name} 
                        type="series" 
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      
                      {seriesItem.rating && seriesItem.rating > 0 && (
                        <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 flex items-center gap-1 rounded text-[10px] font-bold z-10 w-fit">
                          <Star size={8} className="text-yellow-400 fill-yellow-400" />
                          <span>{Number(seriesItem.rating).toFixed(1)}</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeSeriesFav(seriesItem.id); }}
                        className="absolute top-2 left-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-sm transition-colors z-20 opacity-0 group-hover:opacity-100"
                        title="إزالة"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                         <Play className="text-brand w-8 h-8 fill-brand" />
                      </div>
                    </div>
                    <h3 className="text-gray-300 text-sm font-bold line-clamp-1 group-hover:text-brand transition-colors mt-auto">
                      {seriesItem.name}
                    </h3>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
