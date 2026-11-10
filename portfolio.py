"""Make the personal-portfolio version of the site in portfolio-site/.

Usage:  python build.py && python portfolio.py

The portfolio is the same course, presented as Sai Ganesh Chidambaram's personal
quantum computing learning portfolio: no QMount brand, no company wording and no
Buy Me a Coffee card. It is published from its own GitHub repository; portfolio-site/
is a separate git checkout and is ignored by this repository.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "portfolio-site"
NAME = "Sai Ganesh Chidambaram"
TAG = "Quantum computing learning portfolio"


def sub(s, old, new, count=None):
    n = s.count(old)
    if n == 0 or (count is not None and n != count):
        raise SystemExit(f"portfolio.py: expected {count or 'some'} of {old[:70]!r}, found {n}")
    return s.replace(old, new)


BRAND_CSS = """
  /* portfolio brand: full name, shortened on phones */
  .b-short { display: none; }
  @media (max-width: 640px) { .logo .b-long { display: none !important; } .logo .b-short { display: inline !important; white-space: nowrap; font-size: 17px; } }
"""
LOGO = f'<span class="b-long">{NAME}</span><span class="b-short">Sai Ganesh</span>'


def home(s):
    s = sub(s, "<title>QMount · Quantum computing, finally intuitive</title>", f"<title>{TAG} · {NAME}</title>")
    s = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="{NAME}\'s personal quantum computing learning portfolio: fourteen modules from the first qubit to superconducting hardware and fault-tolerant machines, with live labs in every lesson and explained answers to every question.">\n<meta name="author" content="{NAME}">', s, count=1)
    s = sub(s, "</style>", BRAND_CSS + "</style>", 1) if s.count("</style>") == 1 else s.replace("</style>", BRAND_CSS + "</style>", 1)
    s = sub(s, 'aria-label="QMount home"', f'aria-label="{NAME}, home"')
    s = sub(s, "<span>QMount</span>", LOGO, 1)
    s = sub(s, '<span style="font-size:20px">QMount</span>', f'<span style="font-size:20px">{NAME}</span>', 1)
    s = sub(s, '<span class="badge">14 modules · 141 lessons · 226 live labs</span>',
            f'<span class="badge">{TAG} · {NAME}</span>', 1)
    s = sub(s, "<p>A course that follows a quantum computer from room temperature down to ten millikelvin, then into current research. Every lesson has live labs, and every question comes with its reasoning.</p>",
            "<p>I built this to learn quantum computing properly and to share what I learned: fourteen modules that follow a quantum computer from room temperature down to ten millikelvin, then into current research, with 226 live labs and an explained answer to every question.</p>", 1)
    s = sub(s, "The QMount course is organised", "The course is organised", 1)
    s = sub(s, '<span class="eyebrow">About the author</span>', '<span class="eyebrow">About me</span>', 1)
    s = sub(s, '<p class="role">Author of the QMount course · MSc, McGill University</p>',
            '<p class="role">Author of this course · MSc, McGill University</p>', 1)
    s = sub(s, "Who is QMount for?", "Who is this for?", 1)
    # drop the Buy Me a Coffee card and its footer link
    a = s.index("  <!-- ================= SUPPORT ================= -->")
    b = s.index("  <!-- ================= CTA + FOOTER ================= -->")
    s = s[:a] + s[b:]
    a = s.index("  /* ---------- Support (Buy Me a Coffee) ---------- */")
    end = "  @media (prefers-reduced-motion: reduce) { .support-mug .steam path { animation: none; opacity: .7; } }"
    b = s.index(end, a) + len(end) + 1
    s = s[:a] + s[b:]
    s = s.replace("    .path, .card, .founder, .support {", "    .path, .card, .founder {")
    s = sub(s, '<a href="#support">Support</a>', '<a href="#founder">About me</a>', 1)
    s = sub(s, "<small>© 2026 QMount. All rights reserved.</small>", f"<small>© 2026 {NAME}</small>", 1)
    s = sub(s, '<p class="foot-note"><b>Not a business — a contribution.</b> Made so anyone, anywhere, can learn quantum computing.</p>',
            '<p class="foot-note"><b>A personal learning portfolio.</b> Not a company or an organization: made so anyone, anywhere, can learn quantum computing.</p>', 1)
    if "QMount" in s or "buymeacoffee" in s:
        raise SystemExit("portfolio.py: brand or coffee text left in index.html")
    return s


def learn(s):
    s = sub(s, "<title>Learn · QMount</title>", f"<title>Learn · {NAME}</title>")
    s = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="{NAME}\'s quantum computing learning portfolio: an interactive course in fourteen modules and four parts, with live labs and a ten-question check after every lesson.">', s, count=1)
    s = sub(s, '<meta property="og:title" content="Learn quantum computing · QMount">', f'<meta property="og:title" content="Learn quantum computing · {NAME}">')
    s = sub(s, "</style>", BRAND_CSS.replace("640px", "560px") + "</style>", 1) if s.count("</style>") == 1 else s
    s = sub(s, 'aria-label="QMount home"', f'aria-label="{NAME}, home"')
    s = sub(s, "<span>QMount</span>", LOGO, 1)
    s = sub(s, '<span style="font-size:19px">QMount</span>', f'<span style="font-size:19px">{NAME}</span>', 1)
    s = re.sub(r'\s*<a href="https://buymeacoffee\.com/saiganeshcs"[^>]*>Buy me a coffee</a>', "", s, count=1)
    s = sub(s, "<small>Course written by Sai Ganesh Chidambaram · © 2026 QMount</small>", f"<small>© 2026 {NAME}</small>", 1)
    s = sub(s, '<p class="foot-note"><b>Not a business — a contribution.</b> Made so anyone, anywhere, can learn quantum computing.</p>',
            '<p class="foot-note"><b>A personal learning portfolio.</b> Not a company or an organization: made so anyone, anywhere, can learn quantum computing.</p>', 1)
    s = sub(s, "'QMount Learn'", "'Learning portfolio'", 1)
    s = sub(s, "· QMount`", "· Sai Ganesh Chidambaram`", 2)
    s = s.replace("QMount Learn ·", "Course ·").replace("QMount UI uses", "the UI uses")
    if "QMount" in s or "buymeacoffee" in s:
        left = sorted(set(m.group(0) for m in re.finditer(r".{0,30}(QMount|buymeacoffee).{0,30}", s)))
        raise SystemExit("portfolio.py: brand or coffee text left in learn.html: " + repr(left[:5]))
    return s


README = f"""# {NAME} · {TAG}

My personal quantum computing learning portfolio: an interactive course that follows a quantum computer
from room temperature down to ten millikelvin, then into current research.

- **Home:** `index.html`
- **Course:** `learn.html` (14 modules in four parts, 141 lessons, 226 live labs, 1,410 questions with explained answers)

Everything runs in the browser; progress is stored only on the visitor's device.

This repository holds the published pages only. They are generated from the main project with `portfolio.py`.

© 2026 {NAME}
"""


def keys(s):
    # storage keys under neutral names (theme and progress stay separate from the QMount site)
    return s.replace("qmount-", "portfolio-").replace("qsage-", "portfolio-")


def main():
    OUT.mkdir(exist_ok=True)
    (OUT / "index.html").write_text(keys(home((ROOT / "index.html").read_text(encoding="utf-8"))), encoding="utf-8")
    (OUT / "learn.html").write_text(keys(learn((ROOT / "learn.html").read_text(encoding="utf-8"))), encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    (OUT / "README.md").write_text(README, encoding="utf-8")
    print(f"Wrote {OUT} (index.html, learn.html, README.md, .nojekyll)")


if __name__ == "__main__":
    main()
