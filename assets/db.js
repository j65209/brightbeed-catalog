/* 공구 제안관 — Supabase 연결 (제안관 전용 프로젝트, 스키마는 supabase/schema.sql)
   BB.ready 가 끝나면 BB.admin(관리자 여부)과 BB.content(사이트 문구)를 쓸 수 있다. */
(function () {
  'use strict';
  var URL = 'https://jyrguzogbuurfuopvrvl.supabase.co';
  var KEY = 'sb_publishable_nTPb9jMgmPksQ0XrX3FcMQ_uHjv4vJ3';
  var BB = window.BB = { admin: false, content: {}, ok: false };

  if (!window.supabase) {                      // CDN 이 막혔을 때도 화면은 빈칸 템플릿으로 뜨게 둔다
    BB.ready = Promise.resolve(BB);
    return;
  }
  var sb = BB.sb = window.supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'bb-catalog-auth-v2' }   // v2: 전용 프로젝트로 옮기면서 예전 세션은 버린다
  });

  BB.ready = (async function () {
    try {
      var s = await sb.auth.getSession();
      if (s.data.session) { var r = await sb.rpc('cat_is_admin'); BB.admin = r.data === true; }
      var c = await sb.from('cat_content').select('key,value');
      (c.data || []).forEach(function (row) { BB.content[row.key] = row.value; });
      BB.ok = !c.error;
    } catch (e) { console.warn('[BB] 연결 실패', e); }
    document.body.classList.toggle('is-admin', BB.admin);
    return BB;
  })();

  async function callLogin(body) {
    var r = await fetch(URL + '/functions/v1/catalog-admin-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify(body)
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) { var err = new Error(j.error || 'error'); err.info = j; throw err; }
    return j;
  }
  BB.login = async function (pin) {
    var j = await callLogin({ pin: pin });
    await sb.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
    BB.admin = true; document.body.classList.add('is-admin');
  };
  BB.changePin = function (pin, newPin) { return callLogin({ pin: pin, new_pin: newPin }); };
  BB.logout = async function () { await sb.auth.signOut(); BB.admin = false; document.body.classList.remove('is-admin'); };

  BB.saveContent = async function (key, value) {
    var r = value ? await sb.from('cat_content').upsert({ key: key, value: value }) : await sb.from('cat_content').delete().eq('key', key);
    if (r.error) throw r.error;
    if (value) BB.content[key] = value; else delete BB.content[key];
  };

  BB.upload = async function (file, folder) {
    var ext = ((file.name || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    var path = (folder || 'misc') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    var r = await sb.storage.from('catalog').upload(path, file, { cacheControl: '31536000', contentType: file.type || undefined });
    if (r.error) throw r.error;
    return sb.storage.from('catalog').getPublicUrl(path).data.publicUrl;
  };

  BB.qs = function (k) { return new URLSearchParams(location.search).get(k); };
  BB.won = function (n) { return n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('ko-KR') + '원'; };
  BB.ago = function (iso) {
    var m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return '방금'; if (m < 60) return m + '분 전'; if (m < 1440) return Math.round(m / 60) + '시간 전';
    return new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };
})();
