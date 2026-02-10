/*
 * Sendo Theme 2.0 — Core Bootstrap
 * PubSub, Cart API, Section Rendering, Focus Trap, Scroll Animations, Utilities
 */

(function () {
  'use strict';

  /* ========== PubSub Event Bus ========== */
  const subscribers = {};

  window.Sendo = window.Sendo || {};

  Sendo.PubSub = {
    subscribe(event, callback) {
      if (!subscribers[event]) subscribers[event] = [];
      subscribers[event].push(callback);
      return () => {
        subscribers[event] = subscribers[event].filter(cb => cb !== callback);
      };
    },

    publish(event, data) {
      if (!subscribers[event]) return;
      subscribers[event].forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[Sendo] PubSub error in "${event}":`, e);
        }
      });
    }
  };

  /* ========== Utility Functions ========== */
  Sendo.debounce = function (fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  Sendo.throttle = function (fn, limit = 200) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  Sendo.formatMoney = function (cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || window.Shopify?.money_format || '${{amount}}';

    function addCommas(n) {
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    let value = '';
    switch (formatString.match(placeholderRegex)?.[1]) {
      case 'amount':
        value = addCommas((cents / 100).toFixed(2));
        break;
      case 'amount_no_decimals':
        value = addCommas(Math.round(cents / 100));
        break;
      case 'amount_with_comma_separator':
        value = (cents / 100).toFixed(2).replace('.', ',');
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = Math.round(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        break;
      default:
        value = addCommas((cents / 100).toFixed(2));
    }

    return formatString.replace(placeholderRegex, value);
  };

  /* ========== Fetch Helpers ========== */
  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const error = new Error(body.description || body.message || res.statusText);
      error.status = res.status;
      throw error;
    }

    return res.json();
  }

  /* ========== Section Rendering API ========== */
  Sendo.renderSections = async function (sections) {
    const sectionIds = sections.map(s => s.id).join(',');
    const url = `${window.Shopify.routes.root}?sections=${sectionIds}`;
    const data = await fetchJSON(url);

    sections.forEach(({ id, selector }) => {
      const html = data[id];
      if (!html) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const source = doc.querySelector(selector);
      const target = document.querySelector(selector);

      if (source && target) {
        target.innerHTML = source.innerHTML;
      }
    });

    return data;
  };

  /* ========== Cart API ========== */
  Sendo.Cart = {
    async get() {
      return fetchJSON(`${window.Shopify.routes.root}cart.js`);
    },

    async add(items, sections) {
      const body = { items };
      if (sections?.length) body.sections = sections.map(s => s.id);

      const data = await fetchJSON(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      Sendo.PubSub.publish('cart:changed', data);
      Sendo.PubSub.publish('cart:item-added', data);
      return data;
    },

    async update(updates, sections) {
      const body = { updates };
      if (sections?.length) body.sections = sections.map(s => s.id);

      const data = await fetchJSON(`${window.Shopify.routes.root}cart/update.js`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      Sendo.PubSub.publish('cart:changed', data);
      return data;
    },

    async change(line, quantity, sections) {
      const body = { line, quantity };
      if (sections?.length) body.sections = sections.map(s => s.id);

      const data = await fetchJSON(`${window.Shopify.routes.root}cart/change.js`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      Sendo.PubSub.publish('cart:changed', data);
      return data;
    },

    async clear() {
      const data = await fetchJSON(`${window.Shopify.routes.root}cart/clear.js`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      Sendo.PubSub.publish('cart:changed', data);
      return data;
    },

    updateCount(count) {
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = count;
        if (count > 0) {
          el.removeAttribute('hidden');
          el.classList.add('animate-bounce');
          setTimeout(() => el.classList.remove('animate-bounce'), 300);
        } else {
          el.setAttribute('hidden', '');
        }
      });
    }
  };

  Sendo.PubSub.subscribe('cart:changed', (data) => {
    const cart = data.sections ? data : data;
    if (typeof cart.item_count !== 'undefined') {
      Sendo.Cart.updateCount(cart.item_count);
    }
  });

  /* ========== Focus Trap ========== */
  Sendo.trapFocus = function (container, namespace) {
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handler);
    first.focus();

    return () => container.removeEventListener('keydown', handler);
  };

  Sendo.removeTrapFocus = function (container) {
    // Handled by returned cleanup function above
  };

  /* ========== Scroll Animations (IntersectionObserver) ========== */
  function initScrollAnimations() {
    const animated = document.querySelectorAll('[data-animate]');
    if (!animated.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animated.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    animated.forEach(el => observer.observe(el));
  }

  /* ========== Lazy Load Sections (for Shopify section rendering events) ========== */
  function onSectionLoad() {
    document.addEventListener('shopify:section:load', (e) => {
      const section = e.target;
      initScrollAnimations();
      Sendo.PubSub.publish('section:load', { section });
    });

    document.addEventListener('shopify:section:select', (e) => {
      Sendo.PubSub.publish('section:select', { section: e.target, detail: e.detail });
    });

    document.addEventListener('shopify:section:deselect', (e) => {
      Sendo.PubSub.publish('section:deselect', { section: e.target });
    });

    document.addEventListener('shopify:block:select', (e) => {
      Sendo.PubSub.publish('block:select', { block: e.target, detail: e.detail });
    });

    document.addEventListener('shopify:block:deselect', (e) => {
      Sendo.PubSub.publish('block:deselect', { block: e.target });
    });
  }

  /* ========== Cookie Helpers ========== */
  Sendo.cookies = {
    get(name) {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    },
    set(name, value, days = 30) {
      const d = new Date();
      d.setTime(d.getTime() + days * 86400000);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    },
    remove(name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  };

  /* ========== Media Query Helper ========== */
  Sendo.mediaMatches = {
    mobile: window.matchMedia('(max-width: 767px)'),
    tablet: window.matchMedia('(min-width: 768px) and (max-width: 991px)'),
    desktop: window.matchMedia('(min-width: 992px)'),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
  };

  /* ========== Init ========== */
  function init() {
    initScrollAnimations();
    onSectionLoad();

    // Fetch initial cart count
    Sendo.Cart.get().then(cart => {
      Sendo.Cart.updateCount(cart.item_count);
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
