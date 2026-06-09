const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

execSync('npm run build:web', { cwd: root, stdio: 'inherit' });

const distGit = path.join(dist, '.git');
if (fs.existsSync(distGit)) {
  fs.rmSync(distGit, { recursive: true, force: true });
}

execSync('git init', { cwd: dist, stdio: 'inherit' });
execSync('git checkout -b gh-pages', { cwd: dist, stdio: 'inherit' });
execSync('git add -A', { cwd: dist, stdio: 'inherit' });
execSync('git commit -m "Deploy: Gym Tracker web PWA"', { cwd: dist, stdio: 'inherit' });
execSync('git remote add origin https://github.com/hlahera/gym-tracker.git', { cwd: dist, stdio: 'inherit' });
execSync('git config http.postBuffer 524288000', { cwd: dist, stdio: 'inherit' });
execSync('git push -f origin gh-pages', { cwd: dist, stdio: 'inherit' });

fs.rmSync(distGit, { recursive: true, force: true });
console.log('Deploy listo: https://hlahera.github.io/gym-tracker/');
