import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const distDir = join(root, 'dist');
const standaloneDir = join(root, '.next', 'standalone');
const staticDir = join(root, '.next', 'static');
const publicDir = join(root, 'public');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(join(distDir, '.next'), { recursive: true });

cpSync(standaloneDir, distDir, { recursive: true });
cpSync(staticDir, join(distDir, '.next', 'static'), { recursive: true });

if (existsSync(publicDir)) {
  cpSync(publicDir, join(distDir, 'public'), { recursive: true });
}
