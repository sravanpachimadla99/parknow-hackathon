/* ============================================================
   ParkNow — Authentication Module  (Supabase-backed)
   ============================================================ */

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((el, i) =>
    el.classList.toggle('active', tab === 'login' ? i === 0 : i === 1)
  );
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('registerForm').classList.toggle('active', tab === 'register');
}

/* Login */
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  const btn   = document.querySelector('#loginForm .btn-primary');
  errEl.textContent = '';

  if (!email || !pass) { errEl.textContent = 'Email and password are required.'; return; }

  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const user = await AuthAPI.login(email, pass);
    App.currentUser = user;
    DB.slots = await SlotsAPI.getAll();
    afterLogin();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid email or password.';
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

/* Register */
async function doRegister() {
  const first   = document.getElementById('regFirst').value.trim();
  const last    = document.getElementById('regLast').value.trim();
  const email   = document.getElementById('regEmail').value.trim();
  const phone   = document.getElementById('regPhone').value.trim();
  const vehicle = document.getElementById('regVehicle').value.trim();
  const vtype   = document.getElementById('regVType').value;
  const pass    = document.getElementById('regPass').value;

  const errEl = document.getElementById('regError');
  const sucEl = document.getElementById('regSuccess');
  const btn   = document.querySelector('#registerForm .btn-primary');
  errEl.textContent = ''; sucEl.textContent = '';

  if (!first || !last || !email || !phone || !vehicle || !pass) {
    errEl.textContent = 'All fields are required.'; return;
  }

  btn.disabled = true; btn.textContent = 'Creating account…';
  try {
    await AuthAPI.register({ first, last, email, phone, password: pass, vehicle, vtype });
    sucEl.textContent = 'Account created! You can now sign in.';
    setTimeout(() => {
      switchTab('login');
      document.getElementById('loginEmail').value = email;
    }, 1600);
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed.';
  } finally {
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

/* Post-login routing */
function afterLogin() {
  const u = App.currentUser;
  document.getElementById('authPage').classList.remove('active');
  document.getElementById('mainNav').style.display = 'flex';
  document.getElementById('userBadgeName').textContent = u.first;

  if (u.role === 'admin') {
    document.getElementById('adminDash').classList.add('active');
    document.getElementById('navLinks').innerHTML = `
      <button class="nav-btn active" onclick="showAdmin('overview')">📊 Dashboard</button>
      <button class="nav-btn" onclick="showAdmin('slots')">🗺️ Slots</button>
      <button class="nav-btn" onclick="showAdmin('bookings')">📋 Bookings</button>`;
    showAdmin('overview');
  } else {
    document.getElementById('userDash').classList.add('active');
    document.getElementById('navLinks').innerHTML = `
      <button class="nav-btn active" onclick="showUser('book')">🅿️ Book Slot</button>
      <button class="nav-btn" onclick="showUser('bookings')">📋 My Bookings</button>`;
    showUser('overview');
  }
}

/* Logout */
function logout() {
  AuthAPI.logout();
  App.currentUser = null;
  DB.slots = []; DB.bookings = []; DB.users = [];
  document.getElementById('mainNav').style.display = 'none';
  ['userDash', 'adminDash'].forEach(id =>
    document.getElementById(id).classList.remove('active')
  );
  document.getElementById('authPage').classList.add('active');
  toast('Signed out successfully.', 'info');
}

/* Forgot Password Functions */
function openForgotModal() {
  document.getElementById('forgotEmail').value = '';
  document.getElementById('forgotError').textContent = '';
  document.getElementById('forgotSuccess').textContent = '';
  document.getElementById('forgotModal').style.display = 'flex';
}

function closeForgotModal() {
  document.getElementById('forgotModal').style.display = 'none';
}

async function doForgotPass() {
  const email = document.getElementById('forgotEmail').value.trim();
  const errEl = document.getElementById('forgotError');
  const sucEl = document.getElementById('forgotSuccess');
  const btn   = document.getElementById('btnForgot');

  errEl.textContent = ''; sucEl.textContent = '';
  if (!email) { errEl.textContent = 'Please enter your email.'; return; }

  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    const res = await AuthAPI.forgotPassword(email);
    sucEl.textContent = 'A reset link has been sent to your email (check console).';
    setTimeout(closeForgotModal, 3000);
  } catch (err) {
    errEl.textContent = err.message || 'Error processing request.';
  } finally {
    btn.disabled = false; btn.textContent = 'Send Reset Link';
  }
}
