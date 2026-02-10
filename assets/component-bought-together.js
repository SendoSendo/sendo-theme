/*
 * Sendo — Frequently Bought Together
 * Fetches complementary product recommendations and enables
 * bundle add-to-cart with checkboxes.
 */

class BoughtTogether extends HTMLElement {
  constructor() {
    super();
    this.productsContainer = this.querySelector('[data-products]');
    this.summaryContainer = this.querySelector('[data-summary]');
    this.totalPriceEl = this.querySelector('[data-total-price]');
    this.addAllBtn = this.querySelector('[data-add-all]');
    this.url = this.dataset.url;
    this.maxProducts = parseInt(this.dataset.max, 10) || 3;
  }

  connectedCallback() {
    if (!this.url || !this.productsContainer) return;
    this.fetchRecommendations();
    this.addAllBtn?.addEventListener('click', () => this.addAllToCart());
  }

  async fetchRecommendations() {
    try {
      const response = await fetch(this.url);
      if (!response.ok) return;
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const products = doc.querySelectorAll('.product-recommendations__product');

      if (products.length === 0) {
        this.style.display = 'none';
        return;
      }

      let count = 0;
      products.forEach((productEl) => {
        if (count >= this.maxProducts) return;

        const id = productEl.dataset.productId;
        const variantId = productEl.dataset.variantId;
        const price = parseInt(productEl.dataset.price, 10);
        const title = productEl.dataset.title;
        const imageUrl = productEl.dataset.imageUrl;
        const priceFormatted = productEl.dataset.priceFormatted;
        const productUrl = productEl.dataset.url;

        if (!variantId) return;

        const separator = document.createElement('div');
        separator.className = 'bought-together__separator';
        separator.innerHTML = '<span>+</span>';
        this.productsContainer.appendChild(separator);

        const item = document.createElement('div');
        item.className = 'bought-together__item';
        item.dataset.item = '';
        item.dataset.variantId = variantId;
        item.dataset.price = price;
        item.innerHTML = `
          <label class="bought-together__checkbox">
            <input type="checkbox" checked>
            <span class="bought-together__check-mark">
              <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </label>
          <a href="${productUrl}" class="bought-together__image">
            ${imageUrl ? `<img src="${imageUrl}" alt="${title}" width="100" height="100" loading="lazy">` : ''}
          </a>
          <div class="bought-together__info">
            <a href="${productUrl}" class="bought-together__title">${title}</a>
            <p class="bought-together__price">${priceFormatted}</p>
          </div>
        `;

        item.querySelector('input[type="checkbox"]').addEventListener('change', () => {
          this.updateTotal();
        });

        this.productsContainer.appendChild(item);
        count++;
      });

      this.updateTotal();
    } catch (e) {
      this.style.display = 'none';
    }
  }

  updateTotal() {
    const items = this.querySelectorAll('[data-item]');
    let total = 0;

    items.forEach((item) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && (checkbox.checked || checkbox.disabled)) {
        total += parseInt(item.dataset.price, 10) || 0;
      }
    });

    if (this.totalPriceEl) {
      this.totalPriceEl.textContent = Sendo.formatMoney(total, window.Shopify.money_format);
    }
  }

  async addAllToCart() {
    const items = [];
    this.querySelectorAll('[data-item]').forEach((item) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && (checkbox.checked || checkbox.disabled)) {
        const variantId = item.dataset.variantId;
        if (variantId) {
          items.push({ id: parseInt(variantId, 10), quantity: 1 });
        }
      }
    });

    if (items.length === 0) return;

    this.addAllBtn.disabled = true;
    this.addAllBtn.classList.add('btn--loading');

    try {
      await Sendo.Cart.add(items);
      Sendo.PubSub.publish('cart:item-added', { items });
    } catch (e) {
      console.error('Failed to add items to cart:', e);
    } finally {
      this.addAllBtn.disabled = false;
      this.addAllBtn.classList.remove('btn--loading');
    }
  }
}

customElements.define('bought-together', BoughtTogether);
