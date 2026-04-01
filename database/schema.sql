-- ============================================================
-- Online Movie Ticket Booking System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS movie_booking;
USE movie_booking;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(191)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('customer','admin','theater_owner') NOT NULL DEFAULT 'customer',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  gift_card_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- MOVIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movies (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  genre       VARCHAR(100)  NOT NULL,
  duration    INT           NOT NULL COMMENT 'Duration in minutes',
  description TEXT,
  poster_url  VARCHAR(500),
  language    VARCHAR(80)   DEFAULT 'English',
  rating      DECIMAL(2,1)  DEFAULT 0.0,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_genre (genre),
  INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- THEATERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS theaters (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(200)  NOT NULL,
  location  VARCHAR(400)  NOT NULL,
  owner_id  INT UNSIGNED  NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- SCREENS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  theater_id  INT UNSIGNED NOT NULL,
  screen_name VARCHAR(100) NOT NULL,
  total_seats INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE CASCADE,
  INDEX idx_theater (theater_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- SHOWS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shows (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  movie_id    INT UNSIGNED    NOT NULL,
  screen_id   INT UNSIGNED    NOT NULL,
  start_time  DATETIME        NOT NULL,
  price       DECIMAL(10,2)   NOT NULL,
  total_seats INT UNSIGNED    DEFAULT NULL COMMENT 'Optional override for screen capacity',
  status      ENUM('scheduled', 'cancelled') DEFAULT 'scheduled',
  FOREIGN KEY (movie_id)  REFERENCES movies(id)  ON DELETE CASCADE,
  FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE,
  INDEX idx_movie  (movie_id),
  INDEX idx_screen (screen_id),
  INDEX idx_start  (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- SEATS
-- Seat status lifecycle: available → reserved → booked
--                            ↑____________/ (on timeout or failure)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  show_id     INT UNSIGNED NOT NULL,
  row_label   VARCHAR(5)   NOT NULL,
  seat_num    VARCHAR(10)  NOT NULL,
  status      ENUM('available','reserved','booked') NOT NULL DEFAULT 'available',
  reserved_at DATETIME     DEFAULT NULL COMMENT 'Timestamp when seat was reserved',
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
  INDEX idx_show   (show_id),
  INDEX idx_status (status),
  UNIQUE KEY uq_seat (show_id, row_label, seat_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- BOOKINGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  show_id        INT UNSIGNED NOT NULL,
  total_price    DECIMAL(10,2) NOT NULL,
  payment_method ENUM('gift_card','mock_payment','stripe') NOT NULL DEFAULT 'mock_payment',
  status         ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  qr_code        TEXT         COMMENT 'Base64 QR code image',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_show (show_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- BOOKING SEATS  (junction table)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_seats (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  seat_id    INT UNSIGNED NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id)    REFERENCES seats(id)    ON DELETE CASCADE,
  UNIQUE KEY uq_booking_seat (booking_id, seat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- GIFT CARDS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gift_cards (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(50)   NOT NULL UNIQUE,
  value      DECIMAL(10,2) NOT NULL,
  is_active  TINYINT(1)    NOT NULL DEFAULT 1,
  created_by INT UNSIGNED  NOT NULL COMMENT 'Admin user id',
  redeemed_by INT UNSIGNED DEFAULT NULL,
  redeemed_at DATETIME     DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by)  REFERENCES users(id),
  FOREIGN KEY (redeemed_by) REFERENCES users(id),
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
