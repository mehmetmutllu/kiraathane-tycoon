/**
 * mutasyon-ios.mjs — iOS izi bekçisinin MUTASYON SINAVI.
 *
 * Platform ayrımına (Play Games yalnız Android · birim platforma ve test kipine göre · iOS'ta UMP → ATT ·
 * RevenueCat anahtarı platforma göre), iOS ses uyandırmasına ve Xcode projesinin kimlik/yerelleştirme
 * satırlarına bilerek kusur sokulur; `tests/ios-platform.test.ts` düşmelidir. Gövde `mutasyon-play-games-f4b.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-ios.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/ios-platform.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  { ad: 'M1 Play Games her cihazda', dosya: 'src/game/platform.ts',
    bul: "magazaPlatformu(p) === 'android';", koy: 'magazaPlatformu(p) !== null;', ne: "iOS'ta Play Games eklentisi cagrilir" },
  { ad: 'M2 tarayicida sahte bulut', dosya: 'src/game/bulut.ts',
    bul: 'ozel ?? (playGamesVar() ? yerliArkaUc() : null)', koy: 'ozel ?? (playGamesVar() ? yerliArkaUc() : sahteArkaUc())', ne: "iOS/tarayicida Ayarlar'da Play Games bolumu" },
  { ad: 'M3 ATT Android-de', dosya: 'src/game/ads.ts',
    bul: "if (platform === 'ios') await dene(", koy: "if (platform === 'android') await dene(", ne: "iOS'ta ATT hic sorulmaz (Apple reddi)" },
  { ad: 'M4 test kipinde gercek birim', dosya: 'src/game/ads.ts',
    bul: '(test ? adsConfig.testBirim : adsConfig.birim)[platform]', koy: 'adsConfig.birim[platform]', ne: 'gelistirmede gercek reklam: hesap askiya alinir' },
  { ad: 'M5 ATT karari verilmisken yeniden sorulur', dosya: 'src/game/ads.ts',
    bul: "if ((await AdMob.trackingAuthorizationStatus()).status === 'notDetermined') await", koy: 'if ((await AdMob.trackingAuthorizationStatus()).status) await', ne: 'her acilista ATT istegi' },
  { ad: 'M6 iOS Android anahtariyla', dosya: 'src/game/iap.ts',
    bul: 'iapConfig.revenueCatAnahtar[platform]', koy: 'iapConfig.revenueCatAnahtar.android', ne: 'iOS satin alma yanlis RevenueCat uygulamasina gider' },
  { ad: 'M7 kesinti sonrasi ses uyanmaz', dosya: 'src/game/audioWeb.ts',
    bul: "if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') void ctx.resume()", koy: "if (ctx && ctx.state === 'suspended') void ctx.resume()", ne: "iOS'ta cagri/arka plan sonrasi ses kalici susar" },
  { ad: 'M8 bulut metni sabit', dosya: 'src/components/ui/HUD.tsx',
    bul: 'const bulutVar = playGamesDurumu().kullanilabilir;', koy: 'const bulutVar = true;', ne: "iOS Ayarlar'inda 'Play Games' yazar" },
  { ad: 'M9 plist test uygulama kimligi', dosya: 'ios/App/App/Info.plist',
    bul: '<string>ca-app-pub-9532352817217002~4395129824</string>', koy: '<string>ca-app-pub-3940256099942544~1458002511</string>', ne: 'yayinda reklam gelirleri hesaba yazilmaz' },
  { ad: 'M10 centik bayragi yok', dosya: 'index.html',
    bul: ', viewport-fit=cover"', koy: '"', ne: "iOS'ta HUD centigin altinda" },
  { ad: 'M11 Turkce yerellestirme projeden dustu', dosya: 'ios/App/App.xcodeproj/project.pbxproj',
    bul: '\t\t\t\ten,\n\t\t\t\ttr,\n', koy: '\t\t\t\ten,\n', ne: 'Turkce cihazda ad ve ATT metni Ingilizce' },
  { ad: 'M12 iOS gercek birimi test birimi', dosya: 'src/config/ads.config.ts',
    bul: "gecisli: 'ca-app-pub-9532352817217002/3082048152'", koy: "gecisli: 'ca-app-pub-3940256099942544/4411468910'", ne: 'yayinda gelir yok' },
  { ad: 'M13 bundle id eski kimlik', dosya: 'ios/App/App.xcodeproj/project.pbxproj',
    bul: 'PRODUCT_BUNDLE_IDENTIFIER = com.mutlubadem.teahouse;', koy: 'PRODUCT_BUNDLE_IDENTIFIER = com.memedobro.teahousetycoon;', ne: 'App Store Connect kaydiyla eslesmez, yukleme reddedilir' },
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
console.log('=== iOS izi bekcisi — mutasyon sinavi ===');
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
