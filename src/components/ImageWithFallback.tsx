import { useState, SyntheticEvent, useEffect } from 'react';
import { Tv, Film, MonitorPlay } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string | undefined | null;
  alt: string;
  type?: 'live' | 'movie' | 'series';
  className?: string;
  loading?: 'lazy' | 'eager';
}

export default function ImageWithFallback({ src, alt, type = 'live', className = '', loading = 'lazy' }: ImageWithFallbackProps) {
  const [error, setError] = useState(!src);
  const [currentSrc, setCurrentSrc] = useState<string | undefined | null>(src);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setError(!src);
  }, [src]);

  useEffect(() => {
    if (error && alt && !isSearching) {
       const fetchFallbackImage = async () => {
          setIsSearching(true);
          const cachedImage = localStorage.getItem(`img_cache_${alt}`);
          if (cachedImage) {
             setCurrentSrc(cachedImage);
             setError(false);
             setIsSearching(false);
             return;
          }

          try {
             const searchQuery = type === 'live' ? `${alt} (TV channel)` : alt;
             const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery.replace(/ /g, '_'))}`);
             if (res.ok) {
                const data = await res.json();
                if (data.thumbnail && data.thumbnail.source) {
                   const imgUrl = data.thumbnail.source;
                   localStorage.setItem(`img_cache_${alt}`, imgUrl);
                   setCurrentSrc(imgUrl);
                   setError(false);
                } else if (type === 'live') {
                   // Try without " (TV channel)"
                   const res2 = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(alt.replace(/ /g, '_'))}`);
                   if (res2.ok) {
                      const data2 = await res2.json();
                      if (data2.thumbnail && data2.thumbnail.source) {
                         const imgUrl = data2.thumbnail.source;
                         localStorage.setItem(`img_cache_${alt}`, imgUrl);
                         setCurrentSrc(imgUrl);
                         setError(false);
                      }
                   }
                }
             }
          } catch(e) {
             // Failed
          } finally {
             setIsSearching(false);
          }
       };

       fetchFallbackImage();
    }
  }, [error, alt, type]);

  const handleError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc === src) {
      setError(true);
    }
  };

  if (error || !currentSrc) {
    return (
      <div className={`flex flex-col items-center justify-center bg-black/40 text-white/20 border border-white/5 ${className}`}>
        {type === 'live' ? <Tv size={32} /> : type === 'series' ? <MonitorPlay size={32} /> : <Film size={32} />}
        <span className="text-[10px] uppercase font-bold mt-2 tracking-wider">{type}</span>
      </div>
    );
  }

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      className={className} 
      onError={handleError} 
      loading={loading}
      decoding="async"
    />
  );
}
