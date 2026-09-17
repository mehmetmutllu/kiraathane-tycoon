/**
 * olcum-kabuk-f1b.mjs — F1b turu: KABUĞUN YÜZÜ ölçümü.
 *
 * SORU: mağazaya gidecek kabuğun ikonu, açılış ekranı ve EKRAN YÖNÜ — hangi kol ne kadar
 * okunuyor, ne kadar bayt ve ne kadar risk getiriyor?
 *
 * KAPSAM DAMGASI (cihaz bağlı DEĞİL — F2'nin damgasının aynısı, ve aynı sebeple):
 *
 *   §A KAYNAK DÖKÜMÜ   — KESİN. Diskteki dosya, boyutu, piksel ölçüsü; cihazdan bağımsız.
 *   §B EKRAN YÖNÜ      — KESİN ama VEKİL EKRANDA. Ölçülen şey "telefonda güzel mi" değil,
 *                        "bu oranda kaç br² zemin ve kaç ankraj kadraja giriyor, HUD bunun
 *                        ne kadarını yiyor". Bunlar orana bağlı geometrik büyüklükler, yani
 *                        masaüstü tarayıcıda da GERÇEK. Dokunma ergonomisi vekildir.
 *   §D AÇILIŞ EKRANI   — KESİN ama DOLAYLI. Cihazda hangi ekranın çizildiği derlenmiş APK'nın
 *                        kaynak tablosundan okunur (aapt2), gözle değil. Ayrımı rapor taşır.
 *
 * ÖLÇÜMÜN ÜÇ KURALI (F2 ve F1a'nın pahalıya öğrettikleri):
 *
 * 1) HER KOL AYNI DÜNYAYI ÖLÇER. Kadraj karşılaştırması ancak sahne birebir aynıysa anlamlı;
 *    yoksa "portrede 3 masa az görünüyor" der, oysa o kolda masa hiç açılmamıştır. Her kare
 *    ölçümden önce aynı duruma kurulur (aynı pad'ler, aynı seviye, oyuncu park noktasında,
 *    zaman DONDURULMUŞ) ve kurulumun tuttuğu ham çıktıya YAZILIR.
 *
 * 2) ZEMİN ALANI SAYILARAK ÖLÇÜLÜR, KÖŞE IŞINIYLA DEĞİL. Dört köşeden ışın atıp dörtgen alanı
 *    hesaplamak ufuk kadrajın içine girdiği anda (yatayda girer) sonsuza kaçar ve sessizce
 *    saçma bir sayı verir. Bunun yerine odanın kendisi ızgarayla taranır ve her nokta kameraya
 *    SORULUR: kadrajda mı? Alan = (kadraja giren nokta oranı) × oda alanı. Ufuk açık olsa bile
 *    sayı sınırlı ve karşılaştırılabilir kalır.
 *
 * 3) HUD'UN ALTINDA KALAN ZEMİN GÖRÜNMÜYOR SAYILIR. "Kadrajdaki zemin" tek başına yatayı
 *    haksız yere kazandırır: yatayda HUD aynı öğeleri daha kısa bir ekrana yığar. Bu yüzden
 *    aynı ızgara ikinci kez, bu kez HUD dikdörtgenlerine karşı taranır → AÇIK ZEMİN.
 *
 * Koşu:  node tools/olcum-kabuk-f1b.mjs               (OLCUM=kisa — 2 kadraj, aracı doğrular)
 *        OLCUM=tam node tools/olcum-kabuk-f1b.mjs     (5 kadraj + döndürme sınaması)
 *        F1B_PORT=5211 node tools/olcum-kabuk-f1b.mjs (port çakışırsa)
 *
 * Çıktı: stdout (ham) — `docs/olcum-kabuk-f1b.txt`e yönlendirilir.
 */
import { spawn, execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAM = (process.env.OLCUM || 'kisa') === 'tam';
const PORT = Number.parseInt(process.env.F1B_PORT ?? '', 10) || 5211;
const ADRES = `http://localhost:${PORT}/`;

const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const tr = (n) => Math.round(n).toLocaleString('tr-TR');
const kb = (b) => `${f1(b / 1024)} KB`;

const satirlar = [];
const yaz = (s = '') => { satirlar.push(s); console.log(s); };

// =====================================================================================
// §A — KAYNAK DÖKÜMÜ (kesin, cihazdan bağımsız)
// =====================================================================================

/** PNG başlığından genişlik/yükseklik okur (IHDR ilk 8 bayt sonrası). */
function pngOlcu(yol) {
  const b = fs.readFileSync(yol);
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bayt: b.length };
}

/**
 * Capacitor'ın kendi şablonundaki dosyayla BİREBİR aynı mı?
 *
 * Bunu göz kararı yapmak ("mavi X gördüm") ölçüm değil; kaynak `node_modules`ta duruyor ve
 * bayt bayt karşılaştırılabilir. Şablon yoksa denetim ATLANMAZ, "kaynak yok" diye damgalanır —
 * sessizce "değişmiş" demek, F1a'nın karamsar-hata dersinin tersi olurdu.
 */
function varsayilanMi(hedef, sablonAdaylari) {
  for (const s of sablonAdaylari) {
    if (!fs.existsSync(s)) continue;
    return { kaynak: s, ayni: fs.readFileSync(s).equals(fs.readFileSync(hedef)) };
  }
  return { kaynak: null, ayni: null };
}

/**
 * Capacitor'ın android şablonunu geçici bir dizine açar ve `res` kökünü döndürür.
 *
 * Şablon `node_modules/@capacitor/cli/assets/android-template.tar.gz` içinde SIKIŞTIRILMIŞ
 * duruyor — dizin olarak aramak (ilk koşuda yapılan) her dosyaya "kaynak yok" dedirtiyordu,
 * yani denetim sessizce ÖLÜYDÜ. "Karşılaştıramadım" ile "farklı" ayrı şeylerdir; araç ikisini
 * karıştırırsa varsayılan bir ikonu "özelleştirilmiş" diye geçirebilir.
 */
function sablonResKoku() {
  const tgz = path.join(KOK, 'node_modules/@capacitor/cli/assets/android-template.tar.gz');
  if (!fs.existsSync(tgz)) return null;
  const hedef = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-sablon-'));
  /*
   * Arşiv ÖNCE güvenli adla kopyalanır. Sebep: yolun içinde `@capacitor` geçiyor ve GNU tar
   * `@`ı uzak sunucu ayracı sanıp *"Cannot connect to capacitor\cli\...: resolve failed"*
   * diyerek düşüyor. Hata `stdio:'ignore'` ile yutulunca denetim sessizce "kaynak yok"a
   * dönüşüyordu — F1a'nın dersi: bir aracın KARAMSAR hatası gözden kaçar.
   */
  const yerel = path.join(hedef, 'sablon.tgz');
  try {
    fs.copyFileSync(tgz, yerel);
    // `--force-local`: yol `C:\...` ile başlıyor ve GNU tar iki noktayı da uzak sunucu ayracı
    // sayıyor (*"Cannot connect to C"*). Kopyalama `@`yı, bu bayrak `:`yi çözüyor.
    execFileSync('tar', ['--force-local', '-xzf', yerel, '-C', hedef, 'app/src/main/res'], { stdio: 'pipe' });
  } catch (e) {
    console.error('SABLON ACILAMADI:', e.message);
    return null;
  }
  const res = path.join(hedef, 'app/src/main/res');
  return fs.existsSync(res) ? res : null;
}

function kaynakDokumu() {
  const res = path.join(KOK, 'android/app/src/main/res');
  const sablonKok = sablonResKoku();

  const ikonlar = [];
  const splashlar = [];
  for (const dizin of fs.readdirSync(res)) {
    const d = path.join(res, dizin);
    if (!fs.statSync(d).isDirectory()) continue;
    for (const ad of fs.readdirSync(d)) {
      if (!ad.endsWith('.png')) continue;
      const yol = path.join(d, ad);
      const o = pngOlcu(yol);
      const kayit = {
        yol: path.relative(res, yol).replace(/\\/g, '/'),
        ...o,
        ...varsayilanMi(yol, sablonKok ? [path.join(sablonKok, dizin, ad)] : []),
      };
      (ad.startsWith('ic_launcher') ? ikonlar : splashlar).push(kayit);
    }
  }

  const manifest = fs.readFileSync(path.join(res, '../AndroidManifest.xml'), 'utf8');
  const styles = fs.readFileSync(path.join(res, 'values/styles.xml'), 'utf8');
  const mainActivity = fs.readFileSync(
    path.join(KOK, 'android/app/src/main/java/com/memedobro/teahousetycoon/MainActivity.java'), 'utf8');

  return {
    ikonlar, splashlar,
    yonKilidi: /android:screenOrientation\s*=\s*"([^"]+)"/.exec(manifest)?.[1] ?? null,
    configChanges: /android:configChanges\s*=\s*"([^"]+)"/.exec(manifest)?.[1] ?? null,
    acilisTema: /<style name="AppTheme.NoActionBarLaunch"[^>]*parent="([^"]+)"/.exec(styles)?.[1] ?? null,
    acilisTemaGovde: /<style name="AppTheme.NoActionBarLaunch"[\s\S]*?<\/style>/.exec(styles)?.[0] ?? '',
    installSplashCagrisi: /installSplashScreen/.test(mainActivity),
    // Mağaza ikonu 512×512 — depoda herhangi bir yerde var mı?
    magazaIkonu: (() => {
      const bak = ['docs/magaza', 'public/magaza', 'docs/pano', 'public'];
      for (const b of bak) {
        const d = path.join(KOK, b);
        if (!fs.existsSync(d)) continue;
        for (const ad of fs.readdirSync(d)) {
          if (!/\.png$/i.test(ad)) continue;
          const o = pngOlcu(path.join(d, ad));
          if (o && o.w === 512 && o.h === 512) return `${b}/${ad}`;
        }
      }
      return null;
    })(),
  };
}

// =====================================================================================
// §D-1 — AÇILIŞ EKRANI ADLİ İNCELEMESİ (derlenmiş APK'nın kaynak tablosu)
// =====================================================================================

function aapt2Yolu() {
  const kokler = [
    path.join(os.homedir(), 'AppData/Local/Android/Sdk/build-tools'),
    process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'build-tools') : null,
  ].filter(Boolean);
  for (const k of kokler) {
    if (!fs.existsSync(k)) continue;
    const surumler = fs.readdirSync(k).sort().reverse();
    for (const s of surumler) {
      const p = path.join(k, s, 'aapt2.exe');
      if (fs.existsSync(p)) return p;
      const p2 = path.join(k, s, 'aapt2');
      if (fs.existsSync(p2)) return p2;
    }
  }
  return null;
}

/**
 * DERLENMİŞ APK'YA SORAR: açılış penceresi hangi çizimi kullanıyor?
 *
 * Kaynak dosyalarına bakmak yetmez — sorunun tamamı `android:background` ile
 * `android:windowBackground`/`windowSplashScreenBackground` arasındaki farkta ve bu fark
 * ancak DERLENMİŞ tabloda görünür. Ayrıca R8'in kaynak budaması splash dosyalarını attıysa
 * (ya da atmadıysa) burada görünür.
 */
function acilisAdli() {
  const apk = path.join(KOK, 'android/app/build/outputs/apk/release/app-release.apk');
  const aapt2 = aapt2Yolu();
  if (!aapt2) return { durum: 'aapt2 BULUNAMADI — bölüm ölçülemedi' };
  if (!fs.existsSync(apk)) return { durum: 'release APK YOK — önce `npm run yayin`' };

  let dokum;
  try {
    dokum = execFileSync(aapt2, ['dump', 'resources', apk], { maxBuffer: 256 * 1024 * 1024 }).toString('utf8');
  } catch (e) {
    return { durum: `aapt2 kırıldı: ${e.message}` };
  }

  const satir = dokum.split(/\r?\n/);

  /**
   * Bir stil girdisinin GÖVDESİNİ ayıklar: başlık satırı + `size=N` kadar nitelik satırı.
   *
   * Sabit sayıda satır kesmek (ilk kurulumda yapılan) bir sonraki kaynağın niteliklerini de
   * içeri alıyordu — yani "temada windowBackground var mı" sorusuna KOMŞU kaynağa bakarak
   * cevap verme riski vardı. Gövde artık stilin kendi `size` alanından türüyor.
   */
  /**
   * Bir stilin TÜM YAPILANDIRMA VARYANTLARINI döker.
   *
   * İlk kurulum yalnız İLK varyantı okuyordu ve bu, §D'nin can alıcı kanıtını yarım
   * bırakıyordu: `Theme.SplashScreen`in bir de `(v31)` varyantı var ve Android 12+ cihazların
   * gerçekte kullandığı O. Tek varyanta bakan bir araç, "API 31'de ne oluyor" sorusuna
   * API 31 ÖNCESİNİN satırlarıyla cevap vermiş olurdu.
   *
   * `ad` DÜZ yazılır; kaçış burada bir kez yapılır (çağıranda da kaçırmak çift kaçışa yol
   * açıyordu ve regex hiç tutmuyordu — tema "TABLODA BULUNAMADI" görünüyordu).
   */
  function stilGovdesi(ad) {
    const kalip = new RegExp(`style/${ad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
    const i = satir.findIndex((s) => kalip.test(s.trim()));
    if (i < 0) return null;
    const varyantlar = [];
    // Başlıktan sonra, bir sonraki `resource ` satırına kadar olan her `(kip) (style) size=N`
    // satırı bir varyanttır.
    for (let j = i + 1; j < satir.length; j++) {
      const t = satir[j].trim();
      if (/^resource\s+0x/.test(t)) break;
      const m = /^\(([^)]*)\)\s+\(style\)\s+size=(\d+)(?:\s+parent=(\S+))?/.exec(t);
      if (!m) continue;
      const n = Number.parseInt(m[2], 10);
      varyantlar.push({
        kip: m[1] || '(varsayilan)',
        parent: m[3] ?? '(yok)',
        nitelikSayisi: n,
        nitelikler: satir.slice(j + 1, j + 1 + n).map((s) => s.trim()),
      });
    }
    return { baslik: satir[i].trim(), varyantlar };
  }

  const bizim = stilGovdesi('AppTheme.NoActionBarLaunch');
  const androidx = stilGovdesi('Theme.SplashScreen');
  // Pencere zeminini GERÇEKTE kim kuruyor: zincirin ortak atası.
  const ortak = stilGovdesi('Theme.SplashScreen.Common');

  /**
   * ÇERÇEVE NİTELİKLERİNİ aapt2 İSİMLE DEĞİL SAYIYLA basar (kütüphane niteliklerini isimle
   * basar — `buttonIconDimen(0x7f030041)` gibi). Bu yüzden isimle arama (ilk kurulum) hep
   * "yok" der; nitelik ORADA olsa bile. Karşılaştırma bu yüzden KİMLİK üzerinden yapılır ve
   * aşağıdaki eşleme ham çıktıya yazılır ki denetlenebilsin.
   */
  const AD = {
    '0x010100d4': 'android:background            <- GORUNUM zemini. Pencereyi CIZMEZ.',
    '0x01010054': 'android:windowBackground      <- API<31 acilis PENCERESININ zemini',
    '0x01010056': 'android:windowNoTitle',
    '0x01010031': 'android:colorBackground',
    '0x0101062c': 'android:windowSplashScreenBackground       <- API>=31 sistem splash zemini',
    '0x0101062d': 'android:windowSplashScreenAnimatedIcon     <- API>=31 sistem splash IKONU',
    '0x0101062e': 'android:windowSplashScreenAnimationDuration',
  };
  const kimlik = (s) => /^(0x[0-9a-f]{8})=/.exec(s)?.[1] ?? null;
  const tumNitelik = (st) => (st?.varyantlar ?? []).flatMap((v) => v.nitelikler);
  const bizimKimlikler = tumNitelik(bizim).map(kimlik).filter(Boolean);

  /**
   * ASIL SORU: `@drawable/splash` pencereyi çizen bir niteliğe bağlanıyor mu?
   * Pencereyi çizen nitelikler bunlar — `android:background` bunlardan biri DEĞİL.
   */
  const PENCERE_NITELIKLERI = ['0x01010054', '0x0101062c', '0x0101062d'];
  const splashPencereye = tumNitelik(bizim)
    .concat(tumNitelik(androidx), tumNitelik(ortak))
    .filter((n) => /@drawable\/splash\b/.test(n) && PENCERE_NITELIKLERI.includes(kimlik(n) ?? ''));

  return {
    durum: 'okundu',
    aapt2: path.relative(KOK, aapt2).replace(/\\/g, '/') || aapt2,
    apkBayt: fs.statSync(apk).size,
    bizim, androidx, ortak, AD, bizimKimlikler,
    splashPencereye,
    splashKaynagi: satir.filter((s) => /drawable\/splash\b/.test(s)).slice(0, 8).map((s) => s.trim()),
  };
}

// =====================================================================================
// §B — EKRAN YÖNÜ (canlı oyundan)
// =====================================================================================

/** Telefon kadrajları. `dpr` gerçek cihaz değerleri; CSS px ölçüsü kararı belirleyen büyüklük. */
const KADRAJLAR = [
  { ad: 'P1 portre 20:9', w: 412, h: 915, dpr: 2.625, yon: 'portre' },
  { ad: 'L1 yatay 20:9', w: 915, h: 412, dpr: 2.625, yon: 'yatay' },
  { ad: 'P2 portre 16:9 (dar)', w: 360, h: 640, dpr: 3, yon: 'portre', tamKipte: true },
  { ad: 'L2 yatay 16:9 (dar)', w: 640, h: 360, dpr: 3, yon: 'yatay', tamKipte: true },
  { ad: 'T1 tablet portre 4:3', w: 800, h: 1280, dpr: 2, yon: 'portre', tamKipte: true },
  /*
   * TABLET YATAY — ilk kurulumda YOKTU ve bu bir kapsam deliğiydi.
   *
   * Yön kilitlenirse tabletler de o yönde koşar; tablet portre ölçülmüş ama tablet YATAY hiç
   * ölçülmemişti. Yani "yatayı kilitleyelim" kolu, tabletlerde ne olacağı BİLİNMEDEN
   * öneriliyordu. Kullanıcı bunu sordu, araç cevabı taşımıyordu.
   *
   * Oran 1,60 — telefon yatayından (2,22) belirgin farklı; HUD'un yüzdesi de, kadraj da başka.
   */
  { ad: 'T2 tablet yatay 4:3', w: 1280, h: 800, dpr: 2, yon: 'yatay' },
];

/** Odanın yarı ölçüsü — `src/game/layout.ts`ten OKUNUR, elle yazılmaz (bayatlarsa araç kırılır). */
function floorHalf() {
  const s = fs.readFileSync(path.join(KOK, 'src/game/layout.ts'), 'utf8');
  const m = /export const FLOOR_HALF\s*=\s*([\d.]+)/.exec(s);
  if (!m) throw new Error('FLOOR_HALF layout.ts icinde bulunamadi — arac bayat');
  return Number.parseFloat(m[1]);
}

/**
 * Pad kimlikleri `economy.config.ts`ten OKUNUR, elle yazılmaz.
 *
 * İlk kurulumda liste elle yazılmıştı ve içindeki iki kimlik ('tost', 'lavabo') sırayla
 * açılması gereken zincirin ortasındaydı: dünya "6 pad açık" görünüyordu ama `tables` 1'de
 * kalmıştı. Yani araç ÖLÇÜYORDU ama ölçtüğü dünya kastedilen dünya değildi — ve bunu yalnız
 * dünya imzası satırı ele verdi. Liste artık kaynaktan türer; bir pad eklenirse kendiliğinden
 * girer.
 */
function tumPadlar() {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  if (!blok) throw new Error('economy.config.ts icinde pads blogu bulunamadi — arac bayat');
  const ids = [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
  if (ids.length < 5) throw new Error(`pad kimligi az bulundu (${ids.length}) — arac bayat`);
  return ids;
}

/**
 * İKİ DÜNYA ölçülür, tek dünya değil.
 *
 * Ekran yönü kararı tek bir sahneye bakarak verilemez: yeni oyuncunun gördüğü oda (tek masa,
 * tek alan) ile oyunun olgun hâli (üç alan, yirmi masa) kadraja bambaşka sığar. Tek dünyayla
 * ölçmek, kolu o dünyanın lehine sessizce eğer. Karşılaştırma HER ZAMAN dünya içinde yapılır;
 * dünyalar arası fark ayrı bir bulgudur.
 */
function dunyalar() {
  return [
    { ad: 'D0 baslangic (fresh)', pads: [], tamKipte: true },
    { ad: 'D1 tam acik', pads: tumPadlar(), tamKipte: false },
  ];
}

/**
 * OYUNCU NEREDE DURUYOR — kolun mutlak sayısını belirleyen üçüncü eksen.
 *
 * Kamera oyuncuyu takip ettiği için kadrajın ORANI her yerde aynı, ama kadrajın ne kadarının
 * ODAYA denk geldiği durulan yere bağlı: köşede frustum'un yarısı duvarın dışına düşer.
 * `__park()` oyunun kendi seçtiği nokta ve o nokta bir KÖŞE çıktı (-16,75 / 16,75) — tek başına
 * ölçmek her iki kolu birden, ve eşit olmayan biçimde, söndürüyordu. Üç nokta ölçülür ki karar
 * bir anekdota değil, üç noktada da tutan bir ORANA dayansın.
 */
const NOKTALAR = [
  { ad: 'N0 park (oyunun sectigi)', park: true },
  { ad: 'N1 oda merkezi', x: 0, z: 0 },
  { ad: 'N2 salon ici', x: -8, z: 6, tamKipte: true },
];

/**
 * KAMERA KADEMESİ — kararın yanlış öncüle oturmasını engelleyen eksen.
 *
 * İlk kadrajlar portrede dükkânın görünmediğini gösterdi. Bu sonucu doğrudan *"portre kötü"*
 * diye okumak HATA olurdu: portre `CAMERA_PORTRAIT_CLAMP = 1,3` ile KELEPÇELİ, oysa oranın
 * istediği açılma `1/aspect = 2,22`. Yani ölçülen şey portrenin doğası değil, bugünkü bir
 * SAYININ sonucu olabilir. Kelepçe açılınca portre kurtuluyorsa kol "yatayı kilitle" değil
 * "kelepçeyi büyüt" olur — ve bu iki karar aynı şey değildir.
 *
 * `Z1` oyuncunun zaten elinde olan düğme (HUD "Genel bakış", ×1,35). `Z2` kelepçenin tamamen
 * kalktığı hâli taklit eder: 8,5 × 1,3 × 1,708 ≈ 8,5 × 2,22.
 */
const ZOOMLAR = [
  { ad: 'Z0 varsayilan', zoomOut: false, distMul: 0 },
  { ad: 'Z1 genel bakis (HUD dugmesi)', zoomOut: true, distMul: 0, tamKipte: true },
  { ad: 'Z2 kelepce kalkik (portre)', zoomOut: false, distMul: 1.708 },
];

async function kadrajOlc(page, kadraj, H) {
  await page.setViewportSize({ width: kadraj.w, height: kadraj.h });
  await page.waitForTimeout(TAM ? 2200 : 1200);

  return page.evaluate(({ H, TAM }) => {
    const out = {};
    const vw = window.innerWidth, vh = window.innerHeight;
    out.gorunum = { vw, vh, dpr: window.devicePixelRatio, oran: +(vw / vh).toFixed(3) };

    // --- dünya denetimi: kollar aynı dünyayı mı ölçüyor? ---
    const g = window.__game();
    // `durum` adı bilerek: dışarıda `dunya` kurulum tanımını taşıyor, bu ise ÖLÇÜLEN sahnenin
    // imzası. İkisi aynı adı taşısaydı denetim kendi kurulumunu doğrulayıp geçerdi.
    out.durum = {
      tables: g.tables, areasOpen: g.areasOpen, padsDone: g.padsDone.length,
      stationLevel: g.stationLevel, npcCount: g.npcCount, player: g.player,
    };

    // --- HUD dikdörtgenleri (boyalı öğeler) ---
    const hudOgeleri = [];
    for (const el of document.querySelectorAll('.hud *, .touch-layer *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number.parseFloat(cs.opacity) < 0.05) continue;
      /*
       * BOYALI OLMAK `background-color` DEMEK DEĞİL — ve bu kusur ölçümün en pahalısıydı.
       *
       * İlk kurulum yalnız `backgroundColor` alfasına bakıyordu. Oyunun en büyük iki HUD bloğu
       * (`.band` görev şeridi ve `.botnav` alt gezinme) zeminlerini `linear-gradient` ile
       * veriyor, yani `background-color` ŞEFFAF kalıyor. İkisi de sayımdan düştü ve HUD'un
       * ekranda kapladığı alan yatayda %8,5 çıktı — kullanıcı ekrana bakıp *"yatayda ekran çok
       * dolu görevlerle"* dediğinde ölçüm ona karşı çıkıyordu. Araç haksızdı.
       *
       * Hata İYİMSERDİ (kolu olduğundan temiz gösteriyordu), bu yüzden sonucun tutarsızlığından
       * anlaşılmadı; ancak GÖZLE yakalandı. Artık zemin rengi, zemin GÖRSELİ (gradyan dahil) ve
       * görünür kenarlık — üçü de "boyalı" sayılıyor.
       */
      const alfasi = (renk) => {
        const m = /rgba?\(([^)]+)\)/.exec(renk || '');
        if (!m) return 0;
        const p = m[1].split(',');
        return p[3] !== undefined ? Number.parseFloat(p[3]) : 1;
      };
      const zeminRengi = alfasi(cs.backgroundColor) > 0.05;
      const zeminGorseli = cs.backgroundImage && cs.backgroundImage !== 'none';
      const kenarlik = Number.parseFloat(cs.borderTopWidth) > 0 && alfasi(cs.borderTopColor) > 0.05;
      const boyali = zeminRengi || zeminGorseli || kenarlik
        || el.tagName === 'SVG' || el.tagName === 'svg' || el.tagName === 'IMG';
      if (!boyali) continue;
      hudOgeleri.push({
        sinif: el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || el.tagName),
        x: r.left, y: r.top, w: r.width, h: r.height,
      });
    }
    out.hudOgeSayisi = hudOgeleri.length;

    // TAŞMA: ekran dışına çıkan / kesilen HUD öğesi
    const tasan = hudOgeleri.filter((o) => o.x < -1 || o.y < -1 || o.x + o.w > vw + 1 || o.y + o.h > vh + 1);
    out.tasanOge = tasan.length;
    out.tasanOrnek = tasan.slice(0, 5).map((o) => `${o.sinif} [${Math.round(o.x)},${Math.round(o.y)} ${Math.round(o.w)}×${Math.round(o.h)}]`);

    // HUD'un ekranda kapladığı alan (birleşim — piksel ızgarasıyla, üst üste binenler bir kez sayılsın)
    const ADIM = 4;
    let kapali = 0, toplam = 0;
    const kapaliMi = (px, py) => hudOgeleri.some((o) => px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h);
    for (let py = 0; py < vh; py += ADIM) {
      for (let px = 0; px < vw; px += ADIM) {
        toplam++;
        if (kapaliMi(px, py)) kapali++;
      }
    }
    out.hudEkranYuzde = +(100 * kapali / toplam).toFixed(2);

    /*
     * ALT BANT — şikâyetin tam karşılığı olan ölçü.
     *
     * "Ekranın %X'i HUD" sayısı, dağınık küçük öğelerle ekranın ALTINI baştan başa kaplayan bir
     * yığını aynı gösterir. Oysa oyun zeminini yiyen şey ikincisi: görev şeridi + alt gezinme
     * ekranın dibinde tam genişlikte bir BANT kuruyor ve o bandın altında oyundan hiçbir şey
     * kalmıyor. Yatayda ekran kısaldığı için aynı bant, ekranın çok daha büyük bir dilimini alır.
     *
     * Ölçü: ekranın alt %40'ına uzanan HUD öğelerinin en YUKARI noktası; bant = oradan aşağısı.
     */
    const altKume = hudOgeleri.filter((o) => o.y + o.h > vh * 0.6);
    const bantUst = altKume.length ? Math.min(...altKume.map((o) => o.y)) : vh;
    out.hudAltBantPx = +(vh - bantUst).toFixed(1);
    out.hudAltBantYuzde = +(100 * (vh - bantUst) / vh).toFixed(2);
    // En büyük tek HUD öğesi — "hangi blok yiyor" sorusunu doğrudan cevaplar.
    const enBuyuk = hudOgeleri.reduce((a, b) => (b.w * b.h > (a ? a.w * a.h : 0) ? b : a), null);
    out.enBuyukHud = enBuyuk
      ? `${enBuyuk.sinif} ${Math.round(enBuyuk.w)}×${Math.round(enBuyuk.h)} (ekranin %${(100 * enBuyuk.w * enBuyuk.h / (vw * vh)).toFixed(1)}'i)`
      : null;

    // --- en küçük GÖRÜNÜR yazı ---
    let enKucuk = Infinity, enKucukSinif = '';
    for (const el of document.querySelectorAll('.hud *')) {
      const metin = (el.textContent || '').trim();
      if (!metin) continue;
      // yalnız metni DOĞRUDAN taşıyan düğüm (ata düğümler iki kez saymasın)
      const dogrudan = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!dogrudan) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || Number.parseFloat(cs.opacity) < 0.05) continue;
      const fs2 = Number.parseFloat(cs.fontSize);
      if (fs2 < enKucuk) { enKucuk = fs2; enKucukSinif = String(el.className || el.tagName) + ' → "' + metin.slice(0, 18) + '"'; }
    }
    out.enKucukYaziPx = Number.isFinite(enKucuk) ? +enKucuk.toFixed(1) : null;
    out.enKucukYazi = enKucukSinif;

    // --- kamera projeksiyonu: zemin taraması ---
    const t3 = window.__three;
    if (!t3) { out.hata = '__three yok'; return out; }
    const cam = t3.camera;
    cam.updateMatrixWorld(true);
    const mvi = cam.matrixWorldInverse.elements;
    const pr = cam.projectionMatrix.elements;

    // vp = projection * viewInverse  (column-major 4x4 çarpımı)
    const vp = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r2 = 0; r2 < 4; r2++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += pr[k * 4 + r2] * mvi[c * 4 + k];
      vp[c * 4 + r2] = s;
    }
    const ndc = (x, y, z) => {
      const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
      const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
      const cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
      if (cw <= 0) return null; // kameranın ARKASI
      return [cx / cw, cy / cw];
    };

    // Oda ızgarası: N×N nokta, y=0 zemininde.
    const N = TAM ? 400 : 200;
    const adim = (2 * H) / (N - 1);
    let kadrajda = 0, acik = 0;
    for (let i = 0; i < N; i++) {
      const x = -H + i * adim;
      for (let j = 0; j < N; j++) {
        const z = -H + j * adim;
        const p = ndc(x, 0, z);
        if (!p) continue;
        if (p[0] < -1 || p[0] > 1 || p[1] < -1 || p[1] > 1) continue;
        kadrajda++;
        const px = (p[0] * 0.5 + 0.5) * vw;
        const py = (-p[1] * 0.5 + 0.5) * vh;
        if (!kapaliMi(px, py)) acik++;
      }
    }
    const odaAlani = (2 * H) * (2 * H);
    const noktaAlani = odaAlani / (N * N);
    out.zemin = {
      odaAlani: +odaAlani.toFixed(1),
      kadrajdaBr2: +(kadrajda * noktaAlani).toFixed(1),
      acikBr2: +(acik * noktaAlani).toFixed(1),
      odaYuzde: +(100 * kadrajda / (N * N)).toFixed(2),
      hudYiyen: +(100 * (kadrajda - acik) / Math.max(1, kadrajda)).toFixed(2),
      izgara: N,
    };

    // --- ankrajlar: kadrajda kaç tane? ---
    const ankraj = [];
    const ekle = (ad, p) => { if (p && p.length >= 3) ankraj.push({ ad, p }); };
    (g.tableUpgradeSpots || []).forEach((p, i) => ekle('masaYukseltme' + i, p));
    ekle('servis', g.stationPos);
    ekle('bulasik', g.dishStationPos);
    ekle('yukseltmeAlani', g.upgradeZonePos);
    ekle('lavabo', g.lavabo && g.lavabo.spot);
    ekle('lavaboPara', g.lavabo && g.lavabo.coinSpot);
    if (g.padPos) ekle('aktifPad', g.padPos);
    ekle('oyuncu', g.player);
    let icerde = 0;
    const disarda = [];
    for (const a of ankraj) {
      const p = ndc(a.p[0], 0, a.p[2]);
      const ic = p && p[0] >= -1 && p[0] <= 1 && p[1] >= -1 && p[1] <= 1;
      if (ic) icerde++; else disarda.push(a.ad);
    }
    out.ankraj = { toplam: ankraj.length, kadrajda: icerde, disarda };

    /*
     * KELEPÇEYİ AÇMANIN BEDELİ: oyuncunun EKRANDAKİ boyu.
     *
     * Kamerayı geri çekmek kadrajı bedavaya büyütmez — sahnedeki her şey küçülür. Bu sayı
     * olmadan "Z2 daha çok zemin gösteriyor" satırı kolu haksız yere kazandırırdı. Karakterin
     * dünya boyu 1,75 br (D-076); ayağının ve tepesinin izdüşümü arasındaki piksel farkı,
     * oyuncunun telefonda ne kadar büyük göründüğüdür.
     */
    const KARAKTER_BR = 1.75;
    const ayak = ndc(g.player[0], 0, g.player[2]);
    const bas = ndc(g.player[0], KARAKTER_BR, g.player[2]);
    out.oyuncuPx = ayak && bas ? +(Math.abs((ayak[1] - bas[1]) * 0.5 * vh)).toFixed(1) : null;
    out.oyuncuEkranYuzde = out.oyuncuPx != null ? +(100 * out.oyuncuPx / vh).toFixed(2) : null;

    // --- kamera ---
    out.kamera = {
      fov: +cam.fov.toFixed(2),
      aspect: +cam.aspect.toFixed(3),
      pos: [cam.position.x, cam.position.y, cam.position.z].map((n) => +n.toFixed(2)),
    };
    return out;
  }, { H, TAM });
}

// =====================================================================================
// koşu
// =====================================================================================

function sunucuKaldir() {
  // vite DOĞRUDAN node ile çağrılır (npm kabuğu üstünden değil): npm alt sürecin stdout'unu
  // yutabiliyor ve araç "60 sn içinde açılmadı" diye kırılıyordu — ilk koşuda tam bu oldu.
  // Hazır sinyali vite'ın KENDİ stdout'undan okunur; porta HTTP atmak, portu tutan YABANCI
  // sunucuyu "hazır" sanma kusurunu doğurur (duman.mjs ile aynı karar).
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, red) => {
    const zaman = setTimeout(() => red(new Error('sunucu 60 sn icinde hazir olmadi')), 60_000);
    s.stdout.on('data', (d) => {
      if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(zaman); coz(s); }
    });
    s.on('exit', (k) => { clearTimeout(zaman); red(new Error(`sunucu ${k} koduyla kapandi (port dolu olabilir)`)); });
  });
}

async function main() {
  yaz('# F1b — KABUGUN YUZU OLCUMU (ikon · acilis ekrani · ekran yonu)');
  yaz(`# kip=${TAM ? 'TAM' : 'KISA'} · ${new Date().toISOString()} · node ${process.version}`);
  yaz('');

  // ---------------------------------------------------------------- §A
  yaz('== §A — KAYNAK DOKUMU (kesin) ==');
  const A = kaynakDokumu();
  yaz('');
  yaz('-- ikon dosyalari --');
  let ikonBayt = 0, ikonVarsayilan = 0;
  for (const i of A.ikonlar) {
    ikonBayt += i.bayt;
    if (i.ayni === true) ikonVarsayilan++;
    yaz(`  ${i.yol.padEnd(42)} ${String(i.w).padStart(4)}×${String(i.h).padEnd(4)} ${kb(i.bayt).padStart(9)}  sablonla ayni: ${i.ayni === null ? '(kaynak yok)' : i.ayni ? 'EVET' : 'hayir'}`);
  }
  yaz(`  TOPLAM ${A.ikonlar.length} dosya · ${kb(ikonBayt)} · sablonla birebir ayni: ${ikonVarsayilan}/${A.ikonlar.length}`);
  yaz('');
  yaz('-- acilis ekrani dosyalari --');
  let splashBayt = 0, splashVarsayilan = 0;
  for (const s of A.splashlar) {
    splashBayt += s.bayt;
    if (s.ayni === true) splashVarsayilan++;
    yaz(`  ${s.yol.padEnd(42)} ${String(s.w).padStart(4)}×${String(s.h).padEnd(4)} ${kb(s.bayt).padStart(9)}  sablonla ayni: ${s.ayni === null ? '(kaynak yok)' : s.ayni ? 'EVET' : 'hayir'}`);
  }
  yaz(`  TOPLAM ${A.splashlar.length} dosya · ${kb(splashBayt)} · sablonla birebir ayni: ${splashVarsayilan}/${A.splashlar.length}`);
  yaz('');
  yaz(`  ekran yonu kilidi (manifest) : ${A.yonKilidi ?? 'YOK — cihaz serbest dondurur'}`);
  yaz(`  configChanges                : ${A.configChanges ?? '(yok)'}`);
  yaz(`  acilis temasi parent         : ${A.acilisTema}`);
  yaz(`  MainActivity installSplash() : ${A.installSplashCagrisi ? 'VAR' : 'YOK'}`);
  yaz(`  magaza ikonu (512×512)       : ${A.magazaIkonu ?? 'YOK'}`);
  yaz('  acilis temasi govdesi:');
  for (const l of A.acilisTemaGovde.split('\n')) yaz('    ' + l);
  yaz('');

  // ---------------------------------------------------------------- §D-1
  yaz('== §D-1 — ACILIS EKRANI ADLI INCELEMESI (derlenmis APK) ==');
  const D = acilisAdli();
  if (D.durum !== 'okundu') {
    yaz(`  ATLANDI: ${D.durum}`);
  } else {
    yaz(`  aapt2 : ${D.aapt2}`);
    yaz(`  apk   : ${kb(D.apkBayt)}`);
    yaz('');
    const stilYaz = (baslik, st) => {
      yaz(`  -- ${baslik} --`);
      if (!st) { yaz('    TABLODA BULUNAMADI'); return; }
      for (const v of st.varyantlar) {
        yaz(`    varyant ${v.kip} · parent ${v.parent} · ${v.nitelikSayisi} nitelik`);
        for (const n of v.nitelikler) {
          const k = /^(0x[0-9a-f]{8})=/.exec(n)?.[1];
          yaz(`      ${n}${k && D.AD[k] ? '   ' + D.AD[k] : ''}`);
        }
      }
    };
    stilYaz('BIZIM acilis temamiz (AppTheme.NoActionBarLaunch)', D.bizim);
    yaz('');
    stilYaz('androidx Theme.SplashScreen (API 31 varyanti DAHIL)', D.androidx);
    yaz('');
    stilYaz('androidx Theme.SplashScreen.Common (pencere zeminini kuran ata)', D.ortak);
    yaz('');
    yaz(`  BIZIM temanin ezdigi nitelik kimlikleri : ${D.bizimKimlikler.join(' ') || '(yok)'}`);
    yaz('');
    yaz('  ***  KRITIK SORU: @drawable/splash PENCEREYI cizen bir nitelige bagli mi?  ***');
    yaz(`  Pencereyi cizen nitelikler: android:windowBackground (0x01010054) ·`);
    yaz(`  android:windowSplashScreenBackground (0x0101062c) · ...AnimatedIcon (0x0101062d)`);
    yaz(`  CEVAP: ${D.splashPencereye.length === 0 ? 'HAYIR — hicbirine bagli degil.' : 'EVET: ' + D.splashPencereye.join(' | ')}`);
    yaz('');
    yaz('  APK kaynak tablosunda drawable/splash:');
    for (const l of D.splashKaynagi) yaz('    ' + l);
  }
  yaz('');

  // ---------------------------------------------------------------- §B
  yaz('== §B — EKRAN YONU (canli oyundan) ==');
  const H = floorHalf();
  yaz(`  FLOOR_HALF = ${H} (layout.ts'ten okundu) · oda ${2 * H}×${2 * H} = ${2 * H * 2 * H} br²`);
  yaz('');

  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const hatalar = [];
  let sonuclar = [];
  try {
    const sayfa = await tarayici.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
    sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
    sayfa.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message));
    await sayfa.goto(ADRES, { waitUntil: 'networkidle' });
    await sayfa.waitForTimeout(TAM ? 6000 : 4000);

    const kadrajListesi = KADRAJLAR.filter((k) => TAM || !k.tamKipte);
    const dunyaListesi = dunyalar().filter((d) => TAM || !d.tamKipte);

    for (const d of dunyaListesi) {
      // Dünya kurulumu + zamanı DONDUR (kadrajlar arası sahne oynamasın).
      /*
       * SIRA ÖNEMLİ ve ilk kurulumda YANLIŞTI: önce zaman donduruluyor, sonra pad'ler
       * yazılıyordu. Oysa `tick.ts` dünyayı HER KAREDE `padsDone`tan türetiyor
       * (`deriveWorld`) — zaman durunca türetme hiç koşmadı ve 24 pad açıkken sahne
       * `tables:1, areasOpen:1`de kaldı. Araç ölçüyordu ama ölçtüğü dünya kastedilen dünya
       * değildi; bunu yalnız dünya imzası satırı ele verdi. Artık: yaz → bir tur türet → dondur.
       */
      await sayfa.evaluate((pads) => {
        window.__setState({ padsDone: pads, padFills: {}, wallet: 1e9, diamonds: 1e6 });
        window.__zaman(1);
        window.__advanceTime(1);
      }, d.pads);
      await sayfa.waitForTimeout(1200);
      await sayfa.evaluate(() => window.__zaman(0));

      for (const n of NOKTALAR.filter((x) => TAM || !x.tamKipte)) {
        await sayfa.evaluate((n) => { if (n.park) window.__park(); else window.__teleport(n.x, n.z); }, n);
        await sayfa.waitForTimeout(1500);
        for (const z of ZOOMLAR.filter((x) => TAM || !x.tamKipte)) {
          await sayfa.evaluate((z) => {
            window.__setState({ camZoomOut: z.zoomOut });
            window.__devCam({ fov: 0, distMul: z.distMul });
          }, z);
          await sayfa.waitForTimeout(1800);
          for (const k of kadrajListesi) {
            const r = await kadrajOlc(sayfa, k, H);
            sonuclar.push({ dunya: d, nokta: n, zoom: z, kadraj: k, ...r });
          }
        }
      }
      // Kolun kendi ayarı bir sonraki dünyaya SIZMASIN.
      await sayfa.evaluate(() => { window.__setState({ camZoomOut: false }); window.__devCam({ fov: 0, distMul: 0 }); });
    }

    // DÖNDÜRME SINAMASI: portreden yataya canlı geçiş kırıyor mu?
    if (TAM) {
      const oncekiHata = hatalar.length;
      await sayfa.setViewportSize({ width: 412, height: 915 });
      await sayfa.waitForTimeout(1500);
      await sayfa.setViewportSize({ width: 915, height: 412 });
      await sayfa.waitForTimeout(1500);
      await sayfa.setViewportSize({ width: 412, height: 915 });
      await sayfa.waitForTimeout(1500);
      yaz(`-- dondurme sinamasi (P->L->P) : yeni konsol hatasi ${hatalar.length - oncekiHata}`);
      yaz('');
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }

  // --- dünya denetimi: bir dünya+nokta içinde tüm kadrajlar aynı sahneyi mi ölçtü? ---
  yaz('-- DUNYA DENETIMI (ayni dunya+nokta icinde kadrajlar ayni sahneyi mi olctu?) --');
  const imza = (s) => JSON.stringify(s.durum);
  const kume = [...new Set(sonuclar.map((s) => s.dunya.ad + ' | ' + s.nokta.ad + ' | ' + s.zoom.ad))];
  let denetimTemiz = true;
  for (const g of kume) {
    const grup = sonuclar.filter((s) => s.dunya.ad + ' | ' + s.nokta.ad + ' | ' + s.zoom.ad === g);
    const imzalar = new Set(grup.map(imza));
    if (imzalar.size !== 1) denetimTemiz = false;
    yaz(`  ${g.padEnd(46)} farkli imza: ${imzalar.size} ${imzalar.size === 1 ? '' : '<-- BOZUK'}`);
    yaz(`    ${imza(grup[0])}`);
  }
  yaz(`  DENETIM: ${denetimTemiz ? 'TEMIZ' : 'BOZUK — tablo guvenilmez'}`);
  yaz('');

  yaz('-- KADRAJ TABLOSU (karsilastirma HER ZAMAN ayni dunya+nokta icinde) --');
  yaz('  dunya            nokta                     zoom                       kadraj                 CSSpx      oran   zemin(br²)  acik(br²)  oda%   HUDyiyen%  HUDekran%  ALTBANT%  ankraj  oyuncuPx  tasan  yazi');
  for (const s of sonuclar) {
    const z = s.zemin || {};
    yaz(`  ${s.dunya.ad.padEnd(16)} ${s.nokta.ad.padEnd(25)} ${s.zoom.ad.padEnd(26)} ${s.kadraj.ad.padEnd(22)} ${String(s.gorunum.vw + '×' + s.gorunum.vh).padEnd(10)} ${String(s.gorunum.oran).padEnd(6)} ${String(f1(z.kadrajdaBr2 ?? 0)).padStart(10)} ${String(f1(z.acikBr2 ?? 0)).padStart(10)} ${String(f1(z.odaYuzde ?? 0)).padStart(6)} ${String(f1(z.hudYiyen ?? 0)).padStart(10)} ${String(f1(s.hudEkranYuzde)).padStart(10)} ${String(f1(s.hudAltBantYuzde ?? 0)).padStart(9)} ${String(s.ankraj.kadrajda + '/' + s.ankraj.toplam).padStart(7)} ${String(f1(s.oyuncuPx ?? 0)).padStart(9)} ${String(s.tasanOge).padStart(6)}  ${s.enKucukYaziPx}px`);
  }
  yaz('');

  // --- HUD DOLULUGU: kullanicinin "yatayda ekran cok dolu" sikayetinin sayisi ---
  yaz('-- HUD DOLULUGU (ayni dunya+nokta+zoom icinde, yon basina) --');
  for (const s of sonuclar.filter((x) => x.zoom.ad.startsWith('Z0') && x.nokta.ad.startsWith('N1') && x.dunya.ad.startsWith('D1'))) {
    yaz(`  ${s.kadraj.ad.padEnd(22)} ${String(s.gorunum.vw + '×' + s.gorunum.vh).padEnd(10)} HUD ekranin %${String(f1(s.hudEkranYuzde)).padStart(5)}'i · ALT BANT ${String(f1(s.hudAltBantPx)).padStart(6)} px = ekran yuksekliginin %${String(f1(s.hudAltBantYuzde)).padStart(5)}'i · en buyuk blok: ${s.enBuyukHud}`);
  }
  yaz('');

  // --- KOL KARŞILAŞTIRMASI ---
  yaz('-- KOL FARKI (V2 yatay ÷ V1 portre — ayni dunya, ayni nokta, ayni zoom, ayni oran ailesi) --');
  const oranlar = [];
  for (const d of new Set(sonuclar.map((s) => s.dunya.ad))) {
    for (const n of new Set(sonuclar.filter((s) => s.dunya.ad === d).map((s) => s.nokta.ad))) {
      for (const zm of new Set(sonuclar.map((s) => s.zoom.ad))) {
        for (const aile of ['20:9', '16:9', '4:3']) {
          const bul = (yon) => sonuclar.find((s) => s.dunya.ad === d && s.nokta.ad === n && s.zoom.ad === zm && s.kadraj.yon === yon && s.kadraj.ad.includes(aile));
          const p = bul('portre'), l = bul('yatay');
          if (!p || !l) continue;
          const o = l.zemin.acikBr2 / Math.max(0.01, p.zemin.acikBr2);
          oranlar.push(o);
          yaz(`  ${d} · ${n} · ${zm} · ${aile}`);
          yaz(`    acik zemin ${f1(l.zemin.acikBr2)} ↔ ${f1(p.zemin.acikBr2)} br²  = ${f2(o)}×  ·  ankraj ${l.ankraj.kadrajda} ↔ ${p.ankraj.kadrajda} (/${p.ankraj.toplam})  ·  oyuncu ${f1(l.oyuncuPx)} ↔ ${f1(p.oyuncuPx)} px`);
          yaz(`    HUD ekranin %${f1(l.hudEkranYuzde)} ↔ %${f1(p.hudEkranYuzde)}'i  ·  HUD zeminin %${f1(l.zemin.hudYiyen)} ↔ %${f1(p.zemin.hudYiyen)}'ini yiyor  ·  tasan ${l.tasanOge} ↔ ${p.tasanOge}`);
        }
      }
    }
  }
  if (oranlar.length) {
    const enAz = Math.min(...oranlar), enCok = Math.max(...oranlar);
    const ort = oranlar.reduce((a, b) => a + b, 0) / oranlar.length;
    yaz('');
    yaz(`  ORAN DAYANIKLILIGI: ${oranlar.length} olcumde yatay/portre acik zemin orani ${f2(enAz)}× … ${f2(enCok)}× (ortalama ${f2(ort)}×)`);
  }
  yaz('');

  // --- KELEPÇE KOLU: portre kendi içinde kurtarılabiliyor mu, bedeli ne? ---
  yaz('-- KELEPCE KOLU (portre Z0 → Z1 → Z2; kazanc ZEMIN, bedel OYUNCUNUN BOYU) --');
  for (const d of new Set(sonuclar.map((s) => s.dunya.ad))) {
    for (const n of new Set(sonuclar.filter((s) => s.dunya.ad === d).map((s) => s.nokta.ad))) {
      const p = sonuclar.filter((s) => s.dunya.ad === d && s.nokta.ad === n && s.kadraj.yon === 'portre' && s.kadraj.ad.includes('20:9'));
      if (p.length < 2) continue;
      const taban = p.find((s) => s.zoom.ad.startsWith('Z0'));
      yaz(`  ${d} · ${n}`);
      for (const s of p) {
        const kz = taban ? s.zemin.acikBr2 / Math.max(0.01, taban.zemin.acikBr2) : 1;
        const ko = taban && taban.oyuncuPx ? s.oyuncuPx / taban.oyuncuPx : 1;
        yaz(`    ${s.zoom.ad.padEnd(28)} kamera y ${String(f1(s.kamera.pos[1])).padStart(6)} · acik zemin ${String(f1(s.zemin.acikBr2)).padStart(7)} br² (${f2(kz)}×) · ankraj ${String(s.ankraj.kadrajda).padStart(2)} · oyuncu ${String(f1(s.oyuncuPx)).padStart(6)} px (${f2(ko)}×)`);
      }
      // Portrenin en iyi hâli, yatayın TABANINI yakalıyor mu?
      const enIyiPortre = p.reduce((a, b) => (b.zemin.acikBr2 > a.zemin.acikBr2 ? b : a));
      const yatayTaban = sonuclar.find((s) => s.dunya.ad === d && s.nokta.ad === n && s.zoom.ad.startsWith('Z0') && s.kadraj.yon === 'yatay' && s.kadraj.ad.includes('20:9'));
      if (yatayTaban) {
        yaz(`    → portrenin EN IYI hali (${enIyiPortre.zoom.ad}) ${f1(enIyiPortre.zemin.acikBr2)} br² · yatayin TABANI ${f1(yatayTaban.zemin.acikBr2)} br² = ${f2(yatayTaban.zemin.acikBr2 / Math.max(0.01, enIyiPortre.zemin.acikBr2))}× hala onde`);
        yaz(`      bedel: oyuncu ${f1(enIyiPortre.oyuncuPx)} px ↔ yatayda ${f1(yatayTaban.oyuncuPx)} px`);
      }
    }
  }
  yaz('');

  for (const s of sonuclar) {
    yaz(`-- ${s.dunya.ad} · ${s.nokta.ad} · ${s.zoom.ad} · ${s.kadraj.ad} ayrinti --`);
    yaz(`   kamera: fov ${s.kamera.fov} · aspect ${s.kamera.aspect} · pos ${JSON.stringify(s.kamera.pos)}`);
    yaz(`   HUD boyali oge: ${s.hudOgeSayisi} · tasan: ${s.tasanOge}`);
    for (const t of s.tasanOrnek) yaz(`     TASAN ${t}`);
    yaz(`   kadraj disi ankraj: ${s.ankraj.disarda.join(', ') || '(yok)'}`);
    yaz(`   en kucuk yazi: ${s.enKucukYaziPx} px — ${s.enKucukYazi}`);
    yaz('');
  }

  yaz(`-- konsol hatalari: ${hatalar.length}`);
  for (const h of hatalar.slice(0, 10)) yaz('   ' + h);
  yaz('');

  // ---------------------------------------------------------------- §E
  yaz('== §E — BAYT DOKUMU ==');
  yaz(`  ikon dosyalari      : ${A.ikonlar.length} dosya · ${kb(ikonBayt)}`);
  yaz(`  acilis ekrani       : ${A.splashlar.length} dosya · ${kb(splashBayt)}`);
  const portBayt = A.splashlar.filter((s) => s.yol.includes('-port-')).reduce((n, s) => n + s.bayt, 0);
  const landBayt = A.splashlar.filter((s) => s.yol.includes('-land-')).reduce((n, s) => n + s.bayt, 0);
  yaz(`    port-* dali       : ${kb(portBayt)}`);
  yaz(`    land-* dali       : ${kb(landBayt)}`);
  yaz(`    yonsuz (drawable/): ${kb(splashBayt - portBayt - landBayt)}`);
  yaz('');
  yaz('# BITTI');

  fs.writeFileSync(path.join(KOK, 'docs/olcum-kabuk-f1b.txt'), satirlar.join('\n') + '\n', 'utf8');
}

main().catch((e) => { console.error('OLCUM KIRILDI:', e.message); process.exit(1); });
