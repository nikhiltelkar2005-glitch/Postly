/**
 * Postly Auto-Commit Watcher 🚀
 * Watches for file changes and auto-commits + pushes to GitHub.
 * Run with: npm run autocommit
 */

import { watch } from 'fs';
import { execSync, exec } from 'child_process';
import { resolve, relative } from 'path';

const ROOT = resolve(new URL('.', import.meta.url).pathname);

const IGNORE = [
  '.git', 'node_modules', 'dist', '.DS_Store',
  'auto-commit.mjs', 'postly-data.json'
];

let debounceTimer = null;
let pendingChanges = new Set();

const DEBOUNCE_MS = 4000; // wait 4s after last change before committing

function shouldIgnore(filePath) {
  const rel = relative(ROOT, filePath);
  return IGNORE.some(p => rel.startsWith(p) || rel.includes(`/${p}/`) || rel.includes(`\\${p}\\`));
}

function formatTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function runCommit() {
  const changedFiles = [...pendingChanges].join(', ');
  pendingChanges.clear();

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const msg = `auto: ${timestamp} | ${changedFiles.length > 80 ? 'multiple files updated' : changedFiles}`;

  try {
    const status = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
    if (!status) {
      console.log(`[${formatTime()}] ⚪ No changes to commit.`);
      return;
    }

    execSync('git add -A', { cwd: ROOT });
    execSync(`git commit -m "${msg.replace(/"/g, "'")}"`, { cwd: ROOT });
    console.log(`\n[${formatTime()}] ✅ Committed: ${msg}`);

    exec('git push origin main', { cwd: ROOT }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[${formatTime()}] ❌ Push failed: ${stderr}`);
      } else {
        console.log(`[${formatTime()}] 🚀 Pushed to GitHub! → https://github.com/nikhiltelkar2005-glitch/Postly`);
      }
    });
  } catch (err) {
    console.error(`[${formatTime()}] ❌ Git error: ${err.message}`);
  }
}

function onChange(eventType, filename) {
  if (!filename) return;
  const full = resolve(ROOT, filename);
  if (shouldIgnore(full)) return;

  const rel = relative(ROOT, full);
  pendingChanges.add(rel);
  console.log(`[${formatTime()}] 📝 Changed: ${rel}`);

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runCommit, DEBOUNCE_MS);
}

// Watch the whole project recursively
watch(ROOT, { recursive: true }, onChange);

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  🎓 Postly Auto-Commit Watcher — ADYPU Edition       ║');
console.log('║  Watching for changes... will auto-push to GitHub    ║');
console.log(`║  Repo: github.com/nikhiltelkar2005-glitch/Postly     ║`);
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');
console.log(`  Root: ${ROOT}`);
console.log(`  Debounce: ${DEBOUNCE_MS / 1000}s after last change`);
console.log(`  Ignoring: ${IGNORE.join(', ')}`);
console.log('');
console.log('  Press Ctrl+C to stop.\n');
