
# خطة تعديل واجهة التطبيق (Safe Area + حركة السحب للرجوع)

## نظرة عامة
تعديلان رئيسيان:
1. إضافة Safe Area padding لجميع الهيدرات في التطبيق لمنع التداخل مع Status Bar
2. ربط حركة السحب للرجوع (swipe back) بالتنقل الداخلي بدلاً من إغلاق التطبيق

---

## 1. إضافة Safe Area لجميع الشاشات

### المشكلة الحالية
فقط `ShortageManager` يستخدم `pt-[env(safe-area-inset-top)]`. باقي الشاشات (Dashboard, Payments, Revenue, OrderBuilder, TiryakGuide, وغيرها) لا تحتوي على أي safe area padding، مما يسبب تداخل العناصر مع شريط الحالة على الأجهزة المحمولة.

### الحل
- إضافة `viewport-fit=cover` في `index.html` لتفعيل safe area على iOS
- إضافة CSS عام في `index.css` يطبق safe area padding على جميع الهيدرات sticky
- تعديل كل header في الشاشات المختلفة لإضافة `pt-[env(safe-area-inset-top)]`

### الملفات المتأثرة:

| الملف | التعديل |
|-------|---------|
| `index.html` | إضافة `viewport-fit=cover` في meta viewport |
| `src/index.css` | إضافة CSS عام للـ safe area |
| `src/components/dashboard/DashboardHeader.tsx` | إضافة safe area padding |
| `src/components/payments/PaymentsManager.tsx` | إضافة safe area padding (3 headers) |
| `src/components/payments/CompaniesListView.tsx` | إضافة safe area padding |
| `src/components/RevenueManager.tsx` | إضافة safe area padding |
| `src/components/order-builder/OrderBuilder.tsx` | إضافة safe area padding |
| `src/components/TiryakGuide.tsx` | إضافة safe area padding |
| `src/components/SuppliesShortageManager.tsx` | إضافة safe area padding |
| `src/components/NotificationSender.tsx` | إضافة safe area padding (إذا يحتوي header) |

### التنفيذ:
كل `<header>` يحصل على div داخلي بـ `pt-[env(safe-area-inset-top)]` أو padding-top ثابت لا يقل عن 24px:

```css
/* في index.css */
.safe-area-top {
  padding-top: max(24px, env(safe-area-inset-top));
}
```

---

## 2. حركة السحب للرجوع (Navigation Stack)

### المشكلة الحالية
التطبيق يستخدم `currentPage` state في `Dashboard.tsx` للتنقل بين الشاشات. عند السحب للرجوع على iOS/Android، الجهاز يحاول الخروج من التطبيق بدلاً من الرجوع للشاشة السابقة.

### الحل
- استخدام `react-router-dom` الموجود بالفعل بدلاً من `currentPage` state
- تحويل كل شاشة فرعية (shortages, payments, revenue, etc.) إلى route حقيقي
- استخدام `useNavigate()` و `useLocation()` للتنقل
- إضافة Capacitor `App.addListener('backButton')` للتحكم بزر الرجوع على Android
- على iOS، السحب للرجوع سيعمل تلقائياً مع react-router لأن التنقل يكون عبر history API

### التغييرات:

### أ. `src/App.tsx`
- إضافة routes جديدة لكل شاشة فرعية:
  - `/shortages` -> ShortageManager
  - `/supplies-shortages` -> SuppliesShortageManager
  - `/revenue` -> RevenueManager
  - `/reports` -> ReportsPage
  - `/notifications` -> NotificationSender
  - `/tiryak-guide` -> TiryakGuide
  - `/payments` -> PaymentsManager
  - `/order-builder` -> OrderBuilder

### ب. `src/components/Dashboard.tsx`
- إزالة `currentPage` state وجميع الـ `if` conditions للشاشات الفرعية
- تحويل `handleNavigate` لاستخدام `useNavigate()` بدلاً من `setCurrentPage`
- إزالة `handleBack` (كل شاشة ستستخدم `navigate(-1)` أو `navigate('/')`)

### ج. تعديل كل شاشة فرعية
- تغيير `onBack` prop ليستخدم `useNavigate()` داخلياً، أو إبقاء `onBack` prop وتمرير `() => navigate('/')`

### د. `src/main.tsx` أو `src/App.tsx`
- إضافة listener لزر الرجوع في Capacitor:

```typescript
import { App as CapApp } from '@capacitor/app';

CapApp.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    CapApp.exitApp();
  }
});
```

---

## ملخص الملفات المتأثرة

| الملف | العملية | الوصف |
|-------|---------|-------|
| `index.html` | تعديل | إضافة viewport-fit=cover |
| `src/index.css` | تعديل | إضافة CSS class للـ safe area |
| `src/App.tsx` | تعديل | إضافة routes + back button listener |
| `src/components/Dashboard.tsx` | تعديل | إزالة currentPage، استخدام router |
| `src/components/dashboard/DashboardHeader.tsx` | تعديل | safe area padding |
| `src/components/payments/PaymentsManager.tsx` | تعديل | safe area padding |
| `src/components/payments/CompaniesListView.tsx` | تعديل | safe area padding |
| `src/components/RevenueManager.tsx` | تعديل | safe area padding |
| `src/components/order-builder/OrderBuilder.tsx` | تعديل | safe area padding |
| `src/components/TiryakGuide.tsx` | تعديل | safe area padding |
| `src/components/SuppliesShortageManager.tsx` | تعديل | safe area padding |
| `src/components/ShortageManager.tsx` | تعديل | توحيد safe area class |
| `src/components/ReportsPage.tsx` | تعديل | safe area padding |
| `src/components/NotificationSender.tsx` | تعديل | safe area padding |

---

## التفاصيل التقنية

### viewport-fit في index.html:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### CSS class موحد:
```css
.safe-area-top {
  padding-top: max(24px, env(safe-area-inset-top));
}
```

### Back Button Listener:
```typescript
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

if (Capacitor.isNativePlatform()) {
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });
}
```

### تحويل التنقل:
```typescript
// قبل (Dashboard.tsx)
const handleNavigate = (page: string) => setCurrentPage(page);

// بعد (Dashboard.tsx)
const navigate = useNavigate();
const handleNavigate = (page: string) => navigate(`/${page}`);
```
