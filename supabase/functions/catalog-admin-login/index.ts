// 공구 제안관 관리자 PIN 로그인 / PIN 변경.
// PIN 이 맞으면 관리자 계정 세션을 만들어 돌려준다. 15분 안에 8번 틀리면 잠근다(전체 기준).
// { pin, new_pin } 을 보내면 세션 대신 PIN 을 바꾼다.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const MAX_FAILS = 8;
const WINDOW_MIN = 15;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;

  let body: { pin?: unknown; new_pin?: unknown } = {};
  try { body = await req.json(); } catch { /* 빈 요청으로 처리 */ }
  const pin = String(body.pin || '');
  const newPin = body.new_pin == null ? null : String(body.new_pin);
  if (!/^\d{4,8}$/.test(pin)) return json({ error: 'format' }, 400);
  if (newPin !== null && !/^\d{4,8}$/.test(newPin)) return json({ error: 'format' }, 400);

  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const { count } = await admin.from('cat_pin_attempts').select('id', { count: 'exact', head: true }).eq('ok', false).gte('created_at', since);
  if ((count ?? 0) >= MAX_FAILS) return json({ error: 'locked', minutes: WINDOW_MIN }, 429);

  const { data: cfg, error: cfgErr } = await admin.from('cat_admin_config').select('pin_hash, admin_email').eq('id', 1).single();
  if (cfgErr || !cfg) return json({ error: 'config' }, 500);

  const ok = (await sha256('bb-catalog:' + pin)) === cfg.pin_hash;
  await admin.from('cat_pin_attempts').insert({ ok, ip });
  if (!ok) return json({ error: 'wrong', left: Math.max(0, MAX_FAILS - (count ?? 0) - 1) }, 401);

  if (newPin !== null) {
    const { error } = await admin.from('cat_admin_config').update({ pin_hash: await sha256('bb-catalog:' + newPin) }).eq('id', 1);
    return error ? json({ error: 'update' }, 500) : json({ changed: true });
  }

  // 비밀번호 없는 관리자 계정에 매직링크 토큰을 발급해 바로 세션으로 바꾼다 (메일은 보내지 않음).
  // 계정을 막 만든 직후에는 첫 토큰 검증이 실패할 때가 있어 한 번 더 시도한다.
  const email = cfg.admin_email;
  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    if (link.error) {
      const created = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (created.error) lastErr = created.error.message;
      continue;
    }
    await admin.from('cat_admins').upsert({ user_id: link.data.user.id });
    const { data: v, error: vErr } = await anon.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'magiclink' });
    if (!vErr && v.session) return json({ access_token: v.session.access_token, refresh_token: v.session.refresh_token });
    lastErr = vErr?.message || 'no session';
  }
  return json({ error: 'session', detail: lastErr }, 500);
});
