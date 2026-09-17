/**
 * mutasyon-paket-f1.mjs — F1a BEKÇİSİNİ MUTASYONLA DOĞRULAR (D-130).
 *
 * NEDEN: yeşil yanan bir test hiçbir şey kanıtlamaz; kanıtı KIRMIZI yanması verir (D-084'ün
 * kesilmez maddesi). Bu turda korunan şeylerin hepsi **oyunda görünmeyen** yerlerde: gradle
 * dosyası, manifest, `.gitignore`. Böyle bir kusur ekranda hiç belirmez — ilk kez mağazaya
 * yükleme günü görülür. Dolayısıyla bekçinin gerçekten tuttuğunu görmek, burada başka
 * turlardan daha önemli.
 *
 * Dört cinsten kusur var ve her biri ayrı mutasyon kümesi ister:
 *   ① KİMLİK — bir yerde değişip başka bir yerde kalan paket adı. En sinsi hâli "yarım
 *     yeniden adlandırma": gradle değişir, `strings.xml` kalır; derleme çalışır, kimlik ikiye
 *     ayrılır. Play'de kalıcı olan şey budur, yanlış olursa geri alınamaz.
 *   ② SÜRÜM — elle yazılmış bir `versionName`, türetmenin yanında sessizce durup onu ezer.
 *     F1a'nın kapattığı "iki kaynak" kusurunun tam olarak geri gelme biçimi.
 *   ③ İMZA — parolanın gradle'a gömülmesi ya da `.gitignore` satırının düşmesi. İkisi de
 *     anahtarı depoya sokar; anahtar herkese açılırsa uygulama başkası tarafından imzalanabilir.
 *   ④ KÜÇÜLTME — `minifyEnabled` kapanırsa ölçülen 1,99 MB sessizce geri gelir.
 *
 * Kullanım: node tools/mutasyon-paket-f1.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (p) => path.join(KOK, p);

const GRADLE = 'android/app/build.gradle';
const CAP = 'capacitor.config.ts';
const STRINGS = 'android/app/src/main/res/values/strings.xml';
const STRINGS_TR = 'android/app/src/main/res/values-tr/strings.xml';
const MANIFEST = 'android/app/src/main/AndroidManifest.xml';
const GITIGNORE = '.gitignore';
const PKG = 'package.json';

const MUTASYONLAR = [
  // --- ① KİMLİK: tek ve aynı olmalı ----------------------------------------------------------
  {
    ad: 'M1 gradle kimligi degisti, strings.xml eskisinde kaldi (YARIM yeniden adlandirma)',
    dosya: GRADLE,
    bul: 'applicationId "com.memedobro.teahousetycoon"',
    koy: 'applicationId "com.memedobro.teahousetycoon2"',
    kusur: 'derleme calisir ama uygulamanin Play-de KALICI olan kimligi digerlerinden ayrilir',
  },
  {
    ad: 'M2 namespace applicationId-den ayrildi',
    dosya: GRADLE,
    bul: 'namespace = "com.memedobro.teahousetycoon"',
    koy: 'namespace = "com.kosekiraathanesi.game"',
    kusur: 'R sinifi ve BuildConfig baska pakete yazilir; kimlik iki parcaya boluner',
  },
  {
    ad: 'M3 capacitor appId eski kimlige dondu',
    dosya: CAP,
    bul: "appId: 'com.memedobro.teahousetycoon'",
    koy: "appId: 'com.kosekiraathanesi.game'",
    kusur: 'web katmani baska kimlik sanir; derin baglanti ve dosya saglayici yolu kirilir',
  },
  {
    ad: 'M4 strings.xml custom_url_scheme guncellenmedi',
    dosya: STRINGS,
    bul: '<string name="custom_url_scheme">com.memedobro.teahousetycoon</string>',
    koy: '<string name="custom_url_scheme">com.kosekiraathanesi.game</string>',
    kusur: 'uygulamaya donus semasi baska kimlige bakar — yalniz derin baglantida gorunur',
  },

  // --- ② SÜRÜM: tek kaynaktan türer ----------------------------------------------------------
  {
    ad: 'M5 versionName elle yazildi (turetme ezildi)',
    dosya: GRADLE,
    bul: 'versionName paket.version',
    koy: 'versionName "1.0"',
    kusur: 'F1a-nin kapattigi IKI KAYNAK kusuru geri gelir; package.json artik hicbir sey soylemez',
  },
  {
    ad: 'M6 versionCode sabitlendi',
    dosya: GRADLE,
    bul: 'versionCode surumKodu',
    koy: 'versionCode 1',
    kusur: 'surum yukseltilse bile Play ayni kodu gorur ve guncellemeyi reddeder',
  },
  {
    ad: 'M7 package.json surumu semver olmaktan cikti',
    dosya: PKG,
    bul: '"version": "0.9.0"',
    koy: '"version": "0.9"',
    kusur: 'gradle-in okudugu kaynak bozulur; derleme kirilir ama bunu ancak APK uretirken gorurduk',
  },
  {
    ad: 'M8 surum kodu formulu basamak tasimasina acik (minor carpani 10)',
    dosya: GRADLE,
    bul: 'surum.group(1).toInteger() * 10000 + surum.group(2).toInteger() * 100 + surum.group(3).toInteger()',
    koy: 'surum.group(1).toInteger() * 100 + surum.group(2).toInteger() * 10 + surum.group(3).toInteger()',
    kusur: '0.9.0 ile 0.8.10 ayni kodu uretir — surum artar, Play guncellemeyi reddeder',
  },

  // --- ③ İMZA: anahtar da parola da depoda değil ---------------------------------------------
  {
    ad: 'M9 parola gradle-a gomuldu',
    dosya: GRADLE,
    bul: "storePassword imza['storePassword']",
    koy: 'storePassword "ParolaBurada123"',
    kusur: 'parola depoya girer — uygulamayi herkes imzalayabilir hale gelir',
  },
  {
    ad: 'M10 .gitignore-dan keystore.properties satiri dustu',
    dosya: GITIGNORE,
    bul: 'android/keystore.properties',
    koy: '# android/keystore.properties',
    kusur: 'parola dosyasi ilk `git add -A` ile sessizce commit edilir',
  },
  {
    ad: 'M11 .gitignore-dan .jks satiri dustu',
    dosya: GITIGNORE,
    bul: 'android/*.jks',
    koy: '# android/*.jks',
    kusur: 'imza anahtarinin kendisi depoya girer; depo paylasilirsa anahtar da paylasilir',
  },
  {
    ad: 'M12 anahtar yoksa derleme kiriliyor (kosullu imza kaldirildi)',
    dosya: GRADLE,
    bul: 'def imzaDosyasi = rootProject.file(\'keystore.properties\')',
    koy: 'def imzaDosyasi = rootProject.file(\'keystore.properties\')\nif (!imzaDosyasi.exists()) { throw new GradleException("keystore.properties yok") }',
    kusur: 'anahtari olmayan ikinci makine (ya da CI) projeyi hic derleyemez — "anahtar yok" ile "derleme bozuk" karisir',
  },

  // --- ④ KÜÇÜLTME: ölçülen 1,99 MB geri gelmesin ---------------------------------------------
  {
    ad: 'M13 minifyEnabled kapandi',
    dosya: GRADLE,
    bul: '            minifyEnabled true\n            shrinkResources true',
    koy: '            minifyEnabled false',
    kusur: 'olculen 1,99 MB sessizce geri gelir; APK 8,58 -> 10,58 MB',
  },
  {
    ad: 'M14 shrinkResources kapandi (minify acik kaldi)',
    dosya: GRADLE,
    bul: '            shrinkResources true\n',
    koy: '',
    kusur: 'kolun kucuk yarisi (0,08 MB) sessizce duser — tek basina fark etmez, birikir',
  },

  // --- ⑤ DİL VE KABUK: adın dile göre seçilmesi, izin yüzeyi ---------------------------------
  {
    ad: 'M15 Turkce ad dosyasina kimlik alani sizdi',
    dosya: STRINGS_TR,
    bul: '    <string name="title_activity_main">Köşe Kıraathanesi</string>',
    koy: '    <string name="title_activity_main">Köşe Kıraathanesi</string>\n    <string name="package_name">com.kosekiraathanesi.game</string>',
    kusur: 'Turkce cihazda BASKA bir kimlik okunur — sessiz ve yalniz o dilde gorunur',
  },
  {
    ad: 'M16 varsayilan ad Turkcelesti (values-tr anlamsizlasti)',
    dosya: STRINGS,
    bul: '<string name="app_name">Tea House Tycoon</string>',
    koy: '<string name="app_name">Köşe Kıraathanesi</string>',
    kusur: 'her dilde Turkce ad gorunur; iki dilli baslik karari kagit uzerinde kalir',
  },
  {
    ad: 'M17 sessizce yeni izin eklendi',
    dosya: MANIFEST,
    bul: '    <uses-permission android:name="android.permission.INTERNET" />',
    koy: '    <uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    kusur: 'izin yuzeyi buyur; cocuk-guvenli vaat ve magaza incelemesi dogrudan etkilenir',
  },
  {
    ad: 'M18 allowBackup kapandi',
    dosya: MANIFEST,
    bul: 'android:allowBackup="true"',
    koy: 'android:allowBackup="false"',
    kusur: 'oyuncu telefon degistirince ilerlemesini kaybeder — sessiz ve geri alinamaz',
  },
];

const yedek = new Map();
const ded = (p) => {
  if (!yedek.has(p)) yedek.set(p, readFileSync(y(p), 'utf8'));
  return yedek.get(p);
};
const lf = (t) => t.split('\r\n').join('\n');
const geri = () => {
  for (const [p, icerik] of yedek) writeFileSync(y(p), icerik, 'utf8');
};

function testKirmiziMi() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/paket-f1.test.ts'], {
      cwd: KOK,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
    return false; // yeşil kaldı → mutasyon KAÇTI
  } catch {
    return true; // kırmızı yandı → bekçi tuttu
  }
}

console.log('MUTASYON — F1a PAKET BEKÇİSİ (tests/paket-f1.test.ts)');
console.log(`${MUTASYONLAR.length} mutasyon · her biri kusuru kaynağa geri koyar\n`);

let kacan = 0;
let uygulanamayan = 0;
for (const m of MUTASYONLAR) {
  const asil = ded(m.dosya);
  const metin = lf(asil);
  if (!metin.includes(m.bul)) {
    console.log(`?? ${m.ad}\n   DESEN BULUNAMADI (${m.dosya}) — mutasyon uygulanmadı`);
    uygulanamayan++;
    continue;
  }
  writeFileSync(y(m.dosya), metin.replace(m.bul, m.koy), 'utf8');
  const tuttu = testKirmiziMi();
  geri();
  console.log(`${tuttu ? '✓' : '✗ KAÇTI'}  ${m.ad}`);
  console.log(`   kusur: ${m.kusur}`);
  if (!tuttu) kacan++;
}

geri();
console.log('');
if (uygulanamayan) console.log(`?? ${uygulanamayan} mutasyon uygulanamadı — desenler kaynakla uyuşmuyor.`);
if (kacan) {
  console.log(`✗ ${kacan} MUTASYON KAÇTI — bekçi bu kusurları tutmuyor, delik kapatılmalı.`);
  process.exit(1);
}
console.log(`✓ ${MUTASYONLAR.length} mutasyonun hepsi yakalandı — bekçi tutuyor.`);
