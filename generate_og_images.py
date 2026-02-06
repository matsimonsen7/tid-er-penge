"""Generate OG share images (1200x630) for each stock on tiderpenge.dk."""

from __future__ import annotations

import json
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
BG_COLOR = (11, 13, 23)  # #0B0D17
EMERALD = (16, 185, 129)  # #10B981
EMERALD_DARK = (8, 92, 64)  # subtler sparkline color
WHITE = (255, 255, 255)
GRAY = (156, 163, 175)
BRAND_GRAY = (107, 114, 128)

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
                # .ttc files may have multiple faces; index 0 is regular, 1 is bold
                if path.endswith(".ttc"):
                    index = 1 if bold else 0
                    return ImageFont.truetype(path, size, index=index)
                return ImageFont.truetype(path, size)
            except (OSError, IndexError):
                continue
    return ImageFont.load_default()


def load_prices(ticker: str) -> list[float]:
    path = DATA_DIR / f"{ticker}.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text())
    if not isinstance(data, dict) or "prices" not in data:
        return []
    return [float(p["close"]) for p in data["prices"] if isinstance(p, dict) and "close" in p]


def sample_points(prices: list[float], n: int = 100) -> list[float]:
    if len(prices) <= n:
        return prices
    step = len(prices) / n
    return [prices[int(i * step)] for i in range(n)]


def draw_sparkline(draw: ImageDraw.ImageDraw, prices: list[float]) -> None:
    if len(prices) < 2:
        return

    points = sample_points(prices)
    min_p, max_p = min(points), max(points)
    price_range = max_p - min_p if max_p != min_p else 1.0

    # Sparkline region: centered horizontally with padding, vertical middle area
    margin_x = 100
    margin_top = 160
    margin_bottom = 160
    chart_w = WIDTH - 2 * margin_x
    chart_h = HEIGHT - margin_top - margin_bottom

    coords: list[tuple[float, float]] = []
    for i, p in enumerate(points):
        x = margin_x + (i / (len(points) - 1)) * chart_w
        y = margin_top + chart_h - ((p - min_p) / price_range) * chart_h
        coords.append((x, y))

    # Draw the line in a darker emerald for a subtle background effect
    for i in range(len(coords) - 1):
        draw.line([coords[i], coords[i + 1]], fill=EMERALD_DARK, width=2)


def draw_gradient_overlay(img: Image.Image) -> None:
    """Draw a subtle emerald gradient overlay on the dark background."""
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Radial-ish gradient: horizontal bands with emerald tint fading from center
    for y in range(HEIGHT):
        # Peak intensity around vertical center
        dist = abs(y - HEIGHT // 2) / (HEIGHT // 2)
        alpha = int(18 * (1 - dist))  # max alpha 18 for subtlety
        if alpha > 0:
            draw.line([(0, y), (WIDTH, y)], fill=(16, 185, 129, alpha))

    img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"))


def generate_image(stock: dict) -> None:
    ticker = stock["ticker"]
    name = stock["name"]
    slug = stock["slug"]

    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw_gradient_overlay(img)
    draw = ImageDraw.Draw(img)

    # Load price data and draw sparkline behind text
    prices = load_prices(ticker)
    if prices:
        draw_sparkline(draw, prices)

    # Fonts
    font_name = load_font(72, bold=True)
    font_ticker = load_font(32, bold=False)
    font_subtitle = load_font(28, bold=False)
    font_brand = load_font(24, bold=False)

    # Stock name — centered
    name_bbox = draw.textbbox((0, 0), name, font=font_name)
    name_w = name_bbox[2] - name_bbox[0]
    name_x = (WIDTH - name_w) // 2
    name_y = HEIGHT // 2 - 60
    draw.text((name_x, name_y), name, fill=WHITE, font=font_name)

    # Ticker — centered below name
    ticker_bbox = draw.textbbox((0, 0), ticker, font=font_ticker)
    ticker_w = ticker_bbox[2] - ticker_bbox[0]
    ticker_x = (WIDTH - ticker_w) // 2
    ticker_y = name_y + 85
    draw.text((ticker_x, ticker_y), ticker, fill=GRAY, font=font_ticker)

    # Subtitle — above name
    subtitle = "Hvad hvis du havde investeret?"
    sub_bbox = draw.textbbox((0, 0), subtitle, font=font_subtitle)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (WIDTH - sub_w) // 2
    sub_y = name_y - 50
    draw.text((sub_x, sub_y), subtitle, fill=GRAY, font=font_subtitle)

    # Brand — bottom center
    brand = "tiderpenge.dk"
    brand_bbox = draw.textbbox((0, 0), brand, font=font_brand)
    brand_w = brand_bbox[2] - brand_bbox[0]
    brand_x = (WIDTH - brand_w) // 2
    brand_y = HEIGHT - 55
    draw.text((brand_x, brand_y), brand, fill=BRAND_GRAY, font=font_brand)

    # Save
    out_path = OUTPUT_DIR / f"{slug}.png"
    img.save(out_path, "PNG")
    print(f"  {out_path.relative_to(BASE_DIR)}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generating {len(STOCKS)} OG images...")

    for stock in STOCKS:
        generate_image(stock)

    print("Done.")


if __name__ == "__main__":
    main()
