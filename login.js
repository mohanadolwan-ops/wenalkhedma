 (function(){
  "use strict";

  /* ---------------- Navigation ---------------- */
  var views = document.querySelectorAll(".view");

  function showView(name){
    views.forEach(function(v){
      v.classList.toggle("active", v.id === "view-" + name);
    });
    window.scrollTo({top:0, behavior:"smooth"});
  }

  document.querySelectorAll("[data-goto]").forEach(function(btn){
    btn.addEventListener("click", function(){
      showView(btn.getAttribute("data-goto"));
    });
  });

  /* ---------------- Toast ---------------- */
  var toastEl = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message, isError){
    toastEl.textContent = message;
    toastEl.classList.toggle("error", !!isError);
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){
      toastEl.classList.remove("show");
    }, 2600);
  }

  /* ---------------- Validation helpers ---------------- */
  function setError(fieldId, hasError, message){
    var field = document.getElementById(fieldId);
    var input = field.querySelector("input");
    var errorEl = field.querySelector(".field-error");
    field.classList.toggle("has-error", hasError);
    input.classList.toggle("invalid", hasError);
    if(hasError && message && errorEl){
      errorEl.textContent = message;
    }
  }

  /* ---------------- Authentication ---------------- */
  var Auth = window.WainAuth;
  if (!Auth) {
    showToast("تعذر تحميل نظام تسجيل الدخول", true);
    return;
  }

  function isEmailOrPhone(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^0\d{8,9}$/.test(value);
  }
  function isEmail(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  function isPhone(value){
    return /^0\d{8,9}$/.test(value);
  }

  /* ---------------- Password visibility ---------------- */
  document.querySelectorAll(".toggle-eye").forEach(function(eye){
    eye.addEventListener("click", function(){
      var input = document.getElementById(eye.getAttribute("data-target"));
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  /* ---------------- Login form ---------------- */
  var formLogin = document.getElementById("form-login");
  formLogin.addEventListener("submit", function(e){
    e.preventDefault();
    var idVal = document.getElementById("login-id").value.trim();
    var passVal = document.getElementById("login-pass").value.trim();

    var idOk = isEmailOrPhone(idVal);
    var passOk = passVal.length > 0;
    var missing = [];

    if(!idOk){
      setError("login-id-field", true, idVal === "" ? "الرجاء إدخال البريد الإلكتروني أو رقم الهاتف" : "صيغة البريد الإلكتروني أو رقم الهاتف غير صحيحة");
      missing.push("البريد الإلكتروني أو رقم الهاتف");
    } else {
      setError("login-id-field", false);
    }

    if(!passOk){
      setError("login-pass-field", true, "الرجاء إدخال كلمة المرور");
      missing.push("كلمة المرور");
    } else {
      setError("login-pass-field", false);
    }

    if(missing.length){
      showToast("الرجاء تعبئة: " + missing.join("، "), true);
      return;
    }

    var submitBtn = document.getElementById("login-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري تسجيل الدخول...";

    Auth.loginUser(idVal, passVal).then(function(account){
      if(!account){
        setError("login-id-field", true, "البيانات غير صحيحة، تأكد من إنشاء حساب مسبقاً");
        setError("login-pass-field", true, "كلمة المرور غير مطابقة للحساب المسجّل");
        showToast("البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة", true);
        submitBtn.disabled = false;
        submitBtn.textContent = "تسجيل الدخول";
        return;
      }

      showToast("تم تسجيل الدخول بنجاح، أهلاً بعودتك يا " + account.name + "!");
      formLogin.reset();
      setTimeout(function(){
        Auth.redirectAfterLogin();
      }, 500);
    }).catch(function(){
      showToast("حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى", true);
      submitBtn.disabled = false;
      submitBtn.textContent = "تسجيل الدخول";
    });
  });

  /* ---------------- Signup form ---------------- */
  var formSignup = document.getElementById("form-signup");
  formSignup.addEventListener("submit", function(e){
    e.preventDefault();
    var nameVal = document.getElementById("signup-name").value.trim();
    var phoneVal = document.getElementById("signup-phone").value.trim();
    var emailVal = document.getElementById("signup-email").value.trim();
    var passVal = document.getElementById("signup-pass").value.trim();

    var agreeVal = document.getElementById("signup-agree").checked;

    var nameOk = nameVal.length >= 3;
    var phoneOk = isPhone(phoneVal);
    var emailOk = isEmail(emailVal);
    var passOk = passVal.length >= 6;
    var agreeOk = agreeVal === true;
    var missing = [];

    if(!nameOk){
      setError("signup-name-field", true, nameVal === "" ? "الرجاء إدخال الاسم الكامل" : "الاسم يجب أن يكون 3 أحرف على الأقل");
      missing.push("الاسم الكامل");
    } else {
      setError("signup-name-field", false);
    }

    if(!phoneOk){
      setError("signup-phone-field", true, phoneVal === "" ? "الرجاء إدخال رقم الهاتف" : "صيغة رقم الهاتف غير صحيحة");
      missing.push("رقم الهاتف");
    } else {
      setError("signup-phone-field", false);
    }

    if(!emailOk){
      setError("signup-email-field", true, emailVal === "" ? "الرجاء إدخال البريد الإلكتروني" : "صيغة البريد الإلكتروني غير صحيحة");
      missing.push("البريد الإلكتروني");
    } else {
      setError("signup-email-field", false);
    }

    if(!passOk){
      setError("signup-pass-field", true, passVal === "" ? "الرجاء إدخال كلمة المرور" : "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      missing.push("كلمة المرور");
    } else {
      setError("signup-pass-field", false);
    }

    if(!agreeOk){
      setError("signup-agree-field", true, "يجب الموافقة على شروط الاستخدام والخصوصية للمتابعة");
      missing.push("الموافقة على الشروط والأحكام");
    } else {
      setError("signup-agree-field", false);
    }

    if(missing.length){
      showToast("الرجاء تعبئة: " + missing.join("، "), true);
      return;
    }

    var submitBtn = document.getElementById("signup-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري إنشاء الحساب...";

    Auth.registerUser({
      name: nameVal,
      phone: phoneVal,
      email: emailVal,
      password: passVal
    }).then(function(result){
      if(!result.ok){
        setError("signup-email-field", true, "هذا البريد الإلكتروني أو رقم الهاتف مسجّل بحساب مسبقاً");
        showToast("يوجد حساب بهذا البريد الإلكتروني أو رقم الهاتف مسبقاً، جرّب تسجيل الدخول", true);
        submitBtn.disabled = false;
        submitBtn.textContent = "إنشاء حساب";
        return;
      }

      submitBtn.disabled = false;
      submitBtn.textContent = "إنشاء حساب";
      showToast("تم إنشاء حسابك بنجاح! يمكنك تسجيل الدخول الآن");
      formSignup.reset();
      showView("login");
    }).catch(function(){
      showToast("حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى", true);
      submitBtn.disabled = false;
      submitBtn.textContent = "إنشاء حساب";
    });
  });

  /* ---------------- Forgot password form ---------------- */
  var formForgot = document.getElementById("form-forgot");
  formForgot.addEventListener("submit", function(e){
    e.preventDefault();
    var emailVal = document.getElementById("forgot-email").value.trim();
    var emailOk = isEmail(emailVal);

    setError("forgot-email-field", !emailOk);

    if(!emailOk){
      showToast("الرجاء إدخال بريد إلكتروني صحيح", true);
      return;
    }

    var submitBtn = document.getElementById("forgot-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري الإرسال...";

    setTimeout(function(){
      submitBtn.disabled = false;
      submitBtn.textContent = "إرسال كود الاسترداد";
      formForgot.reset();
      showView("reset-success");
    }, 900);
  });

  /* ---------------- Clear error state on typing ---------------- */
  document.querySelectorAll(".field input").forEach(function(input){
    input.addEventListener("input", function(){
      var field = input.closest(".field");
      field.classList.remove("has-error");
      input.classList.remove("invalid");
    });
  });

})();

