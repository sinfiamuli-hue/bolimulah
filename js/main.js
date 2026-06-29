/* ============================================
   Ekuveri Boli Mulah — Main JavaScript
   bolimulah.sinfia.net
   ============================================ */

// ── LIGHTBOX ──
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

// ── SCROLL REVEAL ANIMATIONS ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── BOOKING FORM — Google Sheets Integration ──
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwg83MAAnpjNX_ppkyihoJWNxnymCRFHL8rA2e-MAiy-OOTFaVtN7hcxJUzv-T9y5QX/exec";

document.getElementById('digitalBookingForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = document.getElementById('submitBtn');
  const msgBox = document.getElementById('formStatusMessage');

  submitBtn.disabled = true;
  submitBtn.innerText = "Processing Booking Request...";
  msgBox.style.display = "block";
  msgBox.style.color = "var(--white)";
  msgBox.innerText = "Sending details straight to spreadsheet data grid...";

  const formData = new FormData(form);

  fetch(APPS_SCRIPT_WEB_APP_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      msgBox.style.color = "#25D366";
      msgBox.innerText = "✨ Success! Your booking entry was added automatically to our database.";
      form.reset();
    } else {
      msgBox.style.color = "#ff4444";
      msgBox.innerText = "Error logging entry: " + data.message;
    }
  })
  .catch(error => {
    msgBox.style.color = "#ff4444";
    msgBox.innerText = "Connection lost or script blocked. Verify your Deployment is set to 'Anyone'.";
    console.error('Error details:', error);
  })
  .finally(() => {
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Booking Request";
  });
});

