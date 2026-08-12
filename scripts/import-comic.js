const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const INBOX_DIR = path.join(ROOT, 'inbox');
const COMICS_JSON = path.join(DATA_DIR, 'comics.json');

const MAX_WIDTH = 800;
const QUALITY = 80;
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.heic'];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const inputQueue = [];
let pendingResolve = null;
let inputClosed = false;

rl.on('line', (line) => {
  if (pendingResolve) {
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve(line);
  } else {
    inputQueue.push(line);
  }
});

rl.on('close', () => {
  inputClosed = true;
  if (pendingResolve) {
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve('');
  }
});

function ask(question, defaultValue) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    if (inputQueue.length > 0) {
      const line = inputQueue.shift();
      resolve(valueOf(line, defaultValue));
    } else if (inputClosed) {
      resolve(defaultValue !== undefined ? String(defaultValue) : '');
    } else {
      pendingResolve = (line) => resolve(valueOf(line, defaultValue));
    }
  });
}

function valueOf(line, defaultValue) {
  const value = String(line).trim();
  return value === '' && defaultValue !== undefined ? String(defaultValue) : value;
}

function askNumber(question, defaultValue) {
  return ask(question, defaultValue).then((v) => parseInt(v, 10));
}

function listImages() {
  if (!fs.existsSync(INBOX_DIR)) {
    return [];
  }
  return fs
    .readdirSync(INBOX_DIR)
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function nextComicId() {
  const comics = JSON.parse(fs.readFileSync(COMICS_JSON, 'utf8'));
  const max = comics.reduce((m, c) => Math.max(m, c.id), 0);
  return max + 1;
}

async function convert(srcFile, destFile) {
  await sharp(path.join(INBOX_DIR, srcFile))
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY })
    .toFile(destFile);
}

function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function safeGitMessage(text) {
  return text.replace(/["']/g, '');
}

async function main() {
  const images = listImages();

  if (images.length === 0) {
    console.log('Keine Bilder gefunden. Lege die Bilder in den Ordner inbox/ und starte erneut.');
    rl.close();
    return;
  }

  console.log('Gefundene Bilder in inbox/:');
  images.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

  const id = await askNumber(`Comic-Nr [${nextComicId()}]: `, nextComicId());
  const title = await ask('Titel: ');
  const author = await ask('Autor: ');
  const year = await askNumber('Jahr: ');
  const genres = (await ask('Genres (kommagetrennt): '))
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);

  const frontIdx = (await askNumber(`Front-Cover (1-${images.length}) [1]: `, 1)) - 1;
  let backIdx = -1;
  const backAnswer = await ask(`Back-Cover (Nummer oder leer): `);
  if (backAnswer !== '') {
    backIdx = parseInt(backAnswer, 10) - 1;
  }

  if (frontIdx < 0 || frontIdx >= images.length || backIdx < -1 || backIdx >= images.length || frontIdx === backIdx) {
    console.log('Ungültige Auswahl. Abbruch.');
    rl.close();
    return;
  }

  const destDir = path.join(DATA_DIR, `comic_${id}`);
  if (fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0) {
    const overwrite = (await ask(`Ordner ${destDir} existiert und ist nicht leer. Überschreiben? (j/n) [n]: `, 'n')).toLowerCase();
    if (overwrite !== 'j') {
      console.log('Abbruch.');
      rl.close();
      return;
    }
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const pageFiles = images.filter((_, i) => i !== frontIdx && i !== backIdx);

  console.log(`Konvertiere ${images.length} Bilder (max ${MAX_WIDTH}px, Q${QUALITY})...`);
  await convert(images[frontIdx], path.join(destDir, 'front.jpg'));
  for (let i = 0; i < pageFiles.length; i++) {
    const pageName = `page_${String(i + 1).padStart(3, '0')}.jpg`;
    await convert(pageFiles[i], path.join(destDir, pageName));
  }
  if (backIdx >= 0) {
    await convert(images[backIdx], path.join(destDir, 'back.jpg'));
  }

  const comics = JSON.parse(fs.readFileSync(COMICS_JSON, 'utf8'));
  const entry = {
    id,
    title,
    author,
    year,
    genres,
    pages: pageFiles.length,
    available: true,
  };
  const existingIdx = comics.findIndex((c) => c.id === id);
  if (existingIdx >= 0) {
    comics[existingIdx] = entry;
  } else {
    comics.push(entry);
  }
  comics.sort((a, b) => a.id - b.id);
  fs.writeFileSync(COMICS_JSON, JSON.stringify(comics, null, 2) + '\n');

  console.log(`Fertig: ${title} (${pageFiles.length} Seiten) in ${destDir}`);
  console.log('comics.json aktualisiert.');

  const cleanInbox = (await ask('Bilder aus inbox/ löschen? (j/n) [j]: ', 'j')).toLowerCase() === 'j';
  if (cleanInbox) {
    for (const f of images) {
      fs.rmSync(path.join(INBOX_DIR, f), { force: true });
    }
    console.log('inbox/ geleert.');
  }

  const doGit = (await ask('Commit + Push? (j/n) [j]: ', 'j')).toLowerCase() === 'j';
  if (doGit) {
    const msg = `Comic ${id}: ${safeGitMessage(title)}`;
    run(`git add data/comic_${id} data/comics.json`);
    run(`git commit -m "${msg}"`);
    run('git push');
    console.log('Committed und gepusht.');
  }

  rl.close();
}

main().catch((err) => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
