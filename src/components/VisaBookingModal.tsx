import React, { useState, useEffect, useRef } from 'react';
import { X, Search, RefreshCw, ScanLine, UserPlus, CreditCard } from 'lucide-react';
import { useStore, Customer, Supplier, Booking } from '../store/useStore';
import toast from 'react-hot-toast';

interface VisaBookingModalProps {
  onClose: () => void;
  language?: string;
  initialScanMode?: boolean;
}

export default function VisaBookingModal({ onClose, language = 'ar', initialScanMode = false }: VisaBookingModalProps) {
  const { customers, suppliers, addBooking, addCustomer, addTransaction, activeStaff } = useStore();
  
  const [mrzInput, setMrzInput] = useState('');
  const [scanMode, setScanMode] = useState(initialScanMode);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [scannedName, setScannedName] = useState('');
  const [scannedSurname, setScannedSurname] = useState('');
  const [scannedPassport, setScannedPassport] = useState('');
  
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('تأشيرة');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [advancePayment, setAdvancePayment] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (scanMode && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [scanMode]);

  const filteredCustomers = customers.filter(c => 
    c.name.includes(customerSearch) || 
    c.phone?.includes(customerSearch) || 
    c.passport_number?.includes(customerSearch)
  ).slice(0, 5);

  const visaSuppliers = suppliers; // Should probably filter for visa agents if there was a category

  // Fast parsing for MRZ (Machine Readable Zone of Passport TD3)
  const parseMRZ = (mrzText: string) => {
    // 2 lines of 44 chars or 3 lines of 30 or continuous string
    const text = mrzText.replace(/\s+/g, '').toUpperCase();
    if (text.length >= 88) { // basic TD3 length
      const line1 = text.substring(0, 44);
      const line2 = text.substring(44, 88);
      
      if (line1[0] === 'P') {
        const nameData = line1.substring(5).split('<<');
        const surnameRaw = nameData[0] || '';
        const givenNamesRaw = nameData[1]?.replace(/</g, ' ') || '';
        const surname = surnameRaw.replace(/</g, ' ');
        const passportNum = line2.substring(0, 9).replace(/</g, '');
        
        setScannedName(givenNamesRaw.trim());
        setScannedSurname(surname.trim());
        setScannedPassport(passportNum);
        
        // Check if customer exists
        const existingCustomer = customers.find(c => c.passport_number === passportNum || c.name.toUpperCase().includes(givenNamesRaw.trim()));
        if (existingCustomer) {
          setCustomerId(existingCustomer.id);
          toast.success('تم العثور على العميل من قاعدة البيانات');
        } else {
          setCustomerId('new'); // create new automatically
          toast.success('جواز سفر جديد - سيتم إنشاء العميل تلقائيا');
        }
        
        setScanMode(false);
      } else {
        toast.error('صيغة جواز السفر غير مدعومة');
      }
    } else {
      toast.error('رمز MRZ غير مكتمل، حاول المسح مرة أخرى');
    }
    setMrzInput('');
  };

  const handleMrzKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      parseMRZ(mrzInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!costPrice || !sellingPrice) {
      toast.error('الرجاء تعبئة الأسعار');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = customerId;
      
      // Auto create new customer if scanned
      if (customerId === 'new') {
        const customerName = `${scannedName} ${scannedSurname}`.trim();
        const newCust = await addCustomer({
          name: customerName,
          phone: '',
          email: '',
          passport_number: scannedPassport,
          notes: 'Auto-created from scan'
        });
        if (newCust) {
          finalCustomerId = newCust.id;
        } else {
          toast.error('فشل إنشاء العميل');
          setIsSubmitting(false);
          return;
        }
      }

      const bookingData = {
        customer_id: finalCustomerId,
        supplier_id: supplierId || undefined,
        type: 'visa' as const,
        description: description,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        status: 'pending' as const,
      };

      const newBooking = await addBooking(bookingData);

      if (newBooking && advancePayment && Number(advancePayment) > 0) {
        await addTransaction({
          booking_id: newBooking.id,
          type: 'income',
          amount: Number(advancePayment),
          description: `دفعة مقدمة - تأشيرة - ${activeStaff ? ' الموظف: ' + activeStaff.name : ''}`,
          payment_method: paymentMethod,
          date: new Date().toISOString()
        });
      }

      toast.success('تمت إضافة التأشيرة بنجاح');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 p-4 sm:p-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-300">
              <ScanLine className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">إصدار تأشيرة</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">سجل التأشيرة أو امسح جواز السفر للإدخال السريع</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 mb-6 relative">
            <div className={`p-3 rounded-full ${scanMode ? 'bg-blue-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
              <ScanLine className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center sm:text-right">
              <h4 className="font-bold text-blue-900 text-lg">سكانر الجوازات (MRZ)</h4>
              <p className="text-sm text-blue-700">اضغط للتشغيل، ثم قم بتمرير الجواز من خلال السكانر لجمع البيانات.</p>
            </div>
            
            <button 
              onClick={() => { setScanMode(!scanMode); if(!scanMode) setCustomerId(''); }}
              className={`px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${scanMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {scanMode ? 'إيقاف المسح' : 'تشغيل המסح (السكانر)'}
            </button>

            {/* Hidden Input that captures the rapid scan text */}
            <input 
              ref={scanInputRef}
              type="text"
              value={mrzInput}
              onChange={(e) => setMrzInput(e.target.value)}
              onKeyDown={handleMrzKeyDown}
              className={`absolute opacity-0 ${scanMode ? 'w-full h-full inset-0 z-20 cursor-text' : 'w-0 h-0'}`}
              autoComplete="off"
            />
          </div>

          <form id="visa-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-bold text-slate-800">بيانات العميل</h4>
                </div>

                {!scannedPassport ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="ابحث لاختيار عميل موجود..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setCustomerId('');
                        }}
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {customerSearch && !customerId && (
                      <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                        {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => { setCustomerId(c.id); setCustomerSearch(c.name); }}
                            className="p-3 border-b border-slate-100 hover:bg-emerald-50 cursor-pointer text-sm"
                          >
                            <div className="font-semibold">{c.name}</div>
                            {c.passport_number && <div className="text-xs text-slate-500">جواز: {c.passport_number}</div>}
                          </div>
                        )) : (
                          <div className="p-3 text-sm text-slate-500 text-center">لا توجد نتائج</div>
                        )}
                      </div>
                    )}
                    
                    {!customerSearch && !customerId && (
                      <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm bg-slate-50">
                        الرجاء اختيار العميل للبدء<br/>أو استخدم السكانر للاستخراج التلقائي
                      </div>
                    )}

                    {customerId && customerId !== 'new' && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg flex justify-between items-center text-sm font-semibold">
                        <span>العميل المختار: {customerSearch}</span>
                        <button type="button" onClick={() => {setCustomerId(''); setCustomerSearch('');}} className="text-emerald-600 hover:text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">تغيير</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 bg-blue-50 border border-blue-200 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full"></div>
                    <div className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-2">بيانات الجواز المستخرجة</div>
                    <div>
                      <div className="text-xs text-blue-700 mb-1 font-semibold">الاسم الأول (Given Names)</div>
                      <div className="font-mono bg-white px-2 py-1 border border-blue-100 rounded text-slate-800" dir="ltr">{scannedName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-700 mb-1 font-semibold">اسم العائلة (Surname)</div>
                      <div className="font-mono bg-white px-2 py-1 border border-blue-100 rounded text-slate-800" dir="ltr">{scannedSurname}</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-700 mb-1 font-semibold">رقم الجواز (Passport No.)</div>
                      <div className="font-mono bg-white px-2 py-1 border border-blue-100 rounded text-slate-800" dir="ltr">{scannedPassport}</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setScannedPassport(''); setScannedName(''); setScannedSurname(''); setCustomerId(''); }}
                      className="w-full mt-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-lg text-sm transition-colors"
                    >
                      إلغاء وإعادة المسح
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <h4 className="font-bold text-slate-800">بيانات العملية المالية</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">المورد ( السفارة / الوكيل )</label>
                  <select 
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">-- اختر المورد --</option>
                    {visaSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">بيان التأشيرة (أرقام التأشيرة أو نوعها)</label>
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: تأشيرة عمل - السعودية..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-red-600 mb-1">سعر التكلفة *</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-red-200 bg-red-50 focus:bg-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-600 mb-1">سعر البيع *</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50 focus:bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-slate-700">استلام دفعة مقدمة الآن (عربون)</label>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-3">
                       <input 
                        type="number"
                        min="0"
                        placeholder="المبلغ المستلم"
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-left"
                        dir="ltr"
                      />
                    </div>
                    <div className="col-span-2">
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="cash">نقداً</option>
                        <option value="bank_transfer">تحويل</option>
                        <option value="card">بطاقة</option>
                      </select>
                    </div>
                  </div>
                  {Number(sellingPrice) > 0 && Number(advancePayment) > 0 && (
                     <div className="mt-2 text-xs font-semibold flex justify-between bg-white px-2 py-1.5 border border-slate-100 rounded">
                        <span className="text-slate-500">المتبقي على العميل:</span>
                        <span className="text-red-500">{Number(sellingPrice) - Number(advancePayment)}</span>
                     </div>
                  )}
                </div>

              </div>
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button 
            type="submit" 
            form="visa-form"
            disabled={!customerId || isSubmitting}
            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
            ) : (
              'حفظ وإصدار'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
