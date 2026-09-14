// olcum-kol.mjs — "tum karakterlerin elleri saga acik" sikayetini OLCER (S18).
//
// NEDEN OLCUM, NEDEN TAHMIN DEGIL: S16'da ilk tani YANLISTI (havuz kurulumu sanildi, mesele
// drei'nin yol dizisiydi) ve dogru sebep ancak olculunce cikti. "Eller saga acik" da uc ayri
// sebepten dogabilir ve ucu ayri kodu isaret eder:
//   (a) HICBIR klip baglanmamis  -> kemikler BIND POZ'unda kalir (KayKit'te A-poz: kollar acik)
//   (b) UST GOVDE yarisi acik kalmis -> tasima pozu tasimayan karakterde de oynuyor
//   (c) klip oynuyor ama kol izleri klipte YOK -> yine bind poz, ama yalniz kollarda
// Ayrim, her karakterde ① CALISAN eylemler ② el kemiklerinin GOVDEYE gore konumu ile yapilir.
//
// SIMETRI SAYISI: "saga acik" ancak iki el gogus ekseninin AYNI tarafinda duruyorsa dogrudur.
// Sol el -x, sag el +x'te olmali (govde yerel uzayinda). Ikisi de ayni isarette ise siluet
// gercekten tek yana acilmis demektir; isaretler dogruysa sikayet baska bir seydir (or. kollar
// govdeden fazla UZAK = A-poz).
//
// Calistir: node tools/olcum-kol.mjs
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const KOK = path.resolve('.');
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = 5411;
const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4'.split(' ');

mkdirSync(OUT, { recursive: true });

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});

const bekle = async () => {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true; } catch { /* bekle */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 2 });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') hatalar.push('CONSOLE ' + m.text()); });
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('canvas', { timeout: 60000 });
  await p.waitForTimeout(3500);
  await p.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
  await p.waitForTimeout(1200);
  await p.evaluate(() => {
    window.__setState({ tableLevels: new Array(24).fill(2), stationLevels: [5], wallet: 99999 });
    document.body.classList.add('dsb-hide-hud');
  });
  // OYUNCUNUN VE GARSONUN ELINE TEPSI KOY: tasima pozu ancak tepsi doluyken cizilir.
  await p.evaluate(() => window.__setState({ tray: 4, trayFood: 1 }));
  // Musteri uret: salon dolsun, yuruyen govde bulunsun.
  for (let i = 0; i < 6; i++) { await p.evaluate(() => window.__advanceTime?.(20)); await p.waitForTimeout(400); }
  await p.waitForTimeout(1500);

  // GOVDELERI TOPLA: gruplama MESH e gore degil KEMIK KOKUNE gore (bir govde 5-6 mesh tasiyor).
  // Olculen sey GOGUS-YEREL el konumu: govde salonda yurudugu icin DUNYA hareketi kolun oynayip
  // oynamadigini SOYLEMEZ (ayak da el de ayni govde otelemesini tasir). Yerelde ise yalniz kolun
  // kendi hareketi kalir.
  const orneklem = async () => p.evaluate(() => {
    const kok = window.__three?.scene ?? null;
    if (!kok) return null;
    const out = [];
    kok.traverse((n) => {
      if (!n.isBone || n.name !== "chest") return;
      let ata = n;
      while (ata.parent && ata.parent !== kok) ata = ata.parent;
      const bul = (ad) => { let r = null; ata.traverse((m) => { if (!r && m.isBone && m.name === ad) r = m; }); return r; };
      const sol = bul("handl"), sag = bul("handr"), ayak = bul("footl"), ust = bul("upperarml");
      // PERSONEL mi MUSTERI mi: onluk/kasket yalniz personelde takili (KayActor.kiyafetTak).
      let onluk = false;
      ata.traverse((m) => { if (m.isMesh && m.material?.color?.getHexString?.() === "7a2230") onluk = true; });
      if (!sol || !sag) return;
      const P = (o) => { o.updateWorldMatrix(true, false); return o.position.clone().setFromMatrixPosition(o.matrixWorld); };
      const ys = n.worldToLocal(P(sol)), yg = n.worldToLocal(P(sag));
      const ya = ayak ? n.worldToLocal(P(ayak)) : null;
      // Ust kol kemiginin YEREL donusu: bind pozdan sapma T-pozun makine olcusu.
      const q = ust ? [+ust.quaternion.x.toFixed(4), +ust.quaternion.y.toFixed(4), +ust.quaternion.z.toFixed(4), +ust.quaternion.w.toFixed(4)] : null;
      out.push({
        solX: +ys.x.toFixed(3), solY: +ys.y.toFixed(3), solZ: +ys.z.toFixed(3),
        sagX: +yg.x.toFixed(3), sagY: +yg.y.toFixed(3), sagZ: +yg.z.toFixed(3),
        ayakZ: ya ? +ya.z.toFixed(3) : null,
        ustKolQ: q,
        personel: onluk,
      });
    });
    return out;
  });

  // Iki ornek arasi YEREL fark: el oynuyor mu, ayak oynuyor mu.
  const farkOlc = async (etiket) => {
    const a = await orneklem();
    await p.waitForTimeout(300);
    const b2 = await orneklem();
    const d = (u, v, k) => (u && v ? Math.abs(u[k] - v[k]) : 0);
    const satir = (a ?? []).map((x, i) => {
      const y = (b2 ?? [])[i] ?? x;
      const elOyn = Math.max(d(x, y, "solX") + d(x, y, "solY") + d(x, y, "solZ"), d(x, y, "sagX") + d(x, y, "sagY") + d(x, y, "sagZ"));
      return {
        personel: x.personel,
        ustKolQ: x.ustKolQ,
        // "Yana acik" olcusu: eller govdeden ne kadar UZAKTA ve ne kadar YUKARIDA.
        yanAcikligi: +(Math.abs(x.solX) + Math.abs(x.sagX)).toFixed(3),
        elYuksekligi: +((x.solY + x.sagY) / 2).toFixed(3),
        elOynama: +elOyn.toFixed(4),
        ayakZ: x.ayakZ,
      };
    });
    const donuk = satir.filter((r) => r.elOynama < 0.002);
    console.log("  DONUK GOVDELER:", JSON.stringify(donuk));
    console.log("  PERSONEL satirlari:", JSON.stringify(satir.filter((r) => r.personel)));
    console.log(etiket + ": govde " + satir.length +
      "  DONUK KOL " + donuk.length + "/" + satir.length +
      "  ort yanAciklik " + (satir.reduce((s2, r) => s2 + r.yanAcikligi, 0) / Math.max(1, satir.length)).toFixed(3) +
      "  ort elYuksekligi " + (satir.reduce((s2, r) => s2 + r.elYuksekligi, 0) / Math.max(1, satir.length)).toFixed(3));
    return satir;
  };

  const tepsiDolu = await farkOlc("TEPSI DOLU  (tasiyor=true) ");
  await p.evaluate(() => window.__setState({ tray: 0, trayFood: 0, waiterTrays: 0 }));
  await p.waitForTimeout(900);
  const tepsiBos = await farkOlc("TEPSI BOS   (tasiyor=false)");
  const rapor = { tepsiDolu, tepsiBos };
  writeFileSync(KOK + "/docs/olcum-kol.json", JSON.stringify(rapor, null, 2));

  // Yakin kadraj: kollar gozle de gorunsun.
  await p.screenshot({ path: `${OUT}/s18-kol-genel.png` });
  console.log('hatalar:', hatalar.length ? hatalar.slice(0, 5) : 'yok');
  await b.close();
} finally {
  sunucu.kill();
}
