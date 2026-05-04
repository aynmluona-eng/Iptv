import { useState, FormEvent, useEffect } from 'react';
import { LogIn, Tv, Play, X } from 'lucide-react';
import { fetchXtreamApi, XtreamCredentials } from '../lib/xtream';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import axios from 'axios';

interface LoginProps {
  onLogin: (creds: XtreamCredentials) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Auto hide splash after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!serverUrl || !username || !password) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let baseUrl = serverUrl.trim();
      while (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      if (baseUrl.includes('/get.php')) baseUrl = baseUrl.split('/get.php')[0];
      if (baseUrl.includes('/player_api.php')) baseUrl = baseUrl.split('/player_api.php')[0];
      if (baseUrl.includes('/panel_api.php')) baseUrl = baseUrl.split('/panel_api.php')[0];

      const creds = {
        serverUrl: baseUrl,
        username: username.trim(),
        password: password.trim()
      };

      const responseData = await fetchXtreamApi(creds);

      if (responseData && typeof responseData === 'object' && 'user_info' in responseData) {
        if (responseData.user_info && responseData.user_info.auth === 1) {
          toast.success('تم تسجيل الدخول بنجاح');
          onLogin(creds);
        } else {
          const msg = 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.';
          setError(msg);
          toast.error(msg);
        }
      } else {
        const msg = 'رد غير متوقع من الخادم. يرجى التأكد من صحة الرابط وأن الخادم يدعم Xtream API.';
        setError(msg);
        toast.error(msg);
        console.error("Invalid response format:", responseData);
      }
    } catch (err: any) {
      console.error(err);
      const isNetworkError = err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('capacitor');
      
      if (err.response?.status === 404 || err.response?.status === 403) {
         const msg = 'رابط الخادم غير صحيح، أو أن الخادم يرفض الاتصال. تأكد من صحة الرابط.';
         setError(msg);
         toast.error(msg);
         return;
      }
      
      let errDetails = err.response?.data?.error || err.response?.data?.details || err.response?.data || err.message;
      if (typeof errDetails === 'object') {
        try { errDetails = JSON.stringify(errDetails); } catch(e) {}
      }
      
      let finalErrMsg = '';
      if (errDetails && typeof errDetails === 'string' && (errDetails.toLowerCase().includes('timeout') || errDetails.includes('ECONN') || errDetails.includes('ETIMEDOUT') || errDetails.includes('failed to fetch') || errDetails.toLowerCase().includes('load failed') || errDetails.toLowerCase().includes('network error') || errDetails.toLowerCase().includes('fetch api cannot load'))) {
        finalErrMsg = `انتهى وقت الاتصال أو رفض الخادم الطلب. (${errDetails}) - قد يقوم مزود الخدمة الخاص بك بحظر الخوادم السحابية أو التطبيق.`;
      } else if (isNetworkError) {
        finalErrMsg = `لا يوجد اتصال بالإنترنت أو أن مزود الخدمة يحظر التطبيق.`;
      } else {
        finalErrMsg = `تعذر الاتصال بالخادم. ${errDetails}`;
      }
      setError(finalErrMsg);
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const Logo = ({ className = "" }: { className?: string }) => (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="w-20 h-20 bg-brand text-black rounded-sm flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,249,51,0.2)]">
        <Tv size={40} />
      </div>
      <h1 className="text-3xl font-black text-white tracking-widest mb-1 uppercase">تفرج</h1>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-[100dvh] relative overflow-hidden bg-dark">
      {/* Background Decor - simple mesh/gradient replaced with solid pattern or photo */}
      <div className="absolute inset-0 bg-black">
         <img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover opacity-30 mix-blend-luminosity" alt="Background" />
         <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/80 to-dark/40"></div>
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center z-10"
          >
            <Logo />
            <div className="mt-16 flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-white/20 border-t-brand rounded-full animate-spin mb-4"></div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-md p-8 md:p-10 bg-panel border-t-4 border-brand rounded-sm shadow-2xl relative z-10 mx-4"
          >
            <Logo className="scale-75 origin-top mb-2 -mt-4" />

            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm uppercase">تسجيل الدخول</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-sm text-red-500 text-sm font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="رابط الخادم (http://example.com:port)"
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand transition-all dir-ltr text-left placeholder:text-gray-600 font-mono text-sm"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم"
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand transition-all dir-ltr text-left placeholder:text-gray-600 font-mono text-sm"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand transition-all dir-ltr text-left placeholder:text-gray-600 font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-brand text-black font-bold uppercase rounded-sm transition-all flex items-center justify-center gap-2 mt-4 hover:bg-white disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>متابعة</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
