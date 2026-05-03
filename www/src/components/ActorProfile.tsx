import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { User } from 'lucide-react';

const ActorProfile: React.FC<{ name: string }> = ({ name }) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px 0px' });
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (inView) {
      // First check Wikipedia for an actual photo
      const fetchPhoto = async () => {
        const cacheKey = `actor_img_cache_${name}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setPhoto(cached);
          setLoading(false);
          return;
        }

        try {
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, '_'))}`);
          if (res.ok) {
            const data = await res.json();
            if (data.thumbnail && data.thumbnail.source) {
              const url = data.thumbnail.source;
              setPhoto(url);
              localStorage.setItem(cacheKey, url);
              setLoading(false);
              return;
            }
          }
           // Fallback to UI Avatars if Wikipedia fails or has no photo
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2c3e50&color=fff&size=200`;
          setPhoto(avatarUrl);
          localStorage.setItem(cacheKey, avatarUrl);
        } catch (err) {
           const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2c3e50&color=fff&size=200`;
           setPhoto(avatarUrl);
           localStorage.setItem(cacheKey, avatarUrl);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPhoto();
    }
  }, [inView, name]);

  return (
    <div ref={ref} className="w-32 shrink-0 snap-start bg-panel border border-white/5 rounded-sm p-4 text-center hover:bg-white/5 transition-colors group">
      <div className="w-20 h-20 mx-auto bg-dark rounded-full mb-3 flex items-center justify-center text-xl font-bold text-gray-500 border border-white/10 overflow-hidden shadow-lg group-hover:border-brand transition-colors">
        {loading ? (
           <div className="w-full h-full bg-white/5 animate-pulse rounded-full flex items-center justify-center">
             <User size={24} className="text-gray-600" />
           </div>
        ) : photo ? (
           <img src={photo} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
           name.charAt(0).toUpperCase()
        )}
      </div>
      <h3 className="text-xs font-bold text-white leading-tight group-hover:text-brand transition-colors">{name}</h3>
    </div>
  );
}

export default ActorProfile;
