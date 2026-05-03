import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XtreamCredentials, fetchXtreamApi } from '../lib/xtream';
import Navigation from '../components/Navigation';
import ImageWithFallback from '../components/ImageWithFallback';
import ActorProfile from '../components/ActorProfile';
import { motion } from 'motion/react';
import { ArrowLeft, Play, Star, Sparkles, Users, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function MovieDetails({ credentials }: { credentials: XtreamCredentials }) {
  const { id } = useParams<{ id: string }>();
  const [movieInfo, setMovieInfo] = useState<any>(null);
  const [movieData, setMovieData] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      const favs = JSON.parse(localStorage.getItem('xtream_favorites_movies') || '[]');
      setIsFavorite(favs.some((f: any) => String(f.id) === String(id)));
    }
  }, [id]);

  const toggleFavorite = () => {
    if (!id || !movieInfo) return;
    
    const favs = JSON.parse(localStorage.getItem('xtream_favorites_movies') || '[]');
    if (isFavorite) {
      const newFavs = favs.filter((f: any) => String(f.id) !== String(id));
      localStorage.setItem('xtream_favorites_movies', JSON.stringify(newFavs));
      setIsFavorite(false);
      toast.info('تم الإزالة من المفضلة');
    } else {
      favs.push({
        id,
        name: movieInfo.name,
        cover: movieInfo.movie_image,
        rating: movieInfo.rating
      });
      localStorage.setItem('xtream_favorites_movies', JSON.stringify(favs));
      setIsFavorite(true);
      toast.success('تم الإضافة إلى المفضلة');
    }
  };
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    
    // Reset state on id change
    setLoading(true);
    setMovieInfo(null);
    setRelated([]);

    const loadData = async () => {
      try {
        const data = await fetchXtreamApi(credentials, 'get_vod_info', { vod_id: id });
        if (data && data.info) {
          setMovieInfo(data.info);
          setMovieData(data.movie_data);
          setLoading(false); // Stop loading early
          
          // Try to fetch related movies (from same category if possible)
          const catId = data.movie_data?.category_id || data.info?.category_id;
          if (catId) {
            const movies = await fetchXtreamApi(credentials, 'get_vod_streams', { category_id: catId }).catch(() => []);
            if (Array.isArray(movies)) {
              setRelated(movies.filter(m => String(m.stream_id) !== String(id)).sort(() => 0.5 - Math.random()).slice(0, 15));
            }
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, credentials]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] bg-dark text-white">
        <Navigation />
        <main className="flex-1 md:pr-[260px] flex items-center justify-center">
           <div className="w-12 h-12 border-4 border-brand border-t-brand rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  if (!movieInfo) {
    return (
      <div className="flex min-h-[100dvh] bg-dark text-white">
        <Navigation />
        <main className="flex-1 md:pr-[260px] flex flex-col items-center justify-center text-gray-500">
           <p className="mb-4">عذراً، لا يمكن العثور على الفيلم</p>
           <button onClick={() => navigate(-1)} className="text-brand hover:underline">العودة للخلف</button>
        </main>
      </div>
    );
  }

  const castArray = movieInfo.cast ? movieInfo.cast.split(',').map((c: string) => c.trim()).filter(Boolean) : [];

  return (
    <div className="flex min-h-[100dvh] bg-dark text-white">
      <Navigation />
      
      <main className="flex-1 md:pr-[260px] relative overflow-y-auto h-[100dvh] styled-scrollbar pb-20">
        {/* Hero Section */}
        <div className="relative min-h-[70vh] flex flex-col justify-end pt-32 pb-16 px-6 md:px-12">
          {/* Backdrop */}
          <div className="absolute inset-0 z-0">
            {movieInfo.backdrop_path && movieInfo.backdrop_path.length > 0 ? (
              <img src={movieInfo.backdrop_path[0]} alt="backdrop" className="w-full h-full object-cover opacity-40 mix-blend-screen" />
            ) : (
              <img src={movieInfo.movie_image} alt="cover backdrop" className="w-full h-full object-cover opacity-20 blur-xl" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark/90 to-transparent md:bg-gradient-to-l md:from-dark md:to-transparent opacity-80" />
            <div className="absolute inset-0 bg-dark/30 backdrop-blur-[2px]"></div>
          </div>

          <button onClick={() => navigate(-1)} className="absolute top-8 right-6 md:right-12 z-20 w-12 h-12 bg-black/40 backdrop-blur-md hover:bg-brand text-white hover:text-black border border-white/10 rounded-full flex items-center justify-center transition-all">
            <ArrowLeft size={24} />
          </button>
          
          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-end">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-48 md:w-64 lg:w-72 shrink-0 rounded-sm overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/10 bg-panel group">
              <ImageWithFallback src={movieInfo.movie_image} alt={movieInfo.name} type="movie" className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex-1 w-full text-center md:text-right">
              {movieInfo.genre && (
                <span className="inline-block px-3 py-1 bg-brand text-black text-xs font-bold rounded-sm mb-4 uppercase tracking-wider shadow-lg">
                  {movieInfo.genre.split(',').join(' • ')}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">{movieInfo.name}</h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs md:text-sm text-gray-200 mb-6 bg-black/40 py-2.5 px-5 rounded-full border border-white/10 inline-flex backdrop-blur-md shadow-inner">
                {movieInfo.releasedate && <span className="font-mono">{movieInfo.releasedate}</span>}
                {movieInfo.rating && <span className="flex items-center gap-1.5 text-yellow-400 font-bold"><Star size={16} className="fill-yellow-400" /> {Number(movieInfo.rating).toFixed(1)}</span>}
                {movieInfo.duration && <span>{movieInfo.duration}</span>}
              </div>
              
              <p className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed max-w-3xl mb-8 drop-shadow-md line-clamp-4">
                {movieInfo.plot || 'لا توجد قصة متوفرة.'}
              </p>

              {movieInfo.director && <p className="text-gray-400 mb-8">إخراج: <span className="text-white font-medium">{movieInfo.director}</span></p>}

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button 
                  onClick={() => navigate(`/player/movie/${id}?ext=${movieData?.container_extension || 'mp4'}`)} 
                  className="bg-brand text-black px-10 py-4 rounded-sm font-bold text-lg hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(212,249,51,0.4)]"
                >
                  <Play fill="black" size={20} /> تشغيل الفيلم
                </button>
                <button 
                  onClick={toggleFavorite}
                  className={`px-8 py-4 rounded-sm font-bold text-lg border transition-all flex items-center justify-center gap-3 ${
                    isFavorite 
                      ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                  {isFavorite ? 'مضاف للمفضلة' : 'إضافة للمفضلة'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Details Content */}
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto flex flex-col gap-16">
          
          {/* Cast Section */}
          {castArray.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Users size={24} className="text-brand" />
                طاقم العمل
              </h2>
              <div className="flex overflow-x-auto gap-4 pb-6 styled-scrollbar snap-x">
                {castArray.map((actor: string, idx: number) => (
                  <div key={idx} className="snap-start shrink-0">
                    <ActorProfile name={actor} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Section */}
          {related.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles size={24} className="text-brand" />
                المزيد من هذه الفئة
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-6 styled-scrollbar snap-x">
                {related.map((movie, idx) => (
                  <div 
                    key={movie.stream_id} 
                    className="w-[160px] md:w-[180px] shrink-0 snap-start group cursor-pointer"
                    onClick={() => navigate(`/movie/${movie.stream_id}`)}
                  >
                    <div className="aspect-[2/3] relative rounded-sm overflow-hidden mb-3 border border-white/5 bg-panel group-hover:border-brand transition-colors">
                      <ImageWithFallback 
                        src={movie.stream_icon} 
                        alt={movie.name} 
                        type="movie" 
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      
                      {movie.rating && Number(movie.rating) > 0 ? (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 flex items-center gap-1 rounded border border-white/10 text-[10px] font-bold">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span>{Number(movie.rating).toFixed(1)}</span>
                        </div>
                      ) : null}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="w-12 h-12 bg-brand/90 text-black rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                           <Play className="w-5 h-5 ml-1 fill-black" />
                         </div>
                      </div>
                    </div>
                    <h3 className="text-gray-200 text-sm font-bold line-clamp-1 group-hover:text-brand transition-colors">
                      {movie.name}
                    </h3>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
