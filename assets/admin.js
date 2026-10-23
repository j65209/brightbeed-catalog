/* 공구 제안관 — 관리자 페이지 (PIN 입장 → 브랜드·상품·셀러·신청·문구 관리) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var D = { brands: [], products: [], prices: {}, sellers: [], requests: [], content: [], cats: [] };
  var sb;
  var TYPE = { influencer: '인플루언서', vendor: '업체 셀러', personal: '개인 셀러' };
  var ST = { pending: ['대기', 'warn'], approved: ['승인', 'ok'], rejected: ['거절', 'danger'] };
  var RQ = { new: '신규', progress: '진행', done: '완료', hold: '보류' };

  if (!window.BB || !BB.sb) { $('#gateErr').hidden = false; $('#gateErr').textContent = '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요'; return; }
  sb = BB.sb;

  /* ---------- PIN 입장 ---------- */
  var boxes = $$('#gateForm .pin input');
  function gateReset() { boxes.forEach(function (b) { b.value = ''; b.disabled = false; }); boxes[0].focus(); }
  boxes.forEach(function (inp, i) {
    inp.addEventListener('input', async function () {
      var digits = inp.value.replace(/\D/g, '').split('');   // 붙여넣기·자동완성으로 여러 자리가 한 번에 들어오면 다음 칸으로 나눠 담는다
      inp.value = digits.shift() || '';
      for (var k = i + 1; k < boxes.length && digits.length; k++) boxes[k].value = digits.shift();
      var next = boxes.find(function (b) { return !b.value; });
      if (inp.value) (next || boxes[boxes.length - 1]).focus();
      var pin = boxes.map(function (b) { return b.value; }).join('');
      if (pin.length < 4) return;
      boxes.forEach(function (b) { b.disabled = true; });
      try {
        await BB.login(pin); enter();
      } catch (err) {
        var info = err.info || {}, msg = $('#gateErr');
        msg.hidden = false;
        msg.textContent = info.error === 'locked' ? '여러 번 틀려서 잠겼어요. ' + info.minutes + '분 뒤에 다시 해 주세요'
          : info.error === 'wrong' ? 'PIN이 맞지 않아요 (남은 기회 ' + info.left + '번)' : '로그인하지 못했어요. 잠시 후 다시 해 주세요';
        $('#gateForm').classList.add('shake');
        setTimeout(function () { $('#gateForm').classList.remove('shake'); gateReset(); }, 450);
      }
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !inp.value && boxes[i - 1]) boxes[i - 1].focus(); });
  });

  BB.ready.then(function () { if (BB.admin) enter(); else gateReset(); });

  async function enter() {
    $('#gate').remove(); document.body.classList.remove('locked');
    UI.applyContent(document);
    var hash = location.hash.slice(1);
    if (hash) { var t = $('[data-tab="' + hash + '"][data-group="view"]'); if (t) t.click(); }
    await loadAll();
  }
  window.addEventListener('hashchange', function () {
    var t = $('[data-tab="' + location.hash.slice(1) + '"][data-group="view"]'); if (t && !t.classList.contains('on')) t.click();
  });
  async function logout() { await BB.logout(); location.href = 'index.html'; }
  ['#logoutBtn2', '#logoutBtn3'].forEach(function (s) { $(s).addEventListener('click', logout); });
  $('#refreshBtn').addEventListener('click', function () { loadAll().then(function () { UI.toast('새로 불러왔어요'); }); });

  /* ---------- 불러오기 ---------- */
  async function loadAll() {
    var r = await Promise.all([
      sb.from('cat_brands').select('*').order('sort').order('created_at'),
      sb.from('cat_products').select('*').order('sort').order('created_at'),
      sb.from('cat_product_prices').select('*'),
      sb.from('cat_sellers').select('*').order('created_at', { ascending: false }),
      sb.from('cat_requests').select('*').order('created_at', { ascending: false }),
      sb.from('cat_content').select('*').order('key'),
      sb.from('cat_categories').select('*').order('sort').order('created_at')
    ]);
    var bad = r.find(function (x) { return x.error; });
    if (bad) { console.warn(bad.error); UI.toast('불러오지 못한 항목이 있어요'); }
    D.brands = r[0].data || []; D.products = r[1].data || []; D.prices = {};
    (r[2].data || []).forEach(function (p) { D.prices[p.product_id] = p; });
    D.sellers = r[3].data || []; D.requests = r[4].data || []; D.content = r[5].data || []; D.cats = r[6].data || [];
    renderAll();
  }
  function renderAll() { fillKakao(); renderDash(); renderBrands(); renderProducts(); renderSellers(); renderKanban(); renderContent(); renderCats(); applySearch(); }
  function brandName(id) { var b = D.brands.find(function (x) { return x.id === id; }); return b ? (b.name || '(이름 없음)') : '–'; }
  function productName(id) { var p = D.products.find(function (x) { return x.id === id; }); return p ? (p.name || '(이름 없음)') : null; }
  function dateStr(iso) { return new Date(iso).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' }); }
  function thumb(url, round) { return '<div class="img thumb' + (round ? ' round' : '') + '">' + (url ? '<img alt="" src="' + esc(url) + '">' : UI.svg('image')) + '</div>'; }
  function slugOk(s) { return s && /^[a-z0-9-]+$/.test(s); }

  /* ---------- 대시보드 ---------- */
  function renderDash() {
    var pend = D.sellers.filter(function (s) { return s.status === 'pending'; });
    var newReq = D.requests.filter(function (q) { return q.status === 'new'; });
    $('#kBrands').textContent = D.brands.length;
    $('#kBrandsSub').textContent = '노출 ' + D.brands.filter(function (b) { return b.visible; }).length;
    $('#kProducts').textContent = D.products.length;
    $('#kProductsSub').textContent = '노출 ' + D.products.filter(function (p) { return p.visible; }).length;
    $('#kSellers').textContent = pend.length;
    $('#kSellersSub').textContent = '전체 ' + D.sellers.length;
    $('#kApps').textContent = newReq.length;
    $('#kAppsSub').textContent = '전체 ' + D.requests.length;
    [['#cntSellers', pend.length], ['#cntApps', newReq.length]].forEach(function (c) { var el = $(c[0]); el.textContent = c[1]; el.hidden = !c[1]; });

    var days = [], counts = [];
    for (var i = 13; i >= 0; i--) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); days.push(d); counts.push(0); }
    D.sellers.concat(D.requests).forEach(function (x) {
      var t = new Date(x.created_at); t.setHours(0, 0, 0, 0);
      var idx = days.findIndex(function (d) { return d.getTime() === t.getTime(); }); if (idx >= 0) counts[idx]++;
    });
    var max = Math.max.apply(null, counts.concat([1]));
    $('#chart').innerHTML = counts.map(function (c, i) {
      return '<span class="bar' + (c ? '' : ' zero') + '" style="height:' + Math.max(4, Math.round(c / max * 100)) + '%" title="' + (days[i].getMonth() + 1) + '/' + days[i].getDate() + ' · ' + c + '건">' + (c ? '<em>' + c + '</em>' : '') + '</span>';
    }).join('');
    $('#chartX').innerHTML = days.map(function (d, i) { return '<span>' + (i % 2 ? '' : (d.getMonth() + 1) + '/' + d.getDate()) + '</span>'; }).join('');

    $('#pendingList').innerHTML = pend.slice(0, 6).map(function (s) {
      return '<div class="list-row" data-id="' + s.id + '"><span class="avatar"></span><span class="grow"><b>' + esc(s.name || '(이름 없음)') + '</b><small class="muted">' + esc(TYPE[s.seller_type] || '') + ' · ' + BB.ago(s.created_at) + '</small></span>' +
        '<button class="btn soft sm" data-seller-st="approved" title="승인">' + UI.svg('check') + '</button><button class="btn btn-del sm" data-seller-del>' + UI.svg('trash') + '</button></div>';
    }).join('') || '<p class="muted empty">대기 중인 셀러가 없어요</p>';
    $('#recentRows').innerHTML = D.requests.slice(0, 6).map(function (q) {
      return '<tr><td>' + esc(q.company || '–') + '</td><td>' + esc(q.contact_name || '') + '</td><td>' + esc(q.phone || '') + '</td><td>' + (q.kind === 'custom' ? '문의' : '공구 신청') + '</td><td><span class="badge accent">' + RQ[q.status] + '</span></td><td>' + BB.ago(q.created_at) + '</td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted empty">아직 들어온 신청이 없어요</td></tr>';
  }

  /* ---------- 브랜드 ---------- */
  function renderBrands() {
    $('#brandRows').innerHTML = D.brands.map(function (b) {
      var n = D.products.filter(function (p) { return p.brand_id === b.id; }).length;
      var href = 'brand.html?b=' + encodeURIComponent(slugOk(b.slug) ? b.slug : b.id);
      return '<tr data-id="' + b.id + '" data-search="' + esc((b.name || '') + ' ' + (b.category || '')) + '"><td><input type="checkbox" aria-label="선택"></td>' +
        '<td><div class="cell-main">' + thumb(b.logo_url, true) + '<div class="stack"><b>' + esc(b.name || '(이름 없음)') + '</b><small class="muted">' + esc(b.one_liner || '') + '</small></div></div></td>' +
        '<td>' + (b.category ? '<span class="badge accent">' + esc(b.category) + '</span>' : '<span class="muted">–</span>') + '</td>' +
        '<td class="r">' + n + '</td>' +
        '<td><button class="switch" data-db data-vis="cat_brands" aria-checked="' + b.visible + '" aria-label="노출"></button></td>' +
        '<td>' + dateStr(b.updated_at) + '</td>' +
        '<td><div class="actions"><a class="btn sm" href="' + href + '&edit=1" title="페이지에서 편집"><i data-i="eye"></i>페이지에서 편집</a>' +
        '<button class="btn sm" data-edit-brand title="정보 수정"><i data-i="edit"></i></button><button class="btn btn-del sm" data-row-del="cat_brands"><i data-i="trash"></i>삭제</button></div></td></tr>';
    }).join('') || '<tr><td colspan="7" class="muted empty">아직 브랜드가 없어요. 오른쪽 위 \'브랜드 추가\'를 눌러 주세요</td></tr>';
    UI.hydrate($('#brandRows'));
    var chips = $('#prodBrandChips'), cur = chips.dataset.cur || '';
    chips.innerHTML = '<button class="chip' + (cur ? '' : ' on') + '" data-bf="">전체</button>' + D.brands.map(function (b) {
      return '<button class="chip' + (cur === b.id ? ' on' : '') + '" data-bf="' + b.id + '">' + esc(b.name || '(이름 없음)') + '</button>';
    }).join('');
  }

  /* ---------- 상품 ---------- */
  function renderProducts() {
    var bf = $('#prodBrandChips').dataset.cur || '';
    var list = D.products.filter(function (p) { return !bf || p.brand_id === bf; });
    $('#productRows').innerHTML = list.map(function (p) {
      var pr = D.prices[p.id] || {};
      var href = 'product.html?p=' + encodeURIComponent(slugOk(p.slug) ? p.slug : p.id);
      return '<tr data-id="' + p.id + '" data-search="' + esc((p.name || '') + ' ' + brandName(p.brand_id)) + '"><td><input type="checkbox" aria-label="선택"></td>' +
        '<td><div class="cell-main">' + thumb((p.images || [])[0]) + '<div class="stack"><b>' + esc(p.name || '(이름 없음)') + '</b><small class="muted">' + esc(p.category || '') + (p.badge ? ' · ' + esc(p.badge) : '') + '</small></div></div></td>' +
        '<td>' + esc(brandName(p.brand_id)) + '</td>' +
        '<td class="r">' + (BB.won(p.price) || '<span class="muted">–</span>') + '</td>' +
        '<td class="r accent-text">' + (BB.won(pr.supply_price) || '<span class="muted">–</span>') + '</td>' +
        '<td class="r">' + (p.stock == null ? '<span class="muted">–</span>' : p.stock) + '</td>' +
        '<td><select class="input mini-select best-select' + (p.best_rank ? ' on' : '') + '" data-best aria-label="BEST 순위"><option value="">자동</option>' + [1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (p.best_rank === n ? ' selected' : '') + '>BEST ' + n + '</option>'; }).join('') + '</select></td>' +
        '<td><button class="switch" data-db data-vis="cat_products" aria-checked="' + p.visible + '" aria-label="노출"></button></td>' +
        '<td><div class="actions"><a class="btn sm" href="' + href + '&edit=1" title="페이지에서 편집"><i data-i="eye"></i>페이지에서 편집</a>' +
        '<button class="btn sm" data-edit-product title="정보 수정"><i data-i="edit"></i></button><button class="btn btn-del sm" data-row-del="cat_products"><i data-i="trash"></i>삭제</button></div></td></tr>';
    }).join('') || '<tr><td colspan="9" class="muted empty">상품이 없어요. 오른쪽 위 \'상품 추가\'를 눌러 주세요</td></tr>';
    UI.hydrate($('#productRows'));
  }

  /* ---------- 셀러 ---------- */
  function renderSellers() {
    var st = $('#sellerChips').dataset.cur || '';
    var list = D.sellers.filter(function (s) { return !st || s.status === st; });
    $('#sellerRows').innerHTML = list.map(function (s) {
      var stl = ST[s.status];
      return '<tr data-id="' + s.id + '" data-search="' + esc((s.name || '') + ' ' + (s.contact_name || '') + ' ' + (s.phone || '')) + '"><td><input type="checkbox" aria-label="선택"></td>' +
        '<td><div class="stack"><b>' + esc(s.name || '(이름 없음)') + '</b>' + (s.channel_url ? '<a class="muted small-link" href="' + esc(/^https?:/.test(s.channel_url) ? s.channel_url : 'https://' + s.channel_url) + '" target="_blank" rel="noopener">' + esc(s.channel_url) + '</a>' : '') + '</div></td>' +
        '<td><span class="badge accent">' + esc(TYPE[s.seller_type] || '–') + '</span>' + (s.business_type ? '<br><small class="muted">' + esc(s.business_type) + '</small>' : '') + '</td>' +
        '<td><div class="stack"><span>' + esc(s.contact_name || '') + '</span><small class="muted">' + esc(s.phone || '') + (s.email ? ' · ' + esc(s.email) : '') + '</small></div></td>' +
        '<td class="memo-cell" title="' + esc(s.memo || '') + '">' + esc(s.memo || '') + '</td>' +
        '<td><span class="badge ' + stl[1] + '">' + stl[0] + '</span></td>' +
        '<td>' + dateStr(s.created_at) + '</td>' +
        '<td><div class="actions">' +
        (s.status !== 'approved' ? '<button class="btn soft sm" data-seller-st="approved"><i data-i="check"></i>승인</button>' : '') +
        (s.status !== 'rejected' ? '<button class="btn sm" data-seller-st="rejected">거절</button>' : '<button class="btn sm" data-seller-st="pending">대기로</button>') +
        '<button class="btn btn-del sm" data-row-del="cat_sellers"><i data-i="trash"></i>삭제</button></div></td></tr>';
    }).join('') || '<tr><td colspan="8" class="muted empty">셀러가 없어요</td></tr>';
    UI.hydrate($('#sellerRows'));
  }

  /* ---------- 공구 신청 칸반 ---------- */
  function renderKanban() {
    $$('#kanban .kcol').forEach(function (col) {
      var items = D.requests.filter(function (q) { return q.status === col.dataset.col; });
      col.querySelector('[data-cnt]').textContent = items.length;
      col.querySelector('.kbox').innerHTML = items.map(function (q) {
        var names = (q.product_ids || []).map(productName).filter(Boolean);
        return '<div class="kcard" data-id="' + q.id + '" data-search="' + esc((q.company || '') + ' ' + (q.contact_name || '') + ' ' + (q.memo || '')) + '">' +
          '<button class="icon-btn del x" data-row-del="cat_requests" aria-label="삭제">' + UI.svg('trash') + '</button>' +
          '<span class="badge ' + (q.kind === 'custom' ? 'warn' : 'accent') + '" style="align-self:flex-start">' + (q.kind === 'custom' ? '커스텀·대량 문의' : '공구 신청') + '</span>' +
          '<b>' + esc(q.company || '(업체명 없음)') + '</b>' +
          '<small>' + esc(q.contact_name || '') + ' · <a href="tel:' + esc(q.phone || '') + '">' + esc(q.phone || '') + '</a></small>' +
          (names.length ? '<div class="chips">' + names.map(function (n) { return '<span class="chip mini">' + esc(n) + '</span>'; }).join('') + '</div>' : '') +
          (q.memo ? '<p class="kmemo">' + esc(q.memo) + '</p>' : '') +
          '<div class="kfoot"><small class="muted">' + BB.ago(q.created_at) + '</small>' +
          '<select class="input mini-select" data-req-st aria-label="상태">' + Object.keys(RQ).map(function (k) { return '<option value="' + k + '"' + (k === q.status ? ' selected' : '') + '>' + RQ[k] + '</option>'; }).join('') + '</select></div></div>';
      }).join('') || '<p class="muted empty">비어 있어요</p>';
    });
  }

  /* ---------- 사이트 문구 ---------- */
  function contentLabel(key) {
    var p = key.split('.')[0];
    return ({ c: '공통', idx: '메인', brand: '브랜드', product: '상품', seller: '셀러' })[p] || p;
  }
  function renderContent() {
    $('#contentCount').textContent = D.content.length + '개';
    $('#contentRows').innerHTML = D.content.map(function (c) {
      var isImg = /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)$/i.test(c.value || '');
      return '<tr data-key="' + esc(c.key) + '"><td><span class="badge">' + contentLabel(c.key) + '</span> <small class="muted">' + esc(c.key) + '</small></td>' +
        '<td>' + (isImg ? thumb(c.value) : '<div class="content-edit" contenteditable="true" spellcheck="false">' + esc(c.value) + '</div>') + '</td>' +
        '<td class="r"><button class="btn btn-del sm" data-content-del><i data-i="trash"></i>비우기</button></td></tr>';
    }).join('') || '<tr><td colspan="3" class="muted empty">아직 저장된 문구가 없어요. \'페이지에서 편집하기\'로 빈칸을 채워 보세요</td></tr>';
    UI.hydrate($('#contentRows'));
  }
  $('#contentRows').addEventListener('focusout', async function (e) {
    var ed = e.target.closest('.content-edit'); if (!ed) return;
    var key = ed.closest('tr').dataset.key, v = ed.innerText.trim(), row = D.content.find(function (c) { return c.key === key; });
    if (!row || v === row.value) return;
    try { await BB.saveContent(key, v); row.value = v; UI.toast('저장했어요'); if (!v) loadAll(); } catch (err) { UI.toast('저장하지 못했어요'); }
  });

  /* ---------- 카테고리 ---------- */
  function renderCats() {
    $('#catRows').innerHTML = D.cats.map(function (c) {
      var n = D.products.filter(function (p) { return p.category === c.name; }).length;
      return '<div class="repeat-row" data-cid="' + c.id + '"><input class="input" value="' + esc(c.name) + '" aria-label="카테고리 이름"><small class="muted" style="white-space:nowrap">상품 ' + n + '</small>' +
        '<button class="btn btn-del sm" data-cat-del><i data-i="trash"></i>삭제</button></div>';
    }).join('') || '<p class="muted empty">카테고리가 없어요</p>';
    UI.hydrate($('#catRows'));
    $('#catList').innerHTML = D.cats.map(function (c) { return '<option value="' + esc(c.name) + '"></option>'; }).join('');
  }
  $('#catRows').addEventListener('change', async function (e) {
    var row = e.target.closest('[data-cid]'); if (!row) return;
    var c = D.cats.find(function (x) { return x.id === row.dataset.cid; }), v = e.target.value.trim(), old = c.name;
    if (!v || v === old) { e.target.value = old; return; }
    var r = await sb.from('cat_categories').update({ name: v }).eq('id', c.id);
    if (r.error) { e.target.value = old; UI.toast(/duplicate|unique/.test(r.error.message) ? '이미 있는 카테고리예요' : '바꾸지 못했어요'); return; }
    await sb.from('cat_products').update({ category: v }).eq('category', old);
    c.name = v; D.products.forEach(function (p) { if (p.category === old) p.category = v; });
    renderProducts(); renderCats(); UI.toast('카테고리 이름을 바꿨어요');
  });
  $('#catRows').addEventListener('click', async function (e) {
    if (!e.target.closest('[data-cat-del]')) return;
    var c = D.cats.find(function (x) { return x.id === e.target.closest('[data-cid]').dataset.cid; });
    if (!(await UI.askConfirm('"' + c.name + '" 카테고리를 지울까요? 상품에 적힌 카테고리 이름은 그대로 남아요.'))) return;
    var d = await sb.from('cat_categories').delete().eq('id', c.id);
    if (d.error) { UI.toast('지우지 못했어요'); return; }
    D.cats = D.cats.filter(function (x) { return x.id !== c.id; }); renderCats(); UI.toast('지웠어요');
  });
  $('#catAdd').addEventListener('click', async function () {
    var n = 1; while (D.cats.some(function (x) { return x.name === '새 카테고리' + (n > 1 ? ' ' + n : ''); })) n++;
    var r = await sb.from('cat_categories').insert({ name: '새 카테고리' + (n > 1 ? ' ' + n : ''), sort: D.cats.length + 1 }).select().single();
    if (r.error) { UI.toast('추가하지 못했어요'); return; }
    D.cats.push(r.data); renderCats();
    var inp = $('#catRows [data-cid="' + r.data.id + '"] input'); if (inp) { inp.focus(); inp.select(); }
  });
  async function ensureCategory(name) {                 // 상품에 새 카테고리 이름을 쓰면 목록에도 추가
    if (!name || D.cats.some(function (c) { return c.name === name; })) return;
    var r = await sb.from('cat_categories').insert({ name: name, sort: D.cats.length + 1 }).select().single();
    if (!r.error) D.cats.push(r.data);
  }

  /* ---------- 검색 ---------- */
  function applySearch() {
    var q = ($('#search').value || '').trim().toLowerCase();
    $$('[data-search]').forEach(function (el) { el.hidden = !!q && el.dataset.search.toLowerCase().indexOf(q) < 0; });
  }
  $('#search').addEventListener('input', applySearch);

  /* ---------- 클릭 처리 ---------- */
  document.addEventListener('click', async function (e) {
    var t = e.target;
    var nw = t.closest('[data-new]');
    if (nw) { e.preventDefault(); ({ brand: openBrand, product: openProduct, seller: function () { $('#sellerForm').reset(); $('#dlgSeller').showModal(); } })[nw.dataset.new](); return; }
    if (t.closest('[data-edit-brand]')) { openBrand(D.brands.find(function (b) { return b.id === t.closest('tr').dataset.id; })); return; }
    if (t.closest('[data-edit-product]')) { openProduct(D.products.find(function (p) { return p.id === t.closest('tr').dataset.id; })); return; }

    var bf = t.closest('#prodBrandChips .chip');
    if (bf) { $('#prodBrandChips').dataset.cur = bf.dataset.bf; renderProducts(); applySearch(); return; }
    var sf = t.closest('#sellerChips .chip');
    if (sf) { $('#sellerChips').dataset.cur = sf.dataset.st; renderSellers(); applySearch(); return; }

    var vis = t.closest('[data-vis]');
    if (vis) {
      var on = vis.getAttribute('aria-checked') !== 'true', id = vis.closest('tr').dataset.id;
      vis.setAttribute('aria-checked', on);
      var r = await sb.from(vis.dataset.vis).update({ visible: on }).eq('id', id);
      if (r.error) { vis.setAttribute('aria-checked', !on); UI.toast('바꾸지 못했어요'); return; }
      var arr = vis.dataset.vis === 'cat_brands' ? D.brands : D.products;
      arr.find(function (x) { return x.id === id; }).visible = on;
      UI.toast(on ? '사이트에 보이게 했어요' : '사이트에서 숨겼어요'); renderDash(); return;
    }

    var sst = t.closest('[data-seller-st]');
    if (sst) {
      var sid = sst.closest('[data-id]').dataset.id;
      var r2 = await sb.from('cat_sellers').update({ status: sst.dataset.sellerSt }).eq('id', sid);
      if (r2.error) { UI.toast('바꾸지 못했어요'); return; }
      D.sellers.find(function (s) { return s.id === sid; }).status = sst.dataset.sellerSt;
      UI.toast({ approved: '승인했어요', rejected: '거절했어요', pending: '대기로 돌렸어요' }[sst.dataset.sellerSt]);
      renderDash(); renderSellers(); applySearch(); return;
    }

    var del = t.closest('[data-row-del], [data-seller-del]');
    if (del) {
      var table = del.dataset.rowDel || 'cat_sellers', rid = del.closest('[data-id]').dataset.id;
      var msg = { cat_brands: '이 브랜드를 삭제할까요? 상품은 남고 브랜드 연결만 풀려요.', cat_products: '이 상품을 삭제할까요?', cat_sellers: '이 셀러 신청을 삭제할까요?', cat_requests: '이 신청을 삭제할까요?' }[table];
      if (!(await UI.askConfirm(msg))) return;
      await deleteRows(table, [rid]); return;
    }
    var bulk = t.closest('[data-bulk-db]');
    if (bulk) {
      var tbl = bulk.dataset.bulkDb, sel = { cat_brands: '#tblBrands', cat_products: '#tblProducts', cat_sellers: '#tblSellers' }[tbl];
      var ids = $$(sel + ' tbody input:checked').map(function (c) { return c.closest('tr').dataset.id; });
      if (!ids.length || !(await UI.askConfirm(ids.length + '개를 삭제할까요?'))) return;
      await deleteRows(tbl, ids);
      var all = $('[data-check-all="' + sel + '"]'); all.checked = false; UI.syncBulk(all); return;
    }
    var cdel = t.closest('[data-content-del]');
    if (cdel) {
      var key = cdel.closest('tr').dataset.key;
      if (!(await UI.askConfirm('이 문구를 비울까요? 사이트에서 다시 빈칸이 돼요.'))) return;
      try { await BB.saveContent(key, ''); D.content = D.content.filter(function (c) { return c.key !== key; }); renderContent(); UI.toast('비웠어요'); } catch (err) { UI.toast('비우지 못했어요'); }
    }
  });
  async function deleteRows(table, ids) {
    var r = await sb.from(table).delete().in('id', ids);
    if (r.error) { console.warn(r.error); UI.toast('삭제하지 못했어요'); return; }
    var key = { cat_brands: 'brands', cat_products: 'products', cat_sellers: 'sellers', cat_requests: 'requests' }[table];
    D[key] = D[key].filter(function (x) { return ids.indexOf(x.id) < 0; });
    if (table === 'cat_brands') D.products.forEach(function (p) { if (ids.indexOf(p.brand_id) >= 0) p.brand_id = null; });
    renderAll(); UI.toast(ids.length > 1 ? ids.length + '개 삭제했어요' : '삭제했어요');
  }
  document.addEventListener('change', async function (e) {
    var bs = e.target.closest('[data-best]');
    if (bs) {                                            // BEST 1·2·3 지정: 같은 순위를 가진 다른 상품은 먼저 비운다
      var pid = bs.closest('tr').dataset.id, rank = bs.value ? Number(bs.value) : null;
      var other = rank && D.products.find(function (p) { return p.best_rank === rank && p.id !== pid; });
      if (other) { var c1 = await sb.from('cat_products').update({ best_rank: null }).eq('id', other.id); if (c1.error) { UI.toast('바꾸지 못했어요'); renderProducts(); return; } other.best_rank = null; }
      var r1 = await sb.from('cat_products').update({ best_rank: rank }).eq('id', pid);
      if (r1.error) { console.warn(r1.error); UI.toast('바꾸지 못했어요'); renderProducts(); return; }
      D.products.find(function (p) { return p.id === pid; }).best_rank = rank;
      renderProducts(); applySearch();
      UI.toast(rank ? 'BEST ' + rank + '(으)로 지정했어요' + (other ? ' · 원래 ' + rank + '위였던 상품은 자동으로 돌렸어요' : '') : '자동 순위로 돌렸어요');
      return;
    }
    var s = e.target.closest('[data-req-st]'); if (!s) return;
    var id = s.closest('[data-id]').dataset.id;
    var r = await sb.from('cat_requests').update({ status: s.value }).eq('id', id);
    if (r.error) { UI.toast('바꾸지 못했어요'); return; }
    D.requests.find(function (q) { return q.id === id; }).status = s.value;
    renderKanban(); renderDash(); applySearch(); UI.toast(RQ[s.value] + '(으)로 옮겼어요');
  });

  /* ---------- 폼 공통 ---------- */
  var listFields = ['tags', 'options'];
  function fillForm(form, rec) {
    form.reset();
    $$('[name]', form).forEach(function (f) {
      var v = rec[f.name];
      if (Array.isArray(v)) v = v.join(', ');
      f.value = v == null ? '' : v;
    });
  }
  function readForm(form) {
    var row = {};
    $$('[name]', form).forEach(function (f) {
      var v = f.value.trim();
      if (listFields.indexOf(f.name) >= 0) row[f.name] = v ? v.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
      else if (f.type === 'number') row[f.name] = v === '' ? null : Number(v);
      else row[f.name] = v === '' ? null : v;
    });
    return row;
  }
  async function uploadInto(file, folder) {
    UI.toast('사진 올리는 중…');
    try { return await BB.upload(file, folder); } catch (err) { console.warn(err); UI.toast('사진을 올리지 못했어요'); return null; }
  }

  /* ---------- 브랜드 창 ---------- */
  var editingBrand = null, brandImgs = {};
  function openBrand(b) {
    editingBrand = b || null; brandImgs = { logo_url: b ? b.logo_url : null, cover_url: b ? b.cover_url : null };
    $('#brandDlgTitle').textContent = b ? '브랜드 수정' : '브랜드 추가';
    fillForm($('#brandForm'), b || { sort: D.brands.length + 1 });
    $$('#brandForm [data-up]').forEach(function (el) { UI.setImg(el, brandImgs[el.dataset.up]); });
    $('#dlgBrand').showModal();
  }
  $$('#brandForm [data-up-in]').forEach(function (inp) {
    inp.addEventListener('change', async function () {
      var f = inp.files[0]; if (!f) return;
      var url = await uploadInto(f, 'brands'); if (!url) return;
      brandImgs[inp.dataset.upIn] = url; UI.setImg($('#brandForm [data-up="' + inp.dataset.upIn + '"]'), url); UI.toast('사진을 올렸어요');
    });
  });
  $('#brandForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var row = Object.assign(readForm(this), brandImgs);
    if (row.slug && !slugOk(row.slug)) { UI.toast('주소는 영문 소문자·숫자·- 만 쓸 수 있어요'); return; }
    var r = editingBrand ? await sb.from('cat_brands').update(row).eq('id', editingBrand.id) : await sb.from('cat_brands').insert(row);
    if (r.error) { console.warn(r.error); UI.toast(/duplicate|unique/.test(r.error.message) ? '이미 쓰는 주소예요. 다른 주소를 넣어 주세요' : '저장하지 못했어요'); return; }
    $('#dlgBrand').close(); UI.toast('저장했어요'); loadAll();
  });

  /* ---------- 상품 창 ---------- */
  var editingProduct = null, prodImgs = [];
  function renderProdImgs() {
    var box = $('#prodImgs');
    box.innerHTML = prodImgs.map(function (u, i) {
      return '<div class="thumb-item" data-i="' + i + '"><div class="img"><img alt="" src="' + esc(u) + '"></div><button type="button" class="x" aria-label="삭제">' + UI.svg('x') + '</button></div>';
    }).join('') + '<label class="add-tile"><span class="plus">' + UI.svg('plus') + '</span>추가<input type="file" accept="image/*" multiple hidden></label>';
    box.querySelector('input').onchange = async function () {
      for (var i = 0; i < this.files.length; i++) { var url = await uploadInto(this.files[i], 'products'); if (url) prodImgs.push(url); }
      renderProdImgs(); UI.toast('사진을 올렸어요');
    };
    $$('.thumb-item .x', box).forEach(function (x) { x.onclick = function () { prodImgs.splice(+x.parentNode.dataset.i, 1); renderProdImgs(); }; });
  }
  function openProduct(p) {
    editingProduct = p || null; prodImgs = p ? (p.images || []).slice() : [];
    $('#productDlgTitle').textContent = p ? '상품 수정' : '상품 추가';
    $('#brandSelect').innerHTML = '<option value="">브랜드 없음</option>' + D.brands.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name || '(이름 없음)') + '</option>'; }).join('');
    var pr = p ? (D.prices[p.id] || {}) : {};
    var bfCur = $('#prodBrandChips').dataset.cur || '';
    fillForm($('#productForm'), Object.assign({ sort: D.products.length + 1, brand_id: bfCur }, p || {}, { supply_price: pr.supply_price, moq: pr.moq, margin_note: pr.margin_note }));
    renderProdImgs();
    $('#dlgProduct').showModal();
  }
  $('#productForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var row = readForm(this);
    var price = { supply_price: row.supply_price, moq: row.moq, margin_note: row.margin_note };
    delete row.supply_price; delete row.moq; delete row.margin_note;
    row.images = prodImgs;
    if (row.slug && !slugOk(row.slug)) { UI.toast('주소는 영문 소문자·숫자·- 만 쓸 수 있어요'); return; }
    var r = editingProduct ? await sb.from('cat_products').update(row).eq('id', editingProduct.id).select().single()
      : await sb.from('cat_products').insert(row).select().single();
    if (r.error) { console.warn(r.error); UI.toast(/duplicate|unique/.test(r.error.message) ? '이미 쓰는 주소예요. 다른 주소를 넣어 주세요' : '저장하지 못했어요'); return; }
    await ensureCategory(row.category);
    var r2 = await sb.from('cat_product_prices').upsert(Object.assign({ product_id: r.data.id }, price));
    if (r2.error) { console.warn(r2.error); UI.toast('상품은 저장됐지만 공급가를 저장하지 못했어요'); }
    else UI.toast('저장했어요');
    $('#dlgProduct').close(); loadAll();
  });

  /* ---------- 셀러 창 ---------- */
  $('#sellerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var row = readForm(this); row.status = 'approved';
    var r = await sb.from('cat_sellers').insert(row);
    if (r.error) { console.warn(r.error); UI.toast('추가하지 못했어요'); return; }
    $('#dlgSeller').close(); UI.toast('셀러를 추가했어요'); loadAll();
  });

  /* ---------- 카카오 채널 버튼 ---------- */
  function fillKakao() {
    var f = $('#kakaoForm'); f.url.value = BB.content['c.kakao.url'] || ''; f.label.value = BB.content['c.kakao.label'] || '';
  }
  $('#kakaoForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var url = this.url.value.trim(), label = this.label.value.trim();
    if (url && !/^https?:\/\//.test(url)) url = 'https://' + url;
    try { await BB.saveContent('c.kakao.url', url); await BB.saveContent('c.kakao.label', label); this.url.value = url; UI.toast(url ? '카카오 채널 버튼을 저장했어요' : '카카오 버튼을 숨겼어요'); loadAll(); }
    catch (err) { console.warn(err); UI.toast('저장하지 못했어요'); }
  });

  /* ---------- PIN 변경 ---------- */
  $('#pinForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var pin = this.pin.value.trim(), np = this.new_pin.value.trim();
    if (!/^\d{4,8}$/.test(np)) { UI.toast('새 PIN은 숫자 4~8자리로 넣어 주세요'); return; }
    try { await BB.changePin(pin, np); this.reset(); UI.toast('PIN을 바꿨어요. 다음 입장부터 새 PIN을 써 주세요'); }
    catch (err) { var i = err.info || {}; UI.toast(i.error === 'wrong' ? '지금 PIN이 맞지 않아요' : i.error === 'locked' ? '여러 번 틀려서 잠겼어요. 잠시 후 다시 해 주세요' : 'PIN을 바꾸지 못했어요'); }
  });
})();
