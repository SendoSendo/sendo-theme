/*
 * Sendo — Cart Drawer Web Component
 * Slide-out cart with quantity updates, item removal, and section re-rendering.
 */

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.releaseFocus = null;
  }

  connectedCallback() {
    this.sectionId = this.dataset.sectionId;

    this.querySelectorAll('[data-cart-drawer-close]').forEach(el => {
      el.addEventListener('click', () => this.close());
    });

    this.addEventListener('quantity:change', Sendo.debounce((e) => {
      const input = e.detail.input;
      const line = parseInt(input.dataset.line);
      this.updateLine(line, e.detail.value);
    }, 400));

    this.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-cart-remove]');
      if (removeBtn) this.updateLine(parseInt(removeBtn.dataset.line), 0);
    });

    const noteTextarea = this.querySelector('[data-cart-note]');
    if (noteTextarea) {
      noteTextarea.addEventListener('change', Sendo.debounce((e) => {
        fetch(`${Shopify.routes.root}cart/update.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: e.target.value })
        });
      }, 500));
    }

    const checkoutBtn = this.querySelector('[data-cart-checkout]');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => { window.location.href = '/checkout'; });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.classList.contains('is-open')) this.close();
    });

    Sendo.PubSub.subscribe('cart:item-added', () => {
      this.renderSection();
      this.open();
    });
  }

  open() {
    this.classList.add('is-open');
    this.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const overlay = document.querySelector('[data-overlay]');
    if (overlay) overlay.classList.add('is-active');
    const container = this.querySelector('.cart-drawer__container');
    if (container) this.releaseFocus = Sendo.trapFocus(container);
  }

  close() {
    this.classList.remove('is-open');
    this.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const overlay = document.querySelector('[data-overlay]');
    if (overlay) overlay.classList.remove('is-active');
    if (this.releaseFocus) { this.releaseFocus(); this.releaseFocus = null; }
  }

  async updateLine(line, quantity) {
    this.classList.add('is-loading');
    try {
      const data = await Sendo.Cart.change(line, quantity, [{ id: this.sectionId }]);
      if (data.sections?.[this.sectionId]) {
        this.renderFromHTML(data.sections[this.sectionId]);
      } else {
        await this.renderSection();
      }
    } catch (err) {
      console.error('[Sendo] Cart update error:', err);
    } finally {
      this.classList.remove('is-loading');
    }
  }

  async renderSection() {
    try {
      const res = await fetch(`${Shopify.routes.root}?sections=${this.sectionId}`);
      const data = await res.json();
      if (data[this.sectionId]) this.renderFromHTML(data[this.sectionId]);
    } catch (err) {
      console.error('[Sendo] Cart render error:', err);
    }
  }

  renderFromHTML(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const pairs = [
      ['#CartDrawerItems', '#CartDrawerItems'],
      ['.cart-drawer__title', '.cart-drawer__title'],
      ['.cart-drawer__footer', '.cart-drawer__footer'],
      ['.cart-drawer__shipping-bar', '.cart-drawer__shipping-bar'],
    ];
    pairs.forEach(([sel]) => {
      const newEl = doc.querySelector(sel);
      const curEl = this.querySelector(sel);
      if (newEl && curEl) curEl.innerHTML = newEl.innerHTML;
    });
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}
