-- إنشاء المستخدم الجديد مباشرة في جدول auth.users
-- استخدام UUID محدد للمستخدم الجديد
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- إدراج المستخدم في جدول auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin,
        raw_app_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated', 
        'thepanaceapharmacy@gmail.com',
        crypt('thepanaceapharmacy@gmail.com', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"full_name": "أحمد الرجيلي"}'::jsonb,
        false,
        '{"provider": "email", "providers": ["email"]}'::jsonb
    );

    -- إدراج الملف الشخصي
    INSERT INTO public.profiles (id, name, role)
    VALUES (new_user_id, 'أحمد الرجيلي', 'admin');

    -- إدراج هوية المستخدم
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        format('{"sub": "%s", "email": "%s"}', new_user_id::text, 'thepanaceapharmacy@gmail.com')::jsonb,
        'email',
        now(),
        now()
    );

    RAISE NOTICE 'تم إنشاء المستخدم بنجاح بالمعرف: %', new_user_id;
END $$;