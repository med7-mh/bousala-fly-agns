import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Settings, Plus, Key, Calendar, Tag, Trash, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

interface Coupon {
  id: string;
  code: string;
  type: 'monthly' | 'yearly';
  is_used: boolean;
  used_by_agency: string | null;
  created_at: string;
  used_at: string | null;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const user = useStore(state => state.user);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء جلب القسائم');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BOSLA-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = async (type: 'monthly' | 'yearly') => {
    if (!user || user.email !== '22247071347@bosla.app') {
       toast.error('غير مصرح لك بتوليد قسائم!');
       return;
    }
    
    setIsGenerating(true);
    const newCode = generateCode();

    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          code: newCode,
          type: type
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('تمت إضافة القسيمة بنجاح!');
      setCoupons(prev => [data, ...prev]);
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء توليد القسيمة');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القسيمة؟')) return;
    
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('تم حذف القسيمة');
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const copyToClipboard = (code: string) => {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast.success('تم نسخ الرمز');
  };

  if (user?.email !== '22247071347@bosla.app') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-2xl font-bold text-slate-800">غير مصرح لك بالوصول لهذه الصفحة</h2>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">إدارة القسائم والاشتراكات</h1>
          <p className="text-slate-600">صفحة خاصة بصلاحيات الآدمن لإنشاء قسائم تفعيل.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleGenerate('monthly')}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70"
          >
            <Plus className="w-5 h-5" />
            قسيمة اشتراك شهري
          </button>
          <button
            onClick={() => handleGenerate('yearly')}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70"
          >
            <Plus className="w-5 h-5" />
            قسيمة اشتراك سنوي
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
            <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
        ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-slate-500">لا توجد قسائم حالياً</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir="rtl">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-4 px-6 font-bold text-slate-600">رمز القسيمة</th>
                  <th className="py-4 px-6 font-bold text-slate-600">النوع</th>
                  <th className="py-4 px-6 font-bold text-slate-600">الحالة</th>
                  <th className="py-4 px-6 font-bold text-slate-600">تاريخ الإنشاء</th>
                  <th className="py-4 px-6 font-bold text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                            <code className="font-mono bg-slate-100 px-3 py-1 rounded-md text-slate-800 font-bold border border-slate-200 dir-ltr">{coupon.code}</code>
                            <button onClick={() => copyToClipboard(coupon.code)} className="text-slate-400 hover:text-emerald-600 transition-colors">
                                {copiedCode === coupon.code ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                        coupon.type === 'yearly' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {coupon.type === 'yearly' ? 'سنوي (365 يوم)' : 'شهري (30 يوم)'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                        coupon.is_used ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {coupon.is_used ? 'مُستخدمة' : 'متاحة'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(coupon.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-4 px-6">
                      {!coupon.is_used && (
                          <button 
                            onClick={() => handleDelete(coupon.id)}
                            className="text-slate-400 hover:text-red-500 bg-white shadow-sm border border-slate-200 p-2 rounded-lg transition-all hover:border-red-200 hover:bg-red-50"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
