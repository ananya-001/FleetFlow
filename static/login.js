/**
 * FleetCore OS — Admin Login
 * login.js — Client-side logic: validation, UX feedback, animations, counters
 */

'use strict';

/* ─────────────────────────────────────────
   1. DOM REFERENCES
───────────────────────────────────────── */
const form        = document.getElementById('login-form');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const loginBtn    = document.getElementById('btn-login');
const emailErr    = document.getElementById('email-error');
const passErr     = document.getElementById('pass-error');
const togglePass  = document.getElementById('toggle-password');
const toastEl     = document.getElementById('toast');
const toastMsg    = document.getElementById('toast-msg');

/* ─────────────────────────────────────────
   2. ANIMATED STAT COUNTERS
   Counts up the sidebar numbers on load
───────────────────────────────────────── */
function animateCounter(el, target, duration = 1800, isFloat = false, suffix = '') {
  const start    = performance.now();
  const from     = 0;

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const value    = from + (target - from) * eased;

    if (isFloat) {
      el.textContent = value.toFixed(1) + suffix;
    } else {
      el.textContent = Math.floor(value).toLocaleString() + suffix;
    }

    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = isFloat
      ? target.toFixed(1) + suffix
      : target.toLocaleString() + suffix;
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  counters.forEach(el => {
    const raw     = el.dataset.count;
    const isFloat = raw.includes('.');
    const suffix  = el.dataset.suffix || '';
    const target  = parseFloat(raw);
    // Stagger each counter
    const delay   = parseInt(el.dataset.delay || 0);
    setTimeout(() => animateCounter(el, target, 1800, isFloat, suffix), delay);
  });
}

/* ─────────────────────────────────────────
   3. VALIDATION HELPERS
───────────────────────────────────────── */
const RULES = {
  email: {
    test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    msg:  'Please enter a valid email address.'
  },
  password: {
    test: v => v.length >= 6,
    msg:  'Password must be at least 6 characters.'
  }
};

function setError(input, errorEl, message) {
  input.classList.add('input-error');
  input.classList.remove('input-ok');
  errorEl.textContent = message;
  errorEl.classList.add('visible');
  // Shake animation
  input.classList.remove('shake');
  void input.offsetWidth; // reflow
  input.classList.add('shake');
}

function clearError(input, errorEl) {
  input.classList.remove('input-error', 'shake');
  input.classList.add('input-ok');
  errorEl.classList.remove('visible');
}

function clearAll() {
  clearError(emailInput, emailErr);
  clearError(passInput, passErr);
}

function validateEmail() {
  const v = emailInput.value;
  if (!v) {
    setError(emailInput, emailErr, 'Email is required.');
    return false;
  }
  if (!RULES.email.test(v)) {
    setError(emailInput, emailErr, RULES.email.msg);
    return false;
  }
  clearError(emailInput, emailErr);
  return true;
}

function validatePassword() {
  const v = passInput.value;
  if (!v) {
    setError(passInput, passErr, 'Password is required.');
    return false;
  }
  if (!RULES.password.test(v)) {
    setError(passInput, passErr, RULES.password.msg);
    return false;
  }
  clearError(passInput, passErr);
  return true;
}

/* ─────────────────────────────────────────
   4. REAL-TIME VALIDATION (on blur)
───────────────────────────────────────── */
emailInput.addEventListener('blur', validateEmail);
passInput.addEventListener('blur', validatePassword);

// Clear error on re-focus
emailInput.addEventListener('focus', () => {
  emailInput.classList.remove('input-error', 'shake');
  emailErr.classList.remove('visible');
});
passInput.addEventListener('focus', () => {
  passInput.classList.remove('input-error', 'shake');
  passErr.classList.remove('visible');
});

/* ─────────────────────────────────────────
   5. PASSWORD VISIBILITY TOGGLE
───────────────────────────────────────── */
if (togglePass) {
  togglePass.addEventListener('click', () => {
    const isHidden = passInput.type === 'password';
    passInput.type = isHidden ? 'text' : 'password';
    // Swap icon
    togglePass.querySelector('.eye-open').style.display  = isHidden ? 'none'  : 'block';
    togglePass.querySelector('.eye-close').style.display = isHidden ? 'block' : 'none';
    togglePass.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
}

/* ─────────────────────────────────────────
   6. TOAST NOTIFICATION
───────────────────────────────────────── */
let toastTimer;
function showToast(message, type = 'error') {
  clearTimeout(toastTimer);
  toastMsg.textContent = message;
  toastEl.className    = 'toast toast--' + type;
  toastEl.classList.add('toast--show');
  toastTimer = setTimeout(() => toastEl.classList.remove('toast--show'), 4000);
}

/* ─────────────────────────────────────────
   7. BUTTON LOADING STATE
───────────────────────────────────────── */
function setLoading(state) {
  if (state) {
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');
    loginBtn.dataset.original = loginBtn.textContent;
    loginBtn.innerHTML = `
      <span class="spinner"></span>
      Authenticating…
    `;
  } else {
    loginBtn.disabled = false;
    loginBtn.classList.remove('loading');
    loginBtn.textContent = loginBtn.dataset.original || 'Login to Dashboard';
  }
}

/* ─────────────────────────────────────────
   8. MOCK AUTHENTICATION
   Replace this section with your real API call.
   Demo credentials: admin@fleetcore.io / fleet2025
───────────────────────────────────────── */
const DEMO_CREDENTIALS = {
  email:    'admin@fleetcore.io',
  password: 'fleet2025'
};

function mockAuthCall(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (
        email.toLowerCase() === DEMO_CREDENTIALS.email &&
        password           === DEMO_CREDENTIALS.password
      ) {
        resolve({ success: true, token: 'DEMO_TOKEN_XYZ', role: 'superadmin' });
      } else {
        reject(new Error('Invalid credentials. Try admin@fleetcore.io / fleet2025'));
      }
    }, 1600); // simulate network delay
  });
}

/* ─────────────────────────────────────────
   9. FORM SUBMISSION
───────────────────────────────────────── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const emailOk = validateEmail();
  const passOk  = validatePassword();
  if (!emailOk || !passOk) return;

  setLoading(true);

  try {
    const result = await mockAuthCall(emailInput.value.trim(), passInput.value);

    if (result.success) {
      showToast('✓ Authentication successful. Redirecting…', 'success');
      loginBtn.innerHTML = '✓ Access Granted';
      loginBtn.style.background = 'linear-gradient(135deg, #3ddc84, #1fa85a)';

      // Simulate redirect after 1.5s
      setTimeout(() => {
        showToast('Redirecting to dashboard…', 'success');
        // window.location.href = '/dashboard'; // ← uncomment for real redirect
      }, 1500);
    }
  } catch (err) {
    setLoading(false);
    showToast('⚠ ' + err.message, 'error');

    // Shake both fields on auth failure
    [emailInput, passInput].forEach(el => {
      el.classList.add('input-error');
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
    });
  }
});

/* ─────────────────────────────────────────
   10. FORGOT PASSWORD MODAL STUB
───────────────────────────────────────── */
const forgotLink = document.getElementById('forgot-link');
if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (email && RULES.email.test(email)) {
      showToast(`📧 Password reset link sent to ${email}`, 'success');
    } else {
      showToast('Enter your email above first, then click Forgot Password.', 'info');
      emailInput.focus();
    }
  });
}

/* ─────────────────────────────────────────
   11. LIVE CLOCK in footer
───────────────────────────────────────── */
function initClock() {
  const clockEl = document.getElementById('live-clock');
  if (!clockEl) return;

  function tick() {
    const now = new Date();
    clockEl.textContent = now.toUTCString().replace('GMT', 'UTC');
  }
  tick();
  setInterval(tick, 1000);
}

/* ─────────────────────────────────────────
   12. KEYBOARD SHORTCUT  (Alt + L = focus email)
───────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    emailInput.focus();
  }
});

/* ─────────────────────────────────────────
   13. MOUSE-TRACK TILT ON CARD
   Subtle 3D parallax tilt effect
───────────────────────────────────────── */
function initCardTilt() {
  const card = document.querySelector('.card');
  if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  card.addEventListener('mousemove', (e) => {
    const rect   = card.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2); // -1 to 1
    const dy     = (e.clientY - cy) / (rect.height / 2);
    const rotX   = (-dy * 4).toFixed(2);
    const rotY   = ( dx * 4).toFixed(2);
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.01)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .5s ease';
    card.style.transform  = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
    setTimeout(() => card.style.transition = '', 500);
  });

  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform .1s ease';
  });
}

/* ─────────────────────────────────────────
   14. CAPSLOCK WARNING
───────────────────────────────────────── */
passInput.addEventListener('keyup', (e) => {
  const capsOn = e.getModifierState && e.getModifierState('CapsLock');
  let capsWarn = document.getElementById('caps-warn');
  if (capsOn) {
    if (!capsWarn) {
      capsWarn = document.createElement('p');
      capsWarn.id = 'caps-warn';
      capsWarn.className = 'caps-warn';
      capsWarn.textContent = '⇪ Caps Lock is on';
      passInput.closest('.field').appendChild(capsWarn);
    }
  } else if (capsWarn) {
    capsWarn.remove();
  }
});

/* ─────────────────────────────────────────
   15. INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCounters();
  initClock();
  initCardTilt();
  emailInput.focus();
});