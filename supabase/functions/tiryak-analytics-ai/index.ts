import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `أنت "مساعد الترياق التحليلي" - مساعد ذكي ودود لصيدلية الترياق الشافي.
أنت شات بوت محادثة ذكي يتحدث مع المستخدم بشكل طبيعي ومهني.

## شخصيتك:
- أنت ودود ومحترف
- ترد على التحيات بشكل طبيعي (مرحباً، أهلاً، الخ)
- تسأل كيف يمكنك المساعدة عند التحية
- تتحدث بالعربية الفصحى البسيطة
- تستخدم الإيموجي باعتدال للتعبير 😊

## قواعد المحادثة:
1. عندما يحييك المستخدم (مرحبا، أهلا، السلام عليكم، هاي، الخ):
   - رد بتحية مناسبة
   - قل "كيف يمكنني مساعدتك اليوم؟" أو ما شابه
   - لا تعرض بيانات مالية فوراً

2. عندما يسأل المستخدم سؤالاً محدداً:
   - أجب على السؤال مباشرة
   - استخدم البيانات المتاحة للإجابة

3. للأسئلة العامة (من أنت؟ ماذا تفعل؟):
   - عرّف نفسك بإيجاز
   - اذكر قدراتك الرئيسية

## قدراتك التحليلية:
عندما يُطلب منك تحليل، يمكنك:
- 📈 تحليل الأرباح والإيرادات
- ⚠️ كشف الخلل في المصاريف
- 🔄 تتبع النواقص المتكررة
- 📊 تقديم ملخصات مالية

## تنسيق الردود:
- استخدم الإيموجي المناسب
- قدم الأرقام بتنسيق واضح مع العملة (د.ل)
- استخدم القوائم والتنسيق لتسهيل القراءة

تذكر: كن طبيعياً ومحادثاً، لا تقفز للبيانات المالية إلا عند الطلب.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // التحقق من المصادقة
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // التحقق من صلاحيات المستخدم
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'جلسة غير صالحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // جلب دور المستخدم من جدول profiles
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', claimsData.user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'لم يتم العثور على الملف الشخصي' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['admin', 'ahmad_rajili'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح لك بالوصول إلى هذه الخدمة' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = await req.json();

    // جلب البيانات من قاعدة البيانات
    const [revenuesResult, expensesResult, paymentsResult, medicinesResult] = await Promise.all([
      adminSupabase.from('revenues').select('*').order('date', { ascending: false }).limit(500),
      adminSupabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(500),
      adminSupabase.from('payments').select('*').order('payment_date', { ascending: false }).limit(500),
      adminSupabase.from('medicines').select('*').eq('status', 'shortage').order('repeat_count', { ascending: false }),
    ]);

    // حساب الملخصات
    const revenues = revenuesResult.data || [];
    const expenses = expensesResult.data || [];
    const payments = paymentsResult.data || [];
    const shortages = medicinesResult.data || [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // إيرادات الشهر الحالي
    const currentMonthRevenues = revenues.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalCurrentMonthRevenue = currentMonthRevenues.reduce((sum, r) => sum + Number(r.amount), 0);

    // مصاريف الشهر الحالي
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.expense_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalCurrentMonthExpenses = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // سدادات الشهر الحالي
    const currentMonthPayments = payments.filter(p => {
      const d = new Date(p.payment_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalCurrentMonthPayments = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // النواقص المتكررة
    const recurringShortages = shortages.filter(m => (m.repeat_count || 0) >= 3);

    // حساب متوسط المصاريف للأشهر الثلاثة السابقة
    const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
    const lastThreeMonthsExpenses = expenses.filter(e => {
      const d = new Date(e.expense_date);
      return d >= threeMonthsAgo && (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear);
    });
    const avgLastThreeMonthsExpenses = lastThreeMonthsExpenses.length > 0
      ? lastThreeMonthsExpenses.reduce((sum, e) => sum + Number(e.amount), 0) / 3
      : 0;

    // تحليل الخلل في المصاريف
    let expenseAnomaly = '';
    if (avgLastThreeMonthsExpenses > 0) {
      const percentChange = ((totalCurrentMonthExpenses - avgLastThreeMonthsExpenses) / avgLastThreeMonthsExpenses) * 100;
      if (percentChange > 50) {
        expenseAnomaly = `🔴 تنبيه حرج: المصاريف أعلى بـ ${percentChange.toFixed(1)}% من المتوسط!`;
      } else if (percentChange > 30) {
        expenseAnomaly = `🟠 تنبيه: المصاريف أعلى بـ ${percentChange.toFixed(1)}% من المتوسط.`;
      }
    }

    // أكبر 5 مصاريف
    const topExpenses = [...currentMonthExpenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    // إنشاء سياق البيانات
    const dataContext = `
## البيانات الحالية (${today.toLocaleDateString('ar-LY')}):

### الإيرادات (الشهر الحالي):
- الإجمالي: ${totalCurrentMonthRevenue.toLocaleString('ar-LY')} د.ل
- عدد السجلات: ${currentMonthRevenues.length}

### المصاريف (الشهر الحالي):
- الإجمالي: ${totalCurrentMonthExpenses.toLocaleString('ar-LY')} د.ل
- متوسط الأشهر الثلاثة السابقة: ${avgLastThreeMonthsExpenses.toLocaleString('ar-LY')} د.ل
${expenseAnomaly ? `- ${expenseAnomaly}` : ''}
- أكبر المصاريف:
${topExpenses.map((e, i) => `  ${i + 1}. ${e.description}: ${Number(e.amount).toLocaleString('ar-LY')} د.ل`).join('\n')}

### السدادات للشركات (الشهر الحالي):
- الإجمالي: ${totalCurrentMonthPayments.toLocaleString('ar-LY')} د.ل

### صافي الربح التقديري:
${(totalCurrentMonthRevenue - totalCurrentMonthExpenses - totalCurrentMonthPayments).toLocaleString('ar-LY')} د.ل

### النواقص المتكررة (repeat_count >= 3):
${recurringShortages.length > 0 
  ? recurringShortages.slice(0, 10).map(m => `- ${m.name}${m.scientific_name ? ` (${m.scientific_name})` : ''}: تكرر ${m.repeat_count} مرات`).join('\n')
  : '- لا توجد أصناف متكررة بشكل ملحوظ'}

### إحصائيات عامة:
- إجمالي الإيرادات (كل الفترات): ${revenues.reduce((sum, r) => sum + Number(r.amount), 0).toLocaleString('ar-LY')} د.ل
- إجمالي المصاريف (كل الفترات): ${expenses.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString('ar-LY')} د.ل
- إجمالي السدادات (كل الفترات): ${payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('ar-LY')} د.ل
- عدد النواقص الحالية: ${shortages.length}
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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
        return new Response(
          JSON.stringify({ error: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يرجى إضافة رصيد لخدمة الذكاء الاصطناعي' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'حدث خطأ في خدمة الذكاء الاصطناعي' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('tiryak-analytics-ai error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
