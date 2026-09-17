/**
 * olcum-reklam-f3.mjs — F3 TUR 1: REKLAM ALTYAPISI (eklenti · R8 · doğal ara · bağlama noktası).
 *
 * NEDEN VAR. F3 iki soruyla açılıyor ve ikisinin de cevabı bugün YOK:
 *
 *   ① HANGİ EKLENTİ. `docs/monetization.md` §4 şöyle yazıyor: *"Capacitor AdMob eklentisi
 *      (güncel/bakımlı olan doğrulanacak — örn. @capgo/capacitor-admob)"*. Yani bir ad geçiyor
 *      ama seçim YAPILMAMIŞ, üstelik doğrulama açıkça ertelenmiş. Bu tam olarak varyant
 *      kapısının yasakladığı şeydir: bir kol koda yazılıp öbürü sonradan ölçülemez. Üç aday da
 *      burada, aynı ölçütlerle, ÖNCE tartılıyor.
 *
 *   ② R8 HÂLÂ GÜVENLİ Mİ. D-130 küçültmeyi (`minifyEnabled` + `shrinkResources`) açtı ve
 *      gerekçesini `android/app/build.gradle`a yazdı: *"kurulu eklenti sayısı 0 olduğu için
 *      yansıma yüzeyi en dar hâlinde. F3 (AdMob) ve F4 (IAP) eklenti getirdiğinde bu gerekçe
 *      geçersizleşir ve kol YENİDEN ölçülmelidir."* Eklenti bu turda geliyor → gerekçe bu turda
 *      düşüyor. Kendi yazdığı koşulu tetikleyen bir karar, o koşulu çalıştırmadan kapatılamaz.
 *
 * DÖRT BÖLÜM
 *   §A EKLENTİ      — 3 aday × 12 ölçüt. Ağdan (npm registry) + paketin KENDİ içinden
 *                     (android/build.gradle, manifest, dist/*.d.ts). İkinci el bilgi yok:
 *                     "şu SDK'yı kullanıyor" iddiası paketin gradle satırından okunuyor.
 *   §B R8           — finalist eklenti × {R8 açık, R8 kapalı}. Gerçek `assembleRelease` +
 *                     `bundleRelease`; APK/AAB baytı ve `.dex` baytı ölçülür. TABAN = eklentisiz.
 *   §C DOĞAL ARA    — D-066 *"yalnız doğal aralarda"* diyor; o aralar bugüne dek SAYILMADI.
 *                     Kuralın uygulanabilmesi için önce kaç tane olduğu bilinmeli.
 *   §D BAĞLAMA      — bugün pasif duran reklam düğmeleri (D-039 kalıbı: yeri belli, işlevi yok).
 *
 * ÖLÇMEDİĞİ ŞEY — DÜRÜSTÇE. Bu araç **reklamın gösterildiğini görmez.** Gerçek dolgu (fill),
 * gerçek gecikme, gerçek rıza formu ve `tagForChildDirectedTreatment`ın ağa ne yansıttığı
 * yalnız CİHAZDA ölçülür. Burada ölçülen şey: hangi eklentinin o bayrağı SUNDUĞU, paketin
 * derlendiği, ve küçültmenin derlemeyi bozmadığı. "Derlendi" ile "çalışıyor" ayrı şeylerdir —
 * F2'nin dpr kolu ve F1a'nın R8 kolu gibi bu da **cihaz turuna** bir kalem bırakır.
 *
 * Koşu:
 *   node tools/olcum-reklam-f3.mjs --bolum=A          # ağ ister (npm registry + npm pack)
 *   node tools/olcum-reklam-f3.mjs --bolum=C          # statik, saniyeler
 *   node tools/olcum-reklam-f3.mjs --bolum=D          # statik, saniyeler
 *   node tools/olcum-reklam-f3.mjs --bolum=B --kol=taban|com-r8|com-acik|capgo-r8|capgo-acik
 *        (her kol ~3-6 dk: npm i + vite build + cap sync + gradle assemble/bundleRelease)
 * Çıktı: stdout tablo → docs/olcum-reklam-f3.txt · §B kolları docs/olcum-reklam-f3-b.json'a birikir
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEC = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const BOLUM = (SEC.get('bolum') ?? 'ACD').toUpperCase();
const B_KAYIT = path.join(KOK, 'docs', 'olcum-reklam-f3-b.json');

const yaz = (s = '') => process.stdout.write(s + '\n');
const mb = (b) => (b / 1024 / 1024).toFixed(2).replace('.', ',');
const kb = (b) => (b / 1024).toFixed(1).replace('.', ',');

/* ═══════════════════════ §A — EKLENTİ ADAYLARI ═══════════════════════ */

const ADAYLAR = [
  { kod: 'A1', ad: '@capacitor-community/admob' },
  { kod: 'A2', ad: '@capgo/capacitor-admob' },
  { kod: 'A3', ad: '@admob-plus/capacitor' },
];

function npmView(paket, alan) {
  try {
    return execFileSync('npm', ['view', paket, alan, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: true,
    }).trim();
  } catch {
    return '';
  }
}

/** Paketi geçici bir yere açıp İÇİNDEN okur. Registry alanları pazarlama, gradle satırı gerçek. */
function paketiAc(paket, hedef) {
  fs.mkdirSync(hedef, { recursive: true });
  execSync(`npm pack ${paket} --silent --pack-destination "${hedef}"`, {
    cwd: hedef,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const tgz = fs.readdirSync(hedef).find((f) => f.endsWith('.tgz'));
  if (!tgz) return null;
  execSync(`tar -xzf "${tgz}"`, { cwd: hedef, stdio: 'ignore' });
  return { kok: path.join(hedef, 'package'), tgz: path.join(hedef, tgz) };
}

function oku(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function dosyalar(kok) {
  const cikti = [];
  const gez = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const tam = path.join(d, e.name);
      if (e.isDirectory()) gez(tam);
      else cikti.push(path.relative(kok, tam).replace(/\\/g, '/'));
    }
  };
  gez(kok);
  return cikti;
}

function bolumA() {
  yaz('═══ §A — EKLENTİ ADAYLARI ═══');
  yaz('Her satır paketin KENDİ içinden okundu (registry + tarball), ikinci el kaynak yok.');
  yaz('');
  const gecici = path.join(KOK, 'node_modules', '.cache', 'f3-eklenti');
  fs.rmSync(gecici, { recursive: true, force: true });

  const satirlar = [];
  for (const aday of ADAYLAR) {
    const surum = (npmView(aday.ad, 'version') || '""').replace(/"/g, '');
    const s = { ...aday, surum };
    if (!surum) {
      s.durum = 'REGISTRY\'DE YOK';
      satirlar.push(s);
      continue;
    }
    const zaman = npmView(aday.ad, 'time');
    try {
      const t = JSON.parse(zaman || '{}');
      const surumler = Object.entries(t).filter(([k]) => !['created', 'modified'].includes(k));
      s.surumSayisi = surumler.length;
      s.sonYayin = (t[surum] ?? t.modified ?? '').slice(0, 10);
      // KARARLI sürüm = beta/alpha/rc etiketi taşımayan. "Aktif" görünen bir paket yalnız
      // beta basıyorsa bu bakım değil, henüz oturmamışlık demektir.
      const kararli = surumler.filter(([k]) => /^\d+\.\d+\.\d+$/.test(k));
      s.sonKararli = kararli.length ? kararli[kararli.length - 1] : ['—', ''];
    } catch {
      s.surumSayisi = 0;
    }
    s.lisans = (npmView(aday.ad, 'license') || '""').replace(/"/g, '');
    const peer = npmView(aday.ad, 'peerDependencies');
    const dep = npmView(aday.ad, 'dependencies');
    s.capacitor = (peer + dep).match(/"@capacitor\/core":\s*"([^"]+)"/)?.[1] ?? '—';

    const cikan = paketiAc(`${aday.ad}@${surum}`, path.join(gecici, aday.kod));
    if (cikan) {
      s.tgzBayt = fs.statSync(cikan.tgz).size;
      const liste = dosyalar(cikan.kok);
      s.dosyaSayisi = liste.length;
      s.androidVar = liste.some((f) => f.startsWith('android/'));
      s.iosVar = liste.some((f) => f.startsWith('ios/'));
      const gradle = oku(path.join(cikan.kok, 'android', 'build.gradle'));
      // Altta yatan Google reklam SDK'sı: klasik `play-services-ads` mi, yeni nesil
      // `ads-mobile-sdk` mi? İkisi ayrı üründür; ikincisi henüz beta yayımlanıyor.
      const klasik = gradle.match(/play-services-ads:\$?(\w+)/);
      const yeniNesil = gradle.match(/ads-mobile-sdk:\$?(\w+)/);
      const surumuCoz = (degisken) => {
        const m = gradle.match(new RegExp(`${degisken}\\s*=[^:]*:\\s*'([^']+)'`));
        return m?.[1] ?? '?';
      };
      if (klasik) s.sdk = `play-services-ads ${surumuCoz(klasik[1])}`;
      else if (yeniNesil) s.sdk = `ads-mobile-sdk ${surumuCoz(yeniNesil[1])}`;
      else s.sdk = '—';
      s.sdkBeta = /beta|alpha|rc/i.test(s.sdk);
      s.ump = /user-messaging-platform/.test(gradle);
      // Çocuk bayrakları: monetization.md §3 ikisini de ZORUNLU kılıyor.
      const dts = liste
        .filter((f) => f.endsWith('.d.ts'))
        .map((f) => oku(path.join(cikan.kok, f)))
        .join('\n');
      s.childFlag = /tagForChildDirectedTreatment/.test(dts);
      s.underAge = /tagForUnderAgeOfConsent/.test(dts);
      s.maxRating = /maxAdContentRating/.test(dts);
      s.consentApi = /requestConsentInfo|showConsentForm|ConsentStatus/.test(dts);
      // Reklam biçimleri
      s.banner = /showBanner|BannerAd/.test(dts);
      s.interstitial = /[Ii]nterstitial/.test(dts);
      s.rewarded = /[Rr]ewarded|RewardAd/.test(dts);
      s.proguard = liste.some((f) => /proguard|consumer-rules/i.test(f));
    }
    satirlar.push(s);
  }

  const sutun = (etiket, f) =>
    yaz(
      etiket.padEnd(26) +
        satirlar.map((s) => String(f(s) ?? '—').padEnd(24)).join('')
    );
  yaz(''.padEnd(26) + satirlar.map((s) => `${s.kod} ${s.ad.split('/')[0]}`.padEnd(24)).join(''));
  yaz('─'.repeat(26 + 24 * satirlar.length));
  sutun('sürüm', (s) => s.surum || s.durum);
  sutun('son yayın', (s) => s.sonYayin);
  sutun('son KARARLI sürüm', (s) => (s.sonKararli ? `${s.sonKararli[0]} (${String(s.sonKararli[1]).slice(0, 10)})` : '—'));
  sutun('toplam sürüm', (s) => s.surumSayisi);
  sutun('@capacitor/core', (s) => s.capacitor);
  sutun('lisans', (s) => s.lisans);
  sutun('tgz (KB)', (s) => (s.tgzBayt ? kb(s.tgzBayt) : '—'));
  sutun('dosya', (s) => s.dosyaSayisi);
  sutun('android / ios', (s) => (s.androidVar === undefined ? '—' : `${s.androidVar ? '✓' : '✗'} / ${s.iosVar ? '✓' : '✗'}`));
  yaz('');
  sutun('Google SDK', (s) => s.sdk);
  sutun('  SDK beta mı?', (s) => (s.sdk === undefined ? '—' : s.sdkBeta ? 'BETA ⚠' : 'kararlı'));
  sutun('UMP (rıza SDK)', (s) => (s.ump === undefined ? '—' : s.ump ? '✓' : '✗'));
  sutun('rıza API (JS)', (s) => (s.consentApi === undefined ? '—' : s.consentApi ? '✓' : '✗'));
  yaz('');
  yaz('ÇOCUK-GÜVENLİĞİ BAYRAKLARI (monetization.md §3 — ZORUNLU):');
  sutun('  tagForChildDirected', (s) => (s.childFlag === undefined ? '—' : s.childFlag ? '✓' : '✗'));
  sutun('  tagForUnderAgeOfCons', (s) => (s.underAge === undefined ? '—' : s.underAge ? '✓' : '✗'));
  sutun('  maxAdContentRating', (s) => (s.maxRating === undefined ? '—' : s.maxRating ? '✓' : '✗'));
  yaz('');
  yaz('REKLAM BİÇİMLERİ:');
  sutun('  banner', (s) => (s.banner === undefined ? '—' : s.banner ? '✓' : '✗'));
  sutun('  interstitial', (s) => (s.interstitial === undefined ? '—' : s.interstitial ? '✓' : '✗'));
  sutun('  ödüllü', (s) => (s.rewarded === undefined ? '—' : s.rewarded ? '✓' : '✗'));
  yaz('');
  fs.rmSync(gecici, { recursive: true, force: true });
  return satirlar;
}

/* ═══════════════════════ §C — DOĞAL ARA ═══════════════════════ */

/**
 * D-066 interstitial'ı "yalnız doğal aralarda" serbest bırakıyor ve "eylem ortasında ASLA"
 * diyor. Kuralı uygulamak için önce doğal aranın TANIMI lazım: oyuncunun girdisi zaten
 * kesilmişse (modal açık / panel açık) ve o anda bir harcama/servis akışı yoksa oradadır.
 * Bu bölüm o noktaları koddan sayar — tahmin değil, dosya+satır.
 */
const ARA_KALIPLARI = [
  {
    ad: 'offline dönüş özeti',
    testid: 'offline',
    dogal: true,
    not: 'oyun daha başlamadan önce; D-066 örneği',
  },
  { ad: 'günlük görev ödülü', testid: 'daily-reward', dogal: true, not: 'ödül modali, girdi zaten kesik' },
  { ad: 'hedef ödülü', testid: 'goal-reward', dogal: true, not: 'ödül modali, girdi zaten kesik' },
  { ad: 'usta satın alma', testid: 'master-bar', dogal: false, not: '💎 HARCAMA anı — eylem ortası' },
];

function bolumC() {
  yaz('═══ §C — DOĞAL ARA (interstitial nereye konabilir) ═══');
  yaz('D-066: "SADECE doğal aralarda", "eylem ortasında ASLA". Bu aralar bugüne dek sayılmadı.');
  yaz('');
  const src = path.join(KOK, 'src');
  const hepsi = dosyalar(src).filter((f) => /\.tsx?$/.test(f));
  const metin = new Map(hepsi.map((f) => [f, oku(path.join(src, f))]));

  yaz('kesinti noktası'.padEnd(24) + 'testid'.padEnd(16) + 'yer'.padEnd(34) + 'doğal ara?');
  yaz('─'.repeat(88));
  let dogalSayi = 0;
  for (const k of ARA_KALIPLARI) {
    let yer = 'BULUNAMADI';
    for (const [f, t] of metin) {
      const satirlar = t.split('\n');
      const i = satirlar.findIndex((s) => s.includes(`"${k.testid}"`) || s.includes(`'${k.testid}'`));
      if (i >= 0) {
        yer = `src/${f}:${i + 1}`;
        break;
      }
    }
    if (k.dogal) dogalSayi++;
    yaz(k.ad.padEnd(24) + k.testid.padEnd(16) + yer.padEnd(34) + (k.dogal ? 'EVET' : 'HAYIR — ' + k.not));
  }
  yaz('');
  yaz(`DOĞAL ARA SAYISI: ${dogalSayi}`);
  yaz('');
  yaz('PRESTIGE (Renovasyon) ARANIYOR — D-066 onu interstitial örneği olarak anıyor:');
  const prestij = [];
  for (const [f, t] of metin) {
    t.split('\n').forEach((s, i) => {
      if (/prestige|renovasyon/i.test(s) && !/^\s*[*/]/.test(s)) prestij.push(`src/${f}:${i + 1}  ${s.trim().slice(0, 70)}`);
    });
  }
  yaz(prestij.length ? prestij.join('\n') : '  (hiçbir yerde uygulanmamış — yalnız projectBrief\'te "uzun vade")');
  yaz('');
  return { dogalSayi, prestijVar: prestij.length > 0 };
}

/* ═══════════════════════ §D — BAĞLAMA NOKTALARI ═══════════════════════ */

function bolumD() {
  yaz('═══ §D — BUGÜN PASİF DURAN REKLAM DÜĞMELERİ (D-039 kalıbı) ═══');
  yaz('"Yeri belli, işlevi yok." Eklenti gelince bağlanacak yüzey tam olarak bunlar.');
  yaz('');
  const src = path.join(KOK, 'src');
  const hepsi = dosyalar(src).filter((f) => /\.tsx?$/.test(f));
  const bulgular = [];
  for (const f of hepsi) {
    oku(path.join(src, f))
      .split('\n')
      .forEach((s, i) => {
        if (/PlayAdIcon|className=.*\bad\b.*off|data-testid="master-ad"|adReady/.test(s)) {
          bulgular.push({ yer: `src/${f}:${i + 1}`, satir: s.trim() });
        }
      });
  }
  for (const b of bulgular) yaz(b.yer.padEnd(34) + b.satir.slice(0, 84));
  yaz('');
  yaz(`BAĞLAMA NOKTASI (kod satırı): ${bulgular.length}`);
  yaz('');
  return bulgular;
}

/* ═══════════════════════ §B — R8 KOLLARI ═══════════════════════ */

const KOLLAR = {
  taban: { eklenti: null, minify: true, not: 'D-130 durumu — eklentisiz, R8 açık' },
  'com-r8': { eklenti: '@capacitor-community/admob', minify: true, not: 'A1 + R8 açık' },
  'com-acik': { eklenti: '@capacitor-community/admob', minify: false, not: 'A1 + R8 KAPALI' },
  'capgo-r8': { eklenti: '@capgo/capacitor-admob', minify: true, not: 'A2 + R8 açık' },
  'capgo-acik': { eklenti: '@capgo/capacitor-admob', minify: false, not: 'A2 + R8 KAPALI' },
};

function gradleMinify(ac) {
  const p = path.join(KOK, 'android', 'app', 'build.gradle');
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace(/minifyEnabled (true|false)/, `minifyEnabled ${ac}`);
  t = t.replace(/shrinkResources (true|false)/, `shrinkResources ${ac}`);
  fs.writeFileSync(p, t);
}

/**
 * APK içindeki `.dex`lerin SIKIŞTIRILMAMIŞ toplamı — R8'in asıl çalıştığı yer burası
 * (D-130: kazancın %96'sı `.dex`ten geldi, kaynak budamanın payı 0,08 MB).
 *
 * Zip merkezî dizini ELLE okunuyor; `unzip` bu makinede cmd.exe yolunda yok ve bir ölçüm aracı
 * kendi ölçtüğü sayıyı dış bir kabuk aracının varlığına bağlamamalı (F6'nın dersi: aracın
 * "temiz" demesi, aracın çalıştığı anlamına gelmiyor). Sessiz 0 dönmesin diye entry bulunamazsa
 * `null` döner, tablo da "—" basar.
 */
function dexBaytlari(apk) {
  try {
    const b = fs.readFileSync(apk);
    // EOCD imzası 0x06054b50 — sondan geriye taranır (yorum alanı en fazla 64 KB).
    let eocd = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) {
      if (b.readUInt32LE(i) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) return null;
    let n = b.readUInt16LE(eocd + 10);
    let p = b.readUInt32LE(eocd + 16);
    if (n === 0xffff || p === 0xffffffff) return null; // zip64 — bu boyutta beklenmiyor
    let toplam = 0;
    let bulundu = 0;
    for (let i = 0; i < n; i++) {
      if (b.readUInt32LE(p) !== 0x02014b50) return null;
      const acik = b.readUInt32LE(p + 24);
      const adUz = b.readUInt16LE(p + 28);
      const ekUz = b.readUInt16LE(p + 30);
      const yorumUz = b.readUInt16LE(p + 32);
      const ad = b.toString('utf8', p + 46, p + 46 + adUz);
      if (ad.endsWith('.dex')) {
        toplam += acik;
        bulundu++;
      }
      p += 46 + adUz + ekUz + yorumUz;
    }
    return bulundu ? toplam : null;
  } catch {
    return null;
  }
}

/**
 * §E — YANSIMA YÜZEYİ: R8 eklentinin köprü sınıfını yeniden adlandırdı mı?
 *
 * NEDEN AYRI BİR ÖLÇÜT. §B'nin tek başına söyleyebildiği şey *"derlendi"*. Ama R8'in eklentiyi
 * bozması derleme hatası vermez: yeniden adlandırılmış bir `@CapacitorPlugin` sınıfı sorunsuz
 * derlenir, APK'ya girer ve ancak CİHAZDA, köprü sınıfı adıyla ararken çöker. D-130'un
 * gerekçesi (*"Capacitor koruma kurallarını AAR içinde getiriyor"*) tam olarak bunu varsayıyordu
 * ve bugüne dek sınanmadı. Sınanabilir hâli: R8'in kendi `mapping.txt`i.
 *
 * Aranacak sınıf ELLE YAZILMAZ — kurulu eklentinin android kaynağından `@CapacitorPlugin`
 * taşıyan dosya bulunur, paket + sınıf adı ondan türetilir. Dördüncü bir aday eklenirse burası
 * kendiliğinden onu da bulur (R2'nin "ankraj listesi elle" açık ucunun tekrarlanmaması için).
 *
 * ÜÇ SONUÇ: `korundu` (ad aynı) · `YENİDEN ADLANDIRILDI` (ad değişmiş — köprü kırık)
 *           · `MAPPING'DE YOK` (R8 sınıfı tamamen budamış — köprü yok)
 */
function eklentiKopruSiniflari(eklenti) {
  const kok = path.join(KOK, 'node_modules', eklenti, 'android', 'src', 'main');
  if (!fs.existsSync(kok)) return [];
  const bulunan = [];
  for (const f of dosyalar(kok)) {
    if (!/\.(java|kt)$/.test(f)) continue;
    const t = oku(path.join(kok, f));
    if (!/@CapacitorPlugin/.test(t)) continue;
    const paket = t.match(/^\s*package\s+([\w.]+)/m)?.[1];
    const sinif = t.match(/(?:public\s+)?(?:open\s+)?class\s+(\w+)/)?.[1];
    if (paket && sinif) bulunan.push(`${paket}.${sinif}`);
  }
  return bulunan;
}

function yansimaDenetle(eklenti) {
  const mapping = path.join(KOK, 'android/app/build/outputs/mapping/release/mapping.txt');
  if (!eklenti || !fs.existsSync(mapping)) return null;
  const siniflar = eklentiKopruSiniflari(eklenti);
  if (!siniflar.length) return { hata: 'köprü sınıfı bulunamadı (eklenti kurulu mu?)' };
  const m = fs.readFileSync(mapping, 'utf8');
  // mapping satırı:  <özgün ad> -> <yeni ad>:
  const harita = new Map();
  for (const s of m.split('\n')) {
    const e = s.match(/^([\w.$]+) -> ([\w.$]+):/);
    if (e) harita.set(e[1], e[2]);
  }
  return {
    mappingSatir: harita.size,
    siniflar: siniflar.map((ad) => {
      const yeni = harita.get(ad);
      return { ad, yeni: yeni ?? null, durum: yeni === undefined ? "MAPPING'DE YOK" : yeni === ad ? 'korundu' : 'YENİDEN ADLANDIRILDI' };
    }),
  };
}

function bolumB(kolAdi) {
  const kol = KOLLAR[kolAdi];
  if (!kol) throw new Error(`bilinmeyen kol: ${kolAdi} (${Object.keys(KOLLAR).join(' | ')})`);
  yaz(`═══ §B — R8 KOLU: ${kolAdi} (${kol.not}) ═══`);

  // ÖNCE TEMİZLE. Kollar aynı ağaçta sırayla koşuyor; önceki kolun eklentisi kalırsa ölçülen
  // şey "A1 mi A2 mi" değil "A1+A2 birlikte" olur ve iki kol da kirlenir. Kurulum listesi
  // KOLLAR'dan türer — dördüncü bir aday eklenirse burası kendiliğinden onu da siler.
  const tumEklentiler = [...new Set(Object.values(KOLLAR).map((k) => k.eklenti).filter(Boolean))];
  const silinecek = tumEklentiler.filter((e) => e !== kol.eklenti && fs.existsSync(path.join(KOK, 'node_modules', e)));
  if (silinecek.length) {
    yaz(`  önceki kolun eklentisi siliniyor: ${silinecek.join(' ')}`);
    execSync(`npm rm ${silinecek.join(' ')} --no-audit --no-fund`, { cwd: KOK, stdio: 'inherit' });
  }
  if (kol.eklenti) {
    yaz(`  eklenti kuruluyor: ${kol.eklenti}`);
    execSync(`npm i ${kol.eklenti} --no-audit --no-fund`, { cwd: KOK, stdio: 'inherit' });
  }
  gradleMinify(kol.minify);

  const t0 = Date.now();
  let derlendi = true;
  let hata = '';
  try {
    execSync('npm run yayin', { cwd: KOK, stdio: 'pipe', encoding: 'utf8' });
  } catch (e) {
    derlendi = false;
    hata = String(e.stdout ?? '').split('\n').filter((s) => /error|FAILED|Caused by/i.test(s)).slice(0, 6).join(' | ');
  }
  const sure = Math.round((Date.now() - t0) / 1000);

  const apk = path.join(KOK, 'android/app/build/outputs/apk/release/app-release.apk');
  const aab = path.join(KOK, 'android/app/build/outputs/bundle/release/app-release.aab');
  const olcum = {
    kol: kolAdi,
    eklenti: kol.eklenti ?? '(yok)',
    minify: kol.minify,
    derlendi,
    hata,
    sureSn: sure,
    apkBayt: fs.existsSync(apk) && derlendi ? fs.statSync(apk).size : null,
    aabBayt: fs.existsSync(aab) && derlendi ? fs.statSync(aab).size : null,
    dexBayt: derlendi ? dexBaytlari(apk) : null,
    yansima: derlendi && kol.minify ? yansimaDenetle(kol.eklenti) : null,
    zaman: new Date().toISOString(),
  };

  const kayit = fs.existsSync(B_KAYIT) ? JSON.parse(fs.readFileSync(B_KAYIT, 'utf8')) : {};
  kayit[kolAdi] = olcum;
  fs.writeFileSync(B_KAYIT, JSON.stringify(kayit, null, 2) + '\n');

  yaz(`  derlendi : ${derlendi ? 'EVET' : 'HAYIR — ' + hata}`);
  yaz(`  süre     : ${sure} sn`);
  yaz(`  APK      : ${olcum.apkBayt ? mb(olcum.apkBayt) + ' MB' : '—'}`);
  yaz(`  AAB      : ${olcum.aabBayt ? mb(olcum.aabBayt) + ' MB' : '—'}`);
  yaz(`  .dex     : ${olcum.dexBayt ? mb(olcum.dexBayt) + ' MB (sıkıştırılmamış)' : '—'}`);
  if (olcum.yansima) {
    yaz(`  §E yansıma yüzeyi (mapping.txt · ${olcum.yansima.mappingSatir ?? '?'} sınıf satırı):`);
    for (const s of olcum.yansima.siniflar ?? []) yaz(`    ${s.durum.padEnd(22)} ${s.ad}${s.yeni && s.yeni !== s.ad ? ' → ' + s.yeni : ''}`);
    if (olcum.yansima.hata) yaz(`    HATA: ${olcum.yansima.hata}`);
  }
  yaz('');
  return olcum;
}

function bolumBOzet() {
  if (!fs.existsSync(B_KAYIT)) return yaz('(§B kolu henüz koşulmadı)');
  const kayit = JSON.parse(fs.readFileSync(B_KAYIT, 'utf8'));
  const taban = kayit.taban;
  yaz('═══ §B ÖZET — R8 EKLENTİYLE ═══');
  yaz('kol'.padEnd(13) + 'eklenti'.padEnd(30) + 'R8'.padEnd(7) + 'derl.'.padEnd(7) + 'APK'.padEnd(10) + 'AAB'.padEnd(10) + '.dex'.padEnd(10) + 'tabana göre');
  yaz('─'.repeat(97));
  for (const k of Object.keys(KOLLAR)) {
    const o = kayit[k];
    if (!o) {
      yaz(k.padEnd(13) + '(koşulmadı)');
      continue;
    }
    const fark =
      taban?.apkBayt && o.apkBayt ? `${o.apkBayt >= taban.apkBayt ? '+' : ''}${mb(o.apkBayt - taban.apkBayt)} MB` : '—';
    yaz(
      k.padEnd(13) +
        o.eklenti.padEnd(30) +
        (o.minify ? 'açık' : 'KAPALI').padEnd(7) +
        (o.derlendi ? '✓' : '✗').padEnd(7) +
        (o.apkBayt ? mb(o.apkBayt) : '—').padEnd(10) +
        (o.aabBayt ? mb(o.aabBayt) : '—').padEnd(10) +
        (o.dexBayt ? mb(o.dexBayt) : '—').padEnd(10) +
        fark
    );
    if (!o.derlendi) yaz('              ↳ ' + o.hata.slice(0, 110));
  }
  yaz('');
  yaz('§E — YANSIMA YÜZEYİ (R8 açık kollar · köprü sınıfı yeniden adlandırıldı mı?)');
  yaz('kol'.padEnd(13) + 'köprü sınıfı'.padEnd(46) + 'durum');
  yaz('─'.repeat(82));
  let denetlenen = 0;
  for (const k of Object.keys(KOLLAR)) {
    const y = kayit[k]?.yansima;
    if (!y) continue;
    if (y.hata) {
      yaz(k.padEnd(13) + '(—)'.padEnd(46) + 'HATA: ' + y.hata);
      continue;
    }
    for (const s of y.siniflar) {
      yaz(k.padEnd(13) + s.ad.padEnd(46) + s.durum + (s.yeni && s.yeni !== s.ad ? ` → ${s.yeni}` : ''));
      denetlenen++;
    }
  }
  yaz(denetlenen ? '' : '(R8 açık kol henüz koşulmadı)');
}

/* ═══════════════════════ KOŞUCU ═══════════════════════ */

yaz(`# olcum-reklam-f3 — ${new Date().toISOString()} — bölüm: ${BOLUM}${SEC.get('kol') ? ' kol:' + SEC.get('kol') : ''}`);
yaz('');
if (BOLUM.includes('A')) bolumA();
if (BOLUM === 'B') {
  if (SEC.get('kol')) bolumB(SEC.get('kol'));
  bolumBOzet();
}
if (BOLUM.includes('C')) bolumC();
if (BOLUM.includes('D')) bolumD();
