/* ============================================================
   GALLERY + LIGHTBOX SCRIPT — Ekuveri Boli Mulah
   Add this block before </body>, or in your existing main JS file.
   Vanilla JS only — no dependencies.
   ============================================================ */

(function () {
  "use strict";

  const grid = document.getElementById("galleryGrid");
  if (!grid) return; // gallery not on this page

  const cards = Array.from(grid.querySelectorAll(".gallery-card"));
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  let currentIndex = 0;

  // Build a lookup of { src, alt, caption } for every card
  const items = cards.map((card) => {
    const img = card.querySelector("img");
    const title = card.querySelector(".gallery-card-title");
    return {
      src: img.getAttribute("src"),
      alt: img.getAttribute("alt"),
      caption: title ? title.textContent : "",
    };
  });

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxContent();
    lightbox.hidden = false;
    // Force reflow so the transition triggers
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
    lightboxImage.alt = item.alt;
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

  // Open lightbox when a card is clicked
  cards.forEach((card, index) => {
    const btn = card.querySelector(".gallery-card-btn");
    btn.addEventListener("click", () => openLightbox(index));
  });

  // Controls
  closeBtn.addEventListener("click", closeLightbox);
  nextBtn.addEventListener("click", showNext);
  prevBtn.addEventListener("click", showPrev);

  // Click outside the stage closes the lightbox
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });

  // Touch swipe support
  let touchStartX = 0;
  lightbox.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const delta = touchEndX - touchStartX;
      const SWIPE_THRESHOLD = 50;
      if (delta > SWIPE_THRESHOLD) showPrev();
      else if (delta < -SWIPE_THRESHOLD) showNext();
    },
    { passive: true }
  );

  // Intersection Observer reveal-on-scroll animation
  const revealEls = document.querySelectorAll(
    "#gallery .reveal"
  );

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
    // Fallback: show everything immediately
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
