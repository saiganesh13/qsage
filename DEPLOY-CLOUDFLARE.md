# Deploy QMount on Cloudflare Pages with the qmount.org domain

This guide is written so that either a person or Claude Code can follow it from start to finish.
If you are Claude Code: read `CLAUDE.md` first, then work through the steps below with the user.
The user signs in to every account themselves; never type passwords, create accounts, or approve
OAuth screens on their behalf, and ask before saving the nameserver change in step 4.

---

## Where things stand (handoff snapshot)

| Item | State |
| --- | --- |
| Website | QMount: `index.html` (home) and `learn.html` (course, 14 modules, 141 lessons). Both are finished and self-contained. |
| Source code | GitHub repository `https://github.com/saiganesh13/qsage` (public, branch `main`). This zip contains the same files. |
| Current live copy | GitHub Pages: `https://saiganesh13.github.io/qsage/` |
| Domain | `qmount.org`, registered at **Hostinger**. There is **no Hostinger hosting plan**, and none is needed. |
| Domain DNS today | Hostinger's nameservers (`byte.dns-parking.com`, `pixel.dns-parking.com`). No working records yet. |
| Goal | Host the site on **Cloudflare Pages** (free) and serve it at `https://qmount.org` and `https://www.qmount.org`. |

The deployed site is only two files, `index.html` and `learn.html`. Everything else (`course/`, `build.py`,
notes) is source and must **not** be published. The build settings below take care of that.

---

## Step 1 · Cloudflare account

1. Go to `https://dash.cloudflare.com/sign-up` (or sign in at `https://dash.cloudflare.com`).
2. The user creates or signs in to the account and verifies the email address.

## Step 2 · Create the Pages project

There are two ways. **Option A is recommended**: every `git push` then updates the site automatically.

### Option A · From GitHub (automatic updates)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**.
2. Choose **GitHub**. GitHub asks the user to **Authorize Cloudflare** and to choose which repositories it may
   read. The user approves this; select **Only select repositories → qsage** (or the user's own copy, see the note below).
3. Pick the repository and click **Begin setup**, then enter exactly:

   | Setting | Value |
   | --- | --- |
   | Project name | `qmount` (gives the address `qmount.pages.dev`) |
   | Production branch | `main` |
   | Framework preset | `None` |
   | Build command | `mkdir -p dist && cp index.html learn.html dist/` |
   | Build output directory | `dist` |
   | Root directory | *(leave empty)* |

4. Click **Save and Deploy**. After about a minute the site is live at `https://qmount.pages.dev`.
   Open it and check that the home page loads and **Learn** opens the course.

> **If the user uses a different GitHub account** than `saiganesh13`: either sign in to GitHub as `saiganesh13`
> when authorizing, or create a new repository under their own account and push this folder to it
> (`git init -b main && git add -A && git commit -m "QMount website" && gh repo create qmount --public --source=. --push`),
> then connect that repository instead.

### Option B · Direct upload (no GitHub needed)

1. **Workers & Pages** → **Create** → **Pages** tab → **Upload assets**.
2. Project name `qmount` → **Create project**.
3. Drag in the folder **`site/`** from this zip (it contains only `index.html` and `learn.html`) → **Deploy site**.
4. To update later: rebuild (`python build.py`), copy `index.html` and `learn.html` into `site/`, and upload a new deployment.

## Step 3 · Add qmount.org to Cloudflare

1. Cloudflare dashboard (account home) → **Add a domain** (sometimes shown as **Add a site**).
2. Enter `qmount.org`, keep **Quick scan for DNS records**, continue, and choose the **Free** plan.
3. On the DNS records review screen, **delete** any `A`, `AAAA` or `CNAME` records named `qmount.org` (`@`) or `www`
   that point to Hostinger parking IPs. They would conflict with Pages. Leave MX/TXT records alone if any exist.
4. Continue. Cloudflare now shows **two nameservers**, for example `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`.
   Copy both exactly; they are different for every account.

## Step 4 · Point the domain at Cloudflare (in Hostinger)

1. Go to `https://hpanel.hostinger.com` → left bar **Domains** → **qmount.org** → **DNS / Nameservers**.
2. Open the **DNSSEC** tab. If DNSSEC is enabled, disable it first (it breaks the move to Cloudflare).
3. Find **Change nameservers** (on the DNS / Nameservers page) → choose **Change nameservers / Use custom nameservers**.
4. Replace `byte.dns-parking.com` and `pixel.dns-parking.com` with the **two Cloudflare nameservers** from step 3.
   Remove any extra nameserver fields so only the two Cloudflare ones remain.
5. **Save** (Claude: ask the user before pressing Save).
6. Back in Cloudflare, click **Check nameservers now**. Activation usually takes 10 minutes to a few hours;
   Cloudflare emails when `qmount.org` is **Active**. You can check from a terminal:
   `nslookup -type=NS qmount.org 1.1.1.1` should list the Cloudflare nameservers.

> If Hostinger shows "Domain verification required" or the domain is not yet active, the user must first confirm
> the verification email Hostinger sent when the domain was bought. Nameserver changes do not take effect until then.

## Step 5 · Attach the domain to the Pages project

Do this once the domain shows **Active** in Cloudflare (it can be started earlier; it finishes once active).

1. **Workers & Pages** → **qmount** → **Custom domains** → **Set up a custom domain**.
2. Enter `qmount.org` → **Continue** → **Activate domain**. Cloudflare creates the DNS record itself.
3. Repeat for `www.qmount.org`.
4. Wait until both show **Active** with an SSL certificate (usually a few minutes).

## Step 6 · HTTPS and the www redirect (recommended)

1. Cloudflare → **qmount.org** → **SSL/TLS** → **Edge Certificates** → turn on **Always Use HTTPS**.
2. Optional, to send `www` to the bare domain: **Rules** → **Redirect Rules** → **Create rule** →
   template **Redirect from WWW to root**, or manually: when hostname equals `www.qmount.org`,
   dynamic redirect to `concat("https://qmount.org", http.request.uri.path)`, status 301, preserve query string.

## Step 7 · Check the live site

- `https://qmount.org` shows the QMount home page with the 3D machine.
- `https://qmount.org/learn.html` opens the course; the Part 1–4 bar works; a lesson's labs run.
- The theme button switches dark and light, and the choice carries between pages.
- `https://qmount.org/course/` and `https://qmount.org/README.md` return **404** (the source is not published).
- `https://www.qmount.org` works (or redirects to `https://qmount.org`).

## Step 8 · Retire the old copies

Once qmount.org works, turn off GitHub Pages so there is only one live site
(GitHub repository → **Settings → Pages → Unpublish site**, or `gh api -X DELETE repos/saiganesh13/qsage/pages`).
Ask the user first. The repository itself stays: Cloudflare builds from it.

---

## Updating the site later

1. Edit `index.html`, or the course sources in `course/`.
2. If anything in `course/` changed, run `python build.py` (Windows: `py build.py`) to regenerate `learn.html`.
3. With Option A: `git add -A`, `git commit -m "<what changed>"`, `git push`. Cloudflare redeploys within about a minute.
   With Option B: upload `index.html` and `learn.html` as a new deployment.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Pages build fails with "Output directory not found" | Check the build command and output directory in **Settings → Builds & deployments** match step 2 exactly. |
| Custom domain stuck on "Verifying" | The domain is not active on Cloudflare yet; finish step 4 and wait. Make sure no old `A`/`CNAME` records for `@` or `www` remain in Cloudflare DNS. |
| Cloudflare says nameservers are still Hostinger's | Hostinger has not saved the change, DNSSEC is still on, or the domain is unverified. Recheck step 4. |
| `ERR_TOO_MANY_REDIRECTS` | SSL/TLS mode must be **Full** or **Full (strict)**, not Flexible. Pages works with the default. |
| Old content shows after an update | Hard-refresh (Ctrl+Shift+R); if still old, Cloudflare → **Caching → Purge Everything**. |

## What is in this zip

| Path | What it is |
| --- | --- |
| `DEPLOY-CLOUDFLARE.md` | This guide. |
| `CLAUDE.md` | Notes for Claude Code about the project and how to update it. |
| `README.md` | Project overview and editing guide. |
| `index.html` | Home page (hand-edited). |
| `learn.html` | The course (generated by `build.py`; do not edit by hand). |
| `course/` | Sources for `learn.html`: styles, page shell, lessons, labs, quizzes, app. |
| `build.py` | Rebuilds `learn.html` from `course/`. Needs only Python 3. |
| `site/` | Ready-to-upload copy of just `index.html` and `learn.html`, for Option B. |
| `.htaccess` | Only used by Apache/LiteSpeed hosts such as Hostinger web hosting; Cloudflare ignores it. |
| `.nojekyll` | Only used by GitHub Pages. |
