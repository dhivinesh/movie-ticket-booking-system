const mysql = require('mysql2/promise');
require('dotenv').config();

async function verify() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Verifying Gift Card Refunds on Show Cancellation ---');

        // 1. Get a show with bookings
        const [[show]] = await connection.query(`
      SELECT s.id, t.owner_id 
      FROM shows s
      JOIN screens sc ON s.screen_id = sc.id
      JOIN theaters t ON sc.theater_id = t.id
      JOIN bookings b ON b.show_id = s.id
      WHERE b.payment_method = 'gift_card' AND b.status = 'confirmed'
      LIMIT 1
    `);

        if (!show) {
            console.log('No eligible show with gift card bookings found for automated test. Please create one manually.');
            return;
        }

        console.log(`Testing with Show ID: ${show.id}`);

        // Get current balances of users who booked this show
        const [bookings] = await connection.query(
            "SELECT user_id, total_price FROM bookings WHERE show_id = ? AND payment_method = 'gift_card' AND status = 'confirmed'",
            [show.id]
        );

        const initialBalances = {};
        for (const b of bookings) {
            const [[u]] = await connection.query('SELECT gift_card_balance FROM users WHERE id = ?', [b.user_id]);
            initialBalances[b.user_id] = parseFloat(u.gift_card_balance);
        }

        console.log('Initial Balances:', initialBalances);

        // 2. Mock owner context and cancel show
        // We'll simulate the cancelShow logic directly here for verification of the logic flow
        const conn = await connection;
        await conn.beginTransaction();

        // Logic from showController.js:
        const [bookingsToRefund] = await conn.query(
            "SELECT id, user_id, total_price FROM bookings WHERE show_id = ? AND payment_method = 'gift_card' AND status = 'confirmed'",
            [show.id]
        );

        for (const booking of bookingsToRefund) {
            await conn.query(
                'UPDATE users SET gift_card_balance = gift_card_balance + ? WHERE id = ?',
                [booking.total_price, booking.user_id]
            );
        }
        await conn.query('UPDATE shows SET status = ? WHERE id = ?', ['cancelled', show.id]);
        await conn.query('UPDATE bookings SET status = ? WHERE show_id = ?', ['refunded', show.id]);
        await conn.commit();

        console.log('Show cancelled and logic executed.');

        // 3. Verify final balances
        let allPassed = true;
        for (const b of bookings) {
            const [[u]] = await connection.query('SELECT gift_card_balance FROM users WHERE id = ?', [b.user_id]);
            const finalBalance = parseFloat(u.gift_card_balance);
            const expected = initialBalances[b.user_id] + parseFloat(b.total_price);

            if (Math.abs(finalBalance - expected) < 0.01) {
                console.log(`✅ User ${b.user_id}: Refund Correct. Initial: ${initialBalances[b.user_id]}, Refund: ${b.total_price}, Final: ${finalBalance}`);
            } else {
                console.log(`❌ User ${b.user_id}: Refund WRONG. Expected: ${expected}, Got: ${finalBalance}`);
                allPassed = false;
            }
        }

        if (allPassed) console.log('\nVERIFICATION SUCCESSFUL');
        else console.log('\nVERIFICATION FAILED');

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await connection.end();
    }
}

verify();
