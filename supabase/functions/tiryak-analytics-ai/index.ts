import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `أنت "مساعد الترياق التحليلي" - مساعد ذكي ودود لصيدلية الترياق الشافي.

## شخصيتك:
- ودود ومحترف، ترد على التحيات بشكل طبيعي
- تتحدث بالعربية الفصحى البسيطة
- تستخدم الإيموجي باعتدال 😊

## قواعد المحادثة:
1. عندما يحييك المستخدم: رد بتحية ثم اسأل كيف تساعده. لا تعرض بيانات فوراً.
2. عندما يسأل سؤالاً محدداً: أجب مباشرة بالبيانات المتاحة.
3. عندما يطلب تحليلاً شاملاً: قدم تحليلاً مفصلاً مع مقارنات.

## قدراتك التحليلية:
- 📈 تحليل الإيرادات حسب الفترة (صباحي/مسائي/ليلي) وحسب الشهر
- 💰 تحليل السدادات لكل شركة ومقارنتها
- 📉 كشف الخلل في المصاريف ومقارنة شهرية
- 🔄 تتبع النواقص المتكررة وتحليل أنماطها
- 📊 مقارنة الأشهر وتقديم اتجاهات
- 🏦 تحليل الخدمات البنكية مقابل الكاش

## تنسيق الردود:
- استخدم جداول markdown عند المقارنة
- قدم الأرقام بتنسيق واضح مع العملة (د.ل)
- استخدم القوائم والعناوين لتسهيل القراءة
- قدم اقتراحات عملية بناءً على البيانات

تذكر: كن طبيعياً ومحادثاً، لا تقفز للبيانات المالية إلا عند الطلب.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'جلسة غير صالحة' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', claimsData.user.id).single();
    if (!profile || !['admin', 'ahmad_rajili'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'غير مصرح لك' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { messages } = await req.json();

    // Fetch ALL data without limits for comprehensive analysis
    const [revenuesResult, expensesResult, paymentsResult, medicinesResult, companiesResult, suppliesResult] = await Promise.all([
      adminSupabase.from('revenues').select('*').order('date', { ascending: false }),
      adminSupabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      adminSupabase.from('payments').select('*').order('payment_date', { ascending: false }),
      adminSupabase.from('medicines').select('*').eq('status', 'shortage').order('repeat_count', { ascending: false }),
      adminSupabase.from('companies').select('*').order('name'),
      adminSupabase.from('supplies').select('*').eq('status', 'shortage'),
    ]);

    const revenues = revenuesResult.data || [];
    const expenses = expensesResult.data || [];
    const payments = paymentsResult.data || [];
    const shortages = medicinesResult.data || [];
    const companies = companiesResult.data || [];
    const supplyShortages = suppliesResult.data || [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Helper to get month data
    const getMonthData = (month: number, year: number) => {
      const monthRevs = revenues.filter(r => { const d = new Date(r.date); return d.getMonth() === month && d.getFullYear() === year; });
      const monthExps = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === month && d.getFullYear() === year; });
      const monthPays = payments.filter(p => { const d = new Date(p.payment_date); return d.getMonth() === month && d.getFullYear() === year; });
      return {
        revenue: monthRevs.reduce((s, r) => s + Number(r.amount), 0),
        revenueCount: monthRevs.length,
        expenses: monthExps.reduce((s, e) => s + Number(e.amount), 0),
        expenseCount: monthExps.length,
        payments: monthPays.reduce((s, p) => s + Number(p.amount), 0),
        paymentCount: monthPays.length,
        revenuesByPeriod: {
          morning: monthRevs.filter(r => r.period === 'morning').reduce((s, r) => s + Number(r.amount), 0),
          evening: monthRevs.filter(r => r.period === 'evening').reduce((s, r) => s + Number(r.amount), 0),
          night: monthRevs.filter(r => r.period === 'night').reduce((s, r) => s + Number(r.amount), 0),
        },
      };
    };

    // Current month data
    const cm = getMonthData(currentMonth, currentYear);

    // Previous month data
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const pm = getMonthData(prevMonth, prevYear);

    // Monthly summary for last 6 months
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    let monthlySummary = '';
    for (let i = 0; i < 6; i++) {
      const m = (currentMonth - i + 12) % 12;
      const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const data = getMonthData(m, y);
      if (data.revenueCount > 0 || data.expenseCount > 0 || data.paymentCount > 0) {
        monthlySummary += `- ${monthNames[m]} ${y}: إيرادات ${data.revenue.toLocaleString()} | مصاريف ${data.expenses.toLocaleString()} | سدادات ${data.payments.toLocaleString()} | صافي ${(data.revenue - data.expenses - data.payments).toLocaleString()}\n`;
      }
    }

    // Company payments breakdown
    const companyBreakdown = companies.map(c => {
      const cPayments = payments.filter(p => p.company_name === c.name);
      const total = cPayments.reduce((s, p) => s + Number(p.amount), 0);
      const undeducted = cPayments.filter(p => !p.is_deducted).reduce((s, p) => s + Number(p.amount), 0);
      return { name: c.name, rep: c.representative_name, total, undeducted, count: cPayments.length };
    }).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

    // Top expenses current month
    const cmExpenses = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    const topExpenses = [...cmExpenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 10);

    // Recurring shortages
    const recurringShortages = shortages.filter(m => (m.repeat_count || 0) >= 3);

    // Banking vs cash analysis
    const cashPayments = payments.filter(p => p.payment_type === 'cash');
    const bankPayments = payments.filter(p => p.payment_type !== 'cash');
    const bankingRevenues = revenues.filter(r => r.type === 'banking_service');

    const dataContext = `
## البيانات الشاملة (${today.toLocaleDateString('ar-LY')}):

### الشهر الحالي (${monthNames[currentMonth]} ${currentYear}):
- الإيرادات: ${cm.revenue.toLocaleString()} د.ل (${cm.revenueCount} سجل)
  - صباحي: ${cm.revenuesByPeriod.morning.toLocaleString()} | مسائي: ${cm.revenuesByPeriod.evening.toLocaleString()} | ليلي: ${cm.revenuesByPeriod.night.toLocaleString()}
- المصاريف: ${cm.expenses.toLocaleString()} د.ل (${cm.expenseCount} سجل)
- السدادات: ${cm.payments.toLocaleString()} د.ل (${cm.paymentCount} سجل)
- صافي الربح التقديري: ${(cm.revenue - cm.expenses - cm.payments).toLocaleString()} د.ل

### الشهر السابق (${monthNames[prevMonth]} ${prevYear}):
- الإيرادات: ${pm.revenue.toLocaleString()} | المصاريف: ${pm.expenses.toLocaleString()} | السدادات: ${pm.payments.toLocaleString()}

### ملخص آخر 6 أشهر:
${monthlySummary || '- لا توجد بيانات كافية'}

### تفصيل سدادات الشركات:
${companyBreakdown.length > 0 
  ? companyBreakdown.map(c => `- ${c.name}${c.rep ? ` (${c.rep})` : ''}: إجمالي ${c.total.toLocaleString()} د.ل | غير مخصوم ${c.undeducted.toLocaleString()} | ${c.count} سداد`).join('\n')
  : '- لا توجد سدادات'}

### أكبر مصاريف الشهر الحالي:
${topExpenses.length > 0 
  ? topExpenses.map((e, i) => `${i + 1}. ${e.description}: ${Number(e.amount).toLocaleString()} د.ل`).join('\n')
  : '- لا توجد مصاريف'}

### تحليل الكاش vs المصرف:
- سدادات كاش: ${cashPayments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()} (${cashPayments.length} سداد)
- سدادات مصرف: ${bankPayments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()} (${bankPayments.length} سداد)
- إيرادات خدمات بنكية: ${bankingRevenues.reduce((s, r) => s + Number(r.amount), 0).toLocaleString()} (${bankingRevenues.length} سجل)

### النواقص المتكررة (≥3 مرات):
${recurringShortages.length > 0 
  ? recurringShortages.slice(0, 15).map(m => `- ${m.name}${m.scientific_name ? ` (${m.scientific_name})` : ''}: تكرر ${m.repeat_count} مرات`).join('\n')
  : '- لا توجد أصناف متكررة بشكل ملحوظ'}

### نواقص المستلزمات:
${supplyShortages.length > 0 
  ? supplyShortages.slice(0, 10).map(s => `- ${s.name}`).join('\n')
  : '- لا توجد نواقص مستلزمات'}

### إحصائيات عامة:
- إجمالي الإيرادات (كل الفترات): ${revenues.reduce((s, r) => s + Number(r.amount), 0).toLocaleString()} د.ل
- إجمالي المصاريف (كل الفترات): ${expenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()} د.ل
- إجمالي السدادات (كل الفترات): ${payments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()} د.ل
- عدد النواقص الحالية (أدوية): ${shortages.length}
- عدد النواقص الحالية (مستلزمات): ${supplyShortages.length}
- عدد الشركات: ${companies.length}
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + '\n\n' + dataContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز الحد الأقصى للطلبات' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'يرجى إضافة رصيد لخدمة الذكاء الاصطناعي' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'حدث خطأ في خدمة الذكاء الاصطناعي' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('tiryak-analytics-ai error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ غير متوقع' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
