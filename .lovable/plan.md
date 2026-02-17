

# تطوير نظام إدارة الإيرادات - خطة شاملة

## ملخص المشروع
إعادة هيكلة كاملة لنظام إدارة الإيرادات ليدعم الفترات الخمس (صباحية، مسائية، احمد الرجيلي، عبدالوهاب، ليلية) مع فصل واضح بين صلاحيات المدير والمستخدم العادي (الكاشير).

---

## المرحلة 1: تحديث قاعدة البيانات

### 1.1 إضافة فترة "عبدالوهاب"
- إضافة `abdulwahab` كقيمة جديدة للفترة في الـ revenues
- لا حاجة لتعديل schema الجدول لأن عمود `period` من نوع `text` بالفعل

### 1.2 إضافة عمود `service_name` لجدول revenues
- حاليا الخدمات المصرفية تُخزن بنوع `banking_services` فقط بدون تحديد نوع الخدمة
- نضيف عمود `service_name` (text, nullable) لتخزين اسم الخدمة المصرفية (mobi_cash, yser_pay, mobi_nab, bank_transfer, pay_for_me)
- هذا يسمح بتخزين كل خدمة مصرفية كسجل مستقل مع اسمها

### 1.3 إضافة دور "عبدالوهاب" في النظام
- إضافة `abdulwahab` للـ `app_role` enum في قاعدة البيانات
- تحديث trigger `handle_new_user` لدعم الدور الجديد
- تحديث RLS policy للـ revenues لتشمل فترة عبدالوهاب

---

## المرحلة 2: تحديث الصلاحيات في الكود

### الملف: `src/store/authStore.ts`
- إضافة دور `abdulwahab` في `permissionsByRole` مع صلاحية `register_revenue_abdulwahab`
- إضافة صلاحية `view_own` للدور الجديد

### الملف: `src/hooks/revenue/useRevenueState.ts`
- إضافة `abdulwahab` في نوع `Period`
- إضافة case جديد في useEffect لتحديد الفترة تلقائيا للمستخدم

---

## المرحلة 3: إعادة تصميم نموذج إدخال الإيراد

### الملف: `src/components/revenue/RevenueForm.tsx` (تعديل جوهري)
- الفترة: تظهر كحقل ثابت للمستخدم العادي (لا يمكن تغييرها)، dropdown للمدير
- الإيراد النقدي: حقل إدخال مباشر بـ `inputMode="decimal"` لفتح كيبورد رقمي (بدون CustomNumpad)
- الملاحظات: حقل اختياري كما هو

### الملف: `src/components/revenue/BankingServiceInput.tsx` (إعادة كتابة)
- تحويل من نظام chips (اختيار نوع + إضافة) إلى حقول ثابتة منفصلة
- عرض 5 حقول مبلغ ثابتة داخل كرت واحد:
  - موبي كاش
  - يسر باي
  - موبي ناب
  - تحويل مصرفي
  - ادفع لي
- كل حقل يقبل رقم مباشرة بـ `inputMode="decimal"`
- إجمالي الخدمات المصرفية يُحسب تلقائيا أسفل الكرت
- الخدمات ذات القيمة صفر لا تظهر في التقارير

### الملف: `src/hooks/revenue/useRevenueForm.ts` (تعديل)
- تعديل handleSubmit لتخزين كل خدمة مصرفية كسجل مستقل مع `service_name`
- بدلا من تخزين إجمالي واحد، يتم تخزين سجل لكل خدمة لها مبلغ > 0

---

## المرحلة 4: إعادة تصميم الداشبورد

### واجهة المستخدم (الكاشير) - `src/components/revenue/RevenueDisplay.tsx`
عندما يكون المستخدم غير مدير:
- يرى فقط بيانات فترته:
  - كرت الإجمالي النقدي
  - كرت إجمالي الخدمات المصرفية (عند الضغط يظهر تفصيل خدماته فقط)
  - كرت الإجمالي الكلي
- لا يرى باقي الفترات
- لا يستطيع التنقل بين التواريخ

### واجهة المدير - إنشاء مكون جديد `src/components/revenue/AdminRevenueDisplay.tsx`
- عرض ملخص جميع الفترات في نفس اليوم
- لكل فترة كرت يحتوي:
  - اسم الفترة
  - النقدي
  - الخدمات المصرفية
  - الإجمالي
  - اسم المستخدم المسؤول
- كرت إجمالي اليوم الكامل (مجموع كل الفترات) في الأعلى
- عند الضغط على أي فترة: يظهر تفصيل كامل (الخدمات، الملاحظات، وقت الإدخال، خيار التعديل)
- التنقل بين التواريخ

---

## المرحلة 5: تحديث صفحة التفاصيل

### الملف: `src/components/revenue/DailyRevenueDetails.tsx` (تعديل)
- تحسين العرض ليفصل بين النقدي والخدمات المصرفية بوضوح
- إخفاء الخدمات ذات القيمة صفر
- عرض الملاحظات فقط عند وجودها
- عرض وقت الإدخال
- خيار التعديل للمدير فقط

### الملف: `src/components/revenue/EditRevenueDialog.tsx` (تعديل)
- إضافة فترة "عبدالوهاب" في dropdown الفترات
- إضافة حقل `service_name` عند تعديل خدمة مصرفية
- تحسين واجهة التعديل

---

## المرحلة 6: تحديث hooks البيانات

### الملف: `src/hooks/revenue/useRevenueData.ts`
- تصفية البيانات حسب فترة المستخدم للمستخدم العادي
- عرض جميع البيانات للمدير
- إضافة دالة لاسترجاع تفصيل الخدمات المصرفية حسب `service_name`

### الملف: `src/hooks/useRevenueManager.ts`
- إضافة فترة `abdulwahab` في `periodDisplayName`
- تحديث المنطق ليتوافق مع النظام الجديد

---

## المرحلة 7: تحديث الـ Store

### الملف: `src/store/pharmacyStore.ts`
- تحديث `addRevenue` لدعم `service_name`
- إضافة دوال جديدة:
  - `getDailyRevenueByPeriod(date, period)` - إيراد فترة معينة ليوم معين
  - `getBankingServiceDetails(date, period)` - تفصيل الخدمات المصرفية

---

## ملخص الملفات المتأثرة

| الملف | نوع التعديل |
|-------|------------|
| قاعدة البيانات (migration) | إضافة عمود service_name + دور abdulwahab + تحديث RLS |
| `src/store/authStore.ts` | إضافة دور abdulwahab والصلاحيات |
| `src/store/pharmacyStore.ts` | تحديث addRevenue + دوال جديدة |
| `src/hooks/revenue/useRevenueState.ts` | إضافة abdulwahab في Period type |
| `src/hooks/revenue/useRevenueForm.ts` | تخزين كل خدمة كسجل مستقل |
| `src/hooks/revenue/useRevenueData.ts` | تصفية حسب الفترة + تفصيل الخدمات |
| `src/hooks/useRevenueManager.ts` | تحديث periodDisplayName + المنطق |
| `src/components/revenue/RevenueForm.tsx` | إدخال مباشر بدون numpad للنقدي |
| `src/components/revenue/BankingServiceInput.tsx` | إعادة كتابة: 5 حقول ثابتة |
| `src/components/revenue/RevenueDisplay.tsx` | واجهة الكاشير (فترته فقط) |
| `src/components/revenue/AdminRevenueDisplay.tsx` | **ملف جديد** - واجهة المدير |
| `src/components/revenue/DailyRevenueDetails.tsx` | تحسين العرض + تفصيل الخدمات |
| `src/components/revenue/EditRevenueDialog.tsx` | إضافة فترة عبدالوهاب + service_name |
| `src/components/RevenueManager.tsx` | التبديل بين واجهة المدير والكاشير |

