/**
 * mutasyon-vitrin-f4c.mjs — F4c 💎 vitrini bekçisinin MUTASYON SINAVI.
 *
 * Sahiplik kuralına, 💎 düşümüne, kurucunun pakete bağlılığına, teklif kanalına ve kayda bilerek
 * kusur sokulur; `tests/vitrin-f4c.test.ts` düşmelidir. Gövde `mutasyon-play-games-f4b.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-vitrin-f4c.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/vitrin-f4c.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  { ad: 'M1 kurucu listeden de alinir', dosya: 'src/game/vitrin.ts',
    bul: "if (u.paket) return u.paket === 'baslangic' && s.satin.baslangic;", koy: "if (u.paket) return s.ownedCosmetics.includes(`${tur}:${id}`) || s.satin.baslangic;", ne: 'paketin ozel urunu baska yoldan acilir' },
  { ad: 'M2 odenmis urun hep sahip', dosya: 'src/game/vitrin.ts',
    bul: "return u.diamonds === 0 || s.ownedCosmetics.includes(`${tur}:${id}`);", koy: 'return true;', ne: 'her kozmetik bedava' },
  { ad: 'M3 iade edilen kurucu giyili kalir', dosya: 'src/game/vitrin.ts',
    bul: "vitrinSahip(s, 'outfit', s.outfit) ? s.outfit : 'klasik';", koy: 's.outfit;', ne: 'iade sonrasi kurucu kalir' },
  { ad: 'M4 her dokunusta elmas duser', dosya: 'src/game/store.ts',
    bul: '    if (!vitrinSahip(s, kind, id)) {\n      if (urun.paket', koy: '    if (true) {\n      if (urun.paket', ne: 'sahip olunana tekrar para' },
  { ad: 'M5 paket urunu elmasla satilir', dosya: 'src/game/store.ts',
    bul: 'if (urun.paket || diamonds.lt(urun.diamonds)) return false;', koy: 'if (diamonds.lt(urun.diamonds)) return false;', ne: 'kurucu 0 elmasa alinir' },
  { ad: 'M6 paket alininca kurucu giyilmez', dosya: 'src/game/store.ts',
    bul: "...(kurucu ? { outfit: 'kurucu' } : {})", koy: '', ne: 'paketin gorunen karsiligi yok' },
  { ad: 'M7 teklif Usta oncesi', dosya: 'src/game/vitrin.ts',
    bul: '(s.mastersOwned?.length ?? 0) >= 1', koy: '(s.mastersOwned?.length ?? 0) >= 0', ne: 'teklif oyunun ilk saniyesinde' },
  { ad: 'M8 teklif tekrar tekrar', dosya: 'src/game/vitrin.ts',
    bul: ' && !s.satin.teklif;', koy: ';', ne: 'kapatilan teklif geri gelir' },
  { ad: 'M9 teklif panelin ustune', dosya: 'src/game/ekranKanali.ts',
    bul: '  if (g.panelAcik || g.bildirimVar || g.gecisPenceresi) return null;', koy: "  if (g.baslangicTeklifHazir) return 'teklif-baslangic';\n  if (g.panelAcik || g.bildirimVar || g.gecisPenceresi) return null;", ne: 'teklif panelin/eylemin ustune biner' },
  { ad: 'M10 kapatma bayragi yazmaz', dosya: 'src/game/store.ts',
    bul: '    set({ satin: { ...s.satin, teklif: true } });', koy: '', ne: 'Simdi degil ise yaramaz' },
  { ad: 'M11 tepsi kayda girmez', dosya: 'src/game/store.ts',
    bul: '    trayLook: s.trayLook,\n', koy: '', ne: 'satin alinan tepsi yeniden acilista kaybolur' },
  { ad: 'M12 bulut teklifi unutur', dosya: 'src/game/bulut.ts',
    bul: 'teklif: !!a.teklif || !!b.teklif,', koy: 'teklif: !!a.teklif,', ne: 'eski bulut teklifi yeniden gosterir' },
  { ad: 'M13 fes baska kiyafette', dosya: 'src/config/kozmetik.ts',
    bul: "sef: { gomlek: '#fbfaf6', pantolon: '#1f1d1a', yelek: '#1f1d1a', papyon: '#9b1c22' },", koy: "sef: { gomlek: '#fbfaf6', pantolon: '#1f1d1a', yelek: '#1f1d1a', papyon: '#9b1c22', fes: '#9b1c22' },", ne: 'paket ozeli elmasla alinir' },
  { ad: 'M14 teklifte geri sayim', dosya: 'src/components/ui/HUD.tsx',
    bul: '  const [bekle, setBekle] = useState(false);\n  const al = async', koy: '  const [bekle, setBekle] = useState(false);\n  useEffect(() => { const t = setTimeout(onClose, 30000); return () => clearTimeout(t); });\n  const al = async', ne: 'baski dili (sure) teklife girer' },
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

// KIRLI BASLANGIC KORUMASI (gerekce `mutasyon-izdiham-t6.mjs`): askida kalmis bir onceki kosu
// dosyayi mutasyonlu birakmissa sinav KOSMAZ.
const kirli = MUTASYONLAR.filter((m) => m.koy && asil.get(m.dosya).includes(m.koy) && !asil.get(m.dosya).includes(m.bul));
if (kirli.length) {
  console.error('!! KIRLI BASLANGIC — kaynak dosyada mutasyon izi var, sinav KOSMADI:');
  for (const m of kirli) console.error(`   · ${m.ad} (${m.dosya})`);
  process.exit(2);
}

let kacan = 0;
let bulunamayan = 0;
console.log('=== F4c vitrin bekcisi — mutasyon sinavi ===');
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
      execFileSync('npx', ['vitest', 'run', ...TESTLER], { cwd: KOK, stdio: 'pipe', shell: true, timeout: 180_000 });
    } catch {
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
