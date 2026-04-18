import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore, User } from '../store/useStore';
import toast from 'react-hot-toast';
import { Shield, Users, Save, ShieldAlert, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface Profile extends User {} // reuse user type

export default function Settings() {
  const { user, transactions, bookings } = useStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('agency_id', user?.agency_id);
    if (!error && data) {
      setProfiles(data.map(p => ({
        id: p.id,
        agency_id: p.agency_id,
        name: p.full_name,
        role: p.role
      })));
    }
  };

  const updateRole = async (profileId: string, newRole: 'admin' | 'agent') => {
    const toastId = toast.loading('جاري تحديث الصلاحيات...');
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
    if (!error) {
      toast.success('تم التحديث بنجاح', { id: toastId });
      fetchProfiles();
    } else {
      toast.error('حدث خطأ أثناء التحديث', { id: toastId });
    }
  };

  // Generate Daily Report
  const dailyTransactions = transactions.filter(t => t.date && t.date.startsWith(reportDate));
  const dailyBookings = bookings.filter(b => b.created_at && b.created_at.startsWith(reportDate));
  
  const dailyIncome = dailyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const dailyExpense = dailyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const dailyProfit = dailyBookings.reduce((sum, b) => sum + (b.selling_price - b.cost_price), 0);

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <ShieldAlert className="w-16 h-16 mb-4 text-red-300" />
        <h2 className="text-xl font-bold">عذراً، لا تملك صلاحية الوصول</h2>
        <p>هذه الصفحة مخصصة لمدير الوكالة فقط.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">إعدادات الوكالة</h1>
        <p className="text-slate-500 text-sm">إدارة الموظفين والصلاحيات، والاطلاع على التقارير اليومية.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* User Management */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-[17px] font-bold text-slate-800">إدارة الموظفين</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {profiles.map(profile => (
              <div key={profile.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{profile.name}</h3>
                    <p className="text-[12px] text-slate-500">{profile.role === 'admin' ? 'مدير عام (أدمن)' : 'موظف مبيعات'}</p>
                  </div>
                </div>
                {profile.id !== user.id ? (
                  <select
                    value={profile.role}
                    onChange={(e) => updateRole(profile.id, e.target.value as 'admin' | 'agent')}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="agent">موظف مبيعات</option>
                    <option value="admin">مدير عام</option>
                  </select>
                ) : (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-medium text-xs rounded-lg whitespace-nowrap">
                    حسابك الحالي
                  </span>
                )}
              </div>
            ))}
            
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-[13px] text-slate-600">
              <span className="font-bold block mb-1">💡 كيف أضيف موظف جديد؟</span>
              يمكن للموظفين الجدد التسجيل من شاشة "إنشاء حساب"، وسيتم إضافتهم تلقائياً بصلاحية "موظف" إلى وكالتك بمجرد تسجيلهم باستخدام نفس اسم الوكالة، وبعدها يمكنك ترقيتهم لمدراء من هنا.
            </div>
          </div>
        </section>

        {/* Daily Report */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-fit">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-[17px] font-bold text-slate-800">تقرير اليومية (الكاشير)</h2>
            </div>
            <input 
              type="date" 
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span className="text-[13px] font-medium text-emerald-800">مقبوضات الصندوق</span>
              </div>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(dailyIncome)}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-[13px] font-medium text-red-800">منصرفات الصندوق</span>
              </div>
              <p className="text-xl font-bold text-red-700">{formatCurrency(dailyExpense)}</p>
            </div>
            <div className="col-span-2 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-slate-600">صافي الحركة النقدية اليومية</span>
                <span className={`text-[13px] font-bold ${dailyIncome - dailyExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {dailyIncome - dailyExpense >= 0 ? 'فائض' : 'عجز'}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(Math.abs(dailyIncome - dailyExpense))}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-[14px] font-bold text-slate-800 mb-3">ملخص الحجوزات اليوم</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">تم إنشاء</span>
                <span className="font-bold text-slate-800">{dailyBookings.length} حجوزات</span>
              </li>
              <li className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">حجم مبيعات اليوم</span>
                <span className="font-bold text-slate-800">{formatCurrency(dailyBookings.reduce((sum, b) => sum + b.selling_price, 0))}</span>
              </li>
              <li className="flex justify-between items-center text-[13px] pt-3 border-t border-slate-50">
                <span className="text-slate-500 font-semibold">أرباح اليوم المتوقعة</span>
                <span className="font-bold text-emerald-600">{formatCurrency(dailyProfit)}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
