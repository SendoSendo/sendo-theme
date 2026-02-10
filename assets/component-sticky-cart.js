/**
 * Sendo — Sticky Add-to-Cart Bar
 * Shows a fixed bar at the bottom when the main buy button scrolls out of view.
 */

class StickyCart extends HTMLElement {
  constructor() {
    super();
    this.buyButton = document.querySelector('.product-form__submit');
    this.observer = null;

    if (this.buyButton) this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.classList.toggle('is-visible', !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );

    this.observer.observe(this.buyButton);

    /* Sticky button triggers the main form */
    const stickyBtn = this.querySelector('[data-sticky-add]');
    if (stickyBtn) {
      stickyBtn.addEventListener('click', () => {
        this.buyButton.click();
      });
    }
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
  }
}

customElements.define('sticky-cart', StickyCart);
