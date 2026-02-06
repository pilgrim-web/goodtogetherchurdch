import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const LANGS = ["en", "es", "ko", "ja"];

const COLLECTIONS = [
  { name: "blog", kind: "posts" },
  { name: "news", kind: "posts" },
  { name: "gallery", kind: "albums" }
];

const isFile = async (p) => {
  try {
    const stat = await fs.stat(p);
    return stat.isFile();
  } catch {
    return false;
  }
};

const listMarkdownFiles = async (dir) => {
  let entries = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  const md = [];
  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith(".md")) continue;
    const full = path.join(dir, entry);
    if (await isFile(full)) md.push(full);
  }
  return md;
};

const safeString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const normalizeDate = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = safeString(value).trim();
  if (!raw) return "";

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    // Standardize to YYYY-MM-DD so the site sorts consistently.
    return parsed.toISOString().slice(0, 10);
  }

  return raw;
};

const normalizeId = ({ data, filenameSlug }) => {
  const id = data?.id ?? data?.content_id ?? data?.translation_id;
  const raw = safeString(id).trim();
  return raw || filenameSlug;
};

const normalizeSlug = ({ data, filenameSlug }) => {
  const raw = safeString(data?.slug).trim();
  return raw || filenameSlug;
};

const normalizeImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          if (typeof item.image === "string") return item.image;
          if (typeof item.url === "string") return item.url;
        }
        return "";
      })
      .map((v) => safeString(v).trim())
      .filter(Boolean);
  }
  return [];
};

const parseMarkdownEntry = async ({ filePath, lang, collection }) => {
  const raw = await fs.readFile(filePath, "utf8");

  let parsed;
  try {
    parsed = matter(raw);
  } catch (err) {
    throw new Error(`Frontmatter parse failed for ${filePath}: ${err.message}`);
  }

  const data = parsed.data || {};
  const body = (parsed.content || "").trim();
  const filenameSlug = path.basename(filePath, path.extname(filePath));

  const common = {
    id: normalizeId({ data, filenameSlug }),
    title: safeString(data.title).trim(),
    date: normalizeDate(data.date),
    lang,
    status: safeString(data.status || "draft").trim() || "draft",
    slug: normalizeSlug({ data, filenameSlug })
  };

  if (collection === "gallery") {
    return {
      ...common,
      cover_image: safeString(data.cover_image).trim(),
      description: safeString(data.description).trim(),
      images: normalizeImages(data.images)
    };
  }

  // blog/news
  return {
    ...common,
    cover_image: safeString(data.cover_image).trim(),
    excerpt: safeString(data.excerpt).trim(),
    body_markdown: body || safeString(data.body_markdown || data.body).trim()
  };
};

const validateEntry = (entry, { collection }) => {
  const errors = [];
  if (!entry.title) errors.push("missing title");
  if (!entry.date) errors.push("missing date");
  if (!entry.slug) errors.push("missing slug");

  if (collection === "gallery") {
    if (!entry.cover_image) errors.push("missing cover_image");
    if (!entry.description) errors.push("missing description");
    if (!Array.isArray(entry.images) || entry.images.length === 0) {
      errors.push("missing images");
    }
  } else {
    if (!entry.cover_image) errors.push("missing cover_image");
    if (!entry.excerpt) errors.push("missing excerpt");
    if (!entry.body_markdown) errors.push("missing body_markdown");
  }

  return errors;
};

const writeJson = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const json = JSON.stringify(data, null, 2) + "\n";
  await fs.writeFile(filePath, json, "utf8");
};

const run = async () => {
  const failures = [];

  for (const { name: collection, kind } of COLLECTIONS) {
    for (const lang of LANGS) {
      const dir = path.join(CONTENT_DIR, collection, lang);
      const files = await listMarkdownFiles(dir);

      const entries = [];
      for (const filePath of files) {
        try {
          const entry = await parseMarkdownEntry({ filePath, lang, collection });

          // Validate only if it will be visible (published). Drafts can be incomplete.
          const isPublished = entry.status === "published";
          if (isPublished) {
            const errs = validateEntry(entry, { collection });
            if (errs.length) {
              failures.push(`${filePath}: ${errs.join(", ")}`);
              continue;
            }
          }

          entries.push(entry);
        } catch (err) {
          failures.push(err.message);
        }
      }

      // Sort newest first for stable output (site also sorts).
      entries.sort((a, b) => {
        const da = new Date(a.date);
        const db = new Date(b.date);
        if (!Number.isNaN(da.getTime()) && !Number.isNaN(db.getTime())) return db - da;
        if (!Number.isNaN(da.getTime())) return -1;
        if (!Number.isNaN(db.getTime())) return 1;
        return 0;
      });

      const outPath = path.join(dir, "index.json");
      await writeJson(outPath, { [kind]: entries });
      console.log(`Generated ${outPath} (${entries.length} items)`);
    }
  }

  if (failures.length) {
    console.error("\nContent index generation failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
    process.exit(1);
  }
};

run();
