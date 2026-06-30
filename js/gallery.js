/* ============================================================
   GALLERY + LIGHTBOX SCRIPT — Ekuveri Boli Mulah
   Built for LARGE photo libraries (hundreds or thousands of
   images) without slowing the page down.

   HOW IT WORKS:
   - images-manifest.json (repo root) stores ONE number: the
     total count of photos you have, e.g. {"count": 4}.
   - On page load, only the FIRST BATCH (24 photos) is loaded.
   - More photos load automatically as the visitor scrolls near
     the bottom of the gallery (infinite scroll), or by clicking
     "Load More" (works without JS scroll events too — good for
     accessibility / keyboard users).
   - Real image files are only requested once they're actually
     about to be shown, and lazy-loaded by the browser besides.

   TO ADD NEW PHOTOS:
   1. Upload Image5.webp, Image6.webp, etc. to Images/
   2. Open images-manifest.json and update "count" to match your
      new total.
   That's the only file you ever touch.

   OPTIONAL CAPTIONS:
   Add a line to the CAPTIONS list below if you want a specific
   photo to have a custom title instead of the rotating defaults.
   ============================================================ */

(function () {
  "use strict";

  // ----------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------
  const IMAGE_FOLDER = "Images/";
  const MANIFEST_URL = "images-manifest.json";
  const BATCH_SIZE = 24; // how many photos load per batch

  // Optional custom captions — key = image number, value = caption.
  // Anything without an entry rotates through DEFAULT_CAPTIONS instead.
  const CAPTIONS = {
    1: "Stage Performance",
    2: "Cultural Celebration",
    3: "Traditional Rhythm",
    4: "Festival Night",
  };

  const DEFAULT_CAPTIONS = [
    "Stage Performance",
    "Cultural Celebration",
    "Traditional Rhythm",
    "Festival Night",
    "Live Performance",
    "Community Gathering",
    "Youth Performance",
    "Heritage Showcase",
  ];

  function getCaption(num) {
    if (CAPTIONS[num]) return CAPTIONS[num];
    return DEFAULT_CAPTIONS[num % DEFAULT_CAPTIONS.length];
  }

  // ----------------------------------------------------------
  // ELEMENTS
  // ----------------------------------------------------------
  const grid = document.getElementById("galleryGrid");
  if (!grid) return; // gallery not on this page

  const loadMoreBtn = document.getElementById("galleryLoadMore");
  const sentinel = document.getElementById("galleryScrollSentinel");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  let totalCount = 0;
  let loadedCount = 0;
  let currentIndex = 0;

  // ----------------------------------------------------------
  // BUILD A SINGLE CARD
  // ----------------------------------------------------------
  function createCard(num, indexInItems) {
    const caption = getCaption(num);
    const src = `${IMAGE_FOLDER}Image${num}.webp`;

    const figure = document.createElement("figure");
    figure.className = "gallery-card reveal";
    figure.dataset.index = indexInItems;

    figure.innerHTML = `
      <button class="gallery-card-btn" type="button" aria-label="Open ${caption} photo in lightbox">
        <img
          src="${src}"
          alt="${caption} — Ekuveri Boli Mulah"
          loading="lazy"
          decoding="async"
          width="600"
          height="750"
        />
        <span class="gallery-overlay">
          <span class="gallery-overlay-content">
            <svg class="gallery-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
            <span class="gallery-card-title">${caption}</span>
          </span>
        </span>
      </button>
    `;

    figure.querySelector(".gallery-card-btn").addEventListener("click", () => openLightbox(indexInItems));
    return figure;
  }

  // ----------------------------------------------------------
  // LOAD NEXT BATCH
  // ----------------------------------------------------------
  function loadNextBatch() {
    if (loadedCount >= totalCount) {
      loadMoreBtn.hidden = true;
      return;
    }

    const nextEnd = Math.min(loadedCount + BATCH_SIZE, totalCount);
    const fragment = document.createDocumentFragment();

    for (let num = loadedCount + 1; num <= nextEnd; num++) {
      fragment.appendChild(createCard(num, num - 1)); // index = num - 1 (0-based)
    }

    grid.appendChild(fragment);
    loadedCount = nextEnd;

    observeReveal();

    loadMoreBtn.hidden = loadedCount >= totalCount;
  }

  // ----------------------------------------------------------
  // LIGHTBOX (operates on image NUMBER, derived on the fly,
  // so it works correctly even for photos not yet rendered as
  // cards — e.g. if a visitor jumps via keyboard navigation)
  // ----------------------------------------------------------
  function getItem(index) {
    const num = index + 1;
    return {
      num,
      src: `${IMAGE_FOLDER}Image${num}.webp`,
      caption: getCaption(num),
    };
  }

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxContent();
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    document.body.classList.add("lightbox-open");
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    const handleEnd = () => {
      lightbox.hidden = true;
      lightbox.removeEventListener("transitionend", handleEnd);
    };
    lightbox.addEventListener("transitionend", handleEnd);
  }

  function updateLightboxContent() {
    const item = getItem(currentIndex);
    lightboxImage.src = item.src;
    lightboxImage.alt = `${item.caption} — Ekuveri Boli Mulah`;
    lightboxCaption.textContent = item.caption;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % totalCount;
    updateLightboxContent();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + totalCount) % totalCount;
    updateLightboxContent();
  }

  closeBtn.addEventListener("click", closeLightbox);
  nextBtn.addEventListener("click", showNext);
  prevBtn.addEventListener("click", showPrev);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });

  let touchStartX = 0;
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const delta = touchEndX - touchStartX;
    const SWIPE_THRESHOLD = 50;
    if (delta > SWIPE_THRESHOLD) showPrev();
    else if (delta < -SWIPE_THRESHOLD) showNext();
  }, { passive: true });

  // ----------------------------------------------------------
  // SCROLL REVEAL ANIMATION (for newly added cards)
  // ----------------------------------------------------------
  function observeReveal() {
    const revealEls = document.querySelectorAll("#gallery .reveal:not(.is-visible)");

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach((el) => observer.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }
  }

  // ----------------------------------------------------------
  // INFINITE SCROLL — loads next batch when the sentinel
  // element scrolls into view near the bottom of the gallery
  // ----------------------------------------------------------
  function setupInfiniteScroll() {
    if (!("IntersectionObserver" in window) || !sentinel) return;

    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) loadNextBatch();
        });
      },
      { rootMargin: "400px 0px" } // start loading a bit before it's visible
    );

    scrollObserver.observe(sentinel);
  }

  // Manual "Load More" button — works even without scroll trigger
  loadMoreBtn.addEventListener("click", loadNextBatch);

  // ----------------------------------------------------------
  // INIT — fetch the manifest, then load the first batch
  // ----------------------------------------------------------
  fetch(MANIFEST_URL)
    .then((res) => res.json())
    .then((data) => {
      totalCount = Number(data.count) || 0;
      if (totalCount <= 0) return;

      loadMoreBtn.hidden = false;
      loadNextBatch();
      setupInfiniteScroll();
    })
    .catch((err) => {
      console.error("Gallery: could not load images-manifest.json", err);
    });
})();
