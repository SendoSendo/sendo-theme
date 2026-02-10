/**
 * Sendo — Range Slider (dual-thumb)
 * Web Component for price range filtering.
 * Dispatches `change` events on hidden inputs for compatibility with component-facets.js.
 */

class RangeSlider extends HTMLElement {
  connectedCallback() {
    this.minInput = this.querySelector('[data-range-min]');
    this.maxInput = this.querySelector('[data-range-max]');
    this.minThumb = this.querySelector('[data-thumb-min]');
    this.maxThumb = this.querySelector('[data-thumb-max]');
    this.track = this.querySelector('[data-range-track]');
    this.fill = this.querySelector('[data-range-fill]');

    if (!this.minInput || !this.maxInput || !this.minThumb || !this.maxThumb) return;

    this.min = parseFloat(this.dataset.min) || 0;
    this.max = parseFloat(this.dataset.max) || 100;
    this.step = parseFloat(this.dataset.step) || 1;
    this.minVal = parseFloat(this.minInput.value) || this.min;
    this.maxVal = parseFloat(this.maxInput.value) || this.max;

    this.bindThumb(this.minThumb, 'min');
    this.bindThumb(this.maxThumb, 'max');
    this.update();
  }

  bindThumb(thumb, type) {
    const onPointerDown = (e) => {
      e.preventDefault();
      const onMove = (ev) => this.onDrag(ev, type);
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        this.commit();
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    };
    thumb.addEventListener('pointerdown', onPointerDown);

    thumb.addEventListener('keydown', (e) => {
      const delta = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? this.step : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -this.step : 0;
      if (!delta) return;
      e.preventDefault();
      if (type === 'min') {
        this.minVal = Math.min(Math.max(this.minVal + delta, this.min), this.maxVal - this.step);
      } else {
        this.maxVal = Math.max(Math.min(this.maxVal + delta, this.max), this.minVal + this.step);
      }
      this.update();
      this.commit();
    });
  }

  onDrag(e, type) {
    const rect = this.track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    let val = this.min + pct * (this.max - this.min);
    val = Math.round(val / this.step) * this.step;

    if (type === 'min') {
      this.minVal = Math.min(val, this.maxVal - this.step);
      this.minVal = Math.max(this.minVal, this.min);
    } else {
      this.maxVal = Math.max(val, this.minVal + this.step);
      this.maxVal = Math.min(this.maxVal, this.max);
    }

    this.update();
  }

  update() {
    const range = this.max - this.min;
    const minPct = ((this.minVal - this.min) / range) * 100;
    const maxPct = ((this.maxVal - this.min) / range) * 100;

    this.minThumb.style.left = minPct + '%';
    this.maxThumb.style.left = maxPct + '%';
    this.minThumb.setAttribute('aria-valuenow', this.minVal);
    this.maxThumb.setAttribute('aria-valuenow', this.maxVal);

    if (this.fill) {
      this.fill.style.left = minPct + '%';
      this.fill.style.width = (maxPct - minPct) + '%';
    }

    /* Update display values */
    const minDisplay = this.querySelector('[data-display-min]');
    const maxDisplay = this.querySelector('[data-display-max]');
    if (minDisplay) minDisplay.textContent = this.formatValue(this.minVal);
    if (maxDisplay) maxDisplay.textContent = this.formatValue(this.maxVal);
  }

  formatValue(val) {
    if (typeof Sendo !== 'undefined' && Sendo.formatMoney) {
      return Sendo.formatMoney(val * 100);
    }
    return val.toFixed(0);
  }

  commit() {
    /* Set hidden input values and dispatch change to trigger facets.js */
    const minChanged = this.minInput.value !== String(this.minVal * 100);
    const maxChanged = this.maxInput.value !== String(this.maxVal * 100);

    if (this.minVal > this.min) {
      this.minInput.value = this.minVal * 100;
    } else {
      this.minInput.value = '';
    }

    if (this.maxVal < this.max) {
      this.maxInput.value = this.maxVal * 100;
    } else {
      this.maxInput.value = '';
    }

    if (minChanged || maxChanged) {
      this.minInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

customElements.define('range-slider', RangeSlider);
