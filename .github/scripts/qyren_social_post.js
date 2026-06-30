#!/usr/bin/env node
/**
 * QYREN Social Poster
 * Reads the most recently generated social JSON file (created by qyren_publish.js)
 * and posts to X (Twitter, as a thread) and LinkedIn.
 *
 * Actual QYREN social JSON shape:
 * {
 *   "article_title": "...",
 *   "article_url": "https://saaspulsemedia.com/articles/....html",
 *   "twitter_thread": ["tweet 1", "tweet 2", "tweet 3"],
 *   "twitter_single": "single tweet fallback text",
 *   "linkedin_post": "full linkedin post text",
 *   "created_at": "ISO date"
 * }
 *
 * Env vars required:
 *   TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
 *   LINKEDIN_ACCESS_TOKEN
 *   LINKEDIN_PERSON_URN (optional — auto-fetched from token if not set)
 *
 * Behaviour:
 *   - Finds the newest .json file in site/data/social/
 *   - Posts the twitter_thread as a proper threaded reply chain (falls back to twitter_single)
 *   - Posts linkedin_post as-is to LinkedIn
 *   - Never throws / never fails the GitHub Actions job — the article is already
 *     published successfully by the time this runs, so social failures are logged only.
 */

const fs = require('fs');
const path = require('path');

const SOCIAL_DIR = path.join(process.cwd(), 'site', 'data', 'social');

function findLatestSocialFile() {
  if (!fs.existsSync(SOCIAL_DIR)) {
    console.log('No social directory found at', SOCIAL_DIR);
    return null;
  }
  const files = fs.readdirSync(SOCIAL_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(SOCIAL_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  return files.length ? path.join(SOCIAL_DIR, files[0].name) : null;
}

// ─── X (Twitter) ───────────────────────────────────────────────────────────

async function postThreadToTwitter(tweets) {
  const { TwitterApi } = require('twitter-api-v2');
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  let previousId = null;
  const postedIds = [];

  for (const tweetText of tweets) {
    const trimmed = tweetText.slice(0, 280);
    const payload = previousId
      ? { text: trimmed, reply: { in_reply_to_tweet_id: previousId } }
      : { text: trimmed };

    const result = await client.v2.tweet(payload);
    previousId = result.data.id;
    postedIds.push(previousId);
    console.log('  ↳ tweet posted:', previousId);
  }

  console.log('✅ Posted thread to X:', postedIds.join(' -> '));
  return postedIds;
}

// ─── LinkedIn ────────────────────────────────────────────────────────────────

async function getLinkedInPersonUrn(token) {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`LinkedIn userinfo failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return `urn:li:person:${data.sub}`;
}

async function postToLinkedIn(fullText, url) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) throw new Error('LINKEDIN_ACCESS_TOKEN not set');

  const authorUrn = process.env.LINKEDIN_PERSON_URN || await getLinkedInPersonUrn(token);

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: fullText },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: url,
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`LinkedIn post failed: ${res.status} ${await res.text()}`);
  }

  const id = res.headers.get('x-restli-id');
  console.log('✅ Posted to LinkedIn:', id);
  return id;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const socialFile = findLatestSocialFile();
  if (!socialFile) {
    console.log('⚠️  No social JSON file found — skipping social posting.');
    return;
  }

  console.log('📄 Using social file:', socialFile);
  const data = JSON.parse(fs.readFileSync(socialFile, 'utf8'));

  const url = data.article_url;
  const tweets = (Array.isArray(data.twitter_thread) && data.twitter_thread.length)
    ? data.twitter_thread
    : [data.twitter_single].filter(Boolean);
  const linkedinText = data.linkedin_post;

  const results = { twitter: null, linkedin: null };

  // X
  try {
    if (!tweets.length) throw new Error('No twitter content found in social JSON');
    await postThreadToTwitter(tweets);
    results.twitter = 'success';
  } catch (err) {
    console.error('❌ X posting failed:', err.message);
    results.twitter = 'failed: ' + err.message;
  }

  // LinkedIn
  try {
    if (!linkedinText) throw new Error('No linkedin_post found in social JSON');
    await postToLinkedIn(linkedinText, url);
    results.linkedin = 'success';
  } catch (err) {
    console.error('❌ LinkedIn posting failed:', err.message);
    results.linkedin = 'failed: ' + err.message;
  }

  console.log('\n📊 Social posting summary:', JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Unexpected error in social poster:', err);
  process.exit(0); // never fail the workflow because of social posting
});
