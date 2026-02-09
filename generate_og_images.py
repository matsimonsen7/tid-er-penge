"""Generate OG share images (1200x630) for each stock on tiderpenge.dk.
Shows SHOCKING return numbers to maximize social media engagement.
Design matches website: dark bg with emerald radial glows, glass card, logo."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

STOCKS = [
    {"ticker": "NOVO-B.CO", "name": "Novo Nordisk", "slug": "novo-nordisk"},
    {"ticker": "DSV.CO", "name": "DSV", "slug": "dsv"},
    {"ticker": "CARL-B.CO", "name": "Carlsberg", "slug": "carlsberg"},
    {"ticker": "NVDA", "name": "NVIDIA", "slug": "nvidia"},
    {"ticker": "AAPL", "name": "Apple", "slug": "apple"},
    {"ticker": "MSFT", "name": "Microsoft", "slug": "microsoft"},
    {"ticker": "GOOGL", "name": "Google", "slug": "google"},
    {"ticker": "AMZN", "name": "Amazon", "slug": "amazon"},
    {"ticker": "NFLX", "name": "Netflix", "slug": "netflix"},
]

WIDTH = 1200
HEIGHT = 630
BASE_INVESTMENT = 10_000

# Brand colors (matching website)
BG_BASE = (11, 13, 23)               # #0B0D17
EMERALD = (16, 185, 129)             # #10B981
EMERALD_DARK = (5, 150, 105)         # #059669
EMERALD_LIGHT = (52, 211, 153)       # #34D399
WHITE = (255, 255, 255)
GRAY_LIGHT = (156, 163, 175)         # #9CA3AF
GRAY_MEDIUM = (107, 116, 128)        # #6B7280

# Glass card
CARD_MARGIN = 50
CARD_X, CARD_Y = CARD_MARGIN, CARD_MARGIN
CARD_W, CARD_H = WIDTH - 2 * CARD_MARGIN, HEIGHT - 2 * CARD_MARGIN
CARD_RADIUS = 20

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "public" / "data"
OUTPUT_DIR = BASE_DIR / "public" / "og"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in font_paths:
        if Path(path).exists():
            try:
                if path.endswith(".ttc"):
                    index = 1 if bold else 0
                    return ImageFont.truetype(path, size, index=index)
                return ImageFont.truetype(path, size)
            except (OSError, IndexError):
                continue
    return ImageFont.load_default()


def load_stock_data(ticker: str) -> dict:
    path = DATA_DIR / f"{ticker}.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def format_kr(amount: int) -> str:
    """Format as Danish currency: 362.000 kr"""
    return f"{amount:,} kr".replace(',', '.')


def calculate_best_return(data: dict) -> tuple[int, str, int]:
    """Calculate most impressive return period.
    Returns: (final_amount, period_text, years)"""
    if not data or "prices" not in data or not data["prices"]:
        return 0, "siden start", 0

    prices = data["prices"]
    latest_price = float(prices[-1]["close"])
    start_date = datetime.strptime(prices[0]["date"], "%Y-%m-%d")
    latest_date = datetime.strptime(prices[-1]["date"], "%Y-%m-%d")
    total_years = (latest_date - start_date).days / 365.25

    start_price = float(prices[0]["close"])
    total_return = int((latest_price / start_price) * BASE_INVESTMENT)

    ten_year_return = None
    if total_years >= 10:
        ten_year_ago = latest_date.replace(year=latest_date.year - 10)
        for price in prices:
            price_date = datetime.strptime(price["date"], "%Y-%m-%d")
            if abs((price_date - ten_year_ago).days) < 180:
                ten_year_price = float(price["close"])
                ten_year_return = int((latest_price / ten_year_price) * BASE_INVESTMENT)
                break

    if ten_year_return and ten_year_return > total_return * 0.7:
        return ten_year_return, "over 10 år", 10
    elif total_years >= 15:
        year = start_date.year
        return total_return, f"siden {year}", int(total_years)
    else:
        years = int(total_years)
        return total_return, f"over {years} år", years


def draw_radial_glow(
    img: Image.Image, cx: int, cy: int, radius: int, color: tuple[int, int, int], max_alpha: int
) -> None:
    """Draw a soft radial glow by compositing concentric circles."""
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    steps = 20
    for i in range(steps):
        r = radius - (radius * i // steps)
        alpha = int(max_alpha * (1 - i / steps) ** 2)
        if alpha < 1 or r < 1:
            continue
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(*color, alpha),
        )
    img_rgba = img.convert("RGBA")
    img_rgba = Image.alpha_composite(img_rgba, overlay)
    img.paste(img_rgba.convert("RGB"))


def create_bg_with_atmosphere() -> Image.Image:
    """Create dark background with emerald radial glows matching the website."""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_BASE)

    # Top-left emerald glow (like website's radial-gradient at 0% 0%)
    draw_radial_glow(img, cx=250, cy=120, radius=450, color=EMERALD, max_alpha=35)
    # Bottom-right darker emerald glow
    draw_radial_glow(img, cx=950, cy=510, radius=380, color=EMERALD_DARK, max_alpha=25)

    return img


def draw_glass_card(img: Image.Image) -> None:
    """Draw a subtle glass-card container matching the website's glass-card class."""
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Card fill: rgba(255,255,255,0.03)
    draw.rounded_rectangle(
        [CARD_X, CARD_Y, CARD_X + CARD_W, CARD_Y + CARD_H],
        radius=CARD_RADIUS,
        fill=(255, 255, 255, 8),
    )
    # Card border: rgba(255,255,255,0.08)
    draw.rounded_rectangle(
        [CARD_X, CARD_Y, CARD_X + CARD_W, CARD_Y + CARD_H],
        radius=CARD_RADIUS,
        outline=(255, 255, 255, 20),
        width=1,
    )

    img_rgba = img.convert("RGBA")
    img_rgba = Image.alpha_composite(img_rgba, overlay)
    img.paste(img_rgba.convert("RGB"))


def draw_logo(img: Image.Image, x: int, y: int, size: int = 44) -> None:
    """Draw the plant/sprout logo matching assets/logo.svg."""
    # Render logo on transparent canvas, then rotate and paste
    canvas_size = size + 10  # extra space for rotation
    logo = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    d = ImageDraw.Draw(logo)

    # Scale factor from 100x100 SVG to target size
    s = size / 100
    cx, cy = canvas_size // 2, canvas_size // 2
    ox, oy = cx - int(50 * s), cy - int(50 * s)  # offset to center

    # Leaves (circles)
    leaf1_cx, leaf1_cy, leaf1_r = int(40 * s) + ox, int(45 * s) + oy, int(12 * s)
    leaf2_cx, leaf2_cy, leaf2_r = int(60 * s) + ox, int(35 * s) + oy, int(10 * s)
    d.ellipse([leaf1_cx - leaf1_r, leaf1_cy - leaf1_r, leaf1_cx + leaf1_r, leaf1_cy + leaf1_r],
              fill=EMERALD)
    d.ellipse([leaf2_cx - leaf2_r, leaf2_cy - leaf2_r, leaf2_cx + leaf2_r, leaf2_cy + leaf2_r],
              fill=EMERALD_DARK)

    # Stem (white rectangle with rounded ends)
    stem_x = int(47 * s) + ox
    stem_y = int(40 * s) + oy
    stem_w = int(6 * s)
    stem_h = int(35 * s)
    stem_r = int(3 * s)
    d.rounded_rectangle([stem_x, stem_y, stem_x + stem_w, stem_y + stem_h],
                        radius=stem_r, fill=WHITE)

    # Rotate -10 degrees
    logo = logo.rotate(10, resample=Image.BICUBIC, expand=False, center=(cx, cy))

    # Paste onto main image
    img_rgba = img.convert("RGBA")
    img_rgba.paste(logo, (x - canvas_size // 2, y - canvas_size // 2), logo)
    img.paste(img_rgba.convert("RGB"))


def draw_text_with_shadow(
    draw: ImageDraw.ImageDraw,
    img: Image.Image,
    pos: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    fill: tuple[int, int, int],
    anchor: str = "mt",
    shadow_color: tuple[int, int, int] = EMERALD,
    shadow_alpha: int = 50,
    shadow_offset: int = 3,
) -> None:
    """Draw text with a subtle colored drop shadow for depth."""
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # Shadow (multiple offset copies for softness)
    for dx in range(-1, 2):
        for dy in range(0, 3):
            od.text(
                (pos[0] + dx, pos[1] + shadow_offset + dy),
                text, fill=(*shadow_color, shadow_alpha // 2), font=font, anchor=anchor,
            )
    img_rgba = img.convert("RGBA")
    img_rgba = Image.alpha_composite(img_rgba, overlay)
    img.paste(img_rgba.convert("RGB"))
    # Sharp text on top
    draw.text(pos, text, fill=fill, font=font, anchor=anchor)


def draw_cta_pill(img: Image.Image, cx: int, cy: int, text: str) -> None:
    """Draw an emerald pill-shaped CTA button."""
    font = load_font(24, bold=True)
    # Measure text
    temp_draw = ImageDraw.Draw(img)
    bbox = temp_draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    pad_x, pad_y = 28, 12
    pill_w = text_w + pad_x * 2
    pill_h = text_h + pad_y * 2
    pill_x = cx - pill_w // 2
    pill_y = cy - pill_h // 2

    # Semi-transparent emerald background
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=pill_h // 2,
        fill=(*EMERALD, 50),
        outline=(*EMERALD, 100),
        width=1,
    )
    img_rgba = img.convert("RGBA")
    img_rgba = Image.alpha_composite(img_rgba, overlay)
    img.paste(img_rgba.convert("RGB"))

    # Text on top
    draw = ImageDraw.Draw(img)
    draw.text((cx, cy), text, fill=EMERALD_LIGHT, font=font, anchor="mm")


def generate_stock_image(stock: dict) -> None:
    ticker = stock["ticker"]
    name = stock["name"]
    slug = stock["slug"]

    data = load_stock_data(ticker)
    final_amount, period_text, years = calculate_best_return(data)

    # Build image layers
    img = create_bg_with_atmosphere()
    draw_glass_card(img)
    draw = ImageDraw.Draw(img)

    # Logo + brand in top-left of card
    logo_x = CARD_X + 52
    logo_y = CARD_Y + 48
    draw_logo(img, logo_x, logo_y, size=40)
    draw = ImageDraw.Draw(img)  # refresh after paste

    font_brand = load_font(22, bold=False)
    draw.text((logo_x + 30, logo_y), "tiderpenge.dk", fill=GRAY_LIGHT, font=font_brand, anchor="lm")

    # Fonts
    font_name = load_font(64, bold=True)
    font_sub = load_font(44, bold=False)
    font_huge = load_font(100, bold=True)
    font_period = load_font(36, bold=False)

    # Content centered in card
    center_x = WIDTH // 2
    y = CARD_Y + 120

    # Stock name
    draw.text((center_x, y), name, fill=WHITE, font=font_name, anchor="mt")
    y += 85

    # "10.000 kr blev til"
    start_text = format_kr(BASE_INVESTMENT) + " blev til"
    draw.text((center_x, y), start_text, fill=GRAY_LIGHT, font=font_sub, anchor="mt")
    y += 70

    # HUGE final amount in emerald with shadow
    final_text = format_kr(final_amount)
    draw_text_with_shadow(draw, img, (center_x, y), final_text, font_huge, fill=EMERALD)
    draw = ImageDraw.Draw(img)  # refresh
    y += 125

    # Period text
    draw.text((center_x, y), period_text, fill=GRAY_MEDIUM, font=font_period, anchor="mt")

    # CTA pill at bottom of card
    draw_cta_pill(img, center_x, CARD_Y + CARD_H - 55, "Beregn dit afkast")

    # Save
    out_path = OUTPUT_DIR / f"{slug}.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"  {name}: {final_text} {period_text}")


def generate_homepage_image() -> None:
    """Generate generic OG image for homepage."""
    img = create_bg_with_atmosphere()
    draw_glass_card(img)
    draw = ImageDraw.Draw(img)

    # Logo + brand in top-left of card
    logo_x = CARD_X + 52
    logo_y = CARD_Y + 48
    draw_logo(img, logo_x, logo_y, size=40)
    draw = ImageDraw.Draw(img)

    font_brand = load_font(22, bold=False)
    draw.text((logo_x + 30, logo_y), "tiderpenge.dk", fill=GRAY_LIGHT, font=font_brand, anchor="lm")

    font_huge = load_font(80, bold=True)
    font_large = load_font(48, bold=False)
    font_medium = load_font(36, bold=False)

    center_x = WIDTH // 2
    y = CARD_Y + 140

    # Main headline
    draw.text((center_x, y), "Tid er penge", fill=WHITE, font=font_huge, anchor="mt")
    y += 110

    # Subtitle in emerald
    draw_text_with_shadow(draw, img, (center_x, y),
                          "Hvad hvis du havde investeret?",
                          font_large, fill=EMERALD)
    draw = ImageDraw.Draw(img)
    y += 80

    # Description
    draw.text((center_x, y), "Se hvad dine penge kunne være blevet til",
              fill=GRAY_LIGHT, font=font_medium, anchor="mt")
    y += 60

    # Stock examples
    font_small = load_font(28, bold=False)
    draw.text((center_x, y), "Novo Nordisk  |  Apple  |  NVIDIA  |  Amazon",
              fill=GRAY_MEDIUM, font=font_small, anchor="mt")

    # CTA pill
    draw_cta_pill(img, center_x, CARD_Y + CARD_H - 55, "Beregn dit afkast")

    # Save
    out_path = BASE_DIR / "public" / "og-image.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"  Homepage: {out_path.name}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Generating OG images...\n")

    for stock in STOCKS:
        generate_stock_image(stock)

    print()
    generate_homepage_image()
    print("\nDone!")


if __name__ == "__main__":
    main()
