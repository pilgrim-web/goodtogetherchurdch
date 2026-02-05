(() => {
  const getPageParam = () => {
    const url = new URL(window.location.href);
    const pageParam = parseInt(url.searchParams.get("page") || "1", 10);
    return Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  };

  const paginate = (items, perPage, currentPage) => {
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * perPage;
    const pageItems = items.slice(start, start + perPage);
    return { pageItems, totalPages, currentPage: page };
  };

  const render = (container, currentPage, totalPages, basePath, queryString = "") => {
    container.innerHTML = "";
    if (totalPages <= 1) return;

    const t = window.Site?.t || ((key) => key);
    const prevLabel = t("pagination.prev");
    const nextLabel = t("pagination.next");
    const queryPrefix = queryString ? `?${queryString}&page=` : "?page=";

    const createLink = (label, page, isDisabled, isCurrent) => {
      const el = document.createElement(isDisabled || isCurrent ? "span" : "a");
      el.textContent = label;
      if (isCurrent) el.classList.add("is-current");
      if (isDisabled) el.classList.add("is-disabled");
      if (!isDisabled && !isCurrent) {
        el.href = `${basePath}${queryPrefix}${page}`;
      }
      return el;
    };

    container.appendChild(createLink(prevLabel, currentPage - 1, currentPage <= 1, false));

    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i += 1) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }

    pages.forEach((page) => {
      if (page === "…") {
        const span = document.createElement("span");
        span.textContent = "…";
        container.appendChild(span);
        return;
      }
      container.appendChild(createLink(String(page), page, false, page === currentPage));
    });

    container.appendChild(
      createLink(nextLabel, currentPage + 1, currentPage >= totalPages, false)
    );
  };

  window.Pagination = { getPageParam, paginate, render };
})();
