/**
 * mutasyon-hud-r3.mjs — R3 BEKÇİSİNİ (tests/hud-r3.test.ts) MUTASYONLA DOĞRULAR.
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Her mutasyon kaynakta R3'ün kapattığı kusuru GERİ GETİRİR; bekçi o
 * mutasyonda kırmızı yanmıyorsa o kolun bekçisi yoktur ve araç "KAÇTI" diye basar.
 *
 * Kullanım: node tools/mutasyon-hud-r3.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const HUD = 'src/components/ui/HUD.tsx';
const HUD_CSS = 'src/components/ui/hud.css';
const INDEX = 'src/index.css';
const ICONS = 'src/components/ui/icons.tsx';
const SAVE = 'src/game/save.ts';

/** Her mutasyon: dosya · bul · koy · hangi kusuru geri getiriyor. */
const MUTASYONLAR = [
  { ad: 'M1 kapsül dağılıyor (rozet yine alt alta)', dosya: HUD_CSS,
    bul: '.rep {\n  display: flex;\n  flex-direction: row;', koy: '.rep {\n  display: flex;\n  flex-direction: column;',
    kusur: 'üst şerit yine üç y-merkezine yayılır, 69 px kaplar' },
  { ad: 'M2 çubuk madalyona gömülmüyor', dosya: HUD_CSS,
    bul: '  margin-left: -26px;', koy: '  margin-left: 0px;',
    kusur: 'madalyonla çubuk yine iki ayrı kutu — "birleşik" isteği geri alınır' },
  { ad: 'M3 madalyona yıldız geri geliyor', dosya: ICONS,
    bul: '      <circle cx="12" cy="12" r="8.4" fill="var(--madalyon)" stroke={OT} strokeWidth="2.2" />',
    koy: '      <circle cx="12" cy="12" r="8.4" fill="var(--madalyon)" stroke={OT} strokeWidth="2.2" />\n'
       + '      <path d="M12 6.4l1.9 3.9 4.3.6-3.1 3 .7 4.3L12 16.2l-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill={AC} stroke={OT} strokeWidth="1.9" />',
    kusur: 'sayının konturu yıldızı yine yer, "yarım yıldız" geri döner' },
  { ad: 'M4 seviye sayısının konturu 5 px\'e dönüyor', dosya: HUD_CSS,
    bul: '  -webkit-text-stroke: 3px var(--ot);\n}\n/* ÇUBUK KAPSÜLÜN', koy: '  -webkit-text-stroke: 5px var(--ot);\n}\n/* ÇUBUK KAPSÜLÜN',
    kusur: '"4"ün tepesinde miter mızrağı geri gelir (kullanıcının gördüğü çizgi)' },
  { ad: 'M5 ödül satırları yan yana dönüyor', dosya: HUD_CSS,
    bul: '.reward-amount {\n  position: relative;\n  display: flex;\n  flex-direction: column;',
    koy: '.reward-amount {\n  position: relative;\n  display: flex;\n  flex-direction: row;',
    kusur: 'iki ödül yine tek cümle gibi okunur (aradaki açıklık 9,58 px)' },
  { ad: 'M6 bonus satırı yine DELTA yazıyor', dosya: HUD,
    bul: '<span className="odul-eski">{oranYuzde(bonusBefore)}</span>', koy: '<span className="odul-eski">{yuzde(bonus)}</span>',
    kusur: 'ekran yine %0,4 gösterir; toplamın nereye gittiği görünmez' },
  { ad: 'M7 ödül satırına ikon geri geliyor', dosya: HUD,
    bul: '          <span className="odul-etiket">Kalıcı gelir</span>', koy: '          <CoinIcon size={30} /><span className="odul-etiket">Kalıcı gelir</span>',
    kusur: 'kullanıcının "ikon çok karmaşa" dediği kalabalık geri döner' },
  { ad: 'M8 "+" ayıracı koşulsuz çiziliyor', dosya: HUD,
    bul: '            i > 0 ? (', koy: '            true ? (',
    kusur: 'tek ödüllü ekranda (offline) sarkık bir artı belirir' },
  { ad: 'M9 kaydırıcı yine ayıraçtan içeride başlıyor', dosya: INDEX,
    bul: '  margin-left: 0;\n  margin-top: -4px;', koy: '  margin-left: 4px;\n  margin-top: 0;',
    kusur: 'köşe yine açık: yatayda 4,00 px, dikeyde 4,00 px' },
  { ad: 'M10 kaydırıcı KAPALI çerçeveye (A2) dönüyor', dosya: INDEX,
    bul: '  border-bottom: 1.5px solid var(--oyuk);\n  border-left: 1.5px solid var(--oyuk);',
    koy: '  border: 2px solid var(--oyuk);',
    kusur: 'satır karta döner — bir üstteki anahtarın çocuğu olduğu okunmaz' },
  { ad: 'M11 showFps ayarı geri geliyor', dosya: SAVE,
    bul: "  return { sound: true, music: true, notifications: true, soundVolume: 1",
    koy: "  return { sound: true, music: true, notifications: true, showFps: false, soundVolume: 1",
    kusur: 'kaldırılan teşhis alanı kayıt şemasına geri sızar' },
  { ad: 'M12 kese kutusunu kaybediyor', dosya: HUD_CSS,
    bul: '  border: 2.5px solid var(--ot);\n  border-radius: var(--rr);\n  background: var(--oyuk);\n}\n/* İÇ HALKA',
    koy: '}\n/* İÇ HALKA',
    kusur: 'D-106 geri döner: kesenin zemini sahnenin oynamasını bire bir geçirir' },
];

/** `.gitattributes` LF kilidi var ama mutasyon aracı yine de normalize eder (S23 dersi). */
const yedek = new Map();
const ded = (p) => { if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8')); return yedek.get(p); };
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => { for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8'); };

/** R3 bekçisi + kesenin bekçisi (ekran kabuğu §5) birlikte koşar: M12 orada tutuluyor. */
function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/hud-r3.test.ts', 'tests/ekran-kabugu.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('R3 bekçisi — mutasyon doğrulaması\n');
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
