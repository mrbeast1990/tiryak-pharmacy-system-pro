-- إضافة الأعمدة الجديدة من ملف الإكسيل
ALTER TABLE pharmacy_guide 
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS quantity INTEGER,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS barcode TEXT;

-- جعل الاسم العلمي اختياري (الـ AI سيستنتجه من الاسم التجاري)
ALTER TABLE pharmacy_guide 
  ALTER COLUMN scientific_name DROP NOT NULL;