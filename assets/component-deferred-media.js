/*
 * Sendo — Deferred Media Web Component
 * Lazy-loads videos/iframes only when the user interacts (click or intersection).
 * Prevents autoplay and saves bandwidth on initial load.
 *
 * Usage:
 *   <deferred-media data-media-id="youtube-id">
 *     <button data-deferred-media-button>
 *       <img src="poster.jpg" alt="...">
 *       <span class="deferred-media__play">▶</span>
 *     </button>
 *     <template>
 *       <iframe src="..." allow="autoplay"></iframe>
 *     </template>
 *   </deferred-media>
 */

class DeferredMedia extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('[data-deferred-media-button]');
    this.template = this.querySelector('template');

    if (this.button && this.template) {
      this.button.addEventListener('click', () => this.loadMedia());
    }
  }

  loadMedia() {
    if (!this.template) return;
    if (this.getAttribute('loaded')) return;

    const content = this.template.content.firstElementChild.cloneNode(true);
    this.appendChild(content);
    this.setAttribute('loaded', '');

    if (this.button) this.button.style.display = 'none';

    // If it's a video element, autoplay
    const video = content.tagName === 'VIDEO' ? content : content.querySelector('video');
    if (video) {
      video.play().catch(() => {});
    }

    this.dispatchEvent(new CustomEvent('media:loaded', {
      bubbles: true,
      detail: { mediaId: this.dataset.mediaId }
    }));
  }
}

if (!customElements.get('deferred-media')) {
  customElements.define('deferred-media', DeferredMedia);
}
