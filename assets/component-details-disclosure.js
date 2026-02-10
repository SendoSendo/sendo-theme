/*
 * Sendo — Details Disclosure Web Component
 * Enhanced <details> element with animation and "close on outside click" behavior.
 * Used for mega menu dropdowns, filter disclosures, and any togglable panel.
 *
 * Usage:
 *   <details-disclosure>
 *     <details>
 *       <summary>Toggle</summary>
 *       <div class="disclosure__panel">Content</div>
 *     </details>
 *   </details-disclosure>
 */

class DetailsDisclosure extends HTMLElement {
  connectedCallback() {
    this.details = this.querySelector('details');
    this.summary = this.querySelector('summary');

    if (!this.details || !this.summary) return;

    this.summary.addEventListener('click', (e) => {
      e.preventDefault();
      this.details.open ? this.close() : this.open();
    });

    // Close on click outside
    this.handleOutsideClick = (e) => {
      if (!this.contains(e.target)) this.close();
    };

    // Close on Escape
    this.handleKeydown = (e) => {
      if (e.key === 'Escape') this.close();
    };
  }

  open() {
    this.details.open = true;
    document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleKeydown);

    this.dispatchEvent(new CustomEvent('disclosure:open', { bubbles: true }));
  }

  close() {
    this.details.open = false;
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleKeydown);

    this.dispatchEvent(new CustomEvent('disclosure:close', { bubbles: true }));
  }
}

if (!customElements.get('details-disclosure')) {
  customElements.define('details-disclosure', DetailsDisclosure);
}
