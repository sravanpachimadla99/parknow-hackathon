/* ============================================================
   ParkNow — Booking Flow Module
   Handles slot selection, modal step navigation, and
   booking creation after payment success.
   ============================================================ */

/* ---- Slot click ---- */
function pickSlot(id) {
  const slot = DB.slots.find(s => s.id === id);
  if (!slot || slot.status !== 'free') {
    toast('This slot is not available.', 'error');
    return;
  }

  App.selectedSlot = slot;

  /* Reset modal to step 1 */
  toStep(1, true);

  /* Pre-fill form */
  document.getElementById('ms-slot').textContent = id;
  document.getElementById('bkVeh').value  = App.currentUser.vehicle;
  document.getElementById('bkType').value = App.currentUser.vtype;
  document.getElementById('bkDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('bkTime').value = '09:00';
  document.getElementById('bkDur').value  = '8';
  refreshPreview();

  /* Reset payment tab */
  pickPay('upi');
  document.getElementById('bookModal').classList.add('open');
}

/* ---- Cost preview (step 1) ---- */
function refreshPreview() {
  if (!App.selectedSlot) return;
  const dur  = parseInt(document.getElementById('bkDur').value) || 8;
  const cost = COSTS[dur] || 30;
  document.getElementById('pv-slot').textContent = App.selectedSlot.id;
  document.getElementById('pv-zone').textContent = App.selectedSlot.zoneName;
  document.getElementById('pv-dur').textContent  = dur + (dur === 1 ? ' Hour' : ' Hours');
  document.getElementById('pv-cost').textContent = '₹' + cost;
  document.getElementById('pay-total').textContent = '₹' + cost;
}

/* ---- Step navigation ---- */
function toStep(n, silent = false) {
  /* Validate before leaving step 1 */
  if (n === 2 && !silent) {
    const veh  = document.getElementById('bkVeh').value.trim();
    const date = document.getElementById('bkDate').value;
    const time = document.getElementById('bkTime').value;
    if (!veh)  { toast('Please enter vehicle number.', 'error'); return; }
    if (!date) { toast('Please select a date.', 'error');        return; }
    if (!time) { toast('Please select start time.', 'error');    return; }
  }

  /* Show correct step pane */
  document.querySelectorAll('.modal-step').forEach((el, i) =>
    el.classList.toggle('active', i === n - 1)
  );
  updateStepBar(n);
}

/* ---- Step indicator ---- */
function updateStepBar(active) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('si' + i);
    el.classList.remove('active', 'done');
    if (i < active)      el.classList.add('done');
    else if (i === active) el.classList.add('active');
  }
}

/* ---- Commit a booking via API (called from payment.js after success) ---- */
async function commitBooking(bk) {
  try {
    const saved = await BookingsAPI.create({
      slot_id: bk.slotId,
      vehicle: bk.vehicle,
      vtype:   bk.vtype,
      date:    bk.date,
      time:    bk.time,
      dur:     bk.dur,
      pay:     bk.pay,
    });
    // Merge server-returned id back into bk for QR generation
    Object.assign(bk, { id: saved.id });
    // Update local slot cache
    const slot = DB.slots.find(s => s.id === bk.slotId);
    if (slot) slot.status = 'reserved';
    const slotEl = document.getElementById('slot-' + bk.slotId);
    if (slotEl) slotEl.className = 'slot reserved';
  } catch (err) {
    toast('Booking save failed: ' + err.message, 'error');
    throw err;
  }
}

/* ---- Close modal ---- */
function closeModal() {
  document.getElementById('bookModal').classList.remove('open');
  App.selectedSlot = null;
  App.pendingBooking = null;
}

function goBookings() {
  closeModal();
  showUser('bookings');
}
