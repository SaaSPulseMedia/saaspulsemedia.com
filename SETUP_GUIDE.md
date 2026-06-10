# SaaS Pulse Media — Complete Setup Guide
## From Zero to Fully Automated Blog in One Afternoon

---

## What You're Building

```
saaspulsemedia.com
       │
       ▼
  Netlify (free hosting)
       │
       ▼
  GitHub repo (SaasPulseMedia/saaspulsemedia.com)
       │        ▲
       │        │ QYREN pushes new posts.json
       ▼        │
  QYREN Publisher (runs in your browser)
       │
       ▼
  Social posts → Buffer/Typefully → X + LinkedIn
```

Every time QYREN writes an article and clicks Publish, it updates your GitHub repo. Netlify detects the change and rebuilds your site in ~90 seconds. The article is live. You did nothing.

---

## STEP 1 — Upload Files to GitHub

### 1a. Create the repository

1. Go to **github.com** and sign in to your **SaasPulseMedia** account
2. Click the **+** button (top right) → **New repository**
3. Name it exactly: `saaspulsemedia.com`
4. Set it to **Public**
5. Leave everything else unchecked
6. Click **Create repository**

### 1b. Upload the site files

You have two options:

**Option A — GitHub web interface (easiest, no terminal needed):**

1. In your new empty repo, click **uploading an existing file**
2. Open the `saaspulse` folder on your computer
3. Drag ALL files and folders into the GitHub upload area:
   - `netlify.toml`
   - `site/` folder (with index.html, blog.html, style.css, etc.)
   - `site/data/posts.json`
   - `admin/` folder (with index.html and config.yml)
4. Scroll down, write a commit message: `Initial site upload`
5. Click **Commit changes**

**Option B — GitHub Desktop (if you have it):**
1. Clone the repo to your computer
2. Copy all files into the cloned folder
3. Commit and push

### 1c. Verify your repo structure looks like this:

```
saaspulsemedia.com/
├── netlify.toml
├── admin/
│   ├── index.html
│   └── config.yml
└── site/
    ├── index.html
    ├── blog.html
    ├── style.css
    ├── comparisons.html
    ├── contact.html
    ├── privacy.html
    ├── data/
    │   └── posts.json
    └── images/
        └── (empty for now)
```

---

## STEP 2 — Connect to Netlify

### 2a. Create your Netlify account

1. Go to **netlify.com**
2. Click **Sign up** → choose **Sign up with GitHub**
3. Authorise Netlify to access your GitHub account

### 2b. Deploy the site

1. From the Netlify dashboard, click **Add new site** → **Import an existing project**
2. Choose **GitHub**
3. Find and select **SaasPulseMedia/saaspulsemedia.com**
4. Netlify will auto-detect the settings from `netlify.toml`:
   - **Build command:** (leave blank)
   - **Publish directory:** `site`
5. Click **Deploy site**
6. Wait ~30 seconds. Netlify gives you a URL like `https://random-name-123.netlify.app`

Your site is now live on that URL. ✓

### 2c. Test it

Open the Netlify URL in your browser. You should see the SaaS Pulse Media homepage with sample articles.

---

## STEP 3 — Connect Your Domain

### 3a. Add your domain in Netlify

1. In your Netlify site dashboard, go to **Domain management**
2. Click **Add a domain**
3. Type: `saaspulsemedia.com`
4. Click **Verify** → **Add domain**
5. Netlify shows you two DNS values — note them down, you need them in the next step

### 3b. Update DNS at your registrar

You need to log into wherever `saaspulsemedia.com` is registered (GoDaddy, Namecheap, Cloudflare, etc.) and update two records:

**Find out where your domain is registered:**
- Go to **whois.domaintools.com**
- Type `saaspulsemedia.com`
- Look for "Registrar" — that's where you log in

**Once logged into your registrar:**

1. Find **DNS Settings** or **Manage DNS**
2. Look for an **A record** pointing to your old host — delete it
3. Add a new **A record**:
   - Name/Host: `@`
   - Value/Points to: `75.2.60.5` (Netlify's IP)
   - TTL: 3600 (or Auto)
4. Add a **CNAME record**:
   - Name/Host: `www`
   - Value/Points to: your Netlify subdomain (e.g. `random-name-123.netlify.app`)
   - TTL: 3600

Save changes. DNS takes **up to 24 hours** to propagate (usually 1–2 hours).

### 3c. Enable HTTPS (free SSL)

Back in Netlify → Domain management → scroll to **HTTPS** → click **Verify DNS configuration** → **Provision certificate**. Netlify handles the SSL certificate automatically for free.

Once done, `https://saaspulsemedia.com` will show your new site. ✓

---

## STEP 4 — Set Up the Blog Admin Panel (Decap CMS)

This gives you a visual editor to manage posts if you ever want to edit manually.

### 4a. Enable Netlify Identity

1. In Netlify dashboard → **Identity** tab
2. Click **Enable Identity**
3. Under **Registration**, set to **Invite only**
4. Under **External providers**, enable **GitHub**

### 4b. Enable Git Gateway

1. In Netlify → **Identity** → scroll to **Services**
2. Click **Enable Git Gateway**

### 4c. Invite yourself

1. In Identity → **Invite users**
2. Enter your email address
3. You'll get an email — accept the invite, set a password

### 4d. Access the admin panel

Go to: `https://saaspulsemedia.com/admin/`

Log in with your email and password. You now have a full CMS editor where you can write, edit, and manage posts visually — no code needed.

---

## STEP 5 — Set Up QYREN Publisher

QYREN is the `qyren_publisher.html` file. Open it in your browser — it runs locally, no server needed.

### 5a. Get your Anthropic API key

1. Go to **console.anthropic.com**
2. Sign in (or create an account)
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-`)

### 5b. Get a GitHub Personal Access Token

This allows QYREN to push articles directly to your repo.

1. Go to **github.com** → your profile → **Settings**
2. Scroll to **Developer settings** (bottom left)
3. **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token (classic)**
5. Name it: `QYREN Publisher`
6. Set expiration: **No expiration** (or 1 year)
7. Check these permissions:
   - ✓ `repo` (all repo permissions)
8. Click **Generate token**
9. **Copy the token immediately** — you won't see it again

### 5c. Configure QYREN

1. Open `qyren_publisher.html` in your browser
2. Click **Settings** in the sidebar
3. Paste your **Anthropic API key**
4. Paste your **GitHub token**
5. Set repo to: `SaasPulseMedia/saaspulsemedia.com`
6. Click **Save Keys**

Both status dots in the sidebar should turn green. ✓

---

## STEP 6 — Run Your First Publish Cycle

1. In QYREN Publisher → **Dashboard**
2. Click **▶ Full Publish Cycle**
3. Watch the phases run: TRENDS → TOPIC → WRITE → SEO → SOCIAL → PUBLISH
4. After ~2–3 minutes, your article is written and pushed to GitHub
5. Netlify auto-deploys within 90 seconds
6. Your article is live at `https://saaspulsemedia.com`

---

## STEP 7 — Automate Social Posting

### Option A — Zapier (recommended, free tier works)

1. Go to **zapier.com** → Create a free account
2. Create a new Zap:
   - **Trigger:** GitHub → New or updated file in repository
   - Repository: `SaasPulseMedia/saaspulsemedia.com`
   - File path filter: `site/data/posts.json`
3. **Action 1:** Twitter/X → Create Tweet
   - Use the `twitter_single` text from QYREN's Social tab
4. **Action 2:** LinkedIn → Create Share Update

**Note:** You'll need to copy social post text into Zapier manually the first few times, or use Zapier's formatter to parse the JSON.

### Option B — Buffer (simplest)

1. Create a free **Buffer** account at buffer.com
2. Connect your X and LinkedIn accounts
3. After each QYREN publish cycle, go to QYREN → **Social Posts** tab
4. Copy the X thread and LinkedIn post
5. Paste into Buffer and schedule

This takes 2 minutes per article and gives you full control over timing.

### Option C — Typefully (best for X threads)

1. Go to **typefully.com** → free account
2. Connect your X account
3. Copy QYREN's thread from the Social tab
4. Paste into Typefully — it formats the thread automatically
5. Schedule or post immediately

---

## STEP 8 — Set Your Publishing Schedule

In QYREN → **Schedule** tab:

Add two recurring slots (to match your existing twice-weekly cadence):

| Day | Category | Frequency |
|---|---|---|
| Tuesday | SaaS Tool Reviews | Weekly |
| Friday | SEO Tools or CRM | Weekly |

Each time you run a Full Publish Cycle, QYREN picks the most relevant current topic from SaaS news and writes for that category.

**To run on a schedule automatically:**
- Open `qyren_publisher.html` in your browser
- Enable **Auto Mode** (if available) — or simply open it twice a week and click Full Publish Cycle
- The whole cycle takes ~3 minutes

---

## STEP 9 — Migrate Old Content from Abacus

Once Abacus gives you a content export:

1. Open the exported file (JSON, CSV, or Markdown)
2. Convert each article to match this format in `posts.json`:

```json
{
  "slug": "url-friendly-title",
  "title": "Article Title",
  "category": "SEO Tools",
  "date": "2025-01-15T08:00:00Z",
  "description": "Meta description (150 chars)",
  "author": "SaaS Pulse Media",
  "tags": ["tag1", "tag2"],
  "key_insight": "One key takeaway",
  "body": "Full article text here..."
}
```

3. Add all old articles to `site/data/posts.json` (they go in the array)
4. Commit and push to GitHub
5. Netlify redeploys — all old content is live on your new site

---

## Ongoing Maintenance Checklist

**Twice a week (3 minutes each):**
- [ ] Open `qyren_publisher.html`
- [ ] Click **▶ Full Publish Cycle**
- [ ] Copy social posts to Buffer or Typefully
- [ ] Done

**Monthly (10 minutes):**
- [ ] Check Netlify analytics for top pages
- [ ] Update any comparison scores that are outdated
- [ ] Check that RSS feeds are still active in QYREN

**Occasionally:**
- [ ] Request content export from Abacus and migrate remaining posts
- [ ] Update affiliate links if tools change pricing

---

## Troubleshooting

**"Site not loading after domain change"**
→ DNS takes up to 24 hours. Check propagation at dnschecker.org

**"QYREN API error"**
→ Check your API key in Settings. Make sure you have Anthropic credits.

**"GitHub push failed"**
→ Check your Personal Access Token hasn't expired. Regenerate if needed.

**"Admin panel won't load"**
→ Make sure Netlify Identity and Git Gateway are both enabled (Step 4).

**"Posts not appearing on site"**
→ Check the `site/data/posts.json` file in GitHub. Each post needs a valid `slug` and `date`.

---

## Cost Summary

| Service | Cost |
|---|---|
| Netlify hosting | Free |
| GitHub | Free |
| Anthropic API (2 articles/week) | ~$1–3/month |
| Domain renewal | ~$12/year |
| Buffer free tier | Free |
| **Total** | **~$1–3/month** |

---

## You're Done

Your new stack:
- ✓ Site hosted on Netlify at `saaspulsemedia.com`
- ✓ You own all the code, content, and data
- ✓ QYREN writes and publishes articles automatically
- ✓ Social posts generated for every article
- ✓ No dependency on Abacus or any other platform
- ✓ Running cost: ~$2/month

Questions? Everything is in the files. Nothing requires a developer to maintain.
