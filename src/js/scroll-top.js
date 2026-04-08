const DEFAULT_SCROLL_THRESHOLD = 320;

export function initScrollTopButton(selector = "[data-scroll-top]"){
  const scrollTopButton = document.querySelector(selector);

  if(!scrollTopButton){
    return;
  }

  const syncScrollTopButton = () => {
    const shouldShow = window.scrollY > DEFAULT_SCROLL_THRESHOLD;
    scrollTopButton.classList.toggle("is-visible", shouldShow);
  };

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", syncScrollTopButton, { passive: true });
  syncScrollTopButton();
}
