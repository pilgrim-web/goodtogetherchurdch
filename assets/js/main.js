(() => {
  const setupLangMenu = () => {
    const langMenu = document.querySelector("[data-lang-menu]");
    if (!langMenu) return;
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
  };

  const loadSettings = async (lang) => {
    const response = await fetch(`/settings/${lang}.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error("Failed to load settings");
    return response.json();
  };

  const renderOfferingLinks = async () => {
    const lang = document.body?.dataset?.lang || "en";
    const container = document.querySelector("[data-offering-links]");
    if (!container) return;

    try {
      const settings = await loadSettings(lang);
      const links = Array.isArray(settings?.offering_links) ? settings.offering_links : [];
      container.innerHTML = "";

      if (!links.length) {
        container.innerHTML = "<p>Offering links coming soon.</p>";
        return;
      }

      links.forEach((link) => {
        const anchor = document.createElement("a");
        anchor.className = "button";
        anchor.href = link.url;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.textContent = link.label;
        container.appendChild(anchor);
      });
    } catch (error) {
      container.innerHTML = "<p>Offering links are unavailable right now.</p>";
    }
  };

  setupLangMenu();

  const page = document.body?.dataset?.page;
  if (page === "news-list" && window.News?.renderList) {
    window.News.renderList();
  }
  if (page === "news-detail" && window.News?.renderDetail) {
    window.News.renderDetail();
  }
  if (page === "blog-list" && window.Blog?.renderList) {
    window.Blog.renderList();
  }
  if (page === "blog-detail" && window.Blog?.renderDetail) {
    window.Blog.renderDetail();
  }
  if (page === "gallery-list" && window.Gallery?.renderList) {
    window.Gallery.renderList();
  }
  if (page === "gallery-detail" && window.Gallery?.renderDetail) {
    window.Gallery.renderDetail();
  }
  if (page === "offering") {
    renderOfferingLinks();
  }
})();
