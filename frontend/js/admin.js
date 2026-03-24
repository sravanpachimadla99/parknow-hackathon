/* ============================================================
   ParkNow — Admin Dashboard Module  (Supabase-backed)
   ============================================================ */

async function showAdmin(sec) {
  document.querySelectorAll('[id^=asb-]').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('asb-' + sec);
  if (el) el.classList.add('active');

  const main = document.getElementById('adminMain');
  main.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--muted)">Loading…</div>`;

  try {
    if (sec === 'overview' || sec === 'slots')    DB.slots    = await SlotsAPI.getAll();
    if (sec === 'overview' || sec === 'bookings') DB.bookings = await BookingsAPI.getAll();
    if (sec === 'overview' || sec === 'users')    DB.users    = await UsersAPI.getAll();

    const map = { overview: aOverview, slots: aSlots, bookings: aBookings, users: aUsers };
    if (map[sec]) main.innerHTML = map[sec]();
  } catch (err) {
    main.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--danger)">Failed to load: ${err.message}</div>`;
  }
}

function mBar(label, val, total, color) {
  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
  return `<div style="margin-bottom:.9rem">
    <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:.3rem">
      <span>${label}</span><span style="color:${color}">${val} (${pct}%)</span>
    </div>
    <div style="height:6px;background:var(--border);border-radius:3px">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:3px"></div>
    </div></div>`;
}

function aOverview() {
  const total = DB.slots.length;
  const free  = DB.slots.filter(s => s.status === 'free').length;
  const occ   = DB.slots.filter(s => s.status === 'occupied').length;
  const res   = DB.slots.filter(s => s.status === 'reserved').length;
  const rev   = DB.bookings.filter(b => b.status !== 'cancelled').reduce((a, b) => a + b.cost, 0);
  const pct   = total > 0 ? Math.round(((total - free) / total) * 100) : 0;

  const summaryStats = [
    ['Total Bookings', DB.bookings.length, ''],
    ['Active Now',     DB.bookings.filter(b => b.status === 'active').length, 'var(--success)'],
    ['Users',          DB.users.length, ''],
    ['Cancelled',      DB.bookings.filter(b => b.status === 'cancelled').length, 'var(--danger)'],
  ].map(([l, v, c]) => `
    <div style="background:var(--surface2);border-radius:10px;padding:.9rem">
      <div style="color:var(--muted);font-size:.78rem">${l}</div>
      <div style="font-family:var(--font-display);font-size:1.7rem;font-weight:700${c?';color:'+c:''}">${v}</div>
    </div>`).join('');

  return `
    <div class="section-header">
      <div><div class="section-title">Admin Dashboard</div><div class="section-sub">Real-time parking overview</div></div>
      <button class="btn-primary" style="width:auto;padding:.6rem 1.4rem" onclick="showAdmin('overview')">🔄 Refresh</button>
    </div>
    <div class="stats-grid">
      <div class="stat-card cyan"><div class="stat-card-label">Total Slots</div><div class="stat-card-num">${total}</div></div>
      <div class="stat-card green"><div class="stat-card-label">Free</div><div class="stat-card-num">${free}</div></div>
      <div class="stat-card amber"><div class="stat-card-label">Occupancy</div><div class="stat-card-num">${pct}%</div></div>
      <div class="stat-card purple"><div class="stat-card-label">Revenue</div><div class="stat-card-num">₹${rev}</div></div>
    </div>
    <div class="admin-grid">
      <div class="admin-card">
        <div class="admin-card-title">📊 Slot Breakdown</div>
        ${mBar('Free',     free, total, 'var(--success)')}
        ${mBar('Occupied', occ,  total, 'var(--danger)')}
        ${mBar('Reserved', res,  total, 'var(--warning)')}
      </div>
      <div class="admin-card">
        <div class="admin-card-title">📋 Booking Stats</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem">${summaryStats}</div>
      </div>
    </div>`;
}

function aSlots() {
  let html = `
    <div class="section-header">
      <div><div class="section-title">Manage Slots</div><div class="section-sub">Click any slot to cycle its status</div></div>
    </div>
    <div class="parking-section">
      <div class="parking-legend">
        <div class="legend-item"><div class="legend-dot free"></div>Free</div>
        <div class="legend-item"><div class="legend-dot occupied"></div>Occupied</div>
        <div class="legend-item"><div class="legend-dot reserved"></div>Reserved</div>
      </div>
      <div class="parking-zones">`;

  ['A','B','C','D'].forEach(z => {
    const zSlots = DB.slots.filter(s => s.zone === z);
    html += `<div>
      <div class="zone-label">Zone ${z} — ${ZONE_NAMES[z]}</div>
      <div class="slot-row">
        ${zSlots.map(s => `
          <div class="slot ${s.status}" id="as-${s.id}" onclick="toggleSlot('${s.id}')">
            <div class="slot-id">${s.id}</div>
            <div class="slot-type">${s.type === 'bike' ? '🏍' : '🚗'}</div>
          </div>`).join('')}
      </div></div>`;
  });

  return html + `</div></div>`;
}

async function toggleSlot(id) {
  const slot = DB.slots.find(s => s.id === id);
  if (!slot) return;
  const cycle     = ['free','occupied','reserved'];
  const newStatus = cycle[(cycle.indexOf(slot.status) + 1) % 3];
  const el        = document.getElementById('as-' + id);
  if (el) el.className = `slot ${newStatus}`;   // optimistic
  try {
    await SlotsAPI.updateStatus(id, newStatus);
    slot.status = newStatus;
    toast(`Slot ${id} → ${newStatus}`, 'info');
  } catch (err) {
    if (el) el.className = `slot ${slot.status}`;
    toast('Update failed: ' + err.message, 'error');
  }
}

function aBookings() {
  const bks  = [...DB.bookings].reverse();
  const rows = bks.length
    ? bks.map(b => {
        const u      = b.users || {};
        const slotId = b.slot_id || b.slotId || '—';
        return `<tr>
          <td><b>${b.id}</b></td>
          <td><b style="color:var(--accent)">${slotId}</b></td>
          <td>${u.first||''} ${u.last||''}</td>
          <td>${b.vehicle}</td>
          <td>${b.date} ${b.time}</td>
          <td>${b.dur}h</td>
          <td style="text-transform:capitalize">${b.pay||'—'}</td>
          <td>₹${b.cost}</td>
          <td><span class="badge ${b.status}">${b.status}</span></td>
          <td>${b.status==='active'
            ? `<button class="btn-danger" onclick="adminCancel('${b.id}')">Cancel</button>`
            : '—'}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="10" style="text-align:center;color:var(--muted);padding:2rem">No bookings yet.</td></tr>`;

  return `
    <div class="section-header">
      <div><div class="section-title">All Bookings</div></div>
      <button class="btn-primary" style="width:auto;padding:.6rem 1.4rem" onclick="showAdmin('bookings')">🔄 Refresh</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Slot</th><th>User</th><th>Vehicle</th><th>Date/Time</th><th>Dur</th><th>Payment</th><th>Cost</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

async function adminCancel(id) {
  try {
    await BookingsAPI.cancel(id);
    const bk = DB.bookings.find(b => b.id === id);
    if (bk) {
      bk.status = 'cancelled';
      const sid  = bk.slot_id || bk.slotId;
      const slot = DB.slots.find(s => s.id === sid);
      if (slot) slot.status = 'free';
    }
    toast('Booking cancelled by admin.', 'info');
    showAdmin('bookings');
  } catch (err) {
    toast('Cancel failed: ' + err.message, 'error');
  }
}

function aUsers() {
  const rows = DB.users.map(u => {
    const n = DB.bookings.filter(b => b.user_id === u.id || b.userId === u.id).length;
    return `<tr>
      <td><div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem">${(u.first||'?')[0]}</div></td>
      <td>${u.first} ${u.last}</td>
      <td>${u.email}</td>
      <td>${u.vehicle}</td>
      <td style="text-transform:capitalize">${u.vtype}</td>
      <td><span class="badge ${u.role==='admin'?'pending':'active'}">${u.role}</span></td>
      <td>${n}</td>
    </tr>`;
  }).join('');

  return `
    <div class="section-header">
      <div><div class="section-title">Users</div><div class="section-sub">${DB.users.length} registered</div></div>
      <button class="btn-primary" style="width:auto;padding:.6rem 1.4rem" onclick="showAdmin('users')">🔄 Refresh</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th></th><th>Name</th><th>Email</th><th>Vehicle</th><th>Type</th><th>Role</th><th>Bookings</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}
