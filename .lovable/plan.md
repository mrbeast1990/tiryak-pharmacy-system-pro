
# خطة إضافة تصدير Excel لقوائم النواقص

## نظرة عامة
إضافة زر تصدير Excel بجانب زر PDF في صفحتي نواقص الأدوية والمستلزمات، مع إضافة عمود "Description" يعرض الاسم العلمي بجانب اسم الدواء.

---

## 1. الملفات الجديدة

### أ. إنشاء Hook جديد: `useShortagesExcel.ts`

| الوظيفة | الوصف |
|---------|-------|
| `exportMedicinesExcel` | تصدير قائمة نواقص الأدوية مع الاسم العلمي |
| `exportSuppliesExcel` | تصدير قائمة نواقص المستلزمات |

**هيكل ملف Excel للأدوية:**

| No. | Drug Name | Description | Notes |
|-----|-----------|-------------|-------|
| 1 | Panadol | Paracetamol 500mg | - |
| 2 | Augmentin | Amoxicillin + Clavulanate | ملاحظة |

**هيكل ملف Excel للمستلزمات:**

| No. | Supply Name | Notes |
|-----|-------------|-------|
| 1 | قفازات طبية | - |
| 2 | كمامات | - |

---

## 2. التعديلات على الملفات الموجودة

### أ. `ShortageManager.tsx` (نواقص الأدوية)

**التغييرات:**
1. استيراد أيقونة `FileSpreadsheet` من lucide-react
2. استيراد `useShortagesExcel` hook
3. إضافة زر Excel بجانب زر PDF

```text
قبل:
[PDF]

بعد:
[PDF] [Excel]
```

### ب. `SuppliesShortageManager.tsx` (نواقص المستلزمات)

**نفس التغييرات** مع تعديل لاستخدام `exportSuppliesExcel`

---

## 3. تحديث ملف PDF لإضافة عمود Description

سيتم تعديل دالة `exportShortagesPDF` في كلا الملفين لإضافة عمود Description (الاسم العلمي).

**التصميم الجديد للـ PDF:**

```text
┌─────────────────────────────────────────────────────────────┐
│                    Al-Tiryak Al-Shafi Pharmacy              │
│                    Medicine Shortages List                   │
│                    Date: 08/02/2026                          │
├──────┬────────────────────┬────────────────────┬────────────┤
│ No.  │ Drug Name          │ Description        │ Quantity   │
├──────┼────────────────────┼────────────────────┼────────────┤
│  1   │ Panadol            │ Paracetamol        │            │
│  2   │ Augmentin          │ Amoxicillin+Clav.  │            │
└──────┴────────────────────┴────────────────────┴────────────┘
```

---

## 4. ملخص الملفات

| الملف | العملية | الوصف |
|-------|---------|-------|
| `src/hooks/useShortagesExcel.ts` | **إنشاء** | Hook لتصدير Excel |
| `src/components/ShortageManager.tsx` | **تعديل** | إضافة زر Excel + تحديث PDF |
| `src/components/SuppliesShortageManager.tsx` | **تعديل** | إضافة زر Excel + تحديث PDF |

---

## 5. التفاصيل التقنية

### Hook الجديد `useShortagesExcel.ts`:

```typescript
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Medicine, Supply } from '@/store/pharmacyStore';

export const useShortagesExcel = () => {
  
  const exportMedicinesExcel = (medicines: Medicine[]) => {
    const data = medicines.map((med, index) => ({
      'No.': index + 1,
      'Drug Name': med.name,
      'Description': med.scientific_name || '-',  // الاسم العلمي
      'Notes': med.notes || '-',
    }));
    
    // إنشاء ملف Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 5 },   // No.
      { wch: 30 },  // Drug Name
      { wch: 30 },  // Description
      { wch: 25 },  // Notes
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Shortages');
    
    const filename = `medicines-shortages-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };
  
  const exportSuppliesExcel = (supplies: Supply[]) => {
    // نفس المنطق للمستلزمات (بدون Description لأنها لا تحتوي اسم علمي)
  };
  
  return { exportMedicinesExcel, exportSuppliesExcel };
};
```

### تعديل أعمدة PDF:

**قبل (3 أعمدة):**
- No. | Drug Name | Quantity

**بعد (4 أعمدة):**
- No. | Drug Name | Description | Quantity

---

## 6. دعم الأجهزة المحمولة

سيتم استخدام مكتبة `xlsx` الموجودة بالفعل في المشروع، وهي تعمل على الويب.

بالنسبة للأجهزة المحمولة (Capacitor)، سيتم التعامل معها بنفس طريقة PDF:
- على الويب: تحميل مباشر
- على iOS/Android: حفظ في مجلد Documents وعرض رسالة للمستخدم

---

## 7. النتيجة النهائية

### واجهة المستخدم:

```text
┌─────────────────────────────────────────────────────────────┐
│  نواقص الأدوية                                      [رجوع] │
├─────────────────────────────────────────────────────────────┤
│  🔴 النواقص (15)                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ البحث عن دواء...                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│                    [ترتيب ▼]  [PDF]  [Excel]  ← زر جديد    │
└─────────────────────────────────────────────────────────────┘
```

### ملف Excel المُصدَّر:

```text
┌──────┬────────────────────┬─────────────────────┬───────────┐
│ No.  │ Drug Name          │ Description         │ Notes     │
├──────┼────────────────────┼─────────────────────┼───────────┤
│  1   │ باراسيتامول       │ Paracetamol 500mg   │ -         │
│  2   │ أوجمنتين          │ Amoxicillin         │ ملاحظة    │
│  3   │ فنتولين           │ Salbutamol          │ -         │
└──────┴────────────────────┴─────────────────────┴───────────┘
```
