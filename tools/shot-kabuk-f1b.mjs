/**
 * shot-kabuk-f1b.mjs — F1b turunun GÖRSEL kanıtını üretir.
 *
 * `feedback_show_dont_ask`: ikon ve açılış ekranı metinle sorulamaz. Bu araç kararın
 * gerektirdiği üç kareyi çeker:
 *
 *   ① ikon tabakası     — 12 aday, 512×512 (mağaza ikonu boyu), aynı kadrajda
 *   ② launcher gerçeği  — AYNI 12 aday 48 dp'de, daire ve squircle maskeleriyle, ev ekranında
 *   ③ ekran yönü        — gerçek oyun, telefon oranlarında portre ↔ yatay yan yana
 *   ④ açılış ekranı     — oyunun KENDİ `SplashScreen.tsx`i, iki oranda
 *
 * ② neden zorunlu: ikon kararı 512'de verilir ama ikon 48 dp'de YAŞAR. Bir aday büyükte
 * güzel, küçükte lapa olabilir; iki kareyi ayrı ayrı göstermek elemeyi göze yaptırır.
 *
 * Koşu:  node tools/shot-kabuk-f1b.mjs            (hepsi)
 *        F1B_PORT=5212 node tools/shot-kabuk-f1b.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.F1B_PORT ?? '', 10) || 5212;
const KOK_URL = `http://127.0.0.1:${PORT}`;
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

function sunucuKaldir() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    // `--host 127.0.0.1`: vite varsayılanı `localhost`a bağlanıyor, o da bu makinede önce
    // ::1'e çözülüyor ve 127.0.0.1'e giden istek ERR_CONNECTION_REFUSED alıyor
    // (`olcum-kol.mjs` aynı bayrağı aynı sebeple taşıyor).
    'dev', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, red) => {
    const z = setTimeout(() => red(new Error('sunucu 60 sn icinde hazir olmadi')), 60_000);
    s.stdout.on('data', (d) => { if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); } });
    s.on('exit', (k) => { clearTimeout(z); red(new Error(`sunucu ${k} koduyla kapandi`)); });
  });
}

const DUNYA_PADS = (() => {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
})();

async function main() {
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const uretilen = [];
  try {
    // ---------------------------------------------------------------- ① ikon tabakası
    {
      const s = await tarayici.newPage({ viewport: { width: 2220, height: 1720 }, deviceScaleFactor: 1 });
      await s.goto(`${KOK_URL}/tools/ikon-adaylari.html?sayfa=tabaka`, { waitUntil: 'networkidle' });
      await s.waitForTimeout(1500); // font
      const el = await s.$('#tabaka');
      const p = path.join(OUT, 'f1b-ikon-tabaka.png');
      await el.screenshot({ path: p });
      uretilen.push(p);

      // Her aday AYRICA tek tek 512'de — karar paketi tek tek büyütebilsin.
      const adaylar = await s.evaluate(() => window.__adaylar);
      for (const a of adaylar) {
        const t = await tarayici.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
        await t.goto(`${KOK_URL}/tools/ikon-adaylari.html?sayfa=tek&id=${a.id}`, { waitUntil: 'networkidle' });
        await t.waitForTimeout(700);
        const q = path.join(OUT, `f1b-ikon-${a.id}.png`);
        await (await t.$('.aday')).screenshot({ path: q });
        uretilen.push(q);
        await t.close();
      }
      await s.close();
    }

    // ---------------------------------------------------------------- ② launcher gerçeği
    {
      const s = await tarayici.newPage({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 1 });
      await s.goto(`${KOK_URL}/tools/ikon-adaylari.html?sayfa=launcher`, { waitUntil: 'networkidle' });
      await s.waitForTimeout(1500);
      const p = path.join(OUT, 'f1b-ikon-launcher.png');
      await (await s.$('#launcher')).screenshot({ path: p });
      uretilen.push(p);
      await s.close();
    }

    // ---------------------------------------------------------------- ③ ekran yönü + ④ açılış
    const kadrajlar = [
      { ad: 'portre', w: 412, h: 915, dpr: 2.625 },
      { ad: 'yatay', w: 915, h: 412, dpr: 2.625 },
    ];
    for (const k of kadrajlar) {
      // Her kadraj KENDİ bağlamında: önbellek paylaşılırsa ikinci kadrajda hiç yükleme
      // görünmez ve açılış ekranı anında söner.
      const baglam = await tarayici.newContext({
        viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dpr, isMobile: true, hasTouch: true,
      });
      const s = await baglam.newPage();
      await s.goto(`${KOK_URL}/`, { waitUntil: 'domcontentloaded' });

      /*
       * ④ AÇILIŞ EKRANI — yakalanması göründüğünden zor.
       *
       * İlk kurulum 900 ms bekleyip `.splash` VAR MI diye soruyordu ve "var" cevabı aldı, ama
       * çıkan karede splash YOKTU: bileşen sönerken 480 ms daha DOM'da duruyor (`splash--out`,
       * opacity 0). Yani denetim öğenin varlığına bakıyordu, GÖRÜNÜRLÜĞÜNE değil — ölçüm
       * aracının klasik karamsar/iyimser hatası, burada iyimser olanı.
       *
       * İki düzeltme: ① sönmemiş olmayı şart koş (`.splash:not(.splash--out)`) ② kare erken
       * alınsın. Ayrıca asset'ler önbellekten gelirse yükleme çubuğu hiç dolmaz; bu yüzden
       * bağlam ÖNBELLEKSİZ açılıyor (aşağıda `bypassCSP`/route yerine basitçe yeni bağlam).
       */
      try {
        await s.waitForSelector('.splash:not(.splash--out)', { timeout: 4000 });
        await s.waitForTimeout(320); // çubuk bir miktar dolsun
        const p = path.join(OUT, `f1b-acilis-${k.ad}.png`);
        await s.screenshot({ path: p });
        uretilen.push(p);
      } catch {
        console.error(`UYARI: ${k.ad} kadrajinda acilis ekrani yakalanamadi`);
      }

      // ③ EKRAN YÖNÜ — aynı dünya, aynı nokta; tek fark oran.
      await s.waitForTimeout(6000);
      await s.evaluate((pads) => {
        window.__setState({ padsDone: pads, padFills: {}, wallet: 1e9, diamonds: 1e6 });
        window.__zaman(1);
        window.__advanceTime(1);
      }, DUNYA_PADS);
      await s.waitForTimeout(1500);
      await s.evaluate(() => { window.__zaman(0); window.__teleport(0, 0); });
      await s.waitForTimeout(2500);
      const p2 = path.join(OUT, `f1b-yon-${k.ad}.png`);
      await s.screenshot({ path: p2 });
      uretilen.push(p2);
      await baglam.close();
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }
  console.log('URETILEN KARELER:');
  for (const p of uretilen) console.log('  ' + path.relative(KOK, p).replace(/\\/g, '/'));
}

main().catch((e) => { console.error('KARE ARACI KIRILDI:', e.message); process.exit(1); });
