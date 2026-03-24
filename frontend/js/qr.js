/* ============================================================
   ParkNow — QR Code & Ticket Module
   Generates the QR code and renders the printable ticket
   shown in step 4 of the booking modal.
   ============================================================ */

function buildTicketQR(bk) {
  /* ---- QR payload (pipe-delimited key:value string) ---- */
  const payload = [
    'PARKNOW ENTRY TICKET',
    'ID:'       + bk.id,
    'SLOT:'     + bk.slotId,
    'VEHICLE:'  + bk.vehicle,
    'TYPE:'     + bk.vtype.toUpperCase(),
    'DATE:'     + bk.date,
    'ENTRY:'    + bk.time,
    'EXIT:'     + bk.endTime,
    'DURATION:' + bk.dur + 'H',
    'AMOUNT:RS' + bk.cost,
    'PAYMENT:'  + bk.pay.toUpperCase(),
    'STATUS:CONFIRMED',
  ].join('|');

  /* ---- Render QR code ---- */
  const qrEl = document.getElementById('qrcode');
  qrEl.innerHTML = '';

  try {
    new QRCode(qrEl, {
      text:         payload,
      width:        180,
      height:       180,
      colorDark:    '#000000',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  } catch (err) {
    /* Fallback: Make sure real slot details still render inside the HTML square if QR completely fails */
    qrEl.innerHTML = `
      <div style="width:180px;height:180px;background:#fff;display:flex;flex-direction:column;
                  align-items:center;justify-content:center;padding:12px;gap:6px">
        <div style="font-size:.65rem;color:#000;font-weight:700;text-align:center;
                    word-break:break-all;line-height:1.4">Booking: ${bk.id}</div>
        <div style="width:120px;height:120px;
                    background:repeating-conic-gradient(#000 0% 25%,#fff 0% 50%) 0 0/20px 20px;
                    opacity:.85"></div>
        <div style="font-size:.65rem;color:#333;font-weight:bold;text-align:center">Slot: ${bk.slotId}<br/>${bk.date} - ${bk.time}</div>
      </div>`;
  }

  /* ---- Ticket info grid ---- */
  document.getElementById('ticketGrid').innerHTML = `
    <div class="tf">
      <div class="tfl">Booking ID</div>
      <div class="tfv" style="color:var(--accent)">${bk.id}</div>
    </div>
    <div class="tf">
      <div class="tfl">Slot</div>
      <div class="tfv" style="color:var(--accent);font-size:1.1rem">${bk.slotId}</div>
    </div>
    <div class="tf">
      <div class="tfl">Vehicle</div>
      <div class="tfv">${bk.vehicle}</div>
    </div>
    <div class="tf">
      <div class="tfl">Type</div>
      <div class="tfv" style="text-transform:capitalize">${bk.vtype}</div>
    </div>
    <div class="tf">
      <div class="tfl">Date</div>
      <div class="tfv">${bk.date}</div>
    </div>
    <div class="tf">
      <div class="tfl">Duration</div>
      <div class="tfv">${bk.dur} Hour${bk.dur > 1 ? 's' : ''}</div>
    </div>
    <div class="tf">
      <div class="tfl">Entry Time</div>
      <div class="tfv" style="color:var(--success)">${bk.time}</div>
    </div>
    <div class="tf">
      <div class="tfl">Exit Time</div>
      <div class="tfv" style="color:var(--warning)">${bk.endTime}</div>
    </div>
    <div class="tf" style="grid-column:span 2">
      <div class="tfl">Payment</div>
      <div class="tfv" style="display:flex;justify-content:space-between;align-items:center">
        <span style="text-transform:capitalize">${bk.pay}</span>
        <span style="color:var(--success);font-family:var(--font-display)">₹${bk.cost} PAID ✓</span>
      </div>
    </div>`;

  /* ---- Ticket footer ---- */
  const zName = bk.zone_name || bk.zoneName || 'Standard Zone';
  document.getElementById('ticketFoot').textContent =
    `Zone ${bk.slotId ? bk.slotId[0] : '?'} · ${zName} · Valid ${bk.time} – ${bk.endTime}`;

  /* ---- Build Navigation Route ---- */
  buildNavRoute(bk);
}

/* ---- Hold Ticket for Cash Payments (no QR until paid) ---- */
function buildHoldTicket(bk) {
  /* Show a clock/hold icon instead of a QR code */
  const qrEl = document.getElementById('qrcode');
  qrEl.innerHTML = `
    <div style="width:180px;height:180px;background:rgba(255,200,50,.1);border:2px dashed #f5a623;
                border-radius:12px;display:flex;flex-direction:column;
                align-items:center;justify-content:center;gap:8px">
      <div style="font-size:3rem">⏳</div>
      <div style="font-size:.75rem;font-weight:700;color:#f5a623;text-align:center;line-height:1.4">
        PAYMENT PENDING<br/>QR after cash payment
      </div>
    </div>`;

  /* Ticket info — same as normal but payment shows HOLD */
  document.getElementById('ticketGrid').innerHTML = `
    <div class="tf">
      <div class="tfl">Booking ID</div>
      <div class="tfv" style="color:var(--accent)">${bk.id}</div>
    </div>
    <div class="tf">
      <div class="tfl">Slot</div>
      <div class="tfv" style="color:var(--accent);font-size:1.1rem">${bk.slotId}</div>
    </div>
    <div class="tf">
      <div class="tfl">Vehicle</div>
      <div class="tfv">${bk.vehicle}</div>
    </div>
    <div class="tf">
      <div class="tfl">Type</div>
      <div class="tfv" style="text-transform:capitalize">${bk.vtype}</div>
    </div>
    <div class="tf">
      <div class="tfl">Date</div>
      <div class="tfv">${bk.date}</div>
    </div>
    <div class="tf">
      <div class="tfl">Duration</div>
      <div class="tfv">${bk.dur} Hour${bk.dur > 1 ? 's' : ''}</div>
    </div>
    <div class="tf">
      <div class="tfl">Entry Time</div>
      <div class="tfv" style="color:var(--success)">${bk.time}</div>
    </div>
    <div class="tf">
      <div class="tfl">Exit Time</div>
      <div class="tfv" style="color:var(--warning)">${bk.endTime}</div>
    </div>
    <div class="tf" style="grid-column:span 2">
      <div class="tfl">Payment</div>
      <div class="tfv" style="display:flex;justify-content:space-between;align-items:center">
        <span>Cash at Gate</span>
        <span style="color:#f5a623;font-family:var(--font-display);font-size:.85rem">₹${bk.cost} — ON HOLD ⏳</span>
      </div>
    </div>`;

  /* Footer */
  document.getElementById('ticketFoot').textContent =
    `⚠️ Slot reserved • Pay ₹${bk.cost} cash at the gate to activate QR entry`;

  buildNavRoute(bk);
}

function buildNavRoute(bk) {
  const mapEl = document.getElementById('navMap');
  if (!bk.slotId) return;
  const zone = bk.slotId[0].toUpperCase();
  
  let steps = '';
  if (zone === 'A') {
    steps = `
      <div class="nav-step">Enter the Main Gate and pass the security checkpoint.</div>
      <div class="nav-step">Proceed straight towards the <span class="nav-step-hl">Ground Floor</span> parking area.</div>
      <div class="nav-step">Turn <span class="nav-step-hl">Left</span> into the Standard Zone.</div>
      <div class="nav-step">Your slot <span class="nav-step-hl">${bk.slotId}</span> is on the Right.</div>
    `;
  } else if (zone === 'B') {
    steps = `
      <div class="nav-step">Enter the Main Gate and pass the security checkpoint.</div>
      <div class="nav-step">Keep <span class="nav-step-hl">Right</span> towards the Compact/Two-Wheeler section.</div>
      <div class="nav-step">Enter the Ground Floor Zone B area.</div>
      <div class="nav-step">Your slot <span class="nav-step-hl">${bk.slotId}</span> is straight ahead.</div>
    `;
  } else if (zone === 'C') {
    steps = `
      <div class="nav-step">Enter the Main Gate and pass the security checkpoint.</div>
      <div class="nav-step">Take the main ramp up to the <span class="nav-step-hl">First Floor</span>.</div>
      <div class="nav-step">Turn <span class="nav-step-hl">Left</span> into the Standard parking bays.</div>
      <div class="nav-step">Your slot <span class="nav-step-hl">${bk.slotId}</span> is clearly marked on the pillar.</div>
    `;
  } else if (zone === 'D') {
    steps = `
      <div class="nav-step">Enter the VIP/Premium Gate located on the East wing.</div>
      <div class="nav-step">Take the direct ramp up to the <span class="nav-step-hl">First Floor Premium</span> section.</div>
      <div class="nav-step">Follow the guided LED lights on the floor.</div>
      <div class="nav-step">Your premium slot <span class="nav-step-hl">${bk.slotId}</span> is ready.</div>
    `;
  } else {
    steps = `
      <div class="nav-step">Enter the Main Gate.</div>
      <div class="nav-step">Follow the signs for Zone ${zone}.</div>
      <div class="nav-step">Locate slot <span class="nav-step-hl">${bk.slotId}</span>.</div>
    `;
  }

  mapEl.innerHTML = `
    <div class="nav-map-title">🧭 Live Navigation to ${bk.slotId}</div>
    <div class="nav-steps">${steps}</div>
  `;
  
  // Reset visibility state
  mapEl.style.display = 'none';
  const btn = document.querySelector('button[onclick="toggleNav()"]');
  if(btn) btn.innerHTML = '🧭 Route to Slot';
}

function toggleNav() {
  const mapEl = document.getElementById('navMap');
  const btn = document.querySelector('button[onclick="toggleNav()"]');
  if (!mapEl) return;
  
  if (mapEl.style.display === 'none') {
    mapEl.style.display = 'block';
    if(btn) btn.innerHTML = '✕ Hide Route';
  } else {
    mapEl.style.display = 'none';
    if(btn) btn.innerHTML = '🧭 Route to Slot';
  }
}
