// الصفحة الرئيسية
// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

// User dropdown
const userBtn = document.getElementById('userBtn');
const userDropdown = document.getElementById('userDropdown');

userBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  userDropdown.classList.toggle('open');
});

document.addEventListener('click', () => {
  userDropdown.classList.remove('open');
});

// Header favorite toggle
document.getElementById('headerFav').addEventListener('click', function () {
  this.classList.toggle('is-active');
});

// Favorite buttons on service cards
document.querySelectorAll('.fav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('is-active');
  });
});

// Category selection (filters the service list below)
const categoryButtons = document.querySelectorAll('.category-card');
const serviceCards = document.querySelectorAll('.service-card');

categoryButtons.forEach((card) => {
  card.addEventListener('click', () => {
    const alreadySelected = card.classList.contains('is-selected');
    categoryButtons.forEach((c) => c.classList.remove('is-selected'));

    if (!alreadySelected) {
      card.classList.add('is-selected');
    }
    // In a full app this would re-fetch/filter results by category.
    // Kept simple here since we only have demo data.
  });
});

// Hero search: filters visible service cards by name
const heroSearchForm = document.getElementById('heroSearchForm');
const heroSearchInput = document.getElementById('heroSearchInput');

heroSearchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = heroSearchInput.value.trim().toLowerCase();

  serviceCards.forEach((card) => {
    const name = card.dataset.name.toLowerCase();
    card.style.display = !query || name.includes(query) ? '' : 'none';
  });

  document.getElementById('serviceCards').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('searchNowBtn').addEventListener('click', () => {
  heroSearchInput.focus();
});

// "My location" button
document.getElementById('locateBtn').addEventListener('click', function () {
  if (!navigator.geolocation) {
    alert('المتصفح لا يدعم تحديد الموقع الجغرافي');
    return;
  }
  const original = this.innerHTML;
  this.disabled = true;

  navigator.geolocation.getCurrentPosition(
    () => {
      this.disabled = false;
      alert('تم تحديد موقعك بنجاح، سيتم عرض أقرب الخدمات إليك');
    },
    () => {
      this.disabled = false;
      alert('تعذر الوصول إلى موقعك، يرجى السماح بالوصول للموقع من إعدادات المتصفح');
    }
  );
});

// Gaza map regions: click to highlight
document.querySelectorAll('.region').forEach((region) => {
  region.addEventListener('click', () => {
    document.querySelectorAll('.region').forEach((r) => r.classList.remove('is-selected'));
    region.classList.add('is-selected');
  });
});

// Map zoom buttons (visual only, keeps demo simple)
document.querySelectorAll('.map-zoom button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const map = document.getElementById('gazaMap');
    const current = parseFloat(map.dataset.scale || '1');
    const next = btn.textContent === '+' ? Math.min(current + 0.1, 1.3) : Math.max(current - 0.1, 0.9);
    map.dataset.scale = next;
    map.style.transform = `scale(${next})`;
  });
});

// Add service CTA
document.getElementById('addServiceBtn').addEventListener('click', () => {
  alert('سيتم فتح نموذج إضافة خدمة جديدة');
});
