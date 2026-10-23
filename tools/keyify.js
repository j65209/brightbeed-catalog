// 정적 빈칸에 저장용 키(data-k / data-ki)를 붙인다. 이미 붙은 키는 그대로 두고 새 빈칸만 번호를 이어서 매긴다.
//   node tools/keyify.js
// <template> 안(브랜드·상품 데이터가 들어가는 곳)과 admin.html 은 건드리지 않는다.
const fs = require('fs');
const path = require('path');
const PAGES = { 'index.html': 'idx', 'brand.html': 'brand', 'product.html': 'product', 'seller.html': 'seller' };
const SKIP = /data-(k|ki|f|fi|x|brand-name|up|noimg|kpi)\b/;

for (const [file, pfx] of Object.entries(PAGES)) {
  const fp = path.join(__dirname, '..', file);
  let html = fs.readFileSync(fp, 'utf8');
  const used = [...html.matchAll(new RegExp(`data-ki?="${pfx}\.(?:img\.)?(\d+)"`, 'g'))].map((m) => +m[1]);
  let n = used.length ? Math.max(...used) : 0;
  let added = 0;
  const parts = html.split(/(<template[\s\S]*?<\/template>)/);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i]
      .replace(/<span class="t(?:\s[^"]*)?"([^>]*)>/g, (m, attrs) => (SKIP.test(attrs) ? m : (added++, m.replace(/>$/, ` data-k="${pfx}.${++n}">`))))
      .replace(/<div class="img(?:\s[^"]*)?"([^>]*)>/g, (m, attrs) => (SKIP.test(attrs) || /\bid="mainImg"/.test(attrs) ? m : (added++, m.replace(/>$/, ` data-ki="${pfx}.img.${++n}">`))));
  }
  fs.writeFileSync(fp, parts.join(''));
  console.log(file, '+' + added, 'keys (last', n + ')');
}
