/*
  ============================================================================
  WIN AL-KHIDMEH (وين الخدمة) — Shared Data Layer
  ============================================================================
  This file simulates a real backend + database for the whole project using
  the browser's localStorage as storage. It is loaded on every page (both the
  public site and the admin dashboard) BEFORE any other script, and exposes
  a single global object: window.WinDB

  Collections:
    - serviceRequests : "طلبات الخدمات"  (users submitting a brand new facility)
    - issueReports    : "البلاغات"        (users reporting a problem with an
                                            existing/published facility)
    - services        : dynamic services created after a request is approved,
                        plus status overrides applied to the static demo
                        SERVICES array declared in الأساسية/js/script.js
    - notifications   : simple notification feed for the admin dashboard
    - activityLog     : human-readable system activity feed
    - adminUsers      : admin accounts (separate from public WinAuth accounts)

  Nothing here talks to a real server — it is a faithful simulation so the
  whole project (public site + admin dashboard) stays fully interactive while
  remaining pure HTML/CSS/JavaScript with no backend, exactly as requested.
  ============================================================================
*/
(function (window) {
  "use strict";

  var STORE_KEY = "winKhidmeh:db:v1";

  /* ---------------------------------------------------------------------
     Low level storage helpers
     --------------------------------------------------------------------- */
  function readStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeStore(db) {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
    return db;
  }

  function uid(prefix) {
    var n = Math.floor(1000 + Math.random() * 9000);
    return prefix + "-" + (Date.now() % 100000) + n;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var yyyy = d.getFullYear();
    return dd + "-" + mm + "-" + yyyy;
  }

  function timeAgo(iso) {
    var diffMs = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return "منذ " + mins + " " + (mins === 1 ? "دقيقة" : "دقائق");
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return "منذ " + hrs + " " + (hrs === 1 ? "ساعة" : "ساعات");
    var days = Math.floor(hrs / 24);
    return "منذ " + days + " " + (days === 1 ? "يوم" : "أيام");
  }

  /* ---------------------------------------------------------------------
     Current user helpers (reads from WinAuth session set by auth.js)
     --------------------------------------------------------------------- */
  function currentUser() {
    try {
      var raw = localStorage.getItem("wask_auth_session");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

 
  
  function buildSeed() {
    var t = Date.now();
    var h = 3600 * 1000;
    var d = 24 * h;

    var issueReports = [
      {
        id: "REP-1245", serviceId: "svc-2", serviceName: "مخبز العودة",
        category: "bakery", gov: "خانيونس", city: "خانيونس - وسط البلد",
        issueType: "closed", issueLabel: "الخدمة مغلقة",
        description: "المخبز مغلق تماماً منذ الصباح ولا يوجد أي إشعار بموعد إعادة الفتح.",
        photos: [], priority: "high", priorityLabel: "عالية",
        status: "new", statusLabel: "جديدة",
        submittedBy: "محمد أحمد", submittedByPhone: "0599123456",
        assignee: null, submittedAt: new Date(t - 2 * h).toISOString(),
        history: [{ action: "submitted", note: "تم إرسال البلاغ", by: "محمد أحمد", at: new Date(t - 2 * h).toISOString() }]
      },
      {
        id: "REP-1244", serviceId: "svc-4", serviceName: "نقطة مياه حي الأمل",
        category: "water", gov: "خانيونس", city: "حي الأمل",
        issueType: "wrong_location", issueLabel: "الموقع غير صحيح",
        description: "الموقع المحدد على الخريطة خاطئ، النقطة الفعلية أبعد بحوالي 300 متر باتجاه الشرق.",
        photos: [], priority: "urgent", priorityLabel: "عاجلة",
        status: "in_review", statusLabel: "قيد المراجعة",
        submittedBy: "سارة محمود", submittedByPhone: "0598877665",
        assignee: "خالد حسن", submittedAt: new Date(t - 4 * h).toISOString(),
        history: [{ action: "submitted", note: "تم إرسال البلاغ", by: "سارة محمود", at: new Date(t - 4 * h).toISOString() }]
      },
      {
        id: "REP-1243", serviceId: "svc-1", serviceName: "مستشفى شهداء الأقصى",
        category: "hospital", gov: "الوسطى", city: "دير البلح - شارع النخل",
        issueType: "wrong_hours", issueLabel: "ساعات العمل غير صحيحة",
        description: "قسم العيادات الخارجية يعمل حتى الساعة 2 ظهراً وليس 4 كما هو مذكور.",
        photos: [], priority: "medium", priorityLabel: "متوسطة",
        status: "approved", statusLabel: "مقبولة",
        submittedBy: "إبراهيم خليل", submittedByPhone: "0597001122",
        assignee: "منى علي", submittedAt: new Date(t - 1 * d).toISOString(),
        history: [{ action: "submitted", note: "تم إرسال البلاغ", by: "إبراهيم خليل", at: new Date(t - 1 * d).toISOString() }]
      }
    ];

    // Pad with a few more lightweight demo rows so tabs/counters feel real.
    var extraStatuses = [
      ["new", "جديدة"], ["needs_info", "تحتاج معلومات"], ["rejected", "مرفوضة"],
      ["escalated", "محولة للأدمن"], ["in_review", "قيد المراجعة"], ["approved", "مقبولة"]
    ];
    var extraTypes = [["overcrowded", "مزدحم جداً"], ["closed", "الخدمة مغلقة"], ["wrong_hours", "ساعات العمل غير صحيحة"]];
    var extraNames = ["صيدلية الرحمة", "مخزن الإغاثة المركزي", "نقطة شحن نور غزة", "مخبز الصمود", "عيادة الشفاء"];
    for (var i = 0; i < 15; i++) {
      var st = extraStatuses[i % extraStatuses.length];
      var ty = extraTypes[i % extraTypes.length];
      issueReports.push({
        id: "REP-" + (1200 - i), serviceId: "svc-" + ((i % 5) + 1), serviceName: extraNames[i % extraNames.length],
        category: "general", gov: ["غزة", "خانيونس", "رفح", "الوسطى", "الشمال"][i % 5],
        city: "منطقة تجريبية", issueType: ty[0], issueLabel: ty[1],
        description: "بيانات تجريبية لبلاغ رقم " + (1200 - i) + " لأغراض العرض التوضيحي للوحة التحكم.",
        photos: [], priority: ["low", "medium", "high", "urgent"][i % 4],
        priorityLabel: ["منخفضة", "متوسطة", "عالية", "عاجلة"][i % 4],
        status: st[0], statusLabel: st[1],
        submittedBy: "مستخدم تجريبي " + (i + 1), submittedByPhone: "0590000" + (100 + i),
        assignee: i % 3 === 0 ? null : "خالد حسن", submittedAt: new Date(t - (i + 2) * h * 3).toISOString(),
        history: [{ action: "submitted", note: "تم إرسال البلاغ", by: "مستخدم تجريبي", at: new Date(t - (i + 2) * h * 3).toISOString() }]
      });
    }

    var serviceRequests = [
      {
        id: "SR-5021", name: "صيدلية الشفاء المركزية", category: "pharmacy", categoryLabel: "صيدلية",
        gov: "غزة", city: "غزة - حي الرمال", address: "شارع الوحدة، مقابل مسجد السبيل",
        phone: "0592345678", email: "", desc: "صيدلية تقدم أدوية الأمراض المزمنة والمسكنات الأساسية.",
        workingNow: true, photos: [], priority: "medium", priorityLabel: "متوسطة",
        status: "new", statusLabel: "جديدة",
        submittedBy: "دلع سالم", assignee: null, submittedAt: new Date(t - 1 * h).toISOString(),
        history: [{ action: "submitted", note: "تم إرسال الطلب", by: "دلع سالم", at: new Date(t - 1 * h).toISOString() }]
      },
      {
        id: "SR-5020", name: "مخبز القدس الاقتصادي", category: "bakery", categoryLabel: "مخبز",
        gov: "خانيونس", city: "خانيونس - حي القدس", address: "شارع المدارس",
        phone: "0591112233", email: "", desc: "مخبز يدوي يقدم الخبز الأساسي بأسعار مدعومة.",
        workingNow: true, photos: [], priority: "high", priorityLabel: "عالية",
        status: "in_review", statusLabel: "قيد المراجعة",
        submittedBy: "محمد علي", assignee: "تركي علي", submittedAt: new Date(t - 6 * h).toISOString(),
        history: [{ action: "submitted", note: "تم إرسال الطلب", by: "محمد علي", at: new Date(t - 6 * h).toISOString() }]
      },
      {
        id: "SR-5019", name: "نقطة توزيع مياه السبيل", category: "water", categoryLabel: "نقطة مياه",
        gov: "الوسطى", city: "دير البلح", address: "بالقرب من مسجد السبيل",
        phone: "0593334455", email: "", desc: "نقطة تعبئة مياه شرب نظيفة مدعومة من منظمة إغاثية.",
        workingNow: true, photos: [], priority: "medium", priorityLabel: "متوسطة",
        status: "approved", statusLabel: "معتمدة",
        submittedBy: "سامي حسين", assignee: "بدر حسين", submittedAt: new Date(t - 2 * d).toISOString(),
        history: [{ action: "submitted", note: "تم إرسال الطلب", by: "سامي حسين", at: new Date(t - 2 * d).toISOString() }]
      }
    ];
    var srStatuses = [["new", "جديدة"], ["in_review", "قيد المراجعة"], ["approved", "معتمدة"], ["rejected", "مرفوضة"], ["needs_info", "تحتاج معلومات"]];
    var srCats = [["pharmacy", "صيدلية"], ["bakery", "مخبز"], ["water", "نقطة مياه"], ["power", "نقطة شحن"], ["hospital", "عيادة"], ["storage", "مخزن"]];
    for (var j = 0; j < 18; j++) {
      var s2 = srStatuses[j % srStatuses.length];
      var c2 = srCats[j % srCats.length];
      serviceRequests.push({
        id: "SR-" + (5000 - j), name: c2[1] + " رقم " + (j + 1), category: c2[0], categoryLabel: c2[1],
        gov: ["غزة", "خانيونس", "رفح", "الوسطى", "الشمال"][j % 5], city: "منطقة تجريبية",
        address: "عنوان تجريبي رقم " + (j + 1), phone: "0590000" + (200 + j), email: "",
        desc: "بيانات تجريبية لطلب إضافة خدمة رقم " + (5000 - j) + ".",
        workingNow: true, photos: [], priority: ["low", "medium", "high"][j % 3],
        priorityLabel: ["منخفضة", "متوسطة", "عالية"][j % 3],
        status: s2[0], statusLabel: s2[1],
        submittedBy: "مستخدم تجريبي " + (j + 1), assignee: j % 4 === 0 ? null : "منى علي",
        submittedAt: new Date(t - (j + 3) * h * 4).toISOString(),
        history: [{ action: "submitted", note: "تم إرسال الطلب", by: "مستخدم تجريبي", at: new Date(t - (j + 3) * h * 4).toISOString() }]
      });
    }

    var activityLog = [
      { id: uid("ACT"), text: "تم قبول بلاغ إغلاق مؤقت لمخبز العودة", icon: "check", at: new Date(t - 40 * 60000).toISOString() },
      { id: uid("ACT"), text: "تسجيل مستخدم جديد: دلع سالم", icon: "user", at: new Date(t - 90 * 60000).toISOString() },
      { id: uid("ACT"), text: "تم رفض طلب إضافة خدمة مكرر", icon: "x", at: new Date(t - 3 * h).toISOString() },
      { id: uid("ACT"), text: "تحديث حالة خدمة: نقطة شحن نور غزة أصبحت مزدحمة", icon: "bolt", at: new Date(t - 5 * h).toISOString() }
    ];

    var notifications = [
      { id: uid("NTF"), text: "لديك 3 بلاغات عاجلة تحتاج مراجعة فورية", read: false, at: new Date(t - 20 * 60000).toISOString() },
      { id: uid("NTF"), text: "تم استلام 5 طلبات خدمة جديدة اليوم", read: false, at: new Date(t - 2 * h).toISOString() }
    ];

    return {
      version: 1,
      issueReports: issueReports,
      serviceRequests: serviceRequests,
      dynamicServices: [],       // services created once a request is approved
      statusOverrides: {},       // { serviceId: {status, statusLabel} } applied over static demo SERVICES
      activityLog: activityLog,
      notifications: notifications,
      adminUsers: [
        {
          id: "admin-1",
          name: "أحمد خليل",
          role: "أمن النظام",
          email: "admin@wainalkhidma.ps",
          // SHA-256("Admin@123") — seeded so the demo admin login works out of the box
          passwordHash: null,
          passwordPlainSeed: "Admin@123"
        }
      ]
    };
  }

  function getDB() {
    var db = readStore();
    if (!db) {
      db = buildSeed();
      writeStore(db);
    }
    // forward-compat: make sure newer fields exist even for older saved DBs
    if (!db.dynamicServices) db.dynamicServices = [];
    if (!db.statusOverrides) db.statusOverrides = {};
    if (!db.notifications) db.notifications = [];
    if (!db.activityLog) db.activityLog = [];
    return db;
  }

  function saveDB(db) {
    return writeStore(db);
  }

  function resetDB() {
    localStorage.removeItem(STORE_KEY);
    return getDB();
  }

  /* ---------------------------------------------------------------------
     Hashing helper shared with auth.js's approach (SHA-256 via WebCrypto)
     --------------------------------------------------------------------- */
  function hashPassword(password) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)).then(function (buffer) {
        return Array.from(new Uint8Array(buffer)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      });
    }
    var hash = 2166136261;
    for (var i = 0; i < password.length; i++) { hash ^= password.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return Promise.resolve((hash >>> 0).toString(16));
  }

  function ensureAdminPasswordSeeded() {
    var db = getDB();
    var admin = db.adminUsers[0];
    if (admin && !admin.passwordHash && admin.passwordPlainSeed) {
      return hashPassword(admin.passwordPlainSeed).then(function (hash) {
        admin.passwordHash = hash;
        delete admin.passwordPlainSeed;
        saveDB(db);
        return db;
      });
    }
    return Promise.resolve(db);
  }

  function adminLogin(email, password) {
    return ensureAdminPasswordSeeded().then(function (db) {
      var norm = String(email || "").trim().toLowerCase();
      var admin = db.adminUsers.find(function (a) { return a.email.toLowerCase() === norm; });
      if (!admin) return null;
      return hashPassword(password).then(function (hash) {
        if (hash !== admin.passwordHash) return null;
        var session = { id: admin.id, name: admin.name, role: admin.role, email: admin.email, loggedInAt: nowISO() };
        localStorage.setItem("wask_admin_session", JSON.stringify(session));
        return session;
      });
    });
  }

  function adminCurrentUser() {
    try {
      var raw = localStorage.getItem("wask_admin_session");
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function adminLogout() {
    localStorage.removeItem("wask_admin_session");
  }

  /* ---------------------------------------------------------------------
     Public-facing submission APIs (used by الأساسية/js/script.js)
     --------------------------------------------------------------------- */
  function submitServiceRequest(data) {
    var db = getDB();
    var user = currentUser();
    var record = Object.assign({
      id: uid("SR"),
      status: "new",
      statusLabel: "جديدة",
      priority: "medium",
      priorityLabel: "متوسطة",
      assignee: null,
      photos: data.photos || [],
      submittedBy: (user && user.name) || "مستخدم",
      submittedAt: nowISO(),
      history: [{ action: "submitted", note: "تم إرسال الطلب من قبل المستخدم", by: (user && user.name) || "مستخدم", at: nowISO() }]
    }, data);
    db.serviceRequests.unshift(record);
    db.activityLog.unshift({ id: uid("ACT"), text: "طلب إضافة خدمة جديد: " + record.name, icon: "plus", at: nowISO() });
    db.notifications.unshift({ id: uid("NTF"), text: "طلب خدمة جديد بانتظار المراجعة: " + record.name, read: false, at: nowISO() });
    saveDB(db);
    return record;
  }

  function submitIssueReport(data) {
    var db = getDB();
    var user = currentUser();
    var record = Object.assign({
      id: uid("REP"),
      status: "new",
      statusLabel: "جديدة",
      priority: "medium",
      priorityLabel: "متوسطة",
      assignee: null,
      photos: data.photos || [],
      submittedBy: (user && user.name) || "مستخدم",
      submittedByPhone: (user && user.phone) || "",
      submittedAt: nowISO(),
      history: [{ action: "submitted", note: "تم إرسال البلاغ من قبل المستخدم", by: (user && user.name) || "مستخدم", at: nowISO() }]
    }, data);
    db.issueReports.unshift(record);
    db.activityLog.unshift({ id: uid("ACT"), text: "بلاغ جديد على خدمة: " + record.serviceName, icon: "flag", at: nowISO() });
    db.notifications.unshift({ id: uid("NTF"), text: "بلاغ جديد بانتظار المراجعة: " + record.serviceName, read: false, at: nowISO() });
    saveDB(db);
    return record;
  }

  function myServiceRequests() {
    var db = getDB();
    var user = currentUser();
    if (!user) return [];
    return db.serviceRequests.filter(function (r) { return r.submittedBy === user.name; });
  }

  function myIssueReports() {
    var db = getDB();
    var user = currentUser();
    if (!user) return [];
    return db.issueReports.filter(function (r) { return r.submittedBy === user.name; });
  }

  /* ---------------------------------------------------------------------
     Admin-facing mutation APIs
     --------------------------------------------------------------------- */
  function addHistory(record, action, note, by) {
    record.history = record.history || [];
    record.history.push({ action: action, note: note, by: by, at: nowISO() });
  }

  var STATUS_LABELS_MAP = {
    new: "جديدة", in_review: "قيد المراجعة", approved: "مقبولة", rejected: "مرفوضة",
    needs_info: "تحتاج معلومات", escalated: "محولة للأدمن"
  };
  var SR_STATUS_LABELS_MAP = {
    new: "جديدة", in_review: "قيد المراجعة", approved: "معتمدة", rejected: "مرفوضة", needs_info: "تحتاج معلومات"
  };

  function updateIssueReportStatus(id, status, note, by) {
    var db = getDB();
    var record = db.issueReports.find(function (r) { return r.id === id; });
    if (!record) return null;
    record.status = status;
    record.statusLabel = STATUS_LABELS_MAP[status] || status;
    addHistory(record, status, note || "", by || "المشرف");

    // If the report is approved and it claims the service is closed/open, reflect that.
    if (status === "approved" && record.serviceId) {
      var map = {
        closed: { status: "closed", statusLabel: "مغلق حالياً" },
        overcrowded: { status: "busy", statusLabel: "مزدحم جداً" },
        wrong_hours: null, wrong_location: null, other: null
      };
      var ov = map[record.issueType];
      if (ov) {
        db.statusOverrides[record.serviceId] = ov;
        db.activityLog.unshift({ id: uid("ACT"), text: "تم تحديث حالة " + record.serviceName + " إلى: " + ov.statusLabel, icon: "bolt", at: nowISO() });
      }
    }
    db.activityLog.unshift({ id: uid("ACT"), text: "تم تحديث حالة البلاغ " + id + " إلى: " + record.statusLabel, icon: "check", at: nowISO() });
    saveDB(db);
    return record;
  }

  function updateServiceRequestStatus(id, status, note, by) {
    var db = getDB();
    var record = db.serviceRequests.find(function (r) { return r.id === id; });
    if (!record) return null;
    record.status = status;
    record.statusLabel = SR_STATUS_LABELS_MAP[status] || status;
    addHistory(record, status, note || "", by || "المشرف");

    if (status === "approved") {
      var exists = db.dynamicServices.find(function (s) { return s.sourceRequestId === id; });
      if (!exists) {
        db.dynamicServices.push({
          id: "dyn-" + record.id,
          sourceRequestId: id,
          title: record.name,
          category: record.category,
          desc: record.desc,
          tag: record.categoryLabel || record.category,
          status: "open",
          statusLabel: "متوفر ومفتوح",
          gov: record.gov,
          meta: [record.address, record.phone].filter(Boolean),
          img: "Pharmacy.png"
        });
        db.activityLog.unshift({ id: uid("ACT"), text: "تم نشر خدمة جديدة: " + record.name, icon: "check", at: nowISO() });
      }
    }
    saveDB(db);
    return record;
  }

  function assignIssueReport(id, assignee) {
    var db = getDB();
    var record = db.issueReports.find(function (r) { return r.id === id; });
    if (!record) return null;
    record.assignee = assignee;
    addHistory(record, "assigned", "تم إسناد البلاغ إلى " + assignee, "المشرف");
    saveDB(db);
    return record;
  }

  function assignServiceRequest(id, assignee) {
    var db = getDB();
    var record = db.serviceRequests.find(function (r) { return r.id === id; });
    if (!record) return null;
    record.assignee = assignee;
    addHistory(record, "assigned", "تم إسناد الطلب إلى " + assignee, "المشرف");
    saveDB(db);
    return record;
  }

  /* ---------------------------------------------------------------------
     Read / stats helpers used by the admin dashboard
     --------------------------------------------------------------------- */
  function listIssueReports(filters) {
    filters = filters || {};
    var db = getDB();
    return db.issueReports.filter(function (r) {
      if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.gov && filters.gov !== "all" && r.gov !== filters.gov) return false;
      if (filters.priority && filters.priority !== "all" && r.priority !== filters.priority) return false;
      if (filters.issueType && filters.issueType !== "all" && r.issueType !== filters.issueType) return false;
      if (filters.assignee && filters.assignee !== "all") {
        if (filters.assignee === "unassigned" ? !!r.assignee : r.assignee !== filters.assignee) return false;
      }
      if (filters.q) {
        var q = filters.q.toLowerCase();
        var hay = (r.serviceName + " " + r.id + " " + (r.submittedBy || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return new Date(b.submittedAt) - new Date(a.submittedAt); });
  }

  function listServiceRequests(filters) {
    filters = filters || {};
    var db = getDB();
    return db.serviceRequests.filter(function (r) {
      if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.gov && filters.gov !== "all" && r.gov !== filters.gov) return false;
      if (filters.category && filters.category !== "all" && r.category !== filters.category) return false;
      if (filters.assignee && filters.assignee !== "all") {
        if (filters.assignee === "unassigned" ? !!r.assignee : r.assignee !== filters.assignee) return false;
      }
      if (filters.q) {
        var q = filters.q.toLowerCase();
        var hay = (r.name + " " + r.id + " " + (r.submittedBy || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return new Date(b.submittedAt) - new Date(a.submittedAt); });
  }

  function getIssueReport(id) { return getDB().issueReports.find(function (r) { return r.id === id; }) || null; }
  function getServiceRequest(id) { return getDB().serviceRequests.find(function (r) { return r.id === id; }) || null; }

  function getStats() {
    var db = getDB();
    var reports = db.issueReports;
    var requests = db.serviceRequests;
    var openReports = reports.filter(function (r) { return r.status === "new" || r.status === "in_review"; }).length;
    var newRequests = requests.filter(function (r) { return r.status === "new"; }).length;
    var approvedRequests = requests.filter(function (r) { return r.status === "approved"; }).length;
    var rejectedTotal = reports.filter(function (r) { return r.status === "rejected"; }).length +
      requests.filter(function (r) { return r.status === "rejected"; }).length;
    return {
      totalReports: reports.length,
      openReports: openReports,
      totalRequests: requests.length,
      newRequests: newRequests,
      approvedRequests: approvedRequests,
      rejectedTotal: rejectedTotal,
      dynamicServicesCount: db.dynamicServices.length
    };
  }

  function countByStatus(list, map) {
    var out = { all: list.length };
    Object.keys(map).forEach(function (key) { out[key] = 0; });
    list.forEach(function (r) { if (out[r.status] !== undefined) out[r.status]++; });
    return out;
  }

  function issueReportCounts() { return countByStatus(getDB().issueReports, STATUS_LABELS_MAP); }
  function serviceRequestCounts() { return countByStatus(getDB().serviceRequests, SR_STATUS_LABELS_MAP); }

  window.WinDB = {
    getDB: getDB, saveDB: saveDB, resetDB: resetDB,
    uid: uid, fmtDate: fmtDate, timeAgo: timeAgo, nowISO: nowISO,
    hashPassword: hashPassword,
    adminLogin: adminLogin, adminCurrentUser: adminCurrentUser, adminLogout: adminLogout,
    submitServiceRequest: submitServiceRequest, submitIssueReport: submitIssueReport,
    myServiceRequests: myServiceRequests, myIssueReports: myIssueReports,
    updateIssueReportStatus: updateIssueReportStatus, updateServiceRequestStatus: updateServiceRequestStatus,
    assignIssueReport: assignIssueReport, assignServiceRequest: assignServiceRequest,
    listIssueReports: listIssueReports, listServiceRequests: listServiceRequests,
    getIssueReport: getIssueReport, getServiceRequest: getServiceRequest,
    getStats: getStats, issueReportCounts: issueReportCounts, serviceRequestCounts: serviceRequestCounts,
    STATUS_LABELS_MAP: STATUS_LABELS_MAP, SR_STATUS_LABELS_MAP: SR_STATUS_LABELS_MAP
  };
})(window);
