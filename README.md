# QSage

The QSage website: a home page and an interactive quantum computing course, written by **Sai Ganesh Chidambaram**.

| Page | What it is |
| --- | --- |
| `index.html` | **Home** — the landing page, with the animated 3D quantum computer, course structure, founder and FAQ |
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
| `course/qs-ui.css` | QSage navigation, overview, module pages, lesson layout and the quiz |
| `course/body.html` | Page shell: top bar, side panel, footer, mobile drawer |
| `course/src/01-engine.js`, `07-…`, `15-…` | Simulation engine, drawing and UI helpers |
| `course/src/02`–`43` | Lessons, labs, quiz questions and glossary (`42` superconducting circuits, `43` circuit QED) |
| `course/src/99-app.js` | Modules, routing, overview, module and lesson pages, quiz, glossary |

Each lesson's `n` field is only a sort key within its module; lessons are renumbered when the page loads. Cross-references are written as `[[L:lesson-id]]`.

© 2026 QSage · Course written by Sai Ganesh Chidambaram
