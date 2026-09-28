// Tarama sunucusu ayarı: ana vite.config + node_modules bağlantı (junction) ise gerçek yoluna izin.
// Git worktree'de node_modules ana kopyaya bağlanır; vite'ın fs.allow'u o yolu köke saymaz ve
// @fontsource yazı tiplerini 403 ile reddeder (ürün hatası DEĞİL, tezgâh hatası).
import { mergeConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../vite.config.ts';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = fs.realpathSync(path.join(KOK, 'node_modules'));

export default mergeConfig(base, {
  root: KOK,
  server: { fs: { allow: [KOK, nm] }, watch: { ignored: ['**/android/**', '**/dist/**'] } },
});
