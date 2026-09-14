/**
 * olcum-oturus.mjs — `tools/olcum-oturus.html`i koşturur, sayıları ve kareyi dışarı yazar (S19a).
 * Sunucuyu kendi kaldırır (duman.mjs / patron-bak.mjs deseni).
 *
 * Çıktı: docs/olcum-oturus.json (ham) · docs/olcum-oturus.txt (okunur tablo) ·
 *        docs/gorsel/ss/s19-oturus.png (üç kol yan yana, taburenin yanından)
 *
 * Kullanım: node tools/olcum-oturus.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KARE = process.env.KARE_YOL ?? 'docs/gorsel/ss/s19-oturus.png';

/**
 * PORTU ÖNCE BOŞ BUL. `--strictPort` ile dolu porta düşen vite sessizce ölür; yoklama ise porta
 * cevap veren ESKİ sunucuyu görüp "ayakta" der ve ölçüm bayat sayfayla koşar (bu tur tam bunu
 * yaşadı: üç ayrı render uygulaması BİREBİR aynı kareyi üretti). Bu yüzden port taranarak
 * seçilir, üstüne de sayfanın SURUM damgası denetlenir.
 */
async function bosPort(baslangic) {
  for (let port = baslangic; port < baslangic + 40; port++) {
    try {
      await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(700) });
    } catch {
      return port; // cevap yok = boş
    }
  }
  throw new Error('bos port bulunamadi');
}
const PORT = Number(process.env.BAK_PORT ?? (await bosPort(5240)));

/** Sayfadaki SURUM sabiti — bayat sunucu denetiminin karşılaştırma tarafı. */
const BEKLENEN_SURUM = Number(
  readFileSync(path.join(KOK, 'tools/olcum-oturus.html'), 'utf8').match(/const SURUM = (\d+)/)[1],
);

/** Sayfadaki sabitler kaynak dosyalardan SAPMASIN: ölçüm yanlış sayıyla koşmuş olmasın. */
function kaynakSabitleri() {
  const actor = readFileSync(path.join(KOK, 'src/config/actor.ts'), 'utf8');
  const look = readFileSync(path.join(KOK, 'src/components/three/tableLook.ts'), 'utf8');
  const say = (metin, desen) => {
    const m = metin.match(desen);
    return m ? Number(m[1]) : null;
  };
  return {
    ACTOR_HEIGHT: say(actor, /ACTOR_HEIGHT = ([\d.]+)/),
    KAY_AUTHORED: say(actor, /KAY_AUTHORED = ([\d.]+)/),
    KAY_KAFA_OLCEK: say(actor, /KAY_KAFA_OLCEK: number = ([\d.]+)/),
    KAY_OTURMA_KALDIRMA: say(actor, /KAY_OTURMA_KALDIRMA = ([\d.]+)/),
    STOOL_S: say(look, /STOOL_S = ([\d.]+)/),
  };
}

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});

const bekle = async () => {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true;
    } catch {
      /* sunucu daha ayakta değil */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

const yz = (v) => String(v).replace('.', ',');

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1500, height: 820 }, deviceScaleFactor: 2 });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message.slice(0, 200)));
  p.on('console', (m) => {
    if (m.type() === 'error') hatalar.push(m.text().slice(0, 200));
  });
  await p.goto(`http://127.0.0.1:${PORT}/tools/olcum-oturus.html`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.title === 'hazir', { timeout: 90000 });
  const olcum = await p.evaluate(() => window.__olcum);
  if (olcum.surum !== BEKLENEN_SURUM) {
    throw new Error(
      `BAYAT SAYFA: sunucu surum ${olcum.surum} veriyor, dosyada ${BEKLENEN_SURUM} yaziyor. ` +
        `Portta eski bir vite sunucusu asili olabilir (port ${PORT}).`,
    );
  }
  mkdirSync(path.dirname(path.join(KOK, KARE)), { recursive: true });
  await p.screenshot({ path: path.join(KOK, KARE) });
  await b.close();

  olcum.kaynakDosyalar = kaynakSabitleri();
  const sapma = Object.entries(olcum.kaynakDosyalar).filter(([k, v]) => {
    const sayfa = { ...olcum.kaynak, KAY_KAFA_OLCEK: 0.75, KAY_AUTHORED: 2.204 }[k];
    return sayfa !== undefined && v !== null && Math.abs(sayfa - v) > 1e-9;
  });
  olcum.sabitSapmasi = sapma.map(([k]) => k);

  writeFileSync(path.join(KOK, 'docs/olcum-oturus.json'), JSON.stringify(olcum, null, 2), 'utf8');

  const sat = [];
  sat.push(`OLCUM — OTURUS CAPASI (S19a)   damga: ${olcum.damga}`);
  sat.push('');
  sat.push(`TABURE (chair_stool_wood x ${yz(olcum.kaynak.STOOL_S)}): oturak ustu ${yz(olcum.tabure.oturakUstu)} br · ` +
    `kenar yaricapi ${yz(olcum.tabure.kenarYaricapi)} br · kose yaricapi ${yz(olcum.tabure.koseYaricapi)} br · ` +
    `${olcum.tabure.cokgen.length} kenarli cokgen (${olcum.tabure.bantTepe} tepe)`);
  sat.push(`MASA ACIKLIGI: tabure merkezi -> tabla kenari ${yz(olcum.govdeler[0].masaAcikligi)} br (capa bu sayiyi yemez)`);
  sat.push(`GOVDE: KAY_SCALE ${yz(olcum.kaynak.KAY_SCALE)} · dusey capa KAY_OTURMA_KALDIRMA ${yz(olcum.kaynak.KAY_OTURMA_KALDIRMA)} · temas bandi ±${yz(olcum.kaynak.BANT)} br`);
  if (olcum.sabitSapmasi.length) sat.push(`!! SAYFA SABITI KAYNAKTAN SAPIYOR: ${olcum.sabitSapmasi.join(', ')}`);
  sat.push('');
  sat.push('=== KALCA KEMIGI: oturus klibinde kokten NE KADAR ILERIDE (z) ===');
  sat.push('govde       kalca x     kalca y     kalca z    deri z araligi');
  for (const g of olcum.govdeler) {
    sat.push(
      `${g.govde.padEnd(11)} ${yz(g.kalcaKemigi.x).padStart(7)} ${yz(g.kalcaKemigi.y).padStart(11)} ` +
        `${yz(g.kalcaKemigi.z).padStart(11)}    ${yz(g.govdeKutu.zMin)} … ${yz(g.govdeKutu.zMax)}`,
    );
  }
  sat.push('');
  sat.push('=== TEMAS: oturak bandindaki deri oturak COKGENinin icinde mi ===');
  sat.push('(ARKA tasma = kalcanin sarkmasi — sorulan kusur bu · ON tasma = uyluk, oturusun dogasi)');
  sat.push('govde       kol                            dz    temas   ARKA tasma   on tasma   yan tasma   deri z ileri ucu');
  for (const g of olcum.govdeler) {
    const kollar = [
      ['O1 BUGUN (capa yok)', g.O1_bugun],
      ['O2 kalca merkezli', g.O2_kalcaMerkezli],
      ['O3 kalca oturur (en kucuk)', g.O3_enIyiTemas],
    ];
    for (const [ad, k] of kollar) {
      sat.push(
        `${g.govde.padEnd(11)} ${ad.padEnd(26)} ${yz(k.dz ?? 0).padStart(6)}  ${yz(k.temasOrani).padStart(6)}  ` +
          `${yz(k.arkaTasma).padStart(10)}  ${yz(k.onTasma).padStart(9)}  ${yz(k.yanTasma).padStart(10)}  ` +
          `${yz(+(g.govdeKutu.zMax + (k.dz ?? 0)).toFixed(3)).padStart(16)}`,
      );
    }
  }
  const oa = olcum.govdeler[0].O3_enIyiTemas.oturanAralik;
  if (oa) sat.push(`(Knight: arka tasma ${yz(oa[0])} … ${yz(oa[1])} araliginda SIFIR — tolerans ${yz(+(oa[1] - oa[0]).toFixed(2))} br)`);
  sat.push('');
  sat.push('=== SUPURME (Knight): dz -0,30 … +0,45 ===');
  sat.push('dz       temas   ARKA tasma   on tasma   yan tasma');
  for (const s of olcum.govdeler[0].supurme) {
    if (Math.round(s.dz * 100) % 2 !== 0) continue; // 2 cm adimla yazdir (tam liste JSON'da)
    sat.push(`${yz(s.dz).padStart(6)}  ${yz(s.temasOrani).padStart(6)}  ${yz(s.arkaTasma).padStart(10)}  ${yz(s.onTasma).padStart(9)}  ${yz(s.yanTasma).padStart(10)}`);
  }
  sat.push('');
  sat.push('=== TEK SAYI KOLLARI: bir dz bes govdeyi birden oturtuyor mu ===');
  sat.push('(kod tek sabit yazar; bu tablo o sabitin BES govdedeki EN KOTU degerini gosterir)');
  sat.push('dz       en kotu ARKA   en kotu ON   en ileri deri   masa acikligi 0,61');
  for (const dz of [0, 0.17, 0.2, 0.22, 0.24, 0.26, 0.28, 0.32]) {
    const satirlar = olcum.govdeler.map((g) => g.supurme.find((s2) => Math.abs(s2.dz - dz) < 1e-6));
    if (satirlar.some((x) => !x)) continue;
    const arka = Math.max(...satirlar.map((x) => x.arkaTasma));
    const on = Math.max(...satirlar.map((x) => x.onTasma));
    const ileri = Math.max(...olcum.govdeler.map((g) => g.govdeKutu.zMax + dz));
    sat.push(
      `${yz(dz).padStart(6)}  ${yz(+arka.toFixed(3)).padStart(12)}  ${yz(+on.toFixed(3)).padStart(11)}  ` +
        `${yz(+ileri.toFixed(3)).padStart(14)}   ${ileri < olcum.govdeler[0].masaAcikligi ? 'TEMIZ' : 'MASAYA GIRER'}`,
    );
  }
  sat.push('');
  sat.push(`kare: ${KARE}`);
  sat.push(`konsol hatasi: ${hatalar.length ? hatalar.slice(0, 3).join(' | ') : 'yok'}`);
  const metin = sat.join('\n') + '\n';
  writeFileSync(path.join(KOK, 'docs/olcum-oturus.txt'), metin, 'utf8');
  console.log(metin);
} finally {
  sunucu.kill();
}
