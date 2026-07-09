document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');

  if (toggle && header) {
    // Открытие/закрытие меню
    toggle.addEventListener('click', function () {
      var isOpen = header.classList.contains('nav-open');
      header.classList.toggle('nav-open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', !isOpen);
    });

    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Закрытие меню при клике вне его
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

    // Закрытие меню по Escape
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
     SCROLL REVEAL (с debounce)
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
    // Fallback для старых браузеров
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

        // Закрываем все другие открытые FAQ
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

      // Доступность: Enter и Space
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          q.click();
        }
      });
    }
  });

  /* ============================================================
     FORM VALIDATION
     ============================================================ */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    // Валидация на blur
    form.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener('blur', function () {
        validateField(field);
      });

      field.addEventListener('input', function () {
        // Очищаем ошибку при вводе
        field.style.borderColor = '';
        var errorEl = field.closest('.form-field').querySelector('.field-error');
        if (errorEl) {
          errorEl.textContent = '';
        }
      });
    });

    // Отправка формы
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = true;

      // Валидация всех полей
      form.querySelectorAll('[required]').forEach(function (field) {
        if (!validateField(field)) {
          valid = false;
        }
      });

      if (valid) {
        // Показываем индикатор загрузки
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;

        // Имитация отправки (заменить на реальный AJAX)
        setTimeout(function () {
          var wrap = form.closest('.form-wrap');
          var success = wrap ? wrap.parentElement.querySelector('.form-success') : null;

          if (wrap) {
            form.style.display = 'none';
          }

          if (success) {
            success.classList.add('show');
          }

          // Восстанавливаем кнопку
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1200);
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
});
