-- ==========================================
-- المرحلة الثامنة: الموظفين
-- ==========================================

-- 1. إنشاء جدول الموظفين (agency_staff)
CREATE TABLE agency_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. تفعيل الحماية (RLS) لجدول الموظفين
ALTER TABLE agency_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency isolation for staff" ON agency_staff
    FOR ALL USING (agency_id = get_current_agency_id());
