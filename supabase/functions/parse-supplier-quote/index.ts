import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompt = `أنت محلل ملفات PDF متخصص في استخراج بيانات عروض الأسعار من الموردين.

مهمتك:
1. استخراج جميع المنتجات من الجدول المرفق
2. لكل منتج، استخرج: اسم الصنف، السعر، تاريخ الصلاحية (إن وجد)

قواعد الاستخراج:
- ابحث عن أعمدة تحتوي على: اسم الصنف، الاسم، المنتج، trade_name
- ابحث عن أعمدة تحتوي على: السعر، سعر الوحدة، unit_price
- ابحث عن أعمدة تحتوي على: الصلاحية، تاريخ الصلاحية، expiry

أرجع النتيجة بتنسيق JSON فقط:
{
  "products": [
    {"name": "اسم الصنف", "price": 10.50, "expiryDate": "2025-12"}
  ]
}

ملاحظات:
- السعر يجب أن يكون رقماً
- إذا لم يوجد تاريخ صلاحية، اتركه فارغاً
- لا تضف أي نص إضافي، فقط JSON`;

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
    try {
      // Try to parse directly
      const parsed = JSON.parse(content);
      products = parsed.products || [];
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        products = parsed.products || [];
      } else {
        // Try to find JSON object in text
        const jsonObjMatch = content.match(/\{[\s\S]*"products"[\s\S]*\}/);
        if (jsonObjMatch) {
          const parsed = JSON.parse(jsonObjMatch[0]);
          products = parsed.products || [];
        }
      }
    }

    console.log(`Extracted ${products.length} products`);

    return new Response(
      JSON.stringify({ products }),
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
