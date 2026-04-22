import React, { useState } from 'react';
import { useStore, BookingType, BookingStatus } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Filter } from 'lucide-react';

export default function Bookings() {
  const { bookings, customers, suppliers, addBooking, updateBookingStatus, addTransaction } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form specific state
  const [selectedType, setSelectedType] = useState<BookingType>('flight');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  const filteredBookings = bookings.filter(b => {
    const customer = customers.find(c => c.id === b.customer_id);
    return customer?.name.includes(searchTerm) || b.description.includes(searchTerm);
  });

  const handleAddBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as BookingType;
    const pnr = formData.get('pnr') as string;
    const supplier_id = formData.get('supplier_id') as string;
    const desc = formData.get('description') as string;
    const national_id = formData.get('national_id') as string;
    const receipt_number = formData.get('receipt_number') as string;
    const expected_date = formData.get('expected_date') as string;
    
    const parts = [];
    if (type === 'passport') {
      if (national_id) parts.push(`الرقم الوطني: ${national_id}`);
      if (receipt_number) parts.push(`رقم الإيصال: ${receipt_number}`);
      if (expected_date) parts.push(`موعد الاستلام: ${expected_date}`);
      if (desc) parts.push(`التفاصيل: ${desc}`);
    } else {
      if (pnr) parts.push(`PNR: ${pnr}`);
      if (desc) parts.push(`التفاصيل: ${desc}`);
    }
    
    const finalDescription = parts.join(' | ') || 'بدون وصف';

    const newBooking = await addBooking({
      customer_id: formData.get('customer_id') as string,
      supplier_id: supplier_id || undefined,
      type: type,
      description: finalDescription,
      cost_price: Number(formData.get('cost_price')),
      selling_price: Number(formData.get('selling_price')),
      status: formData.get('status') as BookingStatus,
      national_id: national_id || undefined,
      receipt_number: receipt_number || undefined,
      expected_date: expected_date || undefined
    });

    // Handle Quick Payment Recording
    if (newBooking && advancePayment > 0) {
      await addTransaction({
        booking_id: newBooking.id,
        type: 'income',
        amount: advancePayment,
        description: `دفعة مقدمة - ${type === 'passport' ? 'جواز سفر' : 'حجز'}`,
        payment_method: 'cash',
        date: new Date().toISOString()
      });
    }

    setIsModalOpen(false);
    setCostPrice(0);
    setSellingPrice(0);
    setAdvancePayment(0);
    setSelectedType('flight'); // default back
  };

  const typeLabels: Record<BookingType, string> = {
    flight: 'طيران',
    hotel: 'فندق',
    visa: 'تأشيرة',
    tour: 'جولة سياحية',
    passport: 'جواز سفر'
  };

  const statusLabels: Record<BookingStatus, string> = {
    pending: 'معلق',
    confirmed: 'مؤكد',
    cancelled: 'ملغي',
    documents_received: 'استلام المستندات',
    processing: 'قيد المعالجة',
    ready: 'جاهز للاستلام',
    delivered: 'تم التسليم'
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700';
      case 'pending':
      case 'documents_received':
      case 'processing':
        return 'bg-amber-50 text-amber-700';
      case 'ready':
        return 'bg-blue-50 text-blue-700';
      case 'cancelled':
      default:
        return 'bg-red-50 text-red-700';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="ابحث عن حجز..."
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
          إضافة حجز
        </button>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">التاريخ</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">رقم الحجز</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">العميل</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">النوع</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">الوصف</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">التكلفة</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">سعر البيع</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">الربح</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">الحالة</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => {
                const customer = customers.find(c => c.id === booking.customer_id);
                const profit = booking.selling_price - booking.cost_price;
                
                return (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-500 whitespace-nowrap" dir="ltr">
                      {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-500 whitespace-nowrap" dir="ltr">#{booking.id.substring(0, 8).toUpperCase()}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 font-medium whitespace-nowrap">{customer?.name}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-600 whitespace-nowrap">{typeLabels[booking.type]}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-600 min-w-[150px]">{booking.description}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-600 whitespace-nowrap">{formatCurrency(booking.cost_price)}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 font-bold whitespace-nowrap">{formatCurrency(booking.selling_price)}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-emerald-600 font-bold whitespace-nowrap">{formatCurrency(profit)}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold ${getStatusColor(booking.status)}`}>
                        {statusLabels[booking.status] || booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 whitespace-nowrap">
                      <select 
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value as BookingStatus)}
                        className="text-sm border border-slate-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      >
                        {booking.type === 'passport' ? (
                          <>
                            <option value="documents_received">استلام المستندات</option>
                            <option value="processing">قيد المعالجة</option>
                            <option value="ready">جاهز للاستلام</option>
                            <option value="delivered">تم التسليم</option>
                            <option value="cancelled">ملغي</option>
                          </>
                        ) : (
                          <>
                            <option value="pending">معلق</option>
                            <option value="confirmed">مؤكد</option>
                            <option value="cancelled">ملغي</option>
                          </>
                        )}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">إضافة حجز جديد</h3>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">العميل</label>
                <select required name="customer_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                  <option value="">اختر العميل...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">نوع العملية/الحجز</label>
                <select 
                  required 
                  name="type" 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as BookingType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white"
                >
                  <option value="flight">طيران</option>
                  <option value="hotel">فندق</option>
                  <option value="visa">تأشيرة</option>
                  <option value="tour">جولة سياحية</option>
                  <option value="passport">جواز سفر</option>
                </select>
              </div>
              
              {selectedType === 'passport' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1">الرقم الوطني (NNI)</label>
                      <input name="national_id" type="text" placeholder="مثال: 1234567890" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الإيصال / الملف</label>
                      <input name="receipt_number" type="text" placeholder="رقم المعاملة في الإدارة" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1">موعد الاستلام المتوقع</label>
                    <input name="expected_date" type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1">ملاحظات/وصف إضافي</label>
                    <input name="description" type="text" placeholder="مثال: استخراج لأول مرة" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1">تفاصيل الرحلة/الوصف</label>
                    <input required name="description" type="text" placeholder="مثال: رحلة نواكشوط - دكار" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الحجز (PNR)</label>
                      <input name="pnr" type="text" placeholder="اختياري" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1">المورد (اختياري)</label>
                      <select name="supplier_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                        <option value="">لا يوجد...</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">التكلفة (أوقية)</label>
                  <input 
                    required 
                    name="cost_price" 
                    type="number" 
                    min="0" 
                    step="1" 
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">سعر البيع (أوقية)</label>
                  <input 
                    required 
                    name="selling_price" 
                    type="number" 
                    min="0" 
                    step="1" 
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" 
                  />
                </div>
              </div>
              {/* Profit Indicator */}
              {(sellingPrice > 0 || costPrice > 0) && (
                <div className={`p-3 rounded-lg text-sm flex justify-between font-bold ${sellingPrice - costPrice >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  <span>الربح المتوقع:</span>
                  <span>{formatCurrency(sellingPrice - costPrice)}</span>
                </div>
              )}
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">الدفعة المقدمة (مقبوضات الكاشير)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="1" 
                  value={advancePayment || ''}
                  onChange={(e) => setAdvancePayment(Number(e.target.value))}
                  placeholder="المبلغ المدفوع الآن (اختياري)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white" 
                />
                <p className="text-[11px] text-slate-500 mt-1">سيتم إنشاء سند قبض تلقائياً في يومية الكاشير بهذا المبلغ.</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">الحالة</label>
                <select required name="status" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                  {selectedType === 'passport' ? (
                    <>
                      <option value="documents_received">استلام المستندات</option>
                      <option value="processing">قيد المعالجة (في الإدارة)</option>
                      <option value="ready">جاهز للاستلام</option>
                      <option value="delivered">تم التسليم</option>
                      <option value="cancelled">ملغي</option>
                    </>
                  ) : (
                    <>
                      <option value="pending">معلق</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="cancelled">ملغي</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                  حفظ الحجز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
