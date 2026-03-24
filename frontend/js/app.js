/* ============================================================
   ParkNow — App Core
   Global state object, toast notifications, and init.
   ============================================================ */

/* ---- Global state (single source of truth) ---- */
const App = {
  currentUser:    null,   // Logged-in user object
  selectedSlot:   null,   // Slot chosen in booking flow
  selectedPayment: 'upi', // Active payment method
  pendingBooking: null,   // Booking being constructed
};

/* ---- Toast notification ---- */
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el    = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || '•'}</span><span>${msg}</span>`;
  document.getElementById('toastCont').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ---- Floating parking grid (auth hero animation) ---- */
function initFloatingGrid() {
  const grid   = document.getElementById('floatingGrid');
  if (!grid) return;
  const states = ['free', 'free', 'free', 'occupied', 'reserved'];
  for (let i = 0; i < 20; i++) {
    const cell = document.createElement('div');
    cell.className        = 'fgrid-cell ' + states[Math.floor(Math.random() * states.length)];
    cell.style.animationDelay = Math.random() * 3 + 's';
    grid.appendChild(cell);
  }
}

/* ---- Boot ---- */
/* Session restore + floating grid are handled in api.js DOMContentLoaded */
