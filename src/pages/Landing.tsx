import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Briefcase, Receipt, Users, Building2, Globe, ShieldCheck, PieChart, ArrowLeft, Download } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-emerald-900 tracking-tight">بوصله</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/download')}
              className="text-emerald-700 font-semibold hover:text-emerald-600 transition-colors flex items-center gap-1 bg-emerald-50 px-4 py-2 rounded-lg"
            >
              <Download className="w-4 h-4"/> تحميل التطبيق
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="hidden sm:block text-slate-600 font-semibold hover:text-emerald-600 transition-colors"
            >
              تسجيل الدخول
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="hidden sm:block bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              حساب جديد
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-emerald-100/50 rounded-full blur-3xl" />
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-right">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                الإدارة الذكية <br/>
                <span className="text-emerald-500">لوكالات السفر</span> الحديثة
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                منصة متكاملة تدير حجوزاتك، عملاءك، حسابات الموردين، وإيراداتك اليومية في مكان واحد. وفّر وقتك وضاعف أرباحك مع بوصلة.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 group"
                >
                  ابدأ مجاناً الآن
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  تسجيل الدخول
                </button>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="flex-1 w-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Dashboard Mockup */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 h-32 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col justify-center px-6">
                    <div className="w-8 h-8 rounded-full bg-emerald-200 mb-4" />
                    <div className="h-4 w-1/2 bg-emerald-400 rounded mb-2" />
                    <div className="h-3 w-1/3 bg-emerald-200 rounded" />
                  </div>
                  <div className="flex-1 h-32 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center px-6 hidden sm:flex">
                    <div className="w-8 h-8 rounded-full bg-slate-200 mb-4" />
                    <div className="h-4 w-1/2 bg-slate-300 rounded mb-2" />
                    <div className="h-3 w-1/3 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-lg flex items-center px-4 gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 w-1/3 bg-slate-300 rounded mb-2" />
                        <div className="h-2 w-1/4 bg-slate-200 rounded" />
                      </div>
                      <div className="h-4 w-16 bg-emerald-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">كل ما تحتاجه لإدارة وكالتك</h2>
            <p className="text-slate-600 text-lg">منصة مصممة خصيصاً لتلبية احتياجات وكالات السفر والسياحة وتسهيل مهامها اليومية.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Briefcase}
              title="إدارة الحجوزات"
              desc="أصدر التذاكر والتأشيرات وتتبع حالتها مع واجهة سريعة وفعّالة تسجل كافة التفاصيل."
            />
            <FeatureCard 
              icon={Receipt}
              title="الكاشير واليومية"
              desc="راقب السيولة النقدية والمقبوضات والمصروفات بصورة فورية وتعرف على صافي حركتك النقدية."
            />
            <FeatureCard 
              icon={Users}
              title="قاعدة العملاء"
              desc="احتفظ ببيانات عملائك وأرصدتهم وعملياتهم لتوفير خدمة أسرع وأكثر تخصيصاً."
            />
            <FeatureCard 
              icon={Building2}
              title="كشوف الموردين"
              desc="تتبع ديونك لدى الموردين والمدفوعات والمتبقي بدقة عالية دون أخطاء محاسبية."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="صلاحيات الموظفين"
              desc="أضف موظفيك بكلمات مرور خاصة، مع دعم الصلاحيات كنقاط بيع، أو كمدير عام."
            />
            <FeatureCard 
              icon={Globe}
              title="دعم لغات متعددة"
              desc="واجهة مرنة تعمل باللغتين العربية والفرنسية بضغطة زر لدعم بيئة العمل المتعددة."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
           <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                 <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#grid)" />
           </svg>
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold mb-6">مستعد للتحول الرقمي؟</h2>
          <p className="text-emerald-100 text-xl mb-10">
            انضم إلى وكالات السفر الذكية وابدأ في إدارة أعمالك باحترافية اليوم.
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
          >
            أنشئ حساب وكالتك الآن
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-500" />
            <span className="text-white font-bold text-lg">بوصله</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} نظام بوصله - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 mb-6 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
        <Icon className="w-7 h-7 text-emerald-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
