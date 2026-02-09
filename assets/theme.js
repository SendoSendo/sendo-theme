(function () {
  'use strict';
  // Respect prefers-reduced-motion (class already set by server; this is for dynamic content)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.remove('motion-ok');
  }
})();
