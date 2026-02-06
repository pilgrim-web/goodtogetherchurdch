# Good Together Church

Static multi-language website built with HTML/CSS/vanilla JS and Decap CMS.

## Local Preview
```
python -m http.server 8000
```
Then open `http://localhost:8000/en/`.

## Content Manifests
News, Blog, and Gallery pages read from per-language manifest files:

- `content/news/<lang>/index.json`
- `content/blog/<lang>/index.json`
- `content/gallery/<lang>/index.json`

These manifests are currently maintained manually for the MVP. When new Markdown content is added in `content/news/<lang>/`, `content/blog/<lang>/`, or `content/gallery/<lang>/`, update the corresponding `index.json` to include the published items. The frontend only displays items with `status: "published"` and sorts by date descending.

## CMS
Decap CMS is available at `/admin/`. Configure Netlify Identity + Git Gateway for editing.

## Image Paths
Use the following public paths:
- `/assets/img/hero/home-01.jpg` to `/assets/img/hero/home-04.jpg`
- `/assets/img/cards/services.jpg`, `news.jpg`, `blog.jpg`, `gallery.jpg`
- `/assets/img/pastor/pastor-portrait.jpg`
- `/assets/img/staffs/staff-01.jpg` (and more as needed)
- `/assets/img/gallery/<album>/` for gallery images

## Multilingual Routing
Canonical URLs use language prefixes (e.g., `/en/`, `/es/`, `/ko/`, `/ja/`). Pages are duplicated under those language folders so the site works on any static host (Netlify, GitHub Pages, `python -m http.server`, etc.). JavaScript detects the language from the URL prefix, applies translations from `content/i18n.json`, and updates internal links to keep the prefix.

If you edit any root `*.html` page, re-sync the language-prefixed copies:
```
bash scripts/sync-lang-pages.sh
```
