/**
 * QYREN Auto Publisher — GitHub Actions Script
 * Runs on GitHub's servers every Tuesday and Friday.
 * Writes a SaaS article as a static HTML file directly into the repo.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const REPO = process.env.GITHUB_REPO || 'SaaSPulseMedia/saaspulsemedia.com';
const MANUAL_TOPIC = process.env.MANUAL_TOPIC || '';
const STYLE = 'practical and data-driven';
const ARTICLE_LENGTH = '1000-1400';

const CATEGORY_IMAGES = {
  'SEO Tools': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&q=80',
    'https://images.unsplash.com/photo-1432888622747-4eb9a8f5a07d?w=800&q=80',
  ],
  'CRM': [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
  ],
  'Email Marketing': [
    'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&q=80',
    'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&q=80',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
  ],
  'AI Writing': [
    'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800&q=80',
  ],
  'AI Tools for Business': [
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
    'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&q=80',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
  ],
  'Digital Marketing Tips': [
    'https://images.unsplash.com/photo-1432888622747-4eb9a8f5a07d?w=800&q=80',
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  ],
  'Productivity Guides': [
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
  ],
  'Project Management': [
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
    'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?w=800&q=80',
  ],
  'SaaS Tool Reviews': [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80',
    'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=800&q=80',
  ],
  'SEO Strategies': [
    'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800&q=80',
    'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  ],
};

// Deterministic pick: same slug always gets the same image (no flicker on rebuilds),
// but different articles in the same category get visual variety.
function pickCategoryImage(category, seed) {
  const list = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['SaaS Tool Reviews'];
  if (!seed) return list[0];
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash * 33) ^ seed.charCodeAt(i)) >>> 0;
  }
  return list[hash % list.length];
}

const SEED_TOPICS = [
  { topic: 'Best AI Tools for Small Business in 2026', category: 'AI Tools for Business' },
  { topic: 'HubSpot vs Pipedrive 2026: Which CRM Wins for SMBs?', category: 'CRM' },
  { topic: 'Top Email Marketing Platforms 2026: Ranked by Deliverability', category: 'Email Marketing' },
  { topic: 'Semrush vs Ahrefs 2026: The Definitive SEO Tool Comparison', category: 'SEO Tools' },
  { topic: 'Best Project Management Software for Remote Teams 2026', category: 'Project Management' },
  { topic: 'AI Writing Tools That Actually Save Time in 2026', category: 'AI Writing' },
  { topic: 'How to Build a Content Strategy Using Free SEO Tools in 2026', category: 'SEO Strategies' },
  { topic: 'Notion vs ClickUp 2026: Which Productivity Tool Wins?', category: 'Productivity Guides' },
  { topic: 'Email Automation Workflows That Drive Revenue in 2026', category: 'Email Marketing' },
  { topic: 'The Best CRM for Startups in 2026: A No-Fluff Guide', category: 'CRM' },
  { topic: 'Google Search Console vs Ahrefs: Which Do You Actually Need in 2026?', category: 'SEO Tools' },
  { topic: 'Zapier vs Make in 2026: Automation Platform Comparison', category: 'AI Tools for Business' },
  { topic: 'Best Social Media Management Tools for 2026', category: 'Digital Marketing Tips' },
  { topic: 'ActiveCampaign vs Mailchimp 2026: Full Comparison', category: 'Email Marketing' },
  { topic: 'Salesforce vs HubSpot 2026: Enterprise CRM Showdown', category: 'CRM' },
];

function log(msg) { console.log(`[QYREN] ${msg}`); }

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function apiCall(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function callClaude(system, user, maxTokens = 1400) {
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not set in GitHub secrets');
  const res = await apiCall('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
  }, {
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  if (res.status !== 200) throw new Error(`Claude API error ${res.status}: ${JSON.stringify(res.body)}`);
  return res.body.content[0].text;
}

async function callClaudeJSON(system, user, maxTokens = 1200) {
  const text = await callClaude(
    system + '\n\nCRITICAL: Reply ONLY with valid JSON. No markdown fences, no preamble.',
    user, maxTokens
  );
  let clean = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(clean); } catch(e) {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(e2) {} }
    throw new Error('JSON parse failed: ' + clean.substring(0, 200));
  }
}

function renderMarkdown(md) {
  if (!md) return '<p>Content coming soon.</p>';
  const lines = md.split('\n');
  const out = [];
  let inUl = false, inOl = false;
  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  const fmt = s => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="font-family:monospace;background:#f0ede6;padding:2px 5px;border-radius:3px;font-size:.88em">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const hid = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^### (.+)/.test(line)) {
      closeList(); const t = line.replace(/^### /, '');
      out.push(`<h3 id="${hid(t)}" style="font-family:'Fraunces',Georgia,serif;font-size:1.15rem;font-weight:600;margin:1.8em 0 .6em;color:#0d0f12">${fmt(t)}</h3>`);
    } else if (/^## (.+)/.test(line)) {
      closeList(); const t = line.replace(/^## /, '');
      out.push(`<h2 id="${hid(t)}" style="font-family:'Fraunces',Georgia,serif;font-size:1.45rem;font-weight:600;letter-spacing:-.02em;margin:2.2em 0 .8em;color:#0d0f12">${fmt(t)}</h2>`);
    } else if (/^# (.+)/.test(line)) {
      closeList(); const t = line.replace(/^# /, '');
      out.push(`<h2 id="${hid(t)}" style="font-family:'Fraunces',Georgia,serif;font-size:1.45rem;font-weight:600;margin:2.2em 0 .8em;color:#0d0f12">${fmt(t)}</h2>`);
    } else if (/^> (.+)/.test(line)) {
      closeList();
      out.push(`<blockquote style="border-left:3px solid #0057ff;padding:12px 18px;margin:1.6em 0;background:#f5f4f0;border-radius:0 6px 6px 0;font-style:italic;color:#6b7280">${fmt(line.replace(/^> /, ''))}</blockquote>`);
    } else if (/^[-*] (.+)/.test(line)) {
      if (!inUl) { closeList(); out.push('<ul style="padding-left:1.5em;margin-bottom:1.3em">'); inUl = true; }
      out.push(`<li style="margin-bottom:.5em">${fmt(line.replace(/^[-*] /, ''))}</li>`);
    } else if (/^\d+\. (.+)/.test(line)) {
      if (!inOl) { closeList(); out.push('<ol style="padding-left:1.5em;margin-bottom:1.3em">'); inOl = true; }
      out.push(`<li style="margin-bottom:.5em">${fmt(line.replace(/^\d+\. /, ''))}</li>`);
    } else if (/^---+$/.test(line.trim())) {
      closeList(); out.push('<hr style="border:none;border-top:1px solid #e2dfd8;margin:2em 0">');
    } else if (line.trim() === '') {
      closeList();
    } else if (!inUl && !inOl) {
      out.push(`<p style="margin-bottom:1.4em;line-height:1.8;color:#1e2228">${fmt(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

function buildArticleHtml(post) {
  const slug = post.slug;
  const image = post.image || CATEGORY_IMAGES[post.category] || CATEGORY_IMAGES['SaaS Tool Reviews'];
  const dateStr = post.date ? new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const words = (post.body || '').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(words / 200));
  const tags = (post.tags || []).map(t => `<a href="/blog.html" class="tag">#${esc(t)}</a>`).join('');
  const bodyHtml = renderMarkdown(post.body || '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(post.seo_title || post.title)} — SaaS Pulse Media</title>
<meta name="description" content="${esc(post.meta_description || post.description || '')}">
<meta property="og:title" content="${esc(post.og_title || post.title)}">
<meta property="og:description" content="${esc(post.meta_description || '')}">
<meta property="og:type" content="article">
<meta property="og:image" content="${esc(image)}">
<link rel="canonical" href="https://saaspulsemedia.com/articles/${slug}.html">
<link rel="stylesheet" href="/style.css">
<style>
.progress-bar{position:fixed;top:0;left:0;height:3px;background:var(--accent);z-index:999;transition:width .1s linear;width:0%}
.post-layout{max-width:1040px;margin:0 auto;padding:48px 24px 80px;display:grid;grid-template-columns:1fr 240px;gap:56px;align-items:start}
@media(max-width:900px){.post-layout{grid-template-columns:1fr}}
.post-toc{position:sticky;top:80px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:18px}
.post-toc-title{font-family:var(--mono);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
.post-toc ul{list-style:none}.post-toc li{margin-bottom:7px}
.post-toc a{font-size:.76rem;color:var(--muted);display:block;transition:.15s;padding-left:10px;border-left:2px solid transparent}
.post-toc a:hover,.post-toc a.active{color:var(--accent);border-left-color:var(--accent)}
@media(max-width:900px){.post-toc{display:none}}
.share-btn{padding:7px 14px;border-radius:var(--r);font-size:.74rem;font-weight:600;border:1px solid var(--border);background:var(--white);color:var(--ink);cursor:pointer;transition:.15s;font-family:var(--sans)}
.share-btn:hover{border-color:var(--accent);color:var(--accent)}
.related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
@media(max-width:700px){.related-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="progress-bar" id="pb"></div>
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="logo"><span class="logo-mark">SaaS<span>Pulse</span></span><span class="logo-tag">Media</span></a>
    <nav>
      <a href="/">Home</a><a href="/blog.html" class="active">Blog</a>
      <a href="/comparisons.html">Comparisons</a><a href="/contact.html">Contact</a>
      <a href="/blog.html" class="nav-cta">Browse Articles</a>
    </nav>
  </div>
</header>
<div class="post-header">
  <div class="post-header-inner">
    <div style="font-family:var(--mono);font-size:.62rem;color:rgba(253,252,250,.45);margin-bottom:16px;display:flex;gap:6px">
      <a href="/" style="color:rgba(253,252,250,.45)">Home</a><span>/</span>
      <a href="/blog.html" style="color:rgba(253,252,250,.45)">Blog</a><span>/</span>
      <span>${esc(post.category || 'Article')}</span>
    </div>
    <div class="post-cat">${esc(post.category || '')}</div>
    <h1 class="post-title">${esc(post.title || '')}</h1>
    <p class="post-subtitle">${esc(post.meta_description || post.description || '')}</p>
    <div class="post-byline">
      <span>✍ ${esc(post.author || 'SaaS Pulse Media')}</span>
      <span>📅 ${dateStr}</span>
      <span>⏱ ${readTime} min read</span>
    </div>
  </div>
</div>
<div class="post-layout">
  <article class="post-content" id="article-body">
    <img src="${esc(image)}" alt="${esc(post.title)}" style="width:100%;height:280px;object-fit:cover;border-radius:var(--r);margin-bottom:2em" loading="eager">
    ${bodyHtml}
  </article>
  <aside>
    <div class="post-toc">
      <div class="post-toc-title">Contents</div>
      <ul id="toc-list"></ul>
    </div>
    <div class="sidebar-card" style="margin-top:16px">
      <div class="sidebar-title">Share</div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="share-btn" onclick="shareX()">𝕏 Share</button>
        <button class="share-btn" onclick="shareLinkedIn()">in LinkedIn</button>
        <button class="share-btn" onclick="copyLink()">🔗 Copy</button>
      </div>
    </div>
    <div class="newsletter-widget" style="margin-top:16px">
      <div class="newsletter-title">Enjoyed this?</div>
      <p class="newsletter-sub">Twice-weekly SaaS insights in your inbox.</p>
      <form class="newsletter-form" onsubmit="subForm(event)">
        <input class="newsletter-input" type="email" placeholder="your@email.com" required>
        <button class="newsletter-submit">Subscribe Free →</button>
      </form>
    </div>
  </aside>
</div>
${post.key_insight ? `<div style="max-width:760px;margin:0 auto;padding:0 24px 40px"><div class="key-insight"><div class="key-insight-label">Key Insight</div><div class="key-insight-text">${esc(post.key_insight)}</div></div></div>` : ''}
<div style="max-width:760px;margin:0 auto;padding:0 24px 60px"><div class="post-tags">${tags}</div></div>
<section class="section section-tinted" id="related-section" style="display:none">
  <div class="section-inner">
    <div class="section-header">
      <div><div class="section-label">Keep reading</div><h2 class="section-title">Related <em>articles</em></h2></div>
      <a href="/blog.html" class="view-all">View all</a>
    </div>
    <div class="related-grid" id="related-grid"></div>
  </div>
</section>
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand"><div class="logo"><span class="logo-mark">SaaS<span>Pulse</span></span></div><p>Expert reviews, comparisons, and insights on the tools powering modern businesses.</p></div>
      <div><div class="footer-col-title">Content</div><ul class="footer-links"><li><a href="/blog.html">All Articles</a></li><li><a href="/comparisons.html">Comparisons</a></li></ul></div>
      <div><div class="footer-col-title">Site</div><ul class="footer-links"><li><a href="/contact.html">Contact</a></li><li><a href="/privacy.html">Privacy</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>© 2026 SaaS Pulse Media. All rights reserved.</span></div>
    <div class="affiliate-notice"><strong style="color:rgba(253,252,250,.5)">Affiliate Disclosure:</strong> Some links are affiliate links. We may earn a commission at no extra cost to you.</div>
  </div>
</footer>
<script>
(function(){
  const headings=document.querySelectorAll('#article-body h2,#article-body h3');
  if(headings.length<2)return;
  const list=document.getElementById('toc-list');
  list.innerHTML=[...headings].map(h=>{const pad=h.tagName==='H3'?'style="padding-left:14px"':'';return '<li '+pad+'><a href="#'+h.id+'">'+h.textContent+'</a></li>';}).join('');
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{const link=list.querySelector('a[href="#'+e.target.id+'"]');if(link)link.classList.toggle('active',e.isIntersecting);});},{rootMargin:'-10% 0px -80% 0px'});
  headings.forEach(h=>obs.observe(h));
})();
window.addEventListener('scroll',()=>{const el=document.getElementById('article-body');if(!el)return;const total=el.offsetHeight-window.innerHeight;const pct=total>0?Math.max(0,Math.min(100,Math.round((-el.getBoundingClientRect().top/total)*100))):0;document.getElementById('pb').style.width=pct+'%';});
fetch('/data/posts.json?t='+Date.now()).then(r=>r.json()).then(all=>{
  const related=all.filter(a=>a.slug!=='${slug}'&&a.category==='${esc(post.category||'')}').slice(0,3);
  if(!related.length)return;
  document.getElementById('related-section').style.display='block';
  document.getElementById('related-grid').innerHTML=related.map(r=>{const d=r.date?new Date(r.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';const link=r.url||('/articles/'+r.slug+'.html');return '<article class="article-card"><div class="card-image">'+(r.image?'<img src="'+r.image+'" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">':'<div class="card-image-placeholder">📊</div>')+'</div><div class="card-body"><div class="card-cat">'+r.category+'</div><a href="'+link+'" class="card-title">'+r.title+'</a><p class="card-excerpt">'+(r.description||'').substring(0,130)+'</p><div class="card-meta"><span>'+d+'</span><a href="'+link+'" class="card-read">Read →</a></div></div></article>';}).join('');
}).catch(()=>{});
function shareX(){window.open('https://twitter.com/intent/tweet?url='+encodeURIComponent(location.href)+'&text='+encodeURIComponent(document.title+' via @SaasPulseMedia'),'_blank');}
function shareLinkedIn(){window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(location.href),'_blank');}
function copyLink(){navigator.clipboard.writeText(location.href).then(()=>{const b=event.target;b.textContent='✓ Copied!';setTimeout(()=>b.textContent='🔗 Copy',2000);});}
function subForm(e){e.preventDefault();e.target.innerHTML='<div style="text-align:center;font-weight:600;color:white">✓ Subscribed!</div>';}
</script>
</body>
</html>`;
}

async function main() {
  log('Starting QYREN Auto Publisher');
  log(`Repo: ${REPO}`);
  log(`Date: ${new Date().toISOString()}`);

  // Load existing posts
  let existingPosts = [];
  const postsPath = path.join(process.cwd(), 'site/data/posts.json');
  try {
    existingPosts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    log(`Loaded ${existingPosts.length} existing posts`);
  } catch(e) {
    log('No existing posts.json found, starting fresh');
  }

  const recentTopics = existingPosts.slice(0, 8).map(p => p.title).join(', ');

  // Pick topic
  let decision;
  if (MANUAL_TOPIC) {
    log(`Using manual topic: ${MANUAL_TOPIC}`);
    decision = {
      topic: MANUAL_TOPIC,
      category: 'SaaS Tool Reviews',
      angle: `A comprehensive, practical guide to ${MANUAL_TOPIC}`,
      target_keywords: [MANUAL_TOPIC.toLowerCase()],
      search_intent: 'commercial',
    };
  } else {
    log('Selecting topic automatically...');
    const available = SEED_TOPICS.filter(s =>
      !existingPosts.some(p => p.title.toLowerCase().includes(s.topic.split(' ')[0].toLowerCase()))
    );
    const pool = available.length > 0 ? available : SEED_TOPICS;
    const seedPick = pool[Math.floor(Math.random() * pool.length)];

    decision = await callClaudeJSON(
      `You are QYREN, content strategist for SaaS Pulse Media. The current year is 2026. Pick the best SaaS article topic. Return JSON only.`,
      `Select a SaaS article topic. Recently covered: ${recentTopics || 'none'}.
Suggested: "${seedPick.topic}" (${seedPick.category})

Return JSON:
{
  "topic": "Article topic",
  "category": "one of: SEO Tools|CRM|Email Marketing|AI Writing|AI Tools for Business|Digital Marketing Tips|Productivity Guides|Project Management|SaaS Tool Reviews|SEO Strategies",
  "angle": "Unique editorial angle",
  "target_keywords": ["primary keyword", "secondary keyword"],
  "search_intent": "informational|commercial|navigational"
}`, 600);
    log(`Topic: "${decision.topic}" [${decision.category}]`);
  }

  // Write metadata
  log('Generating metadata...');
  const meta = await callClaudeJSON(
    `You are QYREN writing for SaaS Pulse Media. The current year is 2026 — always reference 2026, never 2025. Return JSON only.`,
    `Generate SEO metadata:
Topic: ${decision.topic}
Category: ${decision.category}
Keywords: ${(decision.target_keywords || []).join(', ')}

Return JSON:
{
  "title": "SEO title with keyword (include 2026 where relevant)",
  "subtitle": "1-sentence subtitle",
  "meta_description": "150-160 char meta description",
  "seo_title": "55 char title tag",
  "og_title": "Open Graph title",
  "tags": ["tag1","tag2","tag3","tag4"],
  "key_insight": "Single most important takeaway"
}`, 600);
  log(`Title: "${meta.title}"`);

  // Write body
 log('Writing article body...');
  const body = await callClaude(
    `You are QYREN writing for SaaS Pulse Media. Write expert, practical, SEO-optimised content in ${STYLE} style. The current year is 2026 — always reference 2026, never 2025. Return ONLY the article body text, no JSON, no preamble, no title at the top.

IMPORTANT — affiliate linking rules:

GENERAL MENTIONS (tool comes up as one of several options in a roundup/list article):
- If you mention "Notion AI" or "Notion" anywhere, hyperlink the FIRST mention only: [Notion AI](https://affiliate.notion.so/swlxlbd3nd81)
- If you mention "Nutshell" or "Nutshell CRM" anywhere, hyperlink the FIRST mention only: [Nutshell CRM](https://try.nutshell.com/oq162q0gnc5w)
- Leave every other mention as plain text.

DEDICATED ARTICLES (the article's main subject IS Notion AI or Nutshell CRM — e.g. a review, a "X vs Y" comparison, or a "best CRM/productivity tool" roundup where one of these is the top pick):
- Link the tool name EVERY TIME it appears as a clickable call-to-action moment — specifically: in the introduction, after each major feature section, in the pricing section, and in the final verdict/conclusion.
- Use natural, varied anchor text across these links — not just the bare tool name every time. Examples: [Nutshell CRM](https://try.nutshell.com/oq162q0gnc5w), [try Nutshell free](https://try.nutshell.com/oq162q0gnc5w), [start your Nutshell trial](https://try.nutshell.com/oq162q0gnc5w). Same pattern for Notion AI with https://affiliate.notion.so/swlxlbd3nd81.
- Always include one clear, standalone call-to-action sentence near the end, just before the verdict, such as: "Ready to try it yourself? [Start your free Nutshell trial here](https://try.nutshell.com/oq162q0gnc5w)." or "[Try Notion AI free](https://affiliate.notion.so/swlxlbd3nd81) and see the difference in your team's workflow."
- The final verdict paragraph must also contain one link.
- Never invent or alter these URLs — use them exactly as given.
- Still write an honest, balanced review covering real pros, cons, and pricing — credibility matters more than link count for actually converting readers.`,
    `Write a complete ${ARTICLE_LENGTH}-word article:

Title: ${meta.title}
Category: ${decision.category}
Angle: ${decision.angle}
Keywords: ${(decision.target_keywords || []).join(', ')}

Use ## for H2 headings, ### for H3. Include lists. Name real tools with real pricing. End with a clear verdict.

If this article's main subject is Notion AI or Nutshell CRM (e.g. a dedicated review, a head-to-head comparison, or a "best CRM/productivity tools" roundup naming them as the top pick), follow the DEDICATED ARTICLES linking rules above. Otherwise, if they come up only as one of several tools mentioned in passing, follow the GENERAL MENTIONS rules.`,
    2800);
  log(`Body: ${body.split(/\s+/).length} words`);

  // Build article object
  const slug = slugify(meta.title || decision.topic) + '-' + Date.now().toString(36).slice(-4);
  const image = pickCategoryImage(decision.category, slug);
  const now = new Date().toISOString();

  const article = {
    slug,
    title: meta.title || decision.topic,
    subtitle: meta.subtitle || '',
    category: decision.category,
    date: now,
    description: meta.meta_description || '',
    meta_description: meta.meta_description || '',
    seo_title: meta.seo_title || meta.title,
    og_title: meta.og_title || meta.title,
    author: 'SaaS Pulse Media',
    tags: meta.tags || [],
    key_insight: meta.key_insight || '',
    image,
    body,
    url: `/articles/${slug}.html`,
  };

  // Write HTML file to site/articles/
  const articlesDir = path.join(process.cwd(), 'site/articles');
  if (!fs.existsSync(articlesDir)) fs.mkdirSync(articlesDir, { recursive: true });
  fs.writeFileSync(path.join(articlesDir, `${slug}.html`), buildArticleHtml(article));
  log(`Article HTML written: site/articles/${slug}.html`);

  // Update site/data/posts.json
  const indexEntry = {
    slug: article.slug,
    title: article.title,
    category: article.category,
    date: article.date,
    description: article.meta_description,
    author: article.author,
    tags: article.tags,
    key_insight: article.key_insight,
    image: article.image,
    url: article.url,
  };

  existingPosts = existingPosts.filter(p => p.slug !== slug);
  existingPosts.unshift(indexEntry);
  fs.writeFileSync(postsPath, JSON.stringify(existingPosts, null, 2));
  log(`posts.json updated: ${existingPosts.length} total articles`);

  // Save social posts
  log('Generating social posts...');
  const social = await callClaudeJSON(
    `Social media strategist for SaaS Pulse Media. Return JSON only.`,
    `Generate social posts:
Title: ${article.title}
Key insight: ${article.key_insight}
URL: https://saaspulsemedia.com/articles/${slug}.html

Return JSON:
{
  "twitter_thread": ["tweet 1 hook", "tweet 2 key point", "tweet 3 CTA with URL"],
  "twitter_single": "Single tweet with URL (max 280 chars)",
  "linkedin_post": "LinkedIn post 150-200 words ending with URL"
}`, 800);

  const socialDir = path.join(process.cwd(), 'site/data/social');
  if (!fs.existsSync(socialDir)) fs.mkdirSync(socialDir, { recursive: true });
  fs.writeFileSync(
    path.join(socialDir, `${slug}.json`),
    JSON.stringify({ article_title: article.title, article_url: `https://saaspulsemedia.com/articles/${slug}.html`, ...social, created_at: now }, null, 2)
  );
  log('Social posts saved');
// Regenerate sitemap.xml
  try {
    const { execSync } = require('child_process');
    execSync('node .github/scripts/generate_sitemap.js', { stdio: 'inherit' });
    log('sitemap.xml updated');
  } catch(e) {
    log('Sitemap generation failed (non-fatal): ' + e.message);
  }
  log('');
  log('════════════════════════════════');
  log(`✓ PUBLISHED: "${article.title}"`);
  log(`✓ URL: https://saaspulsemedia.com/articles/${slug}.html`);
  log(`✓ Words: ${body.split(/\s+/).length}`);
  log('════════════════════════════════');
}

main().catch(err => {
  console.error('[QYREN ERROR]', err.message);
  process.exit(1);
});
