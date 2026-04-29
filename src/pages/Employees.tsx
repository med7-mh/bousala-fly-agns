import React, { useState } from 'react';
import { useStore, Employee } from '../store/useStore';
import { Plus, Search, UserCircle, Briefcase, Phone, Calendar, DollarSign, Wallet } from 'lucide-react';
import { formatCurrency, parseDescriptionWithStaff } from '../lib/utils';
import { t } from '../lib/translations';
import toast from 'react-hot-toast';

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, addTransaction, language, activeStaff, transactions } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter(e => 
    e.name.includes(searchTerm) || e.position?.includes(searchTerm) || e.phone?.includes(searchTerm)
  );

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleOpenPayModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPayModalOpen(true);
  };

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const employeeData = {
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      phone: formData.get('phone') as string,
      salary: Number(formData.get('salary')) || 0,
      join_date: formData.get('join_date') as string,
    };

    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, employeeData);
    } else {
      await addEmployee(employeeData);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف/العامل؟ لن يتم حذف عملياته المالية المرتبطة باليومية ولكن سيفقد الربط.')) {
      await deleteEmployee(id);
    }
  };

  const handlePaySalary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const paymentMethod = formData.get('payment_method') as string;

    if (amount <= 0) {
      toast.error('المبلغ يجب أن يكون أكبر من 0');
      return;
    }

    let finalDescription = description;
    if (activeStaff) {
      finalDescription = `${description} | الموظف: ${activeStaff.name}`;
    }

    await addTransaction({
      type: 'operating_expense',
      amount,
      description: finalDescription,
      payment_method: paymentMethod,
      employee_id: selectedEmployee.id,
      date: new Date().toISOString()
    });

    setIsPayModalOpen(false);
    toast.success('تم تسجيل الدفعة بنجاح وإضافتها لليومية والمصروفات');
  };

  const getPaidAmount = (employeeId: string) => {
    return transactions
      .filter(t => t.employee_id === employeeId && (t.type === 'expense' || t.type === 'operating_expense'))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الموظفين والعمال</h1>
          <p className="text-sm text-slate-500 mt-1">تتبع الأجور والرواتب والمصروفات الخاصة بهم</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">إضافة موظف/عامل</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="ابحث بالاسم، المسمى الوظيفي، أو الهاتف..."
            className="bg-slate-100 rounded-full pr-10 pl-4 py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(employee => {
          const paidAmount = getPaidAmount(employee.id);

          return (
            <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-shadow hover:shadow-md">
              <div className="p-5 border-b border-slate-100 flex items-start gap-4">
                 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <UserCircle className="w-8 h-8" />
                 </div>
                 <div className="flex-1">
                   <h3 className="text-[16px] font-bold text-slate-800">{employee.name}</h3>
                   <div className="flex items-center gap-1.5 text-slate-500 text-[13px] mt-1">
                     <Briefcase className="w-3.5 h-3.5" />
                     <span>{employee.position || 'غير محدد'}</span>
                   </div>
                 </div>
              </div>
              
              <div className="p-5 flex-1 grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <div className="text-slate-400 text-[12px] font-medium mb-1 drop-shadow-sm flex items-center gap-1"><Phone className="w-3 h-3"/> الهاتف</div>
                  <div className="font-semibold text-slate-700" dir="ltr">{employee.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[12px] font-medium mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> تاريخ الانضمام</div>
                  <div className="font-semibold text-slate-700">{employee.join_date ? new Date(employee.join_date).toLocaleDateString('en-GB') : '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[12px] font-medium mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> الراتب الأساسي</div>
                  <div className="font-bold text-slate-800">{formatCurrency(employee.salary)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[12px] font-medium mb-1 flex items-center gap-1"><Wallet className="w-3 h-3"/> إجمالي المصروف له</div>
                  <div className="font-bold text-emerald-600">{formatCurrency(paidAmount)}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => handleOpenPayModal(employee)}
                  className="flex-1 bg-emerald-100 text-emerald-700 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors"
                >
                  صرف مبلغ
                </button>
                <button 
                  onClick={() => handleOpenEditModal(employee)}
                  className="px-3 bg-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                >
                  تعديل
                </button>
                <button 
                  onClick={() => handleDelete(employee.id)}
                  className="px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            لا يوجد موظفين لعرضهم. قم بإضافة موظف جديد لتبدأ.
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">{editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف/عامل جديد'}</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">الاسم رباعي</label>
                <input defaultValue={editingEmployee?.name} required name="name" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">المسمى الوظيفي / الدور</label>
                <input defaultValue={editingEmployee?.position} name="position" type="text" placeholder="مثال: عامل نظافة، موظف مبيعات..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">رقم الهاتف</label>
                <input defaultValue={editingEmployee?.phone} name="phone" type="tel" dir="ltr" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">الراتب / الأجر المتفق عليه</label>
                  <input defaultValue={editingEmployee?.salary || 0} required name="salary" type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">تاريخ الانضمام</label>
                  <input defaultValue={editingEmployee?.join_date || new Date().toISOString().split('T')[0]} required name="join_date" type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">إلغاء</button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-600 transition-colors">
                  {editingEmployee ? 'حفظ التعديلات' : 'إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary/Amount Modal */}
      {isPayModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="mb-4">
                <h3 className="text-[17px] font-bold text-slate-800">صرف مبلغ / راتب</h3>
                <p className="text-[13px] text-slate-500 mt-1">للموظف: <span className="font-bold text-slate-700">{selectedEmployee.name}</span></p>
            </div>
            <form onSubmit={handlePaySalary} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">المبلغ المراد صرفه</label>
                <input 
                  type="number" 
                  name="amount"
                  required
                  min="1"
                  defaultValue={selectedEmployee.salary > 0 ? selectedEmployee.salary : ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm" 
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">طريقة الدفع (الخزينة)</label>
                <select name="payment_method" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white">
                  <option value="cash">نقداً (كاش)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="card">بطاقة (Card)</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">البيان / الوصف</label>
                <textarea 
                  name="description"
                  required
                  defaultValue={`صرف راتب للموظف/العامل - الشهر الحالي`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm resize-none"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  {t('cancel', language)}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  تأكيد الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
