

# خطة التعديلات

## 1. إزالة badge "قيد الطلب" المنفصل وإضافة نبض للبطاقة كاملة

**الملف**: `src/components/shortage/SwipeableMedicineCard.tsx`

- إزالة الـ Badge المنفصل (سطور 225-234) الذي يعرض "قيد الطلب" بشكل منفصل
- عند `isOrdered === true`، إضافة class `animate-ordered-pulse` على البطاقة الرئيسية (السطر 156) بدلاً من badge منفصل، بحيث البطاقة كلها تنبض

التعديل على السطر 156:
```tsx
<div className={`relative shadow-sm rounded-lg overflow-hidden border ${getCardStyle()} ${isOrdered ? 'animate-ordered-pulse' : ''}`}>
```

وحذف السطور 225-234 (الـ Ordered Badge المنفصل).

## 2. تحسين الإشعارات لتظهر في notification bar الهاتف

**الملف**: `public/sw.js`

- إضافة مستمع `push` event في Service Worker لعرض إشعارات في شريط الإشعارات حتى عندما التبويب غير نشط:
```js
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'تيرياق';
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png',
    badge: '/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png',
    vibrate: [200, 100, 200],
    tag: 'tiryak-notification',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
```

- إضافة مستمع `notificationclick` لفتح التطبيق عند النقر على الإشعار

**الملف**: `src/components/NotificationCenter.tsx`

- تحسين `sendLocalNotification` ليستخدم `navigator.serviceWorker.ready` + `showNotification` بدلاً من `new Notification()` مباشرة، لأن Service Worker notifications تظهر في notification bar حتى لو التطبيق مغلق

**الملف**: `src/hooks/usePushNotifications.ts`

- تعديل `sendLocalNotification` على الويب ليستخدم `registration.showNotification()` عبر Service Worker بدلاً من `new Notification()` العادي، لأن هذا هو الذي يظهر في الـ notification bar في الهاتف

