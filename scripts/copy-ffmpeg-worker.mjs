import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workerSrc = require.resolve('@ffmpeg/ffmpeg/worker');
const esmDir = dirname(workerSrc);
const destDir = join(root, 'public', 'ffmpeg');

// worker.js is an ES module that imports these siblings relatively
const files = ['worker.js', 'const.js', 'errors.js'];

mkdirSync(destDir, { recursive: true });
for (const file of files) {
  copyFileSync(join(esmDir, file), join(destDir, file));
}
