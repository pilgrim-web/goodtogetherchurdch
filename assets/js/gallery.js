(() => {
  const IMAGES_PER_PAGE = 4;

  const safeText = (value) => (value ? String(value) : "");

  const formatDate = (value, locale) => {
    const date = window.ContentLoader?.parseDate?.(value);
    if (!date) return value;
    return new Intl.DateTimeFormat(locale || "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  const renderList = async () => {
    const listEl = document.querySelector("#gallery-list");
    const lang = window.Site?.lang || "en";
    const locale = window.Site?.locale || "en-US";
    const manifest = `/content/gallery/${lang}/index.json`;
    const basePath = `/${lang}/gallery/`;
    const albumPath = `/${lang}/gallery/album/`;
    const t = window.Site?.t || ((key) => key);
    if (!listEl) return;

    try {
      const albums = await window.ContentLoader.getGallery(manifest, lang);
      listEl.innerHTML = "";

      if (!albums.length) {
        listEl.innerHTML = `<p>${t("gallery.empty")}</p>`;
        return;
      }

      albums.forEach((album) => {
        const card = document.createElement("article");
        card.className = "news-card";

        const image = document.createElement("img");
        image.className = "news-card__image";
        image.src = safeText(album.cover_image);
        image.alt = safeText(album.title);
        image.loading = "lazy";
        image.decoding = "async";

        const body = document.createElement("div");
        body.className = "news-card__body";

        const title = document.createElement("h3");
        title.className = "news-card__title";
        title.textContent = safeText(album.title);

        const date = document.createElement("div");
        date.className = "news-card__date";
        date.textContent = formatDate(album.date, locale);

        const excerpt = document.createElement("p");
        excerpt.className = "news-card__excerpt";
        excerpt.textContent = safeText(album.description);

        const action = document.createElement("div");
        action.className = "news-card__action";
        const link = document.createElement("a");
        link.href = `${albumPath}?slug=${encodeURIComponent(album.slug)}`;
        link.textContent = t("actions.view_album");
        action.appendChild(link);

        body.appendChild(title);
        body.appendChild(date);
        body.appendChild(excerpt);
        body.appendChild(action);

        card.appendChild(image);
        card.appendChild(body);
        listEl.appendChild(card);
      });
    } catch (error) {
      listEl.innerHTML = `<p>${t("gallery.error")}</p>`;
    }
  };

  const openLightbox = (src, alt) => {
    let lightbox = document.querySelector(".lightbox");
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "lightbox";
      lightbox.innerHTML = "<button type=\"button\">Close</button><img alt=\"\" />";
      document.body.appendChild(lightbox);

      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
          lightbox.classList.remove("is-open");
        }
      });

      lightbox.querySelector("button").addEventListener("click", () => {
        lightbox.classList.remove("is-open");
      });
    }

    const img = lightbox.querySelector("img");
    img.src = src;
    img.alt = alt || "";
    lightbox.classList.add("is-open");
  };

  const renderDetail = async () => {
    const container = document.querySelector("#gallery-album");
    const imagesEl = document.querySelector("#gallery-images");
    const paginationEl = document.querySelector("#gallery-pagination");
    const lang = window.Site?.lang || "en";
    const locale = window.Site?.locale || "en-US";
    const manifest = `/content/gallery/${lang}/index.json`;
    const basePath = `/${lang}/gallery/`;
    const t = window.Site?.t || ((key) => key);
    if (!container || !imagesEl || !paginationEl) return;

    try {
      const albums = await window.ContentLoader.getGallery(manifest, lang);
      const slug = new URL(window.location.href).searchParams.get("slug");
      const album = albums.find((item) => item.slug === slug);

      if (!album) {
        container.innerHTML = `<p>${t("gallery.not_found")} <a href="${basePath}">${t(
          "gallery.back"
        )}</a></p>`;
        imagesEl.innerHTML = "";
        paginationEl.innerHTML = "";
        return;
      }

      container.innerHTML = "";
      const title = document.createElement("h1");
      title.textContent = safeText(album.title);
      const date = document.createElement("div");
      date.className = "news-post__date";
      date.textContent = formatDate(album.date, locale);
      const description = document.createElement("p");
      description.textContent = safeText(album.description);

      container.appendChild(title);
      container.appendChild(date);
      container.appendChild(description);

      const images = Array.isArray(album.images) ? album.images : [];
      const page = window.Pagination.getPageParam();
      const { pageItems, totalPages, currentPage } = window.Pagination.paginate(
        images,
        IMAGES_PER_PAGE,
        page
      );

      imagesEl.innerHTML = "";
      pageItems.forEach((src) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const img = document.createElement("img");
        img.src = safeText(src);
        img.alt = safeText(album.title);
        img.loading = "lazy";
        img.decoding = "async";
        btn.appendChild(img);
        btn.addEventListener("click", () => openLightbox(img.src, img.alt));
        imagesEl.appendChild(btn);
      });

      const queryString = `slug=${encodeURIComponent(album.slug)}`;
      window.Pagination.render(paginationEl, currentPage, totalPages, basePath + "album/", queryString);
    } catch (error) {
      container.innerHTML = `<p>${t("gallery.load_error")}</p>`;
    }
  };

  window.Gallery = { renderList, renderDetail };
})();
