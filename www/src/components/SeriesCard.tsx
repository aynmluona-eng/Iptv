import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import { XtreamCredentials, fetchXtreamApi } from '../lib/xtream';

interface SeriesCardProps {
  series: any;
  credentials: XtreamCredentials;
  idx?: number;
  className?: string;
}

export default function SeriesCard({ series, credentials, idx = 0, className = "" }: SeriesCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!description && !loading) {
      hoverTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const data = await fetchXtreamApi(credentials, 'get_series_info', { series_id: series.series_id });
          if (data?.info?.plot) {
            setDescription(data.info.plot);
          } else {
            setDescription('لا توجد قصة متوفرة.');
          }
        } catch (error) {
          setDescription('تعذر تحميل القصة.');
        } finally {
          setLoading(false);
        }
      }, 500);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(idx * 0.01, 0.1) }}
      className={`group cursor-pointer transition-all flex flex-col relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/series/${series.series_id}`)}
    >
      <div className="aspect-[2/3] relative rounded-sm overflow-hidden mb-3 border border-white/5 bg-panel group-hover:border-brand transition-colors">
        <ImageWithFallback 
          src={series.cover} 
          alt={series.name} 
          type="series" 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-brand text-black rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform shadow-lg">
            <Play className="w-6 h-6 ml-1 fill-black" />
          </div>
        </div>
        
        {series.rating && series.rating > 0 ? (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 flex items-center gap-1 rounded-md border border-white/10 z-10">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold font-mono text-white pt-0.5">{Number(series.rating).toFixed(1)}</span>
          </div>
        ) : null}
      </div>
      
      <h3 className="text-white text-sm font-bold line-clamp-1 group-hover:text-gray-300 transition-colors mt-auto">
        {series.name}
      </h3>

      <AnimatePresence>
        {isHovered && description && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 bottom-full left-0 right-0 mb-4 bg-panel border border-white/10 shadow-2xl p-4 rounded-md pointer-events-none"
          >
            <h4 className="text-brand font-bold text-sm mb-1">{series.name}</h4>
            <p className="text-xs text-gray-300 line-clamp-4 leading-relaxed bg-dark/50 p-2 rounded">
              {description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
