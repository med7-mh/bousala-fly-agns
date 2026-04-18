-- ==========================================
-- المرحلة السادسة: المصروفات وإدارة الموردين
-- ==========================================

-- 1. إنشاء جدول الموردين (Suppliers)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. تفعيل الحماية (RLS) لجدول الموردين
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency isolation for suppliers" ON suppliers
    FOR ALL USING (agency_id = get_current_agency_id());

-- 3. تحديث جدول الحجوزات ليرتبط بالمورد المختار كـ ID
ALTER TABLE bookings ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- 4. إزالة القيد القديم لأنواع العمليات (Income, Expense) وإضافة المصروف التشغيلي (operating_expense)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense', 'operating_expense'));

-- 5. إضافة عمود المورد للعمليات المالية لربط السندات والدفعات بمورد بدلاً من حجز
ALTER TABLE transactions ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
