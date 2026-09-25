/**
 * mutasyon-magaza-f4c4.mjs — F4c-4 💎 vitrini cilası bekçisinin MUTASYON SINAVI (D-157).
 *
 * Dekor kadrajına, önizlemenin geçiciliğine ve alım geri bildirimine bilerek kusur sokulur;
 * `tests/magaza-f4c4.test.ts` düşmelidir. Gövde `mutasyon-tabela-f4c3.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-magaza-f4c4.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/magaza-f4c4.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  { ad: 'M1 eski mesafe (%30)', dosya: 'src/config/decor.ts',
    bul: '  pay: 0.25,', koy: '  pay: 0.3,', ne: 'kullanicinin sectigi "biraz daha uzak" geri alinir' },
  { ad: 'M2 kamera kosede bakar', dosya: 'src/game/dekorKadraj.ts',
    bul: '  const hedef: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];',
    koy: '  const hedef: V3 = [min[0], min[1], min[2]];', ne: 'esya ortali degil (kullanici sikayeti)' },
  { ad: 'M3 mesafe boydan bagimsiz', dosya: 'src/game/dekorKadraj.ts',
    bul: '  const olcu = Math.max(boy, yatay * K.yatayCarpan, K.enAzOlcu);', koy: '  const olcu = 1;', ne: 'kanarya kafesi minicik, koltuk kutudan tasar' },
  { ad: 'M4 oyun acisi (guneyden)', dosya: 'src/config/decor.ts',
    bul: '    sol: [0.8, 0.85, 0.9],', koy: '    sol: [0, 1, 1],', ne: 'yan duvar esyasi yandan gorunur, tablo 0 px (B10)' },
  { ad: 'M5 onizleme salon kilidini asar', dosya: 'src/game/vitrin.ts',
    bul: '  if (!onizleme || !yuva || !dekorAcik(onizleme, s.areasOpen)) return liste;', koy: '  if (!onizleme || !yuva) return liste;', ne: 'kapali salonda esya cizilir' },
  { ad: 'M6 onizleme yuvadakinin ustune', dosya: 'src/game/vitrin.ts',
    bul: '  return [...liste.filter((d) => d.yuva !== yuva), { yuva, id: onizleme }];', koy: '  return [...liste, { yuva, id: onizleme }];', ne: 'iki koltuk ust uste cizilir' },
  { ad: 'M7 onizleme kayda girer', dosya: 'src/game/store.ts',
    bul: '    kafeAdi: s.kafeAdi,\n', koy: '    kafeAdi: s.kafeAdi,\n    dekorOnizleme: s.dekorOnizleme,\n', ne: 'gecici hal kayda yazilir' },
  { ad: 'M8 dekor alimi sessiz', dosya: 'src/game/store.ts',
    bul: "      notice: { text: satinBildirimi(kind, urun.label, { kaldirildi }), ttl: C.cosmetics.bildirimSn, kind: 'satin' },\n", koy: '', ne: 'alim eskisi gibi sessiz biter' },
  { ad: 'M9 bildirim cizilmez', dosya: 'src/game/rules.ts',
    bul: "['level', 'reveal', 'satin']", koy: "['level', 'reveal']", ne: 'bildirim uretilir ama ekrana cikmaz' },
  { ad: 'M10 alim sesi yok', dosya: 'src/game/audio.ts',
    bul: ' || arttiMi(onceki.alimSayisi, simdiki.alimSayisi)', koy: '', ne: 'kozmetik alimi sessiz' },
  { ad: 'M11 geri yukleme ses calar', dosya: 'src/game/audioBridge.ts',
    bul: '    alimSayisi: s.ownedCosmetics.length + (s.satin.islenen ?? []).length,', koy: '    alimSayisi: s.ownedCosmetics.length + (s.satin.islenen ?? []).length + (s.satin.reklamsiz ? 1 : 0),', ne: 'telefon degistirip geri yukleyince satin alma sesi' },
  { ad: 'M12 eski metin geri gelir', dosya: 'src/components/ui/HUD.tsx',
    bul: "const MAGAZA_YOK = 'Mağazaya bağlanılamadı';", koy: "const MAGAZA_YOK = 'Mağaza hazır değil';", ne: 'sebep/cozum soylemeyen metin' },
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
console.log('=== F4c-4 magaza cilasi bekcisi — mutasyon sinavi ===');
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
      // Zaman asimi YAKALAMA sayilmaz (yavas makinede sahte "OK" uretiyordu) — bulunamayan gibi sayilir.
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
