-- تحديث صلاحيات المستخدم الموجود وإنشاء مستخدم جديد
-- أولاً، إنشاء المستخدم الجديد مع معرف محدد
DO $$
DECLARE
    new_user_id UUID := 'dde2eb54-feb6-4a60-a733-917ed10908c6'; -- استخدام المعرف الموجود من السجلات
BEGIN
    -- التحقق إذا كان المستخدم موجود وتحديث الملف الشخصي
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
        -- تحديث الملف الشخصي الموجود
        UPDATE public.profiles 
        SET role = 'admin', name = 'أحمد الرجيلي' 
        WHERE id = new_user_id;
        
        RAISE NOTICE 'تم تحديث صلاحيات المستخدم الموجود إلى admin';
    ELSE
        -- إدراج ملف شخصي جديد
        INSERT INTO public.profiles (id, name, role)
        VALUES (new_user_id, 'أحمد الرجيلي', 'admin');
        
        RAISE NOTICE 'تم إنشاء ملف شخصي جديد بصلاحيات admin';
    END IF;
END $$;