(function (window) {
  "use strict";

  var ACCOUNTS_KEY = "wask_accounts";
  var SESSION_KEY = "wask_auth_session";
  var LOGIN_PAGE = "login .html";
  var HOME_PAGE = "الاساسية/index.html";
  var AUTH_SCRIPT_URL = (document.currentScript && document.currentScript.src) || "";
  var PROJECT_ROOT_URL = AUTH_SCRIPT_URL ? new URL("./", AUTH_SCRIPT_URL).href : new URL("./", window.location.href).href;

  function getAccounts() {
    try {
      var raw = localStorage.getItem(ACCOUNTS_KEY);
      var accounts = raw ? JSON.parse(raw) : [];
      return Array.isArray(accounts) ? accounts : [];
    } catch (error) {
      return [];
    }
  }

  function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function findAccount(identifier) {
    var value = normalize(identifier);
    return getAccounts().find(function (account) {
      return normalize(account.email) === value || normalize(account.phone) === value;
    }) || null;
  }

  function fallbackHash(value) {
    // Only a compatibility fallback for environments without Web Crypto.
    var hash = 2166136261;
    for (var i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function hashPassword(password) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)).then(function (buffer) {
        return Array.from(new Uint8Array(buffer)).map(function (byte) {
          return byte.toString(16).padStart(2, "0");
        }).join("");
      });
    }
    return Promise.resolve(fallbackHash(password));
  }

  function createSession(account) {
    var session = {
      accountId: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function getCurrentUser() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function isAuthenticated() {
    return !!getCurrentUser();
  }

  function loginUser(identifier, password) {
    var account = findAccount(identifier);
    if (!account) return Promise.resolve(null);

    var check = account.passwordHash
      ? hashPassword(password).then(function (hash) { return hash === account.passwordHash; })
      : Promise.resolve(account.password === password);

    return check.then(function (valid) {
      if (!valid) return null;

      // Migrate old local accounts to passwordHash on the first successful login.
      if (!account.passwordHash) {
        return hashPassword(password).then(function (hash) {
          var accounts = getAccounts();
          var current = accounts.find(function (item) { return item.id === account.id; });
          if (current) {
            current.passwordHash = hash;
            delete current.password;
            saveAccounts(accounts);
          }
          return createSession(account);
        });
      }

      return createSession(account);
    });
  }

  function registerUser(data) {
    var email = normalize(data.email);
    var phone = normalize(data.phone);
    var accounts = getAccounts();

    var exists = accounts.some(function (account) {
      return normalize(account.email) === email || normalize(account.phone) === phone;
    });

    if (exists) {
      return Promise.resolve({ ok: false, reason: "exists" });
    }

    return hashPassword(data.password).then(function (passwordHash) {
      var account = {
        id: "user_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
      };
      accounts.push(account);
      saveAccounts(accounts);
      return { ok: true, account: account };
    });
  }

  function getLoginUrl() {
    return new URL(LOGIN_PAGE, PROJECT_ROOT_URL).href;
  }

  function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = getLoginUrl();
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.replace(getLoginUrl());
      return false;
    }
    return true;
  }

  function redirectAfterLogin() {
    window.location.href = new URL(HOME_PAGE, PROJECT_ROOT_URL).href;
  }

  // Every page except the existing login/register screen is protected.
  var currentFile = decodeURIComponent(window.location.pathname.split("/").pop() || "");
  var isLoginPage = currentFile.toLowerCase() === LOGIN_PAGE.toLowerCase();
  if (!isLoginPage) {
    requireAuth();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".logout-item, [data-logout]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        if (button.id === "confirm-logout-btn") return;
        event.preventDefault();
        logoutUser();
      });
    });
  });

  window.WainAuth = {
    getAccounts: getAccounts,
    findAccount: findAccount,
    registerUser: registerUser,
    loginUser: loginUser,
    logoutUser: logoutUser,
    getCurrentUser: getCurrentUser,
    isAuthenticated: isAuthenticated,
    requireAuth: requireAuth,
    redirectAfterLogin: redirectAfterLogin
  };
})(window);
