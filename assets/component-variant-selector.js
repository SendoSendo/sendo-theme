/**
 * Sendo — Variant Selector
 * Web component that manages option selection, variant lookup, and
 * Section Rendering API updates for the product page.
 */

class VariantSelector extends HTMLElement {
  constructor() {
    super();
    this.sectionId = this.dataset.sectionId;
    this.productUrl = this.dataset.productUrl;
    this.variants = JSON.parse(this.querySelector('[data-variant-json]').textContent);
    this.inputs = this.querySelectorAll('[data-option-input]');
    this.selects = this.querySelectorAll('[data-option-selector]');

    this.bindEvents();
  }

  bindEvents() {
    this.inputs.forEach((input) => {
      input.addEventListener('change', () => this.onOptionChange());
    });

    this.selects.forEach((select) => {
      select.addEventListener('change', () => this.onOptionChange());
    });
  }

  onOptionChange() {
    const selectedOptions = this.getSelectedOptions();
    const variant = this.findVariant(selectedOptions);

    this.updateSelectedLabels(selectedOptions);
    this.updateSwatchStates();

    if (variant) {
      this.updateURL(variant);
      this.updateVariantInput(variant);
      this.renderSection(variant);

      document.dispatchEvent(new CustomEvent('variant:change', {
        detail: { variant, sectionId: this.sectionId }
      }));
    }

    this.updateBuyButton(variant);
  }

  getSelectedOptions() {
    const options = [];

    this.querySelectorAll('[data-option-index]').forEach((fieldset) => {
      const checked = fieldset.querySelector('[data-option-input]:checked');
      const select = fieldset.querySelector('[data-option-selector]');
      if (checked) {
        options.push(checked.value);
      } else if (select) {
        options.push(select.value);
      }
    });

    return options;
  }

  findVariant(selectedOptions) {
    return this.variants.find((variant) =>
      variant.options.every((opt, i) => opt === selectedOptions[i])
    );
  }

  updateSelectedLabels(selectedOptions) {
    this.querySelectorAll('[data-option-selected]').forEach((label, i) => {
      label.textContent = selectedOptions[i] || '';
    });
  }

  updateSwatchStates() {
    /* Mark unavailable combinations */
    this.querySelectorAll('[data-option-value]').forEach((swatch) => {
      swatch.classList.remove('is-unavailable');
    });
  }

  updateURL(variant) {
    if (!variant) return;
    const url = new URL(window.location);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
  }

  updateVariantInput(variant) {
    const input = document.querySelector(`#ProductForm [data-variant-id]`);
    if (input) input.value = variant.id;
  }

  updateBuyButton(variant) {
    const btn = document.querySelector('.product-form__submit');
    if (!btn) return;

    const textEl = btn.querySelector('span');
    if (!variant) {
      btn.disabled = true;
      if (textEl) textEl.textContent = window.Sendo?.t?.unavailable || 'Unavailable';
    } else if (!variant.available) {
      btn.disabled = true;
      if (textEl) textEl.textContent = window.Sendo?.t?.sold_out || 'Sold out';
    } else {
      btn.disabled = false;
      if (textEl) textEl.textContent = window.Sendo?.t?.add_to_cart || 'Add to cart';
    }
  }

  async renderSection(variant) {
    if (!this.sectionId) return;

    try {
      const url = `${this.productUrl}?variant=${variant.id}&sections=${this.sectionId}`;
      const response = await fetch(url);
      const data = await response.json();
      const html = new DOMParser().parseFromString(data[this.sectionId], 'text/html');

      /* Update price */
      const priceSource = html.getElementById(`ProductPrice-${this.sectionId}`);
      const priceTarget = document.getElementById(`ProductPrice-${this.sectionId}`);
      if (priceSource && priceTarget) priceTarget.innerHTML = priceSource.innerHTML;

      /* Update stock counter */
      const stockSource = html.getElementById(`ProductStock-${this.sectionId}`);
      const stockTarget = document.getElementById(`ProductStock-${this.sectionId}`);
      if (stockTarget) {
        if (stockSource) {
          stockTarget.innerHTML = stockSource.innerHTML;
          stockTarget.className = stockSource.className;
          stockTarget.style.display = '';
        } else {
          stockTarget.style.display = 'none';
        }
      }
    } catch (e) {
      console.error('Sendo: variant section render failed', e);
    }
  }
}

customElements.define('variant-selector', VariantSelector);
