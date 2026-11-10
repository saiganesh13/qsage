# QMount

The QMount website: a home page and an interactive quantum computing course, written by **Sai Ganesh Chidambaram**.

| Page | What it is |
| --- | --- |
| `index.html` | **Home** — the landing page, with the animated 3D quantum computer, course structure, author and FAQ |
| `learn.html` | **Learn** — the course: 14 modules in four parts, 141 lessons, 226 live labs and 1,410 questions with explained answers |

Both pages share the same navigation (Home · Learn) and the same dark and light themes. The visitor's theme choice is remembered between the two pages.

## How the Learn page is organised

- **Overview** (`learn.html`): every module as a card, with progress and a "continue where you left off" button.
- **Module page** (`learn.html#module/3`): the module's lessons as a step list, with time, labs and best quiz score for each.
- **Lesson page** (`learn.html#<lesson-id>`): the lesson, its live labs, key ideas and a ten-question check. A side panel lists the module's lessons; on phones it opens from the module bar.
- **The check**: one question at a time, an optional box for the learner's own reasoning, then the explanation shown next to their notes. Scoring 7 of 10 on the first try completes the lesson. Keys A–D choose an option and Enter checks it.
- **Glossary** (`learn.html#glossary`).

Progress, best scores and reasoning notes are stored only in each visitor's browser.

## View it locally

Open `index.html` in any modern browser. The home page's 3D model loads three.js from cdnjs, so it needs an internet connection; without one, a flat drawing is shown instead.

## Publish with GitHub Pages

1. Push this folder to a GitHub repository.
2. Open **Settings → Pages**, set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, and press **Save**.
3. The site goes live at `https://<your-username>.github.io/<repository-name>/` a minute or two later.

The empty `.nojekyll` file tells GitHub Pages to serve the files as they are.

## Publish on Hostinger (your own domain)

The site is just two files, `index.html` and `learn.html`, plus `.htaccess`. Either way below, first open **hPanel → Websites → your domain** and make sure the free **SSL** certificate is active, then turn on **Force HTTPS** (hPanel → Security → SSL).

**Option A · Upload the files (simplest).** Run `python build.py`, then upload the three files (or `qmount-hostinger.zip`, then **Extract**) to `public_html` with **hPanel → Files → File Manager**. Delete Hostinger's default `default.php` or `index.php` there if present. Repeat the upload whenever the site changes.

**Option B · Deploy from GitHub (updates itself).** In **hPanel → Advanced → Git**, add the repository `https://github.com/saiganesh13/qsage.git`, branch `main`, and leave the install directory empty so it deploys into `public_html` (which must be empty first). Press **Deploy**, then turn on **Auto deployment** and add the webhook URL it shows to the GitHub repository (**Settings → Webhooks → Add webhook**, content type `application/json`). From then on every `git push` updates the domain. `.htaccess` keeps `course/`, the notes and the build script private.

## Publish it with Claude Code

Open this folder in Claude Code and ask it to publish the site to GitHub Pages. `CLAUDE.md` gives it the exact steps: it checks git and the GitHub CLI, confirms the repository name with you, pushes the site and turns on Pages.

## Editing the course

`learn.html` is generated. Edit the files in `course/`, then rebuild:

```bash
python build.py
```

| File | Contents |
| --- | --- |
| `course/qs-tokens.css` | Colours for both themes, fonts |
| `course/lab.css` | Styles for lesson content and labs |
| `course/qs-ui.css` | QMount navigation, overview, module pages, lesson layout and the quiz |
| `course/body.html` | Page shell: top bar, side panel, footer, mobile drawer |
| `course/src/01-engine.js`, `07-…`, `15-…` | Simulation engine, drawing and UI helpers |
| `course/src/02`–`43` | Lessons, labs, quiz questions and glossary (`42` superconducting circuits, `43` circuit QED) |
| `course/src/99-app.js` | Modules, routing, overview, module and lesson pages, quiz, glossary |

Each lesson's `n` field is only a sort key within its module; lessons are renumbered when the page loads. Cross-references are written as `[[L:lesson-id]]`.

© 2026 QMount · Course written by Sai Ganesh Chidambaram
