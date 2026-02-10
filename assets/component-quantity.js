/*
 * Sendo — Quantity Selector Web Component
 *
 * Usage:
 *   <quantity-input>
 *     <button data-quantity-minus>-</button>
 *     <input type="number" data-quantity-input value="1" min="1" max="99">
 *     <button data-quantity-plus>+</button>
 *   </quantity-input>
 */

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('[data-quantity-input]');
    this.minusBtn = this.querySelector('[data-quantity-minus]');
    this.plusBtn = this.querySelector('[data-quantity-plus]');

    if (!this.input) return;

    this.min = parseInt(this.input.min) || 1;
    this.max = parseInt(this.input.max) || 9999;

    this.minusBtn?.addEventListener('click', () => this.change(-1));
    this.plusBtn?.addEventListener('click', () => this.change(1));

    this.input.addEventListener('change', () => {
      this.setValue(parseInt(this.input.value) || this.min);
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); this.change(1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); this.change(-1); }
    });

    this.updateButtons();
  }

  change(delta) {
    const current = parseInt(this.input.value) || this.min;
    this.setValue(current + delta);
  }

  setValue(value) {
    value = Math.max(this.min, Math.min(this.max, value));
    this.input.value = value;
    this.updateButtons();

    this.dispatchEvent(new CustomEvent('quantity:change', {
      bubbles: true,
      detail: { value, input: this.input }
    }));
  }

  get value() {
    return parseInt(this.input.value) || this.min;
  }

  updateButtons() {
    const val = parseInt(this.input.value) || this.min;
    if (this.minusBtn) this.minusBtn.disabled = val <= this.min;
    if (this.plusBtn) this.plusBtn.disabled = val >= this.max;
  }
}

if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', QuantityInput);
}
