(function () {
  'use strict';

  // =========================================================
  // INDEX PAGE – Comic grid
  // =========================================================

  async function initIndex() {
    const grid = document.getElementById('comic-grid');
    if (!grid) return;

    try {
      const res = await fetch('data/comics.json');
      if (!res.ok) throw new Error(res.statusText);
      const comics = await res.json();

      if (comics.length === 0) {
        grid.innerHTML = '<p class="empty-state">Noch keine Comics verfügbar.</p>';
        return;
      }

      grid.innerHTML = comics.map(c => `
        <a class="comic-card" href="reader.html?comic=${c.id}">
          <img src="data/comic_${c.id}/front.jpg" alt="${esc(c.title)}" loading="lazy">
          <div class="info">
            <h2>${esc(c.title)}</h2>
            <div class="meta">${esc(c.author)} &middot; ${c.year}</div>
            <div class="genres">${c.genres.map(g => `<span>${esc(g)}</span>`).join('')}</div>
          </div>
        </a>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<p class="empty-state">Fehler beim Laden: ${esc(err.message)}</p>`;
    }
  }

  // =========================================================
  // READER PAGE – Swipe / Tap / Keyboard comic reader
  // =========================================================

  async function initReader() {
    const container = document.getElementById('reader');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const comicId = parseInt(params.get('comic'), 10);
    if (!comicId) {
      window.location.href = 'index.html';
      return;
    }

    // Load comic metadata
    let comic;
    try {
      const res = await fetch('data/comics.json');
      const comics = await res.json();
      comic = comics.find(c => c.id === comicId);
      if (!comic) throw new Error('Comic nicht gefunden');
    } catch (err) {
      container.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
      return;
    }

    // Build page list: [front, page_1..page_N, back]
    const base = `data/comic_${comicId}`;

    const pages = [];
    pages.push({ src: `${base}/front.jpg`, label: 'Cover' });
    for (let i = 1; i <= comic.pages; i++) {
      pages.push({ src: `${base}/page_${String(i).padStart(3, '0')}.jpg`, label: `Seite ${i}` });
    }
    pages.push({ src: `${base}/back.jpg`, label: 'Back' });

    let current = 0;
    let uiTimeout = null;

    const imgEl = document.getElementById('reader-img');
    const counterEl = document.getElementById('reader-counter');
    const progressFill = document.getElementById('reader-progress-fill');
    const titleEl = document.getElementById('reader-title');
    const topbar = document.getElementById('reader-topbar');
    const bottombar = document.getElementById('reader-bottombar');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const spinner = document.getElementById('reader-spinner');

    titleEl.textContent = comic.title;

    function updateUI() {
      counterEl.textContent = `${current + 1} / ${pages.length}`;
      progressFill.style.width = `${((current + 1) / pages.length) * 100}%`;
      btnPrev.disabled = current === 0;
      btnNext.disabled = current === pages.length - 1;
    }

    function showUI() {
      topbar.classList.remove('hidden');
      bottombar.classList.remove('hidden');
      clearTimeout(uiTimeout);
      uiTimeout = setTimeout(() => {
        topbar.classList.add('hidden');
        bottombar.classList.add('hidden');
      }, 3000);
    }

    function loadPage(index) {
      if (index < 0 || index >= pages.length) return;
      current = index;
      imgEl.classList.add('loading');
      spinner.style.display = '';

      const pageSrc = pages[current].src;
      const preloader = new Image();
      preloader.onload = function () {
        imgEl.src = pageSrc;
        imgEl.classList.remove('loading');
        spinner.style.display = 'none';
      };
      preloader.onerror = function () {
        imgEl.classList.remove('loading');
        spinner.style.display = 'none';
        imgEl.alt = 'Seite konnte nicht geladen werden';
      };
      preloader.src = pageSrc;

      updateUI();
      showUI();
    }

    // Navigation
    function goNext() { if (current < pages.length - 1) loadPage(current + 1); }
    function goPrev() { if (current > 0) loadPage(current - 1); }

    btnPrev.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); showUI(); });
    btnNext.addEventListener('click', (e) => { e.stopPropagation(); goNext(); showUI(); });

    // Tap zones
    document.getElementById('tap-left').addEventListener('click', (e) => {
      e.stopPropagation();
      if (current === 0) return;
      goPrev();
    });
    document.getElementById('tap-right').addEventListener('click', (e) => {
      e.stopPropagation();
      if (current === pages.length - 1) return;
      goNext();
    });

    // Tap center → toggle UI
    document.getElementById('tap-center').addEventListener('click', () => {
      if (topbar.classList.contains('hidden')) {
        showUI();
      } else {
        topbar.classList.add('hidden');
        bottombar.classList.add('hidden');
        clearTimeout(uiTimeout);
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        window.location.href = 'index.html';
      }
    });

    // Swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let swiping = false;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!swiping) return;
      swiping = false;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }
    }, { passive: true });

    // Start
    loadPage(0);
    showUI();
  }

  // =========================================================
  // Helpers
  // =========================================================

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // =========================================================
  // Router
  // =========================================================

  document.addEventListener('DOMContentLoaded', () => {
    initIndex();
    initReader();
  });
})();
