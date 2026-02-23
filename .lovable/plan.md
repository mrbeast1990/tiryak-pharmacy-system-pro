
# تحسين PDF + نظام سجل الطلبيات

## التعديلات المطلوبة

### 1. إضافة العنوان في PDF
**الملف**: `src/hooks/useOrderPDF.ts`
- بعد سطر رقم الهاتف (سطر 109)، إضافة سطر جديد:
  `"اجدابيا - حي 7 أكتوبر - طريق المزدوج تحت الكوبري"`
- بنفس حجم خط رقم الهاتف (10) ولون رمادي

### 2. تكبير خط بيانات الجدول + Bold لأسماء الأصناف
**الملف**: `src/hooks/useOrderPDF.ts`
- تغيير `fontSize` في `styles` من 8 إلى 9
- إضافة `fontStyle: 'bold'` لعمود اسم الصنف (`columnStyles[1]`)

### 3. نظام سجل الطلبيات (History)
إنشاء نظام محلي (Zustand + localStorage) لحفظ الطلبيات السابقة مع إمكانية استعراضها وتعديلها وإعادة تصديرها.

#### الملفات الجديدة:

**`src/store/orderHistoryStore.ts`** - متجر Zustand مع persist:
- واجهة `SavedOrder`: تحتوي `id`, `supplierName`, `supplierPhone`, `products`, `totalAmount`, `createdAt`, `updatedAt`
- الإجراءات: `saveOrder`, `updateOrder`, `deleteOrder`, `getOrders`
- حفظ تلقائي في localStorage

**`src/components/order-builder/OrderHistory.tsx`** - مكون عرض السجل:
- قائمة بالطلبيات السابقة مرتبة بالتاريخ (الأحدث أولا)
- كل طلبية تعرض: اسم المورد، عدد الأصناف، الإجمالي، التاريخ
- أزرار: تحميل للتعديل، حذف، إعادة تصدير PDF

#### الملفات المعدلة:

**`src/hooks/useOrderPDF.ts`**:
- إضافة العنوان بعد رقم الهاتف
- تكبير خط الجدول من 8 إلى 9
- Bold لعمود اسم الصنف

**`src/components/order-builder/OrderBuilder.tsx`**:
- إضافة زر "السجل" في الهيدر
- عند التصدير: حفظ الطلبية تلقائيا في السجل
- إضافة حالة عرض السجل ومكون OrderHistory
- عند تحميل طلبية من السجل: تعبئة البيانات في النموذج للتعديل

**`src/store/orderBuilderStore.ts`**:
- إضافة `currentOrderId` لتتبع الطلبية المحملة من السجل
- إضافة `loadOrder` لتحميل طلبية محفوظة

---

## التفاصيل التقنية

### هيكل SavedOrder:
```text
{
  id: string (UUID)
  supplierName: string
  supplierPhone: string
  products: OrderProduct[]
  totalAmount: number
  createdAt: string (ISO date)
  updatedAt: string (ISO date)
}
```

### تدفق العمل:
```text
تصدير PDF -> حفظ تلقائي في السجل
السجل -> اختيار طلبية -> تحميل في المحرر -> تعديل -> إعادة تصدير -> تحديث في السجل
```

### عمود اسم الصنف Bold:
```text
columnStyles: {
  1: { halign: 'left', cellWidth: 'auto', fontStyle: 'bold' }
}
```
