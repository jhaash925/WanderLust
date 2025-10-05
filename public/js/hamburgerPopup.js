document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const hamburgerPopup = document.getElementById('hamburgerPopup');
  const popupCloseBtn = document.getElementById('popupCloseBtn');

  if (hamburgerBtn && hamburgerPopup && popupCloseBtn) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerPopup.classList.toggle('d-none');
    });

    popupCloseBtn.addEventListener('click', () => {
      hamburgerPopup.classList.add('d-none');
    });

    // Optional: Close popup when clicking outside the popup
    document.addEventListener('click', (event) => {
      if (!hamburgerPopup.contains(event.target) && !hamburgerBtn.contains(event.target)) {
        hamburgerPopup.classList.add('d-none');
      }
    });
  }
});
