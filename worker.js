/**
 * Nucleora Cloudflare Worker
 * Handles: security headers, form submissions (KV + rate limiting + email notifications),
 *          SEO redirects, performance caching, spam protection
 */

import { EmailMessage } from 'cloudflare:email';

const NOTIFICATION_TO = 'nucleora.admin@proton.me';
const NOTIFICATION_FROM = 'notifications@nucleora.org';

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "connect-src 'self' https://cloudflareinsights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://nucleora.org',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

const RATE_LIMIT_WINDOW = 3600; // 1 hour
const RATE_LIMIT_MAX = 10;      // max submissions per IP per window

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- www → apex redirect ---
    if (url.hostname === 'www.nucleora.org') {
      url.hostname = 'nucleora.org';
      return Response.redirect(url.toString(), 301);
    }

    // --- CORS preflight ---
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // --- API routes ---
    if (url.pathname === '/api/waitlist' && request.method === 'POST') {
      return handleWaitlist(request, env);
    }
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }
    if (url.pathname.startsWith('/api/')) {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    // --- Pass through to origin (GitHub Pages) and add headers ---
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);

    // Add security headers
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      newResponse.headers.set(key, value);
    }

    // Performance: cache static assets at the edge
    const ext = url.pathname.split('.').pop();
    const staticExts = ['css', 'js', 'jpg', 'jpeg', 'png', 'svg', 'woff2', 'woff', 'mp4', 'webp', 'ico', 'webmanifest'];
    if (staticExts.includes(ext)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.pathname.endsWith('.html') || url.pathname === '/' || !url.pathname.includes('.')) {
      newResponse.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    }

    return newResponse;
  }
};

// --- Rate limiting ---
async function checkRateLimit(ip, env) {
  if (!env.NUCLEORA_FORMS) return false;
  const key = 'ratelimit:' + ip;
  const val = await env.NUCLEORA_FORMS.get(key);
  const count = val ? parseInt(val, 10) : 0;
  if (count >= RATE_LIMIT_MAX) return true;
  await env.NUCLEORA_FORMS.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW });
  return false;
}

// --- Email notification helper ---
async function sendNotification(env, subject, body) {
  if (!env.SEND_EMAIL) return; // binding not configured — skip silently
  try {
    const rawEmail = [
      `From: ${NOTIFICATION_FROM}`,
      `To: ${NOTIFICATION_TO}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\r\n');

    const msg = new EmailMessage(NOTIFICATION_FROM, NOTIFICATION_TO, new Response(rawEmail).body);
    await env.SEND_EMAIL.send(msg);
  } catch (e) {
    // Email send failed — don't break form submission
    console.error('Email notification failed:', e.message);
  }
}

// --- Waitlist handler ---
async function handleWaitlist(request, env) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (await checkRateLimit(ip, env)) {
      return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429);
    }

    const data = await request.json();

    // Honeypot — bots fill hidden fields
    if (data.website || data.url || data.honeypot) {
      return jsonResponse({ ok: true, message: "You are on the list" });
    }

    const { name, email, org, sector } = data;
    const useCase = data.use;

    if (!name || !email || !email.includes('@') || email.length > 254) {
      return jsonResponse({ error: 'Name and valid email required' }, 400);
    }

    const entry = {
      name: sanitize(name, 200),
      email: sanitize(email, 254),
      org: sanitize(org || '', 200),
      sector: sanitize(sector || '', 100),
      use: sanitize(useCase || '', 100),
      timestamp: new Date().toISOString(),
      ip,
      country: request.headers.get('CF-IPCountry') || 'unknown'
    };

    if (env.NUCLEORA_FORMS) {
      await env.NUCLEORA_FORMS.put(
        'waitlist:' + entry.email,
        JSON.stringify(entry),
        { metadata: { name: entry.name, timestamp: entry.timestamp } }
      );
    }

    // Send email notification
    await sendNotification(env,
      `[Nucleora] New waitlist signup: ${entry.name}`,
      [
        '--- New Waitlist Signup ---',
        '',
        `Name:     ${entry.name}`,
        `Email:    ${entry.email}`,
        `Org:      ${entry.org || '(not provided)'}`,
        `Sector:   ${entry.sector || '(not provided)'}`,
        `Use case: ${entry.use || '(not provided)'}`,
        '',
        `Country:  ${entry.country}`,
        `Time:     ${entry.timestamp}`,
      ].join('\n')
    );

    return jsonResponse({ ok: true, message: "You are on the list" });
  } catch (e) {
    return jsonResponse({ error: 'Invalid request' }, 400);
  }
}

// --- Contact handler ---
async function handleContact(request, env) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (await checkRateLimit(ip, env)) {
      return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429);
    }

    const data = await request.json();

    // Honeypot
    if (data.website || data.url || data.honeypot) {
      return jsonResponse({ ok: true, message: 'Message sent' });
    }

    const { name, email, org, type, subject, message } = data;

    if (!name || !email || !email.includes('@') || email.length > 254 || !message) {
      return jsonResponse({ error: 'Name, email, and message required' }, 400);
    }

    if (message.length > 2000) {
      return jsonResponse({ error: 'Message too long (max 2000 chars)' }, 400);
    }

    const entry = {
      name: sanitize(name, 200),
      email: sanitize(email, 254),
      org: sanitize(org || '', 200),
      type: sanitize(type || 'general', 50),
      subject: sanitize(subject || '', 200),
      message: sanitize(message, 2000),
      timestamp: new Date().toISOString(),
      ip,
      country: request.headers.get('CF-IPCountry') || 'unknown'
    };

    if (env.NUCLEORA_FORMS) {
      const key = 'contact:' + Date.now() + ':' + entry.email;
      await env.NUCLEORA_FORMS.put(key, JSON.stringify(entry), {
        metadata: { name: entry.name, subject: entry.subject, timestamp: entry.timestamp }
      });
    }

    // Send email notification
    await sendNotification(env,
      `[Nucleora] Contact form: ${entry.subject || 'No subject'} (from ${entry.name})`,
      [
        '--- New Contact Form Submission ---',
        '',
        `From:     ${entry.name} <${entry.email}>`,
        `Org:      ${entry.org || '(not provided)'}`,
        `Type:     ${entry.type}`,
        `Subject:  ${entry.subject || '(none)'}`,
        '',
        'Message:',
        '─'.repeat(40),
        entry.message,
        '─'.repeat(40),
        '',
        `Country:  ${entry.country}`,
        `Time:     ${entry.timestamp}`,
      ].join('\n')
    );

    return jsonResponse({ ok: true, message: 'Message sent' });
  } catch (e) {
    return jsonResponse({ error: 'Invalid request' }, 400);
  }
}

// --- Helpers ---
function sanitize(str, maxLen) {
  return String(str).replace(/[<>]/g, '').trim().slice(0, maxLen || 2000);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}
