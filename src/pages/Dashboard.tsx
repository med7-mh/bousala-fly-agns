import React, { useState } from 'react';
import { useStore, TransactionType } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { 
  FileText, 
  Copy, 
  PlaneTakeoff, 
  ReceiptText, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { transactions, addTransaction } = useStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Quick Action Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  // Filter Transactions by Selected Date
  const dailyTransactions = transactions.filter(t => {
    const tDate = new Date(t.date).toISOString().split('T')[0];
    return tDate === selectedDate;
  });

  const totalIncome = dailyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = dailyTransactions
    .filter(t => t.type === 'expense' || t.type === 'operating_expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const openQuickAction = (title: string, type: TransactionType, defaultAmount: number, defaultDesc: string) => {
    setActionTitle(title);
    setActionType(type);
    setAmount(defaultAmount);
    setDescription(defaultDesc);
    setIsModalOpen(true);
  };

  const handleQuickActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    await addTransaction({
      type: actionType,
      amount: amount,
      description: description,
      date: new Date().toISOString()
    });

    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">اليومية والصندوق</h1>
          <p className="text-sm text-slate-500 mt-1">تسجيل العمليات السريعة وملخص حسابات اليوم</p>
        </div>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* POS Quick Buttons */}
      {selectedDate === new Date().toISOString().split('T')[0] && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => openQuickAction('تعبئة استمارة', 'income', 100, 'استمارة')}
            className="bg-white border hover:border-emerald-500 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
              <FileText className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">استمارة</span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">Formulaire</span>
          </button>

          <button 
            onClick={() => openQuickAction('تصوير مستندات', 'income', 50, 'تصوير')}
            className="bg-white border hover:border-emerald-500 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
              <Copy className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">تصوير</span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">Photocopie</span>
          </button>

          <button 
            onClick={() => openQuickAction('إجراءات تأشيرة', 'income', 500, 'تأشيرة')}
            className="bg-white border hover:border-emerald-500 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
              <PlaneTakeoff className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">تأشيرة</span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">Visa</span>
          </button>

          <button 
            onClick={() => openQuickAction('مصروفات نثرية', 'operating_expense', 0, 'مصروفات')}
            className="bg-white border hover:border-red-500 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
              <ReceiptText className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">مصروف</span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">Dépense</span>
          </button>
        </div>
      )}

      {/* Daily Summary */}
      <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-700 rounded-full opacity-50 blur-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 text-sm flex items-center gap-2"><ArrowDownCircle className="w-4 h-4 text-emerald-400" /> إجمالي المقبوضات</span>
            <span className="text-2xl font-bold">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex flex-col gap-1 md:border-r border-slate-700 md:pr-6">
            <span className="text-slate-400 text-sm flex items-center gap-2"><ArrowUpCircle className="w-4 h-4 text-red-400" /> إجمالي المنصرف</span>
            <span className="text-2xl font-bold">{formatCurrency(totalExpense)}</span>
          </div>
          <div className="flex flex-col gap-1 md:border-r border-slate-700 md:pr-6">
            <span className="text-slate-400 text-sm">صافي الصندوق (الرصيد)</span>
            <span className={`text-3xl font-extrabold ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Ledger Details */}
      <section className="bg-white rounded-xl border border-slate-200 flex flex-col flex-1 min-h-[300px]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 text-[15px]">تفاصيل حركات اليوم</h3>
        </div>
        <div className="overflow-x-auto p-4">
          {dailyTransactions.length > 0 ? (
            <div className="space-y-3">
              {dailyTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'income' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{t.description}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(t.date).toLocaleTimeString('ar-MR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <ReceiptText className="w-12 h-12 mb-3 opacity-20" />
              <p>لا توجد حركات مالية مسجلة في هذا اليوم</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">{actionTitle}</h3>
            <form onSubmit={handleQuickActionSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">المبلغ (أوقية)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-lg font-bold"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">البيان / الوصف</label>
                <input 
                  type="text" 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  إلغاء
                </button>
                <button type="submit" className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${actionType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  حفظ وتسجيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
