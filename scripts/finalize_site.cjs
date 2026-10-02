const fs = require('node:fs');
for (const page of ['monitor', 'whitepaper']) {
  fs.mkdirSync(`dist/${page}`, { recursive: true });
  fs.copyFileSync('dist/index.html', `dist/${page}/index.html`);
}
fs.writeFileSync('dist/.nojekyll', '');
