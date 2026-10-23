/* 브라이트비드 공구 제안관 — 빈칸 템플릿 공통 스크립트
   - [data-part]  : 헤더·푸터·공구신청창·도구막대를 끼워 넣는다
   - [data-repeat]: <template> 을 N번 복제해서 카드·행을 채운다
   - [data-add] / [data-del] / [data-bulk-del] : 추가·삭제 (삭제는 되돌리기 가능)
   실제 데이터 연결 전 디자인 확인용이라 저장은 하지 않는다. */
(function () {
  'use strict';

  var P = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.2 6.2 0 0 1 3.5 5.8"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
    box: '<path d="M3 7.5l9-4.5 9 4.5-9 4.5-9-4.5zM3 7.5v9l9 4.5 9-4.5v-9M12 12v9"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3v-6zM3 13h5l1 3h6l1-3h5"/>',
    file: '<path d="M14 3H6v18h12V7l-4-4zM14 3v4h4"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 21h4"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    store: '<path d="M4 9l1.2-5h13.6L20 9M4 9h16v11H4zM9.5 20v-6h5v6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
    filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3.2"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" ' + P + '>' + (ICONS[name] || '') + '</svg>'; }

  function hydrate(root) {
    root.querySelectorAll('i[data-i]:empty').forEach(function (el) { el.innerHTML = svg(el.dataset.i); });
    root.querySelectorAll('.img').forEach(function (el) { if (!el.children.length) el.innerHTML = svg('image'); });
    root.querySelectorAll('[data-r]').forEach(function (el) {    // data-r="40-90" → 너비를 40~90% 사이로 흩뜨려 복제 티를 줄인다
      var m = el.dataset.r.split('-'); var a = +m[0], b = +m[1];
      el.style.setProperty('--w', Math.round(a + Math.random() * (b - a)) + '%');
    });
    if (document.body.classList.contains('edit')) root.querySelectorAll('.t').forEach(function (t) { t.contentEditable = 'true'; });
  }

  /* ---------- 공통 조각 ---------- */
  var T = function (w) { return '<span class="t" style="--w:' + w + '"></span>'; };
  var PARTS = {
    header:
      '<header class="top"><div class="wrap">' +
      '<a class="logo" href="index.html"><span class="img"></span>' + T('6.5em') + '</a>' +
      '<nav class="top-nav">' +
      '<a class="btn ghost sm hide-m" href="index.html#brands">' + T('3em') + '</a>' +
      '<a class="btn ghost sm hide-m" href="index.html#products">' + T('3em') + '</a>' +
      '<a class="btn sm hide-m" href="index.html#seller"><i data-i="users"></i>' + T('3.5em') + '</a>' +
      '<a class="btn soft sm" href="seller.html"><i data-i="lock"></i>' + T('3.5em') + '</a>' +
      '<a class="btn ghost sm" href="admin.html" aria-label="관리자"><i data-i="gear"></i>' + T('2.5em') + '</a>' +
      '</nav></div></header>',
    footer:
      '<footer class="site"><div class="wrap">' +
      '<div><a class="logo" href="index.html"><span class="img"></span>' + T('6.5em') + '</a>' +
      '<p class="lines" style="margin-top:14px"><span class="t" style="--w:90%"></span><span class="t" style="--w:70%"></span><span class="t" style="--w:50%"></span></p></div>' +
      [1, 2, 3].map(function () {
        return '<div><h5>' + T('4em') + '</h5><p class="lines"><span class="t" data-r="40-70"></span><span class="t" data-r="40-70"></span><span class="t" data-r="40-70"></span></p></div>';
      }).join('') +
      '</div></footer>',
    apply:
      '<div class="sticky-apply" id="stickyApply"><span class="count" id="wishCount">0</span>' + T('7em') +
      '<button class="btn primary sm" data-open="#applyDlg">' + T('4em') + '</button></div>' +
      '<dialog id="applyDlg"><div class="d-head"><h3>' + T('8em') + '</h3>' +
      '<button class="icon-btn" data-close aria-label="닫기"><i data-i="x"></i></button></div>' +
      '<div class="d-body"><p class="lines" style="color:var(--ink-2)"><span class="t" style="--w:85%"></span></p>' +
      '<div class="picked" id="picked"></div>' +
      '<div class="field"><label>' + T('5em') + '<span class="req">*</span></label><input class="input"></div>' +
      '<div class="row-2"><div class="field"><label>' + T('4em') + '<span class="req">*</span></label><input class="input"></div>' +
      '<div class="field"><label>' + T('4em') + '<span class="req">*</span></label><input class="input"></div></div>' +
      '<div class="field"><label>' + T('3em') + '</label><textarea class="input"></textarea></div>' +
      '<label class="check"><input type="checkbox">' + T('16em') + '</label></div>' +
      '<div class="d-foot"><button class="btn" data-close>' + T('3em') + '</button>' +
      '<button class="btn primary" data-close data-toast="신청이 접수됐어요 (템플릿)">' + T('5em') + '</button></div></dialog>',
    devbar:
      '<div class="devbar" id="devbar"><button class="dev-toggle" title="접기/펴기"><b>TEMPLATE</b></button>' +
      '<a href="index.html">메인</a><a href="brand.html">브랜드</a><a href="product.html">상품</a>' +
      '<a href="seller.html">셀러 전용</a><a href="admin.html">관리자</a><span class="sep"></span>' +
      '<button data-dev="anno" aria-pressed="true">구역 이름</button>' +
      '<button data-dev="edit" aria-pressed="false">빈칸 채워보기</button>' +
      '<button data-dev="theme" aria-pressed="false">다크</button></div>' +
      '<div class="toast" id="toast" role="status"><span id="toastMsg"></span><button id="toastUndo" hidden>되돌리기</button></div>'
  };
  document.querySelectorAll('[data-part]').forEach(function (el) {
    el.outerHTML = el.dataset.part.split(' ').map(function (k) { return PARTS[k] || ''; }).join('');
  });
  document.body.insertAdjacentHTML('beforeend', PARTS.devbar);

  /* ---------- 템플릿 반복 ---------- */
  function cloneTpl(id) { var tpl = document.getElementById(id); return tpl ? tpl.content.firstElementChild.cloneNode(true) : null; }
  function place(box, node, top) {
    var tile = box.querySelector(':scope > .add-tile');
    if (tile) box.insertBefore(node, tile);
    else if (top) box.insertBefore(node, box.firstElementChild);
    else box.appendChild(node);
  }
  document.querySelectorAll('[data-repeat]').forEach(function (box) {
    for (var i = 0; i < +box.dataset.repeat; i++) { var n = cloneTpl(box.dataset.tpl); if (n) place(box, n); }
  });
  hydrate(document);

  /* ---------- 토스트 ---------- */
  var toastEl = document.getElementById('toast'), toastMsg = document.getElementById('toastMsg'), undoBtn = document.getElementById('toastUndo');
  var toastTimer, undoFn = null;
  function toast(msg, undo) {
    toastMsg.textContent = msg; undoFn = undo || null; undoBtn.hidden = !undo;
    toastEl.classList.add('on'); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); undoFn = null; }, undo ? 5000 : 2200);
  }
  undoBtn.addEventListener('click', function () { if (undoFn) undoFn(); undoFn = null; toastEl.classList.remove('on'); });

  /* ---------- 추가·삭제 ---------- */
  function removeItems(items) {
    var saved = items.map(function (el) { return { el: el, parent: el.parentNode, next: el.nextSibling }; });
    items.forEach(function (el) { el.classList.add('removing'); });
    setTimeout(function () { items.forEach(function (el) { el.remove(); el.classList.remove('removing'); }); afterChange(); }, 220);
    toast(items.length > 1 ? items.length + '개 삭제했어요' : '삭제했어요', function () {
      saved.forEach(function (s) { s.parent.insertBefore(s.el, s.next && s.next.parentNode === s.parent ? s.next : null); s.el.classList.add('adding'); });
      afterChange();
    });
  }
  function afterChange() { updateWish(); document.querySelectorAll('[data-check-all]').forEach(syncBulk); }

  document.addEventListener('click', function (e) {
    var body = document.body;
    if (body.classList.contains('edit')) {                       // 편집 모드: 빈칸 클릭은 링크·버튼 동작 대신 글쓰기
      if (e.target.closest('.t')) { e.preventDefault(); return; }
      var im = e.target.closest('.img');
      if (im) { e.preventDefault(); pickImage(im); return; }
    }

    var add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      var box = document.querySelector(add.dataset.add), node = cloneTpl(add.dataset.tpl);
      if (box && node) {
        place(box, node, add.dataset.pos === 'top'); hydrate(node); node.classList.add('adding');
        node.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); toast('추가했어요'); afterChange();
      }
    }
    var del = e.target.closest('[data-del]');
    if (del) { e.preventDefault(); e.stopPropagation(); var it = del.closest('[data-item]'); if (it) removeItems([it]); return; }

    var bulk = e.target.closest('[data-bulk-del]');
    if (bulk) {
      var rows = [].slice.call(document.querySelectorAll(bulk.dataset.bulkDel + ' tbody input[type=checkbox]:checked')).map(function (c) { return c.closest('[data-item]'); });
      if (rows.length) removeItems(rows);
      var all = document.querySelector('[data-check-all="' + bulk.dataset.bulkDel + '"]'); if (all) all.checked = false;
      return;
    }

    var w = e.target.closest('.wish');
    if (w) { e.preventDefault(); e.stopPropagation(); w.setAttribute('aria-pressed', w.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); updateWish(); return; }

    var op = e.target.closest('[data-open]');
    if (op) { e.preventDefault(); var d = document.querySelector(op.dataset.open); if (d) { if (d.id === 'applyDlg') fillPicked(); d.showModal(); } }
    var cl = e.target.closest('[data-close]');
    if (cl) { var dd = cl.closest('dialog'); if (dd) dd.close(); }
    var ts = e.target.closest('[data-toast]');
    if (ts && !add) toast(ts.dataset.toast);
    if (e.target.closest('[data-copy]')) toast('복사했어요 (템플릿)');

    var tab = e.target.closest('[data-tab]');
    if (tab) {
      var g = tab.dataset.group;
      document.querySelectorAll('[data-tab][data-group="' + g + '"]').forEach(function (b) { b.classList.toggle('on', b === tab); });
      document.querySelectorAll('[data-panel][data-group="' + g + '"]').forEach(function (p) { p.hidden = p.dataset.panel !== tab.dataset.tab; });
      if (g === 'view') window.scrollTo({ top: 0 });
    }
    var chip = e.target.closest('[data-single] > .chip, .seg > button, .opt-row > .swatch');
    if (chip && !e.target.closest('.x')) [].forEach.call(chip.parentNode.children, function (c) { c.classList.toggle('on', c === chip); });
    var sw = e.target.closest('.switch');
    if (sw) sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  });

  /* ---------- 표: 전체 선택·일괄 삭제 ---------- */
  function syncBulk(all) {
    var sel = all.dataset.checkAll, boxes = document.querySelectorAll(sel + ' tbody input[type=checkbox]');
    var n = 0; boxes.forEach(function (b) { if (b.checked) n++; b.closest('tr').classList.toggle('sel', b.checked); });
    all.checked = boxes.length > 0 && n === boxes.length; all.indeterminate = n > 0 && n < boxes.length;
    var bar = document.querySelector('[data-bulk-for="' + sel + '"]');
    if (bar) { bar.classList.toggle('on', n > 0); var c = bar.querySelector('.bulk-n'); if (c) c.textContent = n + '개 선택'; }
  }
  document.addEventListener('change', function (e) {
    var all = e.target.closest('[data-check-all]');
    if (all) { document.querySelectorAll(all.dataset.checkAll + ' tbody input[type=checkbox]').forEach(function (b) { b.checked = all.checked; }); syncBulk(all); return; }
    var tb = e.target.closest('table');
    if (tb && tb.id) { var a = document.querySelector('[data-check-all="#' + tb.id + '"]'); if (a) syncBulk(a); }
  });

  /* ---------- 찜 → 공구 신청 ---------- */
  var sticky = document.getElementById('stickyApply'), wishCount = document.getElementById('wishCount');
  function updateWish() {
    if (!sticky) return;
    var n = document.querySelectorAll('.wish[aria-pressed="true"]').length;
    wishCount.textContent = n; sticky.classList.toggle('on', n > 0);
  }
  function fillPicked() {
    var box = document.getElementById('picked'), n = document.querySelectorAll('.wish[aria-pressed="true"]').length;
    box.innerHTML = '';
    for (var i = 0; i < Math.max(n, 1); i++) box.insertAdjacentHTML('beforeend', '<span class="chip">' + T((3 + Math.random() * 3).toFixed(1) + 'em') + '</span>');
  }

  /* ---------- 편집 모드 이미지 넣기 ---------- */
  var fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.hidden = true; document.body.appendChild(fileIn);
  var imgTarget = null;
  function pickImage(el) { imgTarget = el; fileIn.value = ''; fileIn.click(); }
  fileIn.addEventListener('change', function () {
    var f = fileIn.files[0]; if (!f || !imgTarget) return;
    var url = URL.createObjectURL(f); imgTarget.innerHTML = '<img alt="" src="' + url + '">';
  });

  /* ---------- 도구막대 ---------- */
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#devbar a').forEach(function (a) { if (a.getAttribute('href') === page) a.classList.add('cur'); });
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  function setDev(k, on) {
    var b = document.querySelector('[data-dev="' + k + '"]'); if (b) b.setAttribute('aria-pressed', on);
    if (k === 'anno') document.body.classList.toggle('anno-on', on);
    if (k === 'edit') {
      document.body.classList.toggle('edit', on);
      document.querySelectorAll('.t').forEach(function (t) { if (on) t.contentEditable = 'true'; else t.removeAttribute('contenteditable'); });
    }
    if (k === 'theme') document.documentElement.dataset.theme = on ? 'dark' : 'light';
    store.set('bb-dev-' + k, on ? '1' : '0');
  }
  setDev('anno', store.get('bb-dev-anno') !== '0');
  var th = store.get('bb-dev-theme');
  setDev('theme', th === null ? matchMedia('(prefers-color-scheme: dark)').matches : th === '1');
  document.querySelectorAll('[data-dev]').forEach(function (b) {
    b.addEventListener('click', function () { setDev(b.dataset.dev, b.getAttribute('aria-pressed') !== 'true'); });
  });
  var devbar = document.getElementById('devbar');
  devbar.querySelector('.dev-toggle').addEventListener('click', function () { devbar.classList.toggle('min'); });

  /* ---------- 셀러 입장 (템플릿: 아무 값이나 통과) ---------- */
  document.querySelectorAll('.pin input').forEach(function (inp, i, all) {
    inp.addEventListener('input', function () { inp.value = inp.value.replace(/\D/g, '').slice(0, 1); if (inp.value && all[i + 1]) all[i + 1].focus(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !inp.value && all[i - 1]) all[i - 1].focus(); });
  });
  var login = document.getElementById('loginForm');
  if (login) login.addEventListener('submit', function (e) {
    e.preventDefault(); document.getElementById('auth').hidden = true; document.getElementById('dash').hidden = false; window.scrollTo({ top: 0 });
  });
  var logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', function () { document.getElementById('auth').hidden = false; document.getElementById('dash').hidden = true; });

  updateWish();
})();
