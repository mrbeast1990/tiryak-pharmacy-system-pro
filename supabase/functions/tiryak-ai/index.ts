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
    let guideIsEmpty = false;
    
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

      // Fetch pharmacy guide with location field
      const { data: guideData } = await supabase
        .from("pharmacy_guide")
        .select("trade_name, scientific_name, concentration, origin, pharmacist_notes, keywords, location");

      if (guideData && guideData.length > 0) {
        pharmacyGuideContext = `\n\n## دليل الصيدلية (${guideData.length} صنف):\n` +
          guideData.map(d => 
            `- ${d.trade_name} | المادة: ${d.scientific_name}${d.concentration ? ` | التركيز: ${d.concentration}` : ""}${d.location ? ` | 📍 الموقع: ${d.location}` : ""}${d.pharmacist_notes ? ` | ملاحظات: ${d.pharmacist_notes}` : ""}${d.keywords?.length ? ` | كلمات: ${d.keywords.join(', ')}` : ""}`
          ).join("\n");
      } else {
        guideIsEmpty = true;
      }
    }

    const systemPrompt = `أنت 'مستشار الترياق الذكي' لصيدلية "الترياق الشافي" في أجدابيا. مهمتك الأساسية هي إعطاء قرار صرف دقيق ومختصر للموظف أمام العميل.

## 1. مصادر البيانات والأولويات:
- **الأولوية 1**: دليل الصيدلية pharmacy_guide (الأسماء، البدائل، والمواقع 📍)
- **الأولوية 2**: قائمة النواقص shortages
- **الأولوية 3**: المعرفة الطبية العامة (للتعريف بالأصناف الغريبة وحساب الجرعات فقط)

## 2. القواعد الذهبية (إلزامية):
⛔ **ممنوع منعاً باتاً**:
- ذكر أي اسم دواء تجاري غير موجود في دليل الصيدلية كأنه متوفر
- ذكر أي سعر لأي دواء
- الفقرات الطويلة أو شرح المعادلات الرياضية

✅ **مسموح**:
- شرح المادة العلمية بإيجاز للأصناف الغريبة
- اقتراح البدائل من دليلنا فقط

## 3. هيكلية الرد (قاعدة الاختصار الشديد):
يجب أن يكون الرد قصيراً جداً ومركزاً، ومرتباً كالتالي:

[SUMMARY]سطر واحد فقط لوصف الحالة والهدف[/SUMMARY]

[DOSE]ذكر الرقم والتركيز المطلوب بخط عريض[/DOSE]

[DECISION]
✅ **القرار النهائي (اصرف من صيدليتنا)**:
• **الدواء**: (اسم الدواء المتوفر في دليلنا)
• **الجرعة**: (الكمية بالمل أو الحبة)
• **📍 الموقع**: (استخرج من حقل Location في الدليل)
• **الاستخدام**: (نص مختصر من ملاحظات الصيدلي)
[/DECISION]

[WARNING]تنبيه: ذكر النواقص المرتبطة من جدول النواقص في سطر واحد فقط[/WARNING]

## 4. حاسبة الجرعات (معادلات APLS):
عند عدم توفر الوزن، قدره من العمر (بدون شرح المعادلة):
- (1-12 شهر): (العمر بالأشهر + 9) ÷ 2 كجم
- (1-5 سنوات): (العمر × 2) + 8 كجم
- (6-12 سنة): (العمر × 3) + 7 كجم

## 5. التعامل مع الأصناف الغريبة:
إذا الدواء غير موجود في دليلنا:
1. عرّفه علمياً في سطر واحد
2. قل: "هذا الصنف غير مسجل في دليل صيدليتنا"
3. اقترح فوراً البديل المتوفر من دليلنا مع موقعه 📍
4. إذا لا يوجد بديل في دليلنا، قل: "لا توجد بدائل مسجلة حالياً"

## 6. الخاتمة:
اختم دائماً بـ: 'يرجى مراجعة الصيدلي المسؤول والتأكد من الروشتة.'
${guideIsEmpty ? `
⚠️ **تنبيه هام**: دليل الصيدلية فارغ حالياً. المعلومات المعروضة من المعرفة الطبية العامة فقط ولا تؤكد توفر المنتجات.
` : ''}
---
## بيانات الصيدلية الحالية:
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
