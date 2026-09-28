/**
 * mutasyon-ogretici-e5.mjs — E5 öğretici bekçisinin MUTASYON SINAVI.
 *
 * Öğreticinin adım türetmesine, bitişine, atlamasına, kanal sırasına, dünya hedefine ve kayda
 * bilerek kusur sokulur; `tests/ogretici-e5.test.ts` düşmelidir. Gövde `mutasyon-tabela-f4c3.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-ogretici-e5.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/ogretici-e5.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  { ad: 'M1 bitis bir erken', dosya: 'src/game/onboarding.ts',
    bul: 'export const OGRETICI_BITIS = Math.max(...GOREV_INDEX) + 1;', koy: 'export const OGRETICI_BITIS = Math.max(...GOREV_INDEX);',
    ne: 'bitis esigi son ogretici gorevini disarida birakir' },
  { ad: 'M2 Atla yok sayilir', dosya: 'src/game/onboarding.ts',
    bul: '  if (g.atlandi) return null;\n', koy: '',
    ne: 'oyuncu atlasa da ogretici geri gelir' },
  // Ilk kosuda "bitis kontrolu yok" mutasyonu KACTI: `kartIndex >= BITIS` kontrolu indexOf'un
  // zaten yaptigi isi tekrarliyordu. Kod sadelesti; bitisi tasiyan satir artik bu.
  { ad: 'M3 hat disi kart eslenir', dosya: 'src/game/onboarding.ts',
    bul: '  if (i < 0) return null;\n', koy: '',
    ne: 'ilerlemis kayitta ogretici aranir (cokme / yanlis adim)' },
  { ad: 'M4 yuru adimi yok', dosya: 'src/game/onboarding.ts',
    bul: "  return adim === 'cay-al' && !g.yurudu ? 'yuru' : adim;", koy: '  return adim;',
    ne: 'suruklenen el hic cikmaz' },
  { ad: 'M5 servis tepsiye bakmaz', dosya: 'src/game/onboarding.ts',
    bul: '    if (w.tray <= 0) return null;\n', koy: '',
    ne: 'bos tepsiyle iz musteriye gider, ocaga donmez' },
  { ad: 'M6 tost bekleyen de hedef', dosya: 'src/game/onboarding.ts',
    bul: " && m.product !== 'tost'", koy: '',
    ne: 'cay tepsisiyle tost isteyene yonlendirir' },
  { ad: 'M7 kanal tepsi ipucunun onunde', dosya: 'src/game/ekranKanali.ts',
    bul: "  if (g.tepsiIpucuHazir) return 'ipucu-tepsi';\n  if (g.ogreticiHazir) return 'ogretici';\n",
    koy: "  if (g.ogreticiHazir) return 'ogretici';\n  if (g.tepsiIpucuHazir) return 'ipucu-tepsi';\n",
    ne: 'ekran iki seyi birden soyler / ipucu hic cikmaz' },
  { ad: 'M8 geri tusu atlatir', dosya: 'src/game/ekranKanali.ts',
    bul: "  if (kanal === 'ogretici') return 'kucult';\n", koy: '',
    ne: 'geri tusu ogreticiyi kazayla kapatir/yutar' },
  { ad: 'M9 atlama kayda girmez', dosya: 'src/game/store.ts',
    bul: '    ogreticiAtlandi: s.ogreticiAtlandi,\n', koy: '',
    ne: 'atlanan ogretici her acilista geri gelir' },
  { ad: 'M10 metin tavani asilir', dosya: 'src/config/onboarding.ts',
    bul: "    pad: 'Alanda dur, masa açılsın',", koy: "    pad: 'Alanın üstünde dur, masa açılsın',",
    ne: '390 px karede satir kesilir' },
];

const dosyalar = [...new Set(MUTASYONLAR.map((m) => m.dosya))];
const asil = new Map();
const crlf = new Map();
for (const d of dosyalar) {
  const ham = readFileSync(path.join(KOK, d), 'utf8');
  crlf.set(d, ham.includes('\r\n'));
  asil.set(d, ham.replace(/\r\n/g, '\n'));
}
const yaz = (d, metin) => writeFileSync(path.join(KOK, d), crlf.get(d) ? metin.replace(/\n/g, '\r\n') : metin, 'utf8');
const hepsiniGeriYaz = () => { for (const d of dosyalar) yaz(d, asil.get(d)); };

// KIRLI BASLANGIC KORUMASI: askida kalmis bir onceki kosu dosyayi mutasyonlu birakmissa sinav KOSMAZ.
const kirli = MUTASYONLAR.filter((m) => m.koy && asil.get(m.dosya).includes(m.koy) && !asil.get(m.dosya).includes(m.bul));
if (kirli.length) {
  console.error('!! KIRLI BASLANGIC — kaynak dosyada mutasyon izi var, sinav KOSMADI:');
  for (const m of kirli) console.error(`   · ${m.ad} (${m.dosya})`);
  process.exit(2);
}

let kacan = 0;
let bulunamayan = 0;
console.log('=== E5 ogretici bekcisi — mutasyon sinavi ===');
console.log('');
try {
  for (const m of MUTASYONLAR) {
    const govde = asil.get(m.dosya);
    if (!govde.includes(m.bul)) {
      console.log(`?? ${m.ad}: KALIP BULUNAMADI (${m.dosya})`);
      bulunamayan++;
      continue;
    }
    yaz(m.dosya, govde.replace(m.bul, m.koy));
    let dustu = false;
    try {
      execFileSync(path.join(KOK, 'node_modules', '.bin', 'vitest'), ['run', ...TESTLER], { cwd: KOK, stdio: 'pipe', shell: true, timeout: 400_000 });
    } catch (e) {
      // Zaman asimi YAKALAMA sayilmaz — bulunamayan gibi sayilir.
      if (e.signal || e.killed) {
        yaz(m.dosya, govde);
        console.log(`?? ${m.ad}: ZAMAN ASIMI`);
        bulunamayan++;
        continue;
      }
      dustu = true;
    }
    yaz(m.dosya, govde);
    console.log(`${dustu ? 'OK ' : '!! '}${m.ad} -> ${dustu ? 'bekci YAKALADI' : 'bekci KACIRDI'}`);
    console.log(`    ${m.ne}`);
    if (!dustu) kacan++;
  }
} finally {
  hepsiniGeriYaz();
}

console.log('');
console.log(`${MUTASYONLAR.length - kacan - bulunamayan}/${MUTASYONLAR.length} mutasyon yakalandi.`);
if (kacan || bulunamayan) {
  console.error('!! SINAV TEMIZ DEGIL — kacan mutasyon ya da bulunamayan kalip var.');
  process.exitCode = 1;
}
