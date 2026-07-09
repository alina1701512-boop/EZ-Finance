document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');

  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var isOpen = header.classList.contains('nav-open');
      header.classList.toggle('nav-open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', !isOpen);
    });

    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function (e) {
      if (header.classList.contains('nav-open')) {
        var isClickInside = header.contains(e.target);
        if (!isClickInside) {
          header.classList.remove('nav-open');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        header.classList.remove('nav-open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ============================================================
     ПРОГРЕСС-БАР
     ============================================================ */
  var progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    });
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (q && a) {
      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove('open');
            var openA = openItem.querySelector('.faq-a');
            if (openA) openA.style.maxHeight = null;
          }
        });
        if (isOpen) {
          item.classList.remove('open');
          a.style.maxHeight = null;
        } else {
          item.classList.add('open');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          q.click();
        }
      });
    }
  });

  /* ============================================================
     КАЛЬКУЛЯТОР (3 шага)
     ============================================================ */
  var calculator = document.getElementById('calculatorSteps');
  if (calculator) {
    var steps = calculator.querySelectorAll('.calc-step');
    var result = calculator.querySelector('.calc-result');
    var currentStep = 1;
    var totalSteps = steps.length;
    var selectedValues = {};

    function showStep(step) {
      steps.forEach(function (s) {
        s.style.display = 'none';
        s.classList.remove('active');
      });
      var targetStep = calculator.querySelector('.calc-step[data-step="' + step + '"]');
      if (targetStep) {
        targetStep.style.display = 'block';
        targetStep.classList.add('active');
      }
      if (step > totalSteps) {
        // Показать результат
        steps.forEach(function (s) { s.style.display = 'none'; });
        result.style.display = 'block';
        updateResult();
      }
    }

    function updateResult() {
      var price = '79 000';
      // Простая логика: если оборот больше 10 млн — цена выше
      if (selectedValues['2'] === '10+') {
        price = '149 000';
      } else if (selectedValues['2'] === '3-10') {
        price = '99 000';
      }
      result.querySelector('.calc-price').innerHTML = 'от ' + price + ' ₽ <span>/ мес</span>';
    }

    // Обработчики для каждой группы опций
    calculator.querySelectorAll('.calc-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var parentStep = this.closest('.calc-step');
        var step = parseInt(parentStep.dataset.step, 10);
        var value = this.dataset.value;

        // Снимаем выделение с других опций в этом шаге
        parentStep.querySelectorAll('.calc-option').forEach(function (o) {
          o.classList.remove('selected');
        });
        this.classList.add('selected');

        // Сохраняем выбранное значение
        selectedValues[step] = value;

        // Переход к следующему шагу
        if (step < totalSteps) {
          currentStep = step + 1;
          showStep(currentStep);
        } else {
          // Последний шаг — показываем результат
          showStep(totalSteps + 1);
        }
      });
    });

    // Кнопка "Пройти заново"
    var restartBtn = calculator.querySelector('.calc-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        selectedValues = {};
        steps.forEach(function (s) {
          s.style.display = 'none';
          s.querySelectorAll('.calc-option').forEach(function (o) {
            o.classList.remove('selected');
          });
        });
        result.style.display = 'none';
        currentStep = 1;
        showStep(1);
      });
    }

    // Показываем первый шаг
    showStep(1);
  }

  /* ============================================================
     FORM VALIDATION + HONEYPOT + RATE LIMITING
     ============================================================ */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var timeField = form.querySelector('._form_time');
    if (timeField) timeField.value = Date.now();

    var firstInput = form.querySelector('input:not([type="hidden"])');
    if (firstInput) {
      setTimeout(function () { firstInput.focus(); }, 500);
    }

    form.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        field.style.borderColor = '';
        var errorEl = field.closest('.form-field').querySelector('.field-error');
        if (errorEl) errorEl.textContent = '';
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      var submitBtn = form.querySelector('#submitBtn');
      var btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
      var btnLoader = submitBtn ? submitBtn.querySelector('.btn-loader') : null;

      if (timeField) {
        var submitTime = Date.now();
        var formTime = parseInt(timeField.value, 10);
        if (submitTime - formTime < 5000) {
          valid = false;
          var rateError = form.querySelector('.rate-error');
          if (!rateError) {
            var errorDiv = document.createElement('div');
            errorDiv.className = 'rate-error';
            errorDiv.style.cssText = 'color:#E08A7D;font-size:13px;margin-top:8px;text-align:center;';
            errorDiv.textContent = 'Пожалуйста, подождите несколько секунд перед отправкой.';
            form.appendChild(errorDiv);
          }
        }
      }

      form.querySelectorAll('[required]').forEach(function (field) {
        if (!validateField(field)) valid = false;
      });

      var honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value.trim() !== '') {
        valid = false;
        honeypot.style.borderColor = '#E08A7D';
        var errorEl = honeypot.closest('.form-field').querySelector('.field-error');
        if (errorEl) errorEl.textContent = 'Обнаружена подозрительная активность';
      }

      if (valid) {
        if (submitBtn) {
          submitBtn.disabled = true;
          if (btnText) btnText.style.display = 'none';
          if (btnLoader) btnLoader.style.display = 'inline-block';
        }

        var formData = new FormData(form);
        fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
        .then(function (response) {
          if (response.ok) {
            var wrap = form.closest('.form-wrap');
            var success = wrap ? wrap.parentElement.querySelector('.form-success') : null;
            if (wrap) form.style.display = 'none';
            if (success) success.classList.add('show');
          } else {
            alert('Произошла ошибка при отправке. Попробуйте еще раз.');
          }
        })
        .catch(function () {
          alert('Произошла ошибка при отправке. Попробуйте еще раз.');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline-block';
            if (btnLoader) btnLoader.style.display = 'none';
          }
        });
      } else {
        var firstError = form.querySelector('[style*="border-color: #E08A7D"]');
        if (firstError) firstError.focus();
      }
    });
  });

  function validateField(field) {
    var errorEl = field.closest('.form-field').querySelector('.field-error');
    var value = field.value.trim();
    var fieldValid = true;
    var errorMessage = '';
    if (!value) {
      fieldValid = false;
      errorMessage = 'Заполните это поле';
    } else if (field.type === 'tel') {
      var digits = value.replace(/\D/g, '');
      if (digits.length < 10) {
        fieldValid = false;
        errorMessage = 'Введите корректный телефон';
      }
    } else if (field.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldValid = false;
        errorMessage = 'Введите корректный email';
      }
    }
    if (!fieldValid) {
      field.style.borderColor = '#E08A7D';
      if (errorEl) errorEl.textContent = errorMessage;
    } else {
      field.style.borderColor = '';
      if (errorEl) errorEl.textContent = '';
    }
    return fieldValid;
  }

  /* ============================================================
     SKIP-LINK
     ============================================================ */
  var skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('focus', function () { this.style.top = '20px'; });
    skipLink.addEventListener('blur', function () { this.style.top = '-9999px'; });
  }

  /* ============================================================
     ПОДСВЕТКА АКТИВНОЙ ССЫЛКИ
     ============================================================ */
  var currentPath = window.location.pathname;
  document.querySelectorAll('.nav a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentPath || (href === '/' && currentPath === '/')) {
      link.classList.add('active');
    }
  });
});

// ===== CSS ДЛЯ СПИННЕРА =====
var style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .btn-loader svg { vertical-align: middle; }
`;
document.head.appendChild(style);
