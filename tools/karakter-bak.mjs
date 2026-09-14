/**
 * karakter-bak.mjs — karakter adaylarını oyunun donmuş mobilyasıyla aynı sahnede çizip
 * ekran görüntüsü alır (S14). Sunucuyu kendi kaldırır (duman.mjs / model-bak.mjs deseni).
 *
 * NEDEN: ölçüm "KayKit karakterinin başı boyun %50'si" diyor; bugünkü gövdede %33. Bu bir
 * SİLUET kararı ve sayıyla kapanmıyor — kullanıcının kendi kuralı (`feedback_reference_scale_trap`)
 * ölçü almadan önce insan boyunu karşılaştırmayı istiyor. Sayfa masayı (0,795) ve tabureyi (0,45)
 * aynı kareye koyar.
 *
 * Kullanım: node tools/karakter-bak.mjs "Knight,Rogue,Mannequin_Medium" docs/gorsel/ss/s14-a.png 1 "Rig_Medium_General:Idle_A"
 *           (3. argüman 1 → SİVİL kip: ekipman düğümleri gizlenir · 4. argüman dosya:klip → poz)
 *           node tools/karakter-bak.mjs Ranger cikti.png 1 "Rig_Medium_General:Idle_A" 0.794,0.88,0.98
 *           (5. argüman → TEK modeli o ölçeklerde yan yana: ölçek kolu görsel karşılaştırması)
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [modeller = 'Knight', cikti = 'docs/gorsel/ss/karakter-bak.png', sivil = '0', poz = '', olcekler = '', boya = '0', roller = '', izgara = '0'] = process.argv.slice(2);
const PORT = Number(process.env.BAK_PORT ?? 5198);

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', (d) => process.stderr.write(`  [vite] ${d}`));

const bekle = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/tools/karakter-bak.html`);
      if (r.ok) return true;
    } catch {
      /* sunucu daha ayakta değil */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite ayağa kalkmadı');
  const url = `http://127.0.0.1:${PORT}/tools/karakter-bak.html?m=${modeller}&sivil=${sivil}&poz=${encodeURIComponent(poz)}&olcekler=${olcekler}&boya=${boya}&roller=${roller}&izgara=${izgara}`;
  const tarayici = await chromium.launch();
  const sayfa = await tarayici.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
  const hatalar = [];
  sayfa.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
  sayfa.on('pageerror', (e) => hatalar.push(`PAGEERROR ${e.message}`));
  await sayfa.goto(url, { waitUntil: 'networkidle' });
  await sayfa.waitForFunction(() => document.title === 'hazir', { timeout: 60000 });
  await sayfa.waitForTimeout(400);
  mkdirSync(path.dirname(cikti), { recursive: true });
  await sayfa.screenshot({ path: cikti });
  await tarayici.close();
  console.log(hatalar.length ? `UYARI konsol hatası:\n  ${hatalar.join('\n  ')}` : 'konsol temiz');
  console.log(`kare → ${cikti}`);
} finally {
  sunucu.kill();
}
