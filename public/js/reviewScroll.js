document.addEventListener('DOMContentLoaded', () => {
  const scrollContainer = document.querySelector('.reviews-scroll');
  const btnLeft = document.querySelector('#scroll-left');
  const btnRight = document.querySelector('#scroll-right');

  if (!scrollContainer || !btnLeft || !btnRight) return;

  const scrollAmount = 220; // width of one review card + gap (200 + 20)

  btnLeft.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });

  btnRight.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });

  // Ensure buttons are disabled when at start or end
  const updateButtons = () => {
    const atStart = scrollContainer.scrollLeft === 0;
    const atEnd = scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth - 1;

    btnLeft.disabled = atStart;
    btnRight.disabled = atEnd;

    btnLeft.style.opacity = atStart ? 0.5 : 1;
    btnRight.style.opacity = atEnd ? 0.5 : 1;
  };

  scrollContainer.addEventListener('scroll', updateButtons);
  updateButtons(); // Initial check
});
