import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const replacement = `      <main className="flex-1 md:pr-[260px] pb-24 md:pb-12 relative overflow-hidden bg-dark">
        {/* Full-width Hero Banner overlaying top bar */}
        <div className="relative w-full h-[60vh] min-h-[500px]">
          <div className="absolute inset-0 bg-black">
              <img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" alt="Live TV" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-dark/80 via-transparent to-transparent"></div>
          
          {/* Top bar inside hero */}
          <header className="absolute top-0 left-0 right-0 p-6 md:p-8 flex justify-between items-center z-20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowProfile(true)}
                className="w-12 h-12 rounded-sm bg-brand flex items-center justify-center text-xl font-bold border border-white/10 hover:scale-105 transition-transform cursor-pointer text-black"
              >
                {userInfo?.username?.charAt(0)?.toUpperCase()}
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-sm bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" title="بحث">
                <Search size={20} />
              </button>
              <button className="w-10 h-10 rounded-sm bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors relative" title="الإشعارات">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border-2 border-dark"></span>
              </button>
            </div>
          </header>

          <div className="absolute bottom-12 md:bottom-20 left-0 right-0 px-6 md:px-12 flex flex-col items-start z-20">
             <span className="bg-brand text-black font-bold px-3 py-1 text-sm uppercase mb-4 inline-block">مباشر الآن</span>
             <h2 className="text-4xl md:text-6xl font-black mb-4 text-white uppercase tracking-tight">دوري أبطال<br/>أوروبا</h2>
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
                <div onClick={() => setShowProfile(true)} className="bg-panel hover:bg-panel-hover border border-white/5 rounded-sm p-6 cursor-pointer transition-colors flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-white/5 rounded-sm flex items-center justify-center text-white group-hover:bg-brand group-hover:text-black transition-colors">
                        <ShieldCheck size={24} className={isActive ? 'text-brand group-hover:text-black' : 'text-red-500 group-hover:text-black'} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase text-sm md:text-base">حسابي</h3>
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
                {[
                  { title: "عالم الحيوان", subtitle: "وثائقي • تمت إضافة مواسم جديدة", img: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800" },
                  { title: "سباق السيارات القصوى", subtitle: "رياضة • مباشر", img: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&q=80&w=800" },
                  { title: "أسرار الفضاء", subtitle: "وثائقي • الحلقة 3", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800" },
                  { title: "عالم المحيطات", subtitle: "وثائقي • مباشر", img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&q=80&w=800" }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (idx * 0.1) }}
                    className="w-[300px] md:w-[360px] shrink-0 group cursor-pointer snap-start relative"
                  >
                    <div className="relative aspect-video bg-panel border-2 border-transparent group-hover:border-brand transition-colors rounded-sm overflow-hidden">
                      <img src={item.img} className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-500" alt={item.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/90 to-transparent"></div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-bold text-lg text-white uppercase mb-1">{item.title}</h3>
                        <p className="text-xs text-brand font-medium tracking-wide">{item.subtitle}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
            
        </div>
      </main>`;

const startIndex = content.indexOf('<main className="flex-1 md:pr-');
const endIndex = content.indexOf('</main>') + 7;

if(startIndex > -1 && endIndex > -1) {
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/pages/Dashboard.tsx', content);
  console.log("Updated Dashboard");
} else {
  console.log("Failed to find boundaries");
}
