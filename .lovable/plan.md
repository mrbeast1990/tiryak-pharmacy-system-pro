

# خطة تحسين نظام إنشاء الطلبيات بالذكاء الاصطناعي

## نظرة عامة
سيتم توظيف نفس تقنية AI المستخدمة في "مستشار الترياق" لتحليل ملفات عروض الأسعار بذكاء، مع تحسين شامل لتصدير PDF بتنسيق LTR احترافي.

---

## التغييرات المطلوبة

### 1. تحسين Edge Function لمعالجة PDF/Excel (`parse-supplier-quote`)

**التحسينات:**
- تحديث الـ Prompt ليطلب من AI فهم محتوى الجداول مهما اختلفت المسميات
- إضافة حقل `code` (كود الصنف) للاستخراج
- تجاهل النصوص غير المتعلقة (شروط البيع، العناوين، أرقام الصفحات)
- دعم معالجة الملفات الكبيرة على دفعات

**البنية الجديدة للبيانات المستخرجة:**
```typescript
{
  products: [
    { 
      name: string,      // ITEM DESCRIPTION
      code: string,      // CODE (اختياري)
      price: number,     // PRICE
      expiryDate: string // EXP
    }
  ],
  rawText: string,
  totalPages: number,
  confidence: "high" | "medium" | "low"
}
```

---

### 2. تحديث Store لدعم كود الصنف (`orderBuilderStore.ts`)

**إضافة حقل جديد:**
```typescript
interface OrderProduct {
  id: string;
  name: string;
  code?: string;      // ← جديد: كود الصنف
  price: number;
  expiryDate?: string;
  quantity: number;
}
```

---

### 3. تحديث جدول المنتجات (`ProductsTable.tsx` & `ProductRow.tsx`)

**إضافة عمود CODE للجدول:**

| NO | ITEM DESCRIPTION | CODE | EXP | PRICE | الكمية | الإجمالي |
|----|------------------|------|-----|-------|--------|----------|

---

### 4. تحسين تصدير PDF (`useOrderPDF.ts`)

**التعديلات الرئيسية:**

#### أ. تغيير اتجاه الجدول إلى LTR
```typescript
// تحويل الجدول من RTL إلى LTR
columnStyles: {
  0: { halign: 'left', cellWidth: 12 },   // NO
  1: { halign: 'left', cellWidth: 'auto' }, // ITEM DESCRIPTION
  2: { halign: 'center', cellWidth: 20 }, // CODE
  3: { halign: 'center', cellWidth: 22 }, // EXP
  4: { halign: 'center', cellWidth: 22 }, // PRICE
  5: { halign: 'center', cellWidth: 25 }, // T.PRICE
}
```

#### ب. عناوين الأعمدة الجديدة
```typescript
head: [['NO', 'ITEM DESCRIPTION', 'CODE', 'EXP', 'PRICE', 'T.PRICE']]
```

#### ج. تنسيق التذييل الأحمر (Footer)
- **الموضع:** أسفل الصفحة، محاذاة لليسار
- **اللون:** أحمر عريض (#DC2626)
- **الترتيب:**
  1. أيقونة واتساب (📱) + الرقم: 0915938155
  2. النص العربي: "الرجاء ارسال نسخه PDF من الفاتورة عند صدورها مباشراً عبر واتس اب"

**الكود المحدث للتذييل:**
```typescript
// Footer - LTR aligned to left
const footerY = pageHeight - 25;

doc.setFontSize(11);
doc.setTextColor(220, 38, 38); // Red
doc.setFont('Amiri', 'bold');

// WhatsApp icon + number (left aligned)
doc.text('📱 0915938155', margin, footerY, { align: 'left' });

// Arabic text (right-aligned for proper display)
doc.text(
  'الرجاء ارسال نسخه PDF من الفاتورة عند صدورها مباشراً عبر واتس اب',
  pageWidth - margin, 
  footerY, 
  { align: 'right' }
);
```

---

### 5. تحسين معالجة الملفات الكبيرة

**استراتيجية Batching:**
- تقسيم الملفات الكبيرة (> 50 صنف) إلى دفعات
- عرض شريط تقدم أثناء المعالجة
- دمج النتائج النهائية تلقائياً

```typescript
// في Edge Function
if (extractedProducts.length > 100) {
  // معالجة على دفعات
  const batches = splitIntoBatches(extractedProducts, 50);
  // ...
}
```

---

## ملخص الملفات المتأثرة

| الملف | نوع التعديل |
|-------|-------------|
| `supabase/functions/parse-supplier-quote/index.ts` | تحديث شامل للـ AI Prompt |
| `src/store/orderBuilderStore.ts` | إضافة حقل `code` |
| `src/components/order-builder/FileUploader.tsx` | دعم حقل `code` |
| `src/components/order-builder/ProductsTable.tsx` | إضافة عمود CODE |
| `src/components/order-builder/ProductRow.tsx` | عرض كود الصنف |
| `src/components/order-builder/DataReviewDialog.tsx` | عرض CODE في المراجعة |
| `src/hooks/useOrderPDF.ts` | تنسيق LTR + تذييل أحمر محسّن |

---

## التدفق المحدث

```text
رفع ملف PDF/Excel
       ↓
Edge Function (AI Analysis)
       ↓
استخراج: name, code, price, expiryDate
       ↓
DataReviewDialog (مراجعة)
       ↓
ProductsTable (اختيار الكميات)
       ↓
تصدير PDF (LTR + تذييل أحمر)
       ↓
مشاركة واتساب
```

---

## ملاحظات تقنية

1. **الخط العربي في التذييل**: سيظل يستخدم خط Amiri لضمان ظهور النص العربي بشكل صحيح

2. **فلترة الكميات الصفرية**: موجودة بالفعل في `useOrderPDF.ts` ولن تتغير

3. **LOVABLE_API_KEY**: مفتاح AI متوفر بالفعل في secrets

