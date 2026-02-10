/*
 * Sendo — Modal Web Component
 * Accessible dialog with focus trapping and Escape-to-close.
 *
 * Usage:
 *   <modal-dialog id="my-modal">
 *     <div class="modal__overlay" data-modal-close></div>
 *     <div class="modal__container" role="dialog" aria-modal="true" aria-label="...">
 *       <button class="modal__close" data-modal-close>×</button>
 *       <div class="modal__body">...</div>
 *     </div>
 *   </modal-dialog>
 *
 * Open via: document.querySelector('#my-modal').open()
 * Or with a trigger: <button data-modal-target="my-modal">Open</button>
 */

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.releaseFocus = null;
    this.previousActiveElement = null;
  }

  connectedCallback() {
    // Close buttons / overlay
    this.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', () => this.close());
    });

    // Escape key
    this.handleKeydown = (e) => {
      if (e.key === 'Escape') this.close();
    };
  }

  open() {
    this.previousActiveElement = document.activeElement;
    this.classList.add('is-open');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', this.handleKeydown);

    const container = this.querySelector('[role="dialog"]') || this.querySelector('.modal__container');
    if (container) {
      this.releaseFocus = Sendo.trapFocus(container);
    }

    Sendo.PubSub.publish('modal:open', { id: this.id, modal: this });
  }

  close() {
    this.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', this.handleKeydown);

    if (this.releaseFocus) {
      this.releaseFocus();
      this.releaseFocus = null;
    }

    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }

    Sendo.PubSub.publish('modal:close', { id: this.id, modal: this });
  }

  toggle() {
    this.classList.contains('is-open') ? this.close() : this.open();
  }
}

if (!customElements.get('modal-dialog')) {
  customElements.define('modal-dialog', ModalDialog);
}

/* Global trigger: <button data-modal-target="modal-id">Open</button> */
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-modal-target]');
  if (!trigger) return;

  e.preventDefault();
  const modalId = trigger.dataset.modalTarget;
  const modal = document.getElementById(modalId);
  if (modal && modal.open) modal.open();
});
