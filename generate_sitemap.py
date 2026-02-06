"""Generate sitemap.xml and robots.txt for tiderpenge.dk."""

from datetime import date
from pathlib import Path

DOMAIN = "https://tiderpenge.dk"
SLUGS = [
    "novo-nordisk", "dsv", "carlsberg",
    "nvidia", "apple", "microsoft",
    "google", "amazon", "netflix",
]

STATIC_URLS = [
    ("/", "1.0", "weekly"),
    ("/aktier/", "0.8", "weekly"),
    ("/om/", "0.5", "monthly"),
]


def build_url_entry(loc: str, priority: str, changefreq: str, lastmod: str) -> str:
    return f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>"""


def generate_sitemap(output_dir: Path) -> None:
    today = date.today().isoformat()

    entries = [
        build_url_entry(f"{DOMAIN}{path}", priority, changefreq, today)
        for path, priority, changefreq in STATIC_URLS
    ]
    entries.extend(
        build_url_entry(f"{DOMAIN}/aktier/{slug}/", "0.7", "weekly", today)
        for slug in SLUGS
    )

    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(entries)}
</urlset>
"""

    path = output_dir / "sitemap.xml"
    path.write_text(sitemap)
    print(f"Generated {path} ({len(entries)} URLs)")


def generate_robots(output_dir: Path) -> None:
    content = f"""User-agent: *
Allow: /

Sitemap: {DOMAIN}/sitemap.xml
"""
    path = output_dir / "robots.txt"
    path.write_text(content)
    print(f"Generated {path}")


if __name__ == "__main__":
    output_dir = Path(__file__).parent / "public"
    output_dir.mkdir(exist_ok=True)

    generate_sitemap(output_dir)
    generate_robots(output_dir)
