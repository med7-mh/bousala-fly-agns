import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { t } from '../lib/translations';
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
  X,
  Globe,
  UserCircle,
  Compass,
  FileBarChart2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, logout, language, setLanguage, staffMembers, activeStaff, setActiveStaff, isSubscriptionExpired } = useStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pinModalStaff, setPinModalStaff] = useState<any>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const isExpired = isSubscriptionExpired();
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  useEffect(() => {
    if (isExpired) {
      setShowExpiredModal(true);
    }
  }, [isExpired]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  const primaryNav = [
    { name: t('dashboard', language), href: '/', icon: LayoutDashboard },
    { name: t('bookings', language), href: '/bookings', icon: Briefcase },
    { name: t('customers', language), href: '/customers', icon: Users },
    { name: t('cashier', language), href: '/transactions', icon: Receipt },
  ];

  const secondaryNav = [
    { name: t('suppliers', language), href: '/suppliers', icon: Building2 },
    { name: t('expenses', language), href: '/expenses', icon: ReceiptText },
    { name: 'التقارير', href: '/reports', icon: FileBarChart2 },
    { name: 'الموظفين والعمال', href: '/employees', icon: Users },
    ...(user.role === 'admin' ? [{ name: t('settings', language), href: '/settings', icon: Settings }] : []),
    ...(user.email === '22247071347@bosla.app' ? [{ name: 'إدارة النظام', href: '/admin', icon: Settings }] : []),
  ];

  const navigation = [...primaryNav, ...secondaryNav];

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex w-64 bg-white border-slate-200 flex-col py-6 shrink-0",
        language === 'ar' ? "border-l" : "border-r"
      )}>
        <div className="flex items-center px-6 pb-8 gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
            <Compass className="w-5 h-5" />
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
                  "flex items-center px-6 py-3 text-[15px] font-medium transition-all border-emerald-600",
                  language === 'ar' ? 'border-r-[3px]' : 'border-l-[3px]',
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon className={cn("w-5 h-5 opacity-70", language === 'ar' ? 'ml-3' : 'mr-3')} />
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
            <LogOut className={cn("w-5 h-5 opacity-70", language === 'ar' ? 'ml-3' : 'mr-3')} />
            {t('logout', language)}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        {/* Banner */}
        {isExpired && (
           <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 md:px-8 text-center text-amber-800 text-sm font-medium z-10">
              عذراً، لقد انتهت الفترة التجريبية. للتجديد ومواصلة العمل، يرجى تفعيل الاشتراك من الإعدادات أو التواصل عبر واتساب على <a href="https://wa.me/22247071310" target="_blank" className="font-bold underline text-amber-900" rel="noreferrer">22247071310</a>.
           </div>
        )}
        
        {/* Header */}
        <header className="h-16 md:h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700 tracking-tight">بوصله</div>
          </div>

          <div className={cn("hidden md:block relative flex-1 max-w-md", language === 'ar' ? "ml-4" : "mr-4")}>
            <Search className={cn("w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400", language === 'ar' ? "right-4" : "left-4")} />
            <input 
              type="text" 
              className={cn(
                "bg-slate-100 rounded-full py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors",
                language === 'ar' ? "pr-10 pl-4" : "pl-10 pr-4"
              )}
              placeholder={t('search', language)}
            />
          </div>

          <div className="flex items-center gap-4">
            {staffMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-slate-400 hidden sm:block" />
                <select 
                  value={activeStaff?.name || ''} 
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    if (!selectedName) {
                       setActiveStaff(null);
                    } else {
                       const staff = staffMembers.find(s => s.name === selectedName);
                       if (staff) {
                          setPinModalStaff(staff);
                          setPinInput('');
                          setPinError(false);
                       }
                    }
                  }}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 px-2 py-1 rounded-lg w-full max-w-[150px] truncate"
                >
                  <option value="">{user.name} ({language === 'ar' ? 'أساسي' : 'Principal'})</option>
                  {staffMembers.map(staff => (
                    <option key={staff.name} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button 
              onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-semibold transition-colors"
            >
              <Globe className="w-4 h-4" />
              {language === 'ar' ? 'FR' : 'عربي'}
            </button>
            
            <div className="flex items-center gap-3">
              <div className={cn("hidden sm:block", language === 'ar' ? "text-left" : "text-right")}>
                <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
                <span className="block text-[11px] text-slate-400">{user.role === 'admin' ? (language === 'ar' ? 'المدير العام' : 'Directeur Général') : (language === 'ar' ? 'موظف' : 'Employé')}</span>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-200 border-2 border-emerald-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                {user.name.charAt(0)}
              </div>
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

      {/* PIN Verification Modal */}
      {pinModalStaff && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xs shadow-xl text-center">
            <UserCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">{pinModalStaff.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{language === 'ar' ? 'أدخل الرمز السري للمتابعة' : 'Veuillez saisir votre code PIN'}</p>
            
            <input 
              type="password"
              autoFocus
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => {
                 if(e.key === 'Enter') {
                   if(pinInput === pinModalStaff.pin) {
                     setActiveStaff(pinModalStaff);
                     setPinModalStaff(null);
                   } else {
                     setPinError(true);
                   }
                 }
              }}
              className={cn("w-full text-center tracking-[1em] font-bold text-xl px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:outline-none mb-4", pinError ? "border-red-500 focus:ring-red-500" : "focus:ring-emerald-500")}
            />
            {pinError && <p className="text-xs text-red-500 mb-4">{language === 'ar' ? 'الرمز غير صحيح' : 'Code PIN incorrect'}</p>}
            
            <div className="flex gap-2">
              <button 
                onClick={() => setPinModalStaff(null)} 
                className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {t('cancel', language)}
              </button>
              <button 
                onClick={() => {
                   if(pinInput === pinModalStaff.pin) {
                     setActiveStaff(pinModalStaff);
                     setPinModalStaff(null);
                   } else {
                     setPinError(true);
                   }
                }}
                className="flex-1 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
              >
                {language === 'ar' ? 'دخول' : 'Entrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Expired Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowExpiredModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
               <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">انتهت الفترة التجريبية</h3>
               <p className="text-slate-600 mb-6 text-[15px] leading-relaxed">
                 لقد انتهت فترة الـ 7 أيام التجريبية المجانية. الآن إمكانيات التطبيق مقيدة ولا يمكنك إضافة بيانات جديدة. نرجو تفعيل الاشتراك لمواصلة العمل.
               </p>
               
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-2">للحصول على قسيمة تفعيل، يرجى التواصل عبر يواتساب:</p>
                  <a href="https://wa.me/22247071310" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                     22247071310
                  </a>
               </div>

               <Link 
                 to="/settings"
                 onClick={() => setShowExpiredModal(false)}
                 className="block w-full text-center bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
               >
                 إدخال رمز القسيمة
               </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
