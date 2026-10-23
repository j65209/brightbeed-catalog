/* 공구 제안관 — 공개 페이지(메인·브랜드·상품)를 DB 로 채우고, 관리자 편집을 저장한다.
   [data-rec][data-table]  : 레코드 하나의 범위 (data-rec = id)
   [data-f="path"]         : 글자 필드. path 는 "name", "usp.0.title" 처럼 점으로 깊이를 표시
   [data-fi="path"]        : 사진 필드, [data-fh="path"] : 링크 주소 필드
   [data-list="arr"]       : 배열 필드를 템플릿으로 반복 (안쪽 필드는 ".title" 처럼 상대 경로)
   [data-arr-add] / [data-arr-del] : 배열 항목 추가·삭제, [data-db-add] / [data-db-del] : 레코드 추가·삭제 */
(function () {
  'use strict';
  if (!window.BB || !BB.sb) return;
  var sb = BB.sb, page = document.body.dataset.page;
  var recs = { cat_brands: {}, cat_products: {}, cat_product_prices: {} };
  var state = {};
  var rerender = function () {};

  /* ---------- 경로 읽기·쓰기 ---------- */
  function get(obj, path) {
    if (path === '.' || path === '') return obj;
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setIn(rec, path, value) {               // 바뀐 최상위 컬럼 이름과 새 값을 돌려준다
    var parts = path.split('.'), top = parts[0];
    if (parts.length === 1) return [top, value];
    var root = JSON.parse(JSON.stringify(rec[top] == null ? [] : rec[top])), cur = root;
    for (var i = 1; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
    if (Array.isArray(root)) for (var j = 0; j < root.length; j++) if (root[j] == null) root[j] = parts.length > 2 ? {} : '';
    return [top, root];
  }
  function fmt(el, v) {
    if (v == null || v === '') return '';
    if (el.dataset.type === 'won') return BB.won(v);
    return String(v);
  }
  function parse(el, v) {
    if (el.dataset.type === 'won' || el.dataset.type === 'int') { var n = String(v).replace(/[^\d]/g, ''); return n ? parseInt(n, 10) : null; }
    return v === '' ? null : v;
  }
  function slugOk(s) { return s && /^[a-z0-9-]+$/.test(s); }
  function brandHref(b) { return 'brand.html?b=' + encodeURIComponent(slugOk(b.slug) ? b.slug : b.id); }
  function productHref(p) { return 'product.html?p=' + encodeURIComponent(slugOk(p.slug) ? p.slug : p.id); }

  /* ---------- 채우기 ---------- */
  function ownScope(el, scope) { return el.closest('[data-rec]') === scope; }
  function renderLists(scope, rec) {
    scope.querySelectorAll('[data-list]').forEach(function (box) {
      if (!ownScope(box, scope) && box !== scope) return;
      var arr = box.dataset.list, items = get(rec, arr) || [];
      box.querySelectorAll(':scope > [data-idx]').forEach(function (n) { n.remove(); });
      box.querySelectorAll(':scope > .skel-item').forEach(function (n) { n.remove(); });
      items.forEach(function (item, i) {
        var node = UI.cloneTpl(box.dataset.tpl); if (!node) return;
        node.dataset.idx = i;
        [node].concat([].slice.call(node.querySelectorAll('[data-f],[data-fi],[data-fh],[data-arr-del]'))).forEach(function (el) {
          ['f', 'fi', 'fh'].forEach(function (k) {
            var v = el.dataset[k]; if (v === undefined) return;
            el.dataset[k] = v === '.' ? arr + '.' + i : (v.charAt(0) === '.' ? arr + '.' + i + v : v);
          });
          if (el.hasAttribute('data-arr-del')) el.dataset.arrDel = arr;
        });
        UI.place(box, node);
      });
    });
  }
  function fillFields(scope, rec) {
    var els = [scope].concat([].slice.call(scope.querySelectorAll('[data-f],[data-fi],[data-fh]')));
    els.forEach(function (el) {
      if (el !== scope && !ownScope(el, scope)) return;
      if (el.dataset.f !== undefined && document.activeElement !== el) el.textContent = fmt(el, get(rec, el.dataset.f));
      if (el.dataset.fi !== undefined) UI.setImg(el, get(rec, el.dataset.fi));
      if (el.dataset.fh !== undefined) {
        var url = get(rec, el.dataset.fh);
        if (url) { el.href = url; el.target = '_blank'; el.rel = 'noopener'; el.removeAttribute('aria-disabled'); }
        else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); }
      }
    });
  }
  function bindRec(scope, table, rec) {
    scope.dataset.rec = rec.id || rec.product_id; scope.dataset.table = table;
    recs[table][scope.dataset.rec] = rec;
    renderLists(scope, rec); fillFields(scope, rec); UI.hydrate(scope);
  }

  function markVisibility(node, rec) {            // 관리자에게만: 숨긴 항목 표시 + 보이기/숨기기 버튼
    if (!BB.admin || !node.classList.contains('card')) return;
    node.classList.toggle('is-hidden', rec.visible === false);
    var b = document.createElement('button');
    b.className = 'card-vis'; b.type = 'button'; b.textContent = rec.visible === false ? '보이기' : '숨기기';
    node.appendChild(b);
  }
  function productCard(p, tplId) {
    var node = UI.cloneTpl(tplId || 'tpl-product');
    bindRec(node, 'cat_products', p);
    markVisibility(node, p);
    if (node.tagName === 'A') node.href = productHref(p);
    var w = node.querySelector('.wish'); if (w) { w.dataset.pid = p.id; w.dataset.pname = p.name || ''; }
    var bn = node.querySelector('[data-brand-name]'); if (bn) bn.textContent = (state.brandMap && state.brandMap[p.brand_id] && state.brandMap[p.brand_id].name) || '';
    if (p.category) node.dataset.cat = p.category;
    return node;
  }
  function brandCard(b) {
    var node = UI.cloneTpl('tpl-brand');
    bindRec(node, 'cat_brands', b);
    markVisibility(node, b);
    node.href = brandHref(b);
    var cnt = node.querySelector('[data-count]'); if (cnt) cnt.textContent = '상품 ' + (state.products || []).filter(function (p) { return p.brand_id === b.id; }).length;
    return node;
  }
  function fillGrid(box, items, make) {
    if (!box) return;
    box.querySelectorAll(':scope > [data-rec], :scope > .skel-item').forEach(function (n) { n.remove(); });
    if (!BB.admin) items = items.filter(function (it) { return it.name && String(it.name).trim(); });   // 손님에게는 이름 없는(작성 중) 항목을 숨긴다
    if (!items.length) {                            // 데이터가 없으면 관리자에게만 빈칸 카드를 보여 준다
      if (!BB.admin) return;
      for (var i = 0; i < (+box.dataset.repeat || 0); i++) { var s = UI.cloneTpl(box.dataset.tpl); s.classList.add('skel-item'); s.removeAttribute('href'); UI.place(box, s); }
      UI.hydrate(box); return;
    }
    items.forEach(function (it) { UI.place(box, make(it)); });
    UI.syncWishButtons(box);
  }

  /* ---------- 데이터 불러오기 ---------- */
  async function loadBrands() {
    var r = await sb.from('cat_brands').select('*').order('sort').order('created_at');
    state.brands = r.data || []; state.brandMap = {};
    state.brands.forEach(function (b) { state.brandMap[b.id] = b; });
  }
  async function loadProducts(filter) {
    var q = sb.from('cat_products').select('*').order('sort').order('created_at');
    if (filter) q = filter(q);
    var r = await q; return r.data || [];
  }
  function findBy(list, key) {
    if (!key) return list[0];
    return list.find(function (x) { return x.slug === key || x.id === key; });
  }

  /* ---------- 메인 ---------- */
  async function initIndex() {
    await loadBrands(); state.products = await loadProducts(); await loadCats();
    rerender = function () {
      fillGrid(document.getElementById('brandGrid'), state.brands, brandCard);
      fillGrid(document.getElementById('productGrid'), state.products, function (p) { return productCard(p); });
      renderCats();
      renderBest().catch(function (e) { console.warn('[best]', e); });
    };
    rerender();
    if (BB.admin) adminSummary();
  }
  /* ---------- 히어로 BEST 1·2·3 (최근 30일 공구 신청 많은 순, DB 함수 cat_best_products) ---------- */
  async function renderBest() {
    var box = document.getElementById('bestBox'); if (!box) return;
    var r = await sb.rpc('cat_best_products', { n: 3 });
    if (r.error || !(r.data || []).length) return;               // 상품이 없으면 빈칸 카드 그대로
    var byId = {}; (state.products || []).forEach(function (p) { byId[p.id] = p; });
    box.innerHTML = '';
    r.data.forEach(function (row, i) {
      var p = byId[row.product_id]; if (!p || !(p.name || '').trim()) return;
      var a = document.createElement('a');
      a.className = 'best-card'; a.href = productHref(p);
      a.innerHTML = '<div class="img"></div><span class="best-rank">BEST ' + (i + 1) + '</span>' +
        '<div class="best-info"><small></small><b></b><span></span></div>';
      UI.setImg(a.querySelector('.img'), (p.images || [])[0]);
      var b = state.brandMap && state.brandMap[p.brand_id];
      a.querySelector('small').textContent = b ? (b.name || '') : '';
      a.querySelector('b').textContent = p.name || '';
      a.querySelector('.best-info span').textContent = p.summary || '';   // 메인에서는 가격 대신 간단한 설명
      box.appendChild(a);
    });
  }
  /* ---------- 카테고리 칩 (cat_categories). 관리자 편집 모드에서 이름 바꾸기·추가·삭제 ---------- */
  async function loadCats() {
    var r = await sb.from('cat_categories').select('*').order('sort').order('created_at');
    state.cats = r.data || [];
  }
  function renderCats() {
    var box = document.getElementById('catChips'); if (!box) return;
    if (!state.cats.length && !BB.admin) return;                 // 카테고리가 없으면 예시 칩 그대로
    var cur = box.dataset.cur || '';
    box.innerHTML = '';
    var all = document.createElement('button'); all.className = 'chip' + (cur ? '' : ' on'); all.dataset.cat = ''; all.textContent = '전체'; box.appendChild(all);
    state.cats.forEach(function (c) {
      var b = document.createElement('button'); b.className = 'chip' + (cur === c.name ? ' on' : ''); b.dataset.cat = c.name; b.dataset.cid = c.id;
      b.innerHTML = '<span class="t" data-cat-name></span><span class="icon-btn del chip-x cat-del" role="button" aria-label="카테고리 삭제">' + UI.svg('x') + '</span>';
      b.firstChild.textContent = c.name; box.appendChild(b);
    });
    if (BB.admin) box.insertAdjacentHTML('beforeend', '<button class="chip cat-add admin-only">' + UI.svg('plus') + '카테고리 추가</button>');
    if (document.body.classList.contains('edit')) UI.setEditable(box, true);
    applyCatFilter();
  }
  function applyCatFilter() {
    var cur = (document.getElementById('catChips') || {}).dataset ? document.getElementById('catChips').dataset.cur || '' : '';
    document.querySelectorAll('#productGrid > [data-rec]').forEach(function (n) { n.hidden = !!cur && n.dataset.cat !== cur; });
  }
  async function saveCategory(el, v) {
    var chip = el.closest('[data-cid]'), c = state.cats.find(function (x) { return x.id === chip.dataset.cid; }), old = c.name;
    if (!v) { el.textContent = old; throw new Error('빈 이름'); }
    var r = await sb.from('cat_categories').update({ name: v }).eq('id', c.id);
    if (r.error) throw r.error;
    await sb.from('cat_products').update({ category: v }).eq('category', old);   // 그 카테고리였던 상품도 같이 바꾼다
    c.name = v; chip.dataset.cat = v;
    (state.products || []).forEach(function (p) { if (p.category === old) p.category = v; });
    document.querySelectorAll('#productGrid > [data-rec]').forEach(function (n) { if (n.dataset.cat === old) n.dataset.cat = v; });
  }
  document.addEventListener('click', async function (e) {
    var box = document.getElementById('catChips'); if (!box || !box.contains(e.target)) return;
    if (e.target.closest('.cat-del')) {
      e.preventDefault(); e.stopPropagation();
      var chip = e.target.closest('[data-cid]'), c = state.cats.find(function (x) { return x.id === chip.dataset.cid; });
      if (!(await UI.askConfirm('"' + c.name + '" 카테고리를 지울까요? 상품에 적힌 카테고리 이름은 그대로 남아요.'))) return;
      var d = await sb.from('cat_categories').delete().eq('id', c.id);
      if (d.error) { UI.toast('지우지 못했어요'); return; }
      state.cats = state.cats.filter(function (x) { return x.id !== c.id; });
      if (box.dataset.cur === c.name) box.dataset.cur = '';
      renderCats(); UI.toast('카테고리를 지웠어요'); return;
    }
    if (e.target.closest('.cat-add')) {
      e.preventDefault();
      var n = 1; while (state.cats.some(function (x) { return x.name === '새 카테고리' + (n > 1 ? ' ' + n : ''); })) n++;
      var name = '새 카테고리' + (n > 1 ? ' ' + n : '');
      var r = await sb.from('cat_categories').insert({ name: name, sort: state.cats.length + 1 }).select().single();
      if (r.error) { UI.toast('추가하지 못했어요'); return; }
      state.cats.push(r.data); renderCats();
      var el = box.querySelector('[data-cid="' + r.data.id + '"] [data-cat-name]');
      if (el && el.isContentEditable) { el.focus(); document.getSelection().selectAllChildren(el); }
      UI.toast('카테고리를 추가했어요 · 이름을 바로 고쳐 주세요'); return;
    }
    if (document.body.classList.contains('edit') && e.target.closest('[contenteditable="true"]')) return;
    var ch = e.target.closest('.chip[data-cat]');
    if (ch) { box.dataset.cur = ch.dataset.cat; box.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('on', x === ch); }); applyCatFilter(); }
  });
  async function adminSummary() {
    var q = function (t, f) { var x = sb.from(t).select('id', { count: 'exact', head: true }); return (f ? f(x) : x).then(function (r) { return r.count || 0; }); };
    var counts = await Promise.all([q('cat_brands'), q('cat_products'), q('cat_sellers', function (x) { return x.eq('status', 'pending'); }), q('cat_requests', function (x) { return x.eq('status', 'new'); })]);
    document.querySelectorAll('[data-kpi]').forEach(function (el, i) { el.textContent = counts[i]; el.classList.add('filled'); });
    var r = await sb.from('cat_requests').select('*').order('created_at', { ascending: false }).limit(5);
    var box = document.getElementById('adminRecent'); if (!box) return;
    box.innerHTML = '';
    (r.data || []).forEach(function (q2) {
      var n = UI.cloneTpl('tpl-admin-row');
      n.querySelector('[data-x="title"]').textContent = (q2.company || '') + ' · ' + (q2.contact_name || '');
      n.querySelector('[data-x="sub"]').textContent = (q2.kind === 'custom' ? '커스텀 문의 · ' : '공구 신청 · ') + BB.ago(q2.created_at);
      n.querySelector('[data-x="status"]').textContent = { new: '신규', progress: '진행', done: '완료', hold: '보류' }[q2.status];
      box.appendChild(n);
    });
    if (!(r.data || []).length) box.innerHTML = '<p style="color:#8b8e95;font-size:13px;padding:10px 0">아직 들어온 신청이 없어요</p>';
    UI.hydrate(box);
  }

  /* ---------- 브랜드 상세 ---------- */
  async function initBrand() {
    await loadBrands();
    var b = findBy(state.brands, BB.qs('b'));
    var main = document.getElementById('brandMain');
    if (!b) { emptyNotice(main, 'cat_brands'); return; }
    state.products = await loadProducts(function (q) { return q.eq('brand_id', b.id); });
    rerender = function () {
      bindRec(main, 'cat_brands', b);
      fillGrid(document.getElementById('lineGrid'), state.products, function (p) { return productCard(p); });
      var sp = document.getElementById('spList');
      if (sp) { sp.innerHTML = ''; state.products.forEach(function (p) { sp.appendChild(productCard(p, 'tpl-sp')); }); UI.hydrate(sp); }
      embedVideo(document.getElementById('brandVideo'), b.video_url);
      document.title = (b.name || '브랜드') + ' · 브라이트비드 공구';
    };
    rerender();
    adminPanel(main, 'cat_brands', b);
  }

  /* ---------- 상품 상세 ---------- */
  async function initProduct() {
    var key = BB.qs('p');
    var r = key ? await sb.from('cat_products').select('*').or(/^[0-9a-f-]{36}$/.test(key) ? 'id.eq.' + key : 'slug.eq.' + key).limit(1)
      : await sb.from('cat_products').select('*').order('sort').order('created_at').limit(1);
    var p = (r.data || [])[0], main = document.getElementById('productMain');
    if (!p) { emptyNotice(main, 'cat_products'); return; }
    await loadBrands(); await loadCats();
    var brand = state.brandMap[p.brand_id];
    state.products = brand ? (await loadProducts(function (q) { return q.eq('brand_id', brand.id).neq('id', p.id).limit(8); })) : [];
    var price = null;
    if (BB.admin) { var pr = await sb.from('cat_product_prices').select('*').eq('product_id', p.id).maybeSingle(); price = pr.data || { product_id: p.id }; }
    rerender = function () {
      bindRec(main, 'cat_products', p);
      var bl = document.getElementById('brandLink');
      if (bl) { bl.querySelector('.t').textContent = brand ? (brand.name || '') : ''; if (brand) bl.href = brandHref(brand); }
      var back = document.getElementById('backLink'); if (back && brand) back.href = brandHref(brand);
      var w = document.getElementById('mainWish'); if (w) { w.dataset.pid = p.id; w.dataset.pname = p.name || ''; UI.syncWishButtons(); }
      var main1 = document.getElementById('mainImg'); if (main1) UI.setImg(main1, (p.images || [])[0]);
      if (price) bindRec(document.getElementById('priceBox'), 'cat_product_prices', price);
      fillGrid(document.getElementById('relatedGrid'), state.products, function (x) { return productCard(x); });
      document.title = (p.name || '상품') + ' · 브라이트비드 공구';
    };
    rerender();
    adminPanel(main, 'cat_products', p);
    document.getElementById('pThumbs').addEventListener('click', function (e) {      // 썸네일 누르면 큰 사진 바꾸기
      if (document.body.classList.contains('edit')) return;
      var t = e.target.closest('[data-idx]'); if (!t) return;
      UI.setImg(document.getElementById('mainImg'), (p.images || [])[+t.dataset.idx]);
    });
    var applyThis = document.getElementById('applyThis');
    if (applyThis) applyThis.addEventListener('click', function () {
      var w2 = document.getElementById('mainWish'); if (w2 && w2.getAttribute('aria-pressed') !== 'true') w2.click();
      var opener = document.querySelector('#stickyApply [data-open]'); if (opener) opener.click();
    });
  }

  /* ---------- 관리자 관리 막대 (브랜드·상품 상세 위쪽) ---------- */
  function adminPanel(main, table, rec) {
    if (!BB.admin || main.querySelector('.admin-panel')) return;
    var isP = table === 'cat_products', el = document.createElement('div');
    el.className = 'admin-panel'; el.setAttribute('data-noedit', '');
    var brandOpts = (state.brands || []).map(function (b) {
      return '<option value="' + b.id + '"' + (b.id === rec.brand_id ? ' selected' : '') + '>' + (b.name || '(이름 없음)').replace(/</g, '&lt;') + '</option>';
    }).join('');
    var catNames = (state.cats || []).map(function (c) { return c.name; });
    if (rec.category && catNames.indexOf(rec.category) < 0) catNames.push(rec.category);
    var catOpts = catNames.map(function (n) { var e = n.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); return '<option value="' + e + '"' + (n === rec.category ? ' selected' : '') + '>' + e + '</option>'; }).join('');
    el.innerHTML = '<b>관리자</b>' +
      '<label>사이트에 보이기 <button type="button" class="switch" data-db data-ap="visible" aria-checked="' + (rec.visible !== false) + '"></button></label>' +
      (isP ? '<label>브랜드 <select class="input" data-ap="brand_id"><option value="">없음</option>' + brandOpts + '</select></label>' +
             '<label>카테고리 <select class="input" data-ap="category"><option value="">없음</option>' + catOpts + '</select></label>' +
             '<label>재고 <input class="input" type="number" min="0" data-ap="stock" value="' + (rec.stock == null ? '' : rec.stock) + '"></label>' : '') +
      '<label>순서 <input class="input" type="number" data-ap="sort" value="' + (rec.sort == null ? '' : rec.sort) + '"></label>' +
      '<span class="grow"></span>' +
      '<a class="btn sm" href="admin.html#' + (isP ? 'products' : 'brands') + '">관리자 페이지</a>' +
      '<button type="button" class="btn btn-del sm" data-ap-del>' + UI.svg('trash') + '삭제</button>';
    main.prepend(el);
    el.addEventListener('change', async function (e) {
      var f = e.target.dataset.ap; if (!f) return;
      var v = e.target.value === '' ? null : (e.target.type === 'number' ? Number(e.target.value) : e.target.value), patch = {}; patch[f] = v;
      try { await updateRec(table, rec.id, patch); if (f === 'category' || f === 'brand_id') rerender(); UI.toast('저장했어요'); } catch (err) { console.warn(err); UI.toast('저장하지 못했어요'); }
    });
    el.addEventListener('click', async function (e) {
      var sw = e.target.closest('[data-ap="visible"]');
      if (sw) {
        var on = sw.getAttribute('aria-checked') !== 'true';
        try { await updateRec(table, rec.id, { visible: on }); sw.setAttribute('aria-checked', on); UI.toast(on ? '사이트에 보이게 했어요' : '손님에게 숨겼어요'); }
        catch (err) { UI.toast('바꾸지 못했어요'); }
        return;
      }
      if (e.target.closest('[data-ap-del]')) {
        if (!(await UI.askConfirm(isP ? '이 상품을 삭제할까요?' : '이 브랜드를 삭제할까요? 브랜드의 상품은 남아 있어요.'))) return;
        var d = await sb.from(table).delete().eq('id', rec.id);
        if (d.error) { UI.toast('삭제하지 못했어요'); return; }
        var back = isP && rec.brand_id && state.brandMap[rec.brand_id] ? brandHref(state.brandMap[rec.brand_id]) : 'index.html';
        location.href = back;
      }
    });
  }

  function embedVideo(box, url) {
    if (!box) return;
    var m = url && String(url).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
    if (m) box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + m[1] + '" title="영상" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>';
    else box.innerHTML = UI.svg('play');
  }
  function emptyNotice(main, table) {
    if (!BB.admin) return;
    var n = document.createElement('div');
    n.className = 'card'; n.style.cssText = 'padding:18px 20px;margin-top:20px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap';
    n.innerHTML = '<b>' + (table === 'cat_brands' ? '아직 등록된 브랜드가 없어요' : '아직 등록된 상품이 없어요') + '</b>' +
      '<button class="btn btn-add" data-db-add="' + table + '">' + UI.svg('plus') + (table === 'cat_brands' ? '브랜드 추가' : '상품 추가') + '</button>';
    main.prepend(n);
  }

  /* ---------- 저장 ---------- */
  async function updateRec(table, id, patch) {
    var r = table === 'cat_product_prices'
      ? await sb.from(table).upsert(Object.assign({ product_id: id }, patch))
      : await sb.from(table).update(patch).eq('id', id);
    if (r.error) throw r.error;
    Object.assign(recs[table][id], patch);
  }
  window.BBEdit = {
    saveField: async function (el, v) {
      if (el.hasAttribute('data-cat-name')) return saveCategory(el, v);
      var scope = el.closest('[data-rec]'), table = scope.dataset.table, id = scope.dataset.rec, rec = recs[table][id];
      var val = parse(el, v), kv = setIn(rec, el.dataset.f, val), patch = {}; patch[kv[0]] = kv[1];
      await updateRec(table, id, patch);
      el.textContent = fmt(el, val);
      if (el.dataset.f === 'video_url') embedVideo(document.getElementById('brandVideo'), val);
      if (el.dataset.f === 'name' && table === 'cat_products') document.querySelectorAll('.wish[data-pid="' + id + '"]').forEach(function (w) { w.dataset.pname = val || ''; });
    },
    saveImage: async function (el, url) {
      var scope = el.closest('[data-rec]'), table = scope.dataset.table, id = scope.dataset.rec, rec = recs[table][id];
      var kv = setIn(rec, el.dataset.fi, url), patch = {}; patch[kv[0]] = kv[1];
      await updateRec(table, id, patch);
      UI.setImg(el, url);
      if (el.id === 'mainImg' || el.dataset.fi === 'images.0') { var m = document.getElementById('mainImg'); if (m) UI.setImg(m, (rec.images || [])[0]); }
    }
  };

  document.addEventListener('click', async function (e) {
    var vis = e.target.closest('.card-vis');
    if (vis) {
      e.preventDefault(); e.stopPropagation();
      var vc = vis.closest('[data-rec]'), vrec = recs[vc.dataset.table][vc.dataset.rec], von = vrec.visible === false;
      try { await updateRec(vc.dataset.table, vc.dataset.rec, { visible: von }); rerender(); UI.toast(von ? '사이트에 보이게 했어요' : '손님에게 숨겼어요'); }
      catch (err) { console.warn(err); UI.toast('바꾸지 못했어요'); }
      return;
    }
    var spc = e.target.closest('.sp-copy');
    if (spc) {
      var row = spc.closest('.sp-row'), txt = [row.querySelector('[data-f="name"]'), row.querySelector('.sp-text')].map(function (x) { return x ? x.innerText.trim() : ''; }).filter(Boolean).join('\n');
      navigator.clipboard.writeText(txt).then(function () { UI.toast('복사했어요'); }, function () { UI.toast('복사하지 못했어요'); });
      return;
    }
    var add = e.target.closest('[data-arr-add]');
    if (add) {
      e.preventDefault(); e.stopPropagation();
      var scope = add.closest('[data-rec]'); if (!scope) return;
      var table = scope.dataset.table, id = scope.dataset.rec, rec = recs[table][id], arr = add.dataset.arrAdd;
      var item = add.dataset.new ? JSON.parse(add.dataset.new) : '';
      if (add.dataset.image === '1') {                   // 사진 배열은 바로 파일을 고르게 한다
        var url = await pickAndUpload(); if (!url) return; item = url;
      }
      var list = (rec[arr] || []).concat([item]), patch = {}; patch[arr] = list;
      try { await updateRec(table, id, patch); rerender(); UI.toast('추가했어요'); } catch (err) { console.warn(err); UI.toast('추가하지 못했어요'); }
      return;
    }
    var del = e.target.closest('[data-arr-del]');
    if (del) {
      e.preventDefault(); e.stopPropagation();
      var scope2 = del.closest('[data-rec]'), item2 = del.closest('[data-idx]');
      var table2 = scope2.dataset.table, id2 = scope2.dataset.rec, rec2 = recs[table2][id2], arr2 = del.dataset.arrDel;
      var before = (rec2[arr2] || []).slice(), list2 = before.slice(); list2.splice(+item2.dataset.idx, 1);
      var p2 = {}; p2[arr2] = list2;
      try {
        await updateRec(table2, id2, p2); rerender();
        UI.toast('삭제했어요', async function () { var p3 = {}; p3[arr2] = before; await updateRec(table2, id2, p3); rerender(); });
      } catch (err) { console.warn(err); UI.toast('삭제하지 못했어요'); }
      return;
    }
    var dadd = e.target.closest('[data-db-add]');
    if (dadd) {
      e.preventDefault(); e.stopPropagation();
      var t = dadd.dataset.dbAdd, row = { sort: Date.now() % 100000000 };
      if (t === 'cat_products' && page === 'brand' && document.getElementById('brandMain').dataset.rec) row.brand_id = document.getElementById('brandMain').dataset.rec;
      var r = await sb.from(t).insert(row).select().single();
      if (r.error) { console.warn(r.error); UI.toast('추가하지 못했어요'); return; }
      UI.toast((t === 'cat_brands' ? '브랜드' : '상품') + '를 추가했어요 · 편집 모드에서 빈칸을 채워 주세요');
      if (page === 'index') { if (t === 'cat_brands') { state.brands.push(r.data); state.brandMap[r.data.id] = r.data; } else state.products.push(r.data); rerender(); }
      else if (page === 'brand' && t === 'cat_products') { state.products.push(r.data); rerender(); }
      else location.href = t === 'cat_brands' ? brandHref(r.data) + '&edit=1' : productHref(r.data) + '&edit=1';
      return;
    }
    var ddel = e.target.closest('[data-db-del]');
    if (ddel) {
      e.preventDefault(); e.stopPropagation();
      var card = ddel.closest('[data-rec]'); if (!card) { ddel.closest('.skel-item') && ddel.closest('.skel-item').remove(); return; }
      var tb = card.dataset.table, rid = card.dataset.rec;
      var ok = await UI.askConfirm(tb === 'cat_brands' ? '이 브랜드를 삭제할까요? 브랜드의 상품은 남아 있어요.' : '이 상품을 삭제할까요?');
      if (!ok) return;
      var d = await sb.from(tb).delete().eq('id', rid);
      if (d.error) { console.warn(d.error); UI.toast('삭제하지 못했어요'); return; }
      if (state.products) state.products = state.products.filter(function (x) { return x.id !== rid; });
      if (state.brands && tb === 'cat_brands') state.brands = state.brands.filter(function (x) { return x.id !== rid; });
      rerender(); UI.toast('삭제했어요');
    }
  }, true);

  function pickAndUpload() {
    return new Promise(function (resolve) {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = async function () {
        var f = inp.files[0]; if (!f) return resolve(null);
        UI.toast('사진 올리는 중…');
        try { resolve(await BB.upload(f, 'items')); } catch (err) { console.warn(err); UI.toast('사진을 올리지 못했어요'); resolve(null); }
      };
      inp.click();
    });
  }

  BB.ready.then(function () {                       // app.js 가 먼저 등록한 then(문구 채우기) 다음에 실행된다
    var run = { index: initIndex, brand: initBrand, product: initProduct }[page];
    if (run) run().then(function () { if (document.body.classList.contains('edit')) UI.setEditable(document, true); }).catch(function (e) { console.warn('[site]', e); });
  });
})();
