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

-- Academic session label stored when request is raised (e.g. 2024-2025)
-- ALTER TABLE transport_requests ADD COLUMN academic_year VARCHAR(20) NULL COMMENT 'Academic session e.g. 2024-2025' AFTER year_of_study;

-- If you already ran the ALTER above without expiry_date, add it with:
-- ALTER TABLE transport_requests ADD COLUMN expiry_date DATE NULL COMMENT 'Transport valid until (semester end for that year/sem)' AFTER semester_end_date;

-- Course + year-of-study transport expiry (one date per course per year-of-study per academic year)
CREATE TABLE IF NOT EXISTS course_transport_expiry (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  year_of_study TINYINT NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_course_year_academic (course_id, academic_year, year_of_study),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- If you already created the old table (course-only, no year_of_study), run:
-- ALTER TABLE course_transport_expiry ADD COLUMN year_of_study TINYINT NOT NULL DEFAULT 1 AFTER academic_year;
-- ALTER TABLE course_transport_expiry DROP INDEX uk_course_academic_year;
-- ALTER TABLE course_transport_expiry ADD UNIQUE KEY uk_course_year_academic (course_id, academic_year, year_of_study);
