# خطة تحسين نظام إنشاء الطلبيات بالذكاء الاصطناعي

## ✅ تم التنفيذ

### 1. تحسين Edge Function (`parse-supplier-quote`)
- ✅ تحديث AI Prompt ليفهم الجداول مهما اختلفت المسميات
- ✅ إضافة حقل `code` للاستخراج
- ✅ تجاهل النصوص غير المتعلقة

### 2. تحديث Store (`orderBuilderStore.ts`)
- ✅ إضافة حقل `code?: string` لـ OrderProduct

### 3. تحديث UI
- ✅ ProductsTable.tsx: إضافة عمود CODE
- ✅ ProductRow.tsx: عرض كود الصنف
- ✅ DataReviewDialog.tsx: عرض وتعديل CODE
- ✅ FileUploader.tsx: دعم حقل code

### 4. تحسين تصدير PDF (`useOrderPDF.ts`)
- ✅ تنسيق LTR للجدول
- ✅ عناوين إنجليزية: NO, ITEM DESCRIPTION, CODE, EXP, PRICE, T.PRICE
- ✅ تذييل أحمر مع رقم واتساب ونص عربي
- ✅ فلترة الكميات الصفرية (موجودة مسبقاً)

