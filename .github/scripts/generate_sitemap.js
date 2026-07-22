#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://saaspulsemedia.com';
const today = new Date().toISOString().split('T')[0];

const staticPages = [
  { loc: '/',            priority: '1.0', freq: 'weekly'  },
  { loc: '/blog',        priority: '0.9', freq: 'daily'   },
  { loc: '/comparisons', priority: '0.8', freq: 'weekly'  },
  { loc: '/contact',     priority: '0.5', freq: 'monthly' },
  { loc: '/privacy',     priority: '0.3', freq: 'monthly' },
];

const postsPath = path.join(process.cwd(), 'site/data/posts.json');
let articles = [];
try {
  articles = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  console.log(`Loaded ${articles.length} articles`);
} catch(e) {
  console.warn('Could not read posts.json:', e.message);
}

function urlEntry({ loc, lastmod, priority, freq }) {
  return `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${lastmod || today}</lastmod>
    <changefreq>${freq || 'monthly'}</changefreq>
    <priority>${priority || '0.7'}</priority>
  </url>`;
}

const staticEntries = staticPages.map(p => urlEntry(p));
const articleEntries = articles.map(a => urlEntry({
  loc: a.url || `/articles/${a.slug}.html`,
  lastmod: a.date ? a.date.split('T')[0] : today,
  priority: '0.7',
  freq: 'monthly',
}));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...articleEntries].join('\n')}
</urlset>`;

const outputPath = path.join(process.cwd(), 'site/sitemap.xml');
fs.writeFileSync(outputPath, xml);
console.log(`✅ sitemap.xml written: ${staticPages.length + articles.length} total URLs`);
