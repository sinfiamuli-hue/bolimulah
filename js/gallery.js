/* ============================================================
   GALLERY + LIGHTBOX SCRIPT — Ekuveri Boli Mulah
   Add this block before </body>, or in your existing main JS file.
   Vanilla JS only — no dependencies.

   HOW TO ADD A NEW PHOTO FROM NOW ON:
   1. Upload images/gallery/ImageN.webp (next sequential number)
   2. (Optional) add a caption for it in the CAPTIONS list below —
      if you skip this, it'll just use a default caption.
   3. Done. The HTML never needs to be touched again.
   ============================================================ */

(function () {
  "use strict";

  // ----------------------------------------------------------
  // 1. CAPTIONS — add one line per image here if you want a
  //    custom title. Key = image number, Value = caption text.
  //    Any image without an entry here falls back to the
  //    DEFAULT_CAPTION below.
  // ----------------------------------------------------------
  const CAPTIONS = {
    1: "Stage Performance",
    2: "Cultural Celebration",
    3: "Traditional Rhythm",
    4: "Festival Night",
    // 5: "Live Performance",
    // 6: "Community Gathering",
    // 7: "Youth Performance",
    // 8: "Heritage Showcase",
  };

  const DEFAULT_CAPTION = "Performance Moment";
  const IMAGE_FOLDER = "Images/"; // <-- points to your existing "Images" folder in the repo
  const MAX_IMAGES_TO_CHECK = 100; // safety ceiling, raise if you ever have more photos

  const grid = document.getElementById("galleryGrid");
  if (!grid) return; // gallery not on this page

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  let items = []; // populated once images are detected
  let currentIndex = 0;

  // ----------------------------------------------------------
  // 2. DETECT IMAGES — tries loading Image1, Image2, Image3...
  //    and stops at the first one that fails to load. Building
  //    the gallery only after all checks finish keeps photos
  //    in the correct numeric order.
  // ----------------------------------------------------------
  function checkImageExists(num) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = `${IMAGE_FOLDER}Image${num}.webp`;
    });
  }

  async function detectImages() {
    const found = [];
    for (let num = 1; num <= MAX_IMAGES_TO_CHECK; num++) {
      const exists = await checkImageExists(num);
      if (!exists) break; // stop at first missing number
      found.push(num);
    }
    return found;
  }

  // ----------------------------------------------------------
  // 3. BUILD GALLERY CARDS
  // ----------------------------------------------------------
  function buildGallery(numbers) {
    items = numbers.map((num) => ({
      num,
      src: `${IMAGE_FOLDER}Image${num}.webp`,
      caption: CAPTIONS[num] || DEFAULT_CAPTION,
    }));

    const fragment = document.createDocumentFragment();

    items.forEach((item, index) => {
      const figure = document.createElement("figure");
      figure.className = "gallery-card reveal";
      figure.dataset.index = index;

      figure.innerHTML = `
        <button class="gallery-card-btn" type="button" aria-label="Open ${item.caption} photo in lightbox">
          <img
            src="${item.src}"
            alt="${item.caption} — Ekuveri Boli Mulah"
            loading="lazy"
            decoding="async"
            width="600"
            height="750"
          />
          <span class="gallery-overlay">
            <span class="gallery-overlay-content">
              <svg class="gallery-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
              <span class="gallery-card-title">${item.caption}</span>
            </span>
          </span>
        </button>
      `;

      figure.querySelector(".gallery-card-btn").addEventListener("click", () => openLightbox(index));
      fragment.appendChild(figure);
    });

    grid.appendChild(fragment);
    observeReveal();
  }

  // ----------------------------------------------------------
  // 4. LIGHTBOX
  // ----------------------------------------------------------
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
    const item = items[currentIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = `${item.caption} — Ekuveri Boli Mulah`;
    lightboxCaption.textContent = item.caption;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % items.length;
    updateLightboxContent();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
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
  // 5. SCROLL REVEAL ANIMATION
  // ----------------------------------------------------------
  function observeReveal() {
    const revealEls = document.querySelectorAll("#gallery .reveal");

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
  // 6. INIT
  // ----------------------------------------------------------
  detectImages().then((numbers) => {
    if (numbers.length === 0) return; // no images found, leave grid empty
    buildGallery(numbers);
  });
})();
