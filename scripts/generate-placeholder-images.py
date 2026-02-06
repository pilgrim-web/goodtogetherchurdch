#!/usr/bin/env python3
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


@dataclass(frozen=True)
class Placeholder:
    path: Path
    size: tuple[int, int]
    label: str
    background: tuple[int, int, int]


def _load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except Exception:
            continue
    return ImageFont.load_default()


def _draw_centered_text(
    draw: ImageDraw.ImageDraw,
    image_size: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
) -> None:
    width, height = image_size
    bbox = draw.multiline_textbbox((0, 0), text, font=font, align="center", spacing=8)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (width - text_w) / 2
    y = (height - text_h) / 2
    draw.multiline_text((x, y), text, font=font, fill=fill, align="center", spacing=8)


def _render_placeholder(placeholder: Placeholder) -> None:
    placeholder.path.parent.mkdir(parents=True, exist_ok=True)

    image = Image.new("RGB", placeholder.size, placeholder.background)
    draw = ImageDraw.Draw(image)

    width, height = placeholder.size
    # Subtle border + diagonal accent
    border = (255, 255, 255)
    draw.rectangle((0, 0, width - 1, height - 1), outline=border, width=max(2, width // 320))
    draw.line((0, height, width, 0), fill=(255, 255, 255), width=max(2, width // 320))

    font = _load_font(size=max(18, width // 18))
    _draw_centered_text(
        draw,
        placeholder.size,
        placeholder.label,
        font=font,
        fill=(255, 255, 255),
    )

    image.save(
        placeholder.path,
        format="JPEG",
        quality=82,
        optimize=True,
        progressive=True,
    )


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    placeholders: list[Placeholder] = [
        # Home hero
        Placeholder(
            root / "assets/img/hero/home-01.jpg", (1600, 900), "Hero 01", (28, 99, 140)
        ),
        Placeholder(
            root / "assets/img/hero/home-02.jpg", (1600, 900), "Hero 02", (44, 120, 115)
        ),
        Placeholder(
            root / "assets/img/hero/home-03.jpg", (1600, 900), "Hero 03", (90, 60, 130)
        ),
        Placeholder(
            root / "assets/img/hero/home-04.jpg", (1600, 900), "Hero 04", (160, 90, 40)
        ),
        # Cards
        Placeholder(
            root / "assets/img/cards/services.jpg", (1200, 675), "Services", (33, 33, 33)
        ),
        Placeholder(root / "assets/img/cards/news.jpg", (1200, 675), "News", (33, 33, 33)),
        Placeholder(root / "assets/img/cards/blog.jpg", (1200, 675), "Blog", (33, 33, 33)),
        Placeholder(
            root / "assets/img/cards/gallery.jpg", (1200, 675), "Gallery", (33, 33, 33)
        ),
        # People
        Placeholder(
            root / "assets/img/pastor/pastor-portrait.jpg",
            (900, 900),
            "Pastor Portrait",
            (50, 50, 60),
        ),
        Placeholder(
            root / "assets/img/staffs/staff-01.jpg", (900, 900), "Staff 01", (50, 50, 60)
        ),
        # Gallery: Hope Day
        Placeholder(
            root / "assets/img/gallery/hope-day/cover.jpg",
            (1200, 900),
            "Hope Day\nCover",
            (56, 95, 160),
        ),
        *[
            Placeholder(
                root / f"assets/img/gallery/hope-day/{i:02d}.jpg",
                (1200, 900),
                f"Hope Day\n{i:02d}",
                (56, 95, 160),
            )
            for i in range(1, 6)
        ],
        # Gallery: Community Night
        Placeholder(
            root / "assets/img/gallery/community-night/cover.jpg",
            (1200, 900),
            "Community Night\nCover",
            (120, 70, 90),
        ),
        *[
            Placeholder(
                root / f"assets/img/gallery/community-night/{i:02d}.jpg",
                (1200, 900),
                f"Community Night\n{i:02d}",
                (120, 70, 90),
            )
            for i in range(1, 5)
        ],
    ]

    created = 0
    skipped = 0
    for placeholder in placeholders:
        if placeholder.path.exists():
            skipped += 1
            continue
        _render_placeholder(placeholder)
        created += 1

    print(f"Placeholder images: created={created} skipped={skipped}")


if __name__ == "__main__":
    main()

