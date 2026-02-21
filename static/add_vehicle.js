/**
 * ================================================================
 *  FleetFlow — Register New Vehicle
 *  add_vehicle.js
 *
 *  Table of Contents
 *  ─────────────────────────────────────────────────────────────
 *  1.  Utilities                    — helpers used throughout
 *  2.  Field Validation             — real-time inline error/success states
 *  3.  License Plate Formatter      — auto-uppercase + hyphen insertion
 *  4.  Character Counter            — live "12 / 60" under vehicle name
 *  5.  Capacity Tonnes Hint         — shows kg → tonnes conversion
 *  6.  Form Submit Guard            — validate all → loading button state
 *  7.  Unsaved-Changes Warning      — warns before leaving dirty form
 *  8.  Card Tilt Parallax           — subtle 3-D mouse-tracking effect
 *  9.  Toast Notifications          — success / error / info pop-ups
 * 10.  Keyboard Shortcuts           — Alt+S submit, Alt+R reset
 * 11.  Init                         — wire everything up on DOMContentLoaded
 * ================================================================
 */

'use strict';

/* ================================================================
   1.  UTILITIES
   ================================================================ */

/** querySelector shorthand */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
/** querySelectorAll → Array shorthand */
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Inject a <style> block into <head> exactly once (idempotent).
 * @param {string} id  - unique ID so we never duplicate the tag
 * @param {string} css - raw CSS text
 */
function injectStyle(id, css) {
  if (document.getElementById(id)) return;
  const tag  = document.createElement('style');
  tag.id     = id;
  tag.textContent = css;
  document.head.appendChild(tag);
}

/**
 * Trigger a one-shot CSS animation by removing then re-adding a class.
 * Forces browser reflow so the animation always replays from the start.
 * @param {Element} el
 * @param {string}  cls
 */
function replayAnimation(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;   // force reflow
  el.classList.add(cls);
}


/* ================================================================
   2.  FIELD VALIDATION
   ================================================================
   Strategy
   ────────
   • Validation first fires on 'blur' so we never nag mid-type.
   • Once touched, live feedback runs on every 'input' event.
   • On submit, all fields are force-validated regardless.

   Visual states
   ─────────────
   Valid   → teal border  +  animated ✓ tick inside the input wrap
   Invalid → red border   +  error message slides in below the field
   ================================================================ */

const RULES = {
  vehicle_name: {
    test: v => v.trim().length >= 2 && v.trim().length <= 60,
    msg:  'Enter a vehicle name between 2 and 60 characters.',
  },
  license_plate: {
    /**
     * Accepts common Indian RTO formats (with or without separators):
     *   MH-12-AB-1234  |  DL 1C 0001  |  KA01AB1234
     */
    test: v => /^[A-Z]{2}[\s-]?[0-9]{1,2}[\s-]?[A-Z]{1,3}[\s-]?[0-9]{4}$/.test(
      v.trim().toUpperCase()
    ),
    msg: 'Enter a valid plate number (e.g. MH-12-AB-1234).',
  },
  capacity: {
    test: v => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 1 && n <= 99999;
    },
    msg: 'Capacity must be a number between 1 and 99,999.',
  },
};

function injectValidationStyles() {
  injectStyle('ff-val-styles', `
    /* Error message */
    .ff-err {
      display: flex; align-items: center; gap: 6px;
      margin-top: 7px; font-size: .74rem; font-weight: 500;
      color: #ff5370; max-height: 0; overflow: hidden; opacity: 0;
      transition: max-height .25s ease, opacity .2s ease;
    }
    .ff-err.visible { max-height: 30px; opacity: 1; }
    .ff-err svg { width: 12px; height: 12px; flex-shrink: 0; }

    /* Success tick */
    .ff-tick {
      position: absolute; right: 13px; top: 50%;
      transform: translateY(-50%) scale(0);
      width: 20px; height: 20px; border-radius: 50%;
      background: rgba(29,233,182,.12); border: 1px solid rgba(29,233,182,.35);
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
      transition: transform .25s cubic-bezier(.34,1.56,.64,1);
    }
    .ff-tick.show { transform: translateY(-50%) scale(1); }
    .ff-tick svg { width: 10px; height: 10px; color: #1de9b6; }

    /* Invalid border */
    .input-wrap.ff-invalid input {
      border-color: rgba(255,83,112,.55) !important;
      box-shadow: 0 0 0 3px rgba(255,83,112,.14) !important;
    }
    /* Valid border */
    .input-wrap.ff-valid input {
      border-color: rgba(29,233,182,.45) !important;
    }

    /* Shake on submit failure */
    @keyframes ff-shake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-7px); }
      40%     { transform: translateX(7px); }
      60%     { transform: translateX(-4px); }
      80%     { transform: translateX(4px); }
    }
    .ff-shake { animation: ff-shake .38s ease; }
  `);
}

/** Get or create the error <span> that lives after the .input-wrap */
function getErrorEl(wrap) {
  let el = wrap.nextElementSibling;
  if (el?.classList.contains('ff-err')) return el;
  el = document.createElement('span');
  el.className = 'ff-err';
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span class="ff-err-text"></span>
  `;
  wrap.insertAdjacentElement('afterend', el);
  return el;
}

/** Get or create the success tick inside .input-wrap */
function getTickEl(wrap) {
  let el = wrap.querySelector('.ff-tick');
  if (el) return el;
  el = document.createElement('span');
  el.className = 'ff-tick';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `;
  wrap.appendChild(el);
  return el;
}

function setInvalid(input, message) {
  const wrap = input.closest('.input-wrap');
  const err  = getErrorEl(wrap);
  const tick = getTickEl(wrap);
  wrap.classList.add('ff-invalid');
  wrap.classList.remove('ff-valid');
  err.querySelector('.ff-err-text').textContent = message;
  err.classList.add('visible');
  tick.classList.remove('show');
}

function setValid(input) {
  const wrap = input.closest('.input-wrap');
  const err  = getErrorEl(wrap);
  const tick = getTickEl(wrap);
  wrap.classList.remove('ff-invalid');
  wrap.classList.add('ff-valid');
  err.classList.remove('visible');
  tick.classList.add('show');
}

function clearState(input) {
  const wrap = input.closest('.input-wrap');
  wrap?.classList.remove('ff-invalid', 'ff-valid');
  wrap?.nextElementSibling?.classList.remove('visible');
  wrap?.querySelector('.ff-tick')?.classList.remove('show');
}

/** Validate one field. Returns true if valid. */
function validateField(input) {
  const rule = RULES[input.id];
  if (!rule) return true;
  if (!input.value.trim()) { setInvalid(input, 'This field is required.'); return false; }
  if (!rule.test(input.value)) { setInvalid(input, rule.msg); return false; }
  setValid(input);
  return true;
}

function initValidation() {
  injectValidationStyles();

  const fields = ['vehicle_name', 'license_plate', 'capacity']
    .map(id => document.getElementById(id)).filter(Boolean);

  fields.forEach(input => {
    let touched = false;

    input.addEventListener('blur', () => { touched = true; validateField(input); });
    input.addEventListener('input', () => { if (touched) validateField(input); });

    // Soften border on re-focus so it doesn't distract mid-type
    input.addEventListener('focus', () => {
      if (!touched) return;
      input.closest('.input-wrap')?.classList.remove('ff-invalid');
      getErrorEl(input.closest('.input-wrap'))?.classList.remove('visible');
    });
  });
}


/* ================================================================
   3.  LICENSE PLATE FORMATTER
   ================================================================
   Strips non-alphanumeric chars, forces UPPERCASE, and
   auto-inserts hyphens into XX-##-XXX-#### pattern while
   carefully preserving the cursor position.
   ================================================================ */

function initPlateFormatter() {
  const input = document.getElementById('license_plate');
  if (!input) return;

  input.addEventListener('input', function () {
    const pos = this.selectionStart;
    const raw = this.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    let out = '';
    if (raw.length > 0) out  = raw.slice(0, 2);
    if (raw.length > 2) out += '-' + raw.slice(2, 4);
    if (raw.length > 4) out += '-' + raw.slice(4, 7);
    if (raw.length > 7) out += '-' + raw.slice(7, 11);

    this.value = out;

    // Restore cursor, accounting for the hyphens now before it
    try {
      const hyphens = (out.slice(0, pos).match(/-/g) || []).length;
      this.setSelectionRange(pos + hyphens, pos + hyphens);
    } catch (_) { /* safe to ignore edge cases */ }
  });
}


/* ================================================================
   4.  CHARACTER COUNTER  (vehicle name)
   ================================================================
   Shows a live "0 / 60" counter below the vehicle name field.
   Turns amber at ≥ 80% of the limit, red at the limit.
   ================================================================ */

function initCharCounter() {
  const input = document.getElementById('vehicle_name');
  if (!input) return;

  const MAX = 60;

  injectStyle('ff-counter', `
    .ff-counter {
      display: flex; justify-content: flex-end; margin-top: 5px;
      font-size: .68rem; font-weight: 500; color: #2e5278;
      transition: color .2s;
    }
    .ff-counter.warn  { color: #f59e0b; }
    .ff-counter.limit { color: #ff5370; }
  `);

  const counter = document.createElement('div');
  counter.className = 'ff-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.textContent = `0 / ${MAX}`;
  input.closest('.input-wrap').insertAdjacentElement('afterend', counter);

  input.addEventListener('input', function () {
    const len = this.value.length;
    counter.textContent = `${len} / ${MAX}`;
    counter.className   = 'ff-counter';
    if      (len >= MAX)           counter.classList.add('limit');
    else if (len >= MAX * 0.8)     counter.classList.add('warn');
  });
}


/* ================================================================
   5.  CAPACITY TONNES HINT
   ================================================================
   When the user types ≥ 1,000 kg, a teal hint line slides in
   showing the metric-tonnes equivalent as a sanity check.
   ================================================================ */

function initCapacityHint() {
  const input = document.getElementById('capacity');
  if (!input) return;

  injectStyle('ff-tonnes', `
    .ff-tonnes {
      margin-top: 6px; font-size: .73rem;
      color: #1de9b6;
      max-height: 0; overflow: hidden; opacity: 0;
      transition: max-height .25s ease, opacity .25s ease;
    }
    .ff-tonnes.visible { max-height: 24px; opacity: 1; }
  `);

  const hint = document.createElement('div');
  hint.className = 'ff-tonnes';
  hint.setAttribute('aria-live', 'polite');
  input.closest('.input-wrap').insertAdjacentElement('afterend', hint);

  input.addEventListener('input', function () {
    const kg = parseFloat(this.value);
    if (!isNaN(kg) && kg >= 1000) {
      const t = (kg / 1000).toFixed(2);
      hint.textContent = `≈ ${t} tonne${t !== '1.00' ? 's' : ''}`;
      hint.classList.add('visible');
    } else {
      hint.classList.remove('visible');
    }
  });
}


/* ================================================================
   6.  FORM SUBMIT GUARD  +  LOADING BUTTON STATE
   ================================================================
   On submit:
     a) Force-validate every field.
     b) Invalid → shake the bad field, show error toast, abort.
     c) Valid   → switch button to spinner + "Registering…" text.
   ================================================================ */

function initFormSubmit() {
  injectStyle('ff-btn-load', `
    .btn-submit.ff-loading { opacity: .78; pointer-events: none; cursor: not-allowed; }
    @keyframes ff-spin { to { transform: rotate(360deg); } }
    .ff-spinner {
      width: 17px; height: 17px; border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.25); border-top-color: #fff;
      animation: ff-spin .65s linear infinite; flex-shrink: 0;
    }
  `);

  const form = $('form[action="/add_vehicle"]');
  const btn  = form ? $('.btn-submit', form) : null;
  if (!form || !btn) return;

  form.addEventListener('submit', function (e) {
    const inputs   = ['vehicle_name', 'license_plate', 'capacity']
      .map(id => document.getElementById(id)).filter(Boolean);
    let   allValid = true;

    inputs.forEach(input => {
      if (!validateField(input)) {
        allValid = false;
        const wrap = input.closest('.input-wrap');
        replayAnimation(wrap, 'ff-shake');
        wrap.addEventListener('animationend', () => wrap.classList.remove('ff-shake'), { once: true });
      }
    });

    if (!allValid) {
      e.preventDefault();
      showToast('Please fix the highlighted errors before submitting.', 'error');
      const first = inputs.find(i => i.closest('.input-wrap')?.classList.contains('ff-invalid'));
      first?.focus();
      return;
    }

    // All valid — show loading state
    btn.classList.add('ff-loading');
    btn.innerHTML = `<span class="ff-spinner"></span> Registering Vehicle…`;
    console.log('[FleetFlow] Valid — submitting to /add_vehicle');
  });
}


/* ================================================================
   7.  UNSAVED-CHANGES WARNING
   ================================================================
   If the user has typed anything and clicks "Back to Dashboard",
   a styled modal asks whether to stay or leave.
   Native beforeunload covers browser back / tab close.
   ================================================================ */

function showDiscardModal(onLeave) {
  injectStyle('ff-discard', `
    #ff-discard-overlay {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      background: rgba(2,12,27,.75); backdrop-filter: blur(8px);
      opacity: 0; pointer-events: none; transition: opacity .25s ease;
    }
    #ff-discard-overlay.open { opacity: 1; pointer-events: all; }
    .ff-modal {
      background: linear-gradient(160deg,#0a1f3d,#071428);
      border: 1px solid rgba(41,121,255,.24); border-radius: 20px;
      padding: 36px 32px 30px; max-width: 340px; width: 90%;
      text-align: center;
      box-shadow: 0 32px 72px rgba(0,0,0,.6), 0 0 0 1px rgba(0,229,255,.05);
      transform: translateY(20px) scale(.96);
      transition: transform .3s cubic-bezier(.22,1,.36,1);
    }
    #ff-discard-overlay.open .ff-modal { transform: translateY(0) scale(1); }
    .ff-modal-icon {
      width: 50px; height: 50px; border-radius: 14px; margin: 0 auto 16px;
      background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25);
      display: flex; align-items: center; justify-content: center; color: #f59e0b;
    }
    .ff-modal-icon svg { width: 22px; height: 22px; }
    .ff-modal-title {
      font-family: 'Syne', sans-serif;
      font-size: 1.1rem; font-weight: 800; letter-spacing: -.03em;
      color: #eaf4ff; margin-bottom: 10px;
    }
    .ff-modal-body {
      font-size: .83rem; font-weight: 300; color: #7aaad4;
      line-height: 1.55; margin-bottom: 24px;
    }
    .ff-modal-actions { display: flex; gap: 10px; }
    .ff-modal-stay, .ff-modal-leave {
      flex: 1; padding: 11px; border-radius: 10px;
      font-family: 'DM Sans', sans-serif; font-size: .85rem; font-weight: 600;
      cursor: pointer; border: none; transition: all .18s ease;
    }
    .ff-modal-stay {
      background: rgba(255,255,255,.06); color: #7aaad4;
      border: 1px solid rgba(41,121,255,.22);
    }
    .ff-modal-stay:hover  { background: rgba(255,255,255,.1); color: #eaf4ff; }
    .ff-modal-leave {
      background: linear-gradient(135deg,#f59e0b,#d97706); color: #020c1b;
      box-shadow: 0 3px 14px rgba(245,158,11,.32);
    }
    .ff-modal-leave:hover { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(245,158,11,.42); }
  `);

  let overlay = document.getElementById('ff-discard-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ff-discard-overlay';
    overlay.innerHTML = `
      <div class="ff-modal">
        <div class="ff-modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 class="ff-modal-title">Discard Changes?</h2>
        <p class="ff-modal-body">You have unsaved entries. If you leave now, everything you've typed will be lost.</p>
        <div class="ff-modal-actions">
          <button class="ff-modal-stay">Keep Editing</button>
          <button class="ff-modal-leave">Leave Anyway</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  requestAnimationFrame(() => overlay.classList.add('open'));
  const close = () => overlay.classList.remove('open');

  overlay.querySelector('.ff-modal-stay').onclick  = close;
  overlay.querySelector('.ff-modal-leave').onclick = () => { close(); onLeave(); };

  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
    if (e.key === 'Enter')  { close(); onLeave(); document.removeEventListener('keydown', handler); }
  });
}

function initUnsavedWarning() {
  const backBtn = $('.back-btn');
  const fields  = ['vehicle_name', 'license_plate', 'capacity']
    .map(id => document.getElementById(id)).filter(Boolean);

  let dirty = false;
  fields.forEach(input => input.addEventListener('input', () => { dirty = true; }));
  $('form[action="/add_vehicle"]')?.addEventListener('submit', () => { dirty = false; });

  // Native tab close / browser back
  window.addEventListener('beforeunload', e => {
    if (!dirty) return;
    e.preventDefault(); e.returnValue = '';
  });

  // Intercept the nav "Back to Dashboard" link
  backBtn?.addEventListener('click', e => {
    if (!dirty) return;
    e.preventDefault();
    showDiscardModal(() => { window.location.href = backBtn.getAttribute('href') || '/dashboard'; });
  });
}


/* ================================================================
   8.  CARD TILT PARALLAX
   ================================================================
   The glass card tilts up to ±6° to follow the mouse,
   giving a subtle premium 3-D depth effect.
   Automatically disabled for users with prefers-reduced-motion.
   ================================================================ */

function initCardTilt() {
  const card = $('.card');
  if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX = 6;

  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
    card.style.transition = 'transform .09s ease';
    card.style.transform  = `perspective(1000px) rotateX(${(-dy*MAX).toFixed(2)}deg) rotateY(${(dx*MAX).toFixed(2)}deg) scale(1.012)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .55s ease';
    card.style.transform  = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  });
}


/* ================================================================
   9.  TOAST NOTIFICATIONS
   ================================================================
   showToast(message, type, duration)
   Types: 'success' | 'error' | 'info'
   Toasts slide in from the bottom-right, stack vertically,
   auto-dismiss after `duration` ms, and have a manual close ×.
   ================================================================ */

let _toastWrap = null;

function getToastWrap() {
  if (_toastWrap) return _toastWrap;

  injectStyle('ff-toast', `
    #ff-toasts {
      position: fixed; bottom: 28px; right: 28px; z-index: 9998;
      display: flex; flex-direction: column; gap: 10px; pointer-events: none;
    }
    .ff-toast {
      display: flex; align-items: center; gap: 11px;
      padding: 13px 18px; border-radius: 13px;
      font-family: 'DM Sans', sans-serif; font-size: .85rem; font-weight: 400;
      color: #eaf4ff; max-width: 320px;
      background: rgba(7,20,50,.96); border: 1px solid rgba(41,121,255,.2);
      box-shadow: 0 8px 30px rgba(0,0,0,.45); pointer-events: all;
      opacity: 0; transform: translateX(110%);
      transition: opacity .32s cubic-bezier(.22,1,.36,1),
                  transform .32s cubic-bezier(.22,1,.36,1);
    }
    .ff-toast.show { opacity: 1; transform: translateX(0); }
    .ff-toast.hide { opacity: 0; transform: translateX(110%); }
    .ff-t-icon  { width: 17px; height: 17px; flex-shrink: 0; }
    .ff-t-msg   { flex: 1; line-height: 1.4; }
    .ff-t-close {
      background: none; border: none; cursor: pointer;
      color: #2e5278; padding: 2px; transition: color .15s;
      display: flex; align-items: center;
    }
    .ff-t-close:hover { color: #eaf4ff; }
    .ff-t-close svg { width: 13px; height: 13px; }
    .ff-toast.success { border-color: rgba(29,233,182,.35); }
    .ff-toast.success .ff-t-icon { color: #1de9b6; }
    .ff-toast.error   { border-color: rgba(255,83,112,.35); }
    .ff-toast.error   .ff-t-icon { color: #ff5370; }
    .ff-toast.info    { border-color: rgba(41,121,255,.35); }
    .ff-toast.info    .ff-t-icon { color: #2979ff; }
    @media (max-width:480px) {
      #ff-toasts { left: 16px; right: 16px; bottom: 20px; }
      .ff-toast  { max-width: 100%; }
    }
  `);

  _toastWrap = document.createElement('div');
  _toastWrap.id = 'ff-toasts';
  document.body.appendChild(_toastWrap);
  return _toastWrap;
}

const TOAST_ICON = {
  success: `<svg class="ff-t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg class="ff-t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:    `<svg class="ff-t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

/**
 * Show a floating toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [ms=4000]
 */
function showToast(message, type = 'info', ms = 4000) {
  const wrap  = getToastWrap();
  const toast = document.createElement('div');
  toast.className = `ff-toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    ${TOAST_ICON[type] || TOAST_ICON.info}
    <span class="ff-t-msg">${message}</span>
    <button class="ff-t-close" aria-label="Dismiss">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  wrap.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

  const dismiss = () => {
    toast.classList.replace('show', 'hide');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  const timer = setTimeout(dismiss, ms);
  toast.querySelector('.ff-t-close').onclick = () => { clearTimeout(timer); dismiss(); };
}


/* ================================================================
   10.  KEYBOARD SHORTCUTS
   ================================================================
   Alt + S  →  submit the form
   Alt + R  →  reset all fields and clear validation state
   ================================================================ */

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (!e.altKey) return;

    if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      showToast('Submitting via Alt + S…', 'info', 1800);
      setTimeout(() => $('form[action="/add_vehicle"]')?.requestSubmit(), 320);
    }

    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      const form = $('form[action="/add_vehicle"]');
      if (!form) return;
      form.reset();
      ['vehicle_name', 'license_plate', 'capacity']
        .map(id => document.getElementById(id)).filter(Boolean)
        .forEach(clearState);
      showToast('Form cleared.', 'info', 2000);
    }
  });
}


/* ================================================================
   11.  INIT
   ================================================================ */

function init() {
  initValidation();        // 2
  initPlateFormatter();    // 3
  initCharCounter();       // 4
  initCapacityHint();      // 5
  initFormSubmit();        // 6
  initUnsavedWarning();    // 7
  initCardTilt();          // 8
  initKeyboardShortcuts(); // 10

  showToast('Ready — fill in the details and click Add Vehicle.', 'info', 3500);
  console.log('[FleetFlow] add_vehicle.js ready ✓');
  console.log('  Alt + S = submit  |  Alt + R = clear form');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}