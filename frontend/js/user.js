/* ============================================================
   ParkNow — User Dashboard Module
   Renders: overview, book, bookings, profile sections.
   ============================================================ */

async function showUser(sec) {
  /* Highlight sidebar item */
  document.querySelectorAll('[id^=sb-]').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('sb-' + sec);
  if (el) el.classList.add('active');

  /* Refresh bookings from API for relevant sections */
  if (sec === 'bookings' || sec === 'overview') {
    try {
      DB.bookings = await BookingsAPI.getAll();
    } catch { /* use cached */ }
  }

  const main = document.getElementById('userMain');
  const map  = { overview: uOverview, book: uBook, bookings: uBookings, profile: uProfile };
  if (map[sec]) main.innerHTML = map[sec]();
}

/* ---- Overview ---- */
function uOverview() {
  const u    = App.currentUser;
  const bks  = DB.bookings.filter(b => b.userId === u.id);
  const active = bks.filter(b => b.status === 'active');
  const free   = DB.slots.filter(s => s.status === 'free').length;
  const spent  = bks.filter(b => b.status !== 'cancelled').reduce((a, b) => a + b.cost, 0);

  const activeCard = active.length
    ? `<div class="parking-section">
        <div class="admin-card-title" style="margin-bottom:.9rem">🟢 Active Booking</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem">
          ${[
            ['Slot',     active[0].slotId,   'accent'],
            ['Vehicle',  active[0].vehicle,  ''],
            ['Date',     active[0].date,     ''],
            ['Entry',    active[0].time,     'success'],
            ['Duration', active[0].dur + 'h',''],
            ['Cost',     '₹' + active[0].cost,'warning'],
          ].map(([l, v, c]) => `
            <div style="background:var(--surface2);border-radius:10px;padding:.9rem">
              <div style="color:var(--muted);font-size:.72rem;text-transform:uppercase">${l}</div>
              <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;margin-top:.2rem${c ? ';color:var(--' + c + ')' : ''}">${v}</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:1rem;display:flex;gap:.8rem">
          <button class="btn-primary" style="width:auto" onclick="extendBk('${active[0].id}')">⌛ Extend Time</button>
          <button class="btn-danger" onclick="cancelBk('${active[0].id}')">Cancel Booking</button>
        </div>
      </div>`
    : `<div class="parking-section" style="text-align:center;padding:3rem">
        <div style="font-size:3rem;margin-bottom:1rem">🅿️</div>
        <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;margin-bottom:.5rem">No active booking</div>
        <div style="color:var(--muted);margin-bottom:1.5rem">Book a parking slot to get started</div>
        <button class="btn-primary" style="width:auto;padding:.8rem 2rem" onclick="showUser('book')">Book a Slot →</button>
      </div>`;

  return `
    <div class="section-header">
      <div>
        <div class="section-title">Welcome, ${u.first}! 👋</div>
        <div class="section-sub">Your parking overview</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card cyan"><div class="stat-card-label">Available Slots</div><div class="stat-card-num">${free}</div></div>
      <div class="stat-card green"><div class="stat-card-label">Active</div><div class="stat-card-num">${active.length}</div></div>
      <div class="stat-card purple"><div class="stat-card-label">Total Bookings</div><div class="stat-card-num">${bks.length}</div></div>
      <div class="stat-card amber"><div class="stat-card-label">Total Spent</div><div class="stat-card-num">₹${spent}</div></div>
    </div>
    ${activeCard}`;
}

/* ---- Book slot (parking grid) ---- */
function uBook() {
  let html = `
    <div class="section-header">
      <div>
        <div class="section-title">Book a Parking Slot</div>
        <div class="section-sub">Click any green slot to start booking</div>
      </div>
    </div>
    <div class="parking-section">
      <div class="parking-legend">
        <div class="legend-item"><div class="legend-dot free"></div>Available (click to book)</div>
        <div class="legend-item"><div class="legend-dot occupied"></div>Occupied</div>
        <div class="legend-item"><div class="legend-dot reserved"></div>Reserved</div>
      </div>
      <div class="parking-zones">`;

  ['A', 'B', 'C', 'D'].forEach(z => {
    const zSlots = DB.slots.filter(s => s.zone === z);
    const free   = zSlots.filter(s => s.status === 'free').length;
    html += `
      <div>
        <div class="zone-label">Zone ${z} — ${ZONE_NAMES[z]} <span>${free} free</span></div>
        <div class="slot-row">
          ${zSlots.map(s => `
            <div class="slot ${s.status}" id="slot-${s.id}" onclick="pickSlot('${s.id}')">
              <div class="slot-id">${s.id}</div>
              <div class="slot-type">${s.type === 'bike' ? '🏍' : '🚗'}</div>
            </div>`).join('')}
        </div>
      </div>`;
  });

  return html + `</div></div>`;
}

/* ---- My Bookings ---- */
function uBookings() {
  const bks  = [...(DB.bookings || [])].reverse();
  const rows = bks.length
    ? bks.map(b => `
        <tr>
          <td><b style="font-family:var(--font-display)">${b.id}</b></td>
          <td><b style="color:var(--accent)">${b.slot_id || b.slotId}</b></td>
          <td>${b.vehicle}</td>
          <td>${b.date}</td>
          <td>${b.time} · ${b.dur}h</td>
          <td style="text-transform:capitalize">${b.pay}</td>
          <td><b>₹${b.cost}</b></td>
          <td><span class="badge ${b.status}">${b.status}</span></td>
          <td>${b.status === 'active'
              ? `<button class="btn-primary" style="padding:.3rem .6rem;font-size:.75rem;margin-right:.4rem" onclick="extendBk('${b.id}')">Extend</button>
                 <button class="btn-danger" style="padding:.3rem .6rem;font-size:.75rem" onclick="cancelBk('${b.id}')">Cancel</button>`
              : '—'}</td>
        </tr>`).join('')
    : `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2.5rem">
         No bookings yet.
         <a href="#" onclick="showUser('book')" style="color:var(--accent)">Book your first slot →</a>
       </td></tr>`;

  return `
    <div class="section-header">
      <div><div class="section-title">My Bookings</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Slot</th><th>Vehicle</th><th>Date</th>
            <th>Time</th><th>Payment</th><th>Cost</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ---- Profile ---- */
function uProfile() {
  const u = App.currentUser;
  return `
    <div class="section-header"><div><div class="section-title">Profile</div></div></div>
    <div class="profile-grid">
      <div class="profile-card">
        <div class="avatar">${u.first[0]}</div>
        <div style="font-family:var(--font-display);font-size:1.15rem;font-weight:700">${u.first} ${u.last}</div>
        <div style="color:var(--muted);font-size:.85rem;margin:.3rem 0 1rem">${u.email}</div>
        <span class="badge active">${u.role}</span>
        <div style="margin-top:1.5rem;text-align:left">
          <div style="color:var(--muted);font-size:.8rem;text-transform:uppercase;margin-bottom:.4rem">Vehicle</div>
          <div style="font-weight:600">${u.vehicle}</div>
          <div style="color:var(--muted);font-size:.82rem;margin-top:.2rem;text-transform:capitalize">${u.vtype}</div>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">✏️ Edit Profile</div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">First Name</label><input class="form-input" id="pfFirst" value="${u.first}"></div>
          <div class="form-group"><label class="form-label">Last Name</label><input class="form-input" id="pfLast" value="${u.last}"></div>
        </div>
        <div class="form-group"><label class="form-label">Vehicle Number</label><input class="form-input" id="pfVeh" value="${u.vehicle}"></div>
        <div class="form-group">
          <label class="form-label">Vehicle Type</label>
          <select class="form-input" id="pfVType">
            <option value="car"  ${u.vtype === 'car'  ? 'selected' : ''}>🚗 Car</option>
            <option value="bike" ${u.vtype === 'bike' ? 'selected' : ''}>🏍️ Bike</option>
            <option value="suv"  ${u.vtype === 'suv'  ? 'selected' : ''}>🚙 SUV</option>
          </select>
        </div>
        <button class="btn-primary" style="width:auto;padding:.7rem 1.5rem" onclick="saveProfile()">Save Changes</button>
      </div>
    </div>`;
}

function saveProfile() {
  const u = App.currentUser;
  u.first   = document.getElementById('pfFirst').value.trim() || u.first;
  u.last    = document.getElementById('pfLast').value.trim()  || u.last;
  u.vehicle = document.getElementById('pfVeh').value.trim()   || u.vehicle;
  u.vtype   = document.getElementById('pfVType').value;
  document.getElementById('userBadgeName').textContent = u.first;
  toast('Profile updated!', 'success');
  showUser('profile');
}

async function cancelBk(id) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  try {
    await BookingsAPI.cancel(id);
    // Update local cache
    const bk = DB.bookings.find(b => (b.id === id || b.id === id));
    if (bk) {
      bk.status = 'cancelled';
      const slotId = bk.slot_id || bk.slotId;
      const slot = DB.slots.find(s => s.id === slotId);
      if (slot) slot.status = 'free';
    }
    toast('Booking cancelled.', 'info');
    showUser('overview');
  } catch (err) {
    toast('Cancel failed: ' + err.message, 'error');
  }
}

async function extendBk(id) {
  const hours = prompt('How many additional hours would you like to add? (1-4)', '1');
  if (!hours) return;
  const h = parseInt(hours);
  if (isNaN(h) || h < 1 || h > 4) {
    toast('Please enter a number between 1 and 4.', 'error');
    return;
  }

  try {
    const updated = await BookingsAPI.extend(id, h);
    // Update cache
    const idx = DB.bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      DB.bookings[idx] = { ...DB.bookings[idx], ...updated };
    }
    toast(`Booking extended by ${h} hour(s)!`, 'success');
    showUser('overview');
  } catch (err) {
    toast('Extension failed: ' + err.message, 'error');
  }
}
