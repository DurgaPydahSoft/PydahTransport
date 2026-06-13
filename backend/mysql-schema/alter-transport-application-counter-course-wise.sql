-- Course-wise transport application numbers per college + academic year.
-- Format example: PCE-BTECH-0001 (college code + course code + 4-digit serial)

USE student_database;

CREATE TABLE IF NOT EXISTS transport_application_counters_v2 (
  academic_year VARCHAR(20) NOT NULL,
  college_code VARCHAR(32) NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  last_serial INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (academic_year, college_code, course_code)
);

ALTER TABLE transport_requests
  MODIFY COLUMN application_number VARCHAR(32) NULL COMMENT 'e.g. PCE-BTECH-0001';

ALTER TABLE transport_requests
  ADD COLUMN IF NOT EXISTS application_college_code VARCHAR(32) NULL AFTER application_serial,
  ADD COLUMN IF NOT EXISTS application_course_code VARCHAR(32) NULL AFTER application_college_code;

-- MySQL 8.0.12 and below do not support IF NOT EXISTS on ADD COLUMN; run manually if needed:
-- ALTER TABLE transport_requests ADD COLUMN application_college_code VARCHAR(32) NULL AFTER application_serial;
-- ALTER TABLE transport_requests ADD COLUMN application_course_code VARCHAR(32) NULL AFTER application_college_code;
