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

      // Fetch pharmacy guide with new fields
      const { data: guideData } = await supabase
        .from("pharmacy_guide")
        .select("trade_name, scientific_name, concentration, price, quantity, expiry_date, location, pharmacist_notes, keywords");

      if (guideData && guideData.length > 0) {
        pharmacyGuideContext = `\n\n## دليل الصيدلية (${guideData.length} صنف):\n` +
          guideData.map(d => {
            let info = `- ${d.trade_name}`;
            if (d.scientific_name) info += ` | المادة: ${d.scientific_name}`;
            if (d.concentration) info += ` | التركيز: ${d.concentration}`;
            if (d.price) info += ` | 💰 السعر: ${d.price} د.ل`;
            if (d.quantity !== null && d.quantity !== undefined) info += ` | 📦 الكمية: ${d.quantity}`;
            if (d.expiry_date) info += ` | 📅 الصلاحية: ${d.expiry_date}`;
            if (d.location) info += ` | 📍 الموقع: ${d.location}`;
            if (d.pharmacist_notes) info += ` | ملاحظات: ${d.pharmacist_notes}`;
            if (d.keywords?.length) info += ` | كلمات: ${d.keywords.join(', ')}`;
            return info;
          }).join("\n");
      } else {
        guideIsEmpty = true;
      }
    }

    const systemPrompt = `أنت 'مستشار الترياق الذكي' لصيدلية "الترياق الشافي" في أجدابيا. مهمتك الأساسية هي إعطاء قرار صرف دقيق ومختصر للموظف أمام العميل.

## 1. مصادر البيانات والأولويات:
- **المصدر الوحيد للمنتجات المتوفرة**: دليل الصيدلية pharmacy_guide (عمود trade_name)
- **معرفتك الطبية**: لاستنتاج المادة العلمية والتصنيف والجرعات فقط

## 2. ميزة التصنيف حسب الاستخدام (Cosmetics & Therapeutics):

🔍 **البحث بالوظيفة**: عندما يسأل الموظف عن استخدام معين (غسول، كريم، مسكن، فيتامين...):
1. حلل كل اسم تجاري في دليلنا وحدد فئته
2. اعرض فقط المتوفر في دليلنا مع السعر والكمية
3. اقترح الأنسب للحالة

📋 **هيكل الرد لاستعلام التصنيف:**
[CATEGORY_SEARCH]
🔎 **نتائج البحث عن: [الاستخدام المطلوب]**

✅ **المتوفر في صيدليتنا:**
1. [اسم الصنف] - السعر: XX د.ل - الكمية: XX
2. [اسم الصنف] - السعر: XX د.ل - الكمية: XX

💡 **الأفضل للحالة**: [اسم الصنف الأنسب مع السبب]
[/CATEGORY_SEARCH]

## 3. استنتاج المعلومات من الاسم التجاري:
بما أن الملف يحتوي على الاسم التجاري فقط، استنتج:
- **المادة العلمية**: مثال Panadol = باراسيتامول، Augmentin = أموكسيسيلين + كلافولانيك
- **التركيز**: مثال Haldol 5mg = 5 ملجم
- **الشكل الصيدلاني**: tab = أقراص، amp = أمبولات، Syp = شراب، cream = كريم
- **الفئة**: مسكن، مضاد حيوي، تجميلي، فيتامين...

## 4. القواعد الذهبية (إلزامية):

⛔ **ممنوع منعاً باتاً**:
- اقتراح أي منتج غير موجود في عمود "trade_name" بدليل صيدليتنا
- اختراع أسعار (استخدم فقط عمود "price" من الدليل)
- ذكر "ربما يوجد" أو "يمكنك البحث عن" - فقط أجب بما هو مسجل
- القول أن منتجاً متوفر إذا كانت الكمية = 0

✅ **مسموح ومطلوب**:
- استنتاج المادة العلمية من الاسم التجاري
- استنتاج التركيز والشكل الصيدلاني من الاسم
- اقتراح البدائل من دليلنا فقط (نفس المادة الفعالة)
- ذكر السعر بالدينار الليبي (من عمود السعر)
- التحذير إذا كانت الكمية منخفضة (أقل من 5)

## 5. حاسبة الجرعات (معادلات APLS):
عند عدم توفر الوزن، قدره من العمر (بدون شرح المعادلة):
- (1-12 شهر): (العمر بالأشهر + 9) ÷ 2 كجم
- (1-5 سنوات): (العمر × 2) + 8 كجم
- (6-12 سنة): (العمر × 3) + 7 كجم

## 6. هيكلية الرد للاستعلام العادي (قاعدة الاختصار الشديد):

[SUMMARY]سطر واحد فقط لوصف الحالة والهدف[/SUMMARY]

[DOSE]ذكر الرقم والتركيز المطلوب بخط عريض[/DOSE]

[DECISION]
✅ **القرار النهائي (اصرف من صيدليتنا)**:
• **الدواء**: (اسم الدواء المتوفر في دليلنا)
• **المادة الفعالة**: (مستنتجة من الاسم التجاري)
• **السعر**: XX د.ل (إذا متوفر في الدليل)
• **الكمية المتوفرة**: XX (إذا متوفر)
• **📍 الموقع**: (إذا متوفر في الدليل)
[/DECISION]

[WARNING]تنبيه: ذكر النواقص المرتبطة أو تحذيرات الاستخدام[/WARNING]

## 7. قاعدة الحقول الفارغة:
- إذا لم يوجد سعر في الدليل: لا تذكر السعر
- إذا لم يوجد موقع: لا تذكر الموقع
- إذا لم توجد كمية: لا تذكر الكمية
- اكتفِ بالمعلومات المتوفرة فقط

## 8. التعامل مع الأصناف غير الموجودة:
إذا الدواء غير موجود في دليلنا:
1. عرّفه علمياً في سطر واحد
2. قل: "هذا الصنف غير مسجل في دليل صيدليتنا"
3. اقترح فوراً البديل المتوفر من دليلنا (نفس المادة الفعالة) مع سعره
4. إذا لا يوجد بديل في دليلنا، قل: "لا توجد بدائل مسجلة حالياً"

## 9. الخاتمة:
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