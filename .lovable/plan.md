# تعديل فلترة المصاريف + السماح للموظفين بتعديل إيراداتهم

## الجزء 1: فلترة المصاريف (نفس نمط السدادات)

### 1. `src/store/expensesStore.ts`

- تغيير `ExpensesFilters` ليشمل: `dateFilter: 'all' | 'month' | 'range'`، `selectedMonth`، `selectedYear`، `dateFrom`، `dateTo`
- الفلتر الافتراضي: `dateFilter: 'month'` مع الشهر الحالي
- تحديث `getFilteredExpenses()` للفلترة بالشهر المحدد أو النطاق

### 2. `src/components/expenses/ExpensesFilters.tsx`

- استبدال نظام Badges بواجهة مطابقة لـ `PaymentsFilters`:
  - أزرار: الكل / شهر محدد / نطاق تاريخ
  - Select للشهر + Select للسنة عند اختيار "شهر محدد"
  - حقول من/إلى عند اختيار "نطاق تاريخ"
  - زر "غير المخصومة فقط"

### 3. `src/components/expenses/ExpensesSummary.tsx`

- تحسين تنسيق العملة باستخدام `Intl.NumberFormat`

---

## الجزء 2: السماح للموظفين بتعديل إيراداتهم

حالياً التعديل مقيد بـ `checkPermission('manage_users')` (المدير فقط). المطلوب: كل مستخدم يقدر يعدل سجلاته فقط.

### 4. `src/components/revenue/DailyRevenueDetails.tsx`

- تغيير شرط عرض أزرار التعديل من `canManage` إلى: المدير يرى الكل، والموظف يرى أزرار التعديل فقط على سجلاته (مقارنة `revenue.created_by_id` أو `revenue.createdBy` مع اسم المستخدم الحالي)
- تمرير `userId` كـ prop جديد

### 5. `src/components/revenue/PeriodRevenueDetails.tsx`

- نفس التعديل: إضافة `userId` وعرض أزرار التعديل للموظف على سجلاته فقط

### 6. `src/components/RevenueManager.tsx`

- تمرير `userId` (من `useAuthStore`) إلى `DailyRevenueDetails` و `PeriodRevenueDetails`

### 7. RLS Policy (قاعدة البيانات)

- إضافة سياسة UPDATE جديدة على جدول `revenues` تسمح للموظفين بتعديل سجلاتهم فقط:

```sql
CREATE POLICY "Users can update their own revenues"
ON public.revenues FOR UPDATE
USING (created_by_id = auth.uid());
```

- السياسة الحالية تسمح فقط للمدير بالتعديل، لذلك نضيف سياسة جديدة بجانبها

&nbsp;

في انشاء طلبيات عند انشاء الطلبية واصدارها pdf ضف عمود جنب ر.م اسمه Code فيه كود الصنف