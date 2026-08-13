/*
 * JUC_FORMS — shared Web3Forms integration for The Seventy Nations Jerusalem site.
 * Loaded on every page that has a form (footer newsletter, Join the Movement, etc).
 */
(function (global) {
  'use strict';

  var PLACEHOLDER = 'PASTE-WEB3FORMS-ACCESS-KEY-HERE';
  var ACCESS_KEY = 'de9f7b06-7b13-4c0d-ace3-dcac744fa057';
  var ENDPOINT = 'https://api.web3forms.com/submit';

  function hasKey() {
    return !!ACCESS_KEY && ACCESS_KEY !== PLACEHOLDER;
  }

  // Sends a <form> element's data to Web3Forms. Returns a Promise.
  // options: { subject, fromName, honeypot } — all optional.
  function send(form, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
      if (!hasKey()) {
        reject(new Error('Web3Forms access key is not configured.'));
        return;
      }

      var honeypotField = form.querySelector('[name="' + (options.honeypot || 'website') + '"]');
      if (honeypotField && honeypotField.value) {
        // Silently treat bot submissions as successful so they don't loop/retry.
        resolve({ success: true, honeypot: true });
        return;
      }

      var data = new FormData(form);
      data.set('access_key', ACCESS_KEY);
      if (options.subject) data.set('subject', options.subject);
      if (options.fromName) data.set('from_name', options.fromName);
      var email = data.get('email');
      if (email) data.set('replyto', email);

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result && result.success) resolve(result);
          else reject(new Error((result && result.message) || 'Submission failed.'));
        })
        .catch(reject);
    });
  }

  // Auto-wires the simple footer "Stay Connected" newsletter form found on every page.
  function wireNewsletterForms() {
    var forms = document.querySelectorAll('[data-juc-newsletter]');
    forms.forEach(function (form) {
      var status = form.parentNode.querySelector('.footer__sub-status');
      if (!status) {
        status = document.createElement('p');
        status.className = 'footer__sub-status';
        status.setAttribute('aria-live', 'polite');
        form.parentNode.insertBefore(status, form.nextSibling);
      }
      var btn = form.querySelector('.footer__sub-btn');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!hasKey()) {
          status.textContent = 'Newsletter sign-up is temporarily unavailable. Please try again later.';
          status.className = 'footer__sub-status is-error';
          return;
        }

        if (btn) btn.disabled = true;
        status.textContent = 'Sending…';
        status.className = 'footer__sub-status';

        send(form, {
          subject: 'Newsletter Signup — The Seventy Nations Jerusalem',
          fromName: 'Website Newsletter'
        })
          .then(function () {
            status.textContent = 'Thank you for subscribing!';
            status.className = 'footer__sub-status is-success';
            form.reset();
          })
          .catch(function () {
            status.textContent = 'Something went wrong. Please try again or email us directly.';
            status.className = 'footer__sub-status is-error';
          })
          .finally(function () {
            if (btn) btn.disabled = false;
          });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireNewsletterForms);
  } else {
    wireNewsletterForms();
  }

  global.JUC_FORMS = {
    hasKey: hasKey,
    send: send
  };
})(window);
