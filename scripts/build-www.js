const fs = require('fs');
const path = require('path');

const WWW = path.join(__dirname, '..', 'www');
const ROOT = path.join(__dirname, '..');

const FILES = ['index.html', 'reader.html'];
const DIRS = ['css', 'js'];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean
fs.rmSync(WWW, { recursive: true, force: true });

// Copy files
for (const file of FILES) {
  const src = path.join(ROOT, file);
  const dest = path.join(WWW, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Copy directories
for (const dir of DIRS) {
  copyDir(path.join(ROOT, dir), path.join(WWW, dir));
}

console.log('www/ created successfully');
