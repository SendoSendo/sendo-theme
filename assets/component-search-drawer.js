/**
 * Sendo — Search Drawer
 * Handles predictive search with Shopify's Predictive Search API.
 */

class SearchDrawer extends HTMLElement {
  constructor() {
    super();
    this.overlay = this.querySelector('[data-search-close]');
    this.input = this.querySelector('[data-predictive-search-input]');
    this.resultsContainer = this.querySelector('[data-predictive-search-results]');
    this.closeButtons = this.querySelectorAll('[data-search-close]');
    this.searchTimeout = null;
    this.abortController = null;

    this.bindEvents();
  }

  bindEvents() {
    this.closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.classList.contains('is-open')) this.close();
    });

    /* Search trigger — any element with data-search-open */
    document.querySelectorAll('[data-search-open]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    if (this.input) {
      this.input.addEventListener('input', () => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.search(), 300);
      });
    }
  }

  open() {
    this.classList.add('is-open');
    this.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (this.input) this.input.focus();
    }, 300);
  }

  close() {
    this.classList.remove('is-open');
    this.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  async search() {
    const query = this.input?.value?.trim();
    if (!query || query.length < 2) {
      this.resultsContainer.innerHTML = '<div class="search-drawer__placeholder"><p>Start typing to search...</p></div>';
      return;
    }

    /* Abort any in-flight request */
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    this.resultsContainer.innerHTML = '<div class="search-results__loading"><div class="loading-spinner"></div></div>';

    try {
      const url = `${window.Shopify?.routes?.root || '/'}search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=8`;
      const response = await fetch(url, { signal: this.abortController.signal });
      const data = await response.json();

      const products = data.resources?.results?.products || [];
      this.renderResults(products, query);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Sendo: search failed', e);
        this.resultsContainer.innerHTML = '<div class="search-results__empty"><p>Something went wrong. Try again.</p></div>';
      }
    }
  }

  renderResults(products, query) {
    if (products.length === 0) {
      this.resultsContainer.innerHTML = `<div class="search-results__empty"><p>No results for "${this.escapeHtml(query)}"</p></div>`;
      return;
    }

    let html = '<div class="search-results__grid">';

    products.forEach((product) => {
      const image = product.image ? `<img src="${product.image}" alt="${this.escapeHtml(product.title)}" width="200" height="200" loading="lazy">` : '';
      const price = product.price ? window.Sendo?.formatMoney(Number(product.price) * 100) || product.price : '';

      html += `
        <a href="${product.url}" class="search-result__item">
          <div class="search-result__image">${image}</div>
          <span class="search-result__title">${this.escapeHtml(product.title)}</span>
          <span class="search-result__price">${price}</span>
        </a>
      `;
    });

    html += '</div>';
    html += `<div class="search-results__footer"><a href="/search?q=${encodeURIComponent(query)}&type=product" class="btn btn--tertiary">View all results</a></div>`;

    this.resultsContainer.innerHTML = html;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

customElements.define('search-drawer', SearchDrawer);
