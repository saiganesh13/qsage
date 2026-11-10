"""Build learn.html (the QSage course) from the files in course/.

Usage:  python build.py

The course is plain HTML, CSS and JavaScript with no dependencies.
Edit the lesson files in course/src/ (or the styles in course/*.css),
run this script, and commit the regenerated learn.html.
Scripts are concatenated in filename order, so keep the numeric prefixes.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COURSE = ROOT / "course"
SRC = COURSE / "src"

FAVICON = (
    "data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='%23E8590C' stroke-width='2.2'%3E"
    "%3Ccircle cx='16' cy='16' r='11'/%3E%3Cellipse cx='16' cy='16' rx='11' ry='4.2'/%3E"
    "%3Cpath d='M16 5v11l6.5-5.5' stroke-linecap='round'/%3E%3C/svg%3E"
)

THEME_INIT = """<script>
(function () {
  var t = null;
  try { t = localStorage.getItem('qsage-theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();
</script>"""

FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700'
    '&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600'
    '&family=Noto+Sans+Math&family=STIX+Two+Text:ital,wght@0,400..700;1,400..700&display=swap">'
)


def build() -> Path:
    css = "\n".join((COURSE / name).read_text(encoding="utf-8") for name in ("qs-tokens.css", "lab.css", "qs-ui.css"))
    body = (COURSE / "body.html").read_text(encoding="utf-8")
    scripts = "\n".join(p.read_text(encoding="utf-8") for p in sorted(SRC.glob("*.js")))
    page = f"""<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Learn · QSage</title>
<meta name="description" content="QSage Learn: an interactive quantum computing course in fourteen modules and four parts, with live labs and a ten-question check after every lesson.">
<meta name="author" content="Sai Ganesh Chidambaram">
<meta property="og:title" content="Learn quantum computing · QSage">
<meta property="og:description" content="Fourteen modules from the first qubit to superconducting hardware and fault-tolerant machines, with live labs and explained answers.">
<meta property="og:type" content="website">
<link rel="icon" href="{FAVICON}">
{THEME_INIT}
{FONTS}
<style>
{css}
</style>
</head>
<body>
{body.strip()}
<script>
{scripts}
</script>
</body>
</html>
"""
    out = ROOT / "learn.html"
    out.write_text(page, encoding="utf-8")
    return out


if __name__ == "__main__":
    path = build()
    print(f"Wrote {path} ({path.stat().st_size:,} bytes)")
