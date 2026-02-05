(() => {
  const ALLOWED_TAGS = new Set([
    "p",
    "br",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "a",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "code",
    "pre"
  ]);

  const ALLOWED_ATTRS = {
    a: ["href", "title", "rel", "target"]
  };

  const isSafeUrl = (value) => {
    if (!value) return false;
    try {
      const url = new URL(value, window.location.origin);
      return ["http:", "https:", "mailto:"].includes(url.protocol);
    } catch {
      return false;
    }
  };

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        const fragment = document.createDocumentFragment();
        while (node.firstChild) {
          fragment.appendChild(node.firstChild);
        }
        node.replaceWith(fragment);
        return;
      }

      const allowedAttrs = ALLOWED_ATTRS[tag] || [];
      [...node.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on") || name === "style") {
          node.removeAttribute(attr.name);
          return;
        }
        if (!allowedAttrs.includes(name)) {
          node.removeAttribute(attr.name);
          return;
        }
        if (tag === "a" && name === "href" && !isSafeUrl(attr.value)) {
          node.removeAttribute(attr.name);
        }
      });

      if (tag === "a") {
        node.setAttribute("rel", "noopener noreferrer");
        if (!node.getAttribute("target")) {
          node.setAttribute("target", "_blank");
        }
      }
    }

    const children = Array.from(node.childNodes);
    children.forEach((child) => sanitizeNode(child));
  };

  window.sanitizeHtml = (input) => {
    if (!input) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(input), "text/html");
    sanitizeNode(doc.body);
    return doc.body.innerHTML;
  };
})();
