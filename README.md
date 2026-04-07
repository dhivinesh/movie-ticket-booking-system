# 🎬 Online Movie Ticket Booking System

A comprehensive, production-ready Full-Stack web application for browsing movies, booking tickets, and managing theaters. Built with a robust **Node.js/Express** backend, a dynamic **React/Vite** frontend, and a highly structured **MySQL** database.

## 🌟 Key Features

### 👤 Role-Based Access Control
The application supports three distinct user roles, each with custom dashboards and capabilities:
- **Customers**: Browse latest movies (via TMDB API logic), select specific seats, apply gift cards, securely checkout, and receive PDF E-Tickets via Email.
- **Theater Owners**: Manage their own theaters, add new screens, schedule shows, and view comprehensive revenue dashboards. *Cross-theater management is strictly forbidden.*
- **System Admins**: Oversee the entire platform, manage user roles, resolve disputes, and generate & manage platform-wide Gift Cards.

### 🎥 Dynamic Movie & Show Management
- **TMDB Integration**: Includes scripts to query the live TMDB (The Movie Database) API to seed the database with real, current movies.
- **Show Scheduling Validation**: Built-in backend validation prevents conflicting/overlapping shows on the same screen by calculating TMDB movie runtimes dynamically.
- **Dynamic Seat Generation**: Instead of fixed arrays, seats are generated accurately according to the specific capacity of the targeted theater screen.

### 🎟️ Booking & Payment Engine
- **Atomic Transaction Integrity**: Employs SQL Transactions to guarantee that seats cannot be double-booked, handling simultaneous booking requests perfectly.
- **Real-Time Seat Locking**: Seats are temporarily "Reserved" for 10 minutes when a user enters the checkout phase. A background cron job automatically releases expired reservations.
- **Gift Card Ecosystem**: Users can redeem gift cards. The system strictly enforces balance limits, deducting exact ticket costs and rolling over remaining balances.
- **Automated Refunds**: If a user cancels a booking (or a show is cancelled), the system automatically processes refunds directly back to the user's gift card balance.

### 📧 E-Ticketing System
- Generates high-quality PDF E-Tickets using `pdfkit`.
- E-Tickets feature dynamic QR Codes linking to the specific booking ID.
- Automatically dispatches these tickets asynchronously to the user's registered email using `nodemailer` (non-blocking for fast UI response).

---

## 🛠️ System Architecture & Tech Stack

**Frontend:**
- **React.js 19** (bootstrapped with **Vite** for blazing fast HMR).
- **Tailwind CSS v3.4** for highly responsive, modern, and aesthetic UI design.
- **React Router v7** for robust client-side navigation.
- **Lucide React** for beautiful, consistent iconography.
- **React Hot Toast** for elegant error and success popups.
- **Axios** for intercepting and handling API requests securely.

**Backend:**
- **Node.js** with **Express.js** framework.
- **JSON Web Tokens (JWT)** for stateless, secure authentication.
- **Bcrypt.js** for cryptographic password hashing.
- **Node-Cron** for background task execution (seat expiry).

**Database:**
- **MySQL / TiDB** - Relational logic is heavily utilized to enforce data constraints using Foreign Keys and Cascading Deletes. 
- Connected via the high-performance `mysql2` promise-based driver.

---

## 🚀 Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+ recommended)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (or a cloud instance like TiDB / Railway)

### 1. Database Setup
1. Open your MySQL client.
2. Execute the schema file: `database/schema.sql` to create the database and tables.
3. Execute the seed file: `database/seed.sql` to populate initial test data (Admin user, dummy movies, and theaters).

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend` folder (you can use `.env.example` if available) with the following structure:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=movie_booking
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   SEAT_RESERVE_MINUTES=10
   TMDB_API_KEY=your_tmdb_key_here
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The server will start on port 5000 and the Seat Expiry Cron Job will initialize.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Ensure you have a `.env.local` file pointing to the backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   *(Note: Vite proxies API requests automatically as configured in `vite.config.js`)*
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
movie-ticket-booking-system/
├── backend/
│   ├── api/                # Vercel serverless entrypoint
│   ├── scripts/            # TMDB Seeder & DB Migration scripts
│   ├── src/
│   │   ├── config/         # MySQL Connection Pool
│   │   ├── controllers/    # Business logic (Auth, Bookings, Shows, etc.)
│   │   ├── middleware/     # JWT Verification, Role Guards, Error Handler
│   │   ├── routes/         # Express Router endpoints
│   │   ├── services/       # E-Mail Transport & Seat Expiry Cron
│   │   ├── app.js          # Express initialization
│   │   └── server.js       # Node Server entrypoint
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI elements (Navbar, Modals, Forms)
│   │   ├── pages/          # Full page views (Home, Dashboard, Checkout)
│   │   ├── context/        # React Context (Auth State)
│   │   ├── utils/          # Formatting & helper functions
│   │   ├── index.css       # Tailwind entry directives
│   │   ├── main.jsx        # React DOM render entry
│   │   └── App.jsx         # Router & Layout configurations
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── database/
│   ├── schema.sql          # Full Database DDL
│   └── seed.sql            # Initial Mock Data DML
└── README.md
```

---

## 🔒 Security Measures
- **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using Bcrypt before database insertion.
- **Route Protection:** API endpoints are protected using JWT validation middleware. Unauthorized access to `/owner` or `/admin` routes throws a strictly typed 403 error.
- **Input Validation:** Backend validation prevents SQL injection and generic malicious payloads.
- **CORS Configuration:** Strictly controlled origin access pointing to specific frontend domains.

## 📜 Deployment
The application is pre-configured to be deployed natively:
- **Database**: Cloud MySQL (e.g. TiDB, Railway, Aiven).
- **Backend**: Render Web Service or Vercel Serverless.
- **Frontend**: Vercel Static deployment.
*(See the attached deployment walkthrough guide in the repository documentation).*
