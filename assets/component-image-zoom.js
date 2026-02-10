/**
 * Sendo — Image Zoom
 * Adds hover-zoom on product gallery images with [data-zoom].
 * Loads the high-res image from data-zoom-src on first hover.
 */

(function () {
  document.querySelectorAll('[data-zoom]').forEach((container) => {
    let loaded = false;

    container.addEventListener('mouseenter', function () {
      if (!loaded) {
        const src = this.dataset.zoomSrc;
        if (!src) return;

        const img = new Image();
        img.src = src;
        img.className = 'product-gallery__zoom-img';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;opacity:0;transition:opacity .2s;z-index:2;';
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(img);

        img.onload = () => { loaded = true; };
      }
    });

    container.addEventListener('mousemove', function (e) {
      const zoomImg = this.querySelector('.product-gallery__zoom-img');
      if (!zoomImg) return;

      const rect = this.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      zoomImg.style.opacity = '1';
      zoomImg.style.transformOrigin = `${x}% ${y}%`;
      zoomImg.style.transform = 'scale(2)';
    });

    container.addEventListener('mouseleave', function () {
      const zoomImg = this.querySelector('.product-gallery__zoom-img');
      if (zoomImg) {
        zoomImg.style.opacity = '0';
        zoomImg.style.transform = 'scale(1)';
      }
    });
  });
})();
