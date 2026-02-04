(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const heroSlider = document.querySelector(".hero-slider");
  if (heroSlider) {
    const slides = Array.from(heroSlider.querySelectorAll("figure"));
    let currentIndex = 0;
    let timerId = null;

    const showSlide = (index) => {
      slides.forEach((slide, idx) => {
        slide.classList.toggle("is-active", idx === index);
      });
    };

    const startAuto = () => {
      if (prefersReducedMotion || slides.length <= 1) return;
      timerId = window.setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
      }, 6000);
    };

    const stopAuto = () => {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    showSlide(currentIndex);
    startAuto();

    heroSlider.addEventListener("mouseenter", stopAuto);
    heroSlider.addEventListener("mouseleave", startAuto);
    heroSlider.addEventListener("focusin", stopAuto);
    heroSlider.addEventListener("focusout", startAuto);
  }

  const langMenu = document.querySelector("[data-lang-menu]");
  if (langMenu) {
    const toggleButton = langMenu.querySelector("button");
    const menu = langMenu.querySelector("ul");

    const closeMenu = () => {
      langMenu.classList.remove("is-open");
      toggleButton.setAttribute("aria-expanded", "false");
    };

    const toggleMenu = () => {
      const isOpen = langMenu.classList.toggle("is-open");
      toggleButton.setAttribute("aria-expanded", String(isOpen));
    };

    toggleButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMenu();
    });

    document.addEventListener("click", (event) => {
      if (!langMenu.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        toggleButton.focus();
      }
    });

    if (menu) {
      menu.addEventListener("click", () => closeMenu());
    }
  }
})();
