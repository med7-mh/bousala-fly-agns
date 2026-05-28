import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { Download, TrendingUp, TrendingDown, BookOpen, Briefcase, FileText, Camera, Plane, Building, Target, PieChart, Users, Receipt, Map } from 'lucide-react';
import { t } from '../lib/translations';

export default function Reports() {
  const { transactions, bookings, language } = useStore();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      let match = true;
      if (dateFrom) {
         if (new Date(t.date) < new Date(dateFrom)) match = false;
      }
      if (dateTo) {
         const endOfDateTo = new Date(dateTo);
         endOfDateTo.setHours(23, 59, 59, 999);
         if (new Date(t.date) > endOfDateTo) match = false;
      }
      return match;
    });
  }, [transactions, dateFrom, dateTo]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // If we have created_at, use it, else fallback to finding a transaction related to it
      // or assume it's in range if no date is set.
      if (!b.created_at) {
        // Fallback: check related income transaction
        const relatedTx = transactions.find(t => t.booking_id === b.id);
        if (relatedTx) {
          const tDate = new Date(relatedTx.date);
          if (dateFrom && tDate < new Date(dateFrom)) return false;
          if (dateTo) {
            const endOfDateTo = new Date(dateTo);
            endOfDateTo.setHours(23, 59, 59, 999);
            if (tDate > endOfDateTo) return false;
          }
          return true;
        }
        // If really no date, ignore filtering or include it? Let's just include it.
        if (dateFrom || dateTo) return false; 
        return true;
      }
      const bDate = new Date(b.created_at);
      if (dateFrom && bDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const endOfDateTo = new Date(dateTo);
        endOfDateTo.setHours(23, 59, 59, 999);
        if (bDate > endOfDateTo) return false;
      }
      return true;
    });
  }, [bookings, dateFrom, dateTo, transactions]);


  // Transactions Summaries
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'operating_expense').reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  // Bookings Summaries
  const totalBookingCost = filteredBookings.reduce((sum, b) => sum + (b.cost_price || 0), 0);
  const totalBookingRevenue = filteredBookings.reduce((sum, b) => sum + (b.selling_price || 0), 0);
  const expectedProfit = totalBookingRevenue - totalBookingCost;

  const bookingsByType = filteredBookings.reduce((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getBookingTypeLabel = (type: string) => {
    switch (type) {
      case 'flight': return 'تذاكر طيران';
      case 'hotel': return 'حجوزات فندقية';
      case 'visa': return 'تأشيرات';
      case 'tour': return 'رحلات سياحية';
      case 'passport': return 'جوازات واستمارات';
      default: return type;
    }
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5 text-blue-500" />;
      case 'hotel': return <Building className="w-5 h-5 text-indigo-500" />;
      case 'visa': return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'tour': return <Map className="w-5 h-5 text-orange-500" />;
      case 'passport': return <BookOpen className="w-5 h-5 text-purple-500" />;
      default: return <Briefcase className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 print-section" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-3xl font-bold text-slate-800">التقرير الشامل للوكالة</h1>
        <p className="text-slate-500 mt-2">
          {dateFrom || dateTo ? `الفترة: ${dateFrom || 'البداية'} إلى ${dateTo || 'النهاية'}` : `تاريخ إصدار التقرير: ${new Date().toLocaleDateString('en-GB')}`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">التقارير والإحصائيات</h1>
          <p className="text-sm text-slate-500 mt-1">ملخص النشاط المالي والتشغيلي للوكالة</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
        >
          <Download className="w-5 h-5" />
          <span className="font-medium">تصدير التقرير PDF</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end no-print">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[13px] font-semibold text-slate-600 mb-1">من تاريخ</label>
          <input 
            type="date" 
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[13px] font-semibold text-slate-600 mb-1">إلى تاريخ</label>
          <input 
            type="date" 
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
          />
        </div>
        <button 
          onClick={() => { setDateFrom(''); setDateTo(''); }}
           className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
        >
          كل الأوقات
        </button>
      </div>

      {/* Financial Overview Cards */}
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-8">
         <PieChart className="w-5 h-5 text-indigo-500" />
         الملخص المالي للخزينة (المقبوضات والمدفوعات)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 flex items-center justify-between">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
             <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-left" dir="ltr">
             <div className="text-[13px] font-semibold text-emerald-800 text-right">المقبوضات (إيرادات)</div>
             <p className="text-2xl font-bold text-emerald-600 text-right">{formatCurrency(totalIncome, t('currency', language))}</p>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-xl border border-red-100 p-5 flex items-center justify-between">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
             <TrendingDown className="w-6 h-6" />
          </div>
          <div className="text-left" dir="ltr">
             <div className="text-[13px] font-semibold text-red-800 text-right">المدفوعات (مصروفات)</div>
             <p className="text-2xl font-bold text-red-600 text-right">{formatCurrency(totalExpense, t('currency', language))}</p>
          </div>
        </div>

        <div className={`rounded-xl border p-5 flex items-center justify-between ${netCashFlow >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${netCashFlow >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
             <Receipt className="w-6 h-6" />
          </div>
          <div className="text-left" dir="ltr">
             <div className={`text-[13px] font-semibold text-right ${netCashFlow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>صافي حركة الخزينة</div>
             <p className={`text-2xl font-bold text-right ${netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(netCashFlow, t('currency', language))}
             </p>
          </div>
        </div>
      </div>

      {/* Operational Overview Cards */}
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-10">
         <Target className="w-5 h-5 text-blue-500" />
         ملخص المبيعات والحجوزات المتوقعة
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
           <div className="text-sm font-semibold text-slate-500 mb-1">إجمالي تكلفة الخدمات المؤداة</div>
           <p className="text-xl font-bold text-slate-800 mt-2">{formatCurrency(totalBookingCost, t('currency', language))}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
           <div className="text-sm font-semibold text-slate-500 mb-1">إجمالي قيمة مبيعات الخدمات (الدخل المتوقع)</div>
           <p className="text-xl font-bold text-slate-800 mt-2">{formatCurrency(totalBookingRevenue, t('currency', language))}</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-900 p-5 shadow-sm text-white">
           <div className="text-sm font-semibold text-slate-300 mb-1">أرباح المبيعات التقريبية</div>
           <p className="text-2xl font-bold text-emerald-400 mt-2">{formatCurrency(expectedProfit, t('currency', language))}</p>
        </div>
      </div>

      {/* Services Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
           <h3 className="font-bold text-slate-700">تحليل تفصيلي بالخدمات المقدمة</h3>
           <span className="text-sm font-bold bg-slate-200 px-3 py-1 rounded-full text-slate-700">{filteredBookings.length} خدمة إجمالاً</span>
        </div>
        <div className="p-5">
           {Object.keys(bookingsByType).length === 0 ? (
             <div className="text-center py-6 text-slate-500">لا توجد خدمات مسجلة في هذه الفترة</div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {Object.entries(bookingsByType).map(([type, count]) => {
                 const typeCost = filteredBookings.filter(b => b.type === type).reduce((s, b) => s + (b.cost_price || 0), 0);
                 const typeRev = filteredBookings.filter(b => b.type === type).reduce((s, b) => s + (b.selling_price || 0), 0);
                 const typeProfit = typeRev - typeCost;
                 
                 return (
                   <div key={type} className="flex flex-col p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                     <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                       <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center justify-center">
                         {getBookingTypeIcon(type)}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800">{getBookingTypeLabel(type)}</h4>
                         <span className="text-xs font-semibold text-slate-500">{count} عمليه</span>
                       </div>
                     </div>
                     <div className="flex justify-between items-center text-sm mb-1">
                       <span className="text-slate-500">مبيعات:</span>
                       <span className="font-semibold text-slate-800">{formatCurrency(typeRev, t('currency', language))}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm pt-2 mt-1 border-t border-slate-100">
                       <span className="text-slate-500">الربح:</span>
                       <span className="font-bold text-emerald-600">{formatCurrency(typeProfit, t('currency', language))}</span>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

