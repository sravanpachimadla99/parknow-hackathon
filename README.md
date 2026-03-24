# 🅿️ ParkNow — Smart Parking Slot Booking System

> Hackathon submission — full-stack parking management with real-time slot booking,
> MySQL persistence, JWT auth, and QR ticket generation.

---

## 📁 Project Structure

```
parknow-hackathon/
│
├── frontend/                   ← Vanilla HTML/CSS/JS frontend
│   ├── index.html
│   ├── css/
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   └── modal.css
│   └── js/
│       ├── api.js              ← API client (JWT + fetch wrapper)
│       ├── app.js              ← Global App state & toast
│       ├── auth.js             ← Login, register, logout
│       ├── user.js             ← User dashboard
│       ├── admin.js            ← Admin dashboard
│       ├── booking.js          ← Slot selection & booking flow
│       ├── payment.js          ← Payment & processing animation
│       └── qr.js               ← QR code + printable ticket
│
├── backend/
│   ├── server.js               ← Express app entry point
│   ├── config/
│   │   ├── db.js               ← MySQL connection pool (mysql2)
│   │   └── schema.sql          ← Run once to create tables + seed slots
│   ├── middleware/
│   │   ├── auth.js             ← JWT verify + requireAdmin guard
│   │   └── errorHandler.js     ← Global error handler
│   └── routes/
│       ├── auth.js             ← POST /register, /login, GET /me
│       ├── slots.js            ← GET/PATCH slots + stats
│       ├── bookings.js         ← GET/POST/PATCH bookings (transactions)
│       └── users.js            ← GET/PATCH/DELETE users
│
├── docs/
│   └── API.md                  ← Full REST API reference
│
├── package.json
└── .env.example
```

---

## 🚀 Setup & Run

### 1. MySQL Setup

```bash
# Log into MySQL
mysql -u root -p

# Create database and run schema
mysql -u root -p < backend/config/schema.sql
```

That's it — the schema file creates the `parknow` database, all tables, indexes,
and seeds all 48 parking slots automatically.

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=parknow
JWT_SECRET=generate_a_64_char_random_string
```

### 3. Install & Run

```bash
npm install
npm run dev      # development (auto-restart)
npm start        # production
```

Open **http://localhost:3000** — the server serves both API and frontend.

---

## 🔑 Environment Variables

| Variable       | Description                          | Default     |
|----------------|--------------------------------------|-------------|
| `PORT`         | Server port                          | `3000`      |
| `DB_HOST`      | MySQL host                           | `localhost` |
| `DB_PORT`      | MySQL port                           | `3306`      |
| `DB_USER`      | MySQL username                       | —           |
| `DB_PASSWORD`  | MySQL password                       | —           |
| `DB_NAME`      | MySQL database name                  | `parknow`   |
| `JWT_SECRET`   | Secret for signing JWTs (64+ chars)  | —           |
| `JWT_EXPIRES_IN` | Token lifetime                     | `7d`        |
| `FRONTEND_ORIGIN` | CORS allowed origin               | `*`         |

---

## ✨ Features

### User
- JWT login / register (bcrypt passwords)
- Persistent session via localStorage token
- Interactive 48-slot parking grid (4 zones)
- 4-step booking modal → payment → QR ticket
- Booking history + cancellation

### Admin
- Live dashboard (slots, revenue, bookings, users — from MySQL)
- Click-to-cycle slot status (DB transaction)
- Cancel any booking
- Full user list

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, ES6 JS |
| Backend | Node.js + Express 4 |
| Database | **MySQL** (via mysql2 pool) |
| Auth | bcryptjs + jsonwebtoken (JWT) |
| Security | helmet, express-rate-limit, CORS |
| QR Code | QRCodeJS |

---

## 🗄️ Database Tables

```
users     — id (UUID), first, last, email, password(bcrypt), vehicle, vtype, role
slots     — id (A1–D12), zone, zone_name, type, status
bookings  — id (BK0001…), user_id→users, slot_id→slots, date, time, end_time, dur, cost, pay, status
```

Bookings use **MySQL transactions with row-level locking** (`SELECT … FOR UPDATE`)
to prevent double-booking race conditions.

---

## 📡 API Endpoints

See `docs/API.md` for full reference.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login → JWT |
| GET | /api/auth/me | 🔒 | Current user |
| GET | /api/slots | — | All 48 slots |
| PATCH | /api/slots/:id | 🔒 Admin | Update slot status |
| GET | /api/bookings | 🔒 | My / all bookings |
| POST | /api/bookings | 🔒 | Create booking |
| PATCH | /api/bookings/:id/cancel | 🔒 | Cancel booking |
| GET | /api/users | 🔒 Admin | All users |
| PATCH | /api/users/:id | 🔒 | Update profile |
