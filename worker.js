/**
 * Nucleora Cloudflare Worker
 * Handles: security headers, form submissions, SEO redirects, performance
 */

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "connect-src 'self'",
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

    // --- Pass through to origin (GitHub Pages) and add headers ---
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);

    // Add security headers
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      newResponse.headers.set(key, value);
    }

    // Performance: cache static assets at the edge
    const ext = url.pathname.split('.').pop();
    const staticExts = ['css', 'js', 'jpg', 'jpeg', 'png', 'svg', 'woff2', 'woff', 'mp4', 'webp', 'ico'];
    if (staticExts.includes(ext)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.pathname.endsWith('.html') || url.pathname === '/' || !url.pathname.includes('.')) {
      // HTML pages: short cache, revalidate
      newResponse.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    }

    return newResponse;
  }
};

async function handleWaitlist(request, env) {
  try {
    const data = await request.json();
    const { name, email, org, sector, use } = data;

    if (!name || !email || !email.includes('@')) {
      return jsonResponse({ error: 'Name and valid email required' }, 400);
    }

    const entry = {
      name: sanitize(name),
      email: sanitize(email),
      org: sanitize(org || ''),
      sector: sanitize(sector || ''),
      use: sanitize(use || ''),
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      country: request.headers.get('CF-IPCountry') || 'unknown'
    };

    // Store in KV with email as key (deduplicates)
    if (env.NUCLEORA_FORMS) {
      await env.NUCLEORA_FORMS.put(
        `waitlist:${entry.email}`,
        JSON.stringify(entry),
        { metadata: { name: entry.name, timestamp: entry.timestamp } }
      );
    }

    // Also forward to email via MailChannels (free for Workers)
    await sendEmail(env, {
      to: 'hello@nucleora.org',
      subject: `[Nucleora Waitlist] ${entry.name} — ${entry.org || 'No org'}`,
      body: `New waitlist signup:\n\nName: ${entry.name}\nEmail: ${entry.email}\nOrg: ${entry.org}\nSector: ${entry.sector}\nUse: ${entry.use}\nCountry: ${entry.country}\nTime: ${entry.timestamp}`
    });

    return jsonResponse({ ok: true, message: 'You\'re on the list' });
  } catch (e) {
    return jsonResponse({ error: 'Invalid request' }, 400);
  }
}

async function handleContact(request, env) {
  try {
    const data = await request.json();
    const { name, email, org, type, subject, message } = data;

    if (!name || !email || !email.includes('@') || !message) {
      return jsonResponse({ error: 'Name, email, and message required' }, 400);
    }

    if (message.length > 2000) {
      return jsonResponse({ error: 'Message too long (max 2000 chars)' }, 400);
    }

    const entry = {
      name: sanitize(name),
      email: sanitize(email),
      org: sanitize(org || ''),
      type: sanitize(type || 'general'),
      subject: sanitize(subject || ''),
      message: sanitize(message),
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      country: request.headers.get('CF-IPCountry') || 'unknown'
    };

    // Store in KV
    if (env.NUCLEORA_FORMS) {
      const key = `contact:${Date.now()}:${entry.email}`;
      await env.NUCLEORA_FORMS.put(key, JSON.stringify(entry), {
        metadata: { name: entry.name, subject: entry.subject, timestamp: entry.timestamp }
      });
    }

    // Forward via email
    await sendEmail(env, {
      to: 'hello@nucleora.org',
      subject: `[Nucleora Contact] ${entry.type}: ${entry.subject || 'No subject'} — ${entry.name}`,
      body: `Contact form submission:\n\nName: ${entry.name}\nEmail: ${entry.email}\nOrg: ${entry.org}\nCategory: ${entry.type}\nSubject: ${entry.subject}\n\nMessage:\n${entry.message}\n\nCountry: ${entry.country}\nTime: ${entry.timestamp}`,
      replyTo: entry.email
    });

    return jsonResponse({ ok: true, message: 'Message sent' });
  } catch (e) {
    return jsonResponse({ error: 'Invalid request' }, 400);
  }
}

async function sendEmail(env, { to, subject, body, replyTo }) {
  try {
    const msg = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@nucleora.org', name: 'Nucleora' },
      subject,
      content: [{ type: 'text/plain', value: body }]
    };
    if (replyTo) {
      msg.reply_to = { email: replyTo };
    }
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
  } catch (e) {
    // Email is best-effort; don't fail the form
    console.error('Email send failed:', e);
  }
}

function sanitize(str) {
  return String(str).trim().slice(0, 2000);
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
