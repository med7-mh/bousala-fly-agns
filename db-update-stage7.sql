-- ==========================================
-- المرحلة السابعة: إضافة معاملات جواز السفر
-- ==========================================

-- 1. تحديث أنواع الحجوزات لتشمل جواز السفر (passport)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_type_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_type_check CHECK (type IN ('flight', 'hotel', 'visa', 'tour', 'passport'));

-- 2. تحديث حالات الحجوزات لتشمل حالات تتبع الجواز
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'documents_received', 'processing', 'ready', 'delivered'));

-- 3. إضافة الحقول الإضافية الخاصة بمعاملات الجواز
ALTER TABLE bookings ADD COLUMN national_id VARCHAR(100);
ALTER TABLE bookings ADD COLUMN receipt_number VARCHAR(100);
ALTER TABLE bookings ADD COLUMN expected_date DATE;
