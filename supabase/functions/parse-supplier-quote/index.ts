import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompt = `أنت مستشار صيدلاني ذكي ومحلل ملفات متخصص في استخراج بيانات عروض أسعار الأدوية من الموردين (كلدة، الأندلس، المختار، وغيرها).

## مهمتك الرئيسية:
1. فهم محتوى الجداول بذكاء مهما اختلفت المسميات أو التنسيقات
2. استخراج جميع الأدوية والمستحضرات من كل صفحات الملف
3. تجاهل أي نصوص غير متعلقة (شروط البيع، العناوين، أرقام الصفحات، معلومات الشركة)

## قواعد الاستخراج الذكي:
- اقرأ كل صفحات الملف من البداية للنهاية
- تجاهل الترويسة (Header) والتذييل (Footer) المتكررين
- إذا وجدت جدولين بجانب بعضهما، استخرج كليهما
- أي سطر يحتوي على (اسم منتج + سعر رقمي) يُعتبر صنفاً

## أعمدة الاستخراج (ابحث عن أي مسمى مشابه):
1. **ITEM DESCRIPTION (اسم الصنف)**: trade_name, name, الاسم, الصنف, المنتج, البند, الدواء, description, item
2. **CODE (كود الصنف)**: code, رقم, كود, رمز, item_code, product_code, sku (اختياري)
3. **PRICE (السعر)**: price, unit_price, السعر, سعر الوحدة, القيمة, الثمن
4. **EXP (الصلاحية)**: expiry, exp, expiry_date, الصلاحية, تاريخ الانتهاء, انتهاء

## تنسيق الإخراج (JSON فقط):
{
  "products": [
    {
      "name": "اسم الصنف الكامل",
      "code": "ABC123",
      "price": 10.50,
      "expiryDate": "2025-12"
    }
  ],
  "rawText": "أول 500 حرف من النص للتصحيح",
  "totalPages": 5,
  "extractedCount": 100,
  "confidence": "high|medium|low"
}

## قواعد صارمة:
- استخرج جميع الأصناف حتى لو كانت المئات
- السعر يجب أن يكون رقماً فقط (بدون عملة)
- code اختياري - إذا لم يوجد اتركه فارغاً
- expiryDate اختياري - إذا لم يوجد اتركه فارغاً
- لا تضف أي نص قبل أو بعد JSON
- تجاهل الصفوف الفارغة والعناوين الرئيسية
- الثقة "high" إذا الجدول واضح، "medium" إذا احتجت استنتاج، "low" إذا كان غير واضح`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileName } = await req.json();

    if (!fileBase64) {
      return new Response(
        JSON.stringify({ error: 'لم يتم تقديم ملف' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'مفتاح API غير مكوّن' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing PDF file: ${fileName}`);

    // Call Lovable AI Gateway with the PDF as base64
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: `استخرج بيانات المنتجات من ملف PDF التالي (${fileName}). أرجع JSON فقط.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${fileBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز حد الطلبات، حاول مجدداً لاحقاً' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يرجى إضافة رصيد لحسابك' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'فشل في معالجة الملف بالذكاء الاصطناعي' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log("AI Response:", content);

    // Extract JSON from response
    let products = [];
    let rawText = '';
    let totalPages = 1;
    let extractedCount = 0;
    let confidence = 'low';
    
    try {
      // Try to parse directly
      const parsed = JSON.parse(content);
      products = parsed.products || [];
      rawText = parsed.rawText || '';
      totalPages = parsed.totalPages || 1;
      extractedCount = parsed.extractedCount || products.length;
      confidence = parsed.confidence || 'medium';
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          products = parsed.products || [];
          rawText = parsed.rawText || '';
          totalPages = parsed.totalPages || 1;
          confidence = parsed.confidence || 'medium';
        } catch {
          rawText = content.substring(0, 1000);
        }
      } else {
        // Try to find JSON object in text
        const jsonObjMatch = content.match(/\{[\s\S]*"products"[\s\S]*\}/);
        if (jsonObjMatch) {
          try {
            const parsed = JSON.parse(jsonObjMatch[0]);
            products = parsed.products || [];
            rawText = parsed.rawText || '';
            totalPages = parsed.totalPages || 1;
            confidence = parsed.confidence || 'medium';
          } catch {
            rawText = content.substring(0, 1000);
          }
        } else {
          rawText = content.substring(0, 1000);
        }
      }
    }

    console.log(`Extracted ${products.length} products from ${totalPages} pages (confidence: ${confidence})`);

    return new Response(
      JSON.stringify({ 
        products,
        rawText,
        totalPages,
        extractedCount: products.length,
        confidence 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("parse-supplier-quote error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ غير معروف' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
