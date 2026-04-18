import React, { useState } from 'react';
import { useStore, TransactionType } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Filter, Receipt, Coffee, Zap, Building, Car, Briefcase } from 'lucide-react';

export default function Expenses() {
  const { transactions, addTransaction } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter only operating expenses
  const operatingExpenses = transactions.filter(t => t.type === 'operating_expense');

  const filteredExpenses = operatingExpenses.filter(t => 
    t.description.includes(searchTerm) || (t.payment_method || '').includes(searchTerm)
  );

  const totalExpense = operatingExpenses.reduce((sum, t) => sum + t.amount, 0);

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as string;
    const desc = formData.get('description') as string;

    addTransaction({
      type: 'operating_expense',
      amount: Number(formData.get('amount')),
      description: `[${category}] ${desc}`,
      payment_method: formData.get('payment_method') as string,
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
  };

  const getCategoryIcon = (desc: string) => {
    if (desc.includes('إيجار')) return <Building className="w-4 h-4 text-purple-500" />;
    if (desc.includes('رواتب')) return <Briefcase className="w-4 h-4 text-blue-500" />;
    if (desc.includes('نقل') || desc.includes('سيارة')) return <Car className="w-4 h-4 text-orange-500" />;
    if (desc.includes('ضيافة') || desc.includes('بوفيه')) return <Coffee className="w-4 h-4 text-amber-500" />;
    if (desc.includes('كهرباء') || desc.includes('انترنت')) return <Zap className="w-4 h-4 text-yellow-500" />;
    return <Receipt className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-500">إجمالي المصروفات الإدارية</h3>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalExpense)}</p>
          <span className="text-xs text-slate-400 mt-1">يُخصم تلقائياً من الأرباح الصافية</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="ابحث في المصروفات..."
            className="bg-slate-100 rounded-full pr-10 pl-4 py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          سند صرف جديد (إداري)
        </button>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">التاريخ</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">البيان / التصنيف</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">المبلغ</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">وسيلة الدفع</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-500 whitespace-nowrap" dir="ltr">
                    {new Date(expense.date || '').toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        {getCategoryIcon(expense.description)}
                      </div>
                      {expense.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] font-bold text-red-600 whitespace-nowrap">
                    -{formatCurrency(expense.amount)}
                  </td>
                  <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-600 whitespace-nowrap">
                    {expense.payment_method || 'نقدي'}
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    لا توجد مصروفات إدارية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">تسجيل مصروف إداري جديد</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">المبلغ (أوقية)</label>
                  <input required name="amount" type="number" min="0" step="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">طريقة الدفع</label>
                  <select name="payment_method" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                    <option value="نقدي (كاش)">نقدي (كاش)</option>
                    <option value="بنكيلي (Bankily)">بنكيلي (Bankily)</option>
                    <option value="سداد (Sadad)">سداد (Sadad)</option>
                    <option value="مصرفي (Masrivi)">مصرفي (Masrivi)</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">تصنيف المصروف</label>
                <select name="category" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                  <option value="رواتب وأجور">رواتب وأجور</option>
                  <option value="إيجار">إيجار المكتب</option>
                  <option value="كهرباء وماء">كهرباء وماء</option>
                  <option value="انترنت واتصالات">انترنت واتصالات</option>
                  <option value="بوفيه وضيافة">بوفيه وضيافة (نثرية)</option>
                  <option value="نقل ومواصلات">نقل ومواصلات</option>
                  <option value="تسويق وإعلان">تسويق وإعلان</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">البيان/الوصف (التفاصيل)</label>
                <input required name="description" type="text" placeholder="مثال: راتب موظف الاستقبال لشهر مارس" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                  تسجيل المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
