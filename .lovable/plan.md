

# خطة إصلاح 3 مشاكل

## المشكلة 1: تغير تاريخ الصنف عند النقر على "قيد الطلب"

**السبب**: `updateMedicine` في `pharmacyStore.ts` (سطر 197-200) يضيف `last_updated: new Date().toISOString()` دائماً مع كل تحديث.

**الحل**: تعديل `updateMedicine` بحيث لا يغير `last_updated` إذا كان التحديث فقط لـ `is_ordered`. سنتحقق إذا كانت المفاتيح المحدثة هي `is_ordered` فقط، نتجنب تعيين `last_updated`.

**الملف**: `src/store/pharmacyStore.ts` - تعديل دالة `updateMedicine`

---

## المشكلة 2: الأولوية تظهر دائماً "عادي" عند إضافة صنف جديد

**السبب**: في `addMedicine` (سطر 113)، عند وجود الدواء مسبقاً بحالة shortage، يستخدم `Math.max(selectedPriority, existing)` وهذا صحيح. لكن المشكلة الأساسية في أن `addMedicine` للأصناف الموجودة يعمل بشكل مختلف عن المتوقع. بعد مراجعة الكود، المشكلة هي أن `repeat_count` في type الـ `addMedicine` signature (سطر 22) هو `optional` ولكن في الواقع يتم تمريره. سأتحقق من أن القيمة تصل بشكل صحيح وأضيف logging للتشخيص. بالإضافة لذلك، يجب التأكد أن الـ `insert` للسجلات الجديدة يمرر `repeat_count` بشكل صحيح.

**الحل**: التأكد أن `addMedicine` يحفظ `repeat_count` المحدد من المستخدم بشكل صريح وليس القيمة الافتراضية 1. سأضيف log وأتحقق من المسار.

**الملف**: `src/store/pharmacyStore.ts`

---

## المشكلة 3: تفعيل الإشعارات للويب

**الوضع الحالي**: نظام الإشعارات يعتمد على `@capacitor/push-notifications` ولا يعمل إلا على التطبيق الأصلي (Native). على الويب، `Capacitor.isNativePlatform()` يرجع `false` فيتم تجاهل كل شيء.

**الحل**: إضافة دعم **Web Notifications API** (إشعارات المتصفح) بالتوازي مع النظام الحالي:

1. **تعديل `usePushNotifications.ts`**: إضافة دوال للويب:
   - `checkNotificationPermissions`: إذا كان الويب، نستخدم `Notification.permission`
   - `requestNotificationPermissions`: إذا كان الويب، نستخدم `Notification.requestPermission()`
   - `sendLocalNotification`: إذا كان الويب، نستخدم `new Notification(title, { body })`

2. **تعديل `NotificationPromptCard.tsx`**: إزالة شرط `Capacitor.isNativePlatform()` لعرض البطاقة على الويب أيضاً.

3. **تعديل `NotificationCenter.tsx`**: عند استلام إشعار جديد عبر realtime، إرسال Web Notification إذا كان المستخدم على الويب والإذن ممنوح.

4. **تحديث `sw.js`**: إضافة مستمع `push` event لعرض إشعارات push عبر Service Worker (للإشعارات عندما يكون التبويب مغلقاً - اختياري لاحقاً).

---

## ملخص الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/store/pharmacyStore.ts` | إصلاح `updateMedicine` لعدم تغيير التاريخ عند toggle ordered + التأكد من حفظ الأولوية |
| `src/hooks/usePushNotifications.ts` | إضافة دعم Web Notifications API |
| `src/components/NotificationPromptCard.tsx` | عرض البطاقة على الويب |
| `src/components/NotificationCenter.tsx` | إرسال Web Notification عند استلام إشعار جديد |

