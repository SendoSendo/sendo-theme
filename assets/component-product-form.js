/**
 * Sendo — Product Form
 * Handles add-to-cart with AJAX, loading state, and PubSub event.
 */

class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector('form[data-type="add-to-cart-form"]');
    this.submitBtn = this.querySelector('.product-form__submit');
    this.sectionId = this.dataset.sectionId;

    if (this.form) {
      this.form.addEventListener('submit', this.onSubmit.bind(this));
    }
  }

  async onSubmit(e) {
    e.preventDefault();

    if (this.submitBtn?.disabled) return;
    this.setLoading(true);

    const formData = new FormData(this.form);
    const body = {
      id: Number(formData.get('id')),
      quantity: Number(formData.get('quantity')) || 1,
      sections: this.sectionId ? [this.sectionId] : []
    };

    try {
      const result = await window.Sendo.Cart.add(body);

      if (result.status === 422) {
        this.showError(result.description || 'Could not add to cart');
        return;
      }

      /* Open cart drawer */
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer?.open) cartDrawer.open();

    } catch (err) {
      console.error('Sendo: add to cart failed', err);
      this.showError('Something went wrong. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    if (!this.submitBtn) return;
    this.submitBtn.classList.toggle('is-loading', loading);
    this.submitBtn.disabled = loading;
  }

  showError(message) {
    /* Remove any existing error */
    const existing = this.querySelector('.product-form__error');
    if (existing) existing.remove();

    const errorEl = document.createElement('div');
    errorEl.className = 'product-form__error form__message form__message--error';
    errorEl.setAttribute('role', 'alert');
    errorEl.innerHTML = `<p>${message}</p>`;
    this.form.parentNode.insertBefore(errorEl, this.form.nextSibling);

    setTimeout(() => errorEl.remove(), 5000);
  }
}

customElements.define('product-form', ProductForm);
