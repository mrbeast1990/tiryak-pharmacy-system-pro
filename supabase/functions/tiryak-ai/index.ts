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

    // Fetch current shortages if needed
    let shortageContext = "";
    let pharmacyGuideContext = "";
    
    if (includeShortages) {
      const { data: shortages } = await supabase
        .from("medicines")
        .select("name, company, notes")
        .eq("status", "shortage");

      if (shortages && shortages.length > 0) {
        shortageContext = `\n\nقائمة الأدوية الناقصة حالياً في الصيدلية (${shortages.length} صنف):\n` +
          shortages.map(m => `- ${m.name}${m.company ? ` (${m.company})` : ""}${m.notes ? `: ${m.notes}` : ""}`).join("\n");
      } else {
        shortageContext = "\n\nلا توجد أدوية ناقصة حالياً في الصيدلية.";
      }

      // Fetch pharmacy guide for alternatives
      const { data: guideData } = await supabase
        .from("pharmacy_guide")
        .select("trade_name, scientific_name, concentration, origin, pharmacist_notes");

      if (guideData && guideData.length > 0) {
        pharmacyGuideContext = `\n\nقائمة الأدوية المتوفرة في دليل الصيدلية (${guideData.length} صنف):\n` +
          guideData.slice(0, 100).map(d => 
            `- ${d.trade_name} (${d.scientific_name})${d.concentration ? ` - ${d.concentration}` : ""}${d.origin ? ` - ${d.origin}` : ""}`
          ).join("\n");
      }
    }

    const systemPrompt = `أنت مستشار صيدلاني ذكي اسمه "مستشار الترياق". أنت تعمل في صيدلية الترياق وتساعد الصيادلة والموظفين.

مهامك الأساسية:
1. الإجابة على الأسئلة الصيدلانية والطبية
2. تقديم معلومات عن الأدوية والتعارضات الدوائية
3. اقتراح البدائل المتوفرة عندما يكون الدواء ناقصاً
4. حساب الجرعات المناسبة للأطفال والكبار
5. تقديم نصائح عن طريقة استخدام الأدوية

قواعد مهمة:
- إذا سُئلت عن دواء ناقص، اقترح بديلاً متوفراً من نفس المادة الفعالة
- استخدم اللغة العربية الفصحى السهلة
- كن دقيقاً في المعلومات الطبية
- إذا لم تكن متأكداً، اذكر ذلك وانصح بالرجوع للطبيب
- لا تعطِ تشخيصات طبية، فقط معلومات عن الأدوية
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
