/* ==========================================================================
   وين الخدمة — Shared Application Script
   Modular, reusable vanilla JS used across every page.
   Sections:
   1. Utilities
   2. Header: mobile hamburger menu + user dropdown
   3. Toast notifications
   4. Modal windows
   5. Form validation helpers
   6. Password show/hide
   7. File upload with preview + validation
   8. Tabs
   9. Accordion (generic, reusable)
   10. Toggle switches
   11. Counters (stat number count-up)
   12. Page-specific bootstrapping
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. Utilities
     ------------------------------------------------------------------ */
  const qs = (sel, ctx) => (ctx || document).querySelector(sel);
  const qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Accepts Palestinian / international style numbers, e.g. +970599112233, 0599112233
  const PHONE_RE = /^(\+?\d{1,3}[\s-]?)?0?\d{9}$/;

  function isValidEmail(value) {
    return EMAIL_RE.test(value.trim());
  }

  function isValidPhone(value) {
    const cleaned = value.replace(/[\s-]/g, '');
    return PHONE_RE.test(cleaned) && cleaned.replace(/\D/g, '').length >= 9;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /* ------------------------------------------------------------------
     2. Header: mobile hamburger menu + user dropdown
     ------------------------------------------------------------------ */
  function initHeader() {
    const hamburger = qs('.hamburger-btn');
    const nav = qs('.main-nav');

    if (hamburger && nav) {
      hamburger.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
      });
    }

    const userMenu = qs('.user-menu');
    const trigger = qs('.user-menu-trigger');

    if (userMenu && trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(userMenu.classList.contains('open')));
      });

      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
          userMenu.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          userMenu.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ------------------------------------------------------------------
     3. Toast notifications
     ------------------------------------------------------------------ */
  function getToastContainer() {
    let container = qs('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  const TOAST_ICONS = {
    success:
      '<svg class="icon toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error:
      '<svg class="icon toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    info:
      '<svg class="icon toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 11v5M12 8h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  };

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3800;

    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      (TOAST_ICONS[type] || TOAST_ICONS.info) +
      '<span>' +
      message +
      '</span>' +
      '<button class="toast-close" aria-label="إغلاق الإشعار" type="button">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
      '</button>';

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const remove = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 220);
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    const timer = setTimeout(remove, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
  }

  window.WainApp = window.WainApp || {};
  window.WainApp.showToast = showToast;

  /* ------------------------------------------------------------------
     4. Modal windows
     ------------------------------------------------------------------ */
  function initModals() {
    qsa('[data-modal-open]').forEach((btn) => {
      const modal = qs('#' + btn.getAttribute('data-modal-open'));
      if (!modal) return;
      btn.addEventListener('click', () => openModal(modal));
    });

    qsa('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
      qsa('[data-modal-close]', overlay).forEach((btn) => {
        btn.addEventListener('click', () => closeModal(overlay));
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        qsa('.modal-overlay.open').forEach((overlay) => closeModal(overlay));
      }
    });
  }

  function openModal(modal) {
    modal.classList.add('open');
    const focusable = qs('button, a, input', modal);
    if (focusable) focusable.focus();
  }

  function closeModal(modal) {
    modal.classList.remove('open');
  }

  window.WainApp.openModal = openModal;
  window.WainApp.closeModal = closeModal;
  window.WainApp.incrementReportCount = () => incrementActivity(STORAGE_KEYS.reports, 1);
  window.WainApp.incrementLocationCount = () => incrementActivity(STORAGE_KEYS.locations, 1);
  window.WainApp.updateContributionStats = updateContributionStats;

  /* ------------------------------------------------------------------
     5. Form validation helpers
     ------------------------------------------------------------------ */
  function setFieldError(fieldEl, message) {
    fieldEl.classList.add('has-error');
    const control = qs('.field-control', fieldEl);
    if (control) control.classList.add('input-error');
    const msg = qs('.field-error-msg', fieldEl);
    if (msg) msg.textContent = message;
  }

  function clearFieldError(fieldEl) {
    fieldEl.classList.remove('has-error');
    const control = qs('.field-control', fieldEl);
    if (control) control.classList.remove('input-error');
  }

  function validateField(fieldEl) {
    const control = qs('.field-control', fieldEl);
    if (!control) return true;

    const value = (control.value || '').trim();
    const type = control.getAttribute('data-validate') || control.type;
    const required = control.hasAttribute('required');

    if (required && !value) {
      setFieldError(fieldEl, 'هذا الحقل مطلوب.');
      return false;
    }

    if (value && type === 'email' && !isValidEmail(value)) {
      setFieldError(fieldEl, 'يرجى إدخال بريد إلكتروني صحيح.');
      return false;
    }

    if (value && type === 'phone' && !isValidPhone(value)) {
      setFieldError(fieldEl, 'يرجى إدخال رقم هاتف صحيح (مثال: 0599112233).');
      return false;
    }

    if (value && control.tagName === 'TEXTAREA' && control.hasAttribute('minlength')) {
      const min = parseInt(control.getAttribute('minlength'), 10);
      if (value.length < min) {
        setFieldError(fieldEl, `يرجى كتابة وصف لا يقل عن ${min} حرفًا.`);
        return false;
      }
    }

    if (type === 'password-match') {
      const matchSelector = control.getAttribute('data-match');
      const matchControl = matchSelector ? qs(matchSelector) : null;
      if (matchControl && value !== matchControl.value.trim()) {
        setFieldError(fieldEl, 'كلمتا المرور غير متطابقتين.');
        return false;
      }
    }

    clearFieldError(fieldEl);
    return true;
  }

  function initFormValidation(form) {
    if (!form) return;

    const fields = qsa('.field', form);

    fields.forEach((fieldEl) => {
      const control = qs('.field-control', fieldEl);
      if (!control) return;
      control.addEventListener('blur', () => validateField(fieldEl));
      control.addEventListener('input', () => {
        if (fieldEl.classList.contains('has-error')) validateField(fieldEl);
      });
    });

    return fields;
  }

  function validateForm(form) {
    const fields = qsa('.field', form);
    let valid = true;
    let firstInvalid = null;

    fields.forEach((fieldEl) => {
      const ok = validateField(fieldEl);
      if (!ok) {
        valid = false;
        if (!firstInvalid) firstInvalid = fieldEl;
      }
    });

    if (firstInvalid) {
      const control = qs('.field-control', firstInvalid);
      if (control) control.focus();
    }

    return valid;
  }

  window.WainApp.validateForm = validateForm;

  /* ------------------------------------------------------------------
     6. Password show/hide
     ------------------------------------------------------------------ */
  function initPasswordToggles() {
    qsa('.password-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.password-field');
        const input = qs('input', wrapper);
        if (!input) return;
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        btn.setAttribute('aria-label', isHidden ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
        btn.innerHTML = isHidden ? eyeOffIcon() : eyeIcon();
      });
    });
  }

  function eyeIcon() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>';
  }

  function eyeOffIcon() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.3C10.2 5.1 11.1 5 12 5c7 0 10.5 7 10.5 7-.6 1.2-1.5 2.5-2.7 3.7M6.2 6.7C3.6 8.3 1.5 12 1.5 12s3.5 7 10.5 7c1.4 0 2.6-.3 3.7-.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* ------------------------------------------------------------------
     7. File upload with preview + validation
     ------------------------------------------------------------------ */
  function initFileUpload() {
    const box = qs('.upload-box');
    if (!box) return;

    const input = qs('input[type="file"]', box);
    const preview = qs('.upload-preview');
    const previewImg = preview ? qs('img', preview) : null;
    const previewName = preview ? qs('.upload-preview-name', preview) : null;
    const previewSize = preview ? qs('.upload-preview-size', preview) : null;
    const removeBtn = preview ? qs('.upload-remove', preview) : null;
    const errorMsg = qs('.upload-error');

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

    function showError(msg) {
      if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'flex';
      }
      box.classList.add('input-error');
    }

    function clearError() {
      if (errorMsg) {
        errorMsg.style.display = 'none';
      }
      box.classList.remove('input-error');
    }

    function handleFile(file) {
      if (!file) return;

      if (!ALLOWED_TYPES.includes(file.type)) {
        showError('صيغة الملف غير مدعومة. يرجى رفع صورة بصيغة JPG أو PNG.');
        return;
      }

      if (file.size > MAX_SIZE) {
        showError('حجم الملف كبير جدًا. الحد الأقصى هو 5 ميجابايت.');
        return;
      }

      clearError();

      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImg) previewImg.src = e.target.result;
        if (previewName) previewName.textContent = file.name;
        if (previewSize) previewSize.textContent = formatBytes(file.size);
        if (preview) preview.classList.add('show');
        box.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }

    box.addEventListener('click', () => input && input.click());
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input && input.click();
      }
    });

    if (input) {
      input.addEventListener('change', () => handleFile(input.files[0]));
    }

    ['dragenter', 'dragover'].forEach((evt) => {
      box.addEventListener(evt, (e) => {
        e.preventDefault();
        box.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((evt) => {
      box.addEventListener(evt, (e) => {
        e.preventDefault();
        box.classList.remove('dragover');
      });
    });

    box.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file && input) {
        // sync to the input so the form has the file too
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      }
      handleFile(file);
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (input) input.value = '';
        if (preview) preview.classList.remove('show');
        box.style.display = 'flex';
        clearError();
      });
    }
  }

  /* ------------------------------------------------------------------
     8. Tabs
     ------------------------------------------------------------------ */
  function initTabs() {
    const tabButtons = qsa('.tab-btn');
    if (!tabButtons.length) return;

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetHref = btn.getAttribute('data-tab-href');
        // If the tab links to a different page, let navigation happen normally.
        if (targetHref) {
          window.location.href = targetHref;
          return;
        }

        const targetId = btn.getAttribute('data-tab-target');
        if (!targetId) return;

        tabButtons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        qsa('.tab-content').forEach((panel) => panel.classList.remove('active'));
        const target = qs('#' + targetId);
        if (target) target.classList.add('active');
      });
    });
  }

  /* ------------------------------------------------------------------
     9. Accordion (generic, reusable across future pages)
     ------------------------------------------------------------------ */
  function initAccordions() {
    qsa('[data-accordion-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const panelId = trigger.getAttribute('data-accordion-trigger');
        const panel = qs('#' + panelId);
        if (!panel) return;
        const isOpen = panel.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(isOpen));
        panel.style.maxHeight = isOpen ? panel.scrollHeight + 'px' : null;
      });
    });
  }

  /* ------------------------------------------------------------------
     10. Toggle switches
     ------------------------------------------------------------------ */
  function initToggles() {
    qsa('.toggle-switch input').forEach((input) => {
      input.addEventListener('change', () => {
        const label = input.closest('.pref-row');
        const name = label ? qs('.pref-title', label).textContent.trim() : 'الإعداد';
        showToast(
          (input.checked ? 'تم تفعيل: ' : 'تم إيقاف: ') + name,
          input.checked ? 'success' : 'info',
          2400
        );
      });
    });
  }

  /* ------------------------------------------------------------------
     11. Counters (stat number count-up)
     ------------------------------------------------------------------ */
  function animateCounter(el, target) {
    if (!el) return;
    target = Math.max(0, parseInt(target, 10) || 0);
    const duration = 700;
    const startValue = parseInt(el.textContent, 10) || 0;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(startValue + (target - startValue) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    }

    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = qsa('.stat-number[data-count]');
    if (!counters.length) return;

    counters.forEach((el) => {
      animateCounter(el, el.getAttribute('data-count'));
    });
  }


  /* ------------------------------------------------------------------
     12. Frontend persistence: favorites, profile data, preferences
     ------------------------------------------------------------------ */
  const STORAGE_KEYS = {
    profile: 'wain_profile_data',
    preferences: 'wain_account_preferences',
    favorites: 'wain_favorites',
    reports: 'wain_reports_count',
    locations: 'wain_locations_count'
  };

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function getStoredProfile() {
    return readStorage(STORAGE_KEYS.profile, {
      name: 'أحمد محمد محمود',
      phone: '+970599112233',
      email: 'ahmad.gaza@example.com'
    });
  }

  function setStoredProfile(profile) {
    return writeStorage(STORAGE_KEYS.profile, profile);
  }

  function normalizeFavorites(value) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.items)) return value.items;
    if (value && Array.isArray(value.favorites)) return value.favorites;
    return null;
  }

  function getFavoritesCount() {
    // Main favorites store used by this frontend.
    const stored = normalizeFavorites(readStorage(STORAGE_KEYS.favorites, []));
    if (stored) return stored.length;

    // Compatibility with other frontend pages that may already store
    // favorites under a different key.
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || '';
        if (!/(favorite|favorites|fav|مفضل|المفضلة)/i.test(key)) continue;
        if (key === STORAGE_KEYS.favorites) continue;

        const raw = localStorage.getItem(key);
        if (raw == null) continue;

        try {
          const parsed = JSON.parse(raw);
          const items = normalizeFavorites(parsed);
          if (items) total += items.length;
          else if (typeof parsed === 'number' && Number.isFinite(parsed)) total += parsed;
        } catch (_) {
          const number = Number(raw);
          if (Number.isFinite(number)) total += number;
        }
      }
    } catch (_) {}

    return total;
  }

  function getStatElements() {
    const result = { favorites: [], reports: [], locations: [] };

    qsa('.stat-card').forEach((card) => {
      const label = (qs('.stat-label', card)?.textContent || '').trim();
      const number = qs('.stat-number', card);
      if (!number) return;

      if (label.includes('خدمات محفوظة بالمفضلة')) result.favorites.push(number);
      else if (label.includes('بلاغات وتحديثات')) result.reports.push(number);
      else if (label.includes('مواقع قمت بإضافتها')) result.locations.push(number);
    });

    // Also support future pages that add explicit data-stat attributes.
    qsa('.stat-number[data-stat="favorites"]').forEach((el) => { if (!result.favorites.includes(el)) result.favorites.push(el); });
    qsa('.stat-number[data-stat="reports"]').forEach((el) => { if (!result.reports.includes(el)) result.reports.push(el); });
    qsa('.stat-number[data-stat="locations"]').forEach((el) => { if (!result.locations.includes(el)) result.locations.push(el); });

    return result;
  }

  function getActivityCount(key, fallback) {
    const stored = Number(readStorage(key, NaN));
    if (Number.isFinite(stored) && stored >= 0) return Math.floor(stored);

    // Preserve the numbers already shown in the design on first run.
    const initial = Math.max(0, parseInt(fallback, 10) || 0);
    writeStorage(key, initial);
    return initial;
  }

  function incrementActivity(key, amount) {
    const current = getActivityCount(key, 0);
    const next = current + (parseInt(amount, 10) || 1);
    writeStorage(key, next);
    updateContributionStats();
    return next;
  }

  function updateContributionStats() {
    const stats = getStatElements();
    const favoriteCount = getFavoritesCount();
    const reportFallback = stats.reports[0] ? parseInt(stats.reports[0].getAttribute('data-count'), 10) || 0 : 0;
    const locationFallback = stats.locations[0] ? parseInt(stats.locations[0].getAttribute('data-count'), 10) || 0 : 0;
    const reportCount = getActivityCount(STORAGE_KEYS.reports, reportFallback);
    const locationCount = getActivityCount(STORAGE_KEYS.locations, locationFallback);

    stats.favorites.forEach((el) => {
      el.setAttribute('data-count', String(favoriteCount));
      animateCounter(el, favoriteCount);
    });
    stats.reports.forEach((el) => {
      el.setAttribute('data-count', String(reportCount));
      animateCounter(el, reportCount);
    });
    stats.locations.forEach((el) => {
      el.setAttribute('data-count', String(locationCount));
      animateCounter(el, locationCount);
    });
  }

  function ensureFavoritesBadgeStyles() {
    if (document.getElementById('wain-favorites-badge-styles')) return;

    const style = document.createElement('style');
    style.id = 'wain-favorites-badge-styles';
    style.textContent = `
      .icon-btn[aria-label="المفضلة"] { position: relative; }
      .icon-btn[aria-label="المفضلة"] .favorites-count {
        position: absolute;
        top: -5px;
        left: -5px;
        min-width: 17px;
        height: 17px;
        padding: 0 4px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        background: #c62828;
        color: #fff;
        font: 700 10px/1 Arial, sans-serif;
        pointer-events: none;
        border: 2px solid #fff;
      }
    `;
    document.head.appendChild(style);
  }

  function updateFavoritesCount() {
    ensureFavoritesBadgeStyles();
    const count = getFavoritesCount();

    qsa('.icon-btn[aria-label="المفضلة"]').forEach((button) => {
      let badge = qs('.favorites-count', button);

      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'favorites-count';
          badge.setAttribute('aria-hidden', 'true');
          button.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : String(count);
        button.classList.add('has-favorites');
      } else {
        if (badge) badge.remove();
        button.classList.remove('has-favorites');
      }

      button.setAttribute('data-favorites-count', String(count));
      button.title = count ? `المفضلة (${count})` : 'المفضلة';
    });

    updateContributionStats();
    return count;
  }

  function initFavorites() {
    updateFavoritesCount();

    // Keep the number synchronized when another tab/page changes localStorage.
    window.addEventListener('storage', (event) => {
      if (!event.key || /favorite|favorites|fav|مفضل|المفضلة/i.test(event.key)) {
        updateFavoritesCount();
      }
    });

    // Some pages update localStorage in the same tab; refresh periodically
    // without changing any existing favorite behavior.
    let lastCount = getFavoritesCount();
    window.setInterval(() => {
      const currentCount = getFavoritesCount();
      if (currentCount !== lastCount) {
        lastCount = currentCount;
        updateFavoritesCount();
      }
    }, 500);
  }

  function applyStoredProfile() {
    const profile = getStoredProfile();

    qsa('#full-name').forEach((el) => { if (profile.name) el.value = profile.name; });
    qsa('#phone-number').forEach((el) => { if (profile.phone) el.value = profile.phone; });
    qsa('#email-address').forEach((el) => { if (profile.email) el.value = profile.email; });

    qsa('.profile-name').forEach((el) => {
      if (profile.name) el.textContent = profile.name;
    });

    qsa('.profile-contact').forEach((el) => {
      const spans = qsa('span', el);
      if (spans[0] && profile.phone) spans[0].textContent = profile.phone;
      if (spans[1] && profile.email) spans[1].textContent = profile.email;
    });
  }

  function initPersistentPreferences() {
    const defaults = {
      liveUpdates: true,
      reportApproval: true,
      gps: true
    };
    const saved = Object.assign({}, defaults, readStorage(STORAGE_KEYS.preferences, {}));

    const fields = {
      liveUpdates: qs('#pref-live-updates'),
      reportApproval: qs('#pref-report-approval'),
      gps: qs('#pref-gps')
    };

    Object.keys(fields).forEach((key) => {
      const input = fields[key];
      if (!input) return;

      input.checked = Boolean(saved[key]);
      input.addEventListener('change', () => {
        saved[key] = input.checked;
        writeStorage(STORAGE_KEYS.preferences, saved);
      });
    });
  }

  /* ------------------------------------------------------------------
     12. Page-specific bootstrapping
     ------------------------------------------------------------------ */

  // --- Report form page ---
  function initReportForm() {
    const form = qs('#report-form');
    if (!form) return;

    initFormValidation(form);
    initFileUpload();

    const cancelBtn = qs('#cancel-btn');
    const cancelModal = qs('#cancel-modal');

    if (cancelBtn && cancelModal) {
      cancelBtn.addEventListener('click', () => openModal(cancelModal));
    }

    const confirmCancelBtn = qs('#confirm-cancel-btn');
    if (confirmCancelBtn) {
      confirmCancelBtn.addEventListener('click', () => {
        form.reset();
        qsa('.field', form).forEach(clearFieldError);
        const preview = qs('.upload-preview');
        const box = qs('.upload-box');
        if (preview) preview.classList.remove('show');
        if (box) box.style.display = 'flex';
        closeModal(cancelModal);
        showToast('تم إلغاء البلاغ ومسح البيانات المدخلة.', 'info');
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm(form)) {
        showToast('يرجى تعبئة كافة الحقول المطلوبة بشكل صحيح.', 'error');
        return;
      }

      const submitBtn = qs('#submit-btn');
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      // Simulate network request / server-side audit trigger.
      setTimeout(() => {
        // Count a submitted report/update only after the form passes validation.
        incrementActivity(STORAGE_KEYS.reports, 1);
        window.location.href = 'success.html';
      }, 1400);
    });
  }

  // --- Profile edit page ---
  function initProfileEditForm() {
    const form = qs('#profile-edit-form');
    if (!form) return;

    applyStoredProfile();
    initFormValidation(form);

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm(form)) {
        showToast('يرجى تصحيح الأخطاء قبل الحفظ.', 'error');
        return;
      }

      const submitBtn = qs('#save-profile-btn');
      const profile = {
        name: qs('#full-name') ? qs('#full-name').value.trim() : '',
        phone: qs('#phone-number') ? qs('#phone-number').value.trim() : '',
        email: qs('#email-address') ? qs('#email-address').value.trim() : ''
      };

      if (!setStoredProfile(profile)) {
        showToast('تعذر حفظ التعديلات على هذا الجهاز.', 'error');
        return;
      }

      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        applyStoredProfile();
        showToast('تم حفظ التعديلات الشخصية بنجاح.', 'success');
      }, 250);
    });

    const cancelEditLink = qs('#cancel-edit-link');
    if (cancelEditLink) {
      cancelEditLink.addEventListener('click', () => {
        showToast('تم إلغاء التعديل.', 'info', 2200);
      });
    }
  }

  // --- Security / account settings page ---
  function initSecurityForm() {
    const form = qs('#security-form');
    if (!form) return;

    initFormValidation(form);
    initPersistentPreferences();

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm(form)) {
        showToast('يرجى مراجعة الحقول المظللة بالأحمر.', 'error');
        return;
      }

      const submitBtn = qs('#change-password-btn');
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        form.reset();
        showToast('تم تغيير الرقم السري بنجاح.', 'success');
      }, 1100);
    });

    const logoutBtn = qs('#logout-btn');
    const logoutModal = qs('#logout-modal');
    if (logoutBtn && logoutModal) {
      logoutBtn.addEventListener('click', () => openModal(logoutModal));
    }

    const confirmLogoutBtn = qs('#confirm-logout-btn');
    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener('click', () => {
        closeModal(logoutModal);
        if (window.WainAuth) {
          window.WainAuth.logoutUser();
        }
      });
    }
  }

  /* ------------------------------------------------------------------
     Init on DOM ready
     ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initModals();
    initPasswordToggles();
    initTabs();
    initAccordions();
    initToggles();
    initCounters();
    initFavorites();
    updateContributionStats();
    applyStoredProfile();

    initReportForm();
    initProfileEditForm();
    initSecurityForm();
  });
})();
