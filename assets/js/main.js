(() => {
  const supportedLangs = ["en", "es", "ko", "ja"];
  const localeMap = { en: "en-US", es: "es-ES", ko: "ko-KR", ja: "ja-JP" };
  const manifestCache = new Map();

  const normalizeBasePath = (value) => {
    if (!value) return "/";
    let output = value;
    if (!output.startsWith("/")) output = `/${output}`;
    if (!output.endsWith("/")) output = `${output}/`;
    return output;
  };

  const detectBasePath = () => {
    const marker = "/assets/js/main.js";
    const script =
      document.currentScript || document.querySelector("script[src$=\"assets/js/main.js\"]");
    const src = script?.src || "";
    try {
      const url = new URL(src, window.location.href);
      const idx = url.pathname.lastIndexOf(marker);
      if (idx === -1) return "/";
      return normalizeBasePath(url.pathname.slice(0, idx));
    } catch {
      return "/";
    }
  };

  const basePath = detectBasePath();
  const withBasePath = (path) => `${basePath}${String(path || "").replace(/^\\//, "")}`;

  const getPathFromBase = () => {
    if (basePath === "/") return window.location.pathname || "/";
    const pathname = window.location.pathname || "/";
    if (pathname === basePath.slice(0, -1)) return "/";
    if (pathname.startsWith(basePath)) return pathname.slice(basePath.length - 1) || "/";
    return pathname;
  };

  const getPathParts = () => getPathFromBase().split("/").filter(Boolean);

  const detectLang = () => {
    const [first] = getPathParts();
    return supportedLangs.includes(first) ? first : "en";
  };

  const redirectIfMissingPrefix = () => {
    const parts = getPathParts();
    const first = parts[0];
    const bypass = ["admin", "assets", "content", "settings", "staffs", "css", "js"];
    if (supportedLangs.includes(first) || bypass.includes(first)) return;

    const path = getPathFromBase();
    const query = window.location.search || "";
    const hash = window.location.hash || "";
    window.location.replace(withBasePath(`en${path}${query}${hash}`));
  };

  const loadManifest = async (collection, lang) => {
    const cacheKey = `${collection}:${lang}`;
    if (manifestCache.has(cacheKey)) {
      return manifestCache.get(cacheKey);
    }

    const url = withBasePath(`content/${collection}/${lang}/index.json`);
    const promise = fetch(url, { cache: "no-cache" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);

    manifestCache.set(cacheKey, promise);
    return promise;
  };

  const getDetailContext = () => {
    const page = document.body?.dataset?.page || "";
    if (page === "news-detail") return { collection: "news", listPath: "news" };
    if (page === "blog-detail") return { collection: "blog", listPath: "blog" };
    if (page === "gallery-detail") return { collection: "gallery", listPath: "gallery" };
    return null;
  };

  const getPublishedItems = (manifest, collection, lang) => {
    const items = collection === "gallery" ? manifest?.albums : manifest?.posts;
    if (!Array.isArray(items)) return [];
    return items.filter((item) => item && item.status === "published" && item.lang === lang);
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
    const trailingSlash = getPathFromBase().endsWith("/") ? "/" : "";
    const suffix = currentPath ? `/${currentPath}${trailingSlash}` : "/";
    const switchLinks = Array.from(document.querySelectorAll("[data-lang-switch]"));

    switchLinks.forEach((link) => {
      const targetLang = link.getAttribute("data-lang-switch");
      link.setAttribute("href", withBasePath(`${targetLang}${suffix}${window.location.search}`));
    });

    const detail = getDetailContext();
    if (!detail) return;

    const url = new URL(window.location.href);
    const currentSlug = url.searchParams.get("slug");
    if (!currentSlug) return;

    (async () => {
      const currentManifest = await loadManifest(detail.collection, lang);
      const currentItems = getPublishedItems(currentManifest, detail.collection, lang);
      const currentItem = currentItems.find((item) => item.slug === currentSlug);
      const contentId = currentItem?.id || null;

      await Promise.all(
        switchLinks.map(async (link) => {
          const targetLang = link.getAttribute("data-lang-switch");
          if (!targetLang || targetLang === lang) return;

          const targetManifest = await loadManifest(detail.collection, targetLang);
          const targetItems = getPublishedItems(targetManifest, detail.collection, targetLang);
          const targetItem = contentId
            ? targetItems.find((item) => item.id === contentId)
            : targetItems.find((item) => item.slug === currentSlug);

          if (targetItem) {
            const params = new URLSearchParams(url.search);
            params.set("slug", targetItem.slug);
            const query = params.toString();
            link.setAttribute("href", withBasePath(`${targetLang}${suffix}?${query}`));
          } else {
            link.setAttribute("href", withBasePath(`${targetLang}/${detail.listPath}/`));
          }
        })
      );
    })();
  };

  const applyInternalLinks = (lang) => {
    document.querySelectorAll("[data-link]").forEach((link) => {
      const target = link.getAttribute("data-link");
      const path = target === "home" ? "" : `/${target}`;
      link.setAttribute("href", withBasePath(`${lang}${path}/`));
    });
  };

  const applyFormActions = (lang) => {
    document.querySelectorAll("[data-form-action]").forEach((form) => {
      const target = form.getAttribute("data-form-action");
      form.setAttribute("action", withBasePath(`${lang}/${target}/`));
    });
  };

  const loadSettings = async (lang) => {
    const response = await fetch(withBasePath(`settings/${lang}.json`), { cache: "no-cache" });
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
    const response = await fetch(withBasePath("content/i18n.json"), { cache: "no-cache" });
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
    window.Site = { lang, t, locale: localeMap[lang] || lang, basePath };

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
