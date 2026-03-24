/* ============================================================
   ParkNow — API Client  (replaces db.js)
   All data operations go through the Express/Supabase backend.
   Base URL auto-detects: same origin in production, localhost
   in development (change DEV_API_URL if your port differs).
   ============================================================ */

const DEV_API_URL = 'http://localhost:8000';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? DEV_API_URL
  : window.location.origin;

/* ─── Token storage ───────────────────────────────────────── */
const Token = {
  get:    ()      => localStorage.getItem('parknow_token'),
  set:    (t)     => localStorage.setItem('parknow_token', t),
  clear:  ()      => localStorage.removeItem('parknow_token'),
};

/* ─── Core fetch wrapper ──────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = Token.get();
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {})
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.detail || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ─── Auth API ────────────────────────────────────────────── */
const AuthAPI = {
  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    Token.set(data.token);
    return data.user;
  },

  async register({ first, last, email, password, vehicle, vtype }) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ first, last, email, password, vehicle, vtype }),
    });
    Token.set(data.token);
    return data.user;
  },

  logout() {
    Token.clear();
  },

  async me() {
    const data = await apiFetch('/api/auth/me');
    return data.user;
  },

  async forgotPassword(email) {
    return await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

/* ─── Slots API ───────────────────────────────────────────── */
const SlotsAPI = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await apiFetch('/api/slots' + (params ? '?' + params : ''));
    return data.slots;
  },

  async get(id) {
    const data = await apiFetch('/api/slots/' + id);
    return data.slot;
  },

  async updateStatus(id, status) {
    const data = await apiFetch('/api/slots/' + id, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return data.slot;
  },

  async getSummary() {
    const data = await apiFetch('/api/slots/stats/summary');
    return data;
  },
};

/* ─── Bookings API ────────────────────────────────────────── */
const BookingsAPI = {
  async getAll() {
    const data = await apiFetch('/api/bookings');
    return data.bookings;
  },

  async get(id) {
    const data = await apiFetch('/api/bookings/' + id);
    return data.booking;
  },

  async create({ slot_id, vehicle, vtype, date, time, dur, pay }) {
    const data = await apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ slot_id, vehicle, vtype, date, time, dur, pay }),
    });
    return data.booking;
  },

  async cancel(id) {
    const data = await apiFetch('/api/bookings/' + id + '/cancel', { method: 'PATCH' });
    return data.booking;
  },

  async extend(id, hours) {
    const data = await apiFetch('/api/bookings/' + id + '/extend?hours=' + hours, {
      method: 'POST'
    });
    return data.booking;
  },

  async getRevenue() {
    const data = await apiFetch('/api/bookings/stats/revenue');
    return data;
  },
};

/* ─── Users API ───────────────────────────────────────────── */
const UsersAPI = {
  async getAll() {
    const data = await apiFetch('/api/users');
    return data.users;
  },

  async update(id, fields) {
    const data = await apiFetch('/api/users/' + id, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
    return data.user;
  },
};

/* ─── Payments API (Razorpay) ─────────────────────────────── */
const PaymentsAPI = {
  async createOrder(booking_id) {
    return await apiFetch('/api/payments/create-order?booking_id=' + booking_id, {
      method: 'POST'
    });
  },

  async verify(data) {
    return await apiFetch('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

/* ─── Local state cache (mirrors old DB shape) ────────────── */
// These are populated on login/load and kept in sync.
const DB = {
  slots:    [],
  bookings: [],
  users:    [],
  nextBkId: 100, // Initialize to avoid BKNaN
};

// Keep COSTS and ZONE_NAMES for UI use
const COSTS      = { 1: 30, 2: 55, 3: 75, 4: 90, 8: 150, 24: 250 };
const ZONE_NAMES = {
  A: 'Ground Floor – Standard',
  B: 'Ground Floor – Compact',
  C: 'First Floor – Standard',
  D: 'First Floor – Premium',
};

/* ─── Bootstrap: load slots and session on page ready ──────── */
document.addEventListener('DOMContentLoaded', async () => {
  initFloatingGrid();

  // If token exists, try to restore session
  if (Token.get()) {
    try {
      const user = await AuthAPI.me();
      App.currentUser = user;
      // Load slots into local cache
      DB.slots = await SlotsAPI.getAll();
      afterLogin();
    } catch {
      Token.clear(); // expired/invalid – show login
    }
  }
});
