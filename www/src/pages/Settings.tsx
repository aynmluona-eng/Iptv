import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { motion } from 'motion/react';
import { User, Image as ImageIcon, Shield, Mail, Key, Phone, Save, Edit3, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { XtreamCredentials } from '../lib/xtream';
import { toast } from 'sonner';

export default function Settings({ credentials, onLogout }: { credentials: XtreamCredentials, onLogout?: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'privacy'>('profile');
  
  // Profile state
  const [name, setName] = useState('مستخدم جديد');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Privacy state
  const [hideContactInfo, setHideContactInfo] = useState(false);
  const [showViewingHistory, setShowViewingHistory] = useState(true);

  // Load saved settings
  useEffect(() => {
    const savedProfile = localStorage.getItem('xtream_user_profile');
    if (savedProfile) {
      const data = JSON.parse(savedProfile);
      if (data.name) setName(data.name);
      if (data.avatar) setAvatar(data.avatar);
      if (data.hideContactInfo !== undefined) setHideContactInfo(data.hideContactInfo);
      if (data.showViewingHistory !== undefined) setShowViewingHistory(data.showViewingHistory);
    } else {
      // Use credentials username as default
      if (credentials?.username) {
        setName(credentials.username);
      }
    }
  }, [credentials]);

  const handleSave = () => {
    const profileData = {
      name,
      avatar,
      hideContactInfo,
      showViewingHistory
    };
    localStorage.setItem('xtream_user_profile', JSON.stringify(profileData));
    toast.success('تم حفظ التغييرات بنجاح');
  };

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'account', label: 'حساب الاشتراك', icon: Shield },
    { id: 'privacy', label: 'الخصوصية', icon: Key },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-dark text-white">
      <Navigation />
      
      <main className="flex-1 md:pr-[260px] pb-24 md:pb-12 h-[100dvh] overflow-y-auto styled-scrollbar">
        <div className="px-6 md:px-12 pt-8 md:pt-12 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 hover:bg-brand hover:text-black rounded-sm flex items-center justify-center transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-black tracking-tight">إعدادات الحساب</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 styled-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    "flex items-center gap-3 px-5 py-4 rounded-sm font-bold text-sm transition-all whitespace-nowrap shrink-0",
                    activeTab === tab.id 
                      ? "bg-brand text-black shadow-lg"
                      : "bg-panel text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? "text-black text-black" : ""} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-panel border border-white/5 rounded-sm p-6 md:p-8">
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
                  <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                       <User className="text-brand" /> المعلومات الشخصية
                    </h2>
                    
                    {/* Avatar */}
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand bg-dark shrink-0">
                          <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        <button 
                          className="absolute bottom-0 right-0 w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center border-2 border-panel hover:scale-110 transition-transform"
                          onClick={() => document.getElementById('avatarUpload')?.click()}
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">صورة الملف الشخصي</p>
                        <p className="text-xs text-brand cursor-pointer hover:underline" onClick={() => document.getElementById('avatarUpload')?.click()}>تغيير الصورة</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">الاسم</label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          className="bg-dark border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">اسم المستخدم (للاشتراك)</label>
                        <input 
                          type="text" 
                          value={credentials?.username || ''} 
                          disabled
                          className="bg-dark/50 border border-white/5 rounded-sm px-4 py-3 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-px bg-white/5 w-full my-2"></div>
                  
                  <div className="flex justify-end">
                    <button 
                      id="save-btn"
                      onClick={handleSave}
                      className="bg-brand text-black px-8 py-3 rounded-sm font-bold flex items-center gap-2 hover:bg-white transition-colors"
                    >
                      <Save size={18} /> حفظ التغييرات
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'account' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
                   <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                       <Shield className="text-brand" /> تفاصيل الاشتراك
                    </h2>
                    
                    <div className="bg-dark border border-white/5 rounded-sm p-6 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">حالة الاشتراك</span>
                        <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-bold rounded-sm border border-green-500/30">نشط</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500 w-24">المنفذ:</span>
                          <span className="font-mono text-white break-all">{credentials?.serverUrl}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500 w-24">اسم المستخدم:</span>
                          <span className="font-mono text-white">{credentials?.username}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-sm text-sm text-orange-200 flex gap-3 mb-6">
                      <Shield className="shrink-0 text-orange-500 mt-0.5" size={18} />
                      <p>
                        تفاصيل الاشتراك يتم توفيرها من قبل مشغل الخدمة الخاص بك. لتغيير كلمة المرور أو تجديد الاشتراك، يرجى التواصل مع مزود الخدمة الخاص بك.
                      </p>
                    </div>

                    {onLogout && (
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black rounded-sm font-bold uppercase transition-all mt-2 border border-red-500/20 group"
                      >
                        <LogOut size={18} className="rotate-180" />
                        تسجيل الخروج من الحساب
                      </button>
                    )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
                   <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                       <Key className="text-brand" /> إعدادات الخصوصية
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-dark border border-white/5 rounded-sm">
                        <div className="flex-1 mr-4">
                          <h3 className="font-bold mb-1 flex items-center gap-2">
                             إخفاء معلومات الاتصال
                          </h3>
                          <p className="text-xs text-gray-500">
                            عند تفعيل هذا الخيار، لن تظهر معلومات الاتصال الخاصة بك في أي مكان عام أو للمستخدمين الآخرين إن وجد.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={hideContactInfo}
                            onChange={(e) => setHideContactInfo(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-dark border border-white/5 rounded-sm">
                        <div className="flex-1 mr-4">
                          <h3 className="font-bold mb-1 flex items-center gap-2">
                             تتبع سجل المشاهدة
                          </h3>
                          <p className="text-xs text-gray-500">
                             استخدام سجل المشاهدة لتقديم توصيات أفضل وتحسين تجربة المستخدم ("متابعة المشاهدة").
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={showViewingHistory}
                            onChange={(e) => setShowViewingHistory(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 w-full my-2"></div>
                  
                  <div className="flex justify-end">
                    <button 
                      id="save-btn-privacy"
                      onClick={handleSave}
                      className="bg-brand text-black px-8 py-3 rounded-sm font-bold flex items-center gap-2 hover:bg-white transition-colors"
                    >
                      <Save size={18} /> حفظ الإعدادات
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
