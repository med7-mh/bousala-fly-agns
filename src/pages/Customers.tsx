import React, { useState } from 'react';
import { useStore, Customer } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Mail, Phone, FileText, X } from 'lucide-react';

export default function Customers() {
  const { customers, bookings, transactions, addCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchTerm) || 
    c.phone.includes(searchTerm) || 
    c.email.includes(searchTerm)
  );

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addCustomer({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      notes: formData.get('notes') as string,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="ابحث عن عميل بالاسم، الجوال، الايميل..."
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
          إضافة عميل
        </button>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">الاسم</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">رقم الجوال</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">إجمالي الحجوزات</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">المسدد مبلغاً</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">الديون المتبقية</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => {
                const customerBookings = bookings.filter(b => b.customer_id === customer.id);
                const totalBooked = customerBookings.reduce((sum, b) => sum + b.selling_price, 0);
                
                const customerBookingIds = customerBookings.map(b => b.id);
                const customerPayments = transactions.filter(t => t.type === 'income' && t.booking_id && customerBookingIds.includes(t.booking_id));
                const totalPaid = customerPayments.reduce((sum, t) => sum + t.amount, 0);
                
                const debt = totalBooked - totalPaid;

                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 font-medium whitespace-nowrap">{customer.name}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span dir="ltr">{customer.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 whitespace-nowrap">{formatCurrency(totalBooked)}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-emerald-600 font-medium whitespace-nowrap">{formatCurrency(totalPaid)}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] font-bold whitespace-nowrap">
                      <span className={debt > 0 ? "text-amber-600" : "text-emerald-600"}>
                        {formatCurrency(debt > 0 ? debt : 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-center whitespace-nowrap">
                      <button 
                        onClick={() => setStatementCustomer(customer)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                        title="كشف حساب"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    لا يوجد عملاء مطابقين للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">إضافة عميل جديد</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">الاسم الكامل</label>
                <input required name="name" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الجوال</label>
                <input required name="phone" type="tel" dir="ltr" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right text-sm" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">البريد الإلكتروني</label>
                <input name="email" type="email" dir="ltr" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right text-sm" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">ملاحظات</label>
                <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Account Statement Modal */}
      {statementCustomer && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[19px] font-bold text-slate-800">كشف حساب: {statementCustomer.name}</h3>
              <button onClick={() => setStatementCustomer(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">التاريخ</th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">البيان</th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">مدين (قيمة الحجز)</th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">دائن (مسدد)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const cb = bookings.filter(b => b.customer_id === statementCustomer.id).map(b => ({
                      id: b.id,
                      date: new Date(b.created_at || '').getTime(),
                      dateStr: b.created_at,
                      desc: `حجز: ${b.description}`,
                      debit: b.selling_price,
                      credit: 0
                    }));
                    
                    const cp = transactions.filter(t => t.type === 'income' && t.booking_id && cb.map(b=>b.id).includes(t.booking_id)).map(t => ({
                      id: t.id,
                      date: new Date(t.date || '').getTime(),
                      dateStr: t.date,
                      desc: `دفعة: ${t.description} (${t.payment_method || 'نقدي'})`,
                      debit: 0,
                      credit: t.amount
                    }));
                    
                    const ledger = [...cb, ...cp].sort((a, b) => a.date - b.date);
                    
                    return ledger.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                        <td className="py-3.5 px-2 text-[14px] text-slate-500 whitespace-nowrap" dir="ltr">
                          {new Date(item.dateStr || '').toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3.5 px-2 text-[14px] text-slate-800">{item.desc}</td>
                        <td className="py-3.5 px-2 text-[14px] text-slate-800 font-medium">
                          {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                        </td>
                        <td className="py-3.5 px-2 text-[14px] text-emerald-600 font-medium">
                          {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
