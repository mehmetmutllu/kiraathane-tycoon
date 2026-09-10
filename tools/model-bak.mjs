/**
 * model-bak.mjs — bir KayKit modelini GERÇEKTEN çizip ekran görüntüsü alır.
 *
 * NEDEN (S7): `model-olc.mjs` bir kutu verir, `atlas-goz.mjs` bir renk listesi. İkisi birlikte bile
 * "bu model NE" sorusunu bazen ayıramıyor — `door_A` 1,60 × 2,80 × 0,771, tek mesh, ortası boş,
 * iki yanı simetrik: kasa mı, açık duran çift kanat mı? Sayı susuyor. Aynı boşluk S6'da aynanın
 * SIRTINI odaya döndürmüştü ve ancak ekranda görülünce anlaşılmıştı.
 *
 * Sunucuyu kendi kaldırır (duman.mjs deseni: npx değil, vite'ın giriş dosyası + strictPort).
 * Kullanım: node tools/model-bak.mjs kaykit-restaurant-bits door_A,door_B,wall_half
 *           node tools/model-bak.mjs <paket> <modeller> [çıktı.png] [on|yan|ust]
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [paket = 'kaykit-restaurant-bits', modeller = 'door_A', cikti = 'docs/gorsel/model-bak.png', kip = 'on'] =
  process.argv.slice(2);
const PORT = Number(process.env.BAK_PORT ?? 5199);

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', (d) => process.stderr.write(`  [vite] ${d}`));

const url = `http://127.0.0.1:${PORT}/tools/model-bak.html?p=${paket}&m=${modeller}&kip=${kip}`;
const bekle = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/tools/model-bak.html`);
      if (r.ok) return true;
    } catch {
      /* henüz ayakta değil */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
};

if (!(await bekle())) {
  console.error(`model-bak: vite ${PORT} portunda ayaga kalkmadi (BAK_PORT ile degistir)`);
  sunucu.kill();
  process.exit(1);
}

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ viewport: { width: 1400, height: 700 }, deviceScaleFactor: 2 });
const hatalar = [];
sayfa.on('pageerror', (e) => hatalar.push(String(e.message)));
sayfa.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
await sayfa.goto(url, { waitUntil: 'networkidle' });
await sayfa.waitForFunction(() => document.title === 'hazir', null, { timeout: 20000 }).catch(() => {});
await sayfa.waitForTimeout(600);
await sayfa.screenshot({ path: cikti });
await tarayici.close();
sunucu.kill();

if (hatalar.length) {
  console.error('model-bak: sayfa hatalari:\n  ' + hatalar.join('\n  '));
  process.exitCode = 1;
}
console.log(`ok → ${cikti}  (${paket} · ${modeller} · kip ${kip})`);
