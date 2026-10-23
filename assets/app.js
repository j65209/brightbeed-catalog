/* 브라이트비드 공구 제안관 — 공통 화면 스크립트
   - [data-part]  : 헤더·푸터·공구신청창을 끼워 넣는다
   - [data-k]     : 사이트 문구 빈칸. 값은 cat_content 에서 오고, 관리자 편집 모드에서 바로 고쳐 저장한다
   - [data-ki]    : 사이트 이미지 빈칸 (같은 방식)
   - [data-f] / [data-fi] : 브랜드·상품 레코드 필드 (site.js 가 채우고 저장한다)
   - [data-repeat]: 데이터가 없을 때 보여 줄 빈칸 카드
   - form[data-submit] : 셀러 신청·공구 신청·문의를 DB 에 넣는다 */
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

  function setImg(el, url) {
    if (url) el.innerHTML = '<img alt="" loading="lazy" src="' + String(url).replace(/"/g, '&quot;') + '">';
    else el.innerHTML = svg('image');
    el.classList.toggle('has-img', !!url);
  }
  function hydrate(root) {
    root.querySelectorAll('i[data-i]:empty').forEach(function (el) { el.innerHTML = svg(el.dataset.i); });
    root.querySelectorAll('.img').forEach(function (el) { if (!el.children.length) el.innerHTML = svg('image'); });
    root.querySelectorAll('[data-r]').forEach(function (el) {    // data-r="40-90" → 빈칸 너비를 40~90% 사이로 흩뜨린다
      var m = el.dataset.r.split('-'); var a = +m[0], b = +m[1];
      el.style.setProperty('--w', Math.round(a + Math.random() * (b - a)) + '%');
    });
    if (document.body.classList.contains('edit')) setEditable(root, true);
  }

  /* ---------- 공통 조각 ---------- */
  var T = function (w, k) { return '<span class="t" style="--w:' + w + '"' + (k ? ' data-k="' + k + '"' : '') + '></span>'; };
  var PARTS = {
    header:
      '<header class="top"><div class="wrap">' +
      '<a class="logo" href="index.html"><span class="img" data-ki="c.logo.img"></span>' + T('6.5em', 'c.logo') + '</a>' +
      '<nav class="top-nav">' +
      '<a class="btn sm hide-m" href="vendor.html">' + T('5em', 'c.nav.vendor') + '</a>' +
      '<a class="btn sm hide-m" href="personal.html">' + T('5em', 'c.nav.personal') + '</a>' +
      '<a class="btn sm hide-m" href="partner.html">' + T('4em', 'c.nav.partner') + '</a>' +
      '<a class="btn soft sm" href="seller.html"><i data-i="lock"></i>' + T('3.5em', 'c.nav.sellerLogin') + '</a>' +
      '<a class="btn sm" href="admin.html">' + T('4.5em', 'c.nav.admin') + '</a>' +
      '</nav></div></header>',
    apply:
      '<div class="sticky-apply" id="stickyApply"><span class="count" id="wishCount">0</span>' + T('7em', 'c.sticky.text') +
      '<button class="btn primary sm" data-open="#applyDlg">' + T('4em', 'c.sticky.btn') + '</button></div>' +
      '<dialog id="applyDlg"><form id="applyForm" data-submit="request" data-kind="apply">' +
      '<div class="d-head"><h3>' + T('8em', 'c.apply.title') + '</h3>' +
      '<button type="button" class="icon-btn" data-close aria-label="닫기"><i data-i="x"></i></button></div>' +
      '<div class="d-body"><p class="lines" style="color:var(--ink-2)">' + T('85%', 'c.apply.desc') + '</p>' +
      '<div class="picked" id="picked"></div>' +
      '<div class="field"><label>' + T('5em', 'c.apply.company') + '<span class="req">*</span></label><input class="input" name="company" required></div>' +
      '<div class="row-2"><div class="field"><label>' + T('4em', 'c.apply.name') + '<span class="req">*</span></label><input class="input" name="contact_name" required></div>' +
      '<div class="field"><label>' + T('4em', 'c.apply.phone') + '<span class="req">*</span></label><input class="input" name="phone" type="tel" required></div></div>' +
      '<div class="field"><label>' + T('3em', 'c.apply.memo') + '</label><textarea class="input" name="memo"></textarea></div>' +
      '<label class="check"><input type="checkbox" required>' + T('16em', 'c.apply.agree') + '</label></div>' +
      '<div class="d-foot"><button type="button" class="btn" data-close>' + T('3em', 'c.apply.cancel') + '</button>' +
      '<button type="submit" class="btn primary">' + T('5em', 'c.apply.submit') + '</button></div></form></dialog>'
  };
  document.querySelectorAll('[data-part]').forEach(function (el) {
    el.outerHTML = el.dataset.part.split(' ').map(function (k) { return PARTS[k] || ''; }).join('');
  });
  document.body.insertAdjacentHTML('beforeend',
    '<div class="toast" id="toast" role="status"><span id="toastMsg"></span><button id="toastUndo" hidden>되돌리기</button></div>' +
    '<dialog id="confirmDlg" class="confirm"><div class="d-body" style="padding-top:22px"><p id="confirmMsg" style="font-weight:700"></p></div>' +
    '<div class="d-foot"><button class="btn" value="no">취소</button><button class="btn btn-del" value="yes"><i data-i="trash"></i>삭제</button></div></dialog>');

  /* ---------- 빈칸 카드 반복 ---------- */
  function cloneTpl(id) { var tpl = document.getElementById(id); return tpl ? tpl.content.firstElementChild.cloneNode(true) : null; }
  function place(box, node, top) {
    var tile = box.querySelector(':scope > .add-tile');
    if (tile) box.insertBefore(node, tile);
    else if (top) box.insertBefore(node, box.firstElementChild);
    else box.appendChild(node);
  }
  document.querySelectorAll('[data-repeat]').forEach(function (box) {
    for (var i = 0; i < +box.dataset.repeat; i++) { var n = cloneTpl(box.dataset.tpl); if (n) { n.classList.add('skel-item'); place(box, n); } }
  });
  hydrate(document);

  /* ---------- 토스트·확인창 ---------- */
  var toastEl = document.getElementById('toast'), toastMsg = document.getElementById('toastMsg'), undoBtn = document.getElementById('toastUndo');
  var toastTimer, undoFn = null;
  function toast(msg, undo) {
    toastMsg.textContent = msg; undoFn = undo || null; undoBtn.hidden = !undo;
    toastEl.classList.add('on'); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); undoFn = null; }, undo ? 5000 : 2400);
  }
  undoBtn.addEventListener('click', function () { if (undoFn) undoFn(); undoFn = null; toastEl.classList.remove('on'); });
  var confirmDlg = document.getElementById('confirmDlg');
  function askConfirm(msg) {
    return new Promise(function (resolve) {
      document.getElementById('confirmMsg').textContent = msg;
      confirmDlg.querySelectorAll('button').forEach(function (b) { b.onclick = function () { confirmDlg.close(); resolve(b.value === 'yes'); }; });
      confirmDlg.onclose = function () { resolve(false); };
      confirmDlg.showModal();
    });
  }

  /* ---------- 화면 안에서만 지우는 추가·삭제 (아직 DB 없는 셀러 화면용) ---------- */
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

  /* ---------- 찜 (상품 id 를 브라우저에 기억) ---------- */
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  function wishList() { try { return JSON.parse(store.get('bb-wish') || '[]'); } catch (e) { return []; } }
  function setWishList(a) { store.set('bb-wish', JSON.stringify(a)); }
  function syncWishButtons(root) {
    var ids = wishList().map(function (w) { return w.id; });
    (root || document).querySelectorAll('.wish[data-pid]').forEach(function (b) { b.setAttribute('aria-pressed', ids.indexOf(b.dataset.pid) >= 0); });
  }
  var sticky = document.getElementById('stickyApply'), wishCount = document.getElementById('wishCount');
  function updateWish() {
    if (!sticky) return;
    var n = wishList().length + document.querySelectorAll('.wish:not([data-pid])[aria-pressed="true"]').length;
    wishCount.textContent = n; sticky.classList.toggle('on', n > 0); document.body.classList.toggle('sticky-on', n > 0);
  }
  function fillPicked() {
    var box = document.getElementById('picked'), list = wishList();
    box.innerHTML = '';
    list.forEach(function (w) {
      var chip = document.createElement('span'); chip.className = 'chip';
      chip.innerHTML = '<span class="t" style="--w:4em"></span><button type="button" class="icon-btn del" aria-label="빼기" style="width:20px;height:20px;border:0;margin-right:-8px">' + svg('x') + '</button>';
      chip.querySelector('.t').textContent = w.name || '';
      chip.querySelector('button').onclick = function () { setWishList(wishList().filter(function (x) { return x.id !== w.id; })); chip.remove(); syncWishButtons(); updateWish(); };
      box.appendChild(chip);
    });
    if (!list.length) box.innerHTML = '<span style="color:var(--ink-3);font-size:13px">♡ 를 눌러 상품을 골라 주세요 · 메모에 적어도 돼요</span>';
  }

  /* ---------- 클릭 처리 ---------- */
  document.addEventListener('click', function (e) {
    var body = document.body;
    if (body.classList.contains('edit')) {                       // 편집 모드: 빈칸 클릭은 링크·버튼 대신 글쓰기 / 사진 넣기
      if (e.target.closest('[contenteditable="true"]')) { e.preventDefault(); return; }
      var im = e.target.closest('.img[data-ki], .img[data-fi]');
      if (im && !e.target.closest('[data-del],[data-db-del],[data-arr-del]')) { e.preventDefault(); e.stopPropagation(); pickImage(im); return; }
    }

    var add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      var box = document.querySelector(add.dataset.add), node = cloneTpl(add.dataset.tpl);
      if (box && node) { place(box, node, add.dataset.pos === 'top'); hydrate(node); node.classList.add('adding'); toast('추가했어요'); afterChange(); }
    }
    var del = e.target.closest('[data-del]');
    if (del) { e.preventDefault(); e.stopPropagation(); var it = del.closest('[data-item]'); if (it) removeItems([it]); return; }

    var w = e.target.closest('.wish');
    if (w) {
      e.preventDefault(); e.stopPropagation();
      var on = w.getAttribute('aria-pressed') !== 'true';
      w.setAttribute('aria-pressed', on);
      if (w.dataset.pid) {
        var list = wishList().filter(function (x) { return x.id !== w.dataset.pid; });
        if (on) list.push({ id: w.dataset.pid, name: w.dataset.pname || '' });
        setWishList(list); syncWishButtons();
      }
      updateWish(); return;
    }

    var op = e.target.closest('[data-open]');
    if (op) { e.preventDefault(); var d = document.querySelector(op.dataset.open); if (d) { if (d.id === 'applyDlg') fillPicked(); d.showModal(); } }
    var cl = e.target.closest('[data-close]');
    if (cl) { var dd = cl.closest('dialog'); if (dd) dd.close(); }
    var ts = e.target.closest('[data-toast]');
    if (ts) toast(ts.dataset.toast);
    var cp = e.target.closest('[data-copy]');
    if (cp) {
      e.preventDefault();
      var src = cp.dataset.copy ? document.querySelector(cp.dataset.copy) : null;
      var text = src ? src.innerText.trim() : location.href;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast(src ? '복사했어요' : '링크를 복사했어요'); }, function () { toast('복사하지 못했어요'); });
    }

    var tab = e.target.closest('[data-tab]');
    if (tab) {
      var g = tab.dataset.group;
      document.querySelectorAll('[data-tab][data-group="' + g + '"]').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab.dataset.tab); });
      document.querySelectorAll('[data-panel][data-group="' + g + '"]').forEach(function (p) { p.hidden = p.dataset.panel !== tab.dataset.tab; });
      if (g === 'view') { window.scrollTo({ top: 0 }); history.replaceState(null, '', '#' + tab.dataset.tab); }
    }
    var chip = e.target.closest('[data-single] > .chip, .seg > button, .opt-row > .swatch');
    if (chip && !e.target.closest('.x')) [].forEach.call(chip.parentNode.children, function (c) { c.classList.toggle('on', c === chip); });
    var sw = e.target.closest('.switch');
    if (sw && !sw.hasAttribute('data-db')) sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  });

  /* ---------- 표: 전체 선택 ---------- */
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

  /* ---------- 신청서 보내기 ---------- */
  document.addEventListener('submit', async function (e) {
    var form = e.target.closest('form[data-submit]');
    if (!form) return;
    e.preventDefault();
    if (!window.BB || !BB.sb) { toast('지금은 접수할 수 없어요. 잠시 후 다시 시도해 주세요'); return; }
    var row = {};
    form.querySelectorAll('[name]').forEach(function (f) { if (f.value.trim()) row[f.name] = f.value.trim(); });
    var seg = form.querySelector('.seg > button.on');
    var table = { seller: 'cat_sellers', partner: 'cat_partners' }[form.dataset.submit] || 'cat_requests';
    if (table === 'cat_sellers') { if (seg) row.seller_type = seg.dataset.v; }
    else if (table === 'cat_requests') {
      row.kind = form.dataset.kind || 'apply';
      if (row.kind === 'apply') row.product_ids = wishList().map(function (w) { return w.id; }).filter(function (id) { return /^[0-9a-f-]{36}$/.test(id); });
    }
    var btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
    var r = await BB.sb.from(table).insert(row);
    if (btn) btn.disabled = false;
    if (r.error) { console.warn(r.error); toast('접수하지 못했어요. 잠시 후 다시 시도해 주세요'); return; }
    form.reset();
    if (row.kind === 'apply') { setWishList([]); syncWishButtons(); updateWish(); }
    var dlg = form.closest('dialog'); if (dlg) dlg.close();
    toast(table === 'cat_sellers' ? '셀러 신청이 접수됐어요. 검토 후 연락드릴게요' : table === 'cat_partners' ? '브랜드 등록 신청이 접수됐어요. 검토 후 연락드릴게요' : '접수됐어요. 담당자가 연락드릴게요');
  });

  /* ---------- 사이트 문구 채우기 ---------- */
  function applyContent(root) {
    var c = (window.BB && BB.content) || {};
    (root || document).querySelectorAll('[data-k]').forEach(function (el) { if (document.activeElement !== el) el.textContent = c[el.dataset.k] || ''; });
    (root || document).querySelectorAll('[data-ki]').forEach(function (el) { setImg(el, c[el.dataset.ki] || ''); });
  }

  /* ---------- 카카오 채널 버튼 (오른쪽 아래 고정, 링크는 관리자 설정의 c.kakao.url) ---------- */
  var KAKAO_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#3a1d1d" d="M12 3.5c-5.25 0-9.5 3.3-9.5 7.4 0 2.6 1.7 4.9 4.3 6.2-.2.7-.7 2.6-.8 3-.1.5.2.5.4.3.2-.1 2.6-1.8 3.7-2.5.6.1 1.2.1 1.9.1 5.25 0 9.5-3.3 9.5-7.4S17.25 3.5 12 3.5z"/></svg>';
  function mountKakao() {
    if (document.body.classList.contains('adm')) return;
    var c = (window.BB && BB.content) || {}, url = c['c.kakao.url'] || '', label = c['c.kakao.label'] || '카카오 채널 문의';
    var old = document.getElementById('kakaoFab'); if (old) old.remove();
    var a = document.createElement('a');
    a.id = 'kakaoFab'; a.className = 'kakao-fab' + (url ? '' : ' unset');
    a.setAttribute('aria-label', label); a.title = label;
    a.innerHTML = '<span class="kakao-ico">' + KAKAO_SVG + '</span><span class="kakao-txt"></span>';
    a.querySelector('.kakao-txt').textContent = url || !(window.BB && BB.admin) ? label : '카카오 링크 넣기';
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    else if (window.BB && BB.admin) a.href = 'admin.html#settings';
    else { a.href = '#'; a.addEventListener('click', function (e) { e.preventDefault(); toast('카카오 채널은 곧 연결돼요'); }); }
    document.body.appendChild(a);
  }

  /* ---------- 관리자 편집 모드 ---------- */
  function editableTargets(root) {
    return (root || document).querySelectorAll('[data-k], [data-rec] [data-f]:not(.img), [data-rec][data-f]:not(.img), [data-cat-name]');
  }
  function setEditable(root, on) {
    editableTargets(root).forEach(function (el) {
      if (el.closest('[data-noedit]')) return;
      if (on) { el.contentEditable = 'true'; el.spellcheck = false; } else el.removeAttribute('contenteditable');
    });
  }
  document.addEventListener('focusin', function (e) {
    var el = e.target.closest('[contenteditable="true"]'); if (el) el.dataset.orig = el.innerText;
  });
  document.addEventListener('keydown', function (e) {
    var el = e.target.closest && e.target.closest('[contenteditable="true"]');
    if (!el) return;
    if (e.key === 'Enter' && !el.closest('.lines, [data-ml]') && !e.shiftKey) { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape') { el.innerText = el.dataset.orig || ''; el.blur(); }
  });
  document.addEventListener('paste', function (e) {
    var el = e.target.closest && e.target.closest('[contenteditable="true"]');
    if (!el) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  });
  document.addEventListener('focusout', async function (e) {
    var el = e.target.closest && e.target.closest('[contenteditable="true"]');
    if (!el) return;
    var v = el.innerText.replace(/ /g, ' ').trim();
    if (!v) el.textContent = '';                                  // 비우면 다시 회색 빈칸
    if (v === (el.dataset.orig || '').trim()) return;
    try {
      if (el.dataset.k) {
        await BB.saveContent(el.dataset.k, v);
        document.querySelectorAll('[data-k="' + el.dataset.k + '"]').forEach(function (o) { if (o !== el) o.textContent = v; });
      } else if (window.BBEdit) await window.BBEdit.saveField(el, v);
      toast('저장했어요');
    } catch (err) { console.warn(err); toast('저장하지 못했어요'); el.innerText = el.dataset.orig || ''; }
  });

  var fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.hidden = true; document.body.appendChild(fileIn);
  var imgTarget = null;
  function pickImage(el) { imgTarget = el; fileIn.value = ''; fileIn.click(); }
  fileIn.addEventListener('change', async function () {
    var f = fileIn.files[0], el = imgTarget; if (!f || !el) return;
    toast('사진 올리는 중…');
    try {
      var url = await BB.upload(f, el.dataset.ki ? 'site' : 'items');
      if (el.dataset.ki) { await BB.saveContent(el.dataset.ki, url); document.querySelectorAll('[data-ki="' + el.dataset.ki + '"]').forEach(function (o) { setImg(o, url); }); }
      else if (window.BBEdit) await window.BBEdit.saveImage(el, url);
      toast('사진을 저장했어요');
    } catch (err) { console.warn(err); toast('사진을 올리지 못했어요'); }
  });

  /* ---------- 관리자 막대 ---------- */
  function setPref(k, on) {
    if (k === 'anno') document.body.classList.toggle('anno-on', on);
    if (k === 'edit') {
      document.body.classList.toggle('edit', on); setEditable(document, on);
      var eb = document.querySelector('[data-pref="edit"]');
      if (eb) eb.textContent = on ? '✎ 편집 중' : '👁 미리보기 (편집 켜기)';
    }
    var b = document.querySelector('[data-pref="' + k + '"]'); if (b) b.setAttribute('aria-pressed', on);
    store.set('bb-pref-' + k, on ? '1' : '0');
  }
  function mountAdminBar() {
    if (document.body.classList.contains('adm') || document.getElementById('adminbar')) return;
    document.body.insertAdjacentHTML('beforeend',
      '<div class="devbar" id="adminbar"><button class="dev-toggle" title="접기/펴기"><b>ADMIN</b></button>' +
      '<button data-pref="edit" aria-pressed="false">✎ 편집 중</button>' +
      '<a href="admin.html">관리자 페이지</a>' +
      '<button data-pref="anno" aria-pressed="false">구역 이름</button><span class="sep"></span>' +
      '<button data-logout>나가기</button></div>');
    var bar = document.getElementById('adminbar');
    bar.querySelector('.dev-toggle').onclick = function () { bar.classList.toggle('min'); };
    bar.querySelectorAll('[data-pref]').forEach(function (b) { b.onclick = function () { setPref(b.dataset.pref, b.getAttribute('aria-pressed') !== 'true'); }; });
    bar.querySelector('[data-logout]').onclick = async function () { await BB.logout(); location.reload(); };
    setPref('anno', store.get('bb-pref-anno') === '1');
    // 관리자는 기본으로 편집 모드. '미리보기'로 끄면 그 상태를 기억한다
    var editOn = store.get('bb-pref-edit') !== '0' || BB.qs('edit') === '1';
    setPref('edit', editOn);
    if (editOn) {
      var seen = false; try { seen = sessionStorage.getItem('bb-edit-hint') === '1'; sessionStorage.setItem('bb-edit-hint', '1'); } catch (e) {}
      if (!seen) toast('편집 모드예요 · 글자나 사진을 누르면 바로 고쳐서 저장돼요');
    }
  }

  /* ---------- 셀러 입장: 셀러 로그인 기능 전이라 손님은 안내만, 관리자만 예시 화면 미리보기 ---------- */
  document.querySelectorAll('#loginForm .pin input').forEach(function (inp, i, all) {
    inp.addEventListener('input', function () { inp.value = inp.value.replace(/\D/g, '').slice(0, 1); if (inp.value && all[i + 1]) all[i + 1].focus(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !inp.value && all[i - 1]) all[i - 1].focus(); });
  });
  var login = document.getElementById('loginForm');
  if (login) login.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!(window.BB && BB.admin)) { toast('셀러 전용 화면은 준비 중이에요. 승인된 셀러에게 따로 안내드릴게요'); return; }
    document.getElementById('auth').hidden = true; document.getElementById('dash').hidden = false; window.scrollTo({ top: 0 });
  });
  var logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', function () { document.getElementById('auth').hidden = false; document.getElementById('dash').hidden = true; });

  window.UI = { svg: svg, hydrate: hydrate, setImg: setImg, toast: toast, askConfirm: askConfirm, cloneTpl: cloneTpl, place: place,
    applyContent: applyContent, mountKakao: mountKakao, setEditable: setEditable, syncWishButtons: syncWishButtons, updateWish: updateWish, syncBulk: syncBulk, store: store };

  syncWishButtons(); updateWish();
  if (window.BB) BB.ready.then(function () {
    applyContent(document);
    mountKakao();
    if (BB.admin) mountAdminBar();
    document.dispatchEvent(new CustomEvent('bb:ready'));
  });
})();
