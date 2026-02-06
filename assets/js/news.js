(() => {
  const PER_PAGE = 4;

  const safeText = (value) => (value ? String(value) : "");

  const getBasePath = () => window.Site?.basePath || "/";

  const withBasePath = (path) => `${getBasePath()}${String(path || "").replace(/^\\//, "")}`;

  const withBaseAsset = (value) => {
    if (!value) return "";
    const text = String(value);
    if (/^(https?:)?\\/\\//i.test(text) || text.startsWith("data:") || text.startsWith("mailto:")) {
      return text;
    }
    if (text.startsWith("/")) return withBasePath(text.slice(1));
    return withBasePath(text);
  };

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
    const listEl = document.querySelector("#news-list");
    const paginationEl = document.querySelector("#news-pagination");
    const lang = window.Site?.lang || "en";
    const locale = window.Site?.locale || "en-US";
    const manifest = withBasePath(`content/news/${lang}/index.json`);
    const basePath = withBasePath(`${lang}/news/`);
    const postPath = withBasePath(`${lang}/news/post/`);
    const t = window.Site?.t || ((key) => key);
    if (!listEl || !paginationEl) return;

    try {
      const posts = await window.ContentLoader.getCollection(manifest, lang);
      const page = window.Pagination.getPageParam();
      const { pageItems, totalPages, currentPage } = window.Pagination.paginate(
        posts,
        PER_PAGE,
        page
      );

      listEl.innerHTML = "";
      if (!pageItems.length) {
        const empty = document.createElement("p");
        empty.textContent = t("news.empty");
        listEl.appendChild(empty);
      } else {
        pageItems.forEach((post) => {
          const card = document.createElement("article");
          card.className = "news-card";

          const image = document.createElement("img");
          image.className = "news-card__image";
          image.src = withBaseAsset(post.cover_image);
          image.alt = safeText(post.title);
          image.loading = "lazy";
          image.decoding = "async";

          const body = document.createElement("div");
          body.className = "news-card__body";

          const title = document.createElement("h3");
          title.className = "news-card__title";
          title.textContent = safeText(post.title);

          const date = document.createElement("div");
          date.className = "news-card__date";
          date.textContent = formatDate(post.date, locale);

          const excerpt = document.createElement("p");
          excerpt.className = "news-card__excerpt";
          excerpt.textContent = safeText(post.excerpt);

          const action = document.createElement("div");
          action.className = "news-card__action";
          const link = document.createElement("a");
          link.href = `${postPath}?slug=${encodeURIComponent(post.slug)}`;
          link.textContent = t("actions.read");
          action.appendChild(link);

          body.appendChild(title);
          body.appendChild(date);
          body.appendChild(excerpt);
          body.appendChild(action);

          card.appendChild(image);
          card.appendChild(body);
          listEl.appendChild(card);
        });
      }

      window.Pagination.render(paginationEl, currentPage, totalPages, basePath);
    } catch (error) {
      listEl.innerHTML = `<p>${t("news.error")}</p>`;
      paginationEl.innerHTML = "";
    }
  };

  const renderMarkdown = (markdown) => {
    if (!markdown) return "";
    const lines = String(markdown).replace(/\r/g, "").split("\n");
    const blocks = [];
    let paragraph = [];
    let listItems = [];

    const escapeHtml = (value) =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const renderInline = (text) => {
      let output = escapeHtml(text);
      output = output.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      output = output.replace(/\*(.+?)\*/g, "<em>$1</em>");
      output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
      output = output.replace(/\[([^\]]+)]\(([^)]+)\)/g, "<a href=\"$2\">$1</a>");
      return output;
    };

    const flushParagraph = () => {
      if (paragraph.length) {
        blocks.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
        paragraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length) {
        const items = listItems.map((item) => `<li>${renderInline(item)}</li>`).join("");
        blocks.push(`<ul>${items}</ul>`);
        listItems = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      if (trimmed.startsWith("![")) {
        return;
      }

      if (trimmed.startsWith("### ")) {
        flushParagraph();
        flushList();
        blocks.push(`<h4>${renderInline(trimmed.slice(4))}</h4>`);
        return;
      }

      if (trimmed.startsWith("## ")) {
        flushParagraph();
        flushList();
        blocks.push(`<h3>${renderInline(trimmed.slice(3))}</h3>`);
        return;
      }

      if (trimmed.startsWith("# ")) {
        flushParagraph();
        flushList();
        blocks.push(`<h2>${renderInline(trimmed.slice(2))}</h2>`);
        return;
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        flushParagraph();
        listItems.push(trimmed.slice(2));
        return;
      }

      paragraph.push(trimmed);
    });

    flushParagraph();
    flushList();

    return blocks.join("");
  };

  const renderDetail = async () => {
    const container = document.querySelector("#news-post");
    const lang = window.Site?.lang || "en";
    const locale = window.Site?.locale || "en-US";
    const manifest = withBasePath(`content/news/${lang}/index.json`);
    const basePath = withBasePath(`${lang}/news/`);
    const t = window.Site?.t || ((key) => key);
    if (!container) return;

    try {
      const posts = await window.ContentLoader.getCollection(manifest, lang);
      const slug = new URL(window.location.href).searchParams.get("slug");
      const post = posts.find((item) => item.slug === slug);

      if (!post) {
        container.innerHTML = `<p>${t("news.not_found")} <a href="${basePath}">${t(
          "news.back"
        )}</a></p>`;
        return;
      }

      const hero = document.createElement("div");
      hero.className = "news-post__hero";

      const imageWrap = document.createElement("div");
      imageWrap.className = "news-post__image";
      const image = document.createElement("img");
      image.src = withBaseAsset(post.cover_image);
      image.alt = safeText(post.title);
      image.loading = "lazy";
      image.decoding = "async";
      imageWrap.appendChild(image);

      const meta = document.createElement("div");
      meta.className = "news-post__meta";
      const title = document.createElement("h1");
      title.textContent = safeText(post.title);
      const date = document.createElement("div");
      date.className = "news-post__date";
      date.textContent = formatDate(post.date, locale);

      meta.appendChild(title);
      meta.appendChild(date);

      const body = document.createElement("div");
      body.className = "news-post__content";
      const rawHtml =
        post.body_html || renderMarkdown(post.body_markdown || post.body || "");
      body.innerHTML = window.sanitizeHtml ? window.sanitizeHtml(rawHtml) : rawHtml;

      container.innerHTML = "";
      hero.appendChild(imageWrap);
      hero.appendChild(meta);
      container.appendChild(hero);
      container.appendChild(body);
    } catch (error) {
      container.innerHTML = `<p>${t("news.load_error")}</p>`;
    }
  };

  window.News = { renderList, renderDetail };
})();
