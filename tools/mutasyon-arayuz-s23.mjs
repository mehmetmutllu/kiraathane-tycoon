/**
 * mutasyon-arayuz-s23.mjs — S23 BEKÇİSİNİ MUTASYONLA DOĞRULAR.
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir. D-084'ün
 * kesilmez maddesi bu — "bekçi testi, en az 2 mutasyonla doğrulama". Her mutasyon kaynakta
 * kusuru GERİ GETİRİR; bekçi o mutasyonda kırmızı yanmıyorsa o kolun bekçisi yoktur ve
 * araç bunu "KAÇTI" diye basar (kaçan mutasyon kodun zayıf yerini gösterir).
 *
 * Kullanım: node tools/mutasyon-arayuz-s23.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const MARKER = 'src/components/three/GroundMarker.tsx';
const PANEL = 'src/components/ui/CharacterPanel.tsx';
const HUD = 'src/components/ui/HUD.tsx';
const CSS = 'src/index.css';

/** Her mutasyon: dosya · bul · değiştir · hangi kusuru geri getiriyor. */
const MUTASYONLAR = [
  { ad: 'M1 ok eni bloktan koparılıyor', dosya: MARKER,
    bul: 'okShape(OK_GENIS * r)', koy: 'okShape(0.554 * r)',
    kusur: 'çizilen en yine ayrı bir sayı — %63 taşma geri gelir' },
  // NOT: `OK_GENIS`i küçültmek KUSUR DEĞİL — ok ondan türediği için bütün açıklıklar korunur;
  // bu yüzden o mutasyon elendi (ilk turda "kaçtı" diye çıkmıştı, geçersiz mutasyonmuş).
  // Asıl tehlike okun BOYUNUN bloktan bağımsız büyümesi: chevron yukarı uzayıp parantezin
  // bandına girer ve "çerçeveye değiyor" kusuru başka kapıdan döner.
  { ad: 'M2 ok boyu parantezin bandına uzatılıyor', dosya: MARKER,
    bul: 'export const OK_YUKSEKLIK_ORAN = 0.75;', koy: 'export const OK_YUKSEKLIK_ORAN = 1.2;',
    kusur: 'ok yukarı uzayıp üst parantezin koluna girer' },
  { ad: 'M3 chevron tabandan kuruluyor', dosya: MARKER,
    bul: 'const alt = -h / 2;', koy: 'const alt = 0;',
    kusur: 'ok yukarı büyüyüp üst parantezin bandına girer' },
  { ad: 'M4 kenar payı parantez kalınlığının altına düşüyor', dosya: MARKER,
    bul: 'export const KENAR_PAYI = 0.18;', koy: 'export const KENAR_PAYI = 0.16;',
    kusur: 'ok parantezin dikey kolunun sütununa girer' },
  { ad: 'M5 panel eski ilkel gövdeye dönüyor', dosya: PANEL,
    bul: '<KayActor kind={kind} tasiyor>', koy: '<OwnerBody /><KayActor kind={kind} tasiyor>',
    kusur: 'dört kimlik işareti yine ayrışır' },
  { ad: 'M6 vitrinin zemini kalkıyor', dosya: PANEL,
    bul: '<FloorPatch', koy: '<group name="yok" /><Yok',
    kusur: 'karakter yine boşlukta durur (K3 bozulur)' },
  { ad: 'M7 tepsi elden düşüyor', dosya: PANEL,
    bul: 'position={KAY_TEPSI_KAYMA}', koy: 'position={[0, 0.95, 0.4]}',
    kusur: 'S16/D-114 geri alınır, tepsi ele takılı değil' },
  { ad: 'M8 karakter kartı gövdenin boyunu almıyor', dosya: CSS,
    bul: '.char-card {\n  padding-top: 14px;\n  flex: 1;', koy: '.char-card {\n  padding-top: 14px;\n  flex: none;',
    kusur: 'vitrin artan yeri yiyemez, 353 px kuyruk döner' },
  { ad: 'M9 vitrin sabit yüksekliğe dönüyor', dosya: CSS,
    bul: '  flex: 1 1 auto;\n  min-height: 230px;', koy: '  height: 168px;',
    kusur: 'kutu yine basık, gövde eninin %22-24\'ünü kullanır' },
  { ad: 'M10 mağaza yine kilitli sekmede açılıyor', dosya: HUD,
    bul: "useState<'table' | 'floor' | 'wall'>(tableUnlocked ? 'table' : 'floor')",
    koy: "useState<'table' | 'floor' | 'wall'>('table')",
    kusur: 'mağaza satılacak bir şey göstermeden açılır' },
  { ad: 'M11 kilitli kart yine gövdeye yayılıyor', dosya: CSS,
    bul: '.shop-locked {\n  flex: none;', koy: '.shop-locked {\n  flex: 1;',
    kusur: '224 px\'lik iç delik geri gelir' },
  { ad: 'M12 künye bloğu kalkıyor', dosya: HUD,
    bul: '<div className="kunye" data-testid="kunye">', koy: '<div className="kunye">',
    kusur: 'Ayarlar ekranı yine %31 dolu kalır' },
];

/**
 * SATIR SONU NORMALİZE EDİLİR. Bu depoda `.gitattributes` yok ve `core.autocrlf` her checkout'ta
 * (ve her `git stash pop`'ta) kaynakları CRLF'e çeviriyor; çok satırlı kalıplar o an sessizce
 * BULUNAMIYOR ve araç "kaçtı" diye yalan söylüyor (bir koşuda dört mutasyon birden böyle düştü).
 * Mutasyon sırasında dosya LF ile yazılır, sonunda ORİJİNAL bayt bayt geri konur.
 */
const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/arayuz-s23.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('S23 bekçisi — mutasyon doğrulaması\n');
let tutan = 0;
const kacan = [];
try {
  for (const m of MUTASYONLAR) {
    const asil = ded(m.dosya);
    const duz = lf(asil);
    if (!duz.includes(m.bul)) {
      kacan.push(`${m.ad} — KALIP BULUNAMADI (${m.dosya})`);
      console.log(`  ?  ${m.ad} — kalıp bulunamadı`);
      continue;
    }
    writeFileSync(y(m.dosya), duz.replace(m.bul, m.koy), 'utf8');
    const kirmizi = testKirmiziMi();
    writeFileSync(y(m.dosya), asil, 'utf8');
    if (kirmizi) { tutan++; console.log(`  ✓  ${m.ad}`); }
    else { kacan.push(`${m.ad} — ${m.kusur}`); console.log(`  ✗  KAÇTI: ${m.ad}`); }
  }
} finally {
  geri();
}

console.log(`\n${tutan}/${MUTASYONLAR.length} mutasyon kırmızı yandı.`);
if (kacan.length) {
  console.log('KAÇANLAR (bekçisiz kollar):');
  for (const k of kacan) console.log('  ! ' + k);
  process.exit(1);
}
