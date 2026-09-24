/**
 * mutasyon-play-games-f4b.mjs — F4b bekçisinin MUTASYON SINAVI (D-153).
 *
 * Çakışma kuralına (daha ileri kazanır), bulutu ezmeme korumalarına, sıfırlamaya, birleştirmeye,
 * başarım türetmesine ve native kablolara bilerek kusur sokulur; `tests/play-games-f4b.test.ts`
 * düşmelidir. Gövde `mutasyon-iap-f4a.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-play-games-f4b.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/play-games-f4b.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  { ad: 'M1 esitlikte ileri say', dosya: 'src/game/bulut.ts',
    bul: 'return k > 0 || (k === 0 && a.xp > b.xp);', koy: 'return k >= 0;', ne: 'esit bulut her acilista yeniden yuklenir' },
  { ad: 'M2 XP ile once karsilastir', dosya: 'src/game/bulut.ts',
    bul: 'const k = D(a.lifetime).cmp(D(b.lifetime));', koy: 'const k = Math.sign(a.xp - b.xp);', ne: 'daha az kazancli kayit kazanir' },
  { ad: 'M3 ileri bulutun ustune yazilir', dosya: 'src/game/bulut.ts',
    bul: "if (!o.zorla && bilinen && kayitIleriMi(bilinen, yerel)) return false;", koy: '', ne: 'diger cihazin ilerlemesi silinir' },
  { ad: 'M4 okunamayan bulut ezilir', dosya: 'src/game/bulut.ts',
    bul: 'if (!arkaUc || !kanca || !girisli || !okundu || kayitKilitli()) return false;', koy: 'if (!arkaUc || !kanca || !girisli || kayitKilitli()) return false;', ne: 'bilinmeyen kayit ezilir' },
  { ad: 'M5 okuma hatasinda devam', dosya: 'src/game/bulut.ts',
    bul: 'if (ham === undefined) return; //', koy: 'if (ham === undefined) { okundu = true; await bulutKaydet({ zorla: false }); return; } //', ne: 'okunamayan bulutun ustune yazar' },
  { ad: 'M6 sifirlama zorlamaz', dosya: 'src/game/bulut.ts',
    bul: 'export const bulutSifirla = () => bulutKaydet({ zorla: true });', koy: 'export const bulutSifirla = () => bulutKaydet({ zorla: false });', ne: 'sifirlanan oyun acilista geri gelir' },
  { ad: 'M7 ayarlar buluttan gelir', dosya: 'src/game/bulut.ts',
    bul: '    settings: { ...yerel.settings },\n', koy: '', ne: 'telefonun ses ayari eski kayitla ezilir' },
  { ad: 'M8 reklamsiz birlesmez', dosya: 'src/game/bulut.ts',
    bul: 'reklamsiz: a.reklamsiz || b.reklamsiz,', koy: 'reklamsiz: a.reklamsiz,', ne: 'satin alinan reklamsizlik duser' },
  { ad: 'M9 yeni surumlu bulut yuklenir', dosya: 'src/game/bulut.ts',
    bul: 'if (!bulut.yeniSurum) kanca.yukle(', koy: 'kanca.yukle(', ne: 'bilinmeyen sema eski pakete yuklenir' },
  { ad: 'M10 imza korumasi yok', dosya: 'src/game/bulut.ts',
    bul: 'if (!o.zorla && imza === sonImza) return false;', koy: '', ne: 'her yoklamada ayni kayit yazilir' },
  { ad: 'M11 basarim tekrar gonderilir', dosya: 'src/game/bulut.ts',
    bul: '    if (gonderilen.has(anahtar)) continue;\n', koy: '', ne: 'her 10 sn tum basarimlar yeniden' },
  { ad: 'M12 basarim girissiz gonderilir', dosya: 'src/game/bulut.ts',
    bul: 'if (!arkaUc || !kanca || !girisli) return 0;', koy: 'if (!arkaUc || !kanca) return 0;', ne: 'girissiz cagri' },
  { ad: 'M13 koleksiyon eksikle acilir', dosya: 'src/game/basarim.ts',
    bul: 'hedef: s.goalsClaimed.length >= totalTiers() ? 1 : 0,', koy: 'hedef: s.goalsClaimed.length >= totalTiers() - 1 ? 1 : 0,', ne: 'erken basarim' },
  { ad: 'M14 garson sayaci yanlis', dosya: 'src/game/basarim.ts',
    bul: 'garson: s.stats.waiterServed,', koy: 'garson: s.stats.teasServed,', ne: 'garsonsuz ilk_garson' },
  { ad: 'M15 cihazda sahte bulut', dosya: 'src/game/bulut.ts',
    bul: 'Capacitor.isNativePlatform() ? yerliArkaUc() : sahteArkaUc()', koy: 'sahteArkaUc()', ne: 'cihazda bellekte bulut, kayit kaybolur' },
  { ad: 'M16 APP_ID bosken SDK kurulur', dosya: 'android/app/src/main/java/com/memedobro/teahousetycoon/PlayGamesPlugin.java',
    bul: 'if (id == 0 || c.getString(id).trim().isEmpty()) return;', koy: 'if (id == 0) return;', ne: 'kimliksiz kurulum hata penceresi' },
  { ad: 'M17 sifirlama bulutu unutur', dosya: 'src/components/ui/HUD.tsx',
    bul: '    void bulutSifirla();\n', koy: '', ne: 'Ayarlar sifirlamasi buluttan geri gelir' },
  { ad: 'M18 arka planda yazmaz', dosya: 'src/App.tsx',
    bul: '        void bulutKaydet();\n', koy: '', ne: 'uygulama kapaninca son ilerleme bulutta yok' },
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
console.log('=== F4b Play Games bekcisi — mutasyon sinavi ===');
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
