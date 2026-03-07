-- ============================================================
-- Seed Data for Movie Ticket Booking System
-- Run AFTER schema.sql
-- ============================================================

USE movie_booking;

-- ------------------------------------------------------------
-- USERS
-- Passwords are bcrypt hashes of:
--   admin@movie.com      → "Admin@123"
--   owner@movie.com      → "Owner@123"
--   alice@movie.com      → "Alice@123"
--   bob@movie.com        → "Bob@123"
-- ------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, gift_card_balance) VALUES
('Super Admin',    'admin@movie.com', '$2b$10$Q5n8b3P2Lv.w4v8W6P7aZOd7E1qL1rFzS8cxYhYqP1mJhH7NkKGnm', 'admin',         0.00),
('Raj Theaters',   'owner@movie.com', '$2b$10$Q5n8b3P2Lv.w4v8W6P7aZOd7E1qL1rFzS8cxYhYqP1mJhH7NkKGnm', 'theater_owner', 0.00),
('Alice Kumar',    'alice@movie.com', '$2b$10$Q5n8b3P2Lv.w4v8W6P7aZOd7E1qL1rFzS8cxYhYqP1mJhH7NkKGnm', 'customer',      500.00),
('Bob Singh',      'bob@movie.com',   '$2b$10$Q5n8b3P2Lv.w4v8W6P7aZOd7E1qL1rFzS8cxYhYqP1mJhH7NkKGnm', 'customer',      0.00);

-- ------------------------------------------------------------
-- MOVIES
-- ------------------------------------------------------------
INSERT INTO movies (title, genre, duration, description, poster_url, language, rating) VALUES
('Interstellar',    'Sci-Fi',  169, 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIE.jpg', 'English', 8.6),
('KGF Chapter 2',  'Action',  168, 'Rocky, who has become the Overlord of the Kolar Gold Fields, faces new threats from the government and a powerful villain.', 'https://image.tmdb.org/t/p/w500/4j0PNHkMr5ax3ZTz3g6bXF7zr38.jpg', 'Kannada', 8.2),
('RRR',            'Drama',   182, 'A fictional story about two legendary revolutionaries and their journey far away from home before they began fighting for their country.', 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeF1lgXO.jpg', 'Telugu',  7.8),
('Oppenheimer',    'History', 180, 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 'English', 8.3);

-- ------------------------------------------------------------
-- THEATERS
-- ------------------------------------------------------------
INSERT INTO theaters (name, location, owner_id) VALUES
('PVR Cinemas - Phoenix Mall', 'Velachery, Chennai, Tamil Nadu', 2),
('INOX - Forum Mall',          'Koramangala, Bengaluru, Karnataka', 2);

-- ------------------------------------------------------------
-- SCREENS
-- ------------------------------------------------------------
INSERT INTO screens (theater_id, screen_name, total_seats) VALUES
(1, 'Screen 1 - Gold',    50),
(1, 'Screen 2 - Silver',  40),
(2, 'Screen 1 - Luxe',    60),
(2, 'Screen 2 - Standard',48);

-- ------------------------------------------------------------
-- SHOWS  (start times relative to today)
-- ------------------------------------------------------------
INSERT INTO shows (movie_id, screen_id, start_time, price) VALUES
(1, 1, DATE_ADD(CURDATE(), INTERVAL '10:30:00' HOUR_SECOND), 250.00),
(1, 1, DATE_ADD(CURDATE(), INTERVAL '14:00:00' HOUR_SECOND), 280.00),
(2, 2, DATE_ADD(CURDATE(), INTERVAL '11:00:00' HOUR_SECOND), 220.00),
(3, 3, DATE_ADD(CURDATE(), INTERVAL '15:30:00' HOUR_SECOND), 300.00),
(4, 4, DATE_ADD(CURDATE(), INTERVAL '18:00:00' HOUR_SECOND), 350.00),
(1, 3, DATE_ADD(CURDATE(), INTERVAL '20:30:00' HOUR_SECOND), 320.00);

-- ------------------------------------------------------------
-- SEATS  (auto-generate for each show via stored procedure)
-- Rows A-E, Seats 1-10 for shows 1-6
-- ------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE seed_seats()
BEGIN
  DECLARE sid INT DEFAULT 1;
  DECLARE r VARCHAR(2);
  DECLARE sn INT;
  DECLARE rows_list VARCHAR(20) DEFAULT 'ABCDE';
  DECLARE row_char VARCHAR(1);
  DECLARE i INT;
  DECLARE j INT;

  WHILE sid <= 6 DO
    SET i = 1;
    WHILE i <= 5 DO
      SET row_char = SUBSTRING(rows_list, i, 1);
      SET j = 1;
      WHILE j <= 10 DO
        INSERT IGNORE INTO seats (show_id, row_label, seat_num, status)
        VALUES (sid, row_char, j, 'available');
        SET j = j + 1;
      END WHILE;
      SET i = i + 1;
    END WHILE;
    SET sid = sid + 1;
  END WHILE;
END$$
DELIMITER ;

CALL seed_seats();
DROP PROCEDURE IF EXISTS seed_seats;

-- Mark a few seats as already booked (for demo)
UPDATE seats SET status = 'booked' WHERE show_id = 1 AND row_label = 'A' AND seat_num IN (1,2,3);
UPDATE seats SET status = 'booked' WHERE show_id = 1 AND row_label = 'B' AND seat_num IN (5,6);

-- ------------------------------------------------------------
-- GIFT CARDS
-- ------------------------------------------------------------
INSERT INTO gift_cards (code, value, is_active, created_by) VALUES
('WELCOME500', 500.00, 1, 1),
('MOVIE200',   200.00, 1, 1),
('FREESEAT',   350.00, 0, 1);

-- ------------------------------------------------------------
-- SAMPLE BOOKING (Alice, Show 1, Seats A4+A5)
-- ------------------------------------------------------------
INSERT INTO bookings (user_id, show_id, total_price, payment_method, status) VALUES
(3, 1, 500.00, 'gift_card', 'confirmed');

INSERT INTO booking_seats (booking_id, seat_id)
SELECT 1, id FROM seats WHERE show_id = 1 AND row_label = 'A' AND seat_num IN (4, 5);

UPDATE seats SET status='booked' WHERE show_id=1 AND row_label='A' AND seat_num IN (4,5);
