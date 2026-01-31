

# خطة إضافة اختيار الدور عند الموافقة على طلبات الحسابات

## الملخص
إضافة قائمة منسدلة لاختيار دور المستخدم بجانب زر الموافقة، مع منع الموافقة حتى يتم تحديد الدور.

## التغييرات المطلوبة

### 1. تحديث صفحة طلبات الحسابات (AccountRequests.tsx)

**إضافة قائمة اختيار الدور:**
- إضافة state لتخزين الأدوار المحددة لكل طلب
- إضافة قائمة منسدلة (Select) لاختيار الدور
- تعطيل زر الموافقة حتى يتم اختيار الدور
- إرسال الدور المختار مع الطلب

**الأدوار المتاحة للاختيار:**
| الدور | الاسم العربي |
|-------|-------------|
| admin | المدير |
| ahmad_rajili | أحمد الرجيلي |
| morning_shift | الفترة الصباحية |
| evening_shift | الفترة المسائية |
| night_shift | الفترة الليلية |
| member | عضو عادي |

**تخطيط الواجهة الجديد:**
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ الاسم الكامل │ البريد │ الهاتف │ التاريخ │        الإجراءات              │
├────────────────────────────────────────────────────────────────────────────┤
│ محمد         │ m@x.com│ 05...  │ 2026   │ [اختر الدور ▼] [قبول] [رفض]  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2. تحديث Edge Function (approve-request/index.ts)

**التغييرات:**
- استقبال معامل `role` من الطلب
- التحقق من صحة الدور المرسل
- تعيين الدور للمستخدم الجديد عند إنشائه عبر `user_metadata`
- تحديث الـ trigger أو إضافة تحديث للملف الشخصي بعد الإنشاء

### 3. تحديث Trigger (handle_new_user)

**المنطق الجديد:**
- التحقق من وجود دور في `raw_user_meta_data`
- إذا وُجد دور، استخدامه بدلاً من المنطق الافتراضي
- هذا يسمح بتعيين الدور ديناميكياً عند الموافقة

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/pages/Admin/AccountRequests.tsx` | إضافة Select للدور وتعديل منطق الموافقة |
| `supabase/functions/approve-request/index.ts` | استقبال الدور وإرساله مع الدعوة |
| Migration جديد | تحديث trigger لدعم الدور الديناميكي |

## تفاصيل التنفيذ التقنية

### الحالة الجديدة في AccountRequests
```typescript
const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

// التحقق قبل الموافقة
const handleApprove = (id: string) => {
  const role = selectedRoles[id];
  if (!role) return; // لن يحدث لأن الزر معطل
  approveMutation.mutate({ requestId: id, role });
};
```

### تحديث Edge Function
```typescript
const { requestId, role } = await req.json();

// التحقق من صحة الدور
const validRoles = ['admin', 'ahmad_rajili', 'morning_shift', 'evening_shift', 'night_shift', 'member'];
if (!validRoles.includes(role)) {
  return new Response(JSON.stringify({ error: 'Invalid role' }), ...);
}

// إرسال الدور مع metadata
await supabaseAdmin.auth.admin.inviteUserByEmail(request.email, {
  data: { 
    full_name: request.full_name,
    assigned_role: role 
  },
  ...
});
```

### تحديث Trigger
```sql
-- استخدام الدور من metadata إذا وُجد
user_role := COALESCE(
  (NEW.raw_user_meta_data->>'assigned_role')::app_role, 
  'member'::app_role
);
```

## Migration مطلوب

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  user_name TEXT;
  assigned_role_text TEXT;
BEGIN
  -- التحقق من وجود دور معين في metadata
  assigned_role_text := NEW.raw_user_meta_data->>'assigned_role';
  
  IF assigned_role_text IS NOT NULL AND assigned_role_text != '' THEN
    -- استخدام الدور المعين
    user_role := assigned_role_text::app_role;
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  ELSE
    -- المنطق الافتراضي للمستخدمين الموجودين
    CASE NEW.email
      WHEN 'deltanorthpharm@gmail.com' THEN
        user_role := 'admin';
        user_name := 'المدير';
      -- ... باقي الحالات
      ELSE
        user_role := 'member';
        user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    END CASE;
  END IF;

  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, user_name, user_role);

  RETURN NEW;
END;
$$;
```

