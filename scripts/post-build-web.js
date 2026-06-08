const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const index = path.join(dist, 'index.html');

if (!fs.existsSync(index)) {
  console.error('post-build-web: dist/index.html no encontrado. Ejecuta expo export primero.');
  process.exit(1);
}

fs.copyFileSync(index, path.join(dist, '404.html'));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

console.log('post-build-web: 404.html y .nojekyll listos para GitHub Pages');
