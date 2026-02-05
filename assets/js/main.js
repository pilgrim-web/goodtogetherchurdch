(() => {
  const supportedLangs = ["en", "es", "ko", "ja"];

  const getPathParts = () => window.location.pathname.split("/").filter(Boolean);

  const detectLang = () => {
    const [first] = getPathParts();
    return supportedLangs.includes(first) ? first : "en";
  };

  const redirectIfMissingPrefix = () => {
    const parts = getPathParts();
    const first = parts[0];
    const bypass = ["admin", "assets", "content", "settings", "staffs", "css", "js"];
    if (supportedLangs.includes(first) || bypass.includes(first)) return;

    const path = window.location.pathname.startsWith("/")
      ? window.location.pathname
      : `/${window.location.pathname}`;
    const query = window.location.search || "";
    const hash = window.location.hash || "";
    window.location.replace(`/en${path}${query}${hash}`);
  };

  const setupLangMenu = (lang) => {
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

    const currentPath = getPathParts().slice(1).join("/");
    const trailingSlash = window.location.pathname.endsWith("/") ? "/" : "";
    document.querySelectorAll("[data-lang-switch]").forEach((link) => {
      const targetLang = link.getAttribute("data-lang-switch");
      const suffix = currentPath ? `/${currentPath}${trailingSlash}` : "/";
      link.setAttribute("href", `/${targetLang}${suffix}${window.location.search}`);
    });
  };

  const applyInternalLinks = (lang) => {
    document.querySelectorAll("[data-link]").forEach((link) => {
      const target = link.getAttribute("data-link");
      const path = target === "home" ? "" : `/${target}`;
      link.setAttribute("href", `/${lang}${path}/`);
    });
  };

  const applyFormActions = (lang) => {
    document.querySelectorAll("[data-form-action]").forEach((form) => {
      const target = form.getAttribute("data-form-action");
      form.setAttribute("action", `/${lang}/${target}/`);
    });
  };

  const loadSettings = async (lang) => {
    const response = await fetch(`/settings/${lang}.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error("Failed to load settings");
    return response.json();
  };

  const renderOfferingLinks = async (lang, t) => {
    const container = document.querySelector("[data-offering-links]");
    if (!container) return;

    try {
      const settings = await loadSettings(lang);
      const links = Array.isArray(settings?.offering_links) ? settings.offering_links : [];
      container.innerHTML = "";

      if (!links.length) {
        container.innerHTML = `<p>${t("offering.links_empty")}</p>`;
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
      container.innerHTML = `<p>${t("offering.links_error")}</p>`;
    }
  };

  const loadI18n = async () => {
    const response = await fetch("/content/i18n.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Failed to load i18n");
    return response.json();
  };

  const getTranslation = (dict, lang, key) => {
    const parts = key.split(".");
    let node = dict?.[lang];
    for (const part of parts) {
      if (!node || typeof node !== "object") return "";
      node = node[part];
    }
    return typeof node === "string" ? node : "";
  };

  const applyI18n = (dict, lang) => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = getTranslation(dict, lang, key);
      if (value) el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      const value = getTranslation(dict, lang, key);
      if (value) el.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-alt");
      const value = getTranslation(dict, lang, key);
      if (value) el.setAttribute("alt", value);
    });
  };

  const init = async () => {
    redirectIfMissingPrefix();
    const lang = detectLang();
    document.documentElement.lang = lang;
    document.body.dataset.lang = lang;

    setupLangMenu(lang);
    applyInternalLinks(lang);
    applyFormActions(lang);

    let i18n = {};
    try {
      i18n = await loadI18n();
    } catch (error) {
      i18n = {};
    }

    const t = (key) => getTranslation(i18n, lang, key) || key;
    window.Site = { lang, t, locale: lang === "en" ? "en-US" : lang };

    applyI18n(i18n, lang);

    const titleKey = document.body?.dataset?.titleKey;
    if (titleKey) {
      document.title = t(titleKey);
    }

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
      renderOfferingLinks(lang, t);
    }

    const revealItems = document.querySelectorAll("[data-reveal]");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  };

  init();
})();
