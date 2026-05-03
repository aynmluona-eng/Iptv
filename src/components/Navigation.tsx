import { NavLink, useLocation } from 'react-router-dom';
import { Home, Tv, Film, LogOut, MonitorPlay, Heart, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

interface NavigationProps {
  onLogout?: () => void;
}

export default function Navigation({ onLogout }: NavigationProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { to: '/', icon: <Home size={22} />, label: 'الرئيسية' },
    { to: '/series', icon: <MonitorPlay size={22} />, label: 'المسلسلات' },
    { to: '/movies', icon: <Film size={22} />, label: 'الأفلام' },
    { to: '/live', icon: <Tv size={22} />, label: 'القنوات' },
    { to: '/favorites', icon: <Heart size={22} />, label: 'المفضلة' },
    { to: '/settings', icon: <SettingsIcon size={22} />, label: 'الإعدادات' },
  ];

  return (
    <>
      {/* Mobile Top Header (only on certain screens or keep it minimal) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-dark to-transparent z-30 flex items-center justify-between px-6 pointer-events-none">
        {/* We can place logo here if needed, or let individual pages handle top bars */}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed right-0 top-0 bottom-0 bg-dark border-l border-white/5 flex-col z-50 w-[260px] shadow-2xl">
        <div className="px-8 pt-12 mb-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-brand text-black rounded-sm flex items-center justify-center text-black shadow-[0_0_20px_rgba(212,249,51,0.2)]">
            <Tv size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-white mb-1 uppercase">TOD APP</h1>
            <p className="text-xs text-brand font-bold tracking-widest uppercase">SPORTS & ENT</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 w-full mt-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => clsx(
                "sidebar-link flex items-center px-8 py-4 gap-4 text-lg font-bold w-full relative overflow-hidden uppercase transition-all duration-300",
                isActive 
                  ? "text-brand border-r-4 border-brand bg-white/5" 
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-r-4 border-transparent hover:border-white/10"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className={clsx("relative z-10 transition-colors", isActive ? "text-brand" : "")}>{link.icon}</span>
                  <span className="relative z-10">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {onLogout && (
          <div className="pb-8 w-full mt-auto">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-8 py-4 gap-4 text-lg font-medium text-red-500 opacity-80 hover:opacity-100 hover:bg-white/5 transition-colors border-r-4 border-transparent hover:border-red-500"
              title="تسجيل الخروج"
            >
              <LogOut size={22} className="rotate-180" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark/95 backdrop-blur-xl border-t border-white/10 z-50 px-2 pb-safe pt-2">
        <ul className="flex justify-around items-center h-16">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <li key={link.to} className="w-full">
                <NavLink
                  to={link.to}
                  className="w-full flex flex-col items-center justify-center gap-1.5 h-full relative"
                >
                  <div className={clsx(
                    "transition-all duration-300 flex flex-col items-center justify-center",
                    isActive ? "text-gray-300 transform -translate-y-1" : "text-gray-500 hover:text-gray-300"
                  )}>
                    {link.icon}
                    <span className="text-[10px] font-bold">{link.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute -bottom-2 w-12 h-1 bg-brand text-black rounded-t-full"></div>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  );
}
