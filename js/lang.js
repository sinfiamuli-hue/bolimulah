/* ==========================================================================
   LANGUAGE SWITCHER — Ekuveri Boli Mulah
   --------------------------------------------------------------------------
   Handles: toggling RTL/LTR, loading the correct Dhivehi fonts (via CSS
   classes), showing/hiding the correct language text, and remembering the
   visitor's choice in Local Storage. No page reload.

   IMPORTANT: Visible headings and body text are NOT auto-translated by
   this script. Each piece of text lives directly in index.html as a pair
   of spans:

     <span class="i18n-en">English text</span>
     <span class="i18n-dv">Dhivehi text</span>

   This script just shows the one matching the active language (the actual
   hide/show rule lives in lang.css). Edit the Dhivehi wording straight in
   index.html — it will never be overwritten automatically.

   Only small accessibility strings (aria-labels on the lightbox buttons)
   still come from js/lang-data.js, since those aren't visible text.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "ebm_lang";
  var DEFAULT_LANG = "en";
  var SUPPORTED = ["en", "dv"]; // add future language codes here

  var dict = window.SITE_TRANSLATIONS || { en: {}, dv: {} };

  function getSavedLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.indexOf(saved) !== -1 ? saved : DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* Local Storage unavailable (private mode etc.) — fail silently */
    }
  }

  function translateAria(lang) {
    var strings = dict[lang] || {};
    var fallback = dict.en || {};

    // aria-label text (accessibility only — visible text is handled by CSS)
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      var value = strings[key];
      if (!value) value = fallback[key];
      if (value) el.setAttribute("aria-label", value);
    });
  }

  function applyLanguage(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;

    translateAria(lang);

    var html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "dv" ? "rtl" : "ltr");

    document.body.classList.toggle("lang-dv", lang === "dv");
    document.body.classList.toggle("lang-en", lang === "en");

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    saveLang(lang);
  }

  function init() {
    applyLanguage(getSavedLang());

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLanguage(btn.getAttribute("data-lang"));
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
