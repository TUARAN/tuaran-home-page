const VISITOR_COOKIE = 'acc_visitor';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readVisitorId(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)acc_visitor=([0-9a-f-]{36})(?:;|$)/i);
  return match && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(match[1])
    ? match[1].toLowerCase()
    : null;
}

async function visitorHash(visitorId) {
  const bytes = new TextEncoder().encode(visitorId);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function totals(db) {
  const row = await db.prepare('SELECT pv, (SELECT COUNT(*) FROM visitors) AS uv FROM page_stats WHERE id = 1').first();
  return { pv: Number(row?.pv || 0), uv: Number(row?.uv || 0) };
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/visit') return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
    }
    if (!env.STATS_DB) return json({ error: '统计暂不可用' }, 503);

    try {
      if (request.method === 'GET') return json(await totals(env.STATS_DB));
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin) return json({ error: '来源无效' }, 403);

      const existingId = readVisitorId(request);
      const visitorId = existingId || crypto.randomUUID();
      const hash = await visitorHash(visitorId);
      await env.STATS_DB.batch([
        env.STATS_DB.prepare('INSERT OR IGNORE INTO visitors (visitor_hash) VALUES (?)').bind(hash),
        env.STATS_DB.prepare('UPDATE page_stats SET pv = pv + 1 WHERE id = 1'),
      ]);

      const response = json(await totals(env.STATS_DB));
      if (!existingId) {
        const secure = url.protocol === 'https:' ? '; Secure' : '';
        response.headers.set('Set-Cookie', `${VISITOR_COOKIE}=${visitorId}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly${secure}; SameSite=Lax`);
      }
      return response;
    } catch (error) {
      console.error('PV/UV 统计失败', error);
      return json({ error: '统计暂不可用' }, 503);
    }
  },
};
