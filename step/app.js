/* ============================================================
   وين الخدمة - ملف الجافاسكربت الموحّد لخطوات نموذج إضافة خدمة
   ============================================================
   هذا الملف يجمع منطق الصفحات التالية بملف واحد:
     step.html   -> الموقع والعنوان        (خطوة 2)
     step1.html  -> معلومات التشغيل        (خطوة 3)
     step3.html  -> الصور والمستندات       (خطوة 4)
     step4.html  -> المراجعة والإرسال      (خطوة 5)
     step5.html  -> صفحة النجاح بعد الإرسال

   كل صفحة تحمّل نفس الملف، وكل دالة init تتحقق أولاً من وجود
   عناصرها الخاصة بالـ DOM قبل ما تشتغل، فما في تعارض أو أخطاء
   بين الصفحات.
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     أدوات مساعدة عامة
     ------------------------------------------------------------ */
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function showFieldError(fieldEl, message) {
    var wrapper = fieldEl.closest('.field');
    if (!wrapper) return;
    wrapper.classList.add('error');
    if (!wrapper.querySelector('.error-msg')) {
      var msg = document.createElement('span');
      msg.className = 'error-msg';
      msg.textContent = message || 'هذا الحقل مطلوب';
      wrapper.appendChild(msg);
    }
  }

  function clearFieldError(fieldEl) {
    var wrapper = fieldEl.closest('.field');
    if (!wrapper) return;
    wrapper.classList.remove('error');
    var msg = wrapper.querySelector('.error-msg');
    if (msg) msg.remove();
  }

  // يتحقق من مجموعة حقول مطلوبة، ويظهر رسالة خطأ تحت كل حقل فارغ
  function validateRequiredFields(fields) {
    var isValid = true;
    fields.forEach(function (field) {
      clearFieldError(field);
      if (!field.value.trim()) {
        isValid = false;
        showFieldError(field);
      }
    });
    return isValid;
  }

  /* ------------------------------------------------------------
     حفظ بيانات النموذج مؤقتاً بين الخطوات (sessionStorage)
     -------------------------------------------------------------
     نستخدم sessionStorage عمداً وليس localStorage: كل خطوة هي
     صفحة HTML منفصلة (وليست SPA)، لذا لا يمكن الاحتفاظ بالبيانات
     كمتغير JavaScript عادي بين الصفحات - نحتاج تخزيناً مؤقتاً على
     الأقل أثناء التنقل. sessionStorage يُفرَّغ تلقائياً بمجرد إغلاق
     التبويب/الجلسة، وأيضاً يدوياً بعد الإرسال الناجح أو الإلغاء -
     فهو مسودة مؤقتة فقط وليس بديلاً دائماً عن قاعدة بيانات Backend.
     ------------------------------------------------------------ */
  var STORAGE_KEY = 'weinAlKhedma_serviceDraft';

  function saveDraftData(data) {
    try {
      var existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      for (var key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          existing[key] = data[key];
        }
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      // sessionStorage غير متاح (مثلاً وضع التصفح الخاص) - نتجاهل بصمت
    }
  }

  function getDraftData() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    } catch (err) {
      return {};
    }
  }

  function clearDraftData() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* تجاهل */
    }
  }

  /* ------------------------------------------------------------
     نقطة الاتصال بالـ Backend لاحقاً (لا يوجد Backend الآن)
     ------------------------------------------------------------
     مؤقتاً (لحد ما يصير في Backend حقيقي)، نحفظ الطلب في نفس
     قاعدة البيانات المحلية (WinDB / localStorage) يلي بتستخدمها
     صفحة "خدماتي المضافة" (my-services.html) ولوحة تحكم الأدمن،
     حتى تظهر أي خدمة يضيفها المستخدم فوراً بدل ما تروح بلا أثر.
     ------------------------------------------------------------ */
  var SUBMIT_CATEGORY_LABELS = {
    pharmacy: 'صيدلية', bakery: 'مخبز', water: 'نقطة مياه',
    power: 'نقطة شحن كهرباء', hospital: 'عيادة / مستشفى', storage: 'مركز توزيع مساعدات'
  };
  var SUBMIT_GOV_LABELS = {
    gaza: 'غزة', 'north-gaza': 'شمال غزة', 'deir-albalah': 'دير البلح',
    'khan-younis': 'خان يونس', rafah: 'رفح'
  };

  async function submitService(serviceData) {
    // TODO: Connect to Backend API -> POST /api/services
    // Backend team: replace the WinDB call below with a real fetch()
    // call that sends `serviceData` (see shape built in initReviewStep).
    console.log('submitService() — serviceData ready for Backend:', serviceData);

    if (typeof window.WinDB === 'undefined' || typeof window.WinDB.submitServiceRequest !== 'function') {
      console.warn('submitService(): WinDB غير متوفر بهذه الصفحة — لم يتم حفظ الطلب.');
      return { ok: true, id: null };
    }

    try {
      var address = (serviceData.district ? serviceData.district + ' - ' : '') + (serviceData.address || '');
      var record = window.WinDB.submitServiceRequest({
        name: serviceData.name || '',
        category: serviceData.category || '',
        categoryLabel: SUBMIT_CATEGORY_LABELS[serviceData.category] || serviceData.category || '',
        gov: SUBMIT_GOV_LABELS[serviceData.governorate] || serviceData.governorate || '',
        city: serviceData.city || '',
        address: address,
        phone: serviceData.contactPhone || '',
        email: '',
        desc: serviceData.description || '',
        workingNow: serviceData.status === 'open',
        photos: serviceData.photos || []
      });
      return { ok: true, id: record ? record.id : null };
    } catch (err) {
      console.error('submitService(): فشل حفظ الطلب في WinDB:', err);
      return { ok: false, id: null };
    }
  }
  window.submitService = submitService;

  /* ------------------------------------------------------------
     الانتقال بين صفحات الخطوات
     ------------------------------------------------------------ */
  var STEP_PAGES = ['step0.html', 'step.html', 'step1.html', 'step3.html', 'step4.html', 'step5.html'];

  function goToNextPage(currentFile) {
    var idx = STEP_PAGES.indexOf(currentFile);
    if (idx > -1 && idx < STEP_PAGES.length - 1) {
      window.location.href = STEP_PAGES[idx + 1];
    }
  }

  function goToPrevPage(currentFile) {
    var idx = STEP_PAGES.indexOf(currentFile);
    if (idx > 0) {
      window.location.href = STEP_PAGES[idx - 1];
    } else {
      // أول خطوة بالسلسلة المتوفرة لدينا - نرجع بالمتصفح
      window.history.back();
    }
  }

  /* ------------------------------------------------------------
     زر "إلغاء وإغلاق" - موجود بكل الصفحات (زر أو رابط)
     ------------------------------------------------------------ */
  function initCloseBadge() {
    qsa('.close-badge').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm('هل تريد إلغاء وإغلاق النموذج؟ لن يتم حفظ البيانات المدخلة.')) {
          clearDraftData();
          window.location.reload();
        }
      });
    });
  }

  /* ------------------------------------------------------------
     خطوة 1: المعلومات الأساسية (step0.html)
     ------------------------------------------------------------ */
  function initBasicInfoStep() {
    var form = document.getElementById('basicInfoForm');
    if (!form) return;

    var nameField = document.getElementById('serviceName');
    var phoneField = document.getElementById('contactPhone');
    var descField = document.getElementById('serviceDesc');
    var categorySelector = document.getElementById('categorySelector');
    var categoryButtons = qsa('.category-btn', categorySelector);

    // استرجاع أي بيانات محفوظة سابقاً (عند الرجوع لهذه الخطوة)
    var draft = getDraftData();
    if (draft.name) nameField.value = draft.name;
    if (draft.contactPhone) phoneField.value = draft.contactPhone;
    if (draft.description) descField.value = draft.description;
    if (draft.category) {
      categoryButtons.forEach(function (btn) {
        btn.classList.toggle('selected', btn.dataset.category === draft.category);
      });
    }

    categoryButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        categoryButtons.forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var isValid = validateRequiredFields([nameField, phoneField, descField]);
      var selectedCategory = categorySelector.querySelector('.category-btn.selected');

      if (!selectedCategory) {
        alert('يرجى اختيار فئة الخدمة');
        isValid = false;
      }
      if (descField.value.trim() && descField.value.trim().length < 10) {
        showFieldError(descField, 'الوصف يجب ألا يقل عن 10 أحرف');
        isValid = false;
      }
      if (phoneField.value.trim() && !/^(\+?970|0)?5\d{8}$/.test(phoneField.value.trim().replace(/[\s-]/g, ''))) {
        showFieldError(phoneField, 'الرجاء إدخال رقم هاتف صحيح');
        isValid = false;
      }

      if (!isValid) return;

      saveDraftData({
        name: nameField.value.trim(),
        category: selectedCategory.dataset.category,
        contactPhone: phoneField.value.trim(),
        description: descField.value.trim()
      });

      goToNextPage('step0.html');
    });
  }

  /* ------------------------------------------------------------
     خطوة 2: الموقع والعنوان (step.html)
     ------------------------------------------------------------ */
  function initLocationStep() {
    var form = document.getElementById('locationForm');
    if (!form) return;

    var governorate = document.getElementById('governorate');
    var city = document.getElementById('city');
    var district = document.getElementById('district');
    var fullAddress = document.getElementById('fullAddress');
    var pinBtn = document.getElementById('pinBtn');
    var mapText = qs('.map-text', form.parentElement) || qs('.map-text');
    var prevBtn = document.getElementById('prevBtn');

    // استرجاع أي بيانات محفوظة سابقاً (عند الرجوع لهذه الخطوة)
    var draft = getDraftData();
    if (draft.governorate) governorate.value = draft.governorate;
    if (draft.district) district.value = draft.district;
    if (draft.fullAddress) fullAddress.value = draft.fullAddress;
    if (draft.latitude != null && pinBtn) {
      pinBtn.classList.add('pinned');
      pinBtn.textContent = 'تم تحديد الموقع التقريبي';
    }

    // تفعيل شكل "ممتلئ" على القوائم المنسدلة بعد الاختيار
    qsa('.field select', form).forEach(function (select) {
      select.addEventListener('change', function () {
        select.classList.toggle('filled', select.value !== '');
      });
    });

    // المدينة تعتمد على المحافظة المختارة فقط - لا يمكن اختيار مدينة
    // تابعة لمحافظة أخرى
    var CITIES_BY_GOV_CODE = {
      'gaza': [['gaza-city', 'مدينة غزة'], ['al-shejaiya', 'الشجاعية'], ['al-zaytoun', 'الزيتون'], ['al-rimal', 'الرمال']],
      'north-gaza': [['jabalia', 'جباليا'], ['beit-lahia', 'بيت لاهيا'], ['beit-hanoun', 'بيت حانون']],
      'deir-albalah': [['deir-albalah', 'دير البلح'], ['al-nuseirat', 'النصيرات'], ['al-breij', 'البريج'], ['al-maghazi', 'المغازي']],
      'khan-younis': [['khan-younis', 'خان يونس'], ['bani-suheila', 'بني سهيلا'], ['abasan', 'عبسان']],
      'rafah': [['rafah-city', 'مدينة رفح'], ['al-shawka', 'الشوكة'], ['tel-alsultan', 'تل السلطان']]
    };

    function populateCitiesForGovernorate(selectedCityValue) {
      var cities = CITIES_BY_GOV_CODE[governorate.value] || [];
      city.innerHTML = '';
      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.disabled = true;
      placeholder.selected = true;
      placeholder.textContent = cities.length ? '-- اختر المدينة --' : '-- اختر المحافظة أولاً --';
      city.appendChild(placeholder);
      cities.forEach(function (pair) {
        var opt = document.createElement('option');
        opt.value = pair[0];
        opt.textContent = pair[1];
        city.appendChild(opt);
      });
      city.disabled = cities.length === 0;
      if (selectedCityValue && cities.some(function (p) { return p[0] === selectedCityValue; })) {
        city.value = selectedCityValue;
        city.classList.add('filled');
      }
    }

    governorate.addEventListener('change', function () {
      populateCitiesForGovernorate(null);
    });

    // عند العودة لهذه الخطوة، أعد بناء قائمة المدن حسب المحافظة
    // المحفوظة مسبقاً واسترجع المدينة المختارة إن كانت ضمنها
    if (governorate.value) populateCitiesForGovernorate(draft.city || null);

    // زر تثبيت الموقع الحقيقي عبر GPS (Geolocation الحقيقي)
    if (pinBtn) {
      pinBtn.addEventListener('click', function () {
        if (!governorate.value || !city.value) {
          alert('يرجى اختيار المحافظة والمدينة أولاً');
          return;
        }
        if (!navigator.geolocation) {
          alert('المتصفح الحالي لا يدعم تحديد الموقع الجغرافي (GPS)');
          return;
        }
        var originalText = pinBtn.textContent;
        pinBtn.disabled = true;
        pinBtn.textContent = 'جارٍ تحديد الموقع...';

        navigator.geolocation.getCurrentPosition(
          function (position) {
            pinBtn.disabled = false;
            pinBtn.classList.add('pinned');
            pinBtn.textContent = 'تم تحديد الموقع بدقة عبر GPS ✓';
            saveDraftData({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            if (mapText) {
              mapText.textContent = 'تم تحديد الموقع الفعلي عبر GPS بناءً على ' + city.value + ' - ' + governorate.value;
            }
          },
          function (err) {
            pinBtn.disabled = false;
            pinBtn.textContent = originalText;
            var message = 'تعذر تحديد موقعك عبر GPS.';
            if (err.code === err.PERMISSION_DENIED) message = 'تم رفض إذن الوصول للموقع.';
            else if (err.code === err.POSITION_UNAVAILABLE) message = 'الموقع الجغرافي غير متوفر حالياً.';
            else if (err.code === err.TIMEOUT) message = 'انتهت مهلة تحديد الموقع، حاول مجدداً.';
            alert(message + ' يمكنك المتابعة بدون تحديد GPS دقيق.');
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      });
    }

    // زر السابق
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToPrevPage('step.html');
      });
    }

    // التحقق من الحقول المطلوبة، حفظ البيانات، والانتقال للخطوة التالية
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var isValid = validateRequiredFields([governorate, city, district, fullAddress]);
      if (!isValid) return;

      saveDraftData({
        governorate: governorate.value,
        city: city.value,
        district: district.value,
        fullAddress: fullAddress.value
      });

      goToNextPage('step.html');
    });
  }

  /* ------------------------------------------------------------
     خطوة 3: معلومات التشغيل (step1.html)
     ------------------------------------------------------------ */
  function initOperatingStep() {
    var form = document.getElementById('serviceForm');
    var daySelector = document.getElementById('daySelector');
    // نميّز هذه الصفحة عن باقي صفحات serviceForm بوجود daySelector
    if (!form || !daySelector) return;

    var statusGrid = document.getElementById('statusGrid');
    var prevBtn = qs('.form-actions .btn-secondary', form);

    // استرجاع البيانات المحفوظة سابقاً عند الرجوع لهذه الخطوة
    var draft = getDraftData();
    var dayButtonsAll = qsa('.day-btn', daySelector);
    if (Array.isArray(draft.workDays)) {
      dayButtonsAll.forEach(function (btn) {
        btn.classList.toggle('selected', draft.workDays.indexOf(btn.dataset.day) > -1);
      });
    }
    if (draft.openTime) form.openTime.value = draft.openTime;
    if (draft.closeTime) form.closeTime.value = draft.closeTime;
    if (draft.status) {
      qsa('.status-card', statusGrid || form).forEach(function (card) {
        card.classList.toggle('selected', card.dataset.status === draft.status);
      });
    }

    // اختيار أيام العمل (تعدد اختيارات)
    var dayButtons = qsa('.day-btn', daySelector);
    dayButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.toggle('selected');
      });
    });

    // الحالة التشغيلية (اختيار واحد فقط)
    var statusCards = qsa('.status-card', statusGrid || form);
    statusCards.forEach(function (card) {
      card.addEventListener('click', function () {
        statusCards.forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToPrevPage('step1.html');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var selectedDays = qsa('.day-btn.selected', daySelector).map(function (b) {
        return b.dataset.day;
      });
      var openTime = form.openTime.value;
      var closeTime = form.closeTime.value;
      var selectedStatusCard = form.querySelector('.status-card.selected');

      if (selectedDays.length === 0) {
        alert('يرجى اختيار يوم عمل واحد على الأقل');
        return;
      }
      if (!openTime || !closeTime) {
        alert('يرجى تحديد ساعات فتح وإغلاق الخدمة');
        return;
      }
      if (openTime >= closeTime) {
        alert('وقت الإغلاق يجب أن يكون بعد وقت الفتح، يرجى التأكد من الأوقات المدخلة');
        return;
      }
      if (!selectedStatusCard) {
        alert('يرجى اختيار الحالة التشغيلية للخدمة');
        return;
      }

      saveDraftData({
        workDays: selectedDays,
        openTime: openTime,
        closeTime: closeTime,
        status: selectedStatusCard.dataset.status
      });

      goToNextPage('step1.html');
    });
  }

  /* ------------------------------------------------------------
     خطوة 4: الصور والمستندات (step3.html)
     ------------------------------------------------------------ */
  function initMediaStep() {
    var form = document.getElementById('serviceForm');
    var uploadZone = document.getElementById('uploadZone');
    // نميّز هذه الصفحة بوجود uploadZone
    if (!form || !uploadZone) return;

    var photoInput = document.getElementById('photoInput');
    var uploadList = document.getElementById('uploadList');
    var docTags = qsa('.doc-tag', form);
    var prevBtn = qs('.form-actions .btn-secondary', form);

    var MAX_SIZE_MB = 5;
    var ALLOWED_TYPES = ['image/jpeg', 'image/png'];

    // كل صورة: { name, size, dataUrl } - نخزّن الـ dataUrl الفعلي (وليس
    // عدد الصور فقط) لكي تظهر معاينة حقيقية في خطوة المراجعة لاحقاً.
    var draft = getDraftData();
    var uploadedFiles = Array.isArray(draft.photos) ? draft.photos.slice() : [];

    function renderFileList() {
      uploadList.innerHTML = '';
      uploadedFiles.forEach(function (file, index) {
        var li = document.createElement('li');

        var infoWrap = document.createElement('div');
        infoWrap.className = 'file-info';

        var thumb = document.createElement('img');
        thumb.className = 'thumb';
        thumb.src = file.dataUrl;
        thumb.alt = 'معاينة الصورة';

        var nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.textContent = file.name;

        infoWrap.appendChild(thumb);
        infoWrap.appendChild(nameSpan);

        var removeBtn = document.createElement('span');
        removeBtn.className = 'remove-file';
        removeBtn.setAttribute('data-index', index);
        removeBtn.setAttribute('role', 'button');
        removeBtn.setAttribute('aria-label', 'حذف الصورة');
        removeBtn.textContent = '×';

        li.appendChild(infoWrap);
        li.appendChild(removeBtn);
        uploadList.appendChild(li);
      });
      saveDraftData({ photos: uploadedFiles });
    }

    function addFiles(fileList) {
      Array.prototype.forEach.call(fileList, function (file) {
        if (ALLOWED_TYPES.indexOf(file.type) === -1) {
          alert('نوع الملف "' + file.name + '" غير مدعوم. الرجاء رفع صور JPG أو PNG فقط.');
          return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          alert('حجم الملف "' + file.name + '" يتجاوز ' + MAX_SIZE_MB + ' ميجابايت.');
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          uploadedFiles.push({ name: file.name, size: file.size, dataUrl: e.target.result });
          renderFileList();
        };
        reader.readAsDataURL(file);
      });
    }

    renderFileList();

    photoInput.addEventListener('change', function () {
      addFiles(photoInput.files);
      photoInput.value = '';
    });

    uploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', function () {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      addFiles(e.dataTransfer.files);
    });

    uploadList.addEventListener('click', function (e) {
      if (!e.target.classList.contains('remove-file')) return;
      var index = Number(e.target.dataset.index);
      uploadedFiles.splice(index, 1);
      renderFileList();
    });

    // وسوم المستندات الإضافية (تبديل حالة "مضاف")
    var savedDocs = Array.isArray(draft.attachedDocs) ? draft.attachedDocs : [];
    docTags.forEach(function (tag) {
      if (savedDocs.indexOf(tag.dataset.doc) > -1) {
        tag.classList.add('added');
        var icon0 = tag.querySelector('.doc-icon');
        if (icon0) icon0.textContent = '✓';
      }
      tag.addEventListener('click', function () {
        tag.classList.toggle('added');
        var icon = tag.querySelector('.doc-icon');
        if (icon) icon.textContent = tag.classList.contains('added') ? '✓' : '+';
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToPrevPage('step3.html');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var attachedDocs = docTags
        .filter(function (t) { return t.classList.contains('added'); })
        .map(function (t) { return t.dataset.doc; });

      saveDraftData({
        photos: uploadedFiles,
        attachedDocs: attachedDocs
      });

      goToNextPage('step3.html');
    });
  }

  /* ------------------------------------------------------------
     خطوة 5: المراجعة والإرسال (step4.html)
     ------------------------------------------------------------ */
  function initReviewStep() {
    var form = document.getElementById('serviceForm');
    var confirmCheck = document.getElementById('confirmCheck');
    // نميّز هذه الصفحة بوجود confirmCheck
    if (!form || !confirmCheck) return;

    var prevBtn = qs('.form-actions .btn-secondary', form);
    var draft = getDraftData();

    var CATEGORY_LABELS = {
      pharmacy: 'صيدلية', bakery: 'مخبز', water: 'نقطة مياه',
      power: 'نقطة شحن كهرباء', hospital: 'عيادة / مستشفى', storage: 'مركز توزيع مساعدات'
    };
    var STATUS_LABELS = {
      open: 'متوفر / مفتوح', busy: 'مزدحم جداً', closed: 'متوقف مؤقتاً', unavailable: 'غير مؤكد'
    };
    var GOV_LABELS = {
      gaza: 'غزة', 'north-gaza': 'شمال غزة', 'deir-albalah': 'دير البلح',
      'khan-younis': 'خان يونس', rafah: 'رفح'
    };
    var DAY_LABELS = {
      sat: 'السبت', sun: 'الأحد', mon: 'الاثنين', tue: 'الثلاثاء',
      wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة'
    };

    function setText(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = (value === undefined || value === null || value === '') ? '—' : value;
    }

    // ---- تعبئة كل حقول المراجعة ببيانات المستخدم الفعلية ----
    setText('rvName', draft.name);
    setText('rvCategory', CATEGORY_LABELS[draft.category] || draft.category);
    setText('rvPhone', draft.contactPhone);
    setText('rvStatus', STATUS_LABELS[draft.status] || draft.status);
    setText('rvDesc', draft.description);
    setText('rvGov', GOV_LABELS[draft.governorate] || draft.governorate);
    setText('rvCity', draft.city);
    setText('rvAddress', (draft.district ? draft.district + ' - ' : '') + (draft.fullAddress || ''));
    setText('rvHours', (draft.openTime && draft.closeTime) ? ('من ' + draft.openTime + ' إلى ' + draft.closeTime) : null);

    if (Array.isArray(draft.workDays) && draft.workDays.length) {
      setText('rvDays', draft.workDays.map(function (d) { return DAY_LABELS[d] || d; }).join('، '));
    }

    if (draft.latitude != null && draft.longitude != null) {
      setText('rvGeo', draft.latitude.toFixed(5) + ', ' + draft.longitude.toFixed(5));
    }

    var docsCount = Array.isArray(draft.attachedDocs) ? draft.attachedDocs.length : 0;
    setText('rvDocsCount', docsCount + (docsCount === 1 ? ' مستند' : ' مستندات'));

    var photos = Array.isArray(draft.photos) ? draft.photos : [];
    setText('rvPhotosCount', photos.length + (photos.length === 1 ? ' صورة' : ' صور'));

    var photosPreview = document.getElementById('rvPhotosPreview');
    if (photosPreview) {
      photosPreview.innerHTML = '';
      photos.forEach(function (photo) {
        var img = document.createElement('img');
        img.src = photo.dataUrl;
        img.alt = photo.name;
        img.style.cssText = 'width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--border-color);';
        photosPreview.appendChild(img);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToPrevPage('step4.html');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!confirmCheck.checked) {
        alert('يرجى تأكيد صحة المعلومات قبل إرسال الخدمة للمراجعة');
        return;
      }

      // تجميع كل بيانات الخطوات الخمس في كائن واحد جاهز لإرساله
      // لاحقاً إلى Backend API الحقيقي
      var serviceData = {
        name: draft.name || '',
        category: draft.category || '',
        governorate: draft.governorate || '',
        city: draft.city || '',
        district: draft.district || '',
        address: draft.fullAddress || '',
        latitude: draft.latitude != null ? draft.latitude : null,
        longitude: draft.longitude != null ? draft.longitude : null,
        contactPhone: draft.contactPhone || '',
        description: draft.description || '',
        status: draft.status || '',
        workingDays: Array.isArray(draft.workDays) ? draft.workDays : [],
        openingTime: draft.openTime || '',
        closingTime: draft.closeTime || '',
        attachedDocs: Array.isArray(draft.attachedDocs) ? draft.attachedDocs : [],
        photos: photos // [{ name, size, dataUrl }] - Backend سيستبدل dataUrl برفع ملف حقيقي
      };

      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      submitService(serviceData).then(function () {
        clearDraftData();
        goToNextPage('step4.html');
      }).catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        alert('تعذر إرسال البيانات، يرجى المحاولة مرة أخرى.');
      });
    });
  }

  /* ------------------------------------------------------------
     صفحة النجاح بعد الإرسال (step5.html)
     ------------------------------------------------------------ */
  function initSuccessStep() {
    var browseBtn = document.getElementById('browse-btn');
    if (!browseBtn) return;

    // البيانات المؤقتة انتهت مهمتها بعد إتمام الإرسال بنجاح
    // (تم مسحها أصلاً في initReviewStep بعد submitService الناجح،
    // لكن نكررها هنا احتياطاً لو وصل المستخدم لهذه الصفحة مباشرة)
    clearDraftData();
    // browse-btn أصبح رابطاً حقيقياً (<a href="../الاساسية/my-services.html">)
    // لذا لا حاجة لأي معالج نقر وهمي هنا بعد الآن.
  }

  /* ------------------------------------------------------------
     نقطة الانطلاق - كل صفحة تشغّل فقط الأجزاء التي تخصها
     ------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initCloseBadge();
    initBasicInfoStep();
    initLocationStep();
    initOperatingStep();
    initMediaStep();
    initReviewStep();
    initSuccessStep();
  });
})();