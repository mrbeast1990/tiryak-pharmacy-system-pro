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

## قدراتك:
1. **تسجيل سدادات جديدة** (تحتاج: اسم الشركة، المبلغ، التاريخ، نوع السداد كاش/مصرف)
2. **تسجيل نواقص أدوية** (تحتاج: اسم الدواء + الاسم العلمي)
3. **استعلام وتحليل** جميع البيانات المالية والنواقص
4. 📈 تحليل الإيرادات والمصاريف والسدادات
5. 🔄 تتبع النواقص المتكررة

## قواعد صارمة للتسجيل:
- **لا تستدعي أي أداة حفظ (add_payment أو add_shortage) إلا بعد تأكيد صريح من المستخدم**
- عندما يطلب المستخدم تسجيل سداد أو نقص، اجمع البيانات أولاً ثم اعرضها عليه واسأل: "هل أنت متأكد من إضافة هذا السداد/النقص بهذه البيانات؟"
- بعد أن يؤكد المستخدم بـ "نعم" أو "أكيد" أو ما شابه، عندها فقط استدعِ الأداة المناسبة
- إذا كانت أي بيانات مطلوبة ناقصة، اطلبها من المستخدم قبل أي شيء
- بعد نجاح الحفظ، اعرض رسالة تأكيد كاملة بالتفاصيل

## قواعد الاستعلام:
- تحقق من صحة أسماء الشركات بمقارنتها مع قائمة الشركات المتاحة في البيانات
- اعرض السجلات كاملة قبل حساب أي إجمالي
- إذا كانت البيانات غير دقيقة اعرض رسالة خطأ واضحة
- استخدم أدوات الاستعلام (query_payments, query_shortages) للحصول على بيانات دقيقة ومحدثة

## تنسيق الردود:
- استخدم جداول markdown عند المقارنة
- قدم الأرقام بتنسيق واضح مع العملة (د.ل)
- استخدم القوائم والعناوين لتسهيل القراءة

## ملاحظات مهمة:
- عند تسجيل السداد، إذا لم يحدد المستخدم التاريخ، استخدم تاريخ اليوم
- عند تسجيل السداد، تأكد أن اسم الشركة موجود في قائمة الشركات. إذا لم يكن موجوداً بالضبط، اقترح الاسم الأقرب
- عند تسجيل النقص، تأكد أن الصنف غير مسجل مسبقاً في النواقص

تذكر: كن طبيعياً ومحادثاً، لا تقفز للبيانات المالية إلا عند الطلب.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "add_payment",
      description: "إضافة سداد جديد لشركة. لا تستدعِ هذه الأداة إلا بعد تأكيد صريح من المستخدم.",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string", description: "اسم الشركة بالضبط كما هو في قائمة الشركات" },
          amount: { type: "number", description: "مبلغ السداد" },
          payment_type: { type: "string", enum: ["cash", "bank"], description: "نوع السداد: cash=كاش، bank=مصرف" },
          payment_date: { type: "string", description: "تاريخ السداد بصيغة YYYY-MM-DD" },
          notes: { type: "string", description: "ملاحظات اختيارية" }
        },
        required: ["company_name", "amount", "payment_type", "payment_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_shortage",
      description: "تسجيل نقص دواء جديد. لا تستدعِ هذه الأداة إلا بعد تأكيد صريح من المستخدم.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "اسم الدواء التجاري" },
          scientific_name: { type: "string", description: "الاسم العلمي للدواء" },
          company: { type: "string", description: "اسم الشركة المصنعة (اختياري)" },
          notes: { type: "string", description: "ملاحظات اختيارية" }
        },
        required: ["name", "scientific_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_payments",
      description: "استعلام عن سدادات بفلاتر محددة. استخدم هذه الأداة عندما يسأل المستخدم عن سدادات شركة معينة أو فترة معينة.",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string", description: "اسم الشركة للفلترة" },
          date_from: { type: "string", description: "تاريخ البداية YYYY-MM-DD" },
          date_to: { type: "string", description: "تاريخ النهاية YYYY-MM-DD" },
          payment_type: { type: "string", enum: ["cash", "bank"], description: "نوع السداد للفلترة" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_shortages",
      description: "استعلام عن النواقص الحالية بفلاتر",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "اسم الدواء للبحث" },
          scientific_name: { type: "string", description: "الاسم العلمي للبحث" }
        }
      }
    }
  }
];

// Execute tool calls against the database
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  adminSupabase: ReturnType<typeof createClient>,
  userId: string,
  userName: string
): Promise<string> {
  try {
    switch (toolName) {
      case 'add_payment': {
        const { company_name, amount, payment_type, payment_date, notes } = args as {
          company_name: string; amount: number; payment_type: string; payment_date: string; notes?: string;
        };

        // Verify company exists
        const { data: companies } = await adminSupabase
          .from('companies')
          .select('name')
          .ilike('name', `%${company_name}%`);

        if (!companies || companies.length === 0) {
          // List available companies
          const { data: allCompanies } = await adminSupabase.from('companies').select('name').order('name');
          const names = allCompanies?.map(c => c.name).join('، ') || 'لا توجد شركات';
          return JSON.stringify({ success: false, error: `لم يتم العثور على شركة باسم "${company_name}". الشركات المتاحة: ${names}` });
        }

        const exactName = companies.find(c => c.name === company_name)?.name || companies[0].name;

        const { data, error } = await adminSupabase.from('payments').insert({
          company_name: exactName,
          amount,
          payment_type,
          payment_date,
          notes: notes || null,
          created_by_id: userId,
          created_by_name: userName,
        }).select().single();

        if (error) return JSON.stringify({ success: false, error: error.message });
        return JSON.stringify({ success: true, message: `تم إضافة سداد بقيمة ${amount.toLocaleString()} د.ل لشركة ${exactName} بتاريخ ${payment_date} (${payment_type === 'cash' ? 'كاش' : 'مصرف'})`, data });
      }

      case 'add_shortage': {
        const { name, scientific_name, company, notes } = args as {
          name: string; scientific_name: string; company?: string; notes?: string;
        };

        // Check for duplicates
        const { data: existing } = await adminSupabase
          .from('medicines')
          .select('name, scientific_name, status')
          .eq('status', 'shortage')
          .ilike('name', `%${name}%`);

        if (existing && existing.length > 0) {
          const dupes = existing.map(e => `${e.name} (${e.scientific_name})`).join('، ');
          return JSON.stringify({ success: false, error: `يوجد صنف مشابه مسجل بالفعل في النواقص: ${dupes}. هل تريد الإضافة رغم ذلك؟` });
        }

        const { data, error } = await adminSupabase.from('medicines').insert({
          name,
          scientific_name,
          company: company || null,
          notes: notes || null,
          status: 'shortage',
          updated_by_id: userId,
          updated_by_name: userName,
        }).select().single();

        if (error) return JSON.stringify({ success: false, error: error.message });
        return JSON.stringify({ success: true, message: `تم تسجيل نقص صنف ${name} (${scientific_name})` });
      }

      case 'query_payments': {
        const { company_name, date_from, date_to, payment_type } = args as {
          company_name?: string; date_from?: string; date_to?: string; payment_type?: string;
        };

        let query = adminSupabase.from('payments').select('*').order('payment_date', { ascending: false });

        if (company_name) query = query.ilike('company_name', `%${company_name}%`);
        if (date_from) query = query.gte('payment_date', date_from);
        if (date_to) query = query.lte('payment_date', date_to);
        if (payment_type) query = query.eq('payment_type', payment_type);

        const { data, error } = await query;
        if (error) return JSON.stringify({ success: false, error: error.message });

        const total = (data || []).reduce((s, p) => s + Number(p.amount), 0);
        const records = (data || []).map(p => ({
          company: p.company_name,
          amount: Number(p.amount),
          type: p.payment_type === 'cash' ? 'كاش' : 'مصرف',
          date: p.payment_date,
          notes: p.notes,
          created_by: p.created_by_name,
          is_deducted: p.is_deducted,
        }));

        return JSON.stringify({
          success: true,
          count: records.length,
          total,
          records: records.slice(0, 50), // limit for context window
          message: `تم العثور على ${records.length} سداد بإجمالي ${total.toLocaleString()} د.ل`
        });
      }

      case 'query_shortages': {
        const { name, scientific_name } = args as { name?: string; scientific_name?: string };

        let query = adminSupabase.from('medicines').select('*').eq('status', 'shortage').order('repeat_count', { ascending: false });

        if (name) query = query.ilike('name', `%${name}%`);
        if (scientific_name) query = query.ilike('scientific_name', `%${scientific_name}%`);

        const { data, error } = await query;
        if (error) return JSON.stringify({ success: false, error: error.message });

        const records = (data || []).map(m => ({
          name: m.name,
          scientific_name: m.scientific_name,
          company: m.company,
          repeat_count: m.repeat_count,
          notes: m.notes,
          last_updated: m.last_updated,
          updated_by: m.updated_by_name,
        }));

        return JSON.stringify({
          success: true,
          count: records.length,
          records: records.slice(0, 50),
          message: `تم العثور على ${records.length} صنف ناقص`
        });
      }

      default:
        return JSON.stringify({ success: false, error: `أداة غير معروفة: ${toolName}` });
    }
  } catch (err) {
    console.error(`Tool ${toolName} error:`, err);
    return JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'خطأ غير متوقع' });
  }
}

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

    const userId = claimsData.user.id;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await adminSupabase.from('profiles').select('role, name').eq('id', userId).single();
    if (!profile || !['admin', 'ahmad_rajili'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'غير مصرح لك' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userName = profile.name || 'مستخدم';
    const { messages } = await req.json();

    // Fetch snapshot data for context
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
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

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

    const cm = getMonthData(currentMonth, currentYear);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const pm = getMonthData(prevMonth, prevYear);

    let monthlySummary = '';
    for (let i = 0; i < 6; i++) {
      const m = (currentMonth - i + 12) % 12;
      const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const data = getMonthData(m, y);
      if (data.revenueCount > 0 || data.expenseCount > 0 || data.paymentCount > 0) {
        monthlySummary += `- ${monthNames[m]} ${y}: إيرادات ${data.revenue.toLocaleString()} | مصاريف ${data.expenses.toLocaleString()} | سدادات ${data.payments.toLocaleString()} | صافي ${(data.revenue - data.expenses - data.payments).toLocaleString()}\n`;
      }
    }

    const companyBreakdown = companies.map(c => {
      const cPayments = payments.filter(p => p.company_name === c.name);
      const total = cPayments.reduce((s, p) => s + Number(p.amount), 0);
      const undeducted = cPayments.filter(p => !p.is_deducted).reduce((s, p) => s + Number(p.amount), 0);
      return { name: c.name, rep: c.representative_name, total, undeducted, count: cPayments.length };
    }).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

    const cmExpenses = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    const topExpenses = [...cmExpenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 10);
    const recurringShortages = shortages.filter(m => (m.repeat_count || 0) >= 3);
    const cashPayments = payments.filter(p => p.payment_type === 'cash');
    const bankPayments = payments.filter(p => p.payment_type !== 'cash');
    const bankingRevenues = revenues.filter(r => r.type === 'banking_service');

    const dataContext = `
## البيانات الشاملة (${today.toLocaleDateString('ar-LY')}):

### قائمة الشركات المسجلة:
${companies.map(c => `- ${c.name}${c.representative_name ? ` (المندوب: ${c.representative_name})` : ''}`).join('\n') || '- لا توجد شركات'}

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

### النواقص الحالية (أدوية): ${shortages.length} صنف
${shortages.slice(0, 20).map(m => `- ${m.name}${m.scientific_name ? ` (${m.scientific_name})` : ''}${m.company ? ` - ${m.company}` : ''} | تكرر ${m.repeat_count || 1} مرة`).join('\n') || '- لا توجد نواقص'}

### نواقص المستلزمات: ${supplyShortages.length}
${supplyShortages.slice(0, 10).map(s => `- ${s.name}`).join('\n') || '- لا توجد نواقص مستلزمات'}

### إحصائيات عامة:
- إجمالي الإيرادات: ${revenues.reduce((s, r) => s + Number(r.amount), 0).toLocaleString()} د.ل
- إجمالي المصاريف: ${expenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()} د.ل
- إجمالي السدادات: ${payments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()} د.ل
- عدد الشركات: ${companies.length}
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // First API call with tools
    const firstResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        tools: TOOLS,
        stream: false, // Non-streaming for tool call detection
      }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز الحد الأقصى للطلبات' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (firstResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'يرجى إضافة رصيد لخدمة الذكاء الاصطناعي' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const errorText = await firstResponse.text();
      console.error('AI gateway error:', firstResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'حدث خطأ في خدمة الذكاء الاصطناعي' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const firstResult = await firstResponse.json();
    const firstChoice = firstResult.choices?.[0];

    // Check if the model wants to call tools
    if (firstChoice?.finish_reason === 'tool_calls' || firstChoice?.message?.tool_calls?.length > 0) {
      const toolCalls = firstChoice.message.tool_calls;
      const toolResults: Array<{ role: string; tool_call_id: string; content: string }> = [];

      // Execute all tool calls
      for (const tc of toolCalls) {
        const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        console.log(`Executing tool: ${tc.function.name}`, args);
        const result = await executeTool(tc.function.name, args, adminSupabase, userId, userName);
        toolResults.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        });
      }

      // Second API call with tool results - stream this one
      const secondResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            firstChoice.message,
            ...toolResults,
          ],
          stream: true,
        }),
      });

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        console.error('AI second call error:', secondResponse.status, errorText);
        return new Response(JSON.stringify({ error: 'حدث خطأ أثناء معالجة النتيجة' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(secondResponse.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // No tool calls - stream the response directly
    // Re-call with streaming since first call was non-streaming
    const streamResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error('AI stream error:', streamResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'حدث خطأ في الاتصال' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('tiryak-analytics-ai error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ غير متوقع' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
