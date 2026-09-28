// Kare araçları için dev sunucusu: node_modules bir worktree kavşağıysa (mklink /J) gerçek yolu
// kökün dışında kalır ve Vite latin-ext fontlarını 403'le reddeder (ş/ğ/ı yedek fonta düşer).
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import temel from '../vite.config.ts';

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export default mergeConfig(temel, { server: { fs: { allow: [kok, realpathSync(path.join(kok, 'node_modules'))] } } });
