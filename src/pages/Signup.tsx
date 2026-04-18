import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Compass, Briefcase, User, Mail, Lock, Phone } from 'lucide-react';

export default function Signup() {
  const user = useStore(state => state.user);
  const navigate = useNavigate();

  const [agencyName, setAgencyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const dummyEmail = `222${phone}@bosla.app`;
      // 1. Create purely Auth User
      const signupPromise = supabase.auth.signUp({
        email: dummyEmail,
        password,
      });

      // Increase timeout to 30s to account for Supabase free-tier cold starts
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 30000)
      );

      const response: any = await Promise.race([signupPromise, timeoutPromise]);
      const { data: authData, error: authError } = response || {};

      if (authError) throw authError;
      if (!authData || !authData.user) throw new Error("فشل إنشاء الحساب أو حدث خطأ في الشبكة");

      // If email confirmation is required, session might be null.
      // But typically it's disabled. If it's disabled, we have a session.
      
      // 2. Generate an ID locally to avoid the RLS "SELECT" chicken-and-egg problem
      // Because we can't SELECT from agencies until our profile is created!
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      const newAgencyId = generateUUID();

      // 3. Insert Agency directly (without .select() which gets blocked by RLS)
      const { error: agencyError } = await supabase
        .from('agencies')
        .insert([{ id: newAgencyId, name: agencyName }]);

      if (agencyError) {
        console.error("Agency Creation Error:", agencyError);
        // Clean up auth user if possible so they aren't stuck
        await supabase.auth.signOut().catch(() => {});
        throw new Error("تم إنشاء الحساب لكن تم حجب الوكالة. (خطأ في إدراج الوكالة)");
      }

      // 4. Insert Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          agency_id: newAgencyId,
          full_name: fullName,
          role: 'admin'
        }]);

      if (profileError) {
        console.error("Profile Creation Error:", profileError);
        throw new Error("فشل في إنشاء الملف الشخصي (Profiles).");
      }

      toast.success('تم إنشاء حساب الوكالة بنجاح! مرحباً بك');
      // Successfully created everything, push to login or home
      navigate('/');
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = err.message || 'حدث خطأ أثناء التسجيل';
      
      if (err.message === 'TIMEOUT') {
        errorMessage = 'الخادم يستغرق وقتاً طويلاً. يرجى التحقق من اتصال الإنترنت، أو سجلات Supabase.';
      } else if (err.message) {
        if (err.message.includes('User already registered') || err.message.includes('already exists')) {
          errorMessage = 'رقم الهاتف هذا مسجل مسبقاً في النظام. يرجى تسجيل الدخول.';
        } else if (err.message.includes('Password should be at least')) {
          errorMessage = 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'يرجى تفعيل الحساب أو التأكد من إعدادات Supabase (تعطيل Confirm Email)';
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-6 text-center">
          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">تسجيل وكالة جديدة</h1>
          <p className="text-slate-400 text-xs">نظام بوصلة لإدارة وكالات السفر</p>
        </div>
        
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">اسم الوكالة</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                  placeholder="وكالة الصقر للسياحة"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">اسمك الكامل</label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                  placeholder="أحمد محمد"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">رقم الهاتف الجوال</label>
              <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 bg-slate-50 focus-within:bg-white transition-colors" dir="ltr">
                <div className="bg-slate-100/50 px-3 flex items-center justify-center border-r border-slate-200 text-slate-500 font-bold text-sm">
                  +222
                </div>
                <div className="relative flex-1">
                  <input 
                    type="tel" 
                    required
                    maxLength={8}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 focus:outline-none text-sm tracking-widest"
                    placeholder="4XXXXXXX"
                  />
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">البريد الإلكتروني (اختياري)</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                  placeholder="admin@agency.com"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? 'جاري الإنشاء...' : 'انضم الآن مجاناً'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">
              لديك وكالة بالفعل؟ {' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
