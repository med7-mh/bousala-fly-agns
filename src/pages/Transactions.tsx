import React, { useState } from 'react';
import { useStore, TransactionType } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Transactions() {
  const { transactions, bookings, customers, suppliers, addTransaction } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('income');

  const filteredTransactions = transactions.filter(t => 
    t.description.includes(searchTerm)
  );

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Adding payment method to the interface inside useStore already exists.
  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bookingId = formData.get('booking_id') as string;
    const supplierId = formData.get('supplier_id') as string;

    addTransaction({
      type: txType,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      booking_id: bookingId === "" ? undefined : bookingId,
      supplier_id: supplierId === "" ? undefined : supplierId,
      payment_method: formData.get('payment_method') as string,
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-500">إجمالي المقبوضات</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalIncome)}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-500">إجمالي المدفوعات</h3>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-500">الرصيد الحالي</h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <span className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {balance >= 0 ? '+' : '-'}
              </span>
            </div>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(balance))}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="ابحث في العمليات..."
              className="bg-slate-100 rounded-full pr-10 pl-4 py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full sm:w-auto">
            <Filter className="w-4 h-4" />
            تصفية
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة عملية
        </button>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">التاريخ</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">النوع</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">المبلغ</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">وسيلة الدفع</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">الوصف</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">مرتبط بحجز</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => {
                const booking = transaction.booking_id ? bookings.find(b => b.id === transaction.booking_id) : null;
                const customer = booking ? customers.find(c => c.id === booking.customer_id) : null;
                
                return (
                  <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-500 whitespace-nowrap" dir="ltr">
                      {new Date(transaction.date || '').toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${
                        transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {transaction.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {transaction.type === 'income' ? 'مقبوضات (سند قبض)' : transaction.type === 'operating_expense' ? 'مصروف تشغيلي' : 'مدفوعات (سند صرف)'}
                      </span>
                    </td>
                    <td className={`py-3.5 px-2 border-b border-slate-50 text-[14px] font-bold whitespace-nowrap ${
                      transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-700 whitespace-nowrap">
                      {transaction.payment_method || 'نقدي (كاش)'}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 min-w-[150px]">{transaction.description}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-500 whitespace-nowrap">
                      {booking ? (
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-medium">{customer?.name}</span>
                          <span className="text-[12px]" dir="ltr">#{booking.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    لا توجد عمليات مالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">إضافة عملية مالية</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">نوع العملية</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                    <input required type="radio" name="type" value="income" checked={txType === 'income'} onChange={(e) => setTxType(e.target.value as TransactionType)} className="hidden" />
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-800">مقبوضات</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                    <input required type="radio" name="type" value="expense" checked={txType === 'expense'} onChange={(e) => setTxType(e.target.value as TransactionType)} className="hidden" />
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-slate-800">مدفوعات/للمورد</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">المبلغ (أوقية)</label>
                  <input required name="amount" type="number" min="0" step="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">طريقة الدفع/الاستلام</label>
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
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">البيان/الوصف</label>
                <input required name="description" type="text" placeholder="مثال: دفعة مقدمة لتذكرة ذهاب فقط" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
              </div>
              {txType === 'expense' && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">مرتبط بمورد (اختياري)</label>
                  <select name="supplier_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                    <option value="">بدون مورد...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {txType === 'income' && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">مرتبط بحجز (اختياري)</label>
                  <select name="booking_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                    <option value="">بدون حجز...</option>
                    {bookings.map(b => {
                      const customer = customers.find(c => c.id === b.customer_id);
                      return (
                        <option key={b.id} value={b.id}>
                          {customer?.name} - {b.description}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                  حفظ العملية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
