/* ============================================================
   ParkNow — Payment Module
   Handles method selection, field validation,
   and simulated payment processing animation.
   ============================================================ */

/* ---- Select payment method ---- */
function pickPay(method) {
  App.selectedPayment = method;

  ['upi', 'card', 'wallet', 'netbanking', 'qr'].forEach(m => {
    const btn = document.getElementById('pm-' + m);
    if (btn) btn.classList.toggle('selected', m === method);
    const fields = document.getElementById(m + '-f');
    if (fields) fields.style.display = m === method ? 'block' : 'none';
  });

  if (method === 'qr') {
    const dur  = parseInt(document.getElementById('bkDur').value) || 8;
    const cost = COSTS[dur] || 30;
    document.getElementById('qr-cost-val').textContent = '₹' + cost;
    generatePaymentQR(cost);
  }
}

function generatePaymentQR(amount) {
  const qrEl = document.getElementById('payment-qr');
  qrEl.innerHTML = '';
  const upiId = "9493491591@ybl";
  const name  = "PACHIMADLA SRAVAN KUMAR";
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
  
  new QRCode(qrEl, {
    text: upiUri,
    width: 200,
    height: 200,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

/* ---- Card number auto-formatter ---- */
function fmtCard(el) {
  const raw = el.value.replace(/\D/g, '').substring(0, 16);
  el.value  = raw.replace(/(.{4})/g, '$1 ').trim();
}

/* ---- Helper to update processing text ---- */
function setText(text, sub) {
  const t = document.getElementById('procText');
  const s = document.getElementById('procSub');
  if (t) t.textContent = text;
  if (s) s.textContent = sub;
}

/* ---- Validate & trigger payment ---- */
function processPayment() {
  const errEl = document.getElementById('payError');
  errEl.textContent = '';

  /* Field validation per method */
  if (App.selectedPayment === 'upi') {
    const upi = document.getElementById('upiId').value.trim();
    if (!upi.includes('@')) {
      errEl.textContent = 'Enter a valid UPI ID (e.g. name@gpay).';
      return;
    }
  } else if (App.selectedPayment === 'card') {
    const card = document.getElementById('payCardNum').value.replace(/\s/g, '');
    const exp  = document.getElementById('payCardExp').value;
    const cvv  = document.getElementById('payCardCvv').value;
    if (card.length < 16) { errEl.textContent = 'Invalid card number.'; return; }
    if (!exp.includes('/')) { errEl.textContent = 'Invalid expiry.'; return; }
    if (cvv.length < 3)   { errEl.textContent = 'Invalid CVV.'; return; }
  }
  /* wallet & cash need no extra validation */

  /* Build pending booking object */
  const dur  = parseInt(document.getElementById('bkDur').value) || 8;
  const date = document.getElementById('bkDate').value;
  const time = document.getElementById('bkTime').value;

  const [hh, mm] = time.split(':').map(Number);
  const endH     = (hh + dur) % 24;
  const endTime  = endH.toString().padStart(2, '0') + ':' + mm.toString().padStart(2, '0');

  App.pendingBooking = {
    id:       'BK' + String(DB.nextBkId++).padStart(4, '0'),
    userId:   App.currentUser.id,
    slotId:   App.selectedSlot.id,
    zone_name: App.selectedSlot.zone_name || App.selectedSlot.zoneName || 'Main Zone',
    vehicle:  document.getElementById('bkVeh').value.trim(),
    vtype:    document.getElementById('bkType').value,
    date, time, endTime, dur,
    cost:     COSTS[dur] || 30,
    pay:      App.selectedPayment,
    status:   'active',
  };

  console.log('Pending Booking Created:', App.pendingBooking);

  /* Move to processing step */
  toStep(3);
  runProcessingAnimation();
}



/* ---- Simulate network / gateway stages ---- */
function runProcessingAnimation() {
  setTimeout(() => setText(
    'Verifying Payment...',
    'Contacting ' + (App.selectedPayment === 'qr' ? 'UPI' : App.selectedPayment.toUpperCase()) + ' gateway'
  ), 700);

  setTimeout(() => setText(
    'Reserving Slot ' + App.selectedSlot.id + '...',
    'Locking your parking space'
  ), 1700);

  setTimeout(() => setText(
    'Generating QR Ticket...',
    'Almost done!'
  ), 2600);

  setTimeout(async () => {
    try {
      setText('Confirming Booking...', 'Saving details to server');
      const saved = await commitBooking(App.pendingBooking);
      
      // Update our pending object with real server data
      const finalBooking = { ...App.pendingBooking, ...saved };
      
      buildTicketQR(finalBooking);
      toStep(4);
      toast('Booking confirmed! 🎉', 'success');
    } catch (err) {
      console.error('Final Booking Step Failed:', err);
      toast('Booking failed: ' + err.message, 'error');
      toStep(2);
    }
  }, 3500);
}
