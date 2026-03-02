

# تغيير PDF من تحميل إلى طباعة

## التعديل

**الملف**: `src/hooks/usePDFExport.ts`

في الويب (سطر 60-68)، بدلاً من `doc.save(filename)` الذي يحمّل الملف مباشرة، سنستخدم:

```ts
const pdfBlob = doc.output('blob');
const pdfUrl = URL.createObjectURL(pdfBlob);
const printWindow = window.open(pdfUrl);
if (printWindow) {
  printWindow.onload = () => {
    printWindow.print();
  };
}
```

هذا سيفتح نافذة طباعة المتصفح بدلاً من التحميل المباشر، والمستخدم يقدر يطبع أو يحفظ كـ PDF من نافذة الطباعة.

رسالة التوست تتغير من "تم تحميل الملف" إلى "جاري فتح الطباعة".

