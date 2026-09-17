/**
 * shot-yatay-hud-f1b.mjs — F1b ek turu: TELEFON YATAYINDA HUD DOLULUĞU kolları.
 *
 * NEDEN VAR: kullanıcı yatay kareye bakıp *"yatayda ekran çok dolu görevlerle vs"* dedi.
 * Ölçüm önce ona karşı çıkıyordu (HUD %8,5) — çünkü araç `.band` ve `.botnav`u hiç saymıyordu
 * (zeminleri `linear-gradient`, `background-color` şeffaf). Düzeltilince sayı kullanıcıyı
 * doğruladı: telefon yatayında HUD **ekranın %38'i**, alt bant **ekran yüksekliğinin %45'i**.
 *
 * KÖK SEBEP: alt yığın (görev şeridi + alt gezinme) **her yönde 186 px SABİT**. Portrede
 * 915 px'in %20'si, yatayda 412 px'in %45'i. Yani bu YÖNÜN değil, kısa ekrana uyum sağlamayan
 * HUD'un kusuru — ve bu ayrım kararı değiştirir.
 *
 * KOLLAR GERÇEK OYUNUN ÜSTÜNE UYGULANIR, MAKETE DEĞİL. Her kol yalnız bir CSS katmanı olarak
 * sayfaya enjekte edilir (`addStyleTag`); depoda hiçbir şey değişmez. Böylece "göster, sonra
 * karar al" sırası korunur: kolun görüntüsü de sayısı da karar ÖNCESİ elde edilir, kod sonra.
 *
 * Koşu: node tools/shot-yatay-hud-f1b.mjs   ·   F1B_PORT=5214 ile port değiştirilir
 * Çıktı: docs/gorsel/ss/f1b-yhud-<kol>.png  +  stdout ölçüm tablosu
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.F1B_PORT ?? '', 10) || 5214;
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

const PADS = (() => {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
})();

/** Telefon yatayı — sorunun yaşadığı tek kadraj. */
const KADRAJ = { w: 915, h: 412, dpr: 2.625 };

/**
 * TABLET YATAY — kullanıcının *"tablette oynanırsa oyun çok kötü durur"* endişesinin kadrajı.
 *
 * Ayrı tutuluyor çünkü kolların HEPSİ kısa ekrana (`max-height: 480px`) yazılacak kurallar;
 * tablet o dala girmez, yani tabletin gördüğü şey TABANDIR. Endişenin cevabı da bu yüzden
 * kolların değil, tabanın tablet kadrajındaki hâlidir.
 */
const TABLET = { w: 1280, h: 800, dpr: 2 };

/**
 * KOLLAR. Hepsi `@media (orientation: landscape) and (max-height: 480px)` dalına yazılacak
 * türden kurallar — yani seçilen kol TABLETİ VE PORTREYİ ETKİLEMEZ. Bu kasıtlı: ölçüm tablet
 * yatayında alt bandın zaten %23 olduğunu (yani sorun olmadığını) gösterdi; oraya dokunmak
 * çalışan bir şeyi bozmak olurdu.
 */
const KOLLAR = [
  { id: 'Y0', ad: 'Taban (bugun)', css: '' },

  {
    id: 'YA',
    ad: 'Alt gezinme YAN RAYA',
    /* Alt gezinme 72 px'lik tam genişlik bandından, sol kenarda 64 px'lik dikey raya döner.
       Yatayda genişlik bol, yükseklik kıt — bant yatay yerine DİKEY durunca kıt olan eksen
       serbest kalır. Diğer her şey ranın sağına kayar. */
    css: `
      .botnav {
        top: 0; bottom: 0; right: auto; width: 64px;
        flex-direction: column; justify-content: center; gap: 2px;
        padding: 8px 6px; border-top: none; border-right: 3px solid var(--ot);
      }
      .botnav::before { display: none; }
      .navtab { flex: 0 0 auto; padding: 6px 0; }
      .navtab-label { font-size: 9px; }
      .topbar { left: calc(var(--sal) + 74px); }
      .band { left: calc(var(--sal) + 74px); bottom: calc(var(--sab) + 10px); }
    `,
  },

  {
    id: 'YB',
    ad: 'Gorev seridi KOMPAKT KOSE KARTI',
    /* Kullanıcının cümlesindeki isim doğrudan kola çevrildi (`feedback_ui_form_not_color`):
       *"çok dolu GÖREVLERLE"* → şeridin kendisi. Tam genişlik bandı, sol altta 330 px'lik
       bir karta iner; alt gezinme yerinde kalır. */
    css: `
      .band {
        right: auto; width: 330px; min-height: 52px;
        bottom: calc(var(--sab) + 84px);
      }
      .band-reward { display: none; }
    `,
  },

  {
    id: 'YD',
    ad: 'DOGAL GENISLIK (kullanicinin onerisi)',
    /*
     * KULLANICININ KENDİ ÖNERİSİ, kola çevrildi:
     *   "gorev normal gerektigi kadar genislikte kalabilir tablette hatta [yata]ydaki nav bile"
     *
     * Yani kalem "HUD'u küçült" değil: HUD öğeleri EKRANI DEĞİL İÇERİĞİ ölçü alsın. Bugün hem
     * `.band` hem `.botnav` `left:0; right:0` ile ekranın tamamına geriliyor; ekran büyüdükçe
     * öğe büyüyor ama içeriği büyümüyor, arada boşluk açılıyor (tablet karesinde ilerleme
     * çubuğunun upuzun boş bir çizgiye dönmesi bu). Doğal genişlik ikisini birden çözer:
     * telefon yatayında yer açar, tablette gerilmeyi keser.
     *
     * Bu kol DİĞERLERİNDEN AYRI: yalnız kısa ekrana değil, TABLETE de uygulanır — çünkü
     * çözdüğü ikinci sorun tablette yaşıyor.
     */
    hepKadraj: true,
    css: `
      .band { right: auto; width: min(430px, 56vw); }
      .botnav {
        left: 50%; right: auto; transform: translateX(-50%);
        width: auto; gap: 10px;
        padding: 6px 20px calc(var(--sab) + 6px);
        border: 3px solid var(--ot); border-bottom: none;
        border-radius: 18px 18px 0 0;
      }
      .navtab { flex: 0 0 auto; padding: 4px 14px; }
    `,
  },

  {
    id: 'YC',
    ad: 'IKISI BIRDEN (ray + kompakt serit)',
    css: `
      .botnav {
        top: 0; bottom: 0; right: auto; width: 64px;
        flex-direction: column; justify-content: center; gap: 2px;
        padding: 8px 6px; border-top: none; border-right: 3px solid var(--ot);
      }
      .botnav::before { display: none; }
      .navtab { flex: 0 0 auto; padding: 6px 0; }
      .navtab-label { font-size: 9px; }
      .topbar { left: calc(var(--sal) + 74px); }
      .band {
        left: calc(var(--sal) + 74px); right: auto; width: 330px;
        min-height: 52px; bottom: calc(var(--sab) + 10px);
      }
      .band-reward { display: none; }
    `,
  },
];

function sunucuKaldir() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, red) => {
    const z = setTimeout(() => red(new Error('sunucu 60 sn icinde hazir olmadi')), 60_000);
    s.stdout.on('data', (d) => { if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); } });
    s.on('exit', (k) => { clearTimeout(z); red(new Error(`sunucu ${k} koduyla kapandi`)); });
  });
}

/** Ölçüm: HUD'un ekran yüzdesi + alt bandın yüksekliği (ana ölçüm aracıyla AYNI tanım). */
const OLC = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const oge = [];
  for (const el of document.querySelectorAll('.hud *, .touch-layer *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number.parseFloat(cs.opacity) < 0.05) continue;
    const alfa = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return 0; const p = m[1].split(','); return p[3] !== undefined ? Number.parseFloat(p[3]) : 1; };
    const boyali = alfa(cs.backgroundColor) > 0.05
      || (cs.backgroundImage && cs.backgroundImage !== 'none')
      || (Number.parseFloat(cs.borderTopWidth) > 0 && alfa(cs.borderTopColor) > 0.05)
      || ['SVG', 'svg', 'IMG'].includes(el.tagName);
    if (!boyali) continue;
    oge.push({ sinif: String(el.className.baseVal ?? el.className ?? el.tagName), x: r.left, y: r.top, w: r.width, h: r.height });
  }
  const ADIM = 4;
  let kapali = 0, toplam = 0;
  const kapaliMi = (px, py) => oge.some((o) => px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h);
  for (let py = 0; py < vh; py += ADIM) for (let px = 0; px < vw; px += ADIM) { toplam++; if (kapaliMi(px, py)) kapali++; }
  const alt = oge.filter((o) => o.y + o.h > vh * 0.6);
  const bantUst = alt.length ? Math.min(...alt.map((o) => o.y)) : vh;

  // OYUN ZEMİNİNİN NE KADARI AÇIK: kadraja giren zemin noktalarından HUD altında kalmayanlar.
  const t3 = window.__three, cam = t3.camera;
  cam.updateMatrixWorld(true);
  const mvi = cam.matrixWorldInverse.elements, pr = cam.projectionMatrix.elements;
  const vp = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r2 = 0; r2 < 4; r2++) { let s = 0; for (let k = 0; k < 4; k++) s += pr[k * 4 + r2] * mvi[c * 4 + k]; vp[c * 4 + r2] = s; }
  const H = 17, N = 260, adim = (2 * H) / (N - 1);
  let icerde = 0, acik = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = -H + i * adim, z = -H + j * adim;
    const cx = vp[0] * x + vp[8] * z + vp[12], cy = vp[1] * x + vp[9] * z + vp[13], cw = vp[3] * x + vp[11] * z + vp[15];
    if (cw <= 0) continue;
    const nx = cx / cw, ny = cy / cw;
    if (nx < -1 || nx > 1 || ny < -1 || ny > 1) continue;
    icerde++;
    if (!kapaliMi((nx * 0.5 + 0.5) * vw, (-ny * 0.5 + 0.5) * vh)) acik++;
  }
  const noktaAlani = (2 * H) * (2 * H) / (N * N);
  return {
    vw, vh,
    hudYuzde: +(100 * kapali / toplam).toFixed(1),
    altBantPx: +(vh - bantUst).toFixed(0),
    altBantYuzde: +(100 * (vh - bantUst) / vh).toFixed(1),
    acikBr2: +(acik * noktaAlani).toFixed(1),
    kadrajdaBr2: +(icerde * noktaAlani).toFixed(1),
    tasan: oge.filter((o) => o.x < -1 || o.y < -1 || o.x + o.w > vw + 1 || o.y + o.h > vh + 1).length,
  };
};

async function main() {
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const sonuc = [];
  // Telefon yatayı kolları + tabletin TABANI (tablet kısa-ekran dalına girmez, kol almaz).
  /*
   * Her kol telefon yatayında koşar. Tablette yalnız İKİ satır anlamlı:
   *   · taban    — endişenin kadrajı (tablet kısa-ekran dalına girmez, kol almaz)
   *   · YD       — tek "hepKadraj" kolu, çünkü çözdüğü ikinci sorun tablette yaşıyor
   * Diğer kolları tablette göstermek yanıltıcı olurdu: onlar tablette hiç çalışmayacak.
   */
  const isler = [
    ...KOLLAR.map((k) => ({ kol: k, kadraj: KADRAJ, etiket: k.id })),
    { kol: { id: 'T-taban', ad: 'TABLET — bugunku hal (kol yok)', css: '' }, kadraj: TABLET, etiket: 'T-taban' },
    ...KOLLAR.filter((k) => k.hepKadraj).map((k) => ({
      kol: { ...k, id: 'T-' + k.id, ad: 'TABLET — ' + k.ad }, kadraj: TABLET, etiket: 'T-' + k.id,
    })),
  ];
  try {
    for (const { kol, kadraj } of isler) {
      const baglam = await tarayici.newContext({
        viewport: { width: kadraj.w, height: kadraj.h }, deviceScaleFactor: kadraj.dpr,
        isMobile: true, hasTouch: true,
      });
      const s = await baglam.newPage();
      const hatalar = [];
      s.on('pageerror', (e) => hatalar.push(e.message));
      await s.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
      await s.waitForTimeout(6000);
      await s.evaluate((pads) => {
        window.__setState({ padsDone: pads, padFills: {}, wallet: 1e9, diamonds: 1e6 });
        window.__zaman(1); window.__advanceTime(1);
      }, PADS);
      await s.waitForTimeout(1500);
      await s.evaluate(() => { window.__zaman(0); window.__teleport(0, 0); });
      await s.waitForTimeout(2500);
      if (kol.css) await s.addStyleTag({ content: kol.css });
      await s.waitForTimeout(900);

      const m = await s.evaluate(OLC);
      const p = path.join(OUT, `f1b-yhud-${kol.id}.png`);
      await s.screenshot({ path: p });
      sonuc.push({ kol, ...m, hata: hatalar.length });
      await baglam.close();
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }

  console.log('# YATAY HUD KOLLARI — telefon yatayi 915×412 (dpr 2,625) · ayni dunya, ayni nokta');
  console.log('# son satir TABLET yatayi (1280×800) — kol UYGULANMAZ, tabanin tablet kadrajidir');
  console.log('');
  console.log('  kol  aciklama                                 ekran        HUD%   altBant      acik zemin   kadrajda   tasan');
  const taban = sonuc[0];
  for (const s of sonuc) {
    const kaz = ((s.acikBr2 / taban.acikBr2 - 1) * 100);
    const fark = s.kol.id === 'Y0' ? '(taban)' : s.kol.id === 'T2' ? '' : (kaz >= 0 ? '+' : '') + kaz.toFixed(1) + '%';
    console.log(`  ${s.kol.id.padEnd(4)} ${s.kol.ad.padEnd(40)} ${String(s.vw + '×' + s.vh).padEnd(10)} ${String(s.hudYuzde).padStart(5)}  ${String(s.altBantPx + 'px/%' + s.altBantYuzde).padStart(11)}  ${String(s.acikBr2).padStart(8)} br² ${fark.padEnd(8)} ${String(s.kadrajdaBr2).padStart(7)}  ${String(s.tasan).padStart(5)}`);
  }
  console.log('');
  console.log('  NOT: YA/YC\'de "altBant %100" bir OLCU ARTEFAKTIDIR, bulgu degil — yan ray ekranin tum');
  console.log('  yuksegine uzandigi icin "dibe yasli yigin" tanimi orada anlamini yitirir. O kollarda');
  console.log('  gecerli karsilastirma HUD% sutunudur.');
  console.log('');
  for (const s of sonuc) console.log(`  ${s.kol.id} karesi: docs/gorsel/ss/f1b-yhud-${s.kol.id}.png · sayfa hatasi ${s.hata}`);
}

main().catch((e) => { console.error('KIRILDI:', e.message); process.exit(1); });
