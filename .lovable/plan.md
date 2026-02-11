
# خطة التعديلات على صفحة السدادات

## نظرة عامة
4 تعديلات: ترتيب الشركات تنازلياً، تحسين نموذج إضافة السداد، وإضافة فلترة بنطاق تاريخ (من - إلى).

---

## 1. ترتيب الشركات تنازلياً حسب إجمالي المبلغ

### الملف: `src/components/payments/CompaniesListView.tsx`

- بعد فلترة الشركات بالبحث، يتم ترتيبها تنازلياً حسب إجمالي المبلغ المسدد
- الشركة ذات أعلى قيمة تظهر في الأعلى

---

## 2. إعادة تصميم نموذج إضافة السداد

### الملف: `src/components/payments/PaymentForm.tsx`

**التغييرات:**
- تحويل النموذج من عمودي إلى تخطيط أفقي مدمج:
  - **صف 1**: اسم الشركة (مع البحث) + المبلغ (جنباً إلى جنب)
  - **صف 2**: التاريخ + نوع السداد (كاش/مصرف) (جنباً إلى جنب)
- الملاحظات والمرفقات تكون مخفية افتراضياً وتظهر عند الضغط على زر "خيارات إضافية"
- استخدام `Collapsible` داخلي لإخفاء/إظهار الحقول الاختيارية

```text
تصميم النموذج الجديد:
┌──────────────────────┬─────────────────┐
│  اسم الشركة (بحث)   │   المبلغ (د.ل)  │
├──────────────────────┼─────────────────┤
│  التاريخ             │  كاش | مصرف     │
├──────────────────────┴─────────────────┤
│  [▼ خيارات إضافية]                     │
│  ┌─────────────────────────────────┐   │
│  │ ملاحظات...                      │   │
│  │ [تصوير] [رفع ملف]              │   │
│  └─────────────────────────────────┘   │
├────────────────────────────────────────┤
│         [تسجيل السداد]                 │
└────────────────────────────────────────┘
```

---

## 3. إضافة فلترة بنطاق تاريخ (من - إلى)

### الملف: `src/store/paymentsStore.ts`

- إضافة حقول جديدة للفلاتر:
  - `dateFilter` يصبح `'all' | 'month' | 'range'`
  - `dateFrom: string | null` (تاريخ البداية)
  - `dateTo: string | null` (تاريخ النهاية)
- تعديل `getFilteredPayments` لدعم الفلترة بالنطاق
- تحديث `clearFilters` لمسح الحقول الجديدة

### الملف: `src/components/payments/PaymentsFilters.tsx`

- إضافة زر "نطاق تاريخ" بجانب "الكل" و"شهر محدد"
- عند اختياره يظهر حقلان: "من" و "إلى" (input type date)

```text
فلاتر التاريخ:
[الكل] [شهر محدد] [نطاق تاريخ]

عند اختيار "نطاق تاريخ":
من: [____/____/____]   إلى: [____/____/____]
```

---

## 4. ملخص الملفات المتأثرة

| الملف | العملية | الوصف |
|-------|---------|-------|
| `src/components/payments/CompaniesListView.tsx` | تعديل | ترتيب تنازلي حسب المبلغ |
| `src/components/payments/PaymentForm.tsx` | تعديل | تخطيط أفقي + خيارات إضافية |
| `src/store/paymentsStore.ts` | تعديل | إضافة فلتر نطاق التاريخ |
| `src/components/payments/PaymentsFilters.tsx` | تعديل | إضافة خيار "نطاق تاريخ" |

---

## التفاصيل التقنية

### الفلاتر المحدثة في Store:

```typescript
interface PaymentsFilters {
  company: string | null;
  showUndeductedOnly: boolean;
  dateFilter: 'all' | 'month' | 'range';
  selectedMonth: number;
  selectedYear: number;
  dateFrom: string | null;  // جديد
  dateTo: string | null;    // جديد
}
```

### منطق الفلترة بالنطاق:

```typescript
if (filters.dateFilter === 'range' && (filters.dateFrom || filters.dateTo)) {
  filtered = filtered.filter(p => {
    const d = p.payment_date;
    if (filters.dateFrom && d < filters.dateFrom) return false;
    if (filters.dateTo && d > filters.dateTo) return false;
    return true;
  });
}
```

### ترتيب الشركات تنازلياً:

```typescript
const sorted = [...filtered].sort((a, b) => 
  getCompanyTotal(b.name) - getCompanyTotal(a.name)
);
```
