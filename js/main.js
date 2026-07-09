document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile menu ---------- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      header.classList.toggle('nav-open');
      toggle.classList.toggle('open');
    });
    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        toggle.classList.remove('open');
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
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

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-a').style.maxHeight = null;
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
  });

  /* ---------- Form validation ---------- */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      form.querySelectorAll('[required]').forEach(function (field) {
        var errorEl = field.closest('.form-field').querySelector('.field-error');
        var value = field.value.trim();
        var fieldValid = true;

        if (!value) {
          fieldValid = false;
        } else if (field.type === 'tel') {
          var digits = value.replace(/\D/g, '');
          if (digits.length < 10) fieldValid = false;
        } else if (field.type === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fieldValid = false;
        }

        if (!fieldValid) {
          valid = false;
          field.style.borderColor = '#E08A7D';
          if (errorEl) errorEl.textContent = field.type === 'email'
            ? 'Введите корректный email'
            : field.type === 'tel'
              ? 'Введите корректный телефон'
              : 'Заполните это поле';
        } else {
          field.style.borderColor = '';
          if (errorEl) errorEl.textContent = '';
        }
      });

      if (valid) {
        var wrap = form.closest('.form-wrap');
        var success = wrap.parentElement.querySelector('.form-success');
        form.style.display = 'none';
        if (success) success.classList.add('show');
      }
    });

    form.querySelectorAll('input, select').forEach(function (field) {
      field.addEventListener('input', function () {
        field.style.borderColor = '';
        var errorEl = field.closest('.form-field').querySelector('.field-error');
        if (errorEl) errorEl.textContent = '';
      });
    });
  });

});
