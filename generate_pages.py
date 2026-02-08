"""Generate HTML pages for tiderpenge.dk multi-page Vite site."""

from __future__ import annotations

from pathlib import Path
from textwrap import dedent

PROJECT_ROOT = Path(__file__).parent
DOMAIN = "https://tiderpenge.dk"

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


def head(
    *,
    title: str,
    description: str,
    canonical: str,
    og_image: str | None = None,
    json_ld: str | None = None,
) -> str:
    og_img_tag = (
        f'    <meta property="og:image" content="{og_image}">'
        if og_image
        else ""
    )
    json_ld_block = (
        dedent(f"""\
    <script type="application/ld+json">
    {json_ld}
    </script>""")
        if json_ld
        else ""
    )

    return dedent(f"""\
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{description}">
    <link rel="canonical" href="{canonical}">

    <!-- Open Graph -->
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical}">
{og_img_tag}

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    <!-- Analytics -->
    <script defer data-domain="tiderpenge.dk" src="https://plausible.io/js/script.js"></script>
{json_ld_block}
</head>""")


def page_header() -> str:
    return dedent("""\
    <header class="text-center mb-8 sm:mb-12">
      <a href="/" aria-label="Hjem"><img src="/assets/logo.svg" alt="Tid er Penge" class="h-16 sm:h-20 mx-auto mb-6"></a>
    </header>""")


def footer() -> str:
    return dedent("""\
    <footer class="text-center text-sm mt-16 pt-8 border-t border-white/5">
      <nav class="flex justify-center gap-6 mb-6 text-xs">
        <a href="/" class="text-gray-500 hover:text-emerald-400 transition-colors">Hjem</a>
        <a href="/aktier/" class="text-gray-500 hover:text-emerald-400 transition-colors">Alle aktier</a>
        <a href="/om/" class="text-gray-500 hover:text-emerald-400 transition-colors">Om</a>
      </nav>
      <p class="text-gray-600">Data er kun til uddannelsesform\u00e5l. Tidligere afkast garanterer ikke fremtidige resultater.</p>
      <p class="text-gray-600 mt-2">Aktiedata opdateres ugentligt.</p>
    </footer>""")


def body_wrap(inner: str, script: str) -> str:
    return dedent(f"""\
<body class="min-h-screen min-h-dvh bg-dark-gradient font-sans antialiased text-gray-100">
  <div class="progress-bar" id="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
  <div class="mx-auto max-w-2xl lg:max-w-3xl px-4 pt-6 pb-8 sm:pt-12 sm:pb-16 safe-area-padding">
{page_header()}

{inner}

{footer()}
  </div>
  <script type="module" src="{script}"></script>
</body>
</html>""")


def generate_stock_page(stock: dict[str, str]) -> str:
    ticker = stock["ticker"]
    name = stock["name"]
    slug = stock["slug"]

    title = f"Hvad hvis du havde investeret i {name}? | Tid er Penge"
    description = f"Se hvad dine penge kunne v\u00e6re vokset til med {name} ({ticker}). Beregn historisk afkast."
    canonical = f"{DOMAIN}/aktier/{slug}/"
    og_image = f"{DOMAIN}/og/{slug}.png"

    json_ld = (
        "{\n"
        f'      "@context": "https://schema.org",\n'
        f'      "@type": "WebPage",\n'
        f'      "name": "{title}",\n'
        f'      "description": "{description}",\n'
        f'      "url": "{canonical}"\n'
        "    }"
    )

    inner = dedent(f"""\
    <!-- Hero -->
    <div class="text-center mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold mb-3"><span class="gradient-text">Hvad hvis du havde investeret i {name}?</span></h1>
      <p class="text-gray-400 text-lg">Se hvad dine penge kunne v\u00e6re vokset til</p>
    </div>

    <!-- Stats Grid (rendered by JS) -->
    <div id="stock-stats" class="mb-8"></div>

    <!-- Embedded Calculator -->
    <main class="journey-container glass-card rounded-3xl p-6 sm:p-8 mb-8 glow-hover" id="journey-container" data-ticker="{ticker}">
    </main>""")

    return (
        head(
            title=title,
            description=description,
            canonical=canonical,
            og_image=og_image,
            json_ld=json_ld,
        )
        + "\n"
        + body_wrap(inner, "/src/pages/stock.ts")
    )


def generate_overview_page() -> str:
    title = "Hvilken aktie ville have givet dig mest? | Tid er Penge"
    description = "Sammenlign historiske afkast for 9 popul\u00e6re aktier. Find ud af hvilken investering der ville have gjort dig rigest."
    canonical = f"{DOMAIN}/aktier/"

    inner = dedent("""\
    <div class="text-center mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold mb-3"><span class="gradient-text">Hvilken aktie ville have givet dig mest?</span></h1>
      <p class="text-gray-400 text-lg">Sammenlign historiske afkast</p>
    </div>
    <main id="overview-grid" class="mb-8"></main>""")

    return (
        head(title=title, description=description, canonical=canonical)
        + "\n"
        + body_wrap(inner, "/src/pages/overview.ts")
    )


def generate_about_page() -> str:
    title = "Om Tid er Penge"
    description = "L\u00e6r mere om tiderpenge.dk - den gratis investeringsberegner der viser hvad tid g\u00f8r ved dine penge."
    canonical = f"{DOMAIN}/om/"

    inner = dedent("""\
    <main class="glass-card rounded-3xl p-6 sm:p-8 mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold mb-6"><span class="gradient-text">Om Tid er Penge</span></h1>

      <div class="space-y-6 text-gray-300">
        <section>
          <h2 class="text-lg font-semibold text-white mb-2">Hvad er Tid er Penge?</h2>
          <p>Tid er Penge er en gratis investeringsberegner, der viser dig hvad dine penge kunne v\u00e6re vokset til, hvis du havde investeret i udvalgte aktier. Form\u00e5let er at illustrere kraften i langsigtet investering \u2014 og hvad tid g\u00f8r ved dine penge.</p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">Data og opdateringer</h2>
          <p>Aktiedata hentes fra Yahoo Finance og opdateres automatisk hver uge via GitHub Actions. Beregningerne er baseret p\u00e5 historiske lukkepriser og inkluderer ikke handelsomkostninger, skat eller inflation.</p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">Affiliate-samarbejde</h2>
          <p>Tid er Penge indeholder affiliate-links til eToro. Det betyder, at vi kan modtage en kommission hvis du opretter en konto via vores links. Dette p\u00e5virker ikke beregningerne eller indholdet p\u00e5 siden. 51% af private CFD-konti taber penge.</p>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-white mb-2">Ansvarsfraskrivelse</h2>
          <p>Indholdet p\u00e5 denne side er kun til uddannelsesform\u00e5l og udg\u00f8r ikke investeringsr\u00e5dgivning. Tidligere afkast er ingen garanti for fremtidige resultater. Investering indeb\u00e6rer risiko, og du kan miste hele eller dele af dit investerede bel\u00f8b. S\u00f8g altid professionel r\u00e5dgivning f\u00f8r du investerer.</p>
        </section>
      </div>
    </main>""")

    return (
        head(title=title, description=description, canonical=canonical)
        + "\n"
        + body_wrap(inner, "/src/pages/about.ts")
    )


def write_page(path: Path, html: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")
    print(f"  {path.relative_to(PROJECT_ROOT)}")


def main() -> None:
    print("Generating pages for tiderpenge.dk\n")

    # Stock pages
    print("Stock pages:")
    for stock in STOCKS:
        out = PROJECT_ROOT / "aktier" / stock["slug"] / "index.html"
        write_page(out, generate_stock_page(stock))

    # Overview page
    print("\nOverview page:")
    write_page(PROJECT_ROOT / "aktier" / "index.html", generate_overview_page())

    # About page
    print("\nAbout page:")
    write_page(PROJECT_ROOT / "om" / "index.html", generate_about_page())

    total = len(STOCKS) + 2
    print(f"\nDone — {total} pages generated.")


if __name__ == "__main__":
    main()
