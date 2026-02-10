/**
 * Sendo — Quick View
 * Fetches product section HTML via Section Rendering API and injects into modal.
 */

(function () {
  document.addEventListener('click', async (e) => {
    const trigger = e.target.closest('[data-quick-view]');
    if (!trigger) return;

    e.preventDefault();
    const productUrl = trigger.dataset.quickView;
    if (!productUrl) return;

    const modal = document.getElementById('QuickViewModal');
    const content = document.getElementById('QuickViewContent');
    if (!modal || !content) return;

    /* Show modal with loading */
    content.innerHTML = '<div class="quick-view__loading"><div class="loading-spinner"></div></div>';
    if (modal.open) modal.open();

    try {
      /* Fetch the product page with section rendering */
      const url = `${productUrl}?sections=quick-view-product`;
      const response = await fetch(url);
      const data = await response.json();

      if (data['quick-view-product']) {
        content.innerHTML = data['quick-view-product'];

        /* Re-initialize any web components in the injected HTML */
        content.querySelectorAll('script').forEach((script) => {
          const newScript = document.createElement('script');
          newScript.src = script.src;
          script.parentNode.replaceChild(newScript, script);
        });
      } else {
        /* Fallback: fetch as full page and extract product info */
        const pageResponse = await fetch(productUrl);
        const pageHtml = await pageResponse.text();
        const doc = new DOMParser().parseFromString(pageHtml, 'text/html');
        const productInfo = doc.querySelector('.product__grid');
        if (productInfo) {
          content.innerHTML = productInfo.outerHTML;
        }
      }
    } catch (err) {
      console.error('Sendo: quick view load failed', err);
      content.innerHTML = '<p class="text-center">Could not load product. <a href="' + productUrl + '">View product page</a></p>';
    }
  });
})();
