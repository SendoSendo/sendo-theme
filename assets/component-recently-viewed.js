/**
 * Sendo — Recently Viewed Products
 * Tracks viewed products in localStorage and renders cards via section rendering.
 */

(function () {
  const STORAGE_KEY = 'sendo:recently-viewed';
  const MAX_STORED = 20;

  /* Track current product */
  function trackProduct() {
    const handle = document.querySelector('[data-product-handle]')?.dataset.productHandle;
    if (!handle) return;

    let viewed = getViewed();
    viewed = viewed.filter((h) => h !== handle);
    viewed.unshift(handle);
    viewed = viewed.slice(0, MAX_STORED);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed));
    } catch (e) { /* storage full */ }
  }

  function getViewed() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  /* Render recently viewed */
  function renderRecentlyViewed() {
    const containers = document.querySelectorAll('[data-recently-viewed]');
    if (containers.length === 0) return;

    const viewed = getViewed();
    const currentHandle = document.querySelector('[data-product-handle]')?.dataset.productHandle;
    const handles = viewed.filter((h) => h !== currentHandle);

    if (handles.length === 0) return;

    containers.forEach(async (container) => {
      const limit = Number(container.dataset.limit) || 4;
      const toShow = handles.slice(0, limit);

      try {
        const url = `${window.Shopify?.routes?.root || '/'}search?type=product&q=${toShow.map((h) => 'handle:' + h).join(' OR ')}&view=card-grid`;
        const response = await fetch(url);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const cards = doc.querySelectorAll('.product-card');

        if (cards.length > 0) {
          let gridHtml = '';
          cards.forEach((card) => {
            gridHtml += `<div>${card.outerHTML}</div>`;
          });
          container.innerHTML = gridHtml;
          container.closest('.recently-viewed').style.display = '';
        }
      } catch (e) {
        console.error('Sendo: recently viewed load failed', e);
      }
    });
  }

  /* Init */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      trackProduct();
      renderRecentlyViewed();
    });
  } else {
    trackProduct();
    renderRecentlyViewed();
  }
})();
