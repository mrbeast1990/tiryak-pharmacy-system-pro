

# خطة إنشاء حساب مستخدم جديد

## ملخص
سأقوم بتعديل Edge Function الموجودة (`create-admin-user`) لتصبح مرنة وتقبل بيانات المستخدم من الطلب، ثم استدعائها لإنشاء الحساب الجديد:

- **الاسم**: عبدالوهاب
- **البريد الإلكتروني**: whab.alzwawy@tiryak.com
- **كلمة المرور**: 12121212
- **الدور**: admin

## المتطلبات

### 1. تعديل Edge Function: `create-admin-user`

سأجعل الدالة تقبل البيانات من body الطلب بدلاً من القيم الثابتة:

```typescript
// supabase/functions/create-admin-user/index.ts
serve(async (req: Request) => {
  // ... CORS handling
  
  // استقبال البيانات من الطلب
  const { email, password, name, role } = await req.json();
  
  // التحقق من وجود البيانات المطلوبة
  if (!email || !password || !name || !role) {
    return new Response(JSON.stringify({ 
      error: 'جميع الحقول مطلوبة: email, password, name, role' 
    }), { status: 400 });
  }
  
  // إنشاء المستخدم بالبيانات المُرسلة
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: name }
  });
  
  // ... باقي الكود
});
```

### 2. استدعاء الدالة لإنشاء الحساب

بعد نشر التعديلات، سأستدعي الدالة مباشرة باستخدام أداة `curl_edge_functions`:

```json
{
  "email": "whab.alzwawy@tiryak.com",
  "password": "12121212",
  "name": "عبدالوهاب",
  "role": "admin"
}
```

## خطوات التنفيذ

| الخطوة | الوصف |
|--------|-------|
| 1 | تعديل `create-admin-user/index.ts` لتقبل البيانات ديناميكياً |
| 2 | نشر Edge Function |
| 3 | استدعاء الدالة لإنشاء حساب عبدالوهاب |
| 4 | التحقق من إنشاء الحساب في قاعدة البيانات |

## ملاحظات تقنية

- الدالة تستخدم `SUPABASE_SERVICE_ROLE_KEY` مما يمنحها صلاحيات كاملة لإنشاء المستخدمين
- سيتم تأكيد البريد الإلكتروني تلقائياً (`email_confirm: true`) بدون الحاجة لرابط تفعيل
- سيتم إنشاء ملف شخصي في جدول `profiles` مع الدور المحدد (`admin`)
- المستخدم سيتمكن من تسجيل الدخول فوراً بكلمة المرور المحددة

## النتيجة المتوقعة

بعد التنفيذ، سيكون لديك مستخدم جديد:
- **البريد**: whab.alzwawy@tiryak.com
- **كلمة المرور**: 12121212
- **الاسم**: عبدالوهاب
- **الصلاحيات**: مدير (admin) - نفس صلاحيات المدير بالضبط

