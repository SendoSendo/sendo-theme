/*
 * Sendo — Countdown Timer Web Component
 *
 * Usage:
 *   <countdown-timer data-end="2026-03-15T00:00:00" data-expired-message="Sale ended">
 *     <span data-days></span>
 *     <span data-hours></span>
 *     <span data-minutes></span>
 *     <span data-seconds></span>
 *   </countdown-timer>
 */

class CountdownTimer extends HTMLElement {
  connectedCallback() {
    this.endDate = new Date(this.dataset.end);
    this.expiredMessage = this.dataset.expiredMessage || '';
    this.daysEl = this.querySelector('[data-days]');
    this.hoursEl = this.querySelector('[data-hours]');
    this.minutesEl = this.querySelector('[data-minutes]');
    this.secondsEl = this.querySelector('[data-seconds]');

    if (isNaN(this.endDate.getTime())) return;

    this.update();
    this.interval = setInterval(() => this.update(), 1000);
  }

  disconnectedCallback() {
    if (this.interval) clearInterval(this.interval);
  }

  update() {
    const now = Date.now();
    const diff = this.endDate.getTime() - now;

    if (diff <= 0) {
      this.onExpired();
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (this.daysEl) this.daysEl.textContent = String(days).padStart(2, '0');
    if (this.hoursEl) this.hoursEl.textContent = String(hours).padStart(2, '0');
    if (this.minutesEl) this.minutesEl.textContent = String(minutes).padStart(2, '0');
    if (this.secondsEl) this.secondsEl.textContent = String(seconds).padStart(2, '0');

    // Urgent state (< 1 hour remaining)
    const isUrgent = diff < 3600000;
    this.classList.toggle('is-urgent', isUrgent);
  }

  onExpired() {
    if (this.interval) clearInterval(this.interval);
    this.classList.add('is-expired');

    if (this.expiredMessage) {
      this.innerHTML = `<span class="countdown__expired">${this.expiredMessage}</span>`;
    } else {
      if (this.daysEl) this.daysEl.textContent = '00';
      if (this.hoursEl) this.hoursEl.textContent = '00';
      if (this.minutesEl) this.minutesEl.textContent = '00';
      if (this.secondsEl) this.secondsEl.textContent = '00';
    }

    this.dispatchEvent(new CustomEvent('countdown:expired', { bubbles: true }));
  }
}

if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', CountdownTimer);
}
