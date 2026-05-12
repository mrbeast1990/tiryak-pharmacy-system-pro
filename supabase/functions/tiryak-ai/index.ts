import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller (prevents AI cost abuse + data exposure)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrlEnv = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrlEnv, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, includeShortages = true } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client to fetch shortage data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current shortages and pharmacy guide
    let shortageContext = "";
    let pharmacyGuideContext = "";
    
    // Always fetch pharmacy guide (Knowledge Base)
    const { data: guideData, error: guideError } = await supabase
      .from("pharmacy_guide")
      .select("trade_name, scientific_name, concentration, price, quantity, expiry_date, pharmacist_notes, keywords");

    if (guideError) {
      console.error("Error fetching pharmacy guide:", guideError);
    }

    if (guideData && guideData.length > 0) {
      // ⛔ إرسال الأصناف المتوفرة فقط (quantity > 0) - تصفية صارمة
      const availableItems = guideData.filter(d => d.quantity && d.quantity > 0);
      
      pharmacyGuideContext = `\n\n## دليل الصيدلية (${availableItems.length} صنف متوفر للبيع):\n` +
        availableItems.map(d => {
          let info = `- ${d.trade_name}`;
          if (d.scientific_name) info += ` | المادة: ${d.scientific_name}`;
          if (d.concentration) info += ` | التركيز: ${d.concentration}`;
          if (d.price) info += ` | السعر: ${d.price} د.ل`;
          info += ` | الكمية: ${d.quantity}`;
          if (d.expiry_date) info += ` | الصلاحية: ${d.expiry_date}`;
          if (d.pharmacist_notes) info += ` | ملاحظات: ${d.pharmacist_notes}`;
          if (d.keywords?.length) info += ` | كلمات: ${d.keywords.join(', ')}`;
          return info;
        }).join("\n");
    } else {
      console.warn("Pharmacy guide is empty or failed to load");
      pharmacyGuideContext = "\n\n## دليل الصيدلية: لم يتم تحميل البيانات بعد. يرجى رفع ملف الأصناف أولاً.";
    }
    
    // Fetch shortages if requested
    if (includeShortages) {
      const { data: shortages } = await supabase
        .from("medicines")
        .select("name, company, notes")
        .eq("status", "shortage");

      if (shortages && shortages.length > 0) {
        shortageContext = `\n\n## قائمة النواقص الحالية (${shortages.length} صنف):\n` +
          shortages.map(m => `- ⚠️ ${m.name}${m.company ? ` (${m.company})` : ""}${m.notes ? ` | ملاحظة: ${m.notes}` : ""}`).join("\n");
      } else {
        shortageContext = "\n\n## قائمة النواقص: لا توجد أدوية ناقصة حالياً.";
      }
    }

    const systemPrompt = `أنت 'مستشار الترياق الذكي' لصيدلية "الترياق الشافي" في أجدابيا. مهمتك مساعدة الموظف بتوصيات دقيقة للأصناف المتوفرة.

## ⚠️ قاعدة المخزون الصارمة (الأهم):
- كل الأصناف في الدليل أدناه **متوفرة فعلياً** (الكمية > 0)
- الأصناف غير المتوفرة (الكمية = 0) **محذوفة تماماً** من البيانات
- لا تقل أبداً "إذا كان متوفراً" أو "تحقق من المخزون" - كل ما تراه متوفر

## 🎨 الصناديق الملونة (استخدمها دائماً):

### للملخص والنظرة السريعة (صندوق بنفسجي):
[SUMMARY]
إليك X خيارات متوفرة لـ [الطلب]:
[/SUMMARY]

### للجرعات الدوائية (صندوق أحمر):
[DOSE]جرعة الدواء والتكرار[/DOSE]

### للتحذيرات المهمة (صندوق برتقالي):
[WARNING]التحذيرات والموانع[/WARNING]

### لطريقة الاستخدام (صندوق أزرق):
[USAGE]طريقة الاستخدام المثالية[/USAGE]

### للبدائل المتوفرة (صندوق تيل):
[ALT]البدائل المتاحة من المخزون[/ALT]

### للقرار النهائي (صندوق أخضر):
[DECISION]التوصية النهائية للصرف[/DECISION]

## 📋 تنسيق الرد الإلزامي (للبحث عن منتجات):

عند البحث عن منتجات (مرطب، غسول، دواء، فيتامين...)، استخدم هذا التنسيق:

[SUMMARY]
إليك الخيارات المتوفرة لـ [وصف الطلب]:
[/SUMMARY]

1. **[اسم الصنف التجاري بالكامل]**
   - 💡 نبذة: [سطر واحد - ميزة المنتج الرئيسية من معرفتك الطبية]
   - 🧴 الاستعمال: [سطر واحد - طريقة الاستخدام المثالية]
   - السعر: [XX] د.ل | الكمية المتوفرة: [XX]

2. **[اسم الصنف التجاري بالكامل]**
   - 💡 نبذة: [ميزة المنتج]
   - 🧴 الاستعمال: [طريقة الاستخدام]
   - السعر: [XX] د.ل | الكمية المتوفرة: [XX]

[USAGE]
النصيحة العامة للاستخدام (إن وجدت)
[/USAGE]

[WARNING]
أي تحذيرات أو موانع مهمة (إن وجدت)
[/WARNING]

يرجي التواصل مع الدكتور أحمد الرجيلي والتأكد من الروشيتة

## 📋 تنسيق الرد للأدوية (جرعات):

[SUMMARY]
معلومات عن [اسم الدواء]:
[/SUMMARY]

[DOSE]
الجرعة الاعتيادية: ...
التكرار: ...
[/DOSE]

[WARNING]
الموانع والتحذيرات...
[/WARNING]

[DECISION]
التوصية: صرف الدواء بالجرعة المحددة
[/DECISION]

يرجي التواصل مع الدكتور أحمد الرجيلي والتأكد من الروشيتة

## 🔍 البحث الذكي للكوزمتك:

عند السؤال عن "مرطب" أو "غسول" أو منتج تجميلي:
1. **لا تبحث عن الجملة حرفياً** - ابحث عن الماركات في الدليل
2. **الماركات**: CeraVe, ACM, ISIS, Eucerin, La Roche-Posay, Vichy, Bioderma, Uriage, Avene, Cetaphil, SVR, Ducray, Noreva, Sebamed
3. **استنتج من اسم المنتج**:
   - للبشرة الجافة: Moisturising, Hydrating, PM, Lotion, Balm, Rich, Nourishing
   - للبشرة الدهنية: Foaming, SA, Oil Control, Gel, Effaclar, Oily, Mattifying
   - للبشرة الحساسة: Sensitive, Toleriane, Calm, Soothing

## 🧪 استنتاج المعلومات من الاسم التجاري:

- **المادة العلمية**: Panadol = باراسيتامول، Augmentin = أموكسيسيلين + كلافولانيك
- **التركيز**: Haldol 5mg = 5 ملجم
- **الشكل**: tab = أقراص، amp = أمبولات، Syp = شراب، cream = كريم

## ⛔ ممنوع منعاً باتاً:
- اقتراح منتج غير موجود في الدليل المرفق
- اختراع أسعار (استخدم فقط السعر من الدليل)
- ذكر "ربما يوجد" أو "يمكنك البحث"
- الاعتذار التقني أو القول "لا أستطيع الوصول" أو "الدليل فارغ"
- ذكر أي صنف غير موجود في القائمة أدناه

## 📞 التذييل الثابت (إلزامي):
**اختم كل رد بهذه العبارة حصراً:**
"يرجي التواصل مع الدكتور أحمد الرجيلي والتأكد من الروشيتة"

## 🏥 التعامل مع الأصناف غير الموجودة:
إذا الصنف غير موجود في دليلنا:
1. عرّفه علمياً في سطر واحد
2. قل: "هذا الصنف غير مسجل في دليل صيدليتنا"
3. اقترح البديل المتوفر من دليلنا (نفس المادة الفعالة) بالتنسيق أعلاه
4. إذا لا يوجد بديل: "لا توجد بدائل مسجلة حالياً"
5. اختم بالتذييل الثابت

---
## بيانات الصيدلية الحالية (المخزون المتوفر فقط):
${shortageContext}
${pharmacyGuideContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام المستشار الذكي" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "حدث خطأ في الاتصال بالمستشار الذكي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("tiryak-ai error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
