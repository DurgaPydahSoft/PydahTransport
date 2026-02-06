-- Run this after the semesters table exists.
-- Adds semester columns and expiry_date to transport_requests.
-- For a given semester (e.g. Year 3 Sem 1), expiry_date = that semester's end_date from semesters table.

USE student_database;

ALTER TABLE transport_requests
  ADD COLUMN semester_id INT NULL,
  ADD COLUMN semester_start_date DATE NULL,
  ADD COLUMN semester_end_date DATE NULL,
  ADD COLUMN expiry_date DATE NULL COMMENT 'Transport valid until this date (semester end_date for that year/sem)',
  ADD COLUMN academic_year_id INT NULL,
  ADD COLUMN year_of_study TINYINT NULL,
  ADD COLUMN semester_number TINYINT NULL;

-- If you already ran the ALTER above without expiry_date, add it with:
-- ALTER TABLE transport_requests ADD COLUMN expiry_date DATE NULL COMMENT 'Transport valid until (semester end for that year/sem)' AFTER semester_end_date;
