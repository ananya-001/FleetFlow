/**
 * ============================================================
 *  FleetFlow — Add Vehicle Page
 *  add_vehicle.js
 *
 *  Modules:
 *   1.  Real-time field validation  (vehicle_name, license_plate, capacity)
 *   2.  License plate auto-formatter  (MH-12-AB-1234 style)
 *   3.  Character counter for vehicle name
 *   4.  Live capacity unit label  (kg → tonnes conversion hint)
 *   5.  Form submit guard + loading state on the button
 *   6.  Back-button unsaved-changes warning
 *   7.  Input field entrance animations (staggered on load)
 *   8.  Card tilt parallax on mouse-move
 *   9.  Toast notification system
 *  10.  Keyboard shortcut  (Alt + S = submit form)
 * ============================================================
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   UTILITY HELPERS
───────────────────────────────────────────────────────────── */

/**
 * Shorthand querySelector
 * @param {string} sel
 * @param {Element|Document} [ctx=document]
 * @returns {Element|null}
 */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * Shorthand querySelectorAll → Array
 * @param {string} sel
 * @param {Element|Document} [ctx=document]
 * @returns {Element[]}
 */
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Inject a <style> block once into <head>.
 * Uses an ID to prevent duplicates on re-init.
 * @param {string} id   - unique style tag id
 * @param {string} css  - CSS text
 */
function injectStyle(id, css) {
  if (document.getElementById(id)) return;
  const tag = document.createElement('style');
  tag.id = id;
  tag.textContent = css;
  document.head.appendChild(tag);
}


/* ─────────────────────────────────────────────────────────────
   1.  REAL-TIME FIELD VALIDATION
   ─────────────────────────────────────────────────────────────
   Each field is validated on 'blur' (when user leaves it) and
   on 'input' (once it has already been touched, for live feedback).
   Valid   → teal border  +  ✓ tick icon
   Invalid → red border   +  error message below the input
───────────────────────────────────────────────────────────── */

/** Validation rules for each field. */
const VALIDATORS = {
  vehicle_name: {
    test(v) {
      return v.trim().length >= 2 && v.trim().length <= 80;
    },
    message: 'Enter a vehicle name (2–80 characters).',
  },
  license_plate: {
    /**
     * Accepts common Indian plate formats:
     *   MH-12-AB-1234  /  DL 1C 0001  /  KA01AB1234
     * Regex: 2 letters, 1–2 digits, 1–3 letters, 4 digits, with optional separators.
     */
    test(v) {
      return /^[A-Z]{2}[\s-]?[0-9]{1,2}[\s-]?[A-Z]{1,3}[\s-]?[0-9]{4}$/.test(
        v.trim().toUpperCase()
      );
    },
    message: 'Enter a valid plate (e.g. MH-12-AB-1234).',
  },
  capacity: {
    test(v) {
      const num = Number(v);
      return Number.isFinite(num) && num >= 1 && num <= 99999;
    },
    message: 'Capacity must be between 1 and 99,999 kg.',
  },
};

/**
 * Injects the CSS needed for validation visual states.
 */
function injectValidationStyles() {
  injectStyle('ff-validation-styles', `
    /* Error message */
    .field-error-msg {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 7px;
      font-size: .75rem;
      font-weight: 500;
      color: #f43f5e;
      opacity: 0;
      transform: translateY(-4px);
      transition: opacity .2s ease, transform .2s ease;
      pointer-events: none;
    }
    .field-error-msg.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .field-error-msg svg {
      width: 12px; height: 12px;
      flex-shrink: 0;
    }

    /* Success tick */
    .field-success-tick {
      position: absolute;
      right: 14px; top: 50%;
      transform: translateY(-50%) scale(0);
      width: 18px; height: 18px;
      background: rgba(13,197,160,.15);
      border: 1px solid rgba(13,197,160,.35);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: transform .22s cubic-bezier(.34,1.56,.64,1);
      pointer-events: none;
    }
    .field-success-tick.show {
      transform: translateY(-50%) scale(1);
    }
    .field-success-tick svg {
      width: 10px; height: 10px;
      color: #0dc5a0;
    }

    /* Error border */
    .input-wrap.has-error input {
      border-color: rgba(244,63,94,.6) !important;
      box-shadow: 0 0 0 3px rgba(244,63,94,.14) !important;
    }

    /* Success border */
    .input-wrap.is-valid input {
      border-color: rgba(13,197,160,.5) !important;
    }

    /* Shake animation on invalid submit */
    @keyframes ff-shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-7px); }
      40%       { transform: translateX(7px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
    .ff-shake {
      animation: ff-shake .38s ease;
    }
  `);
}

/**
 * Returns (or creates) the error <span> below a field's .input-wrap.
 * @param {Element} wrap - .input-wrap element
 * @returns {Element}
 */
function getOrCreateErrorEl(wrap) {
  let el = wrap.parentElement.querySelector('.field-error-msg');
  if (!el) {
    el = document.createElement('span');
    el.className = 'field-error-msg';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span class="err-text"></span>
    `;
    wrap.insertAdjacentElement('afterend', el);
  }
  return el;
}

/**
 * Returns (or creates) the success tick inside .input-wrap.
 * @param {Element} wrap
 * @returns {Element}
 */
function getOrCreateTickEl(wrap) {
  let el = wrap.querySelector('.field-success-tick');
  if (!el) {
    el = document.createElement('span');
    el.className = 'field-success-tick';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
    wrap.appendChild(el);
  }
  return el;
}

/**
 * Mark a field as INVALID — red border, show error, hide tick.
 * @param {HTMLInputElement} input
 * @param {string} message
 */
function markInvalid(input, message) {
  const wrap    = input.closest('.input-wrap');
  const errorEl = getOrCreateErrorEl(wrap);
  const tickEl  = getOrCreateTickEl(wrap);

  wrap.classList.add('has-error');
  wrap.classList.remove('is-valid');
  errorEl.querySelector('.err-text').textContent = message;
  errorEl.classList.add('visible');
  tickEl.classList.remove('show');
}

/**
 * Mark a field as VALID — teal border, hide error, show tick.
 * @param {HTMLInputElement} input
 */
function markValid(input) {
  const wrap    = input.closest('.input-wrap');
  const errorEl = getOrCreateErrorEl(wrap);
  const tickEl  = getOrCreateTickEl(wrap);

  wrap.classList.remove('has-error');
  wrap.classList.add('is-valid');
  errorEl.classList.remove('visible');
  tickEl.classList.add('show');
}

/**
 * Clear all validation state from a field.
 * @param {HTMLInputElement} input
 */
function clearValidation(input) {
  const wrap    = input.closest('.input-wrap');
  const errorEl = wrap?.parentElement?.querySelector('.field-error-msg');
  const tickEl  = wrap?.querySelector('.field-success-tick');

  wrap?.classList.remove('has-error', 'is-valid');
  errorEl?.classList.remove('visible');
  tickEl?.classList.remove('show');
}

/**
 * Validate a single input and update its UI state.
 * @param {HTMLInputElement} input
 * @returns {boolean} true if valid
 */
function validateField(input) {
  const rule = VALIDATORS[input.id];
  if (!rule) return true; // no rule = skip

  const value = input.value;

  if (!value.trim()) {
    markInvalid(input, 'This field is required.');
    return false;
  }
  if (!rule.test(value)) {
    markInvalid(input, rule.message);
    return false;
  }

  markValid(input);
  return true;
}

/**
 * Wire up blur + input listeners for real-time validation.
 */
function initValidation() {
  injectValidationStyles();

  const inputs = [
    document.getElementById('vehicle_name'),
    document.getElementById('license_plate'),
    document.getElementById('capacity'),
  ].filter(Boolean);

  inputs.forEach(input => {
    let touched = false; // only show errors after first blur

    input.addEventListener('blur', () => {
      touched = true;
      validateField(input);
    });

    input.addEventListener('input', () => {
      if (touched) validateField(input);
    });

    // Clear on focus so the error doesn't distract while typing
    input.addEventListener('focus', () => {
      if (!touched) return;
      const wrap = input.closest('.input-wrap');
      wrap?.classList.remove('has-error');
      input.closest('.field')
           ?.querySelector('.field-error-msg')
           ?.classList.remove('visible');
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   2.  LICENSE PLATE AUTO-FORMATTER
   ─────────────────────────────────────────────────────────────
   As the user types in #license_plate, the value is:
     • Forced to UPPERCASE
     • Stripped of anything that isn't a letter, digit, or hyphen
     • Auto-hyphenated into the XX-99-XX-9999 pattern
   Cursor position is preserved so it doesn't jump.
───────────────────────────────────────────────────────────── */

function initLicensePlateFormatter() {
  const input = document.getElementById('license_plate');
  if (!input) return;

  input.addEventListener('input', function () {
    const cursor = this.selectionStart; // remember cursor

    // Strip non-alphanumeric, uppercase
    const raw = this.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Build formatted string: XX-##-XXX-####
    let formatted = '';
    if (raw.length > 0)  formatted  = raw.slice(0, 2);
    if (raw.length > 2)  formatted += '-' + raw.slice(2, 4);
    if (raw.length > 4)  formatted += '-' + raw.slice(4, 7);
    if (raw.length > 7)  formatted += '-' + raw.slice(7, 11);

    this.value = formatted;

    // Restore cursor — offset by the hyphens that were inserted before it
    try {
      const hyphensBefore = (formatted.slice(0, cursor).match(/-/g) || []).length;
      this.setSelectionRange(cursor + hyphensBefore, cursor + hyphensBefore);
    } catch (_) {
      // setSelectionRange may throw in some edge cases; silently ignore
    }
  });
}


/* ─────────────────────────────────────────────────────────────
   3.  CHARACTER COUNTER FOR VEHICLE NAME
   ─────────────────────────────────────────────────────────────
   A small "12 / 80" counter appears beneath the vehicle name
   field and changes colour as the user approaches the limit.
───────────────────────────────────────────────────────────── */

function initCharCounter() {
  const input = document.getElementById('vehicle_name');
  if (!input) return;

  const MAX = 80;

  injectStyle('ff-char-counter', `
    .char-counter {
      display: flex;
      justify-content: flex-end;
      margin-top: 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: .68rem;
      font-weight: 500;
      color: #3a5c7a;
      transition: color .2s;
    }
    .char-counter.warn  { color: #f59e0b; }
    .char-counter.limit { color: #f43f5e; }
  `);

  const counter = document.createElement('div');
  counter.className = 'char-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.textContent = `0 / ${MAX}`;

  // Insert after the input-wrap
  input.closest('.input-wrap').insertAdjacentElement('afterend', counter);

  input.addEventListener('input', function () {
    const len = this.value.length;
    counter.textContent = `${len} / ${MAX}`;
    counter.className = 'char-counter';
    if (len >= MAX)       counter.classList.add('limit');
    else if (len >= 60)   counter.classList.add('warn');
  });
}


/* ─────────────────────────────────────────────────────────────
   4.  LIVE CAPACITY UNIT HINT  (kg → tonnes)
   ─────────────────────────────────────────────────────────────
   If the user enters ≥ 1000 kg, a small hint line shows the
   equivalent in tonnes so they can sanity-check their entry.
───────────────────────────────────────────────────────────── */

function initCapacityHint() {
  const input = document.getElementById('capacity');
  if (!input) return;

  injectStyle('ff-capacity-hint', `
    .capacity-hint {
      margin-top: 6px;
      font-size: .74rem;
      color: #0dc5a0;
      font-family: 'JetBrains Mono', monospace;
      opacity: 0;
      transform: translateY(-3px);
      transition: opacity .25s ease, transform .25s ease;
    }
    .capacity-hint.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `);

  const hint = document.createElement('div');
  hint.className = 'capacity-hint';
  hint.setAttribute('aria-live', 'polite');
  input.closest('.input-wrap').insertAdjacentElement('afterend', hint);

  input.addEventListener('input', function () {
    const kg = parseFloat(this.value);
    if (!isNaN(kg) && kg >= 1000) {
      const tonnes = (kg / 1000).toFixed(2);
      hint.textContent = `≈ ${tonnes} tonne${tonnes !== '1.00' ? 's' : ''}`;
      hint.classList.add('visible');
    } else {
      hint.classList.remove('visible');
    }
  });
}


/* ─────────────────────────────────────────────────────────────
   5.  FORM SUBMIT GUARD + LOADING STATE
   ─────────────────────────────────────────────────────────────
   On submit:
     a) Run full validation on all three fields.
     b) If any field is invalid, shake it and abort submission.
     c) If all valid, switch the button to a "Registering…"
        loading state to prevent double-clicks and give feedback.
───────────────────────────────────────────────────────────── */

function injectButtonStyles() {
  injectStyle('ff-btn-loading', `
    .btn-submit.loading {
      opacity: .8;
      pointer-events: none;
      cursor: not-allowed;
    }
    .btn-submit .btn-spinner {
      width: 17px; height: 17px;
      border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.25);
      border-top-color: #fff;
      animation: ff-spin .65s linear infinite;
      flex-shrink: 0;
    }
    @keyframes ff-spin { to { transform: rotate(360deg); } }
  `);
}

function initFormSubmit() {
  injectButtonStyles();

  const form   = $('form[action="/add_vehicle"]');
  const btn    = form ? $('.btn-submit', form) : null;
  const inputs = ['vehicle_name', 'license_plate', 'capacity']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (!form || !btn) return;

  // Store original button HTML so we can restore it if needed
  const originalHTML = btn.innerHTML;

  form.addEventListener('submit', function (e) {
    // Force-validate every field
    let allValid = true;
    inputs.forEach(input => {
      const valid = validateField(input);
      if (!valid) {
        // Shake the invalid field's wrapper
        const wrap = input.closest('.input-wrap');
        wrap.classList.remove('ff-shake');
        void wrap.offsetWidth; // trigger reflow so animation restarts
        wrap.classList.add('ff-shake');
        wrap.addEventListener('animationend', () => wrap.classList.remove('ff-shake'), { once: true });
        allValid = false;
      }
    });

    if (!allValid) {
      e.preventDefault();
      showToast('Please fix the highlighted errors before submitting.', 'error');
      // Focus the first invalid input
      const firstInvalid = inputs.find(i => i.closest('.input-wrap')?.classList.contains('has-error'));
      firstInvalid?.focus();
      return;
    }

    // All valid — switch to loading state
    btn.classList.add('loading');
    btn.innerHTML = `
      <span class="btn-spinner"></span>
      Registering Asset…
    `;

    // NOTE: The form now submits normally to the backend.
    // If you're using fetch/XHR instead, call e.preventDefault() here
    // and reset the button on completion: btn.innerHTML = originalHTML;
    console.log('[FleetFlow] Form validated — submitting to /add_vehicle');
  });
}


/* ─────────────────────────────────────────────────────────────
   6.  BACK-BUTTON UNSAVED-CHANGES WARNING
   ─────────────────────────────────────────────────────────────
   If the user has typed anything into any field and then tries
   to navigate away via the "Return to Dashboard" link, show a
   confirmation dialog before leaving the page.
───────────────────────────────────────────────────────────── */

function initUnsavedWarning() {
  const backBtn = $('.back-btn');
  const inputs  = ['vehicle_name', 'license_plate', 'capacity']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  let isDirty = false;

  // Mark form as dirty as soon as anything is typed
  inputs.forEach(input => {
    input.addEventListener('input', () => { isDirty = true; });
  });

  // Reset dirty flag on successful form submit (so no warning on redirect)
  const form = $('form[action="/add_vehicle"]');
  form?.addEventListener('submit', () => { isDirty = false; });

  // Warn on native page unload (browser back/refresh)
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = ''; // required for Chrome
    }
  });

  // Intercept our custom back button
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      if (!isDirty) return; // nothing typed — navigate freely

      e.preventDefault();
      const destination = this.getAttribute('href');

      // Use our custom confirm modal instead of browser confirm()
      showConfirmModal(
        'Discard Changes?',
        'You have unsaved entries. If you leave now, your progress will be lost.',
        'Leave Anyway',
        'Keep Editing',
        () => { window.location.href = destination || 'fleet-dashboard.html'; }
      );
    });
  }
}


/* ─────────────────────────────────────────────────────────────
   SHARED CONFIRM MODAL
   Used by the back-button warning (and can be reused elsewhere).
───────────────────────────────────────────────────────────── */

function showConfirmModal(title, body, confirmLabel, cancelLabel, onConfirm) {
  injectStyle('ff-confirm-modal-style', `
    #ff-confirm-modal {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity .25s ease;
    }
    #ff-confirm-modal.visible { opacity: 1; pointer-events: all; }
    .ff-cm-backdrop {
      position: absolute; inset: 0;
      background: rgba(6,14,30,.7);
      backdrop-filter: blur(6px);
    }
    .ff-cm-box {
      position: relative; z-index: 1;
      background: linear-gradient(160deg, #0f2040, #091528);
      border: 1px solid #1a3358;
      border-radius: 18px;
      padding: 34px 30px 28px;
      max-width: 340px; width: 90%;
      text-align: center;
      box-shadow: 0 32px 64px rgba(0,0,0,.5), 0 0 0 1px rgba(0,212,255,.06);
      transform: translateY(16px) scale(.97);
      transition: transform .28s cubic-bezier(.22,1,.36,1);
    }
    #ff-confirm-modal.visible .ff-cm-box { transform: translateY(0) scale(1); }
    .ff-cm-icon {
      width: 48px; height: 48px; border-radius: 13px; margin: 0 auto 16px;
      background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25);
      display: flex; align-items: center; justify-content: center;
      color: #f59e0b;
    }
    .ff-cm-icon svg { width: 22px; height: 22px; }
    .ff-cm-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem; font-weight: 800; letter-spacing: -.03em;
      color: #e8f4ff; margin-bottom: 9px;
    }
    .ff-cm-body {
      font-family: 'Outfit', sans-serif;
      font-size: .83rem; color: #7fa8cc; line-height: 1.55; margin-bottom: 22px;
    }
    .ff-cm-actions { display: flex; gap: 10px; }
    .ff-cm-cancel, .ff-cm-confirm {
      flex: 1; padding: 11px; border-radius: 10px;
      font-family: 'Outfit', sans-serif;
      font-size: .85rem; font-weight: 600;
      cursor: pointer; border: none; transition: all .18s ease;
    }
    .ff-cm-cancel {
      background: rgba(255,255,255,.06);
      color: #7fa8cc; border: 1px solid #1a3358;
    }
    .ff-cm-cancel:hover { background: rgba(255,255,255,.1); color: #e8f4ff; }
    .ff-cm-confirm {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #060e1e;
      box-shadow: 0 3px 12px rgba(245,158,11,.3);
    }
    .ff-cm-confirm:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(245,158,11,.4); }
  `);

  // Create or reuse modal
  let modal = document.getElementById('ff-confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ff-confirm-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="ff-cm-backdrop"></div>
    <div class="ff-cm-box">
      <div class="ff-cm-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2 class="ff-cm-title">${title}</h2>
      <p class="ff-cm-body">${body}</p>
      <div class="ff-cm-actions">
        <button class="ff-cm-cancel" id="ff-cm-cancel-btn">${cancelLabel}</button>
        <button class="ff-cm-confirm" id="ff-cm-confirm-btn">${confirmLabel}</button>
      </div>
    </div>
  `;

  // Show
  requestAnimationFrame(() => modal.classList.add('visible'));

  const close = () => {
    modal.classList.remove('visible');
    document.removeEventListener('keydown', onKey);
  };

  document.getElementById('ff-cm-cancel-btn').addEventListener('click', close);
  document.getElementById('ff-cm-confirm-btn').addEventListener('click', () => {
    close();
    onConfirm();
  });
  modal.querySelector('.ff-cm-backdrop').addEventListener('click', close);

  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') { close(); onConfirm(); }
  };
  document.addEventListener('keydown', onKey);
}


/* ─────────────────────────────────────────────────────────────
   7.  INPUT FIELD ENTRANCE ANIMATIONS
   ─────────────────────────────────────────────────────────────
   The three .field elements slide in from the left with a
   short staggered delay when the page loads.
   Uses IntersectionObserver for performance.
───────────────────────────────────────────────────────────── */

function initFieldAnimations() {
  const fields = $$('.field');
  if (!fields.length) return;

  // Only animate if CSS has NOT already handled it (check computed opacity)
  // The HTML already has CSS animations via animation-delay; this JS layer
  // adds an extra "visible" class for fields that may be below the fold
  // on very small screens.
  fields.forEach((field, i) => {
    field.style.opacity   = '0';
    field.style.transform = 'translateX(-16px)';
    field.style.transition = `opacity .45s ease ${i * 90}ms, transform .45s cubic-bezier(.22,1,.36,1) ${i * 90}ms`;
  });

  function revealField(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateX(0)';
        observer.unobserve(entry.target);
      }
    });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(revealField, { threshold: 0.1 });
    fields.forEach(f => io.observe(f));
  } else {
    // Fallback
    fields.forEach(f => {
      f.style.opacity   = '1';
      f.style.transform = 'none';
    });
  }
}


/* ─────────────────────────────────────────────────────────────
   8.  CARD TILT PARALLAX
   ─────────────────────────────────────────────────────────────
   The .card gently tilts to follow the mouse cursor for a
   subtle premium 3D feel. Disabled for reduced-motion users.
───────────────────────────────────────────────────────────── */

function initCardTilt() {
  const card = $('.card');
  if (!card) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TILT_MAX = 5; // degrees

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2); // -1 to 1
    const dy   = (e.clientY - cy) / (rect.height / 2);

    const rotX = (-dy * TILT_MAX).toFixed(2);
    const rotY = ( dx * TILT_MAX).toFixed(2);

    card.style.transition = 'transform .08s ease';
    card.style.transform  = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.008)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .5s ease';
    card.style.transform  = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  });
}


/* ─────────────────────────────────────────────────────────────
   9.  TOAST NOTIFICATION SYSTEM
   ─────────────────────────────────────────────────────────────
   A lightweight, reusable toast for success / error / info
   messages. Toasts stack vertically, auto-dismiss after 4 s,
   and can be closed manually.
───────────────────────────────────────────────────────────── */

let toastContainer = null;

function getToastContainer() {
  if (toastContainer) return toastContainer;

  injectStyle('ff-toast-styles', `
    #ff-toast-container {
      position: fixed;
      bottom: 28px; right: 28px;
      z-index: 9998;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .ff-toast {
      display: flex; align-items: center; gap: 11px;
      padding: 13px 18px;
      border-radius: 12px;
      font-family: 'Outfit', sans-serif;
      font-size: .85rem; font-weight: 500;
      color: #e8f4ff;
      background: rgba(9,21,45,.96);
      border: 1px solid #1a3358;
      box-shadow: 0 8px 28px rgba(0,0,0,.45);
      pointer-events: all;
      max-width: 320px;
      transform: translateX(120%);
      opacity: 0;
      transition: transform .35s cubic-bezier(.22,1,.36,1), opacity .3s ease;
    }
    .ff-toast.show {
      transform: translateX(0);
      opacity: 1;
    }
    .ff-toast.hide {
      transform: translateX(120%);
      opacity: 0;
    }
    .ff-toast-icon { width: 18px; height: 18px; flex-shrink: 0; }
    .ff-toast-msg  { flex: 1; line-height: 1.4; }
    .ff-toast-close {
      background: none; border: none; cursor: pointer;
      color: #3a5c7a; padding: 2px;
      transition: color .15s;
      display: flex; align-items: center;
    }
    .ff-toast-close:hover { color: #e8f4ff; }
    .ff-toast-close svg { width: 14px; height: 14px; }
    /* type colours */
    .ff-toast.success { border-color: rgba(13,197,160,.35); }
    .ff-toast.success .ff-toast-icon { color: #0dc5a0; }
    .ff-toast.error   { border-color: rgba(244,63,94,.35); }
    .ff-toast.error   .ff-toast-icon { color: #f43f5e; }
    .ff-toast.info    { border-color: rgba(26,110,245,.35); }
    .ff-toast.info    .ff-toast-icon { color: #1a6ef5; }

    @media (max-width: 500px) {
      #ff-toast-container { left: 16px; right: 16px; bottom: 20px; }
      .ff-toast { max-width: 100%; }
    }
  `);

  toastContainer = document.createElement('div');
  toastContainer.id = 'ff-toast-container';
  document.body.appendChild(toastContainer);
  return toastContainer;
}

/** Icon SVGs keyed by toast type. */
const TOAST_ICONS = {
  success: `<svg class="ff-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg class="ff-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:    `<svg class="ff-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [duration=4000] - auto-dismiss delay in ms
 */
function showToast(message, type = 'info', duration = 4000) {
  const container = getToastContainer();

  const toast = document.createElement('div');
  toast.className = `ff-toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    ${TOAST_ICONS[type] || TOAST_ICONS.info}
    <span class="ff-toast-msg">${message}</span>
    <button class="ff-toast-close" aria-label="Dismiss notification">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  const dismiss = () => {
    toast.classList.add('hide');
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  // Auto-dismiss
  const timer = setTimeout(dismiss, duration);

  // Manual close
  toast.querySelector('.ff-toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    dismiss();
  });
}


/* ─────────────────────────────────────────────────────────────
   10.  KEYBOARD SHORTCUT  (Alt + S → submit form)
   ─────────────────────────────────────────────────────────────
   Provides a power-user shortcut to submit the form without
   reaching for the mouse. A brief toast confirms the action.
───────────────────────────────────────────────────────────── */

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt + S = submit
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      const form = $('form[action="/add_vehicle"]');
      if (form) {
        showToast('Submitting via keyboard shortcut (Alt + S)…', 'info', 2000);
        // Small delay so the toast is visible before submit navigation
        setTimeout(() => form.requestSubmit(), 300);
      }
    }

    // Alt + R = reset / clear all fields
    if (e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      const form = $('form[action="/add_vehicle"]');
      if (form) {
        form.reset();
        ['vehicle_name', 'license_plate', 'capacity'].forEach(id => {
          const input = document.getElementById(id);
          if (input) clearValidation(input);
        });
        showToast('Form cleared.', 'info', 2000);
      }
    }
  });
}


/* ─────────────────────────────────────────────────────────────
   BOOTSTRAP — Run all modules when DOM is ready
───────────────────────────────────────────────────────────── */

function init() {
  initFieldAnimations();     // 7 — visual entrance first
  initValidation();          // 1 — real-time validation
  initLicensePlateFormatter(); // 2 — plate auto-format
  initCharCounter();         // 3 — name char counter
  initCapacityHint();        // 4 — kg → tonnes hint
  initFormSubmit();          // 5 — submit guard + loading btn
  initUnsavedWarning();      // 6 — back btn dirty check
  initCardTilt();            // 8 — 3D card parallax
  initKeyboardShortcuts();   // 10 — Alt+S / Alt+R

  // Welcome toast — lets user know the page is interactive
  showToast('Ready to register a new asset. Fill in all fields.', 'info', 3500);

  console.log('[FleetFlow] add_vehicle.js initialised ✓');
  console.log('  Shortcuts: Alt+S = submit  |  Alt+R = clear form');
}

// Support both <script defer> and inline at bottom of <body>
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}