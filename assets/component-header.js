/*
 * Sendo — Header Component JS
 * Handles: sticky header, mobile menu drawer, cart toggle
 */

(function () {
  'use strict';

  const header = document.querySelector('.header[data-sticky]');

  /* ========== Sticky Header ========== */
  if (header) {
    const stickyType = header.dataset.sticky;

    if (stickyType === 'on-scroll-up') {
      let lastScroll = 0;
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const currentScroll = window.scrollY;

            if (currentScroll <= 0) {
              header.classList.remove('is-hidden');
              header.classList.remove('is-scrolled');
            } else if (currentScroll > lastScroll && currentScroll > 80) {
              header.classList.add('is-hidden');
            } else {
              header.classList.remove('is-hidden');
              header.classList.add('is-scrolled');
            }

            lastScroll = currentScroll;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    if (stickyType === 'always') {
      window.addEventListener('scroll', () => {
        header.classList.toggle('is-scrolled', window.scrollY > 10);
      }, { passive: true });
    }
  }

  /* ========== Mobile Menu Drawer ========== */
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const mobileToggle = document.querySelector('[data-mobile-menu-toggle]');
  const mobileClose = document.querySelector('[data-mobile-menu-close]');
  const overlay = document.querySelector('[data-overlay]');

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
    if (overlay) overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    Sendo.trapFocus(mobileMenu);
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.focus();
    }
    if (overlay) overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openMobileMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);
  if (overlay) overlay.addEventListener('click', closeMobileMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu?.classList.contains('is-open')) {
      closeMobileMenu();
    }
  });

  /* ========== Cart Toggle (open drawer if available) ========== */
  const cartToggle = document.querySelector('[data-cart-toggle]');
  if (cartToggle) {
    cartToggle.addEventListener('click', (e) => {
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && typeof cartDrawer.open === 'function') {
        e.preventDefault();
        cartDrawer.open();
      }
    });
  }

  /* ========== Listen for cart:item-added to open cart drawer ========== */
  Sendo.PubSub.subscribe('cart:item-added', () => {
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer && typeof cartDrawer.open === 'function') {
      cartDrawer.open();
    }
  });
})();
