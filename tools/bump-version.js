// 배포 전에 실행: HTML 의 assets/*.css·js 주소 뒤 ?v= 를 새 값으로 바꿔서
// 브라우저가 예전 파일(GitHub Pages 기본 10분 캐시)을 쓰지 않게 한다.
//   node tools/bump-version.js
const fs = require('fs');
const path = require('path');
const v = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const root = path.join(__dirname, '..');
for (const f of fs.readdirSync(root).filter((n) => n.endsWith('.html'))) {
  const fp = path.join(root, f);
  const html = fs.readFileSync(fp, 'utf8');
  const out = html.replace(/(assets\/[\w-]+\.(?:css|js))(\?v=[\w]*)?"/g, `$1?v=${v}"`);
  if (out !== html) { fs.writeFileSync(fp, out); console.log(f, 'v=' + v); }
}
