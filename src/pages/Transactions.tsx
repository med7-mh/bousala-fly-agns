import React, { useState, useEffect } from 'react';
import { useStore, TransactionType, Transaction } from '../store/useStore';
import { formatCurrency, parseDescriptionWithStaff, cn, getCleanDescription } from '../lib/utils';
import { t } from '../lib/translations';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Wallet, Landmark, Smartphone, CreditCard, Banknote, Edit2, Trash2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Transactions() {
  const { transactions, bookings, customers, suppliers, addTransaction, updateTransaction, deleteTransaction, language, activeStaff } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [filterType, setFilterType] = useState('all');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const [txType, setTxType] = useState<TransactionType>('income');

  useEffect(() => {
    if (editingTransaction) {
      setTxType(editingTransaction.type);
    } else {
      setTxType('income');
    }
  }, [editingTransaction]);

  // If the user is a normal staff, they should only see their own transactions. Manager / Admin sees all.
  const visibleTransactions = transactions.filter(t => {
    if (activeStaff?.role === 'staff') {
      const { staffName } = parseDescriptionWithStaff(t.description);
      return staffName === activeStaff.name;
    }
    return true;
  });

  const filteredTransactions = visibleTransactions.filter(t => {
    const { staffName } = parseDescriptionWithStaff(t.description);
    
    let match = true;
    if (searchTerm) {
      if (!t.description.toLowerCase().includes(searchTerm.toLowerCase())) match = false;
    }
    if (filterType !== 'all') {
      if (filterType === 'income' && t.type !== 'income') match = false;
      if (filterType === 'expense' && t.type !== 'expense' && t.type !== 'operating_expense') match = false;
      if (filterType === 'form' && !t.description.includes('استمارة')) match = false;
      if (filterType === 'photography' && !t.description.includes('تصوير')) match = false;
      if (filterType === 'visa' && !t.description.includes('تأشير')) match = false;
    }
    if (filterStaff && staffName !== filterStaff) {
      match = false;
    }
    if (filterDateFrom) {
       if (new Date(t.date) < new Date(filterDateFrom)) match = false;
    }
    if (filterDateTo) {
       const endOfDateTo = new Date(filterDateTo);
       endOfDateTo.setHours(23, 59, 59, 999);
       if (new Date(t.date) > endOfDateTo) match = false;
    }
    return match;
  });

  const totalIncome = visibleTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = visibleTransactions
    .filter(t => t.type === 'expense' || t.type === 'operating_expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const paymentMethodsList = [
    { id: 'cash', label: language === 'ar' ? 'نقدي' : 'Cash', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'bankily', label: language === 'ar' ? 'بنكيلي' : 'Bankily', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'masrivi', label: language === 'ar' ? 'مصرفي' : 'Masrivi', icon: Landmark, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'sedad', label: language === 'ar' ? 'سداد' : 'Sedad', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-50' }
  ];

  const getBalanceByMethod = (method: string) => {
    const methodTxs = visibleTransactions.filter(t => t.payment_method === method || (!t.payment_method && method === 'cash'));
    const income = methodTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = methodTxs.filter(t => t.type === 'expense' || t.type === 'operating_expense').reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bookingId = formData.get('booking_id') as string;
    const supplierId = formData.get('supplier_id') as string;

    const txData: Partial<Transaction> = {
      type: txType,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      booking_id: bookingId === "" ? undefined : bookingId,
      supplier_id: supplierId === "" ? undefined : supplierId,
      payment_method: formData.get('payment_method') as string,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txData);
    } else {
      addTransaction({
        ...txData,
        date: new Date().toISOString().split('T')[0],
      } as Omit<Transaction, 'id' | 'agency_id'>);
    }
    
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  const handleTransferSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const fromAccount = formData.get('from_account') as string;
    const toAccount = formData.get('to_account') as string;
    const description = formData.get('description') as string;

    if (amount <= 0) {
      toast.error('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }
    if (fromAccount === toAccount) {
      toast.error('لا يمكن التحويل لنفس الحساب');
      return;
    }

    const fromLabel = paymentMethodsList.find(m => m.id === fromAccount)?.label || fromAccount;
    const toLabel = paymentMethodsList.find(m => m.id === toAccount)?.label || toAccount;

    const baseDesc = description || `تحويل داخلي من ${fromLabel} إلى ${toLabel}`;

    // Expense from source account
    addTransaction({
      type: 'expense',
      amount: amount,
      description: baseDesc,
      payment_method: fromAccount,
      date: new Date().toISOString().split('T')[0],
    } as Omit<Transaction, 'id' | 'agency_id'>);

    // Income to destination account
    addTransaction({
      type: 'income',
      amount: amount,
      description: baseDesc,
      payment_method: toAccount,
      date: new Date().toISOString().split('T')[0],
    } as Omit<Transaction, 'id' | 'agency_id'>);

    setIsTransferModalOpen(false);
    toast.success('تم التحويل بنجاح');
  };

  return (
    <div className="flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-500">{t('total_income', language)}</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalIncome, t('currency', language))}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-500">{t('total_expense', language)}</h3>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalExpense, t('currency', language))}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-500">{t('balance', language)}</h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <span className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {balance >= 0 ? '+' : '-'}
              </span>
            </div>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(balance), t('currency', language))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentMethodsList.map(method => {
          const methodBalance = getBalanceByMethod(method.id);
          return (
            <div key={method.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method.bg}`}>
                  <method.icon className={`w-5 h-5 ${method.color}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">{method.label}</h3>
              </div>
              <div className="mt-2">
                <p className={`text-lg font-bold ${methodBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                  <span className="text-[11px] font-normal text-slate-400 ml-1">{t('currency', language)}</span>
                  {formatCurrency(methodBalance, '')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={t('search', language)}
              className={cn(
                "bg-slate-100 rounded-full py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors",
                language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            className={`border px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto ${isFilterOpen || filterType !== 'all' || filterStaff || filterDateFrom || filterDateTo ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4" />
            {t('filter', language)}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            {t('internal_transfer', language)}
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('add_transaction', language)}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[150px]">
             <label className="block text-[13px] font-semibold text-slate-600 mb-1">من تاريخ</label>
             <input 
               type="date"
               value={filterDateFrom}
               onChange={e => setFilterDateFrom(e.target.value)}
               className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
             />
          </div>
          <div className="flex-1 min-w-[150px]">
             <label className="block text-[13px] font-semibold text-slate-600 mb-1">إلى تاريخ</label>
             <input 
               type="date"
               value={filterDateTo}
               onChange={e => setFilterDateTo(e.target.value)}
               className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
             />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">نوع العملية</label>
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
            >
              <option value="all">الكل</option>
              <option value="income">إيرادات (قبض)</option>
              <option value="expense">مصروفات (صرف)</option>
              <option value="form">استمارة</option>
              <option value="photography">تصوير</option>
              <option value="visa">تأشيرة</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[13px] font-semibold text-slate-600 mb-1">مدخل العملية (الموظف)</label>
            <input 
              type="text"
              placeholder="اسم الموظف..."
              value={filterStaff}
              onChange={e => setFilterStaff(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
          <button 
            onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterType('all'); setFilterStaff(''); }}
            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            مسح الفلاتر
          </button>
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr>
                <th className={cn("py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap", language === 'ar' ? "text-right" : "text-left")}>{t('date_col', language)}</th>
                <th className={cn("py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap", language === 'ar' ? "text-right" : "text-left")}>{t('type_col', language)}</th>
                <th className={cn("py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap", language === 'ar' ? "text-right" : "text-left")}>{t('amount_col', language)}</th>
                <th className={cn("py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap", language === 'ar' ? "text-right" : "text-left")}>{t('method_col', language)}</th>
                <th className={cn("py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap", language === 'ar' ? "text-right" : "text-left")}>{t('desc_col', language)}</th>
                <th className={cn("py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap", language === 'ar' ? "text-right" : "text-left")}>{t('booking_col', language)}</th>
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
                    <td className={cn("py-3.5 px-2 border-b border-slate-50 text-[14px] whitespace-nowrap", language === 'ar' ? "text-right" : "text-left")}>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${
                        transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {transaction.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {transaction.type === 'income' ? t('transaction_income', language) : transaction.type === 'operating_expense' ? t('operating_expense_short', language) : t('transaction_expense', language)}
                      </span>
                    </td>
                    <td className={cn("py-3.5 px-2 border-b border-slate-50 text-[14px] font-bold whitespace-nowrap", language === 'ar' ? "text-right" : "text-left", transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600')} dir="ltr">
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, t('currency', language))}
                    </td>
                    <td className={cn("py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-700 whitespace-nowrap", language === 'ar' ? "text-right" : "text-left")}>
                      {t(transaction.payment_method as any || 'cash', language)}
                    </td>
                    <td className={cn("py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 min-w-[150px]", language === 'ar' ? "text-right" : "text-left")}>
                      {(() => {
                        const { text, staffName } = parseDescriptionWithStaff(transaction.description);
                        return (
                          <div className="flex items-center gap-2">
                            <span>{text}</span>
                            {staffName && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                👤 {staffName}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-4">
                        {booking ? (
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-medium">{customer?.name}</span>
                            <span className="text-[12px]" dir="ltr">#{booking.id.substring(0, 8).toUpperCase()}</span>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleOpenEditModal(transaction)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-block"
                            title="تعديل العملية"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setTransactionToDelete(transaction)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-block"
                            title="حذف العملية"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {t('no_financial_transactions', language)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add/Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">{editingTransaction ? t('edit_transaction_title', language) : t('add_transaction_title', language)}</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('transaction_type', language)}</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                    <input required type="radio" name="type" value="income" checked={txType === 'income'} onChange={(e) => setTxType(e.target.value as TransactionType)} className="hidden" />
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-800">{t('transaction_income', language)}</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                    <input required type="radio" name="type" value="expense" checked={txType === 'expense' || txType === 'operating_expense'} onChange={(e) => setTxType('expense' as TransactionType)} className="hidden" />
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-slate-800">{t('transaction_expense', language)}</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('amount', language)} ({t('currency', language)})</label>
                  <input defaultValue={editingTransaction?.amount} required name="amount" type="number" min="0" step="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('payment_receipt_method', language)}</label>
                  <select defaultValue={editingTransaction?.payment_method || 'cash'} name="payment_method" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                    <option value="cash">{t('cash', language)}</option>
                    <option value="bankily">{t('bankily', language)}</option>
                    <option value="masrivi">{t('masrivi', language)}</option>
                    <option value="sedad">{t('sedad', language)}</option>
                    <option value="other">{t('other', language)}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('description', language)}</label>
                <input defaultValue={editingTransaction ? parseDescriptionWithStaff(editingTransaction.description).text : ''} required name="description" type="text" placeholder={t('transaction_desc_placeholder', language)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
              </div>
              {(txType === 'expense' || txType === 'operating_expense') && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('linked_supplier_optional', language)}</label>
                  <select defaultValue={editingTransaction?.supplier_id} name="supplier_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                    <option value="">{t('no_supplier', language)}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {txType === 'income' && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('linked_booking_optional', language)}</label>
                  <select defaultValue={editingTransaction?.booking_id} name="booking_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                    <option value="">{t('no_booking', language)}</option>
                    {bookings.map(b => {
                      const customer = customers.find(c => c.id === b.customer_id);
                      return (
                        <option key={b.id} value={b.id}>
                          {customer?.name} - {getCleanDescription(b.description)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  {t('cancel', language)}
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                  {editingTransaction ? t('save_changes', language) : t('save_transaction', language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-[17px] font-bold">{t('delete', language)}</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              {t('delete_transaction_confirm', language)} <strong>{transactionToDelete.description}</strong>?<br />
              <span className="text-[12px] text-slate-500">{t('delete_transaction_warning', language)}</span>
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setTransactionToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t('cancel', language)}
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t('delete', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <ArrowRightLeft className="w-6 h-6" />
              <h3 className="text-[17px] font-bold">{t('internal_transfer', language)}</h3>
            </div>
            
            <form onSubmit={handleTransferSubmit} className={cn("space-y-4", language === 'ar' ? 'text-right' : 'text-left')}>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('transfer_amount', language)}</label>
                <input required name="amount" type="number" min="1" step="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('from_account', language)}</label>
                  <select required name="from_account" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white">
                    <option value="cash">{t('cash', language)}</option>
                    <option value="bankily">{t('bankily', language)}</option>
                    <option value="masrivi">{t('masrivi', language)}</option>
                    <option value="sedad">{t('sedad', language)}</option>
                    <option value="other">{t('other', language)}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('to_account', language)}</label>
                  <select required name="to_account" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white">
                    <option value="bankily">{t('bankily', language)}</option>
                    <option value="masrivi">{t('masrivi', language)}</option>
                    <option value="sedad">{t('sedad', language)}</option>
                    <option value="cash">{t('cash', language)}</option>
                    <option value="other">{t('other', language)}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('transfer_desc_optional', language)}</label>
                <input name="description" type="text" placeholder={t('transfer_desc_placeholder', language)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  {t('cancel', language)}
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                  {t('execute_transfer', language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
