/**
 * olcum-paket-f1.mjs — F1 turu: KABUK ve İMZA ölçümü.
 *
 * SORU: mağazaya gidecek imzalı sürümü üretirken hangi kol ne kadar bayt ve ne kadar risk
 * getiriyor — küçültme (R8) mi, çıktı biçimi (APK ↔ AAB) mi, yoksa ikisi birden mi?
 *
 * NEDEN ARAÇ: F2 turunda `npm run apk` **9 MB fazla** raporladı, çünkü gradle çıktı dosyasının
 * ÜZERİNE yazarken onu kısaltmıyordu (bkz. `tools/apk-temizle.mjs`). O kusur debug APK'da
 * yakalandı; release APK ve AAB için aynı tuzak hâlâ açık. Bu araç her koldan önce çıktı
 * klasörünü SİLER — yani ölçtüğü bayt her zaman o koşunun ürettiği bayttır.
 *
 * KAPSAM DAMGASI: cihaz bağlı değil. Bölümlerin güveni aynı değil, rapor ayırmak zorunda:
 *
 *   §A KİMLİK     — KESİN. Manifest/gradle'dan okunur, derlemeye bile gerek yok.
 *   §B TABAN      — KESİN. Diskteki bayt; debug APK'nın kendi imzası ve içerik dökümü.
 *   §C KOLLAR     — BAYT KESİN, DAVRANIŞ DEĞİL. R8 kolunun boyut kazancı ölçülür; o kolun
 *                   ÇALIŞTIĞI (uygulamanın açıldığı) ölçülmez — bunun için cihaz gerekir.
 *                   Rapor bu ayrımı yazmadan R8 kolu seçilmemeli.
 *   §D NATIVE     — KESİN. APK içindeki `.so` dökümü; Play'in 16 KB sayfa şartının bu projeye
 *                   dokunup dokunmadığı ancak buradan okunur (native yoksa kol boştur).
 *
 * KOL UYGULAMASI: `android/app/build.gradle`in `release { }` bloğu ölçüm SÜRESİNCE değiştirilir
 * ve `finally` içinde dosya BİREBİR geri yazılır (özgün metin bellekte tutulur). Ölçüm kodu
 * kalıcı kod değiştirmez — kalıcı değişiklik karardan sonra, ayrı commit'te yapılır (D-084).
 *
 * Koşu:  node tools/olcum-paket-f1.mjs                 (OLCUM=kisa — yalnız V0 kolu, aracı doğrular)
 *        OLCUM=tam node tools/olcum-paket-f1.mjs       (dört kol; gradle derlemeleri, ~10-20 dk)
 *
 * Çıktı: stdout (ham) — `docs/olcum-paket-f1.txt`e yönlendirilir.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAM = (process.env.OLCUM || 'kisa') === 'tam';
const ANDROID = path.join(KOK, 'android');
const GRADLE_APP = path.join(ANDROID, 'app', 'build.gradle');
const CIKTI = path.join(ANDROID, 'app', 'build', 'outputs');

const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const mb = (b) => `${f2(b / 1024 / 1024)} MB`;
const satirlar = [];
const yaz = (s = '') => { satirlar.push(s); console.log(s); };

/* ────────────────────────────── zip okuyucu ──────────────────────────────
 * APK ve AAB birer zip. İçerik dökümü için DIŞ ARAÇ kullanmıyoruz (`unzip` git-bash'e özel,
 * `jar` JDK'ya bağlı): merkezî dizin elle okunur. Hem SIKIŞTIRILMIŞ hem açık boyut alınır —
 * dosyanın boyutuna katkı yapan SIKIŞTIRILMIŞ olandır, ama "ne kadar veri taşıyoruz"u açık
 * boyut söyler ve ikisinin oranı hangi kolun sıkışmadığını ele verir (ör. .glb, .ogg). */
function zipDokumu(dosya) {
  const b = fs.readFileSync(dosya);
  let eocd = -1;
  for (let i = b.length - 22; i >= 0 && i > b.length - 66_000; i--) {
    if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(`zip sonu bulunamadi: ${dosya}`);
  const adet = b.readUInt16LE(eocd + 10);
  let p = b.readUInt32LE(eocd + 16);
  const girdiler = [];
  for (let i = 0; i < adet; i++) {
    if (b.readUInt32LE(p) !== 0x02014b50) break;
    const sikisik = b.readUInt32LE(p + 20);
    const acik = b.readUInt32LE(p + 24);
    const adUz = b.readUInt16LE(p + 28);
    const ekUz = b.readUInt16LE(p + 30);
    const yorumUz = b.readUInt16LE(p + 32);
    const ad = b.toString('utf8', p + 46, p + 46 + adUz);
    girdiler.push({ ad, sikisik, acik });
    p += 46 + adUz + ekUz + yorumUz;
  }
  return girdiler;
}

/** Girdileri anlamlı kovalara ayırır: dosyanın ağırlığı NEREDEN geliyor. */
function kovala(girdiler) {
  const kova = new Map();
  const ekle = (k, g) => {
    const v = kova.get(k) || { adet: 0, sikisik: 0, acik: 0 };
    v.adet++; v.sikisik += g.sikisik; v.acik += g.acik;
    kova.set(k, v);
  };
  for (const g of girdiler) {
    const a = g.ad;
    if (/\/models\//.test(a)) ekle('assets · modeller (.glb)', g);
    else if (/\/audio\//.test(a)) ekle('assets · ses', g);
    else if (/\.(woff2?|ttf)$/.test(a)) ekle('assets · yazi tipleri', g);
    else if (/^(assets|base\/assets)\//.test(a)) ekle('assets · js + css + digerleri', g);
    else if (a.endsWith('.dex')) ekle('kod (.dex)', g);
    else if (a.startsWith('lib/') || /\/lib\//.test(a)) ekle('native (lib/*.so)', g);
    else if (/res\//.test(a) || /resources\.(arsc|pb)$/.test(a)) ekle('res + resources', g);
    else if (a.startsWith('META-INF/')) ekle('META-INF (imza)', g);
    else ekle('digerleri', g);
  }
  return [...kova.entries()].sort((a, b) => b[1].sikisik - a[1].sikisik);
}

/* ────────────────────────────── kabuk yardımcıları ────────────────────────────── */
function kos(komut, argv, secenek = {}) {
  const t0 = Date.now();
  const r = spawnSync(komut, argv, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...secenek });
  return { kod: r.status, out: (r.stdout || '') + (r.stderr || ''), sn: (Date.now() - t0) / 1000 };
}

/**
 * Gradle'ı `gradlew.bat` ile çağırır — ama `cmd.exe /c` ÜZERİNDEN. Node 18.20+ bir `.bat`
 * dosyasını doğrudan `spawn` etmeyi güvenlik gerekçesiyle reddeder (CVE-2024-27980) ve bunu
 * sessizce yapar: `status` null döner, `stderr` BOŞ kalır. İlk koşuda tam bu oldu ve ölçüm
 * "derleme kırıldı" dedi, oysa derleme hiç başlamamıştı. Yorumdaki asıl ders: çıkış kodu null
 * ise komut ÇALIŞMADI demektir, kırıldı demek değildir — ikisi ayrı rapor edilir.
 */
const gradle = (...hedefler) =>
  kos('cmd.exe', ['/c', path.join(ANDROID, 'gradlew.bat'), ...hedefler, '--console=plain'], { cwd: ANDROID });

/** Çıktı klasörünü siler: bayat dosyanın üzerine yazılan bayt ÖLÇÜLMESİN (F2 dersi). */
function ciktiyiTemizle() { fs.rmSync(CIKTI, { recursive: true, force: true }); }

function ilkDosya(dizin, uzanti) {
  if (!fs.existsSync(dizin)) return null;
  for (const g of fs.readdirSync(dizin, { withFileTypes: true })) {
    const p = path.join(dizin, g.name);
    if (g.isDirectory()) { const alt = ilkDosya(p, uzanti); if (alt) return alt; }
    else if (g.name.endsWith(uzanti)) return p;
  }
  return null;
}

function apksignerYolu() {
  const kok = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'build-tools');
  if (!fs.existsSync(kok)) return null;
  for (const s of fs.readdirSync(kok).sort().reverse()) {
    const p = path.join(kok, s, 'apksigner.bat');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/* ────────────────────────────── kollar ────────────────────────────── */
/**
 * release bloğunun iki hâli. Kol metni build.gradle'a yazılır, ölçüm bitince özgün metin
 * geri konur. `shrinkResources` yalnız `minifyEnabled` ile birlikte anlamlıdır (gradle aksi
 * hâlde derlemeyi reddeder) — bu yüzden ikisi TEK kol, ayrı ayrı ölçülmez.
 */
const RELEASE_VAR = /(\n\s*release\s*\{)([\s\S]*?)(\n\s{8}\})/;
const KOLLAR = [
  { ad: 'V0', baslik: 'release · kucultme KAPALI (bugunku ayar)', minify: false, aab: false },
  { ad: 'V1', baslik: 'release · R8 + kaynak budama ACIK', minify: true, aab: false },
  { ad: 'V2', baslik: 'AAB · kucultme KAPALI', minify: false, aab: true },
  { ad: 'V3', baslik: 'AAB · R8 + kaynak budama ACIK', minify: true, aab: true },
];

function releaseBloguYaz(ozgun, minify) {
  const govde = minify
    ? "\n            minifyEnabled true\n            shrinkResources true\n            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'"
    : "\n            minifyEnabled false\n            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'";
  const yeni = ozgun.replace(RELEASE_VAR, (_, a, __, c) => `${a}${govde}${c}`);
  if (yeni === ozgun && minify) throw new Error('release blogu bulunamadi — kol uygulanamadi');
  fs.writeFileSync(GRADLE_APP, yeni);
}

/**
 * R8 kolunun RİSK kanıtı. Boyut kazancını ölçmek kolay; asıl soru "silinen 1,92 MB kodun içinde
 * uygulamanın açılması için gereken bir şey var mıydı" ve buna cihazsız cevap verilemez.
 * Verilebilecek en yakın cevap AGP'nin kendi bıraktığı üç dosyadır:
 *
 *   configuration.txt — R8'in GERÇEKTEN uyguladığı kuralların tamamı (kütüphanelerin kendi
 *                       consumer kuralları dahil). Capacitor'ın kuralları burada YOKSA, o AAR
 *                       korumasız derlenmiş demektir ve kol tek başına tehlikelidir.
 *   seeds.txt         — kuralların tuttuğu kökler. Giriş noktası (MainActivity) burada olmalı.
 *   usage.txt         — silinenler. `com.getcapacitor` altından TAMAMEN silinen sınıf sayısı
 *                       sıfır olmak zorunda değil (kullanılmayan eklenti sınıfları normaldir),
 *                       ama Bridge çekirdeği silinmişse kol ölüdür.
 *
 * Bu bölüm kolu GÜVENLİ ilan etmez — riski SAYIYA çevirir. Kararı cihaz koşusu kapatır.
 */
function r8Kaniti() {
  const d = path.join(CIKTI, 'mapping', 'release');
  const oku = (ad) => (fs.existsSync(path.join(d, ad)) ? fs.readFileSync(path.join(d, ad), 'utf8') : '');
  const konf = oku('configuration.txt');
  const seeds = oku('seeds.txt');
  const usage = oku('usage.txt');
  const mapping = oku('mapping.txt');
  if (!konf) return null;
  /*
   * usage.txt'in İKİ AYRI satır dilbilgisi var ve ilk okuyuşta karıştırıldı — araç "Bridge
   * çekirdeği silindi" dedi, oysa Bridge duruyordu:
   *   `com.getcapacitor.Bridge:`  → İKİ NOKTA VAR: sınıf DURUYOR, altındaki girintili satırlar
   *                                 ondan atılan ÜYELER.
   *   `com.getcapacitor.AppUUID`  → iki nokta YOK: sınıfın TAMAMI atıldı.
   * Yani iki noktayı yok sayan bir sayaç, budanmış her sınıfı "silinmiş" sanar.
   */
  // `.trimEnd()` ŞART: usage.txt CRLF ile yazılıyor, satır sonundaki `\r` yüzünden iki noktayı
  // arayan sınama hiç tutmuyordu ve BUDANAN sayısı sahte olarak 0 çıkıyordu.
  const satir = usage.split('\n').map((s) => s.trimEnd()).filter((s) => s.startsWith('com.getcapacitor'));
  const tamSilinen = satir.filter((s) => !s.endsWith(':'));
  const budanan = satir.filter((s) => s.endsWith(':'));
  /*
   * "Hayatta kaldı mı" sorusu seeds.txt'ten OKUNMAZ: seeds yalnız bir KURALIN doğrudan tuttuğu
   * kökleri listeler. BridgeActivity hiçbir kuralın kökü değil — MainActivity üzerinden
   * ERİŞİLEBİLİR olduğu için duruyor. Doğru kaynak mapping.txt: R8'in çıktıya yazdığı
   * sınıfların tamamı orada.
   */
  const ciktida = (ad) => new RegExp(`^${ad.replace(/\./g, '\\.')} ->`, 'm').test(mapping);
  return {
    kuralAdet: (konf.match(/^-keep/gm) || []).length,
    capacitorKurali: /-keep public class \* extends com\.getcapacitor\.Plugin/.test(konf),
    jsArayuzKurali: /@android\.webkit\.JavascriptInterface|JavascriptInterface <methods>/.test(konf),
    webViewKurali: /com\.getcapacitor\.CapacitorWebView/.test(konf),
    girisNoktasiTutuldu: seeds.includes('com.kosekiraathanesi.game.MainActivity'),
    girisNoktasiCiktida: ciktida('com.kosekiraathanesi.game.MainActivity'),
    bridgeCiktida: ciktida('com.getcapacitor.Bridge'),
    bridgeActivityCiktida: ciktida('com.getcapacitor.BridgeActivity'),
    webViewSunucusuCiktida: ciktida('com.getcapacitor.WebViewLocalServer'),
    capacitorTamSilinen: tamSilinen.length,
    capacitorBudanan: budanan.length,
    /*
     * `$` ile biten ad İÇ SINIFtır ve ayrı bir sınıftır: `Bridge$Builder` atılmışken `Bridge`
     * duruyor olabilir — nitekim öyle. Kalıbın sonuna `$` (dize sonu) konmazsa `\b`, `Bridge`in
     * ardındaki `$` karakterinde sınır bulup iç sınıfı çekirdek sanıyor ve kolu HAKSIZ yere
     * "ölü" ilan ediyor. İlk koşuda tam bu oldu.
     */
    cekirdekSilindi: tamSilinen.some((s) => /^com\.getcapacitor\.(Bridge|BridgeActivity|WebViewLocalServer|CapConfig)$/.test(s)),
    tamSilinenAdlar: tamSilinen,
  };
}

let r8Kanit = null;

async function main() {
  const t0 = Date.now();
  yaz('# F1 — KABUK VE IMZA OLCUMU');
  yaz(`# kip: ${TAM ? 'TAM (dort kol)' : 'KISA (yalniz V0)'} · ${new Date().toISOString()}`);
  yaz(`# node ${process.version} · ${process.platform}`);
  yaz();

  /* §A KİMLİK */
  yaz('## §A KIMLIK (derleme gerekmez)');
  const capCfg = fs.readFileSync(path.join(KOK, 'capacitor.config.ts'), 'utf8');
  const appGradle = fs.readFileSync(GRADLE_APP, 'utf8');
  const manifest = fs.readFileSync(path.join(ANDROID, 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  const degiskenler = fs.readFileSync(path.join(ANDROID, 'variables.gradle'), 'utf8');
  const pkgJson = JSON.parse(fs.readFileSync(path.join(KOK, 'package.json'), 'utf8'));
  const al = (metin, kalip) => (metin.match(kalip) || [, '(yok)'])[1];
  yaz(`appId (capacitor)      : ${al(capCfg, /appId:\s*'([^']+)'/)}`);
  yaz(`appName (capacitor)    : ${al(capCfg, /appName:\s*'([^']+)'/)}`);
  yaz(`applicationId (gradle) : ${al(appGradle, /applicationId\s+"([^"]+)"/)}`);
  yaz(`namespace (gradle)     : ${al(appGradle, /namespace\s*=\s*"([^"]+)"/)}`);
  yaz(`versionCode            : ${al(appGradle, /versionCode\s+(\d+)/)}`);
  yaz(`versionName            : ${al(appGradle, /versionName\s+"([^"]+)"/)}`);
  yaz(`package.json version   : ${pkgJson.version}   <- SURUM IKI YERDE, TURETILMIYOR`);
  yaz(`minSdk / target / comp : ${al(degiskenler, /minSdkVersion\s*=\s*(\d+)/)} / ${al(degiskenler, /targetSdkVersion\s*=\s*(\d+)/)} / ${al(degiskenler, /compileSdkVersion\s*=\s*(\d+)/)}`);
  const izinler = [...manifest.matchAll(/uses-permission android:name="([^"]+)"/g)].map((m) => m[1]);
  yaz(`izinler                : ${izinler.length ? izinler.join(', ') : '(yok)'}`);
  yaz(`screenOrientation      : ${/screenOrientation/.test(manifest) ? al(manifest, /screenOrientation="([^"]+)"/) : '(YOK — cihaz serbest dondurur)'}`);
  yaz(`allowBackup            : ${al(manifest, /allowBackup="([^"]+)"/)}`);
  yaz(`signingConfig (gradle) : ${/signingConfig/.test(appGradle) ? 'VAR' : 'YOK — release imzasiz cikiyor'}`);
  yaz(`keystore dosyasi       : ${fs.existsSync(path.join(ANDROID, 'keystore.properties')) ? 'android/keystore.properties VAR' : 'YOK'}`);
  yaz();

  /* §B TABAN — debug APK */
  yaz('## §B TABAN (debug APK — temiz uretim)');
  ciktiyiTemizle();
  const dbg = gradle('assembleDebug');
  yaz(`assembleDebug          : kod ${dbg.kod} · ${f1(dbg.sn)} sn`);
  if (dbg.kod !== 0) {
    yaz(dbg.out.trim() ? dbg.out.split('\n').slice(-25).join('\n') : '(cikti BOS — komut hic calismadi)');
    throw new Error(dbg.kod === null ? 'gradle komutu CALISMADI (kod null)' : 'debug derlemesi kirildi');
  }
  const dbgApk = ilkDosya(path.join(CIKTI, 'apk'), '.apk');
  const dbgBoyut = fs.statSync(dbgApk).size;
  yaz(`debug APK              : ${mb(dbgBoyut)} (${dbgBoyut} bayt) · ${path.relative(KOK, dbgApk)}`);
  const dbgGirdi = zipDokumu(dbgApk);
  yaz(`girdi sayisi           : ${dbgGirdi.length}`);
  yaz('');
  yaz('| kova | adet | sikisik | acik | APK payi |');
  yaz('|---|---:|---:|---:|---:|');
  for (const [k, v] of kovala(dbgGirdi)) {
    yaz(`| ${k} | ${v.adet} | ${mb(v.sikisik)} | ${mb(v.acik)} | %${f1((v.sikisik / dbgBoyut) * 100)} |`);
  }
  yaz('');
  const signer = apksignerYolu();
  yaz(`apksigner              : ${signer ? signer : '(BULUNAMADI)'}`);
  if (signer) {
    // `.bat` — gradle ile aynı sebeple `cmd.exe /c` üzerinden (bkz. `gradle` yardımcısı).
    const v = kos('cmd.exe', ['/c', signer, 'verify', '--print-certs', dbgApk]);
    yaz(`imza dogrulama (debug) : kod ${v.kod}`);
    for (const s of v.out.split('\n').filter((s) => /certificate DN|SHA-256 digest|does not verify|Scheme v\d/.test(s)).slice(0, 8)) {
      yaz(`  ${s.trim()}`);
    }
  }
  yaz();

  /* §C KOLLAR */
  yaz('## §C KOLLAR (release cikti — BAYT kesin, DAVRANIS olculmedi)');
  yaz('# SURELER KARSILASTIRILAMAZ: gradle onbellegi kollar arasinda isiniyor, ilk kol soguk');
  yaz('# derleniyor. Karsilastirilabilir olan BOYUT sutunudur.');
  const secilen = TAM ? KOLLAR : KOLLAR.slice(0, 1);
  const ozgunGradle = fs.readFileSync(GRADLE_APP, 'utf8');
  const sonuc = [];
  try {
    for (const kol of secilen) {
      releaseBloguYaz(ozgunGradle, kol.minify);
      ciktiyiTemizle();
      const hedef = kol.aab ? 'bundleRelease' : 'assembleRelease';
      const r = gradle(hedef);
      if (r.kod !== 0) {
        yaz(`${kol.ad} ${kol.baslik}: KIRILDI (kod ${r.kod}, ${f1(r.sn)} sn)`);
        yaz(r.out.split('\n').filter((s) => /error|Error|FAILURE|What went wrong|^\s{2}>/.test(s)).slice(0, 12).map((s) => `    ${s.trim()}`).join('\n'));
        sonuc.push({ ...kol, kirik: true, sn: r.sn });
        continue;
      }
      const dosya = ilkDosya(path.join(CIKTI, kol.aab ? 'bundle' : 'apk'), kol.aab ? '.aab' : '.apk');
      const boyut = fs.statSync(dosya).size;
      const girdi = zipDokumu(dosya);
      const so = girdi.filter((g) => g.ad.endsWith('.so'));
      const dex = girdi.filter((g) => g.ad.endsWith('.dex')).reduce((t, g) => t + g.sikisik, 0);
      const res = girdi.filter((g) => /res\//.test(g.ad) || /resources\.(arsc|pb)$/.test(g.ad)).reduce((t, g) => t + g.sikisik, 0);
      sonuc.push({ ...kol, kirik: false, sn: r.sn, boyut, girdi: girdi.length, so: so.length, dex, res, dosya });
      if (kol.minify && !kol.aab) r8Kanit = r8Kaniti();
      yaz(`${kol.ad} ${kol.baslik}`);
      yaz(`   cikti  : ${path.relative(KOK, dosya)}`);
      yaz(`   boyut  : ${mb(boyut)} (${boyut} bayt) · ${girdi.length} girdi · ${f1(r.sn)} sn`);
      yaz(`   kod    : ${mb(dex)} dex · res+resources ${mb(res)} · native .so ${so.length}`);
      yaz(`   imzali : ${girdi.some((g) => /^META-INF\/.*\.(RSA|DSA|EC)$/.test(g.ad)) ? 'EVET' : 'HAYIR (imzasiz)'}`);
    }
  } finally {
    fs.writeFileSync(GRADLE_APP, ozgunGradle);
    yaz('');
    yaz(`(build.gradle ozgun haline geri yazildi: ${fs.readFileSync(GRADLE_APP, 'utf8') === ozgunGradle ? 'DOGRULANDI' : 'KIRIK'})`);
  }
  yaz();

  /* §C özeti — karşılaştırma tablosu */
  const v0 = sonuc.find((s) => s.ad === 'V0' && !s.kirik);
  yaz('| kol | cikti | boyut | V0 farki | dex | sure |');
  yaz('|---|---|---:|---:|---:|---:|');
  yaz(`| TABAN | debug APK | ${mb(dbgBoyut)} | — | — | ${f1(dbg.sn)} sn |`);
  for (const s of sonuc) {
    if (s.kirik) { yaz(`| ${s.ad} | ${s.aab ? 'AAB' : 'APK'} | KIRILDI | — | — | ${f1(s.sn)} sn |`); continue; }
    const fark = v0 ? `${s.boyut > v0.boyut ? '+' : ''}${f1(((s.boyut - v0.boyut) / v0.boyut) * 100)}%` : '—';
    yaz(`| ${s.ad} | ${s.aab ? 'AAB' : 'APK'} | ${mb(s.boyut)} | ${fark} | ${mb(s.dex)} | ${f1(s.sn)} sn |`);
  }
  yaz();

  /* §E R8 RİSK KANITI */
  yaz('## §E R8 KOLUNUN RISK KANITI (V1 kolundan)');
  if (!r8Kanit) {
    yaz('(V1 kolu kosulmadi — kisa kipte bu bolum bostur)');
  } else {
    const k = r8Kanit;
    yaz(`R8 uygulanan -keep kurali    : ${k.kuralAdet}`);
    yaz(`Capacitor eklenti kurali     : ${k.capacitorKurali ? 'VAR' : 'YOK  <-- kol tehlikeli'}`);
    yaz(`CapacitorWebView kurali      : ${k.webViewKurali ? 'VAR' : 'YOK  <-- kol tehlikeli'}`);
    yaz(`@JavascriptInterface kurali  : ${k.jsArayuzKurali ? 'VAR' : 'YOK  <-- kopru cagrilari kirilir'}`);
    yaz(`MainActivity kural kokunde   : ${k.girisNoktasiTutuldu ? 'EVET' : 'HAYIR'}`);
    yaz(`MainActivity ciktida         : ${k.girisNoktasiCiktida ? 'EVET' : 'HAYIR <-- uygulama acilmaz'}`);
    yaz(`Bridge ciktida               : ${k.bridgeCiktida ? 'EVET' : 'HAYIR <-- kol OLU'}`);
    yaz(`BridgeActivity ciktida       : ${k.bridgeActivityCiktida ? 'EVET' : 'HAYIR <-- kol OLU'}`);
    yaz(`WebViewLocalServer ciktida   : ${k.webViewSunucusuCiktida ? 'EVET' : 'HAYIR <-- web varliklar sunulmaz'}`);
    yaz(`com.getcapacitor TAMAMEN silinen sinif: ${k.capacitorTamSilinen}`);
    yaz(`com.getcapacitor BUDANAN (duruyor, uyesi atildi): ${k.capacitorBudanan}`);
    yaz(`cekirdek sinif silindi mi    : ${k.cekirdekSilindi ? 'EVET <-- kol OLU' : 'HAYIR'}`);
    yaz('tamamen silinenler (denetlenebilsin diye tam liste):');
    for (const s of k.tamSilinenAdlar) yaz(`  ${s}`);
    yaz(`kurulu Capacitor eklentisi   : ${JSON.parse(fs.readFileSync(path.join(ANDROID, 'app', 'src', 'main', 'assets', 'capacitor.plugins.json'), 'utf8')).length} (yansima yuzeyi bu kadar)`);
  }
  yaz();

  /* §D NATIVE / 16 KB sayfa */
  yaz('## §D NATIVE KUTUPHANE (Play 16 KB sayfa sarti)');
  const soHepsi = dbgGirdi.filter((g) => g.ad.endsWith('.so'));
  if (soHepsi.length === 0) {
    yaz('APK icinde .so YOK → 16 KB sayfa sarti bu projeye DOKUNMUYOR (kol bos).');
  } else {
    yaz(`${soHepsi.length} native kutuphane var — her biri 16 KB hizali derlenmis olmali:`);
    for (const g of soHepsi.slice(0, 20)) yaz(`  ${g.ad} · ${mb(g.sikisik)}`);
  }
  yaz();
  yaz(`# toplam sure: ${f1((Date.now() - t0) / 1000)} sn`);
}

main().catch((e) => { console.error('OLCUM KIRILDI:', e.message); process.exit(1); });
