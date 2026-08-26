/*
  وين الخدمة — لوحة تحكم الإدارة
  منطق مشترك لكل صفحات لوحة التحكم: حراسة الدخول، الشريط الجانبي،
  الرسوم البيانية (SVG يدوي بدون أي مكتبة خارجية)، ومساعدات الجداول.
*/
(function (window) {
  "use strict";

  /* ---------------------------------------------------------------------
     Auth guard — every admin page except login.html calls this first.
     --------------------------------------------------------------------- */
  function requireAdminAuth() {
    if (!window.WinDB || !WinDB.adminCurrentUser()) {
      window.location.replace("login.html?expired=1");
      return false;
    }
    return true;
  }

  function initLogout() {
    document.querySelectorAll("[data-admin-logout]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        WinDB.adminLogout();
        window.location.href = "login.html";
      });
    });
  }

  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }

  /* ---------------------------------------------------------------------
     Sidebar — sets active link + live badge counts
     --------------------------------------------------------------------- */
  function initSidebar() {
    var admin = WinDB.adminCurrentUser();
    if (!admin) return;
    var nameEl = document.querySelector("[data-admin-name]");
    var roleEl = document.querySelector("[data-admin-role]");
    if (nameEl) nameEl.textContent = admin.name;
    if (roleEl) roleEl.textContent = admin.role;

    var stats = WinDB.getStats();
    var repBadge = document.querySelector("[data-nav-count='reports']");
    var reqBadge = document.querySelector("[data-nav-count='requests']");
    if (repBadge) {
      repBadge.textContent = stats.openReports;
      repBadge.style.display = stats.openReports ? "inline-flex" : "none";
    }
    if (reqBadge) {
      reqBadge.textContent = stats.newRequests;
      reqBadge.style.display = stats.newRequests ? "inline-flex" : "none";
    }

    var file = location.pathname.split("/").pop();
    document.querySelectorAll(".admin-nav a[data-page]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-page") === file);
    });
  }

  /* ---------------------------------------------------------------------
     Local "known services" snapshot — mirrors the demo SERVICES array of
     the public site (الأساسية/js/script.js) just enough to power the
     admin charts (category/governorate/status distribution) without
     needing to load the whole public-site script. Merged live with
     WinDB's dynamicServices + statusOverrides so approvals/status
     changes made from the dashboard are reflected immediately.
     --------------------------------------------------------------------- */
  var BASE_SERVICES_SNAPSHOT = [
    { id: "svc-1", category: "pharmacy", gov: "الوسطى", status: "open" },
    { id: "svc-2", category: "bakery", gov: "غزة", status: "busy" },
    { id: "svc-3", category: "water", gov: "غزة", status: "open" },
    { id: "svc-4", category: "power", gov: "الوسطى", status: "open" },
    { id: "svc-5", category: "hospital", gov: "الوسطى", status: "busy" },
    { id: "svc-6", category: "storage", gov: "الوسطى", status: "closed" },
    { id: "svc-7", category: "storage", gov: "الوسطى", status: "closed" },
    { id: "svc-8", category: "bakery", gov: "الشمال", status: "closed" },
    { id: "svc-9", category: "water", gov: "رفح", status: "open" }
  ];

  function getMergedServiceStats() {
    var db = WinDB.getDB();
    var overrides = db.statusOverrides || {};
    var list = BASE_SERVICES_SNAPSHOT.map(function (s) {
      var o = overrides[s.id];
      return { id: s.id, category: s.category, gov: s.gov, status: o ? o.status : s.status };
    });
    (db.dynamicServices || []).forEach(function (d) {
      list.push({ id: d.id, category: d.category, gov: d.gov, status: d.status });
    });
    return list;
  }

  var CATEGORY_LABELS = {
    pharmacy: "صيدليات", hospital: "عيادات ومستشفيات", bakery: "مخابز",
    water: "نقاط مياه", power: "نقاط شحن", storage: "مراكز توزيع"
  };
  var STATUS_COLORS = { open: "#22c55e", busy: "#f59e0b", closed: "#ef4444" };

  /* ---------------------------------------------------------------------
     Badge helpers for tables (issue reports + service requests)
     --------------------------------------------------------------------- */
  var STATUS_BADGE_CLASS = {
    new: "b-new", in_review: "b-review", approved: "b-approved",
    rejected: "b-rejected", needs_info: "b-needsinfo", escalated: "b-escalated"
  };
  var PRIORITY_BADGE_CLASS = { low: "p-low", medium: "p-medium", high: "p-high", urgent: "p-urgent" };

  function statusBadge(status, label) {
    return '<span class="badge ' + (STATUS_BADGE_CLASS[status] || "b-new") + '">' + label + "</span>";
  }
  function priorityBadge(priority, label) {
    return '<span class="badge ' + (PRIORITY_BADGE_CLASS[priority] || "p-medium") + '">' + label + "</span>";
  }

  /* =======================================================================
     Hand-drawn SVG charts — zero dependencies, work fully offline.
     ======================================================================= */

  function lineChart(visits, requests) {
    var w = 600, h = 210, pad = 24;
    var max = Math.max.apply(null, visits.concat(requests)) * 1.15;
    var stepX = (w - pad * 2) / (visits.length - 1);
    function pts(series) {
      return series.map(function (v, i) {
        var x = pad + i * stepX;
        var y = h - pad - (v / max) * (h - pad * 2);
        return x.toFixed(1) + "," + y.toFixed(1);
      }).join(" ");
    }
    var gridLines = "";
    for (var g = 0; g < 4; g++) {
      var gy = pad + g * ((h - pad * 2) / 3);
      gridLines += '<line x1="' + pad + '" y1="' + gy + '" x2="' + (w - pad) + '" y2="' + gy + '" stroke="#eef0f2" stroke-width="1"/>';
    }
    return '<svg viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg">' +
      gridLines +
      '<polyline points="' + pts(visits) + '" fill="none" stroke="#1FA855" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<polyline points="' + pts(requests) + '" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      "</svg>";
  }

  function donutChart(segments) {
    var size = 160, cx = size / 2, cy = size / 2, r = 56, stroke = 22;
    var total = segments.reduce(function (a, s) { return a + s.value; }, 0) || 1;
    var circumference = 2 * Math.PI * r;
    var offset = 0;
    var circles = segments.map(function (s) {
      var frac = s.value / total;
      var dash = frac * circumference;
      var gap = circumference - dash;
      var el = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color +
        '" stroke-width="' + stroke + '" stroke-dasharray="' + dash.toFixed(1) + " " + gap.toFixed(1) +
        '" stroke-dashoffset="' + (-offset).toFixed(1) + '" transform="rotate(-90 ' + cx + " " + cy + ')"/>';
      offset += dash;
      return el;
    }).join("");
    return '<svg viewBox="0 0 ' + size + " " + size + '" xmlns="http://www.w3.org/2000/svg">' +
      circles +
      '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="20" font-weight="900" fill="#1f2328">' + total + "</text>" +
      '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="10" fill="#6b7280">خدمة</text>' +
      "</svg>";
  }

  function barChartVertical(data) {
    var w = 340, h = 190, pad = 30, barGap = 14;
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.2 || 1;
    var barW = (w - pad * 2 - barGap * (data.length - 1)) / data.length;
    var bars = "", labels = "";
    data.forEach(function (d, i) {
      var bh = (d.value / max) * (h - pad * 2);
      var x = pad + i * (barW + barGap);
      var y = h - pad - bh;
      bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + bh.toFixed(1) +
        '" rx="6" fill="#60a5fa"/>' +
        '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#1f2328">' + d.value + "</text>";
      labels += '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (h - 10) + '" text-anchor="middle" font-size="10.5" fill="#6b7280">' + d.label + "</text>";
    });
    return '<svg viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg">' + bars + labels + "</svg>";
  }

  function barChartHorizontal(data) {
    var w = 420, rowH = 30, pad = 8;
    var h = data.length * rowH + pad * 2;
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.15 || 1;
    var labelW = 118, chartW = w - labelW - 40;
    var rows = "";
    data.forEach(function (d, i) {
      var y = pad + i * rowH;
      var bw = (d.value / max) * chartW;
      rows += '<text x="' + (w - labelW - 8) + '" y="' + (y + rowH / 2 + 4) + '" text-anchor="start" font-size="11.5" fill="#1f2328">' + d.label + "</text>" +
        '<rect x="' + (w - labelW - 12 - bw).toFixed(1) + '" y="' + (y + 6) + '" width="' + bw.toFixed(1) + '" height="16" rx="5" fill="#1FA855"/>' +
        '<text x="' + (w - labelW - 16 - bw).toFixed(1) + '" y="' + (y + rowH / 2 + 4) + '" text-anchor="end" font-size="11" font-weight="800" fill="#178a45">' + d.value + "</text>";
    });
    return '<svg viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg">' + rows + "</svg>";
  }

  /* ---------------------------------------------------------------------
     Minimal, self-contained UI helpers (toast + modal) so admin pages
     don't need to depend on the public site's js/script.js at all.
     --------------------------------------------------------------------- */
  function showToast(message, type) {
    var stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    var toast = document.createElement("div");
    toast.className = "toast" + (type && type !== "default" ? " " + type : "");
    toast.setAttribute("role", "status");
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(function () {
      toast.classList.add("hide");
      setTimeout(function () { toast.remove(); }, 250);
    }, 3000);
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("show");
  }
  function closeModal(overlay) {
    if (overlay) overlay.classList.remove("show");
  }

  function initRowMenus() {
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest(".row-menu-btn");
      document.querySelectorAll(".row-menu-list.show").forEach(function (m) {
        if (!trigger || m !== trigger.nextElementSibling) m.classList.remove("show");
      });
      if (trigger) {
        var list = trigger.nextElementSibling;
        if (list) list.classList.toggle("show");
      }
    });
  }

  window.AdminUI = {
    requireAdminAuth: requireAdminAuth,
    initLogout: initLogout,
    initSidebar: initSidebar,
    initials: initials,
    getMergedServiceStats: getMergedServiceStats,
    CATEGORY_LABELS: CATEGORY_LABELS,
    STATUS_COLORS: STATUS_COLORS,
    statusBadge: statusBadge,
    priorityBadge: priorityBadge,
    lineChart: lineChart,
    donutChart: donutChart,
    barChartVertical: barChartVertical,
    barChartHorizontal: barChartHorizontal,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    initRowMenus: initRowMenus
  };
})(window);
