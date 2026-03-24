-- ============================================================
--  ParkNow — MySQL Schema
--  Run this file once against your MySQL database:
--    mysql -u root -p parknow < backend/config/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS parknow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE parknow;

-- ─── USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  first      VARCHAR(80)  NOT NULL,
  last       VARCHAR(80)  NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  vehicle    VARCHAR(20)  NOT NULL,
  vtype      ENUM('car','bike','suv') NOT NULL DEFAULT 'car',
  role       ENUM('user','admin')     NOT NULL DEFAULT 'user',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB;

-- ─── SLOTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slots (
  id        VARCHAR(4)   NOT NULL,
  zone      CHAR(1)      NOT NULL,
  zone_name VARCHAR(60)  NOT NULL,
  type      ENUM('car','bike','suv') NOT NULL,
  status    ENUM('free','occupied','reserved') NOT NULL DEFAULT 'free',
  PRIMARY KEY (id),
  KEY idx_zone   (zone),
  KEY idx_status (status)
) ENGINE=InnoDB;

-- ─── BOOKINGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id         VARCHAR(10)  NOT NULL,
  user_id    CHAR(36)     NOT NULL,
  slot_id    VARCHAR(4)   NOT NULL,
  zone_name  VARCHAR(60)  NOT NULL,
  vehicle    VARCHAR(20)  NOT NULL,
  vtype      ENUM('car','bike','suv') NOT NULL,
  date       DATE         NOT NULL,
  time       TIME         NOT NULL,
  end_time   TIME         NOT NULL,
  dur        TINYINT      NOT NULL COMMENT 'hours',
  cost       SMALLINT     NOT NULL COMMENT 'INR',
  pay        ENUM('upi','card','wallet','cash') NOT NULL,
  status     ENUM('active','cancelled','completed') NOT NULL DEFAULT 'active',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user   (user_id),
  KEY idx_slot   (slot_id),
  KEY idx_date   (date),
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_booking_slot FOREIGN KEY (slot_id) REFERENCES slots(id)
) ENGINE=InnoDB;

-- ─── SEED SLOTS (48 slots: 4 zones × 12) ──────────────────
INSERT IGNORE INTO slots (id, zone, zone_name, type, status) VALUES
  ('A1','A','Ground Floor - Standard','car','free'),
  ('A2','A','Ground Floor - Standard','car','free'),
  ('A3','A','Ground Floor - Standard','car','free'),
  ('A4','A','Ground Floor - Standard','car','occupied'),
  ('A5','A','Ground Floor - Standard','car','free'),
  ('A6','A','Ground Floor - Standard','car','free'),
  ('A7','A','Ground Floor - Standard','car','reserved'),
  ('A8','A','Ground Floor - Standard','car','free'),
  ('A9','A','Ground Floor - Standard','car','free'),
  ('A10','A','Ground Floor - Standard','car','occupied'),
  ('A11','A','Ground Floor - Standard','car','free'),
  ('A12','A','Ground Floor - Standard','car','free'),
  ('B1','B','Ground Floor - Compact','bike','free'),
  ('B2','B','Ground Floor - Compact','bike','free'),
  ('B3','B','Ground Floor - Compact','bike','occupied'),
  ('B4','B','Ground Floor - Compact','bike','free'),
  ('B5','B','Ground Floor - Compact','bike','free'),
  ('B6','B','Ground Floor - Compact','bike','reserved'),
  ('B7','B','Ground Floor - Compact','bike','free'),
  ('B8','B','Ground Floor - Compact','bike','free'),
  ('B9','B','Ground Floor - Compact','bike','free'),
  ('B10','B','Ground Floor - Compact','bike','occupied'),
  ('B11','B','Ground Floor - Compact','bike','free'),
  ('B12','B','Ground Floor - Compact','bike','free'),
  ('C1','C','First Floor - Standard','car','free'),
  ('C2','C','First Floor - Standard','car','reserved'),
  ('C3','C','First Floor - Standard','car','free'),
  ('C4','C','First Floor - Standard','car','free'),
  ('C5','C','First Floor - Standard','car','free'),
  ('C6','C','First Floor - Standard','car','occupied'),
  ('C7','C','First Floor - Standard','car','free'),
  ('C8','C','First Floor - Standard','car','free'),
  ('C9','C','First Floor - Standard','car','free'),
  ('C10','C','First Floor - Standard','car','free'),
  ('C11','C','First Floor - Standard','car','reserved'),
  ('C12','C','First Floor - Standard','car','free'),
  ('D1','D','First Floor - Premium','suv','free'),
  ('D2','D','First Floor - Premium','suv','free'),
  ('D3','D','First Floor - Premium','suv','occupied'),
  ('D4','D','First Floor - Premium','suv','free'),
  ('D5','D','First Floor - Premium','suv','free'),
  ('D6','D','First Floor - Premium','suv','free'),
  ('D7','D','First Floor - Premium','suv','reserved'),
  ('D8','D','First Floor - Premium','suv','free'),
  ('D9','D','First Floor - Premium','suv','free'),
  ('D10','D','First Floor - Premium','suv','free'),
  ('D11','D','First Floor - Premium','suv','occupied'),
  ('D12','D','First Floor - Premium','suv','free');
