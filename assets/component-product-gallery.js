/**
 * Sendo — Product Gallery
 * Handles thumbnail navigation and active media switching.
 */

(function () {
  const gallery = document.querySelector('[data-product-gallery]');
  if (!gallery) return;

  const thumbnails = gallery.querySelectorAll('[data-thumbnail]');
  const mediaItems = gallery.querySelectorAll('[data-media-id]');

  if (thumbnails.length === 0) return;

  thumbnails.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const targetId = thumb.dataset.mediaTarget;
      setActiveMedia(targetId);
    });
  });

  function setActiveMedia(mediaId) {
    mediaItems.forEach((item) => {
      item.classList.toggle('is-active', item.dataset.mediaId === String(mediaId));
    });

    thumbnails.forEach((thumb) => {
      const isActive = thumb.dataset.mediaTarget === String(mediaId);
      thumb.classList.toggle('is-active', isActive);
      thumb.setAttribute('aria-current', isActive);
    });
  }

  /* Update gallery when variant changes and variant has associated media */
  document.addEventListener('variant:change', (e) => {
    const variant = e.detail?.variant;
    if (variant?.featured_media?.id) {
      setActiveMedia(variant.featured_media.id);
    }
  });
})();
