

# الملء التلقائي للاسم العلمي عند اختيار اسم الدواء من الاقتراحات

## الفكرة
عند اختيار اسم دواء من قائمة الاقتراحات، يتم تعبئة حقل "الاسم العلمي" تلقائيا بالاسم العلمي المسجل مسبقا لهذا الصنف (من جدول medicines أو pharmacy_guide)، بدلا من إعادة كتابته يدويا في كل مرة.

## التعديلات

### 1. إضافة دالة بحث عن الاسم العلمي في suggestionsStore
- إضافة دالة `getScientificNameForTrade` في `suggestionsStore.ts`
- تبحث أولا في جدول `medicines` (الأدوية المسجلة سابقا) عن أي صنف بنفس الاسم التجاري وتعيد اسمه العلمي
- إذا لم تجد، تبحث في بيانات `pharmacy_guide` المحملة مسبقا
- تعديل `fetchPharmacyGuide` لتخزين البيانات كاملة (trade_name + scientific_name) كـ Map للبحث السريع

### 2. تعديل AddMedicineDialog لاستخدام الملء التلقائي
- عند النقر على اقتراح في قائمة الاسم التجاري:
  - يتم تعبئة `medicineName` كالمعتاد
  - يتم استدعاء `getScientificNameForTrade` للحصول على الاسم العلمي
  - إذا وُجد اسم علمي مطابق، يتم تعبئة `scientificName` تلقائيا
  - إذا لم يوجد، يبقى الحقل فارغا ليملأه المستخدم يدويا

## التفاصيل التقنية

### الملف: `src/store/suggestionsStore.ts`
- إضافة حقل `pharmacyGuideMap` من نوع `Map<string, string>` (trade_name -> scientific_name)
- تعديل `fetchPharmacyGuide` لبناء هذا الـ Map
- إضافة دالة جديدة:
  ```
  getScientificNameForTrade: (medicines, tradeName) => string | null
  ```
  تبحث في medicines أولا ثم في pharmacyGuideMap

### الملف: `src/components/shortage/AddMedicineDialog.tsx`
- تعديل handler النقر على اقتراح الاسم التجاري (سطر 158-161):
  ```
  onClick={() => {
    setMedicineName(suggestion);
    const scientificMatch = getScientificNameForTrade(medicines, suggestion);
    if (scientificMatch) setScientificName(scientificMatch);
    setShowMedicineSuggestions(false);
  }}
  ```

### الملفات المتأثرة

| الملف | التعديل |
|-------|---------|
| `src/store/suggestionsStore.ts` | إضافة pharmacyGuideMap + دالة getScientificNameForTrade |
| `src/components/shortage/AddMedicineDialog.tsx` | استدعاء الملء التلقائي عند اختيار اقتراح |

