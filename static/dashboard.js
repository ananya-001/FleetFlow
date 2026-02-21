/**
 * ============================================================
 *  FleetFlow — Dashboard JavaScript
 *  dashboard.js
 *
 *  Features:
 *   1. Active sidebar link highlighting on click
 *   2. Logout confirmation popup
 *   3. Stat card fade-in animation on page load
 *   4. Sidebar toggle for mobile view
 *   5. Live clock in navbar
 *   6. Table row hover actions
 *   7. Notification badge dismiss
 * ============================================================
 */

'use strict';

/* ============================================================
   UTILITY HELPERS
   ============================================================ */

/**
 * Shorthand for document.querySelector
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element|null}
 */
const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * Shorthand for document.querySelectorAll (returns Array)
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element[]}
 */
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Add a CSS class temporarily, then remove it after a delay.
 * Useful for triggering one-shot animations.
 * @param {Element} el
 * @param {string} cls
 * @param {number} duration - ms
 */
function flashClass(el, cls, duration = 600) {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), duration);
}


/* ============================================================
   1. ACTIVE SIDEBAR LINK HIGHLIGHTING
   ============================================================
   When a nav link (excluding Logout) is clicked, remove the
   'active' class from all links and apply it to the clicked one.
   The active state persists until another link is clicked.
   ============================================================ */

function initSidebarNavigation() {
  const navLinks  = $$('.nav-link');
  const logoutLink = navLinks.find(link =>
    link.textContent.trim().toLowerCase().startsWith('logout')
  );

  navLinks.forEach(link => {
    // Skip logout — it has its own handler (see feature #2)
    if (link === logoutLink) return;

    link.addEventListener('click', function (e) {
      e.preventDefault(); // remove if links should navigate

      // Remove 'active' from every nav link
      navLinks.forEach(l => l.classList.remove('active'));

      // Apply 'active' to the clicked link
      this.classList.add('active');

      // On mobile, close the sidebar after navigation
      if (window.innerWidth <= 960) {
        closeSidebar();
      }
    });
  });
}


/* ============================================================
   2. LOGOUT CONFIRMATION POPUP
   ============================================================
   A lightweight custom modal — no alert() so it matches the
   dashboard's visual style. The modal is injected into the DOM
   on first use and reused on subsequent calls.
   ============================================================ */

/**
 * Creates and caches a confirmation modal in the DOM.
 * @returns {{ modal: Element, confirmBtn: Element, cancelBtn: Element }}
 */
function getOrCreateLogoutModal() {
  const MODAL_ID = 'ff-logout-modal';
  let modal = document.getElementById(MODAL_ID);

  if (!modal) {
    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'ff-modal-title');
    modal.innerHTML = `
      <div class="ff-modal-backdrop"></div>
      <div class="ff-modal-box" role="document">
        <div class="ff-modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
        <h2 class="ff-modal-title" id="ff-modal-title">Sign Out?</h2>
        <p class="ff-modal-body">
          You're about to log out of <strong>FleetFlow</strong>.<br>
          Any unsaved changes will be lost.
        </p>
        <div class="ff-modal-actions">
          <button class="ff-btn-cancel" id="ff-modal-cancel">Stay</button>
          <button class="ff-btn-confirm" id="ff-modal-confirm">Yes, Log Out</button>
        </div>
      </div>
    `;

    // ── Inject modal styles (scoped, no external CSS needed) ──
    const style = document.createElement('style');
    style.textContent = `
      #ff-logout-modal {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none;
        transition: opacity .25s ease;
      }
      #ff-logout-modal.visible {
        opacity: 1; pointer-events: all;
      }
      .ff-modal-backdrop {
        position: absolute; inset: 0;
        background: rgba(10, 22, 40, 0.55);
        backdrop-filter: blur(4px);
      }
      .ff-modal-box {
        position: relative; z-index: 1;
        background: #fff;
        border-radius: 18px;
        padding: 36px 32px 28px;
        max-width: 360px; width: 90%;
        text-align: center;
        box-shadow: 0 24px 64px rgba(10,22,40,.22), 0 4px 16px rgba(10,22,40,.1);
        transform: translateY(18px) scale(.97);
        transition: transform .28s cubic-bezier(.22,1,.36,1);
      }
      #ff-logout-modal.visible .ff-modal-box {
        transform: translateY(0) scale(1);
      }
      .ff-modal-icon {
        width: 52px; height: 52px; border-radius: 14px;
        background: rgba(244,63,94,.08);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 16px;
        color: #f43f5e;
      }
      .ff-modal-icon svg { width: 24px; height: 24px; }
      .ff-modal-title {
        font-family: 'Outfit', sans-serif;
        font-size: 1.2rem; font-weight: 800;
        color: #0a1628; margin-bottom: 10px; letter-spacing: -.03em;
      }
      .ff-modal-body {
        font-family: 'Outfit', sans-serif;
        font-size: .88rem; color: #4a6080; line-height: 1.55;
        margin-bottom: 24px;
      }
      .ff-modal-actions {
        display: flex; gap: 10px;
      }
      .ff-btn-cancel, .ff-btn-confirm {
        flex: 1; padding: 11px; border-radius: 10px;
        font-family: 'Outfit', sans-serif;
        font-size: .88rem; font-weight: 600;
        cursor: pointer; border: none; transition: all .18s ease;
      }
      .ff-btn-cancel {
        background: #f0f4fb; color: #4a6080;
        border: 1px solid #c8d6e8;
      }
      .ff-btn-cancel:hover { background: #e0e8f4; }
      .ff-btn-confirm {
        background: linear-gradient(135deg, #f43f5e, #be123c);
        color: #fff;
        box-shadow: 0 3px 12px rgba(244,63,94,.3);
      }
      .ff-btn-confirm:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(244,63,94,.4);
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);
  }

  return {
    modal,
    confirmBtn: document.getElementById('ff-modal-confirm'),
    cancelBtn:  document.getElementById('ff-modal-cancel'),
  };
}

/**
 * Show the logout confirmation modal.
 * Resolves true if user confirms, false if cancelled.
 * @returns {Promise<boolean>}
 */
function showLogoutModal() {
  return new Promise(resolve => {
    const { modal, confirmBtn, cancelBtn } = getOrCreateLogoutModal();

    const open = () => {
      modal.classList.add('visible');
      cancelBtn.focus();
    };

    const close = (result) => {
      modal.classList.remove('visible');
      // Clean up one-time listeners
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modal.querySelector('.ff-modal-backdrop')
           .removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    };

    const onConfirm = () => close(true);
    const onCancel  = () => close(false);
    const onKeydown = (e) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter')  close(true);
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modal.querySelector('.ff-modal-backdrop').addEventListener('click', onCancel);
    document.addEventListener('keydown', onKeydown);

    open();
  });
}

/**
 * Wire up the Logout link to trigger the confirmation modal.
 */
function initLogout() {
  const logoutLink = $$('.nav-link').find(link =>
    link.textContent.trim().toLowerCase().startsWith('logout')
  );

  if (!logoutLink) return;

  logoutLink.addEventListener('click', async function (e) {
    e.preventDefault();

    const confirmed = await showLogoutModal();

    if (confirmed) {
      // Replace with your actual logout/redirect logic:
      console.log('[FleetFlow] User confirmed logout.');
      // window.location.href = '/logout';
      // Or: document.cookie = ...; sessionStorage.clear(); etc.

      // Demo: show a brief feedback before "redirect"
      this.innerHTML = `
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Logging out…</span>
      `;
    } else {
      console.log('[FleetFlow] Logout cancelled.');
    }
  });
}


/* ============================================================
   3. STAT CARD FADE-IN ANIMATION ON PAGE LOAD
   ============================================================
   Uses IntersectionObserver so cards only animate when they
   enter the viewport. Falls back gracefully if IO is not
   available. A staggered delay is applied to each card so
   they cascade in one by one.
   ============================================================ */

function initStatCardAnimations() {
  const cards = $$('.stat-card');

  if (!cards.length) return;

  // Set initial hidden state via JS (preserves CSS for non-JS users)
  cards.forEach((card, i) => {
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(20px)';
    card.style.transition = `opacity .5s ease ${i * 100}ms, transform .5s cubic-bezier(.22,1,.36,1) ${i * 100}ms`;
  });

  const reveal = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target); // animate once only
      }
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(reveal, {
      threshold: 0.15,
    });
    cards.forEach(card => observer.observe(card));
  } else {
    // Fallback: reveal all immediately
    cards.forEach(card => {
      card.style.opacity   = '1';
      card.style.transform = 'translateY(0)';
    });
  }
}


/* ============================================================
   4. SIDEBAR TOGGLE (MOBILE VIEW)
   ============================================================
   Injects a hamburger toggle button into the navbar.
   On small screens (≤ 960px), the sidebar slides in/out.
   Clicking outside the sidebar also closes it.
   ============================================================ */

/** Opens the sidebar (mobile). */
function openSidebar() {
  const sidebar  = $('.sidebar');
  const overlay  = document.getElementById('ff-sidebar-overlay');
  const toggleBtn = document.getElementById('ff-sidebar-toggle');

  if (!sidebar) return;

  sidebar.classList.add('sidebar--open');
  if (overlay)   overlay.classList.add('visible');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close navigation');
  }
  document.body.style.overflow = 'hidden'; // prevent scroll behind overlay
}

/** Closes the sidebar (mobile). */
function closeSidebar() {
  const sidebar  = $('.sidebar');
  const overlay  = document.getElementById('ff-sidebar-overlay');
  const toggleBtn = document.getElementById('ff-sidebar-toggle');

  if (!sidebar) return;

  sidebar.classList.remove('sidebar--open');
  if (overlay)   overlay.classList.remove('visible');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open navigation');
  }
  document.body.style.overflow = '';
}

/**
 * Injects toggle button + overlay, then wires up all
 * open/close/outside-click/resize behaviours.
 */
function initSidebarToggle() {
  const navbar   = $('.navbar');
  const sidebar  = $('.sidebar');

  if (!navbar || !sidebar) return;

  // ── Inject hamburger button ──
  const toggleBtn = document.createElement('button');
  toggleBtn.id            = 'ff-sidebar-toggle';
  toggleBtn.setAttribute('aria-label', 'Open navigation');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-controls', 'ff-sidebar');
  toggleBtn.innerHTML = `
    <span class="ff-ham-line"></span>
    <span class="ff-ham-line"></span>
    <span class="ff-ham-line"></span>
  `;

  // ── Inject overlay ──
  const overlay = document.createElement('div');
  overlay.id = 'ff-sidebar-overlay';

  // ── Inject toggle styles ──
  const style = document.createElement('style');
  style.textContent = `
    #ff-sidebar-toggle {
      display: none;
      flex-direction: column; justify-content: center; align-items: center;
      gap: 5px; width: 38px; height: 38px; padding: 6px;
      background: none; border: 1px solid #c8d6e8;
      border-radius: 9px; cursor: pointer;
      margin-left: 12px; flex-shrink: 0;
      transition: border-color .2s, background .2s;
    }
    #ff-sidebar-toggle:hover {
      border-color: #1a6ef5;
      background: rgba(26,110,245,.06);
    }
    .ff-ham-line {
      display: block; width: 18px; height: 2px;
      background: #4a6080; border-radius: 2px;
      transition: transform .25s ease, opacity .2s ease;
    }
    #ff-sidebar-toggle[aria-expanded="true"] .ff-ham-line:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    #ff-sidebar-toggle[aria-expanded="true"] .ff-ham-line:nth-child(2) {
      opacity: 0;
    }
    #ff-sidebar-toggle[aria-expanded="true"] .ff-ham-line:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    #ff-sidebar-overlay {
      position: fixed; inset: 0; z-index: 90;
      background: rgba(10,22,40,.45);
      backdrop-filter: blur(2px);
      opacity: 0; pointer-events: none;
      transition: opacity .28s ease;
    }
    #ff-sidebar-overlay.visible {
      opacity: 1; pointer-events: all;
    }

    @media (max-width: 960px) {
      #ff-sidebar-toggle { display: flex; }

      .sidebar {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        height: 100vh !important;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform .3s cubic-bezier(.22,1,.36,1);
        box-shadow: none;
      }
      .sidebar--open {
        transform: translateX(0) !important;
        box-shadow: 4px 0 32px rgba(10,22,40,.25) !important;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // Insert toggle button right after the brand in the navbar
  const brand = $('.navbar-brand', navbar);
  if (brand) {
    brand.insertAdjacentElement('afterend', toggleBtn);
  } else {
    navbar.prepend(toggleBtn);
  }

  // Give sidebar an ID for aria-controls
  sidebar.id = 'ff-sidebar';

  // ── Event listeners ──
  toggleBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('sidebar--open');
    isOpen ? closeSidebar() : openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);

  // Close sidebar on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('sidebar--open')) {
      closeSidebar();
    }
  });

  // If resized to desktop, ensure sidebar isn't stuck closed/overlaid
  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('visible');
      document.body.style.overflow = '';
    }
  });
}


/* ============================================================
   5. LIVE CLOCK
   ============================================================
   Updates the .nav-date element every second with a formatted
   local date/time string so it stays current without a reload.
   ============================================================ */

function initLiveClock() {
  const clockEl = $('.nav-date');
  if (!clockEl) return;

  const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function updateClock() {
    const now = new Date();
    const day  = DAYS[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const mon  = MONTHS[now.getMonth()];
    const year = now.getFullYear();
    const h    = String(now.getHours()).padStart(2, '0');
    const m    = String(now.getMinutes()).padStart(2, '0');
    const s    = String(now.getSeconds()).padStart(2, '0');

    clockEl.textContent = `${day}, ${date} ${mon} ${year} — ${h}:${m}:${s}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}


/* ============================================================
   6. TABLE ROW — VIEW BUTTON FEEDBACK
   ============================================================
   Clicking a "View" action button flashes the row with a
   highlight colour to confirm the selection before the
   (real) navigation happens.
   ============================================================ */

function initTableActions() {
  const tableBody = $('tbody');
  if (!tableBody) return;

  // Inject row highlight style
  const style = document.createElement('style');
  style.textContent = `
    tbody tr.row-selected {
      background: rgba(26,110,245,.07) !important;
      transition: background .12s ease;
    }
  `;
  document.head.appendChild(style);

  // Delegate clicks on all action buttons
  tableBody.addEventListener('click', function (e) {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;

    e.preventDefault();

    const row       = btn.closest('tr');
    const vehicleId = row?.querySelector('.vehicle-id')?.textContent?.trim();

    // Highlight the row briefly
    if (row) {
      $$('tbody tr').forEach(r => r.classList.remove('row-selected'));
      row.classList.add('row-selected');
      setTimeout(() => row.classList.remove('row-selected'), 1200);
    }

    // Log or route — replace with real navigation
    console.log(`[FleetFlow] Viewing vehicle: ${vehicleId}`);
    // e.g.: window.location.href = `/vehicles/${vehicleId}`;
  });
}


/* ============================================================
   7. NOTIFICATION BADGE — DISMISS ON CLICK
   ============================================================
   Clicking the notification bell removes the red badge dot
   and briefly animates the bell icon.
   ============================================================ */

function initNotifications() {
  const notifBtn = $('.nav-notif');
  const badge    = notifBtn ? $('.notif-badge', notifBtn) : null;

  if (!notifBtn || !badge) return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes ff-bell-ring {
      0%,100% { transform: rotate(0); }
      15%     { transform: rotate(14deg); }
      30%     { transform: rotate(-12deg); }
      45%     { transform: rotate(8deg); }
      60%     { transform: rotate(-6deg); }
    }
    .nav-notif.ringing svg {
      animation: ff-bell-ring .55s ease;
    }
    .notif-badge {
      transition: transform .25s ease, opacity .25s ease;
    }
    .notif-badge.dismissed {
      transform: scale(0);
      opacity: 0;
    }
  `;
  document.head.appendChild(style);

  notifBtn.addEventListener('click', () => {
    // Ring the bell
    flashClass(notifBtn, 'ringing', 600);

    // Dismiss the badge dot after the ring
    setTimeout(() => badge.classList.add('dismissed'), 300);

    // In a real app, open a notifications panel here:
    console.log('[FleetFlow] Notifications opened — badge cleared.');
  });
}


/* ============================================================
   INIT — Run everything when the DOM is ready
   ============================================================ */

function init() {
  initStatCardAnimations();   // 3 — runs first so cards animate on load
  initSidebarNavigation();    // 1
  initLogout();               // 2
  initSidebarToggle();        // 4
  initLiveClock();            // 5 (bonus)
  initTableActions();         // 6 (bonus)
  initNotifications();        // 7 (bonus)

  console.log('[FleetFlow] Dashboard initialised ✓');
}

// Support both deferred scripts and inline <script> at bottom of <body>
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}