/**
 * Sendo — Product Recommendations
 * Fetches Shopify's product recommendations API via section rendering.
 */

(function () {
  const containers = document.querySelectorAll('[data-product-recommendations]');

  containers.forEach((container) => {
    const url = container.dataset.url;
    if (!url) return;

    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newContent = doc.querySelector('[data-product-recommendations]');
        if (newContent?.innerHTML.trim()) {
          container.innerHTML = newContent.innerHTML;

          /* Trigger scroll animations */
          if (window.Sendo?.initScrollAnimations) {
            window.Sendo.initScrollAnimations();
          }
        }
      })
      .catch((err) => {
        console.error('Sendo: recommendations load failed', err);
      });
  });
})();
