/* 
   WIN AL-KHIDMEH (وين الخدمة) — Shared Script
   Single JS file used across every page of the project.
   Modular, reusable, vanilla JS only.
   */

document.addEventListener('DOMContentLoaded', () => {
  syncWinDBServices();
  initMobileDrawer();
  initDropdowns();
  initActiveNav();
  initTabs();
  initAccordion();
  initModals();
  initFavorites();
  initPasswordToggles();
  initFileUploads();
  initCounters();
  initSwitches();
  initSearchFilter();
  initAlertBanner();
  initFormValidation();
  initAssistantChat();
  initReportForm();
  initServiceRequestSubmit();
  initIssueReportModal();
  initLoadingButtons();
  initMapInteractions();
  initManualLocationCities();
  initRealLocationButtons();
  initLeafletMap();
  initExploreFilters();
  initServiceDeepLink();
  initCategoryLinksFromQuery();
  initProfileForm();
  initReportDetailLinks();
  renderSavedGrid();
  injectReportButtons();
  renderMyReports();
  renderMyServiceRequests();
});

/*
   1. Mobile drawer (hamburger menu)
   */
function initMobileDrawer(){
  const burger  = document.querySelector('[data-hamburger]');
  const drawer  = document.querySelector('[data-drawer]');
  const overlay = document.querySelector('[data-drawer-overlay]');
  if(!burger || !drawer || !overlay) return;

  const close = () => {
    burger.classList.remove('open');
    drawer.classList.remove('open');
    overlay.classList.remove('show');
    burger.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    burger.classList.add('open');
    drawer.classList.add('open');
    overlay.classList.add('show');
    burger.setAttribute('aria-expanded', 'true');
  };

  burger.addEventListener('click', () => {
    drawer.classList.contains('open') ? close() : open();
  });
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
}

/* =========================================================
   2. Dropdown menus (user chip, etc.)
   ========================================================= */
function initDropdowns(){
  const triggers = document.querySelectorAll('[data-dropdown-trigger]');
  triggers.forEach(trigger => {
    const targetId = trigger.getAttribute('data-dropdown-trigger');
    const menu = document.getElementById(targetId);
    if(!menu) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('show');
      closeAllDropdowns();
      if(!isOpen){
        menu.classList.add('show');
        trigger.classList.add('open');
      }
    });
  });

  document.addEventListener('click', closeAllDropdowns);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeAllDropdowns(); });

  function closeAllDropdowns(){
    document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('[data-dropdown-trigger].open').forEach(t => t.classList.remove('open'));
  }
}

/* =========================================================
   3. Active navigation state (based on current file name)
   ========================================================= */
function initActiveNav(){
  const current = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('http')) return;
    if(href === current || (current === '' && href === 'index.html')){
      link.classList.add('active');
    }
  });
}

/* =========================================================
   4. Tabs
   ========================================================= */
function initTabs(){
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const buttons = group.querySelectorAll('[data-tab]');
    const panelWrap = document.querySelector(group.getAttribute('data-tabs-target') || '');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetPanel = btn.getAttribute('data-tab');
        const panels = panelWrap ? panelWrap.querySelectorAll('.tab-panel') : document.querySelectorAll('.tab-panel');
        panels.forEach(p => p.classList.toggle('active', p.id === targetPanel));
      });
      btn.addEventListener('keydown', e => {
        if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
          const arr = Array.from(buttons);
          const idx = arr.indexOf(btn);
          const next = e.key === 'ArrowRight' ? arr[(idx+1)%arr.length] : arr[(idx-1+arr.length)%arr.length];
          next.focus(); next.click();
        }
      });
    });
  });
}

/* =========================================================
   5. Accordion
   ========================================================= */
function initAccordion(){
  document.querySelectorAll('.accordion-item .accordion-head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const willOpen = !item.classList.contains('open');

      item.classList.toggle('open', willOpen);
      body.style.maxHeight = willOpen ? body.scrollHeight + 'px' : 0;
      head.setAttribute('aria-expanded', String(willOpen));
    });
  });
}

/* =========================================================
   6. Modals
   ========================================================= */
function initModals(){
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal-open')));
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(overlay); });
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      document.querySelectorAll('.modal-overlay.show').forEach(closeModal);
    }
  });
}
function openModal(id){
  const modal = document.getElementById(id);
  if(!modal) return;
  modal.classList.add('show');
  const focusable = modal.querySelector('input, select, textarea, button');
  if(focusable) focusable.focus();
}
function closeModal(overlay){
  if(overlay) overlay.classList.remove('show');
}

/* =========================================================
   0. Shared services data + favorites persistence (localStorage)
   Used by: explore.html (grid + map), assistant.html (chat search
   results), saved.html (المفضلة). Keeping this in one place means
   a service favorited from any page shows up correctly everywhere.
   ========================================================= */
const SERVICES = [
  { id:'svc-1', category:'pharmacy', tag:'صيدلية', status:'open', statusLabel:'متوفر ومفتوح',
    title:'صيدلية العودة المركزية', gov:'الوسطى', lat:31.4180, lng:34.3512,
    desc:'توفر الأدوية الأساسية والمضادات الحيوية وحليب الأطفال ومستلزمات الإسعافات الأولية.',
    meta:['📍الوسطى، دير البلح، وسط بلد - قرب مسجد البلد القديم','🕘 من 8:00 صباحاً حتى 6:00 مساءً'],
    img:'img/صيدلية العودة المركزية.png' },
  { id:'svc-2', category:'bakery', tag:'مخبز', status:'busy', statusLabel:'مزدحم جداً',
    title:'مخبز الهدى الآلي', gov:'غزة', lat:31.5000, lng:34.4660,
    desc:'يقدم كافة أنواع الخبز العربي والحلويات والمعجنات الطازجة على مدار الساعة.',
    meta:['📍 حي نزال، عمان — 1.2 كم'],
    img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=60' },
  { id:'svc-3', category:'water', tag:'نقطة مياه', status:'open', statusLabel:'متوفر ومفتوح',
    title:'محطة تحلية مياه اليرموك', gov:'غزة', lat:31.5228, lng:34.4396,
    desc:'نقطة مجانية لتعبئة المياه الصالحة للشرب (المحلاة). تعمل بمولد طاقة عند الحاجة.',
    meta:['📍 غزة.غزة.الرمال الشمالي','🕘 من 9:00 صباحاً حتى 3:00 مساءً'],
    img:'img/محطة تحلية مياه اليرموك.png' },
  { id:'svc-4', category:'power', tag:'نقطة شحن كهرباء', status:'open', statusLabel:'متوفر ومفتوح',
    title:'نقطة شحن كهرباء "نور غزة"', gov:'الوسطى', lat:31.4540, lng:34.3970,
    desc:'شحن الهواتف، البطاريات، والأجهزة الطبية باستخدام ألواح الطاقة الشمسية مجاناً للعائلات النازحة.',
    meta:['📍 الوسطى . النصيرات .مخيم2','🕘 من 9:00 صباحاً حتى 5:00 مساءً'],
    img:'img/نقطة شحن كهرباء _نور غزة_ (1).png' },
  { id:'svc-5', category:'hospital', tag:'عيادة ومستشفى', status:'busy', statusLabel:'مزدحم جداً',
    title:'مستشفى شهداء الأقصى - قسم العيادات الخارجية', gov:'الوسطى', lat:31.4189, lng:34.3567,
    desc:'تقديم الخدمات الطبية الطارئة، غيار الجروح، عيادة الأطفال، وعيادة الباطنة.',
    meta:['📍 الوسطى .دير البلح.طريق صلاح الدين الرئيسي','🕘 على مدار 24 ساعة (الطوارئ)، العيادات من 8:00'],
    img:'img/مستشفى شهداء الأقصى - قسم العيادات الخارجية.png' },
  { id:'svc-6', category:'storage', tag:'مركز توزيع مساعدات', status:'closed', statusLabel:'مغلق حالياً',
    title:'مركز توزيع مساعدات', gov:'الوسطى', lat:31.4145, lng:34.3489,
    desc:'مركز توزيع مساعدات الأونروا - مدرسة بنات دير البلح',
    meta:['📍 الوسطى .دير البلح. منطقة حكر الجامع','🕘 من 8:30 صباحاً حتى 2:30 مساءً'],
    img:'img/مركز توزيع مساعدات الأونروا - مدرسة بنات دير البلح.png' },
  { id:'svc-7', category:'storage', tag:'مركز توزيع مساعدات', status:'closed', statusLabel:'مغلق حالياً',
    title:'مركز توزيع مساعدات', gov:'الوسطى', lat:31.4160, lng:34.3475,
    desc:'مركز توزيع مساعدات الأونروا - مدرسة بنات دير البلح',
    meta:['📍 الوسطى .دير البلح. منطقة حكر الجامع','🕘 من 8:30 صباحاً حتى 2:30 مساءً'],
    img:'img/صيدلية القدس الحديثة.png' },
  { id:'svc-8', category:'bakery', tag:'مخبز', status:'closed', statusLabel:'مغلق حالياً',
    title:'مخبز العائلات اليدوي', gov:'الشمال', lat:31.5280, lng:34.4830,
    desc:'مخبز شامي يدوي يعمل بالحطب لإنتاج أرغفة الخبز الطازجة بأسعار مدعومة.',
    meta:['📍 شمال غزة .جباليا. معسكر جباليا - مفترق الترنّس','🕘 من 6:00 صباحاً حتى 2:00 مساءً'],
    img:'img/مخبز العائلات اليدوي.png' },
  { id:'svc-9', category:'water', tag:'نقطة مياه', status:'open', statusLabel:'متوفر ومفتوح',
    title:'نقطة تعبئة مياه آبار السبيل', gov:'رفح', lat:31.2990, lng:34.2390,
    desc:'مياه غسيل واستخدام منزلي (غير محلاة) يتم تعبئتها مجاناً برعاية لجان الأحياء.',
    meta:['📍رفح.رفح.حي تل السلطان','🕘 من 10:00 صباحاً حتى 4:00 مساءً'],
    img:'img/نقطة تعبئة مياه آبار السبيل.png' }
];
window.SERVICES = SERVICES;

/* =========================================================
   0.b GPS + Haversine distance (real calculation, no more
   decorative "0.8 كم" placeholders). Used by explore.html,
   index.html and the Leaflet map to compute + display real
   distances from the user's location to every service.
   ========================================================= */
let userLocation = null; // { lat, lng } — set once GPS succeeds
window.getUserLocation = () => userLocation;

function calculateDistance(lat1, lon1, lat2, lon2){
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
window.calculateDistance = calculateDistance;

function formatDistance(km){
  return km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`;
}

// Recomputes .distance on every SERVICES entry, updates any
// [data-distance-for] badges already in the DOM, and returns the
// services sorted nearest-first so callers can re-render/re-sort.
function updateDistancesFromUserLocation(){
  if(!userLocation) return SERVICES;
  SERVICES.forEach(s => {
    s.distance = calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng);
  });
  document.querySelectorAll('[data-service-id]').forEach(el => {
    const id = el.getAttribute('data-service-id');
    const service = SERVICES.find(s => s.id === id);
    if(!service || service.distance == null) return;
    let badge = el.querySelector('[data-distance-badge]');
    if(!badge && el.classList.contains('service-card')){
      const meta = el.querySelector('.service-meta') || el.querySelector('.service-body');
      if(meta){
        badge = document.createElement('p');
        badge.className = 'service-meta';
        badge.setAttribute('data-distance-badge', '1');
        meta.parentNode.insertBefore(badge, meta);
      }
    }
    if(badge) badge.textContent = `📍 يبعد حوالي ${formatDistance(service.distance)}`;
  });
  return SERVICES.slice().sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}
window.updateDistancesFromUserLocation = updateDistancesFromUserLocation;

// Re-orders the actual .service-card elements inside a grid to
// match nearest-first order, once distances are known.
function reorderCardsByDistance(gridSelector){
  if(!userLocation) return;
  const grid = document.querySelector(gridSelector);
  if(!grid) return;
  const sorted = updateDistancesFromUserLocation();
  sorted.forEach(s => {
    const card = grid.querySelector(`.service-card[data-service-id="${s.id}"]`);
    if(card) grid.appendChild(card);
  });
}

function requestRealGeolocation(onSuccess, onError){
  if(!navigator.geolocation){
    showToast('المتصفح الحالي لا يدعم تحديد الموقع الجغرافي (GPS)', 'error');
    if(onError) onError('unsupported');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      if(onSuccess) onSuccess(userLocation);
    },
    (err) => {
      let message = 'تعذر تحديد موقعك، يرجى تحديد المنطقة يدوياً.';
      if(err.code === err.PERMISSION_DENIED) message = 'تم رفض إذن الوصول للموقع. يرجى السماح بالوصول أو تحديد المنطقة يدوياً.';
      else if(err.code === err.POSITION_UNAVAILABLE) message = 'الموقع الجغرافي غير متوفر حالياً. يرجى تحديد المنطقة يدوياً.';
      else if(err.code === err.TIMEOUT) message = 'انتهت مهلة تحديد الموقع. يرجى المحاولة مجدداً أو التحديد يدوياً.';
      showToast(message, 'error');
      if(onError) onError(err.code);
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}
window.requestRealGeolocation = requestRealGeolocation;

/* =========================================================
   0.c "موقعي" button — real GPS flow (index.html + explore.html)
   Success  -> compute + show real distances, sort nearest-first.
   Failure  -> fall back to the manual governorate/city modal.
   ========================================================= */
function initRealLocationButtons(){
  document.querySelectorAll('[data-open-location-modal]').forEach(btn => {
    if(btn.dataset.geoBound) return;
    btn.dataset.geoBound = '1';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = '.7';

      requestRealGeolocation(
        () => {
          btn.disabled = false;
          btn.style.opacity = '';
          const alert = document.getElementById('gpsAlert');
          if(alert) alert.style.display = 'none';
          reorderCardsByDistance('#resultsGrid');
          reorderCardsByDistance('.services-grid');
          if(typeof placeUserMarkerOnMap === 'function') placeUserMarkerOnMap();
          showToast('تم تحديد موقعك بنجاح، تم ترتيب الخدمات حسب الأقرب إليك', 'success');
        },
        () => {
          btn.disabled = false;
          btn.style.opacity = '';
          const alert = document.getElementById('gpsAlert');
          if(alert) alert.style.display = '';
          openModal('locationModal');
        }
      );
    });
  });
}

const FAVORITES_KEY = 'winKhidmeh:favorites';
const DEFAULT_FAVORITES = ['svc-1', 'svc-4', 'svc-9']; // matches the hearts pre-filled in the original design

function getFavorites(){
  try{
    const raw = localStorage.getItem(FAVORITES_KEY);
    if(raw === null){
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(DEFAULT_FAVORITES));
      return DEFAULT_FAVORITES.slice();
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){ return []; }
}
function isFavorite(id){ return getFavorites().includes(id); }
function toggleFavorite(id){
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if(idx > -1){ favs.splice(idx, 1); } else { favs.push(id); }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs.includes(id);
}
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;

/* =========================================================
   7. Favorites (heart buttons) + Toast feedback
   Reads/writes real state in localStorage so a favorite made on
   any page (explore, saved, assistant chat) stays saved and is
   reflected consistently everywhere.
   ========================================================= */
function initFavorites(){
  document.querySelectorAll('.fav-btn').forEach(btn => {
    const id = btn.getAttribute('data-service-id')
      || (btn.closest('[data-service-id]') && btn.closest('[data-service-id]').getAttribute('data-service-id'));

    if(id){
      btn.classList.toggle('active', isFavorite(id));
    }

    if(btn.dataset.favBound) return; // already wired up, avoid double-binding on re-render
    btn.dataset.favBound = '1';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if(id){
        const nowFav = toggleFavorite(id);
        document.querySelectorAll(`[data-service-id="${id}"] .fav-btn, .fav-btn[data-service-id="${id}"]`)
          .forEach(b => b.classList.toggle('active', nowFav));
        showToast(nowFav ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة', nowFav ? 'success' : 'default');
        if(typeof renderSavedGrid === 'function') renderSavedGrid();
        if(typeof toggleFavoriteRemote === 'function') toggleFavoriteRemote(id);
      } else {
        btn.classList.toggle('active');
        const isFav = btn.classList.contains('active');
        showToast(isFav ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة', isFav ? 'success' : 'default');
      }
    });
  });
}

/* =========================================================
   8. Toast notifications
   ========================================================= */
function showToast(message, type = 'default'){
  let stack = document.querySelector('.toast-stack');
  if(!stack){
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'default' ? type : ''}`.trim();
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}
window.showToast = showToast;

/* =========================================================
   9. Password show/hide
   ========================================================= */
function initPasswordToggles(){
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.password-wrap').querySelector('input');
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.setAttribute('aria-label', showing ? 'إظهار كلمة المرور' : 'إخفاء كلمة المرور');
      btn.innerHTML = showing
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.9 19.9 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.9 19.9 0 0 1-3.22 4.44M1 1l22 22"/></svg>';
    });
  });
}

/* =========================================================
   10. File upload with preview + validation
   ========================================================= */
function initFileUploads(){
  document.querySelectorAll('[data-upload]').forEach(box => {
    const input = box.querySelector('input[type="file"]');
    const previewWrap = document.querySelector(box.getAttribute('data-preview-target'));
    if(!input) return;

    const maxSizeMB = parseFloat(box.getAttribute('data-max-size')) || 5;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    box.addEventListener('click', () => input.click());
    box.addEventListener('dragover', e => { e.preventDefault(); box.classList.add('dragover'); });
    box.addEventListener('dragleave', () => box.classList.remove('dragover'));
    box.addEventListener('drop', e => {
      e.preventDefault();
      box.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
    input.addEventListener('change', () => handleFiles(input.files));

    function handleFiles(fileList){
      const files = Array.from(fileList);
      files.forEach(file => {
        if(!allowedTypes.includes(file.type)){
          showToast('نوع الملف غير مدعوم. الرجاء رفع صورة (JPG, PNG, WEBP)', 'error');
          return;
        }
        if(file.size > maxSizeMB * 1024 * 1024){
          showToast(`حجم الملف يتجاوز ${maxSizeMB} ميجابايت`, 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          if(!previewWrap) return;
          const thumb = document.createElement('div');
          thumb.className = 'preview-thumb';
          thumb.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة"><button type="button" aria-label="حذف الصورة">×</button>`;
          thumb.querySelector('button').addEventListener('click', () => thumb.remove());
          previewWrap.appendChild(thumb);
        };
        reader.readAsDataURL(file);
      });
      showToast('تم رفع الملف بنجاح', 'success');
    }
  });
}

/* =========================================================
   11. Counters (+/-)
   ========================================================= */
function initCounters(){
  document.querySelectorAll('.counter').forEach(counter => {
    const valueEl = counter.querySelector('.count-val');
    const min = parseInt(counter.getAttribute('data-min')) || 0;
    const max = parseInt(counter.getAttribute('data-max')) || 99;
    counter.querySelector('[data-step="down"]').addEventListener('click', () => {
      let v = parseInt(valueEl.textContent);
      if(v > min) valueEl.textContent = v - 1;
    });
    counter.querySelector('[data-step="up"]').addEventListener('click', () => {
      let v = parseInt(valueEl.textContent);
      if(v < max) valueEl.textContent = v + 1;
    });
  });
}

/* =========================================================
   12. Toggle switches
   ========================================================= */
function initSwitches(){
  document.querySelectorAll('.switch input').forEach(input => {
    input.addEventListener('change', () => {
      const label = input.closest('.switch-row')?.querySelector('.txt strong')?.textContent || 'الإعداد';
      showToast(`${label}: ${input.checked ? 'مفعّل' : 'معطّل'}`, 'success');
    });
  });
}

/* =========================================================
   13. Search / filter functionality
   ========================================================= */
function initSearchFilter(){
  document.querySelectorAll('[data-search-input]').forEach(input => {
    const targetSelector = input.getAttribute('data-search-input');
    const cardSelector = input.getAttribute('data-search-cards') || '.service-card';
    const container = document.querySelector(targetSelector);
    if(!container) return;

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      const cards = container.querySelectorAll(cardSelector);
      let visibleCount = 0;
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const match = text.includes(query);
        card.style.display = match ? '' : 'none';
        if(match) visibleCount++;
      });
      const countLabel = document.querySelector('[data-results-count]');
      if(countLabel) countLabel.textContent = `تم العثور على ${visibleCount} خدمة مطابقة`;
    });
  });

  /* category filter chips on explore page */
  document.querySelectorAll('[data-filter-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-filter-btn');
      document.querySelectorAll('.service-card[data-category]').forEach(card => {
        const show = value === 'all' || card.getAttribute('data-category') === value;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* =========================================================
   14. Dismissible alert banner
   ========================================================= */
function initAlertBanner(){
  document.querySelectorAll('.alert-banner .close-x').forEach(btn => {
    btn.addEventListener('click', () => {
      const banner = btn.closest('.alert-banner');
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 200);
    });
  });
  // NOTE: [data-open-location-modal] click handling now lives in
  // initRealLocationButtons() below — it tries real GPS first and
  // only opens this modal as a fallback if GPS fails/denied.
}

/* =========================================================
   15. Generic form validation helpers
   ========================================================= */
const Validators = {
  required: v => v.trim().length > 0,
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  phone: v => /^(\+?970|0)?5\d{8}$/.test(v.trim().replace(/[\s-]/g, '')) || /^\+?\d{7,14}$/.test(v.trim().replace(/[\s-]/g, '')),
  minLength: (v, len) => v.trim().length >= len,
};

function validateField(field){
  const rules = (field.getAttribute('data-validate') || '').split('|').filter(Boolean);
  const group = field.closest('.form-group');
  if(!group) return true;

  let valid = true;
  let message = '';

  for(const rule of rules){
    const [name, arg] = rule.split(':');
    if(name === 'required' && !Validators.required(field.value)){
      valid = false; message = 'هذا الحقل مطلوب'; break;
    }
    if(name === 'email' && field.value.trim() && !Validators.email(field.value)){
      valid = false; message = 'الرجاء إدخال بريد إلكتروني صحيح'; break;
    }
    if(name === 'phone' && field.value.trim() && !Validators.phone(field.value)){
      valid = false; message = 'الرجاء إدخال رقم هاتف صحيح'; break;
    }
    if(name === 'minLength' && !Validators.minLength(field.value, parseInt(arg))){
      valid = false; message = `الحد الأدنى ${arg} أحرف`; break;
    }
  }

  group.classList.toggle('error', !valid);
  const msgEl = group.querySelector('.error-msg');
  if(msgEl) msgEl.textContent = message;
  return valid;
}

function initFormValidation(){
  document.querySelectorAll('form[data-validate-form]').forEach(form => {
    const fields = form.querySelectorAll('[data-validate]');
    fields.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if(field.closest('.form-group').classList.contains('error')) validateField(field);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let allValid = true;
      fields.forEach(field => { if(!validateField(field)) allValid = false; });

      if(!allValid){
        showToast('الرجاء تصحيح الأخطاء في النموذج', 'error');
        const firstError = form.querySelector('.form-group.error');
        if(firstError) firstError.scrollIntoView({ behavior:'smooth', block:'center' });
        return;
      }

      const submitBtn = form.querySelector('[type="submit"]');
      if(submitBtn) submitBtn.classList.add('is-loading');

      setTimeout(() => {
        if(submitBtn) submitBtn.classList.remove('is-loading');
        showToast('تم إرسال النموذج بنجاح', 'success');
        const redirect = form.getAttribute('data-success-redirect');
        if(redirect){ window.location.href = redirect; }
        else { form.reset(); }
      }, 900);
    });
  });
}

/* =========================================================
   16. Report-a-service form specific logic (reused via data-report-form)
   ========================================================= */
function initReportForm(){
  const form = document.querySelector('[data-report-form]');
  if(!form) return;
  // category chip select behaviour
  document.querySelectorAll('[data-category-chip]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-category-chip]').forEach(c => c.classList.remove('active-chip'));
      chip.classList.add('active-chip');
      const hidden = form.querySelector('input[name="category"]');
      if(hidden) hidden.value = chip.getAttribute('data-category-chip');
    });
  });
}

/* 
   17. AI Assistant chat — real search against SERVICES
   Renders matching services as result cards (thumbnail, status,
   title, heart, "تفاصيل الخدمة" link back to explore.html) instead
   of a generic canned text reply, matching the intended design.
*/
function normalizeArabicWord(w){
  return w
    .replace(/[\u064B-\u0652]/g, '')      // strip diacritics
    .replace(/^(وال|بال|كال|فال|لل|وب|وف|ال|و|ف|ب|ل)/, '') // strip common leading connectors/prefixes
    .trim();
}

function serviceSearchText(s){
  return [s.title, s.desc, s.tag, s.category, ...(s.meta || [])].join(' ').toLowerCase();
}

// Generic/filler words that appear almost everywhere (e.g. "غزة" is in nearly
// every address) and shouldn't by themselves count as a meaningful match.
const SEARCH_STOPWORDS = new Set([
  'غزة', 'قطاع', 'في', 'من', 'الى', 'إلى', 'على', 'حتى', 'او', 'أو', 'هذا', 'هذه',
  'عن', 'مع', 'قرب', 'حوالي', 'كم', 'الان', 'الآن', 'حالياً', 'حاليا', 'يعمل',
  'تعمل', 'مفتوح', 'مفتوحة', 'مغلق', 'مغلقة', 'مزدحم', 'خدمة', 'خدمات', 'اماكن',
  'أماكن', 'وين', 'فين', 'ابحث', 'ابغى', 'بدي', 'ممكن', 'اقرب', 'أقرب', 'شغال',
  'شغالة'
]);

function searchServices(query){
  const rawWords = query.toLowerCase().split(/[\s,،.؟!]+/).filter(Boolean);
  const words = rawWords
    .map(normalizeArabicWord)
    .filter(w => w.length >= 2 && !SEARCH_STOPWORDS.has(w));
  if(!words.length) return [];

  const scored = SERVICES.map(service => {
    const primaryText = `${service.title} ${service.tag}`.toLowerCase();
    const fullText = serviceSearchText(service);
    const fullWords = fullText.split(/\s+/);
    let score = 0;
    words.forEach(w => {
      const prefix = w.slice(0, Math.min(4, w.length));
      const hitsPrimary = primaryText.includes(w) || primaryText.split(/\s+/).some(tw => tw.startsWith(prefix));
      const hitsFull = fullText.includes(w) || fullWords.some(tw => tw.startsWith(prefix));
      if(hitsPrimary) score += 2;       // match on the name/category is a strong signal
      else if(hitsFull) score += 1;     // match only in address/hours is a weaker signal
    });
    return { service, score };
  }).filter(r => r.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(r => r.service);
}

function buildResultCard(service){
  const favActive = isFavorite(service.id) ? ' active' : '';
  return `
    <article class="chat-result-card" data-service-id="${service.id}">
      <div class="crc-thumb">
        <img src="${service.img}" alt="${service.title}">
        <span class="crc-tag">${service.tag}</span>
      </div>
      <div class="crc-body">
        <div class="crc-status status-${service.status}"><span class="status-dot"></span>${service.statusLabel}</div>
        <h5 class="crc-title">${service.title}</h5>
        <p class="crc-meta">${(service.meta && service.meta[0]) || ''}</p>
        <div class="crc-actions">
          <button class="fav-btn crc-fav${favActive}" data-service-id="${service.id}" aria-label="أضف للمفضلة">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg>
          </button>
          <button class="icon-btn crc-report" data-report-issue="${service.id}" aria-label="إبلاغ عن مشكلة" title="إبلاغ عن مشكلة">🚩</button>
          <a class="crc-link" href="explore.html?service=${service.id}">تفاصيل الخدمة ‹</a>
        </div>
      </div>
    </article>`;
}

function initAssistantChat(){
  const form = document.querySelector('[data-chat-form]');
  if(!form) return;
  const input = form.querySelector('input');
  const messages = document.querySelector('[data-chat-messages]');
  const sendBtn = form.querySelector('.send-btn');

  const fallbackReplies = [
    'لم أجد نتيجة مطابقة تماماً، جرّب صياغة أخرى مثل اسم الخدمة أو المنطقة، أو تصفح كل الخدمات من صفحة استكشاف الخدمات.',
    'ما قدرت ألاقي خدمة مطابقة لهاي الكلمات بالتحديد، جرّب تكتب اسم الخدمة أو المحافظة بشكل أوضح.',
  ];

  function addMessage(text, who = 'bot'){
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${who === 'user' ? 'user' : ''}`.trim();
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function addResultsMessage(matches){
    const intro = document.createElement('div');
    intro.className = 'chat-bubble';
    intro.textContent = `وجدت لك ${matches.length} ${matches.length === 1 ? 'نتيجة مطابقة' : 'نتائج مطابقة'}:`;
    messages.appendChild(intro);

    const wrap = document.createElement('div');
    wrap.className = 'chat-results';
    wrap.innerHTML = matches.map(buildResultCard).join('');
    messages.appendChild(wrap);
    initFavorites(); // wire up the heart buttons on the newly-added cards
    injectReportButtons();
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage(text){
    if(!text.trim()) return;
    addMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;

    const typing = document.createElement('div');
    typing.className = 'chat-bubble';
    typing.textContent = 'يكتب الآن...';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const matches = searchServices(text);
      if(matches.length){
        addResultsMessage(matches);
      } else {
        addMessage(fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)], 'bot');
      }
      sendBtn.disabled = false;
    }, 1000);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    sendMessage(input.value);
  });
  document.querySelectorAll('.chip[data-suggestion]').forEach(chip => {
    chip.addEventListener('click', () => sendMessage(chip.getAttribute('data-suggestion')));
  });
  input?.addEventListener('input', () => { sendBtn.disabled = input.value.trim() === ''; });
}

/* =========================================================
   18. Generic loading-state buttons (data-loading-click)
   ========================================================= */
function initLoadingButtons(){
  document.querySelectorAll('[data-loading-click]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.classList.contains('is-loading')) return;
      btn.classList.add('is-loading');
      setTimeout(() => {
        btn.classList.remove('is-loading');
        const msg = btn.getAttribute('data-loading-click');
        if(msg) showToast(msg, 'success');
      }, 900);
    });
  });
}

/* =========================================================
   19. Map interactions (zoom buttons + region/pin click)
   ========================================================= */
function initMapInteractions(){
  document.querySelectorAll('[data-zoom]').forEach(btn => {
    btn.addEventListener('click', () => {
      const svg = document.querySelector('[data-map-svg]');
      if(!svg) return;
      const current = parseFloat(svg.getAttribute('data-scale')) || 1;
      const next = btn.getAttribute('data-zoom') === 'in'
        ? Math.min(current + 0.15, 2)
        : Math.max(current - 0.15, 0.6);
      svg.setAttribute('data-scale', next);
      svg.style.transform = `scale(${next})`;
    });
  });

  document.querySelectorAll('.map-region, .map-pin').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.getAttribute('data-name') || 'هذه المنطقة';
      showToast(`عرض الخدمات في: ${name}`, 'default');
    });
  });

  document.querySelectorAll('[data-manual-location-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gov2 = document.getElementById('gov2');
      const fGov = document.getElementById('fGov');
      if(gov2 && gov2.value && fGov){
        fGov.value = gov2.value;
        applyExploreFilters();
      }
      showToast('تم تحديد المنطقة وتطبيق الفلاتر', 'success');
      const overlay = btn.closest('.modal-overlay');
      if(overlay) closeModal(overlay);
    });
  });
}

/* =========================================================
   20. Manual location modal — populate cities by governorate
   ========================================================= */
const CITIES_BY_GOV = {
  'الشمال':  ['بيت لاهيا', 'بيت حانون', 'جباليا', 'أم النصر'],
  'غزة':     ['مدينة غزة', 'الشجاعية', 'الزيتون', 'التفاح', 'الدرج', 'الرمال', 'الصبرة', 'تل الهوى'],
  'الوسطى':  ['دير البلح', 'النصيرات', 'البريج', 'المغازي', 'الزوايدة'],
  'خانيونس': ['مدينة خانيونس', 'بني سهيلا', 'عبسان', 'خزاعة', 'القرارة'],
  'رفح':     ['مدينة رفح', 'الشوكة', 'تل السلطان', 'يبنا']
};

function initManualLocationCities(){
  const govSelect  = document.getElementById('gov2');
  const citySelect = document.getElementById('city2');
  if(!govSelect || !citySelect) return;

  govSelect.addEventListener('change', () => {
    const cities = CITIES_BY_GOV[govSelect.value] || [];
    citySelect.innerHTML = '<option value="">اختر المدينة ...</option>';
    cities.forEach(city => {
      const opt = document.createElement('option');
      opt.textContent = city;
      opt.value = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = cities.length === 0;
  });
}

/* =========================================================
   21. Explore page — real filter logic
   Combines category + governorate + status + free-text search
   + the max-distance range, and drives BOTH the service cards
   (#resultsGrid) and the Leaflet map markers from one source of
   truth (SERVICES), instead of the old fake always-visible pins.
   ========================================================= */
function currentSearchQuery(){
  const input = document.querySelector('[data-search-input]');
  return input ? input.value.trim().toLowerCase() : '';
}

function serviceMatchesFilters(service, filters){
  const { catVal, govVal, statusVal, query, maxKm } = filters;
  if(catVal && catVal !== 'all' && service.category !== catVal) return false;
  if(govVal && govVal !== 'all' && service.gov !== govVal) return false;
  if(statusVal && statusVal !== 'all' && service.status !== statusVal) return false;
  if(query && !serviceSearchText(service).includes(query)) return false;
  if(maxKm != null && userLocation && service.distance != null && service.distance > maxKm) return false;
  return true;
}

function currentExploreFilters(){
  const fCat    = document.getElementById('fCat');
  const fGov    = document.getElementById('fGov');
  const fStatus = document.getElementById('fStatus');
  const range   = document.querySelector('.filters-panel input[type="range"]');
  return {
    catVal: fCat ? fCat.value : 'all',
    govVal: fGov ? fGov.value : 'all',
    statusVal: fStatus ? fStatus.value : 'all',
    query: currentSearchQuery(),
    maxKm: range ? parseFloat(range.value) : null
  };
}

function applyExploreFilters(){
  const grid = document.getElementById('resultsGrid') || document.querySelector('.services-grid');
  if(!grid) return;

  if(userLocation) updateDistancesFromUserLocation();
  const filters = currentExploreFilters();

  let visibleCount = 0;
  grid.querySelectorAll('.service-card[data-service-id]').forEach(card => {
    const id = card.getAttribute('data-service-id');
    const service = SERVICES.find(s => s.id === id);
    const show = service ? serviceMatchesFilters(service, filters) : true;
    card.style.display = show ? '' : 'none';
    if(show) visibleCount++;
  });

  // keep the map markers in sync with the same criteria
  if(window.__leafletMarkers){
    Object.keys(window.__leafletMarkers).forEach(id => {
      const service = SERVICES.find(s => s.id === id);
      const marker = window.__leafletMarkers[id];
      const show = service ? serviceMatchesFilters(service, filters) : true;
      const onMap = window.__leafletMap && window.__leafletMap.hasLayer(marker);
      if(show && !onMap) marker.addTo(window.__leafletMap);
      if(!show && onMap) window.__leafletMap.removeLayer(marker);
    });
  }

  const countLabel = document.querySelector('[data-results-count]');
  if(countLabel){
    countLabel.textContent = visibleCount
      ? `تم العثور على ${visibleCount} ${visibleCount === 1 ? 'خدمة' : 'خدمات'} مطابقة لمعايير البحث في قطاع غزة.`
      : 'لا توجد خدمات مطابقة لمعايير البحث الحالية.';
  }
}
window.applyExploreFilters = applyExploreFilters;

function resetExploreFilters(){
  const fCat    = document.getElementById('fCat');
  const fGov    = document.getElementById('fGov');
  const fStatus = document.getElementById('fStatus');
  const range   = document.querySelector('.filters-panel input[type="range"]');
  const rangeOut = document.getElementById('rangeOut');
  const searchInput = document.querySelector('[data-search-input]');

  if(fCat) fCat.selectedIndex = 0;
  if(fGov) fGov.selectedIndex = 0;
  if(fStatus) fStatus.selectedIndex = 0;
  if(range) range.value = 50;
  if(rangeOut) rangeOut.textContent = '50 كم';
  if(searchInput) searchInput.value = '';

  applyExploreFilters();
}

function initExploreFilters(){
  renderMissingServiceCards(); // add cards for any admin-approved services not baked into the HTML
  const applyBtn = document.getElementById('applyFiltersBtn');
  if(applyBtn) applyBtn.addEventListener('click', applyExploreFilters);

  // Filters (category / governorate / status / distance) intentionally do
  // NOT auto-apply on change — they only take effect when the user presses
  // "تطبيق الفلاتر", so browsing the dropdowns never shifts the results
  // or the map underneath them. We still update the "XX كم" label live so
  // the slider feels responsive, without touching the results themselves.
  const range = document.querySelector('.filters-panel input[type="range"]');
  const rangeOut = document.getElementById('rangeOut');
  if(range && rangeOut){
    range.addEventListener('input', () => { rangeOut.textContent = `${range.value} كم`; });
  }

  const searchInput = document.querySelector('[data-search-input]');
  if(searchInput) searchInput.addEventListener('input', applyExploreFilters);

  const resetLink = document.querySelector('.filters-panel .reset-link');
  if(resetLink){
    resetLink.addEventListener('click', e => {
      e.preventDefault();
      resetExploreFilters();
    });
  }

  // run once on load so cards/markers/count reflect the real data
  if(document.getElementById('fCat')) applyExploreFilters();
}

/* =========================================================
   24. Homepage category grid (?cat=xxx) -> pre-selects the
   matching category filter when landing on explore.html.
   ========================================================= */
function initCategoryLinksFromQuery(){
  const fCat = document.getElementById('fCat');
  if(!fCat) return;
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  if(!cat) return;
  const optionExists = Array.from(fCat.options).some(o => o.value === cat);
  if(optionExists){
    fCat.value = cat;
    applyExploreFilters();
  }
}

/* =========================================================
   25. Real Leaflet + OpenStreetMap map (explore.html)
   Replaces the old decorative SVG map: real zoom/pan, one
   marker per service, popups with name/category/status/address
   /distance, a user-location marker after GPS, and two-way
   sync with the service cards + category/search filters.
   ========================================================= */
const CATEGORY_LABELS = {
  pharmacy:'صيدلية', bakery:'مخبز', water:'نقطة مياه',
  power:'نقطة شحن كهرباء', hospital:'مستشفى/عيادة', storage:'مركز توزيع مساعدات'
};
const STATUS_LABELS = { open:'متوفر ومفتوح', busy:'مزدحم جداً', closed:'مغلق حالياً' };
const STATUS_COLORS = { open:'#22c55e', busy:'#f59e0b', closed:'#ef4444' };

function placeUserMarkerOnMap(){
  if(!window.__leafletMap || !userLocation) return;
  const L = window.L;
  if(window.__userMarker) window.__leafletMap.removeLayer(window.__userMarker);
  window.__userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
    radius: 8, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2
  }).addTo(window.__leafletMap).bindPopup('📍 موقعك الحالي');
  window.__leafletMap.flyTo([userLocation.lat, userLocation.lng], 13);
}
window.placeUserMarkerOnMap = placeUserMarkerOnMap;

function focusServiceOnMap(id){
  const marker = window.__leafletMarkers && window.__leafletMarkers[id];
  if(!marker || !window.__leafletMap) return;
  const mapTabBtn = document.querySelector('[data-tab="mapView"]');
  if(mapTabBtn) mapTabBtn.click();
  setTimeout(() => {
    window.__leafletMap.invalidateSize();
    window.__leafletMap.flyTo(marker.getLatLng(), 15);
    marker.openPopup();
  }, 60);
}
window.focusServiceOnMap = focusServiceOnMap;

function highlightServiceCard(id){
  const card = document.querySelector(`.service-card[data-service-id="${id}"]`);
  if(!card) return;
  card.classList.add('highlight-pulse');
  setTimeout(() => card.classList.remove('highlight-pulse'), 2200);
}

function initLeafletMap(){
  const mapEl = document.getElementById('leafletMap');
  if(!mapEl || typeof L === 'undefined') return;

  const map = L.map(mapEl, { zoomControl: false }).setView([31.43, 34.38], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  window.__leafletMap = map;
  window.__leafletMarkers = {};

  SERVICES.forEach(service => {
    const marker = L.circleMarker([service.lat, service.lng], {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: STATUS_COLORS[service.status] || '#9ca3af',
      fillOpacity: 0.95
    });

    const popupHtml = `
      <div style="font-family:inherit;min-width:180px;">
        <strong style="display:block;margin-bottom:4px;">${service.title}</strong>
        <span style="display:block;font-size:12px;color:#555;margin-bottom:2px;">${CATEGORY_LABELS[service.category] || service.category}</span>
        <span style="display:block;font-size:12px;color:${STATUS_COLORS[service.status]};margin-bottom:4px;">${STATUS_LABELS[service.status] || service.status}</span>
        <span style="display:block;font-size:12px;color:#555;">${(service.meta && service.meta[0]) || ''}</span>
        <span data-popup-distance="${service.id}" style="display:block;font-size:12px;color:#16A34A;margin-top:4px;"></span>
      </div>`;
    marker.bindPopup(popupHtml);

    marker.on('click', () => highlightServiceCard(service.id));
    marker.addTo(map);
    window.__leafletMarkers[service.id] = marker;
  });

  // custom zoom buttons (keeps the existing design's +/- controls working)
  document.querySelectorAll('[data-zoom]').forEach(btn => {
    if(btn.dataset.leafletBound) return;
    btn.dataset.leafletBound = '1';
    btn.addEventListener('click', () => {
      if(btn.getAttribute('data-zoom') === 'in') map.zoomIn();
      else map.zoomOut();
    });
  });

  // service card click (not on its buttons/links) -> fly to it on the map
  const grid = document.getElementById('resultsGrid') || document.querySelector('.services-grid');
  if(grid){
    grid.addEventListener('click', (e) => {
      if(e.target.closest('a, button')) return;
      const card = e.target.closest('.service-card[data-service-id]');
      if(!card) return;
      focusServiceOnMap(card.getAttribute('data-service-id'));
    });
  }

  // refresh popup distance text whenever we (re)compute distances
  const originalUpdate = window.updateDistancesFromUserLocation;
  window.updateDistancesFromUserLocation = function(){
    const sorted = originalUpdate();
    document.querySelectorAll('[data-popup-distance]').forEach(el => {
      const service = SERVICES.find(s => s.id === el.getAttribute('data-popup-distance'));
      if(service && service.distance != null){
        el.textContent = `📍 يبعد حوالي ${formatDistance(service.distance)}`;
      }
    });
    return sorted;
  };

  setTimeout(() => map.invalidateSize(), 200);
}

/* =========================================================
   22. Explore page — deep link from "تفاصيل الخدمة" (chat / saved)
   Reads ?service=svc-x from the URL, switches to the list view,
   and scrolls/highlights the matching card so the button really
   takes the person back to that specific service on this page.
   ========================================================= */
function initServiceDeepLink(){
  const params = new URLSearchParams(location.search);
  const id = params.get('service');
  if(!id) return;

  const listTabBtn = document.querySelector('[data-tab="listView"]');
  if(listTabBtn) listTabBtn.click();

  const card = document.querySelector(`.service-card[data-service-id="${id}"]`);
  if(card){
    card.style.display = '';
    setTimeout(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight-pulse');
      setTimeout(() => card.classList.remove('highlight-pulse'), 2200);
    }, 200);
  }

  // also center the real map on this service and open its popup
  setTimeout(() => {
    if(window.__leafletMarkers && window.__leafletMarkers[id] && window.__leafletMap){
      window.__leafletMap.invalidateSize();
      window.__leafletMap.flyTo(window.__leafletMarkers[id].getLatLng(), 15);
      window.__leafletMarkers[id].openPopup();
    }
  }, 300);
}

/* =========================================================
   26. Backend connection points (no Backend yet)
   These are the stubs the Backend team will replace with real
   fetch() calls once the API/DB/Auth/storage are ready.
   ========================================================= */
async function updateProfile(profileData) {
  // TODO: Connect to Backend API -> PATCH /api/profile
  console.log('updateProfile() — profileData ready for Backend:', profileData);
  return { ok: true };
}
window.updateProfile = updateProfile;

async function getMyReports() {
  // TODO: Connect to Backend API -> GET /api/reports?mine=true
  // Currently the "بلاغاتي" page (reports.html) shows demo data only.
  return [];
}
window.getMyReports = getMyReports;

async function getMyServices() {
  // TODO: Connect to Backend API -> GET /api/services?mine=true
  // Currently the "خدماتي المضافة" page (my-services.html) shows demo data only.
  return [];
}
window.getMyServices = getMyServices;

async function toggleFavoriteRemote(serviceId) {
  // TODO: Connect to Backend API -> POST/DELETE /api/favorites/{serviceId}
  // The heart button already works fully client-side via toggleFavorite()
  // above; once the API exists, call this alongside it to persist the
  // choice server-side instead of (or in addition to) localStorage.
  console.log('toggleFavoriteRemote() — would sync favorite for:', serviceId);
  return { ok: true };
}
window.toggleFavoriteRemote = toggleFavoriteRemote;

function initReportDetailLinks(){
  document.querySelectorAll('.report-footer-link').forEach(link => {
    if(link.getAttribute('href') !== '#') return; // already a real link elsewhere
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('عرض تفاصيل البلاغ الكاملة سيكون متاحاً بعد ربط الصفحة بالخادم (Backend)', 'default');
    });
  });
}

function initProfileForm(){
  const form = document.getElementById('profileInfoForm');
  if(!form) return;

  form.addEventListener('submit', (e) => {
    // initFormValidation() already validates + prevents default via its
    // own listener; we hook the same submit event to also collect the
    // real entered values and hand them to the Backend stub.
    const nameEl = document.getElementById('pname');
    const phoneEl = document.getElementById('pphone');
    const emailEl = document.getElementById('pemail');
    if(!nameEl || !phoneEl || !emailEl) return;
    if(form.querySelector('.form-group.error')) return; // let validation handle it

    const profileData = {
      name: nameEl.value.trim(),
      phone: phoneEl.value.trim(),
      email: emailEl.value.trim()
    };
    updateProfile(profileData);
  });
}

/* =========================================================
   27. Saved page — render favorited services dynamically
   Reads the real favorites list from localStorage and builds the
   cards from the shared SERVICES data, so anything favorited from
   explore.html or the assistant chat actually shows up here.
   ========================================================= */
function renderSavedGrid(){
  const grid = document.getElementById('savedGrid');
  if(!grid) return;

  const favIds = getFavorites();
  const favServices = SERVICES.filter(s => favIds.includes(s.id));

  if(!favServices.length){
    grid.innerHTML = `
      <div class="empty-saved" style="grid-column:1/-1; text-align:center; padding:40px 16px; color:var(--text-sub);">
        <p style="font-size:14px;font-weight:700;margin-bottom:8px;">لم تقم بحفظ أي خدمة بعد.</p>
        <p style="font-size:13px;">اضغط على أيقونة القلب ❤ على أي خدمة في صفحة الاستكشاف أو المساعد الذكي لإضافتها هنا.</p>
        <a href="explore.html" class="btn btn-primary" style="margin-top:14px;display:inline-flex;">استكشاف الخدمات</a>
      </div>`;
    return;
  }

  grid.innerHTML = favServices.map(s => `
    <article class="service-card" data-category="${s.category}" data-service-id="${s.id}">
      <div class="service-thumb">
        <img src="${s.img}" alt="${s.title}">
        <span class="service-tag">${s.tag}</span>
        <button class="fav-btn active" data-service-id="${s.id}" aria-label="أزل من المفضلة"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg></button>
      </div>
      <div class="service-body">
        <div class="status-line status-${s.status}"><span class="status-dot"></span> ${s.statusLabel}</div>
        <h4 class="service-title">${s.title}</h4>
        <p class="service-desc">${s.desc}</p>
        ${(s.meta || []).map(m => `<p class="service-meta">${m}</p>`).join('')}
        <div class="service-actions">
          <button class="icon-btn" data-loading-click="تم نسخ الرابط"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg></button>
          <a href="explore.html?service=${s.id}" class="btn btn-primary">عرض التفاصيل ‹</a>
        </div>
      </div>
      <div class="service-foot"><span>محفوظة في المفضلة</span><span>من صفحة استكشاف الخدمات</span></div>
    </article>
  `).join('');

  initFavorites(); // wire up the re-rendered heart buttons
  initLoadingButtons();
  injectReportButtons();
}
/* =========================================================
   26. WinDB integration — links the public site to the shared
   data layer (win-db.js) used by لوحة التحكم (admin dashboard).
   Every page that includes win-db.js before this file benefits
   from this automatically; pages without it are unaffected.
   ========================================================= */
function syncWinDBServices(){
  if(typeof window.WinDB === 'undefined' || typeof SERVICES === 'undefined') return;
  const db = WinDB.getDB();
  const overrides = db.statusOverrides || {};
  SERVICES.forEach(s => {
    if(overrides[s.id]){
      s.status = overrides[s.id].status;
      s.statusLabel = overrides[s.id].statusLabel;
    }
  });
  (db.dynamicServices || []).forEach(d => {
    if(!SERVICES.find(s => s.id === d.id)){
      SERVICES.push({
        id: d.id, category: d.category, tag: d.tag || d.category,
        status: d.status || 'open', statusLabel: d.statusLabel || 'متوفر ومفتوح',
        title: d.title, gov: d.gov,
        lat: 31.40 + (Math.random() - 0.5) * 0.18,
        lng: 34.38 + (Math.random() - 0.5) * 0.22,
        desc: d.desc || '', meta: d.meta || [], img: d.img || 'Logo.png'
      });
    }
  });
}

/* Adds a card for every SERVICES entry not already present as static
   HTML in #resultsGrid (i.e. services approved later by the admin
   dashboard). Keeps the exact same classes the CSS/filters expect. */
function renderMissingServiceCards(){
  const grid = document.getElementById('resultsGrid');
  if(!grid || typeof SERVICES === 'undefined') return;
  SERVICES.forEach(s => {
    if(grid.querySelector(`.service-card[data-service-id="${s.id}"]`)) return;
    const art = document.createElement('article');
    art.className = 'service-card';
    art.setAttribute('data-category', s.category);
    art.setAttribute('data-service-id', s.id);
    art.innerHTML = `
      <div class="service-thumb">
        <img src="${s.img}" alt="${s.title}"><span class="service-tag">${s.tag}</span>
        <button class="fav-btn" data-service-id="${s.id}" aria-label="أضف للمفضلة"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg></button>
      </div>
      <div class="service-body">
        <div class="status-line status-${s.status}"><span class="status-dot"></span> ${s.statusLabel}</div>
        <h4 class="service-title">${s.title}</h4>
        <p class="service-desc">${s.desc}</p>
        <p class="service-meta">📍 ${(s.meta && s.meta[0]) || s.gov || ''}</p>
        <div class="service-actions">
          <button class="icon-btn" data-loading-click="تم نسخ الرابط"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg></button>
          <a href="explore.html?service=${s.id}" class="btn btn-primary">عرض التفاصيل</a>
        </div>
      </div>`;
    grid.appendChild(art);
  });
  initFavorites();
  initLoadingButtons();
  injectReportButtons();
}

/* Injects a small 🚩 "report an issue" button into every service card's
   action row (works for static AND JS-rendered cards) so a citizen can
   flag a problem with an EXISTING service. This is what feeds the
   "البلاغات" queue in لوحة التحكم. Safe to call multiple times. */
function injectReportButtons(){
  document.querySelectorAll('.service-actions').forEach(actions => {
    if(actions.querySelector('[data-report-issue]')) return;
    const card = actions.closest('.service-card');
    if(!card) return;
    const id = card.getAttribute('data-service-id');
    if(!id) return;
    const titleEl = card.querySelector('.service-title');
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.setAttribute('data-report-issue', id);
    btn.setAttribute('title', 'إبلاغ عن مشكلة بهذه الخدمة');
    btn.setAttribute('aria-label', 'إبلاغ عن مشكلة بهذه الخدمة');
    btn.textContent = '🚩';
    actions.insertBefore(btn, actions.firstChild);
  });
}

/* ---------------------------------------------------------------------
   Quick "report an issue with this service" modal — feeds WinDB.issueReports
   which شows up live in لوحة التحكم › البلاغات
   --------------------------------------------------------------------- */
function ensureIssueReportModal(){
  if(document.getElementById('issueReportModal')) return document.getElementById('issueReportModal');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'issueReportModal';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:420px;background:#fff;border-radius:16px;padding:24px;margin:auto;">
      <h3 style="font-size:16px;font-weight:900;margin-bottom:4px;">🚩 إبلاغ عن مشكلة</h3>
      <p style="font-size:13px;color:var(--text-sub);margin-bottom:14px;" data-issue-service-name>—</p>
      <div class="form-group full" style="margin-bottom:12px;">
        <label style="font-size:13px;font-weight:700;">نوع المشكلة</label>
        <select id="issueTypeSelect" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:10px;margin-top:6px;">
          <option value="closed">الخدمة مغلقة الآن</option>
          <option value="overcrowded">مزدحم جداً</option>
          <option value="wrong_hours">ساعات العمل غير صحيحة</option>
          <option value="wrong_location">الموقع غير صحيح</option>
          <option value="other">غير ذلك</option>
        </select>
      </div>
      <div class="form-group full" style="margin-bottom:16px;">
        <label style="font-size:13px;font-weight:700;">وصف مختصر (اختياري)</label>
        <textarea id="issueDescInput" rows="3" placeholder="أضف أي تفاصيل تساعد فريق المراجعة..." style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:10px;margin-top:6px;"></textarea>
      </div>
      <div class="form-actions" style="display:flex;gap:10px;">
        <button type="button" class="btn btn-primary btn-block" id="submitIssueReportBtn">إرسال البلاغ</button>
        <button type="button" class="btn btn-outline btn-block" data-modal-close>إلغاء</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(overlay); });
  overlay.querySelector('[data-modal-close]').addEventListener('click', () => closeModal(overlay));
  return overlay;
}

function initIssueReportModal(){
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-report-issue]');
    if(!trigger) return;
    e.preventDefault();
    const serviceId = trigger.getAttribute('data-report-issue');
    const service = (typeof SERVICES !== 'undefined') ? SERVICES.find(s => s.id === serviceId) : null;
    const modal = ensureIssueReportModal();
    modal.setAttribute('data-current-service', serviceId);
    modal.querySelector('[data-issue-service-name]').textContent = service ? `عن: ${service.title}` : '';
    modal.querySelector('#issueDescInput').value = '';
    openModal('issueReportModal');
  });

  document.addEventListener('click', e => {
    if(e.target.id !== 'submitIssueReportBtn') return;
    const modal = document.getElementById('issueReportModal');
    const serviceId = modal.getAttribute('data-current-service');
    const service = (typeof SERVICES !== 'undefined') ? SERVICES.find(s => s.id === serviceId) : null;
    const typeSelect = modal.querySelector('#issueTypeSelect');
    const issueType = typeSelect.value;
    const issueLabel = typeSelect.options[typeSelect.selectedIndex].textContent;
    const description = modal.querySelector('#issueDescInput').value.trim();

    if(typeof WinDB === 'undefined'){ closeModal(modal); return; }

    const priorityMap = { closed: ['high','عالية'], overcrowded: ['medium','متوسطة'], wrong_hours: ['low','منخفضة'], wrong_location: ['medium','متوسطة'], other: ['low','منخفضة'] };
    const pr = priorityMap[issueType] || ['medium','متوسطة'];

    WinDB.submitIssueReport({
      serviceId: serviceId,
      serviceName: service ? service.title : 'خدمة غير معروفة',
      category: service ? service.category : 'general',
      gov: service ? service.gov : '',
      city: service && service.meta ? (service.meta[0] || '') : '',
      issueType: issueType,
      issueLabel: issueLabel,
      description: description || issueLabel,
      priority: pr[0],
      priorityLabel: pr[1]
    });

    closeModal(modal);
    showToast('تم إرسال بلاغك، سيقوم فريق المراجعة بالتحقق منه قريباً 🙏', 'success');
  });
}

/* ---------------------------------------------------------------------
   "Add a new facility" form (report.html) → WinDB.submitServiceRequest
   This runs IN ADDITION TO the generic initFormValidation()/توست/redirect
   handler already wired via [data-validate-form]; it only persists the
   data when the same required fields are actually filled in.
   --------------------------------------------------------------------- */
function initServiceRequestSubmit(){
  const form = document.querySelector('[data-report-form]');
  if(!form || typeof WinDB === 'undefined') return;

  const categoryLabels = {
    pharmacy: 'صيدلية', hospital: 'عيادة / مستشفى', bakery: 'مخبز',
    water: 'نقطة مياه', power: 'نقطة شحن كهرباء', storage: 'مخزن'
  };

  form.addEventListener('submit', () => {
    const get = sel => { const el = form.querySelector(sel); return el ? el.value.trim() : ''; };
    const category = get('input[name="category"]');
    const name = get('#name');
    const phone = get('#phone');
    const email = get('#email');
    const gov = get('#gov');
    const addr = get('#addr');
    const desc = get('#desc');
    const workingNow = form.querySelector('.switch-row input[type="checkbox"]');
    const photos = Array.from(form.querySelectorAll('.upload-preview img')).map(img => img.src);

    // Minimal validity mirror of data-validate rules — only save if the
    // required fields the user actually needs to fill are present.
    const looksValid = category && name && /^0\d{8,9}$/.test(phone) && gov && addr && desc.length >= 10;
    if(!looksValid) return;

    WinDB.submitServiceRequest({
      name: name, category: category, categoryLabel: categoryLabels[category] || category,
      gov: gov, city: gov, address: addr, phone: phone, email: email,
      desc: desc, workingNow: workingNow ? workingNow.checked : true,
      photos: photos
    });
  });
}

/* =========================================================
   27. "بلاغاتي" (reports.html) — renders the CURRENT user's own
   issue reports (submitted via the 🚩 button on service cards)
   straight from WinDB, replacing the old static demo cards.
   ========================================================= */
function bucketReportStatus(status){
  if(status === 'approved') return 'approved';
  if(status === 'rejected') return 'rejected';
  return 'pending'; // new / in_review / needs_info / escalated
}

function myReportCardHTML(r){
  const bucket = bucketReportStatus(r.status);
  const badge = bucket === 'approved'
    ? '<span class="report-status approved">✓ تم الاعتماد والنشر</span>'
    : bucket === 'rejected'
      ? '<span class="report-status rejected">✕ تم الرفض</span>'
      : '<span class="report-status pending">🕘 قيد المراجعة</span>';
  const lastNote = r.history && r.history.length > 1 ? r.history[r.history.length - 1].note : '';
  return `
    <article class="report-card" data-status="${bucket}" data-report-id="${r.id}">
      <div class="report-top">
        <span class="report-id">#${r.id}</span>
        ${badge}
      </div>
      <h4 class="report-title">${r.serviceName}</h4>
      <span class="report-date">🗓 تاريخ التقديم: ${WinDB.fmtDate(r.submittedAt)}</span>
      <div class="report-body"><strong>بلاغ عن:</strong> ${r.issueLabel}${r.description ? ' — ' + r.description : ''}</div>
      <a href="#" class="report-footer-link" data-report-detail="${r.id}"><span>فحص تفاصيل البلاغ والرد الميداني</span><span>←</span></a>
    </article>`;
}

function reportsPanelHTML(list, emptyMsg){
  if(!list.length){
    return `<div class="text-center" style="padding:60px 20px;color:var(--text-sub);"><p style="font-size:14px;">${emptyMsg}</p></div>`;
  }
  return `<div class="reports-grid">${list.map(myReportCardHTML).join('')}</div>`;
}

function renderMyReports(){
  const wrap = document.getElementById('reportsWrap');
  if(!wrap || typeof WinDB === 'undefined') return;

  const all = WinDB.myIssueReports().slice().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  const groups = {
    all: all,
    pending: all.filter(r => bucketReportStatus(r.status) === 'pending'),
    approved: all.filter(r => bucketReportStatus(r.status) === 'approved'),
    rejected: all.filter(r => bucketReportStatus(r.status) === 'rejected')
  };

  const tabsBar = document.querySelector('[data-tabs][data-tabs-target="#reportsWrap"]');
  if(tabsBar){
    const setLabel = (tab, text) => { const b = tabsBar.querySelector(`[data-tab="${tab}"]`); if(b) b.textContent = text; };
    setLabel('allReports', `الكل (${groups.all.length})`);
    setLabel('pendingReports', `قيد التدقيق (${groups.pending.length})`);
    setLabel('approvedReports', `المعتمدة (${groups.approved.length})`);
    setLabel('rejectedReports', `المرفوضة (${groups.rejected.length})`);
  }

  const setPanel = (id, list, emptyMsg) => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = reportsPanelHTML(list, emptyMsg);
  };
  setPanel('allReports', groups.all, 'لم تقدّم أي بلاغ بعد. استخدم زر 🚩 الموجود على أي بطاقة خدمة لتقديم أول بلاغ.');
  setPanel('pendingReports', groups.pending, 'لا توجد بلاغات قيد المراجعة حالياً.');
  setPanel('approvedReports', groups.approved, 'لا توجد بلاغات معتمدة بعد.');
  setPanel('rejectedReports', groups.rejected, 'لا توجد بلاغات مرفوضة حالياً 🎉');

  wrap.addEventListener('click', e => {
    const link = e.target.closest('[data-report-detail]');
    if(!link) return;
    e.preventDefault();
    const report = all.find(r => r.id === link.getAttribute('data-report-detail'));
    if(!report) return;
    const lastNote = report.history && report.history.length ? report.history[report.history.length - 1].note : '';
    showToast(lastNote ? `آخر تحديث من فريق المراجعة: ${lastNote}` : 'لا يوجد رد ميداني إضافي بعد، سيتم إشعارك فور التحديث.');
  });
}

/* =========================================================
   28. "خدماتي المضافة" (my-services.html) — renders the CURRENT
   user's own submitted facility requests straight from WinDB.
   ========================================================= */
function myServiceMiniCardHTML(r){
  const bucket = bucketReportStatus(r.status);
  const tagStyle = bucket === 'approved' ? ''
    : bucket === 'rejected' ? ' style="background:#fde3e3;color:#b42318;"'
    : ' style="background:#fff3d6;color:#8a6100;"';
  const tagLabel = bucket === 'approved' ? '✓ معتمد ومنشور للعامة'
    : bucket === 'rejected' ? '✕ مرفوض' : '⏳ قيد المراجعة';
  const rejectNote = bucket === 'rejected' && r.history && r.history.length
    ? `<p style="font-size:12px;color:#b42318;margin-top:6px;">سبب الرفض: ${r.history[r.history.length - 1].note}</p>` : '';
  const manageBtn = bucket === 'approved'
    ? `<button class="btn btn-outline btn-block" data-loading-click="تم فتح إدارة الحالة">📍 إدارة وتعديل حالة الخدمة</button>` : '';
  return `
    <div class="mini-card">
      <div class="mini-tags"><span class="status-tag"${tagStyle}>${tagLabel}</span><span class="type-tag">${r.categoryLabel || r.category}</span></div>
      <h4>${r.name}</h4>
      <p>${r.desc}</p>
      <p class="addr">📍 العنوان: ${r.gov}${r.address ? ' - ' + r.address : ''}</p>
      ${rejectNote}
      ${manageBtn}
    </div>`;
}

function myServicesPanelHTML(list, emptyMsg){
  if(!list.length){
    return `<p class="mt-16" style="color:var(--text-sub);font-size:13px;">${emptyMsg}</p>`;
  }
  return `<div class="my-services-grid">${list.map(myServiceMiniCardHTML).join('')}</div>`;
}

function renderMyServiceRequests(){
  const wrap = document.getElementById('myServicesWrap');
  if(!wrap || typeof WinDB === 'undefined') return;

  const all = WinDB.myServiceRequests().slice().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  const groups = {
    all: all,
    approved: all.filter(r => bucketReportStatus(r.status) === 'approved'),
    pending: all.filter(r => bucketReportStatus(r.status) === 'pending'),
    rejected: all.filter(r => bucketReportStatus(r.status) === 'rejected')
  };

  const tabsBar = document.querySelector('[data-tabs][data-tabs-target="#myServicesWrap"]');
  if(tabsBar){
    const setLabel = (tab, text) => { const b = tabsBar.querySelector(`[data-tab="${tab}"]`); if(b) b.textContent = text; };
    setLabel('allPanel', `الكل (${groups.all.length})`);
    setLabel('approvedPanel', `معتمد ومنشور (${groups.approved.length})`);
    setLabel('pendingPanel', `قيد المراجعة (${groups.pending.length})`);
    setLabel('rejectedPanel', `مرفوضة (${groups.rejected.length})`);
  }

  const setPanel = (id, list, emptyMsg) => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = myServicesPanelHTML(list, emptyMsg);
  };
  setPanel('allPanel', groups.all, 'لم تقترح أي مرفق بعد. اضغط "+ إضافة مرفق جديد" لتبدأ.');
  setPanel('approvedPanel', groups.approved, 'لا يوجد مرافق معتمدة ومنشورة بعد.');
  setPanel('pendingPanel', groups.pending, 'لا يوجد مرافق قيد المراجعة حالياً.');
  setPanel('rejectedPanel', groups.rejected, 'لا يوجد مرافق مرفوضة 🎉');
}
