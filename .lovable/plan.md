
# خطة إصلاح مساعد الترياق التحليلي

## المشاكل المكتشفة

### 1. خطأ الاتصال (401 - جلسة غير صالحة)
**السبب:** المكون يستخدم الـ `anon key` كـ token بدلاً من استخدام الـ `access_token` الخاص بالمستخدم المسجل.

**الحل:** استخدام `supabase.auth.getSession()` للحصول على الـ token الصحيح.

### 2. تبسيط الواجهة
إزالة الاقتراحات السريعة وتبسيط النص الترحيبي.

---

## التغييرات المطلوبة في `AdminAIAssistant.tsx`

### أ. إصلاح مشكلة الاتصال:

```typescript
// قبل (خطأ):
'Authorization': `Bearer eyJhbGciOiJIUzI1NiI...`  // anon key

// بعد (صحيح):
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
'Authorization': `Bearer ${token}`
```

### ب. تبسيط الواجهة:

| العنصر | الحالة الحالية | الحالة الجديدة |
|--------|---------------|---------------|
| الاقتراحات السريعة | 4 أزرار مقترحة | **حذف** |
| النص الترحيبي | نص طويل + قائمة | "مرحباً! أنا مساعدك التحليلي لصيدلية الترياق" فقط |

---

## ملخص التعديلات

| الملف | التعديل |
|-------|---------|
| `src/components/AdminAIAssistant.tsx` | إصلاح الـ token + تبسيط الواجهة |

---

## التفاصيل التقنية

### 1. استيراد supabase client:
```typescript
import { supabase } from '@/integrations/supabase/client';
```

### 2. الحصول على الـ token الصحيح:
```typescript
const sendMessage = async (messageText: string) => {
  // الحصول على جلسة المستخدم
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    // المستخدم غير مسجل
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'يرجى تسجيل الدخول أولاً',
    }]);
    return;
  }

  // استخدام الـ token الصحيح
  const response = await fetch(ANALYTICS_URL, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      ...
    },
  });
};
```

### 3. تبسيط النص الترحيبي:
```tsx
{messages.length === 0 && (
  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <p className="text-sm text-emerald-800 font-medium">
        مرحباً! أنا مساعدك التحليلي لصيدلية الترياق.
      </p>
    </div>
  </div>
)}
```

### 4. حذف الاقتراحات السريعة:
- إزالة المتغير `suggestedQuestions`
- إزالة قسم "Suggested Questions" من الـ JSX
- إزالة الدالة `handleSuggestedQuestion`
- إزالة الاستيرادات غير المستخدمة (`TrendingUp`, `AlertTriangle`, `RefreshCw`)
