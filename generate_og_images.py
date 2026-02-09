"""Generate OG share images (1200x630) for each stock on tiderpenge.dk.
Shows SHOCKING return numbers to maximize social media engagement."""

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

# Brand colors
BG_START = (15, 23, 42)  # #0f172a dark navy
BG_END = (30, 41, 59)    # #1e293b slightly lighter
EMERALD = (52, 211, 153)  # #34D399 bright emerald
WHITE = (255, 255, 255)
GRAY = (156, 163, 175)  # #9CA3AF

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

    # Calculate total return from start
    start_price = float(prices[0]["close"])
    total_return = int((latest_price / start_price) * BASE_INVESTMENT)

    # Try 10-year return if data allows
    ten_year_return = None
    if total_years >= 10:
        ten_year_ago = latest_date.replace(year=latest_date.year - 10)
        for price in prices:
            price_date = datetime.strptime(price["date"], "%Y-%m-%d")
            if abs((price_date - ten_year_ago).days) < 180:  # Within 6 months
                ten_year_price = float(price["close"])
                ten_year_return = int((latest_price / ten_year_price) * BASE_INVESTMENT)
                break

    # Pick most impressive period
    if ten_year_return and ten_year_return > total_return * 0.7:
        return ten_year_return, "over 10 år", 10
    elif total_years >= 15:
        year = start_date.year
        return total_return, f"siden {year}", int(total_years)
    else:
        years = int(total_years)
        return total_return, f"over {years} år", years


def create_gradient_bg() -> Image.Image:
    """Create dark navy gradient background"""
    img = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(BG_START[0] + (BG_END[0] - BG_START[0]) * ratio)
        g = int(BG_START[1] + (BG_END[1] - BG_START[1]) * ratio)
        b = int(BG_START[2] + (BG_END[2] - BG_START[2]) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    return img


def generate_stock_image(stock: dict) -> None:
    ticker = stock["ticker"]
    name = stock["name"]
    slug = stock["slug"]

    # Load data and calculate return
    data = load_stock_data(ticker)
    final_amount, period_text, years = calculate_best_return(data)

    # Create base image
    img = create_gradient_bg()
    draw = ImageDraw.Draw(img)

    # Fonts
    font_huge = load_font(110, bold=True)    # Final amount
    font_large = load_font(68, bold=True)     # Stock name
    font_medium = load_font(52, bold=False)   # Start amount
    font_small = load_font(38, bold=False)    # Period
    font_brand = load_font(32, bold=False)    # Brand

    # Layout positions (vertical centering)
    y = 90

    # Stock name at top
    draw.text((WIDTH // 2, y), name, fill=WHITE, font=font_large, anchor="mt")
    y += 95

    # "10.000 kr blev til"
    start_text = format_kr(BASE_INVESTMENT) + " blev til"
    draw.text((WIDTH // 2, y), start_text, fill=GRAY, font=font_medium, anchor="mt")
    y += 75

    # HUGE final amount in emerald
    final_text = format_kr(final_amount)
    draw.text((WIDTH // 2, y), final_text, fill=EMERALD, font=font_huge, anchor="mt")
    y += 140

    # Period text
    draw.text((WIDTH // 2, y), period_text, fill=GRAY, font=font_small, anchor="mt")

    # Brand at bottom
    brand_y = HEIGHT - 70
    draw.text((WIDTH // 2, brand_y), "tiderpenge.dk", fill=GRAY, font=font_brand, anchor="mt")

    # Save
    out_path = OUTPUT_DIR / f"{slug}.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"  {name}: {final_text} {period_text}")


def generate_homepage_image() -> None:
    """Generate generic OG image for homepage"""
    img = create_gradient_bg()
    draw = ImageDraw.Draw(img)

    font_huge = load_font(90, bold=True)
    font_large = load_font(58, bold=False)
    font_medium = load_font(44, bold=False)
    font_small = load_font(32, bold=False)

    y = 140

    # Main headline
    draw.text((WIDTH // 2, y), "Tid er penge", fill=WHITE, font=font_huge, anchor="mt")
    y += 120

    # Subtitle in emerald
    draw.text((WIDTH // 2, y), "Hvad hvis du havde investeret?",
              fill=EMERALD, font=font_large, anchor="mt")
    y += 90

    # Description
    draw.text((WIDTH // 2, y), "Se hvad dine penge kunne være blevet til",
              fill=GRAY, font=font_medium, anchor="mt")
    y += 70

    # Examples
    draw.text((WIDTH // 2, y), "Novo Nordisk • Apple • NVIDIA • Amazon",
              fill=GRAY, font=font_small, anchor="mt")

    # Brand
    draw.text((WIDTH // 2, HEIGHT - 70), "tiderpenge.dk", fill=GRAY, font=font_small, anchor="mt")

    # Save
    out_path = BASE_DIR / "public" / "og-image.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"  Homepage: {out_path.name}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generating OG images with shocking return numbers...\n")

    for stock in STOCKS:
        generate_stock_image(stock)

    print()
    generate_homepage_image()
    print("\nDone!")


if __name__ == "__main__":
    main()
