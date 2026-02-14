
# إصلاح تداخل العناصر في نموذج السدادات

## المشكلة
في `PaymentForm.tsx`، الصف الأول يستخدم `grid grid-cols-5 gap-2` حيث:
- `CompanySelector` يأخذ `col-span-3` ويحتوي داخلياً على: dropdown + زر تعديل + زر إضافة (+)
- حقل المبلغ يأخذ `col-span-2`

على الموبايل، المساحة ضيقة جداً فتتداخل الأزرار مع حقل المبلغ ويختفي زر (+).

## الحل

### 1. إعادة تنظيم التخطيط (`PaymentForm.tsx`)
- تغيير الصف الأول من `grid grid-cols-5` إلى صفين منفصلين:
  - صف أول: `CompanySelector` بعرض كامل (100%)
  - صف ثاني: حقل المبلغ بعرض كامل
- هذا يمنح كل عنصر مساحته الكاملة

### 2. تحسين `CompanySelector.tsx`
- إبقاء أزرار التعديل والإضافة بجانب الـ dropdown
- تكبير زر الإضافة (+) ليكون بحجم مناسب للمس (44x44px)
- تلوين زر الإضافة بالأخضر (`bg-primary text-white`) مع z-index عالي

### 3. حقل المبلغ
- إضافة `inputMode="decimal"` لفتح لوحة أرقام تلقائياً على الموبايل
- الحفاظ على `type="number"` مع `dir="ltr"`

## التفاصيل التقنية

### الملفات المتأثرة:

| الملف | التعديل |
|-------|---------|
| `src/components/payments/PaymentForm.tsx` | تغيير layout الصف الأول من grid-cols-5 إلى صفين منفصلين |
| `src/components/payments/CompanySelector.tsx` | تحسين زر الإضافة (لون أخضر، حجم أكبر، z-index) |

### تعديل PaymentForm.tsx (صف الشركة والمبلغ):
```typescript
// قبل: grid واحد ضيق
<div className="grid grid-cols-5 gap-2">
  <div className="col-span-3"><CompanySelector /></div>
  <div className="col-span-2">المبلغ</div>
</div>

// بعد: صفين منفصلين
<div className="space-y-3">
  <CompanySelector value={companyName} onChange={setCompanyName} />
  <div>
    <label>المبلغ (د.ل)</label>
    <Input type="number" inputMode="decimal" ... />
  </div>
</div>
```

### تعديل CompanySelector.tsx (زر الإضافة):
```typescript
// تحسين زر الإضافة
<Button
  type="button"
  size="icon"
  onClick={() => setShowAddDialog(true)}
  className="flex-shrink-0 h-10 w-10 bg-primary hover:bg-primary/90 text-white relative z-10"
>
  <Plus className="w-5 h-5" />
</Button>
```
