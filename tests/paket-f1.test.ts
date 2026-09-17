import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * PAKET BEKÇİSİ — F1a · D-130.
 *
 * Bu turun kararlarının tamamı **oyunda görünmeyen** yerlerde duruyor: gradle dosyası, manifest,
 * `.gitignore`. Hiçbiri testle değil, ancak `npm run apk` koşunca ve o da yalnız o makinede
 * anlaşılır. Yani buradaki bir bozulma **sessizdir** ve ilk kez mağazaya yükleme günü görülür.
 * Bekçinin işi o günü bugüne çekmek.
 *
 * Dört şey bozulursa karar sessizce kaybolur:
 *   (a) paket kimliği bir yerde değişip başka bir yerde kalırsa → derleme çalışır ama uygulama
 *       kimliği ikiye ayrılır; Play'de kalıcı olan kimlik yanlış olur
 *   (b) sürüm elle yazılırsa → F1a'nın kapattığı "iki kaynak" kusuru geri gelir
 *   (c) parola veya anahtar depoya girerse → herkesin imzalayabildiği bir uygulama olur
 *   (d) küçültme kapanırsa → ölçülen 1,99 MB sessizce geri gelir
 *
 * TASARIM NOTU — bekçi sayıyı KENDİ kaynağından okumaz. `package.json`'ı okuyup gradle'ın onu
 * okuduğunu doğrulamak, ikisinin de aynı yanlışı yapmasına karşı kör olurdu. Bu yüzden
 * kimlik gibi kalıcı değerler burada **açıkça yazılı** duruyor: birini değiştiren, bekçiyi de
 * değiştirmek zorunda kalsın ve bu bir karar anı olsun.
 */

const KOK = path.resolve(__dirname, '..');
const oku = (...p: string[]) => fs.readFileSync(path.join(KOK, ...p), 'utf8');

/** D-130 ile seçilen kalıcı kimlik. Play'de yayımlandıktan sonra DEĞİŞTİRİLEMEZ. */
const PAKET = 'com.memedobro.teahousetycoon';

const capacitorConfig = oku('capacitor.config.ts');
const appGradle = oku('android', 'app', 'build.gradle');
const manifest = oku('android', 'app', 'src', 'main', 'AndroidManifest.xml');
const stringsVarsayilan = oku('android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const stringsTurkce = oku('android', 'app', 'src', 'main', 'res', 'values-tr', 'strings.xml');
const gitignore = oku('.gitignore');
const pkg = JSON.parse(oku('package.json')) as { version: string };

describe('paket kimligi tek ve ayni (D-130)', () => {
  it('capacitor, gradle ve namespace ayni kimligi soyluyor', () => {
    expect(capacitorConfig).toContain(`appId: '${PAKET}'`);
    expect(appGradle).toContain(`applicationId "${PAKET}"`);
    expect(appGradle).toContain(`namespace = "${PAKET}"`);
  });

  it('strings.xml kimlik alanlari da ayni', () => {
    expect(stringsVarsayilan).toContain(`<string name="package_name">${PAKET}</string>`);
    expect(stringsVarsayilan).toContain(`<string name="custom_url_scheme">${PAKET}</string>`);
  });

  /**
   * Java paketi DİZİN YOLUYLA birlikte denetlenir. Sadece `package` satırını okumak yetmez:
   * satırı değiştirip dosyayı taşımayan bir değişiklikte gradle derlemeyi kırar ama bekçi
   * yeşil kalırdı — yani bekçi, derleyicinin zaten yakaladığı şeyi denetlemiş, kendi işini
   * yapmamış olurdu.
   */
  it('MainActivity hem paketini hem yerini tasiyor', () => {
    const yol = path.join(KOK, 'android', 'app', 'src', 'main', 'java', ...PAKET.split('.'), 'MainActivity.java');
    expect(fs.existsSync(yol)).toBe(true);
    expect(fs.readFileSync(yol, 'utf8')).toContain(`package ${PAKET};`);
  });

  it('eski kimlik hicbir yerde kalmadi', () => {
    for (const [ad, metin] of [
      ['capacitor.config.ts', capacitorConfig],
      ['build.gradle', appGradle],
      ['strings.xml', stringsVarsayilan],
    ] as const) {
      expect(ad + ': ' + metin).not.toContain('com.kosekiraathanesi');
    }
    expect(fs.existsSync(path.join(KOK, 'android', 'app', 'src', 'main', 'java', 'com', 'kosekiraathanesi'))).toBe(false);
  });
});

describe('surum TEK kaynaktan turer', () => {
  it('package.json semver', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('gradle surumu package.json-dan OKUR, elle yazmaz', () => {
    expect(appGradle).toContain("file('../../package.json')");
    expect(appGradle).toContain('versionName paket.version');
    expect(appGradle).toContain('versionCode surumKodu');
  });

  /**
   * Elle yazılmış bir sürüm satırı, türetmenin yanında sessizce durup onu ezebilir. Kalıp
   * bilerek dar: `versionName "..."` ya da `versionCode <sayı>` biçiminde SABİT bir değer.
   */
  it('gradle-da sabit surum degeri YOK', () => {
    expect(appGradle).not.toMatch(/versionName\s+"/);
    expect(appGradle).not.toMatch(/versionCode\s+\d/);
  });

  it('surum kodu formulu semver ile birlikte artar', () => {
    const formul = appGradle.match(/surum\.group\(1\)\.toInteger\(\) \* (\d+) \+ surum\.group\(2\)\.toInteger\(\) \* (\d+) \+ surum\.group\(3\)/);
    expect(formul, 'surumKodu formulu bulunamadi').not.toBeNull();
    const [, majorCarpan, minorCarpan] = formul!.map(Number);
    // Katsayılar, alttaki basamağın taşamayacağı kadar büyük olmalı: aksi hâlde 0.9.0 ile
    // 0.8.100 aynı kodu üretir ve Play güncellemeyi reddeder.
    expect(minorCarpan).toBeGreaterThanOrEqual(100);
    expect(majorCarpan).toBeGreaterThanOrEqual(minorCarpan * 100);
  });
});

describe('imza: anahtar da parola da depoda degil', () => {
  /**
   * KAÇAN MUTASYONUN DERSİ (M10 · M11): ilk yazımda burada `gitignore` METNİNDE kalıp
   * aranıyordu. Satırın başına `#` koyan mutasyon, kuralı ÖLDÜRDÜĞÜ hâlde metni bozmadığı için
   * bekçiyi yeşil bıraktı — yani bekçi, `.gitignore`ın ne YAZDIĞINI denetliyordu, ne YAPTIĞINI
   * değil. Doğrusu git'in kendisine sormaktır: `git check-ignore` yol var olmasa bile kuralı
   * uygular ve yorum satırını kural saymaz.
   */
  const gitYokSayiyorMu = (yol: string) => {
    const r = spawnSync('git', ['check-ignore', '-q', '--no-index', yol], { cwd: KOK });
    // 0 = yok sayılıyor · 1 = sayılmıyor · diğer = git çalışmadı (bunu sessizce geçmeyiz)
    expect([0, 1], `git check-ignore calismadi (cikis ${r.status})`).toContain(r.status);
    return r.status === 0;
  };

  it('git imza dosyalarini GERCEKTEN yok sayiyor', () => {
    expect(gitYokSayiyorMu('android/keystore.properties')).toBe(true);
    expect(gitYokSayiyorMu('android/kiraathane-yukleme.jks')).toBe(true);
    // Karşı örnek: kural fazla genişse (ör. tüm `android/`) bu da yok sayılır ve kabuk
    // depodan düşerdi. Bekçi o yönü de tutuyor.
    expect(gitYokSayiyorMu('android/app/build.gradle')).toBe(false);
  });

  it('kurallar ETKIN satir olarak duruyor (yorumlanmis degil)', () => {
    const etkin = gitignore
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s !== '' && !s.startsWith('#'));
    expect(etkin).toContain('android/keystore.properties');
    expect(etkin).toContain('android/*.jks');
  });

  it('gradle parolayi DOSYADAN okuyor, icine gomulmemis', () => {
    expect(appGradle).toContain("rootProject.file('keystore.properties')");
    expect(appGradle).toContain("imza['storePassword']");
    // Gömülü parola kalıbı: tırnak içinde doğrudan atanan bir storePassword/keyPassword.
    expect(appGradle).not.toMatch(/(store|key)Password\s+["'][^"']/);
  });

  /**
   * Anahtar yoksa derleme KIRILMAMALI. Anahtarı olmayan ikinci makine (ya da ileride CI)
   * projeyi yine derleyebilmeli; "anahtar yok" ile "derleme bozuk" ayrı şeylerdir.
   */
  it('anahtar yoksa derleme kirilmaz, yalniz imzasiz cikar', () => {
    expect(appGradle).toContain('if (imzaDosyasi.exists())');
    expect(appGradle).not.toMatch(/throw new GradleException\([^)]*keystore/i);
  });

  it('depoda imza dosyasi izi yok', () => {
    const android = fs.readdirSync(path.join(KOK, 'android'));
    for (const ad of android) {
      if (ad.endsWith('.jks') || ad === 'keystore.properties') {
        // Dosya diskte olabilir (bu makinede var) — ama git'in görmemesi gerekir.
        expect(gitignore).toMatch(ad.endsWith('.jks') ? /android\/\*\.jks/ : /android\/keystore\.properties/);
      }
    }
  });
});

describe('kucultme kolu acik kalir (D-130 · V1)', () => {
  /**
   * `release { }` bloğu dosyada İKİ KEZ geçiyor: biri `signingConfigs` içinde (imza kolu),
   * biri `buildTypes` içinde (küçültme kolu). İlk eşleşmeyi alan bir kalıp imza bloğunu okuyup
   * "minify yok" der — ilk yazımda tam bu oldu. Bu yüzden önce `buildTypes` bulunuyor.
   */
  it('release blogunda minify ve kaynak budama acik', () => {
    const buildTypes = appGradle.slice(appGradle.indexOf('buildTypes'));
    const release = buildTypes.match(/release\s*\{[\s\S]*?\n\s{8}\}/)?.[0] ?? '';
    expect(release, 'buildTypes > release blogu bulunamadi').not.toBe('');
    expect(release).toContain('minifyEnabled true');
    expect(release).toContain('shrinkResources true');
  });

  it('proguard kurallari release-e bagli', () => {
    expect(appGradle).toContain("proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'");
  });
});

describe('cihaz dili adi secer', () => {
  it('varsayilan Ingilizce, Turkce ayri dosyada', () => {
    expect(stringsVarsayilan).toContain('<string name="app_name">Tea House Tycoon</string>');
    expect(stringsTurkce).toContain('<string name="app_name">Köşe Kıraathanesi</string>');
  });

  /**
   * Kimlik alanları çevrilmez. `values-tr` içine sızmış bir `package_name`, Türkçe cihazda
   * başka bir kimlik okunmasına yol açardı — sessiz ve yalnız o dilde.
   */
  it('kimlik alanlari cevrilmemis', () => {
    // Metinde değil, KAYNAKTA aranıyor: dosyanın yorumu bu adları anlatmak için anabilir
    // (ve anıyor); önemli olan `<string name="...">` olarak tanımlanmamış olmaları.
    const tanimlar = [...stringsTurkce.matchAll(/<string name="([^"]+)"/g)].map((m) => m[1]);
    expect(tanimlar).not.toContain('package_name');
    expect(tanimlar).not.toContain('custom_url_scheme');
  });
});

describe('kabugun degismeyen sartlari', () => {
  it('tek izin INTERNET', () => {
    const izinler = [...manifest.matchAll(/uses-permission android:name="([^"]+)"/g)].map((m) => m[1]);
    expect(izinler).toEqual(['android.permission.INTERNET']);
  });

  it('allowBackup acik — oyuncunun ilerlemesi yeni telefona tasinir', () => {
    expect(manifest).toContain('android:allowBackup="true"');
  });
});
