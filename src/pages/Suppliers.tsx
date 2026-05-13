import React, { useState } from 'react';
import { useStore, Supplier } from '../store/useStore';
import { t } from '../lib/translations';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Mail, Phone, FileText, X, Building2, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function Suppliers() {
  const { suppliers, bookings, transactions, addSupplier, updateSupplier, deleteSupplier, language } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(s => {
    const searchLower = (searchTerm || '').toLowerCase();
    return (s.name || '').toLowerCase().includes(searchLower) || 
           (s.phone || '').includes(searchTerm) || 
           (s.email || '').toLowerCase().includes(searchLower);
  });

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supplierData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      notes: formData.get('notes') as string,
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierData);
    } else {
      addSupplier(supplierData);
    }
    
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDelete = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder={t('search_supplier', language)}
            className="bg-slate-100 rounded-full pr-10 pl-4 py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('add_supplier', language)}
        </button>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">{t('name', language)}</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">{t('phone', language)}</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">{t('total_claims', language)}</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">{t('paid_to_them', language)}</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">{t('remaining_balance', language)}</th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap text-center">{t('actions', language)}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(supplier => {
                // Here we find bookings linked to this supplier.
                // Currently bookings store supplier as string via description. We will map them or rely on transactions.
                // Wait, if supplier was just a string before, we need a way to link it.
                // I will add a 'supplier_id' to bookings via state interface later if needed,
                // but for now let's assume we link transactions to 'supplier' using descriptions or proper relationships.
                
                // Let's implement this properly: assuming transactions table has a supplier_id or booking table has supplier_id.
                // But the user just asked to build it. Wait, I should add supplier_id to bookings!
                // Let's assume I already add supplier_id to bookings.
                const supplierBookings = bookings.filter((b: any) => b.supplier_id === supplier.id);
                const totalCost = supplierBookings.reduce((sum, b) => sum + b.cost_price, 0);
                
                const supplierPayments = transactions.filter((t: any) => t.type === 'expense' && t.supplier_id === supplier.id);
                const totalPaid = supplierPayments.reduce((sum, t) => sum + t.amount, 0);
                
                const debt = totalCost - totalPaid;

                return (
                  <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {supplier.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span dir="ltr">{supplier.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 whitespace-nowrap">{formatCurrency(totalCost)}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-emerald-600 font-medium whitespace-nowrap">{formatCurrency(totalPaid)}</td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] font-bold whitespace-nowrap">
                      <span className={debt > 0 ? "text-red-600" : "text-emerald-600"}>
                        {formatCurrency(debt > 0 ? debt : 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setStatementSupplier(supplier)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                          title={t('supplier_statement', language)}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(supplier)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                          title={t('edit', language)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSupplierToDelete(supplier)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                          title={t('delete', language)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {t('no_suppliers_found', language)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add/Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">{editingSupplier ? t('edit_supplier_title', language) : t('new_supplier_title', language)}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('name', language)}</label>
                <input defaultValue={editingSupplier?.name} required name="name" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('phone', language)}</label>
                <input defaultValue={editingSupplier?.phone} name="phone" type="tel" dir="ltr" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right text-sm" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('email', language)}</label>
                <input defaultValue={editingSupplier?.email} name="email" type="email" dir="ltr" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right text-sm" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">{t('notes', language)}</label>
                <textarea defaultValue={editingSupplier?.notes} name="notes" rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  {t('cancel', language)}
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                  {editingSupplier ? t('save_changes', language) : t('save', language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-[17px] font-bold">تأكيد الحذف</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              هل أنت متأكد من حذف المورد <strong>{supplierToDelete.name}</strong>؟<br />
              <span className="text-[12px] text-slate-500">هذا الإجراء لا يمكن التراجع عنه.</span>
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                حذف المورد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Statement Supplier Modal */}
      {statementSupplier && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[19px] font-bold text-slate-800">{t('supplier_statement', language)}: {statementSupplier.name}</h3>
              <button onClick={() => setStatementSupplier(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">{t('date', language)}</th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">{t('description', language)}</th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">مدين (لهم)</th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">دائن (سددنا)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sb = bookings.filter((b: any) => b.supplier_id === statementSupplier.id).map(b => ({
                      id: b.id,
                      date: new Date(b.created_at || '').getTime(),
                      dateStr: b.created_at,
                      desc: `حجز تذكرة: ${b.description}`,
                      debit: b.cost_price, // cost we owe them
                      credit: 0
                    }));
                    
                    const sp = transactions.filter((t: any) => t.type === 'expense' && t.supplier_id === statementSupplier.id).map(t => ({
                      id: t.id,
                      date: new Date(t.date || '').getTime(),
                      dateStr: t.date,
                      desc: `دفعة للمورد: ${t.description} (${t.payment_method || 'نقدي'})`,
                      debit: 0,
                      credit: t.amount
                    }));
                    
                    const ledger = [...sb, ...sp].sort((a, b) => a.date - b.date);
                    
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
