/**
 * Wrapper around `father doctor`.
 * If node_modules/.cache was created as root (common with docker/sudo),
 * father/umi cannot write umi.log and crashes — treat that as skippable env noise.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logFile = path.join(root, 'node_modules/.cache/logger/umi.log');
const cacheDir = path.join(root, 'node_modules/.cache');

function canWriteCache() {
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.accessSync(cacheDir, fs.constants.W_OK);
    if (fs.existsSync(logFile)) fs.accessSync(logFile, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

if (!canWriteCache()) {
  console.warn(
    '[doctor] skip: node_modules/.cache is not writable (often root-owned).\n' +
      '         Fix with: sudo chown -R "$(whoami)" node_modules/.cache',
  );
  process.exit(0);
}

const result = spawnSync('father', ['doctor'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
