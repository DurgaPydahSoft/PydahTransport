-- Transport application number per academic year (assigned on approval only).
-- Format: 0001 (4-digit serial per academic year; academic_year column holds the session)

USE student_database;

CREATE TABLE IF NOT EXISTS transport_application_counters (
  academic_year VARCHAR(20) PRIMARY KEY,
  last_serial INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE transport_requests
  ADD COLUMN application_number VARCHAR(10) NULL COMMENT 'e.g. 0001 — serial per academic year' AFTER academic_year,
  ADD COLUMN application_serial INT UNSIGNED NULL AFTER application_number;

ALTER TABLE transport_requests
  ADD UNIQUE KEY uk_transport_ay_application_number (academic_year, application_number),
  ADD KEY idx_transport_ay_serial (academic_year, application_serial);
