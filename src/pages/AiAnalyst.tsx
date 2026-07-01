import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { generateText } from "../lib/gemini";
import { Bot, Send, User, Sparkles, Loader2, ArrowRight } from "lucide-react";

export default function AiAnalyst() {
  const { user, transactions, bookings, customers } = useStore();
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    {
      role: "ai",
      content: "مرحباً بك في قسم المحلل المالي الذكي. أنا هنا لمساعدتك في تحليل إيراداتك ومصروفاتك، وتقديم مقترحات لتحسين الأداء المالي لوكالتك. ماذا تود أن تسألني اليوم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Prepare context
    const income = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === "expense" || t.type === "operating_expense").reduce((acc, t) => acc + t.amount, 0);
    const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);

    const historyStr = messages.map(m => `${m.role === 'ai' ? 'المحلل:' : 'المستخدم:'} ${m.content}`).join("\n");

    const context = `
أنت محلل مالي ذكي لوكالة سفر/خدمات. اسم الوكالة غير محدد لكنك تتحدث مع مسؤول الوكالة (${user?.name || "المسؤول"}).
تحليل مالي للوكالة حالياً:
- إجمالي الإيرادات المسجلة: ${income}
- إجمالي المصروفات المسجلة: ${expenses}
- صافي الربح التقريبي: ${income - expenses}
- عدد الحجوزات الكلي: ${bookings.length}
- عدد العملاء المسجلين: ${customers.length}

أحدث 50 حركة مالية:
${recentTransactions.map(t => `- ${t.date}: ${t.type === 'income' ? 'إيراد' : 'مصروف'} بقيمة ${t.amount} (البيان: ${t.description})`).join("\n")}

يجب أن تقدم نصيحة مالية دقيقة ومفيدة ومخصصة بناءً على هذه الأرقام والبيانات فقط. لا تستخدم بيانات عامة أو مختلقة.
لا تتحدث عن تفاصيل تقنية، كن احترافياً ولبقاً، استخدم لغة عربية سليمة وواضحة.
إذا طلب المستخدم تقارير أو نصائح لزيادة الأرباح، اعتمد على الأرقام الحقيقية المتاحة (مثل تقليل المصروفات الكبيرة أو التركيز على إيرادات معينة).

تاريخ المحادثة:
${historyStr}
المستخدم: ${userMessage}
المحلل:
`;

    try {
      const response = await generateText(context);
      setMessages((prev) => [...prev, { role: "ai", content: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "عذراً، حدث خطأ أثناء الاتصال بالخادم الذكي. حاول مرة أخرى." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-600 p-6 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-emerald-50" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-1">المحلل المالي الذكي (AI)</h1>
            <p className="text-emerald-100 text-sm">مساعدك الشخصي لتحليل أداء وكالتك</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 text-[15px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tl-none"
                  : "bg-white border border-slate-200 text-slate-700 rounded-tr-none shadow-sm"
              }`}
              dir="rtl"
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 flex-row">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-tr-none shadow-sm flex items-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">جاري التحليل...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اسأل المحلل المالي عن الإيرادات، المصروفات، أو الأرباح..."
            className="w-full bg-slate-100 text-slate-800 rounded-full py-4 pr-6 pl-14 outline-none focus:ring-2 focus:ring-emerald-500 transition-all border border-transparent focus:border-emerald-300"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute left-2 w-10 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
