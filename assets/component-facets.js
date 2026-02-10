/**
 * Sendo — Faceted Filtering & Sort
 * Handles filter form submission, sort changes, and Section Rendering API updates.
 */

(function () {
  const SECTION_ID_ATTR = 'data-section-id';

  /* Filter toggle (mobile) */
  const filterToggle = document.querySelector('[data-filter-toggle]');
  const filtersPanel = document.getElementById('CollectionFilters');

  if (filterToggle && filtersPanel) {
    filterToggle.addEventListener('click', () => {
      const isOpen = filtersPanel.classList.toggle('is-open');
      filterToggle.setAttribute('aria-expanded', isOpen);
      if (isOpen) document.body.style.overflow = 'hidden';
      else document.body.style.overflow = '';
    });
  }

  /* Filter inputs — debounced form submission */
  const filterForm = document.querySelector('[data-filter-form]');
  if (filterForm) {
    let filterTimeout;

    filterForm.addEventListener('change', (e) => {
      if (!e.target.matches('[data-filter-input]')) return;
      clearTimeout(filterTimeout);
      filterTimeout = setTimeout(() => applyFilters(), 500);
    });

    /* Prevent default form submit */
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters();
    });
  }

  /* Filter removal links */
  document.addEventListener('click', (e) => {
    const removeLink = e.target.closest('[data-filter-remove]');
    if (removeLink) {
      e.preventDefault();
      navigateAndRender(removeLink.href);
    }
  });

  /* Sort select */
  const sortSelect = document.querySelector('[data-sort-select]');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const url = new URL(window.location);
      url.searchParams.set('sort_by', sortSelect.value);
      url.searchParams.delete('page');
      navigateAndRender(url.toString());
    });
  }

  function applyFilters() {
    const form = document.querySelector('[data-filter-form]');
    if (!form) return;

    const formData = new FormData(form);
    const url = new URL(window.location);

    /* Clear existing filter params */
    const keysToRemove = [];
    for (const key of url.searchParams.keys()) {
      if (key.startsWith('filter.') || key === 'page') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => url.searchParams.delete(key));

    /* Add active filter params */
    for (const [key, value] of formData.entries()) {
      if (value) url.searchParams.append(key, value);
    }

    navigateAndRender(url.toString());
  }

  async function navigateAndRender(urlStr) {
    const url = new URL(urlStr);
    const sectionEl = document.querySelector('[' + SECTION_ID_ATTR + ']');
    if (!sectionEl) {
      window.location = urlStr;
      return;
    }

    const sectionId = sectionEl.getAttribute(SECTION_ID_ATTR);
    url.searchParams.set('sections', sectionId);

    /* Show loading state */
    const grid = document.getElementById('CollectionGrid');
    if (grid) grid.style.opacity = '0.4';

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      const html = new DOMParser().parseFromString(data[sectionId], 'text/html');

      /* Update product grid */
      const newProducts = html.getElementById('CollectionProducts');
      const currentProducts = document.getElementById('CollectionProducts');
      if (newProducts && currentProducts) {
        currentProducts.innerHTML = newProducts.innerHTML;
      }

      /* Update toolbar */
      const newToolbar = html.getElementById('CollectionToolbar');
      const currentToolbar = document.getElementById('CollectionToolbar');
      if (newToolbar && currentToolbar) {
        currentToolbar.innerHTML = newToolbar.innerHTML;
      }

      /* Update filters */
      const newFilters = html.getElementById('CollectionFilters');
      const currentFilters = document.getElementById('CollectionFilters');
      if (newFilters && currentFilters) {
        currentFilters.innerHTML = newFilters.innerHTML;
      }

      /* Update URL without reload */
      url.searchParams.delete('sections');
      window.history.pushState({}, '', url.toString());

      /* Re-init animations */
      if (window.Sendo?.initScrollAnimations) {
        window.Sendo.initScrollAnimations();
      }

      /* Close mobile filters if open */
      if (filtersPanel?.classList.contains('is-open')) {
        filtersPanel.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    } catch (e) {
      console.error('Sendo: facets render failed', e);
      window.location = urlStr;
    }
  }

  /* Handle browser back/forward */
  window.addEventListener('popstate', () => {
    navigateAndRender(window.location.href);
  });

  /* Grid/List view toggle */
  const viewToggle = document.querySelector('[data-view-toggle]');
  if (viewToggle) {
    const productsContainer = document.getElementById('CollectionProducts');
    const savedView = (typeof Sendo !== 'undefined' && Sendo.cookies)
      ? Sendo.cookies.get('collection_view')
      : null;

    if (savedView === 'list' && productsContainer) {
      productsContainer.classList.add('collection__products--list-view');
      const listBtn = viewToggle.querySelector('[data-view-btn="list"]');
      const gridBtn = viewToggle.querySelector('[data-view-btn="grid"]');
      if (listBtn) listBtn.classList.add('is-active');
      if (gridBtn) gridBtn.classList.remove('is-active');
    }

    viewToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view-btn]');
      if (!btn) return;

      const view = btn.dataset.viewBtn;
      const allBtns = viewToggle.querySelectorAll('[data-view-btn]');
      allBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      if (productsContainer) {
        if (view === 'list') {
          productsContainer.classList.add('collection__products--list-view');
        } else {
          productsContainer.classList.remove('collection__products--list-view');
        }
      }

      if (typeof Sendo !== 'undefined' && Sendo.cookies) {
        Sendo.cookies.set('collection_view', view, 30);
      }
    });
  }
})();
