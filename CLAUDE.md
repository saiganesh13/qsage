# QMount website — notes for Claude Code

This folder is the QMount website: a static site with no server code and no dependencies to install.

- `index.html` — **Home**, the landing page (3D quantum computer via three.js from cdnjs, author section, FAQ). Hand-edited, not generated.
- `learn.html` — **Learn**, the course (14 modules in four parts, 141 lessons, 226 labs, 1,410 questions). **Generated** — never edit it directly.
- `course/` — the sources for `learn.html`: `qs-tokens.css`, `lab.css`, `qs-ui.css`, `body.html`, and the lesson/engine/app scripts in `course/src/` (concatenated in filename order).
- `build.py` — rebuilds `learn.html` from `course/`. Run `python build.py` (on Windows, `py build.py` may be needed).
- `.nojekyll` — tells GitHub Pages to serve the files as they are.

Both pages share the nav (Home · Learn) and the dark / light themes (stored in `localStorage` under `qmount-theme`). Course progress is stored under `qmount-progress-v1`.

## Task: publish this site on GitHub Pages

When the user asks to put the site on GitHub or publish it, do this:

1. **Check the tools.** Run `git --version`, `gh --version` and `gh auth status`.
   - If `gh` (GitHub CLI) is missing, tell the user and ask before installing it (Windows: `winget install --id GitHub.cli`; macOS: `brew install gh`). After installing, a new terminal may be needed.
   - If `gh` is not logged in, ask the user to run `gh auth login` themselves (it is interactive and opens a browser). Do not handle their password or tokens.
2. **Confirm with the user** before creating anything: the repository name (default `qmount`) and that it will be **public** (GitHub Pages is free only for public repositories on free accounts).
3. **Rebuild** so `learn.html` matches the sources: `python build.py`.
4. **Create the repository and push:**
   ```bash
   git init -b main
   git add -A
   git commit -m "QMount website"
   gh repo create <name> --public --source=. --remote=origin --push
   ```
   If the folder is already a git repository with a remote, just commit and `git push` instead.
5. **Turn on GitHub Pages** (deploy from the `main` branch, root folder):
   ```bash
   gh api -X POST repos/{owner}/<name>/pages -f "source[branch]=main" -f "source[path]=/"
   ```
   If it answers that Pages already exists (HTTP 409), update it instead with `gh api -X PUT repos/{owner}/<name>/pages -f "source[branch]=main" -f "source[path]=/"`.
   (`{owner}` is filled in by `gh` from the current repository.)
6. **Wait for the first build** (usually one to two minutes): `gh api repos/{owner}/<name>/pages/builds/latest --jq .status` until it says `built`.
7. **Report the address**: `gh api repos/{owner}/<name>/pages --jq .html_url` — normally `https://<username>.github.io/<name>/`. Open it and check that Home loads, the Learn link opens the course, and the theme toggle works.

## Task: update the live site later

1. Edit `index.html`, or the files in `course/` for the course.
2. If anything in `course/` changed, run `python build.py`.
3. `git add -A`, `git commit -m "<what changed>"`, `git push`. GitHub Pages redeploys automatically.

## Task: publish on Hostinger

The user hosts QMount on their own domain with Hostinger. Claude cannot log in to hPanel; the user does those steps (see README, "Publish on Hostinger").

- **If Hostinger deploys from GitHub (hPanel → Git, auto deployment):** rebuild, commit and push as in "update the live site later"; the domain updates by itself.
- **If the user uploads files by hand:** run `python build.py`, then rebuild the upload bundle and tell the user to upload it to `public_html` and extract it:
  ```bash
  python -c "import zipfile; z=zipfile.ZipFile('qmount-hostinger.zip','w',zipfile.ZIP_DEFLATED); [z.write(f) for f in ('index.html','learn.html','.htaccess')]; z.close()"
  ```
  `qmount-hostinger.zip` is git-ignored; never commit it.
- `.htaccess` must stay at the site root: it blocks `course/`, `.md`, `.py` and `.git` paths when the whole repository is deployed.

## Rules

- Never edit `learn.html` by hand; change `course/` and rebuild.
- Lesson cross-references are written `[[L:lesson-id]]`; a lesson's `n` field is only a sort key within its module.
- Keep the site self-contained: plain HTML, CSS and JavaScript, no frameworks or build tools beyond `build.py`.
- Do not commit anything other than the website files (no credentials, no `.env` files).
