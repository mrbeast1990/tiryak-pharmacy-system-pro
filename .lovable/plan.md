
# إصلاح شريط البحث في صفحة النواقص

## المشكلة
شريط البحث والفلاتر (`sticky top-14`) يختفي خلف الـ header عند التمرير لأسفل. السبب أن الـ header ارتفاعه يتغير مع safe-area-top لكن `top-14` ثابت ولا يتغير.

## الحل
- تغيير `top-14` في شريط البحث ليتوافق مع ارتفاع الـ header الفعلي
- استخدام CSS calc مع safe area: `top: calc(4rem + max(24px, env(safe-area-inset-top)))` أو بديل أبسط
- رفع z-index لشريط البحث ليتساوى مع الـ header

## التفاصيل التقنية

### الملف: `src/components/ShortageManager.tsx`

**تعديل 1**: تغيير الـ header ليستخدم ارتفاع ثابت معروف (h-16 = 4rem + safe area)

**تعديل 2**: تغيير شريط البحث الـ sticky من:
```
className="sticky top-14 z-10 ..."
```
إلى:
```
style={{ top: 'calc(4rem + max(24px, env(safe-area-inset-top)))' }}
className="sticky z-10 ..."
```

هذا يضمن أن شريط البحث يبدأ مباشرة تحت الـ header بغض النظر عن حجم الـ safe area.

### الملف المتأثر:
| الملف | التعديل |
|-------|---------|
| `src/components/ShortageManager.tsx` | تعديل top position لشريط البحث |
