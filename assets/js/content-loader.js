(() => {
  const fetchManifest = async (url) => {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${url}`);
    }
    return response.json();
  };

  const parseDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const sortByDateDesc = (items) =>
    [...items].sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (dateA && dateB) return dateB - dateA;
      if (dateA) return -1;
      if (dateB) return 1;
      return 0;
    });

  const filterPublished = (items, lang) =>
    items.filter((item) => item && item.status === "published" && item.lang === lang);

  const normalizeCollection = (data) => (Array.isArray(data?.posts) ? data.posts : []);

  const normalizeGallery = (data) => (Array.isArray(data?.albums) ? data.albums : []);

  const getCollection = async (url, lang) => {
    const data = await fetchManifest(url);
    const items = normalizeCollection(data);
    return sortByDateDesc(filterPublished(items, lang));
  };

  const getGallery = async (url, lang) => {
    const data = await fetchManifest(url);
    const items = normalizeGallery(data);
    return sortByDateDesc(filterPublished(items, lang));
  };

  window.ContentLoader = {
    fetchManifest,
    parseDate,
    sortByDateDesc,
    filterPublished,
    getCollection,
    getGallery
  };
})();
