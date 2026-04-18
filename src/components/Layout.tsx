import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Receipt, 
  Settings, 
  LogOut,
  Search,
  Menu,
  Building2,
  ReceiptText,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const primaryNav = [
    { name: 'الرئيسية', href: '/', icon: LayoutDashboard },
    { name: 'الحجوزات', href: '/bookings', icon: Briefcase },
    { name: 'العملاء', href: '/customers', icon: Users },
    { name: 'الكاشير', href: '/transactions', icon: Receipt },
  ];

  const secondaryNav = [
    { name: 'الموردين', href: '/suppliers', icon: Building2 },
    { name: 'المصروفات', href: '/expenses', icon: ReceiptText },
    ...(user.role === 'admin' ? [{ name: 'الإعدادات', href: '/settings', icon: Settings }] : []),
  ];

  const navigation = [...primaryNav, ...secondaryNav];

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-l border-slate-200 flex-col py-6 shrink-0">
        <div className="flex items-center px-6 pb-8 gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            ب
          </div>
          <div className="text-[22px] font-extrabold text-emerald-700 tracking-tight">بوصله</div>
        </div>
        
        <nav className="flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-6 py-3 text-[15px] font-medium transition-all border-r-[3px]",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-600" 
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon className="w-5 h-5 ml-3 opacity-70" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 mt-auto">
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 text-[15px] font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5 ml-3 opacity-70" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 md:h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              ب
            </div>
            <div className="text-xl font-extrabold text-emerald-700 tracking-tight">بوصله</div>
          </div>

          <div className="hidden md:block relative flex-1 max-w-md ml-4">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              className="bg-slate-100 rounded-full pr-10 pl-4 py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              placeholder="ابحث عن حجز، عميل، أو فاتورة..."
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:block">
              <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
              <span className="block text-[11px] text-slate-400">{user.role === 'admin' ? 'المدير العام' : 'موظف'}</span>
            </div>
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-200 border-2 border-emerald-100 flex items-center justify-center text-slate-600 font-bold text-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-40 pb-safe">
        {primaryNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "opacity-100" : "opacity-70")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-slate-500 hover:text-slate-800",
            isMobileMenuOpen ? "text-emerald-600" : ""
          )}
        >
          <Menu className={cn("w-5 h-5", isMobileMenuOpen ? "opacity-100" : "opacity-70")} />
          <span className="text-[10px] font-medium">المزيد</span>
        </button>
      </nav>

      {/* Mobile "More" Slide-up Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative bg-white rounded-t-2xl w-full p-6 flex flex-col animate-in slide-in-from-bottom-full duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-800">المزيد</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {secondaryNav.map(item => {
                const isActive = location.pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    to={item.href} 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-colors",
                      isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <item.icon className="w-5 h-5 opacity-80" />
                    <span className="font-semibold text-[15px]">{item.name}</span>
                  </Link>
                )
              })}
              <button 
                onClick={logout} 
                className="flex items-center gap-4 p-4 rounded-xl bg-red-50 text-red-600 mt-2 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5 opacity-80" />
                <span className="font-semibold text-[15px]">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
