import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('إنشاء المستخدم الجديد...');

    // إنشاء المستخدم الجديد
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'thepanaceapharmacy@gmail.com',
      password: 'thepanaceapharmacy@gmail.com',
      email_confirm: true,
      user_metadata: {
        full_name: 'أحمد الرجيلي'
      }
    });

    if (userError) {
      console.error('خطأ في إنشاء المستخدم:', userError);
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('تم إنشاء المستخدم بنجاح:', userData.user?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'تم إنشاء المستخدم بنجاح',
      user: userData.user 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('خطأ عام:', error);
    return new Response(JSON.stringify({ error: 'خطأ في الخادم' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});