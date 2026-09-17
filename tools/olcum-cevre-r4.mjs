/**
 * olcum-cevre-r4.mjs — R4 ÖLÇÜM (G-50): "zemin ve duvarlar ve yan taraflar yapılmamış asset gibi".
 *
 * NEDEN ÖLÇÜM, NEDEN DOĞRUDAN ÇÖZÜM DEĞİL — bu şikâyet üç ayrı şeyden doğabilir ve üçü ayrı
 * kodu işaret eder:
 *   (a) yüzey karenin ÇOĞUNU kaplıyor ve DÜZ  -> zemin/duvar malzemesi
 *   (b) yüzeyler bitiyor, ardında ARKA PLAN var -> "kesik" his, çevre/kabuk işi
 *   (c) yüzey aslında küçük, his başka yerden geliyor -> hiçbiri; kol yanlış
 * Hangisi olduğu sayıyla ayrılmadan 12 aday render etmek, 12 adayın 11'ini boşa çizmektir.
 *
 * YÖNTEM — ekranın kendisi örneklenir, sahne grafı değil:
 *   1. Gerçek oyun kamerasından bir IŞIN IZGARASI atılır (ekran koordinatına birebir oturan).
 *   2. Her ışının VURDUĞU nesne sınıflandırılır; vurmayan ışın BOŞLUK'tur ve ufkun altında mı
 *      üstünde mi olduğu ayrı sayılır — **ufuk ALTI boşluk** "zemin bitti, arkası görünüyor"
 *      demektir, kullanıcının "kesik/yan taraflar" cümlesinin sayısal karşılığı budur.
 *   3. AYNI KARENİN gerçek pikselleri `readPixels` ile okunur ve her ışının pikseli kendi
 *      kovasına yazılır. Böylece "düz mü" sorusu kanaat değil SAYI olur: kova başına parlaklık
 *      standart sapması + ayrık renk sayısı.
 *
 * Işın ve piksel AYNI kareden gelir: `gl.render()` çağrılır, `readPixels` aynı JS görevinde
 * okunur (çizim tamponu ancak görev bitince silinir). Ton eşlemesi/renk uzayı dahil, yani
 * okunan değer ekranda görünen değerdir. Sahne postprocessing KULLANMIYOR (package.json'da
 * bağımlılık var, kodda kullanım yok) — vekil değil, birebir.
 *
 * Bu araç HİÇBİR ŞEYİ DEĞİŞTİRMEZ. Çıktı: docs/olcum-cevre-r4.txt + docs/gorsel/ss/r4-taban-*.png
 * Kullanım:  node tools/olcum-cevre-r4.mjs         (OLCUM=kisa varsayılan)
 *            OLCUM=tam node tools/olcum-cevre-r4.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const KIP = (process.env.OLCUM || 'kisa').toLowerCase();
const TAM = KIP === 'tam';
const KOK = path.resolve('.');
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = Number(process.env.R4_PORT || 5414);

/** Işın ızgarasının kenarı. Kısa koşu aracı doğrular, tam koşu rapora sayı basar. */
const IZGARA = TAM ? 80 : 40;

const PADS =
  'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(
    ' ',
  );

/**
 * KADRAJLAR — kullanıcı oyunu hem tarayıcıda hem telefonda gördü; "yan taraflar" cümlesi
 * en-boy oranına bağlı olabilir (portrede kamera 1,30 uzaklaşıyor, daha çok kenar girer).
 */
const KADRAJ = TAM
  ? [
      { ad: 'yatay', w: 1500, h: 950 },
      { ad: 'portre', w: 412, h: 915 },
    ]
  : [{ ad: 'yatay', w: 1500, h: 950 }];

/**
 * DURUM × KONUM — şikâyet gerçek oynanıştan geldi, yani hem AÇILIŞ (tek alan, bina küçük,
 * kenar her yerde) hem TAM (üç alan açık) ölçülür. Açılışta kenarın ekrana daha çok girmesi
 * beklenir; beklenti sayıyla sınanır, varsayılmaz.
 */
const SENARYO = TAM
  ? [
      { durum: 'acilis', pads: [], konumlar: [[-8.5, 8], [-14, 3], [-4, 14], [-8.5, 1]] },
      { durum: 'tam', pads: PADS, konumlar: [[-6, 4], [8, -5], [14, 8], [0, 13], [-13, -6]] },
    ]
  : [
      { durum: 'acilis', pads: [], konumlar: [[-8.5, 8], [-14, 3]] },
      { durum: 'tam', pads: PADS, konumlar: [[-6, 4], [8, -5]] },
    ];

const cikti = [];
const yaz = (s = '') => {
  cikti.push(s);
  console.log(s);
};
const n1 = (v) => v.toFixed(1).padStart(6);
const n2 = (v) => v.toFixed(2).padStart(7);
const yz = (v) => `${(v * 100).toFixed(1).padStart(5)}%`;

mkdirSync(OUT, { recursive: true });

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', () => {});

const bekle = async () => {
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true;
    } catch {
      /* bekle */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

/**
 * TARAYICI TARAFI — sayfaya bir kez kurulur.
 *
 * `Raycaster` UYGULAMANIN KENDİ three örneğinden alınır. Bu ayrıntı önemsiz değil: ham
 * `three.module.js` ayrı bir modül örneği yükler ve o örneğin sınıfları sahnedeki nesnelerin
 * `raycast()` metoduyla aynı iç durumu paylaşmaz. Vite'ın ön-paketlediği `deps/three.js`
 * URL'si kaynak listesinden bulunur (hash sürümle değişir, elle yazılamaz).
 */
const KUR = async () => {
  const w = window;
  const url =
    performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .find((n) => /deps\/three\.js/.test(n)) || '/node_modules/three/build/three.module.js';
  const THREE = await import(/* @vite-ignore */ url);
  w.__R4 = { THREE, url, etiketler: new Map() };
  return { url, raycaster: typeof THREE.Raycaster === 'function' };
};

/**
 * HİZA DOĞRULAMASI — aracın kendisi önce çürütülür (İA dersi: ölçüm aracı, ölçtüğü şeyden
 * önce kendisi sınanır). Işın ızgarası ile piksel ızgarası AYNI noktayı göstermiyorsa bütün
 * §B düzlük tablosu sessizce yanlış olur: zemin kovasına duvarın pikselleri yazılır ve kimse
 * fark etmez. `readPixels` SOL-ALT başlar, NDC ise ÜST-SAĞ pozitiftir — bu çevirme yanlışsa
 * kare dikey olarak aynalanır ve sayı yine "makul" görünür.
 *
 * Sınama: arka plan SAF KIRMIZI yapılır. Bundan sonra ekranda kırmızı piksel ancak ve ancak
 * hiçbir şeye çarpmayan ışının yerinde olabilir. İki oran da %100 çıkmalı.
 */
const DOGRULA = (izgara) => {
  const { gl, scene, camera } = window.__three;
  const { THREE } = window.__R4;
  const eski = scene.background;
  // GENİŞ AÇI: kapalı salonun içinden bakarken hiç boşluk ışını olmayabilir ve sınamanın
  // yarısı 0/0 ile sessizce boşa döner. fov geçici olarak açılır — NDC→piksel matematiği
  // fov'dan bağımsızdır, yani sınamanın geçerliliği değişmez, ÖRNEKLEM büyür.
  const eskiFov = camera.fov;
  camera.fov = 110;
  camera.updateProjectionMatrix();
  scene.background = new THREE.Color(1, 0, 0);
  gl.render(scene, camera);
  const ctx = gl.getContext();
  const W = gl.domElement.width;
  const H = gl.domElement.height;
  const px = new Uint8Array(W * H * 4);
  ctx.readPixels(0, 0, W, H, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
  scene.background = eski;

  const rc = new THREE.Raycaster();
  let bos = 0;
  let bosKirmizi = 0;
  let dolu = 0;
  let doluKirmizi = 0;
  for (let j = 0; j < izgara; j++) {
    const ndcY = 1 - ((j + 0.5) / izgara) * 2;
    for (let i = 0; i < izgara; i++) {
      const ndcX = ((i + 0.5) / izgara) * 2 - 1;
      const pxX = Math.min(W - 1, Math.max(0, Math.round(((ndcX + 1) / 2) * W)));
      const pxY = Math.min(H - 1, Math.max(0, Math.round(((ndcY + 1) / 2) * H)));
      const o = (pxY * W + pxX) * 4;
      const kirmizi = px[o] > 200 && px[o + 1] < 60 && px[o + 2] < 60;
      rc.setFromCamera({ x: ndcX, y: ndcY }, camera);
      const hit = rc.intersectObjects(scene.children, true).find((h) => h.object.visible !== false);
      if (hit) {
        dolu++;
        if (kirmizi) doluKirmizi++;
      } else {
        bos++;
        if (kirmizi) bosKirmizi++;
      }
    }
  }
  camera.fov = eskiFov;
  camera.updateProjectionMatrix();
  gl.render(scene, camera);
  return { bos, bosKirmizi, dolu, doluKirmizi };
};

/** Bir karenin ölçümü — ışın ızgarası + aynı karenin gerçek pikselleri. */
const OLC = (izgara) => {
  const { gl, scene, camera } = window.__three;
  const { THREE, etiketler } = window.__R4;
  const rc = new THREE.Raycaster();

  // --- aynı kare: önce çiz, sonra oku (tampon ancak bu görev bitince silinir) ---
  gl.render(scene, camera);
  const ctx = gl.getContext();
  const W = gl.domElement.width;
  const H = gl.domElement.height;
  const px = new Uint8Array(W * H * 4);
  ctx.readPixels(0, 0, W, H, ctx.RGBA, ctx.UNSIGNED_BYTE, px);

  /**
   * Nesne etiketi — mekanik kural, isim tahmini yok.
   *
   * **INSTANCEDMESH AYRI ELE ALINIR ve bu ayrıntı ölçümü kurtarır.** Duvarlar tek bir
   * `InstancedMesh`tir: geometrisi BİRİM KUTU, rengi malzemede değil `instanceColor`da.
   * Gövdeyi `matrixWorld`den okumak duvarı 1,0 br'lik beyaz bir kutu gösteriyordu — kısa koşuda
   * karenin %15,3'ü "İÇERİK|#ffffff|BoxGeometry|1.0" kovasına düşmüştü, yani DUVAR payı sahte
   * biçimde %1,5 okunuyordu. Instans matrisi çarpılınca gövde de renk de gerçeğe döner.
   */
  const etiketle = (obj, instanceId) => {
    const instansli = obj.isInstancedMesh && instanceId !== undefined && instanceId !== null;
    const k = instansli ? `${obj.uuid}#${instanceId}` : obj.uuid;
    if (etiketler.has(k)) return etiketler.get(k);
    let boyut = [0, 0, 0];
    try {
      const g = obj.geometry;
      if (g) {
        if (!g.boundingBox) g.computeBoundingBox();
        const bb = g.boundingBox.clone();
        obj.updateWorldMatrix(true, false);
        if (instansli) {
          const im = new THREE.Matrix4();
          obj.getMatrixAt(instanceId, im);
          bb.applyMatrix4(im);
        }
        bb.applyMatrix4(obj.matrixWorld);
        boyut = [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z];
      }
    } catch {
      /* geometri yoksa 0 kalır */
    }
    const m = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    let renk = m && m.color ? '#' + m.color.getHexString() : '-';
    if (instansli && obj.instanceColor) {
      const c = new THREE.Color();
      obj.getColorAt(instanceId, c);
      renk = '#' + c.getHexString();
    }
    const adlar = [];
    for (let p = obj; p && adlar.length < 4; p = p.parent) if (p.name) adlar.push(p.name);
    const yatayEn = Math.max(boyut[0], boyut[2]);
    const yatayDar = Math.min(boyut[0], boyut[2]);
    const e = {
      renk,
      geom: (obj.isInstancedMesh ? 'I:' : '') + (obj.geometry ? obj.geometry.type : '-'),
      tip: obj.type,
      boyut,
      enBuyuk: Math.max(...boyut),
      yatayEn,
      yatayDar,
      ad: adlar.join('<') || '-',
      malzeme: m ? m.type : '-',
    };
    etiketler.set(k, e);
    return e;
  };

  const kovalar = new Map();
  const ekle = (ad, bilgi, lum, rgb) => {
    let b = kovalar.get(ad);
    if (!b) {
      b = { ad, n: 0, lumTop: 0, lumKareTop: 0, renkler: new Set(), ornek: bilgi, derinTop: 0 };
      kovalar.set(ad, b);
    }
    b.n++;
    b.lumTop += lum;
    b.lumKareTop += lum * lum;
    if (b.renkler.size < 4096) b.renkler.add(rgb);
    return b;
  };

  let isinSayisi = 0;
  let ufukAlti = 0;
  let ufukUstu = 0;
  const boslukSatir = new Array(izgara).fill(0);
  /**
   * BOŞLUĞUN YER KARŞILIĞI (§E) — ufuk altındaki boşluk ışını y = 0 düzlemini KESER.
   * O kesişim, zemin orada olsaydı çizileceği noktadır: yani "çevre kuşağı nereye, ne kadar
   * geniş konmalı" sorusunun cevabı tahmin değil koordinat olur. S6 sokağın (+z) görünmediğini
   * ölçmüştü; buradaki boşluk BAŞKA kenarlarda olabilir ve o zaman aynı gerekçe geçmez.
   */
  const yere = [];

  for (let j = 0; j < izgara; j++) {
    // NDC y: +1 üst. Hücre merkezleri.
    const ndcY = 1 - ((j + 0.5) / izgara) * 2;
    for (let i = 0; i < izgara; i++) {
      const ndcX = ((i + 0.5) / izgara) * 2 - 1;
      isinSayisi++;

      // aynı NDC'nin çizim tamponundaki pikseli (readPixels başlangıcı SOL-ALT)
      const pxX = Math.min(W - 1, Math.max(0, Math.round(((ndcX + 1) / 2) * W)));
      const pxY = Math.min(H - 1, Math.max(0, Math.round(((ndcY + 1) / 2) * H)));
      const o = (pxY * W + pxX) * 4;
      const r = px[o];
      const g2 = px[o + 1];
      const b2 = px[o + 2];
      const lum = 0.2126 * r + 0.7152 * g2 + 0.0722 * b2;
      const rgb = (r << 16) | (g2 << 8) | b2;

      rc.setFromCamera({ x: ndcX, y: ndcY }, camera);
      const hit = rc.intersectObjects(scene.children, true).find((h) => h.object.visible !== false);

      if (!hit) {
        const asagi = rc.ray.direction.y < 0;
        if (asagi) ufukAlti++;
        else ufukUstu++;
        boslukSatir[j]++;
        if (asagi) {
          const t = -rc.ray.origin.y / rc.ray.direction.y;
          if (t > 0 && t < 4000) yere.push([rc.ray.origin.x + rc.ray.direction.x * t, rc.ray.origin.z + rc.ray.direction.z * t]);
        }
        ekle(asagi ? 'BOSLUK-ufuk-alti' : 'BOSLUK-ufuk-ustu', { renk: '-', geom: '-', ad: '-', boyut: [0, 0, 0], enBuyuk: 0 }, lum, rgb);
        continue;
      }

      const e = etiketle(hit.object, hit.instanceId);
      const ny = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y : 0;
      const y = hit.point.y;
      const z = hit.point.z;
      /**
       * MEKANİK SINIF KURALI — yönelim + gövde ORANI. Tek eşik ("gövde ≥ 8 br = kabuk")
       * yetmiyordu: 2,2'lik ara duvar da duvardır, 7,5'lik banket minderi de değildir.
       * Kural artık BİÇİM soruyor: duvar = dik yüzeyli, boyu ≥ 2,0 ve YATAYDA İNCE bir levha.
       */
      const yatay = ny > 0.7;
      const dusey = Math.abs(ny) < 0.45;
      const duvarMi = dusey && e.boyut[1] >= 2.0 && e.yatayDar <= 0.6 && e.yatayEn >= 1.5;
      const zeminMi = yatay && y < 0.12 && e.yatayEn >= 3;
      const tavanMi = ny < -0.5 && y > 2.0 && e.yatayEn >= 3;
      const sinif = zeminMi ? (z > 17.5 ? 'SOKAK' : 'ZEMIN') : duvarMi ? 'DUVAR' : tavanMi ? 'TAVAN' : 'ICERIK';
      const b = ekle(`${sinif}|${e.renk}|${e.geom}|${e.enBuyuk.toFixed(1)}`, e, lum, rgb);
      b.derinTop += hit.distance;
    }
  }

  const liste = [...kovalar.values()]
    .map((b) => {
      const ort = b.lumTop / b.n;
      const varyans = Math.max(0, b.lumKareTop / b.n - ort * ort);
      return {
        ad: b.ad,
        pay: b.n / isinSayisi,
        n: b.n,
        lumOrt: ort,
        lumSapma: Math.sqrt(varyans),
        ayrikRenk: b.renkler.size,
        derinOrt: b.derinTop / b.n,
        ornek: b.ornek,
      };
    })
    .sort((a, b) => b.n - a.n);

  // kesik hattı: boşluğun ekranda en ALT satırı (0 = üst) — "zemin nerede bitiyor"
  let enAltBosluk = -1;
  for (let j = 0; j < izgara; j++) if (boslukSatir[j] > 0) enAltBosluk = j;

  // Kenar analizi: nokta zeminin (±17,6 kare) hangi tarafında ve kenardan ne kadar dışarıda?
  const YARI = 17.6;
  const kenar = { sol: 0, sag: 0, arka: 0, on: 0 };
  const mesafe = [];
  for (const [x, z] of yere) {
    const d = [-YARI - x, x - YARI, -YARI - z, z - YARI]; // sol, sağ, arka(−z), ön(+z) taşması
    const en = Math.max(...d);
    const hangi = ['sol', 'sag', 'arka', 'on'][d.indexOf(en)];
    if (en > 0) {
      kenar[hangi]++;
      mesafe.push(en);
    }
  }
  mesafe.sort((a, b) => a - b);
  const yuzdelik = (q) => (mesafe.length ? mesafe[Math.min(mesafe.length - 1, Math.floor(q * mesafe.length))] : 0);

  return {
    isin: isinSayisi,
    tampon: [W, H],
    yereN: yere.length,
    kenar,
    mesafeOrta: yuzdelik(0.5),
    mesafeP90: yuzdelik(0.9),
    mesafeEnUzak: mesafe.length ? mesafe[mesafe.length - 1] : 0,
    ufukAlti: ufukAlti / isinSayisi,
    ufukUstu: ufukUstu / isinSayisi,
    boslukSatir,
    enAltBoslukOran: enAltBosluk < 0 ? -1 : (enAltBosluk + 0.5) / izgara,
    liste,
  };
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const hatalar = [];

  yaz('='.repeat(114));
  yaz('R4 ÖLÇÜM — ÇEVRE SANATI (G-50): zemin · duvar · yan taraflar ekranda ne kadar yer tutuyor?');
  yaz('Bu dosya KARAR İÇERMEZ. Kollar `docs/cevre-raporu-r4.md` §Bulgular\'da; seçim kullanıcının.');
  yaz(`koşu kipi: ${TAM ? 'TAM' : 'KISA (araç doğrulama — rapora sayı GİRMEZ)'} · ızgara ${IZGARA}×${IZGARA} ışın/kare`);
  yaz('='.repeat(114));
  yaz();

  const tumKareler = [];

  for (const kadraj of KADRAJ) {
    for (const sen of SENARYO) {
      const p = await b.newPage({ viewport: { width: kadraj.w, height: kadraj.h }, deviceScaleFactor: 1 });
      p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message));
      p.on('console', (m) => {
        if (m.type() === 'error') hatalar.push('CONSOLE ' + m.text());
      });
      await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
      await p.waitForSelector('canvas', { timeout: 60000 });
      await p.waitForTimeout(3500);
      if (sen.pads.length) {
        await p.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), sen.pads);
        await p.waitForTimeout(1500);
        await p.evaluate(() => window.__setState({ tableLevels: new Array(24).fill(3), stationLevels: [5] }));
      }
      await p.evaluate(() => {
        document.body.classList.add('dsb-hide-hud');
        window.__devPlan({ topDown: false, gridStep: 0 });
      });
      await p.waitForTimeout(1200);

      const kur = await p.evaluate(KUR);
      yaz(`[kurulum] ${kadraj.ad}/${sen.durum} · three modülü: ${kur.url.replace(/^https?:\/\/[^/]+/, '')} · Raycaster: ${kur.raycaster ? 'VAR' : 'YOK'}`);
      if (!kur.raycaster) throw new Error('Raycaster bulunamadi — olcum gecersiz');
      await p.evaluate(([x, z]) => window.__teleport(x, z), sen.konumlar[0]);
      await p.waitForTimeout(2600);
      const dg = await p.evaluate(DOGRULA, Math.min(IZGARA, 40));
      const bosOran = dg.bos ? dg.bosKirmizi / dg.bos : 1;
      const doluOran = dg.dolu ? 1 - dg.doluKirmizi / dg.dolu : 1;
      yaz(
        `[hiza] ${kadraj.ad}/${sen.durum} · boşluk ışını kırmızı: ${(bosOran * 100).toFixed(1)}% (${dg.bosKirmizi}/${dg.bos})` +
          ` · dolu ışın kırmızı DEĞİL: ${(doluOran * 100).toFixed(1)}% (${dg.dolu - dg.doluKirmizi}/${dg.dolu})`,
      );
      if (dg.bos < 100) throw new Error(`HIZA SINAMASI ZAYIF — yalnizca ${dg.bos} bosluk isini, sinama bilgi tasimiyor`);
      if (bosOran < 0.98 || doluOran < 0.98) throw new Error('HIZA BOZUK — isin ile piksel ayni noktayi gostermiyor, olcum gecersiz');

      for (const [px2, pz] of sen.konumlar) {
        await p.evaluate(([x, z]) => window.__teleport(x, z), [px2, pz]);
        await p.waitForTimeout(2600);
        const r = await p.evaluate(OLC, IZGARA);
        r.kadraj = kadraj.ad;
        r.durum = sen.durum;
        r.konum = [px2, pz];
        tumKareler.push(r);
        await p.screenshot({ path: `${OUT}/r4-taban-${kadraj.ad}-${sen.durum}-${px2}_${pz}.png` });
      }
      await p.close();
    }
  }

  // =========================================================================================
  //  §A PİKSEL BÜTÇESİ — hangi yüzey karenin yüzde kaçı?
  // =========================================================================================
  const sinifiAl = (ad) => (ad.startsWith('BOSLUK') ? ad : ad.split('|')[0]);
  const SINIFLAR = ['ZEMIN', 'DUVAR', 'TAVAN', 'SOKAK', 'ICERIK', 'BOSLUK-ufuk-alti', 'BOSLUK-ufuk-ustu'];

  yaz();
  yaz('§A PİKSEL BÜTÇESİ — ışın ızgarası, kare başına yüzey payı');
  yaz('-'.repeat(114));
  yaz('kadraj  durum    konum        ' + SINIFLAR.map((s) => s.replace('BOSLUK-ufuk-', 'BOŞ-').padStart(9)).join(''));
  const sinifToplam = new Map();
  for (const r of tumKareler) {
    const pay = new Map();
    for (const k of r.liste) pay.set(sinifiAl(k.ad), (pay.get(sinifiAl(k.ad)) || 0) + k.pay);
    yaz(
      kadraj9(r.kadraj) +
        r.durum.padEnd(9) +
        `(${r.konum[0]},${r.konum[1]})`.padEnd(13) +
        SINIFLAR.map((s) => yz(pay.get(s) || 0).padStart(9)).join(''),
    );
    for (const s of SINIFLAR) {
      const o = sinifToplam.get(s) || { top: 0, n: 0, max: 0 };
      const v = pay.get(s) || 0;
      o.top += v;
      o.n++;
      o.max = Math.max(o.max, v);
      sinifToplam.set(s, o);
    }
  }
  yaz('-'.repeat(114));
  yaz(
    'ORTALAMA'.padEnd(31) +
      SINIFLAR.map((s) => yz(sinifToplam.get(s).top / sinifToplam.get(s).n).padStart(9)).join(''),
  );
  yaz(
    'EN YÜKSEK KARE'.padEnd(31) + SINIFLAR.map((s) => yz(sinifToplam.get(s).max).padStart(9)).join(''),
  );

  // =========================================================================================
  //  §B DÜZLÜK — "düz renk okunuyor" sayıya çevrilir
  // =========================================================================================
  yaz();
  yaz('§B DÜZLÜK — kova başına gerçek piksel istatistiği (aynı kareden okundu)');
  yaz('-'.repeat(114));
  yaz('Sapma = parlaklık standart sapması (0-255). DÜŞÜK sapma + AZ ayrık renk = gözün "düz yüzey"');
  yaz('dediği şey. Gölge ve ışık bile bir yüzeye değer dağılımı verir; 0\'a yakın sapma o yüzeyde');
  yaz('HİÇBİR bilgi olmadığı anlamına gelir.');
  yaz();
  const kovaTop = new Map();
  for (const r of tumKareler)
    for (const k of r.liste) {
      const o = kovaTop.get(k.ad) || { ad: k.ad, n: 0, payTop: 0, kare: 0, lum: 0, sapma: 0, renk: 0, ornek: k.ornek };
      o.n += k.n;
      o.payTop += k.pay;
      o.kare++;
      o.lum += k.lumOrt * k.n;
      o.sapma += k.lumSapma * k.n;
      o.renk = Math.max(o.renk, k.ayrikRenk);
      kovaTop.set(k.ad, o);
    }
  const sirali = [...kovaTop.values()].sort((a, b) => b.n - a.n).slice(0, 18);
  yaz('sınıf|renk|geometri|gövde        kare  ort.pay   parlak  sapma  ayrık   örnek ad');
  for (const o of sirali) {
    yaz(
      o.ad.padEnd(38).slice(0, 38) +
        String(o.kare).padStart(4) +
        yz(o.payTop / o.kare).padStart(9) +
        n1(o.lum / o.n) +
        n2(o.sapma / o.n) +
        String(o.renk).padStart(7) +
        '   ' +
        (o.ornek.ad || '-').slice(0, 22),
    );
  }

  // =========================================================================================
  //  §C KESİK HATTI — boşluk ekranın neresinde?
  // =========================================================================================
  yaz();
  yaz('§C KESİK HATTI — BOŞLUK ekranın neresinde bitiyor? (0,00 = kare üstü · 1,00 = kare altı)');
  yaz('-'.repeat(114));
  yaz('kadraj  durum    konum        boş toplam  ufuk altı  boşluğun EN ALT satırı   yorum');
  for (const r of tumKareler) {
    const bosToplam = r.ufukAlti + r.ufukUstu;
    yaz(
      kadraj9(r.kadraj) +
        r.durum.padEnd(9) +
        `(${r.konum[0]},${r.konum[1]})`.padEnd(13) +
        yz(bosToplam).padStart(10) +
        yz(r.ufukAlti).padStart(11) +
        (r.enAltBoslukOran < 0 ? '      —' : n2(r.enAltBoslukOran)).padStart(24) +
        '   ' +
        (r.ufukAlti > 0 ? 'UFUK ALTI BOŞLUK — zemin bitiyor, arkası arka plan' : bosToplam > 0 ? 'yalnız ufuk üstü — normal' : 'kare tamamen dolu'),
    );
  }

  // =========================================================================================
  //  §E BOŞLUĞUN YER KARŞILIĞI — çevre kuşağı hangi kenara, kaç birim?
  // =========================================================================================
  yaz();
  yaz('§E BOŞLUK NEREYE DÜŞÜYOR — ufuk altı boşluk ışınının y=0 düzlemindeki noktası');
  yaz('-'.repeat(114));
  yaz('Zemin karesi ±17,6. "Taşma" = o noktanın zemin kenarından DIŞARIDAKİ uzaklığı (dünya br).');
  yaz('S6 sokağın (ÖN, +z) görünmediğini ölçmüştü — bu tablo boşluğun HANGİ kenarda olduğunu söyler.');
  yaz();
  yaz('kadraj  durum    konum          n     sol     sağ    arka      ön   taşma ORTA    P90   EN UZAK');
  const kenarTop = { sol: 0, sag: 0, arka: 0, on: 0 };
  let enUzakGenel = 0;
  let p90Genel = 0;
  for (const r of tumKareler) {
    if (!r.yereN) continue;
    const t = r.kenar.sol + r.kenar.sag + r.kenar.arka + r.kenar.on || 1;
    for (const k of ['sol', 'sag', 'arka', 'on']) kenarTop[k] += r.kenar[k];
    enUzakGenel = Math.max(enUzakGenel, r.mesafeEnUzak);
    p90Genel = Math.max(p90Genel, r.mesafeP90);
    yaz(
      kadraj9(r.kadraj) +
        r.durum.padEnd(9) +
        `(${r.konum[0]},${r.konum[1]})`.padEnd(11) +
        String(r.yereN).padStart(5) +
        yz(r.kenar.sol / t).padStart(8) +
        yz(r.kenar.sag / t).padStart(8) +
        yz(r.kenar.arka / t).padStart(8) +
        yz(r.kenar.on / t).padStart(8) +
        n2(r.mesafeOrta).padStart(12) +
        n2(r.mesafeP90) +
        n2(r.mesafeEnUzak).padStart(10),
    );
  }
  const kt = kenarTop.sol + kenarTop.sag + kenarTop.arka + kenarTop.on || 1;
  yaz('-'.repeat(114));
  yaz(
    'TÜM KARELER (kenar dağılımı)'.padEnd(34) +
      yz(kenarTop.sol / kt).padStart(8) +
      yz(kenarTop.sag / kt).padStart(8) +
      yz(kenarTop.arka / kt).padStart(8) +
      yz(kenarTop.on / kt).padStart(8) +
      `        P90 ${p90Genel.toFixed(2)} · EN UZAK ${enUzakGenel.toFixed(2)}`,
  );
  yaz('>>> Bir çevre kuşağı boşluğu KAPATMAK için kenardan en az P90 kadar dışarı uzamalıdır.');

  yaz();
  yaz('§D ÇİZİM TAMPONU — okunan piksel boyutları (dpr tavanı uygulanmış hâli)');
  yaz('-'.repeat(114));
  for (const r of tumKareler)
    yaz(kadraj9(r.kadraj) + r.durum.padEnd(9) + `(${r.konum[0]},${r.konum[1]})`.padEnd(13) + `${r.tampon[0]}×${r.tampon[1]}  ışın ${r.isin}`);

  yaz();
  yaz(hatalar.length ? 'KONSOL/SAYFA HATASI:\n' + hatalar.join('\n') : 'konsol temiz — 0 hata');
  yaz();
  yaz(`KAPSAM DAMGASI: ${TAM ? 'TAM KOŞU' : 'KISA KOŞU — bu sayılar rapora GİRMEZ'} · ızgara ${IZGARA}×${IZGARA} · ${tumKareler.length} kare`);

  writeFileSync(`${KOK}/docs/olcum-cevre-r4${TAM ? '' : '-kisa'}.txt`, cikti.join('\n') + '\n', 'utf8');
  console.log(`\nyazıldı: docs/olcum-cevre-r4${TAM ? '' : '-kisa'}.txt`);
  await b.close();
} finally {
  sunucu.kill();
}

function kadraj9(s) {
  return s.padEnd(8);
}
