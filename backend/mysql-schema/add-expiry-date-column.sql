-- Add expiry_date to transport_requests if you already ran the main ALTER without it.
USE student_database;

ALTER TABLE transport_requests
  ADD COLUMN expiry_date DATE NULL COMMENT 'Transport valid until (semester end for that year/sem)' AFTER semester_end_date;
