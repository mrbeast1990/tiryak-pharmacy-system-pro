
# خطة إعداد البوت التحليلي الشامل (قراءة + كتابة)

## نظرة عامة

تحويل البوت التحليلي من أداة قراءة فقط إلى مساعد ذكي يستطيع:
1. تسجيل سدادات جديدة (مع تأكيد المستخدم)
2. تسجيل نواقص جديدة (مع تأكيد المستخدم)
3. استعلامات دقيقة مع فلترة وتحقق من صحة البيانات
4. قواعد أمان صارمة (لا حفظ بدون تأكيد)

---

## الفكرة التقنية: Tool Calling

بدلاً من جعل البوت يحفظ البيانات مباشرة، سنستخدم نظام **tool calling** حيث:
1. البوت يجمع البيانات من المستخدم ويتأكد من صحتها
2. البوت يسأل المستخدم للتأكيد
3. بعد التأكيد، البوت يستدعي "أداة" (tool) لحفظ البيانات
4. Edge Function ينفذ العملية ويرجع النتيجة

```text
المستخدم: "سجل سداد 2000 للقصر كاش"
     |
البوت: "هل تريد إضافة سداد بقيمة 2000 د.ل لشركة القصر كاش بتاريخ اليوم؟"
     |
المستخدم: "نعم"
     |
البوت -> tool_call: add_payment({company: "القصر", amount: 2000, type: "cash", date: "2026-02-11"})
     |
Edge Function: يحفظ في جدول payments ويرجع تأكيد
     |
البوت: "تم إضافة السداد لشركة القصر بتاريخ 11/02/2026 بقيمة 2,000 د.ل كاش"
```

---

## 1. تحديث Edge Function

### الملف: `supabase/functions/tiryak-analytics-ai/index.ts`

**التغييرات الرئيسية:**

### أ. إضافة Tools للنموذج:
```typescript
tools: [
  {
    type: "function",
    function: {
      name: "add_payment",
      description: "إضافة سداد جديد لشركة",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          amount: { type: "number" },
          payment_type: { type: "string", enum: ["cash", "bank"] },
          payment_date: { type: "string", format: "date" },
          notes: { type: "string" }
        },
        required: ["company_name", "amount", "payment_type", "payment_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_shortage",
      description: "تسجيل نقص دواء جديد",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          scientific_name: { type: "string" },
          company: { type: "string" },
          notes: { type: "string" }
        },
        required: ["name", "scientific_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_payments",
      description: "استعلام عن سدادات بفلاتر محددة",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          date_from: { type: "string" },
          date_to: { type: "string" },
          payment_type: { type: "string", enum: ["cash", "bank"] }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_shortages",
      description: "استعلام عن النواقص بفلاتر",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          scientific_name: { type: "string" }
        }
      }
    }
  }
]
```

### ب. معالجة Tool Calls:
عندما يرجع النموذج tool_call بدلاً من محتوى نصي:
- تنفيذ العملية على قاعدة البيانات
- إرجاع النتيجة للنموذج ليصيغ الرد النهائي للمستخدم

### ج. منطق التنفيذ:
- `add_payment`: التحقق من وجود الشركة في جدول companies، ثم الحفظ في payments
- `add_shortage`: التحقق من عدم التكرار، ثم الحفظ في medicines
- `query_payments`: جلب السدادات بالفلاتر المحددة وعرض السجلات كاملة
- `query_shortages`: جلب النواقص بالفلاتر

### د. تحديث SYSTEM_PROMPT:
إضافة تعليمات صارمة للبوت:
- لا يستدعي أي tool إلا بعد سؤال المستخدم "هل أنت متأكد؟" والحصول على تأكيد
- يتحقق من صحة جميع البيانات قبل الاستدعاء
- يعرض رسالة تأكيد واضحة بعد كل عملية ناجحة
- عند الاستعلام يعرض السجلات كاملة قبل أي إجمالي

---

## 2. تحديث Frontend

### الملف: `src/components/AdminAIAssistant.tsx`

**التغييرات:**
- تعديل دالة `sendMessage` لمعالجة الردود التي تحتوي على tool_calls
- عند استلام tool_call من البوت: إرسال طلب ثاني للـ edge function مع نتيجة التنفيذ
- الـ edge function يتولى تنفيذ الـ tool calls وإرجاع النتائج ثم إعادة إرسالها للنموذج

**ملاحظة مهمة:** معظم المنطق سيكون في Edge Function. الفرونت إند سيبقى بسيطاً - يرسل الرسائل ويعرض الردود فقط. Edge Function هو الذي:
1. يستلم الرسائل
2. يرسلها للنموذج مع الـ tools
3. إذا رجع tool_call: ينفذه ويرسل النتيجة للنموذج مرة ثانية
4. يرجع الرد النهائي كـ stream

---

## 3. تحديث SYSTEM_PROMPT الجديد

```text
أنت "مساعد الترياق التحليلي" - مساعد ذكي لصيدلية الترياق الشافي.

## قدراتك:
1. تسجيل سدادات جديدة (تحتاج: اسم الشركة، المبلغ، التاريخ، نوع السداد)
2. تسجيل نواقص أدوية (تحتاج: اسم الدواء + الاسم العلمي)
3. استعلام وتحليل جميع البيانات المالية والنواقص

## قواعد صارمة للتسجيل:
- لا تسجل أي سداد أو نقص بدون جمع كل البيانات المطلوبة أولاً
- بعد جمع البيانات اعرضها على المستخدم واسأل: "هل أنت متأكد؟"
- لا تستدعي أي أداة حفظ إلا بعد تأكيد صريح من المستخدم
- بعد الحفظ اعرض رسالة تأكيد كاملة

## قواعد الاستعلام:
- تحقق من صحة أسماء الشركات بمقارنتها مع القائمة المتاحة
- اعرض السجلات كاملة قبل حساب أي إجمالي
- إذا كانت البيانات غير دقيقة اعرض رسالة خطأ واضحة
```

---

## 4. ملخص الملفات المتأثرة

| الملف | العملية | الوصف |
|-------|---------|-------|
| `supabase/functions/tiryak-analytics-ai/index.ts` | إعادة بناء | إضافة tool calling + تنفيذ العمليات |
| `src/components/AdminAIAssistant.tsx` | تعديل بسيط | دعم الردود غير المتدفقة عند تنفيذ tools |

---

## التفاصيل التقنية

### تدفق Tool Calling في Edge Function:

```text
1. استلام الرسائل من المستخدم
2. إرسال للنموذج مع tools
3. إذا الرد = tool_call:
   a. تنفيذ العملية (insert في Supabase)
   b. إرسال النتيجة للنموذج كـ tool response
   c. النموذج يصيغ الرد النهائي
   d. إرجاع الرد كـ stream
4. إذا الرد = محتوى عادي:
   a. إرجاع كـ stream مباشرة
```

### أمان العمليات:
- التحقق من هوية المستخدم (JWT) قبل أي عملية
- استخدام `user_id` من الجلسة الحقيقية عند الحفظ
- التحقق من وجود الشركة في جدول companies قبل تسجيل السداد
- التحقق من عدم تكرار النقص قبل التسجيل
- حفظ اسم المستخدم (created_by_name) من profiles
