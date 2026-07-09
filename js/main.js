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

    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
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
            if (openA) {
              openA.style.maxHeight = null;
            }
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
     FORM VALIDATION + HONEYPOT + RATE LIMITING + SPINNER
     ============================================================ */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    
    // ===== RATE LIMITING: устанавливаем время отправки =====
    var timeField = form.querySelector('._form_time');
    if (timeField) {
      timeField.value = Date.now();
    }

    // ===== АВТОФОКУС на первое поле =====
    var firstInput = form.querySelector('input:not([type="hidden"])');
    if (firstInput) {
      setTimeout(function () {
        firstInput.focus();
      }, 500);
    }

    // ===== Валидация на blur =====
    form.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener('blur', function () {
        validateField(field);
      });

      field.addEventListener('input', function () {
        field.style.borderColor = '';
        var errorEl = field.closest('.form-field').querySelector('.field-error');
        if (errorEl) {
          errorEl.textContent = '';
        }
      });
    });

    // ===== ОТПРАВКА ФОРМЫ =====
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = true;
      var submitBtn = form.querySelector('#submitBtn');
      var btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
      var btnLoader = submitBtn ? submitBtn.querySelector('.btn-loader') : null;

      // ===== RATE LIMITING: проверяем время =====
      if (timeField) {
        var submitTime = Date.now();
        var formTime = parseInt(timeField.value, 10);
        var timeDiff = submitTime - formTime;
        
        // Если форма отправлена менее чем через 5 секунд после загрузки — это бот
        if (timeDiff < 5000) {
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

      // ===== Валидация всех обязательных полей =====
      form.querySelectorAll('[required]').forEach(function (field) {
        if (!validateField(field)) {
          valid = false;
        }
      });

      // ===== HONEYPOT ПРОВЕРКА =====
      var honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value.trim() !== '') {
        valid = false;
        honeypot.style.borderColor = '#E08A7D';
        var errorEl = honeypot.closest('.form-field').querySelector('.field-error');
        if (errorEl) {
          errorEl.textContent = 'Обнаружена подозрительная активность';
        }
      }

      if (valid) {
        // ===== ПОКАЗЫВАЕМ ИНДИКАТОР ЗАГРУЗКИ =====
        if (submitBtn) {
          submitBtn.disabled = true;
          if (btnText) btnText.style.display = 'none';
          if (btnLoader) btnLoader.style.display = 'inline-block';
        }

        // ===== РЕАЛЬНАЯ ОТПРАВКА через FormSubmit =====
        var formData = new FormData(form);
        
        fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        })
        .then(function (response) {
          if (response.ok) {
            // Успешно отправлено
            var wrap = form.closest('.form-wrap');
            var success = wrap ? wrap.parentElement.querySelector('.form-success') : null;
            
            if (wrap) {
              form.style.display = 'none';
            }
            
            if (success) {
              success.classList.add('show');
            }
          } else {
            // Ошибка отправки
            alert('Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.');
          }
        })
        .catch(function () {
          alert('Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.');
        })
        .finally(function () {
          // Восстанавливаем кнопку
          if (submitBtn) {
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline-block';
            if (btnLoader) btnLoader.style.display = 'none';
          }
        });

      } else {
        // Если есть ошибка валидации — скроллим к первому полю с ошибкой
        var firstError = form.querySelector('[style*="border-color: #E08A7D"]');
        if (firstError) {
          firstError.focus();
        }
      }
    });
  });

  /* ============================================================
     ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
     ============================================================ */
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
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        fieldValid = false;
        errorMessage = 'Введите корректный email';
      }
    }

    if (!fieldValid) {
      field.style.borderColor = '#E08A7D';
      if (errorEl) {
        errorEl.textContent = errorMessage;
      }
    } else {
      field.style.borderColor = '';
      if (errorEl) {
        errorEl.textContent = '';
      }
    }

    return fieldValid;
  }

  /* ============================================================
     ПОДСВЕТКА АКТИВНОЙ ССЫЛКИ В МОБИЛЬНОМ МЕНЮ
     ============================================================ */
  var currentPath = window.location.pathname;
  document.querySelectorAll('.nav a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentPath || (href === '/' && currentPath === '/')) {
      link.classList.add('active');
    }
  });

  /* ============================================================
     SKIP-LINK: показываем при фокусе
     ============================================================ */
  var skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('focus', function () {
      this.style.top = '20px';
    });
    skipLink.addEventListener('blur', function () {
      this.style.top = '-9999px';
    });
  }
});

// ===== CSS ДЛЯ СПИННЕРА =====
var style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .btn-loader svg {
    vertical-align: middle;
  }
`;
document.head.appendChild(style);
