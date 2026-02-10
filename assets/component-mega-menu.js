/*
 * Sendo — Mega Menu Disclosure
 * Extends details-disclosure with hover behavior on desktop.
 * Desktop: open on hover (200ms enter, 300ms leave delay).
 * Mobile: standard click/accordion.
 */

class MegaMenuDisclosure extends HTMLElement {
  constructor() {
    super();
    this.details = this.querySelector('details');
    this.summary = this.querySelector('summary');
    this.enterTimeout = null;
    this.leaveTimeout = null;
  }

  connectedCallback() {
    if (!this.details || !this.summary) return;

    if (Sendo.mediaMatches('desktop')) {
      this.bindHover();
    }

    this.summary.addEventListener('click', (e) => {
      if (Sendo.mediaMatches('desktop')) {
        e.preventDefault();
        if (this.summary.getAttribute('href')) {
          window.location.href = this.summary.getAttribute('href');
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.details.open) {
        this.close();
        this.summary.focus();
      }
    });
  }

  bindHover() {
    this.addEventListener('mouseenter', () => {
      clearTimeout(this.leaveTimeout);
      this.enterTimeout = setTimeout(() => {
        this.open();
      }, 200);
    });

    this.addEventListener('mouseleave', () => {
      clearTimeout(this.enterTimeout);
      this.leaveTimeout = setTimeout(() => {
        this.close();
      }, 300);
    });
  }

  open() {
    this.closeSiblings();
    this.details.open = true;
    this.summary.setAttribute('aria-expanded', 'true');
    Sendo.PubSub.publish('mega-menu:open', { element: this });
  }

  close() {
    this.details.open = false;
    this.summary.setAttribute('aria-expanded', 'false');
    Sendo.PubSub.publish('mega-menu:close', { element: this });
  }

  closeSiblings() {
    const parent = this.closest('.header__menu, .category-bar__list');
    if (!parent) return;
    parent.querySelectorAll('mega-menu-disclosure').forEach((el) => {
      if (el !== this && el.details?.open) {
        el.close();
      }
    });
  }
}

customElements.define('mega-menu-disclosure', MegaMenuDisclosure);
