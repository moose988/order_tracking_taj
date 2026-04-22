(function initStandaloneMobileMenu(){
  function bindMenu(){
    const menuBtn = document.querySelector(".mobile-menu-btn");
    const navLinks = document.querySelector(".nav-links");

    if(!menuBtn || !navLinks || menuBtn.dataset.menuBound === "true"){
      return;
    }

    menuBtn.dataset.menuBound = "true";
    menuBtn.setAttribute("type", "button");
    menuBtn.setAttribute("aria-expanded", "false");

    if(!navLinks.id){
      navLinks.id = "primary-navigation";
    }

    menuBtn.setAttribute("aria-controls", navLinks.id);

    const syncMenuState = (isOpen) => {
      navLinks.classList.toggle("active", isOpen);
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("mobile-nav-open", isOpen && window.innerWidth <= 760);
    };

    menuBtn.addEventListener("click", () => {
      syncMenuState(!navLinks.classList.contains("active"));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        syncMenuState(false);
      });
    });

    window.addEventListener("resize", () => {
      if(window.innerWidth > 760){
        syncMenuState(false);
      }
    });

    window.addEventListener("keydown", (event) => {
      if(event.key === "Escape"){
        syncMenuState(false);
      }
    });

    document.addEventListener("click", (event) => {
      if(!navLinks.classList.contains("active")){
        return;
      }

      if(menuBtn.contains(event.target) || navLinks.contains(event.target)){
        return;
      }

      syncMenuState(false);
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bindMenu, { once: true });
    return;
  }

  bindMenu();
})();
