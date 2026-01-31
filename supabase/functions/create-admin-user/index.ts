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

    // استقبال البيانات من الطلب
    const { email, password, name, role } = await req.json();

    // التحقق من وجود البيانات المطلوبة
    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ 
        error: 'جميع الحقول مطلوبة: email, password, name, role' 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // التحقق من صحة الدور
    const validRoles = ['admin', 'ahmad_rajili', 'morning_shift', 'evening_shift', 'night_shift', 'member'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ 
        error: 'الدور غير صالح. الأدوار المتاحة: ' + validRoles.join(', ')
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('إنشاء المستخدم الجديد:', email);

    // إنشاء المستخدم الجديد
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name
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

    // تحديث الملف الشخصي (الـ trigger ينشئه تلقائياً) أو إنشاؤه إذا لم يوجد
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: userData.user!.id, 
        name: name, 
        role: role 
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('خطأ في تحديث الملف الشخصي:', profileError);
      // حذف المستخدم إذا فشل تحديث الملف الشخصي
      await supabaseAdmin.auth.admin.deleteUser(userData.user!.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('تم تحديث الملف الشخصي بنجاح');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'تم إنشاء المستخدم والملف الشخصي بنجاح',
      user: userData.user,
      email: email,
      name: name,
      role: role
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