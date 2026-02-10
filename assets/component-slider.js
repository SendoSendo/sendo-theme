/*
 * Sendo — Slider / Carousel Web Component
 * Uses native CSS scroll-snap with JS navigation, dots, and counter.
 *
 * Usage:
 *   <slider-component data-autoplay="5000">
 *     <div class="slider__track" data-slider-track>
 *       <div class="slider__slide">...</div>
 *     </div>
 *     <button class="slider__nav slider__nav--prev" data-slider-prev>←</button>
 *     <button class="slider__nav slider__nav--next" data-slider-next>→</button>
 *     <div class="slider__dots" data-slider-dots></div>
 *     <div class="slider__counter" data-slider-counter></div>
 *   </slider-component>
 */

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.track = this.querySelector('[data-slider-track]');
    this.slides = this.querySelectorAll('.slider__slide');
    this.prevBtn = this.querySelector('[data-slider-prev]');
    this.nextBtn = this.querySelector('[data-slider-next]');
    this.dotsContainer = this.querySelector('[data-slider-dots]');
    this.counterEl = this.querySelector('[data-slider-counter]');
    this.currentIndex = 0;
    this.autoplayInterval = null;
  }

  connectedCallback() {
    if (!this.track || this.slides.length < 2) return;

    this.bindEvents();
    this.buildDots();
    this.updateState();

    const autoplay = parseInt(this.dataset.autoplay);
    if (autoplay > 0) this.startAutoplay(autoplay);
  }

  disconnectedCallback() {
    this.stopAutoplay();
  }

  bindEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.goTo(this.currentIndex - 1));
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.goTo(this.currentIndex + 1));
    }

    this.track.addEventListener('scroll', Sendo.debounce(() => {
      this.currentIndex = this.getActiveIndex();
      this.updateState();
    }, 100));

    // Pause autoplay on hover
    this.addEventListener('mouseenter', () => this.stopAutoplay());
    this.addEventListener('mouseleave', () => {
      const autoplay = parseInt(this.dataset.autoplay);
      if (autoplay > 0) this.startAutoplay(autoplay);
    });

    // Keyboard navigation
    this.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.goTo(this.currentIndex - 1);
      if (e.key === 'ArrowRight') this.goTo(this.currentIndex + 1);
    });
  }

  buildDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';

    this.slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'slider__dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
    });
  }

  goTo(index) {
    const total = this.slides.length;
    const loop = this.hasAttribute('data-loop');

    if (loop) {
      index = ((index % total) + total) % total;
    } else {
      index = Math.max(0, Math.min(index, total - 1));
    }

    this.slides[index].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });

    this.currentIndex = index;
    this.updateState();
  }

  getActiveIndex() {
    const trackRect = this.track.getBoundingClientRect();
    let closest = 0;
    let minDist = Infinity;

    this.slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs(rect.left - trackRect.left);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    return closest;
  }

  updateState() {
    const total = this.slides.length;
    const loop = this.hasAttribute('data-loop');

    // Nav buttons
    if (this.prevBtn) this.prevBtn.disabled = !loop && this.currentIndex === 0;
    if (this.nextBtn) this.nextBtn.disabled = !loop && this.currentIndex === total - 1;

    // Dots
    if (this.dotsContainer) {
      this.dotsContainer.querySelectorAll('.slider__dot').forEach((dot, i) => {
        dot.classList.toggle('is-active', i === this.currentIndex);
      });
    }

    // Counter
    if (this.counterEl) {
      this.counterEl.textContent = `${this.currentIndex + 1} / ${total}`;
    }
  }

  startAutoplay(interval) {
    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => {
      this.goTo(this.currentIndex + 1);
    }, interval);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }
}

if (!customElements.get('slider-component')) {
  customElements.define('slider-component', SliderComponent);
}
