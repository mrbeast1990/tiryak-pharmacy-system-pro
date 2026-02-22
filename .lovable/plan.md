

# اصلاح النصوص المشوهة + تواريخ الصلاحية

## المشاكل

### 1. عناوين الجدول والملاحظة الحمراء تظهر بحروف غريبة
السبب: خط Amiri مسجل فقط كـ `normal` في `pdf-utils.ts` (سطر 48)، لكن في `useOrderPDF.ts`:
- عناوين الجدول تستخدم `fontStyle: 'bold'` (سطر 164)
- الملاحظة الحمراء تستخدم `setFont('Amiri', 'bold')` (سطر 208)

عندما يطلب jsPDF نمط bold لخط Amiri ولا يجده، يرجع للخط الافتراضي (helvetica) الذي لا يدعم العربية.

### 2. تواريخ الصلاحية تظهر كأرقام (46539، 46844...)
هذه أرقام تسلسلية من Excel ولم يتم تحويلها لتواريخ مقروءة عند استخراج البيانات من ملف Excel.

---

## الحل

### الملف 1: `src/lib/pdf-utils.ts`
- تسجيل خط Amiri كـ `bold` ايضا (نفس ملف الخط يُسجل مرتين: مرة كـ normal ومرة كـ bold)
- اضافة سطر: `doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");`

### الملف 2: `src/components/order-builder/FileUploader.tsx`
- اضافة دالة `parseExcelDate` لتحويل الأرقام التسلسلية من Excel إلى تواريخ مقروءة (مثلا 46539 تصبح "2027-06")
- تطبيق الدالة على عمود الصلاحية عند استخراج البيانات من Excel (في `processExcelFile` و `processExcelWithMapping`)

### الملف 3: `src/hooks/useOrderPDF.ts`
- لا تعديل مطلوب، المشكلة في تسجيل الخط فقط

---

## التفاصيل التقنية

### دالة تحويل تاريخ Excel:
```text
parseExcelDate(value):
  - اذا كان رقم بين 1 و 100000 -> تحويل من Excel serial date
  - Excel epoch = 1899-12-30
  - الناتج: تاريخ بصيغة MM/YYYY او YYYY-MM
  - اذا كان نص عادي -> يُرجع كما هو
```

### تسجيل الخط Bold:
```text
addFont("Amiri-Regular.ttf", "Amiri", "normal")  // موجود
addFont("Amiri-Regular.ttf", "Amiri", "bold")     // جديد - نفس الملف
```

