import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const { customers, bookings, transactions } = useStore();

  const totalProfit = bookings.reduce((acc, curr) => acc + (curr.selling_price - curr.cost_price), 0);
  const totalRevenue = bookings.reduce((acc, curr) => acc + curr.selling_price, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebts = totalRevenue - totalIncome;
  
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

  const chartData = [
    { name: 'يناير', profit: 4000, revenue: 24000 },
    { name: 'فبراير', profit: 3000, revenue: 13980 },
    { name: 'مارس', profit: 2000, revenue: 9800 },
    { name: 'أبريل', profit: 2780, revenue: 3908 },
    { name: 'مايو', profit: 1890, revenue: 4800 },
    { name: 'يونيو', profit: 2390, revenue: 3800 },
    { name: 'الحالي', profit: totalProfit, revenue: totalRevenue },
  ];

  const typeLabels: Record<string, string> = {
    flight: 'طيران',
    hotel: 'فندق',
    visa: 'تأشيرة',
    tour: 'جولة سياحية'
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <span className="text-[13px] text-slate-400 mb-2 block">إجمالي المبيعات</span>
          <span className="text-2xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <span className="text-[13px] text-slate-400 mb-2 block">إجمالي أرباح الوكالة</span>
          <span className="text-2xl font-bold text-emerald-600">{formatCurrency(totalProfit)}</span>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <span className="text-[13px] text-slate-400 mb-2 block">الديون المستحقة (بالسوق)</span>
          <span className="text-2xl font-bold text-amber-500">{formatCurrency(totalDebts > 0 ? totalDebts : 0)}</span>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <span className="text-[13px] text-slate-400 mb-2 block">حجوزات معلقة (للمعالجة)</span>
          <span className="text-2xl font-bold text-slate-800">{pendingBookings} <span className="text-sm font-normal text-slate-500">من أصل {bookings.length}</span></span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="text-[17px] font-bold mb-4 flex justify-between items-center text-slate-800">
            أحدث الحجوزات
            <button className="px-3 py-1.5 bg-emerald-500 text-white border-none rounded-md text-xs cursor-pointer hover:bg-emerald-600 transition-colors">
              حجز جديد +
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr>
                  <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold">العميل</th>
                  <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold">النوع</th>
                  <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold">التكلفة</th>
                  <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold">السعر</th>
                  <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((booking) => {
                  const customer = customers.find(c => c.id === booking.customer_id);
                  return (
                    <tr key={booking.id}>
                      <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 font-medium">{customer?.name}</td>
                      <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800">{typeLabels[booking.type]} - {booking.description}</td>
                      <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800">{formatCurrency(booking.cost_price)}</td>
                      <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800">{formatCurrency(booking.selling_price)}</td>
                      <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800">
                        <span className={`px-2 py-1 rounded text-[11px] font-semibold ${
                          booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                          booking.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'pending' ? 'معلق' : 'ملغي'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col h-64">
            <div className="text-[17px] font-bold mb-4 text-slate-800">تحليل المبيعات</div>
            <div className="flex-1 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" name="المبيعات" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col flex-1">
            <div className="text-[17px] font-bold mb-4 text-slate-800">آخر العملاء المنضمين</div>
            <div className="flex flex-col">
              {customers.slice(0, 3).map((customer, idx) => (
                <div key={customer.id} className={`flex items-center gap-3 ${idx !== 2 ? 'mb-4 pb-3 border-b border-slate-50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-emerald-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-[14px] block text-slate-800">{customer.name}</span>
                    <span className="text-[12px] color-slate-400 block text-slate-400">{customer.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
