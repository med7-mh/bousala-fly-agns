import { Compass } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        <Compass className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-slate-500 font-medium animate-pulse text-sm">جاري تحميل البيانات...</p>
    </div>
  );
}
