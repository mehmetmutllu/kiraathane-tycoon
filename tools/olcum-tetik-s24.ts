/**
 * olcum-tetik-s24.ts — S24 ÖLÇÜM: yükseltme tetiği "yanında" mı çalışıyor, "çerçeve içinde" mi?
 *
 * NE SORUYOR. Kullanıcı şunu söyledi: *"yanında falan değil, çerçeve içinde olayım."* Bugün
 * oyuncunun bir yükseltme noktasını doldurması TEK bir daire testine bağlı (`tick.ts`
 * `dist2D(player, spot) < TABLE_UP_RADIUS | PAD_RADIUS`). Ama ekranda daire ÇİZİLMİYOR —
 * çizilen şey köşe parantezli bir DİKDÖRTGEN (`GroundMarker`, yarı-ölçüleri `hw` × `hh`).
 * Yani ortada iki ayrı geometri var ve hiçbiri diğerinden türemiyor. S23'ün dersi tam buydu
 * (D-120: ok bloğu 0,340 yazılıyken çizilen 0,554'tü). Bu araç aynı soruyu tetik için sorar.
 *
 * TAKLİT YOK — ÇİZİLENDEN OKUR. Çerçeve ölçüsü kaynak dosyadan yeniden HESAPLANMAZ; gerçek
 * sahnedeki `isaret:*` düğümlerinin `userData.olcum`u ve köşe parantezlerinin dünya `Box3`
 * birleşimi okunur. İkisi karşılaştırılır (damga): "yazan hw" ile "çizilen hw" ayrışıyorsa
 * kusur S23'ün üçüncü nüshasıdır ve rapor bunu SAYIYLA söyler, cümleyle değil.
 *
 * DÖRT KOL (hiçbiri uygulanmaz; hepsi ölçülür — varyant kapısı, D-084):
 *   T   taban      — bugünkü daire (masa 1,0 · pad/servis/lavabo 1,3)
 *   A1  daire→tek  — TEK küresel yarıçap: tüm çerçevelerin içine sığan en büyüğü
 *   A2  daire→her  — işaret BAŞINA yarıçap = min(hw, hh) (kendi çerçevesine içten teğet)
 *   B   çerçeve    — çizilen dikdörtgenin KENDİSİ (tek doğru kaynağı)
 *
 * HER KOL İÇİN BEŞ SAYI:
 *   disari%   tetikleyen alanın çerçeve DIŞINDA kalan yüzdesi  → kullanıcının "yanında"sı
 *   olu%      çerçeve İÇİNDE tetiklemeyen alanın yüzdesi       → "içindeyim, olmuyor"
 *   erisim%   tetiğin oyuncunun fiziksel olarak GİREBİLDİĞİ kısmı (playerRadius + katılar)
 *   durakR    tetik∩erişilebilir bölgeye sığan en büyük dairenin yarıçapı → "duracak yer"
 *   cakisma   komşu işaretin tetiğiyle/çerçevesiyle örtüşen çift sayısı
 *
 * `erisim%` ve `durakR` kolun ÖLÜP ÖLMEDİĞİNİ söyler: tetik küçülünce çerçevenin içi masanın
 * katısıyla dolabilir ve oyuncu oraya hiç giremez. Daraltmanın bedeli budur ve tahminle değil
 * ızgarayla ölçülür.
 *
 * KOŞU KİPİ (D-084): `OLCUM=tam` ızgara 0,01 br ve TÜM salonlar açık; kısa koşu 0,02 br ve
 * yalnız ilk salon. Rapora yalnız tam koşu girer.
 *
 * Çalıştır:
 *   OLCUM=tam npx tsx tools/olcum-tetik-s24.ts > docs/olcum-tetik-s24.txt
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  LAVABO,
  LAYOUT,
  PAD_RADIUS,
  TABLE_UP_RADIUS,
  activeSolids,
  hitsSolid,
  servicePlace,
  type Solid,
} from '../src/game/layout.ts';
import { KIP, KISA, damga, damgaOzeti, kipBandi } from './olcum-lib.ts';
// @ts-expect-error — duman.mjs türsüz (tools/ tsc -b kapsamında değil).
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.TETIK_PORT ?? '', 10) || 5233;
/** Izgara adımı (br). Alan integralleri bunun karesiyle toplanır. */
const HUCRE = KISA ? 0.02 : 0.01;

type Kutu = { hw: number; hh: number };
type Isaret = {
  ad: string;
  kind: 'pad' | 'servis' | 'masa' | 'lavabo' | 'bilinmiyor';
  x: number;
  z: number;
  r: number;
  /** `userData.olcum`un YAZDIĞI yarı-ölçüler. */
  yazan: Kutu;
  /** Köşe parantezlerinin dünya kutusundan ÖLÇÜLEN yarı-ölçüler (grup ölçeğine bölünmüş). */
  cizilen: Kutu | null;
  olcek: number;
  tabanR: number;
};

// =============================================================================================
//  1) SAHNEDEN OKU — çizilen çerçeveler
// =============================================================================================

/**
 * Oyunu işaretlerin ÇİZİLDİĞİ hâle getirir.
 *
 * Yükseltme işaretleri KAPILI: servis noktası `table2`, masa noktaları `table4` pad'ini ister
 * (`economy.config.ts` upgradeRequires) — açılış hâlinde ekranda tek bir çerçeve yoktur.
 * Pad işaretlerinin de çizilmesi için AÇILMAMIŞ pad bırakılır: bu yüzden zincirin sonundaki
 * masa pad'leri bilerek `padsDone` dışında kalır.
 */
function hazirlikKodu(tamKosu: boolean): string {
  const acilacak = tamKosu
    ? ['table2', 'table3', 'waiter', 'table4', 'zone2', 'z2table2', 'z2table3', 'dishwasher',
       'z2table4', 'zone3', 'z3table2', 'waiter2', 'z3table3', 'z3table4', 'lavabo']
    : ['table2', 'table3', 'waiter', 'table4'];
  return `(() => {
    const pads = new Set(${JSON.stringify(acilacak)});
    const seviyeler = Array.from({ length: 20 }, () => 1);
    // \`tables\`/\`areasOpen\` padsDone'dan YALNIZ YÜKLEMEDE türer (D-015); \`__setState\` onları
    // yeniden hesaplamaz. İlk koşuda bu yüzden sahne 4 masa işareti çizerken \`__game().tables\`
    // 1 döndü ve sınıflandırma üç işareti "bilinmiyor" saydı — açıkça yazılıyor.
    window.__setState({
      padsDone: [...pads], tableLevels: seviyeler,
      tables: ${tamKosu ? 12 : 4}, areasOpen: ${tamKosu ? 3 : 1},
      wallet: 5000000, diamonds: 500, stationLevels: [1, 0, 0],
    });
    const g = window.__game();
    return { tables: g.tables, areasOpen: g.areasOpen, padsDone: [...pads] };
  })()`;
}

/**
 * `isaret:*` düğümlerini gezer. Çerçeve İKİ AYRI kaynaktan okunur:
 *   yazan   — `userData.olcum` (bileşenin kendi hesabı)
 *   cizilen — `parantez0..3` mesh'lerinin dünya kutusu birleşimi, grup ölçeğine bölünmüş
 * İkisi ayrışırsa kusur ölçüde değil, iki ayrı doğrudadır (S23 deseni).
 */
const SAHNE_KODU = `(() => {
  const t = window.__three;
  if (!t) return { hata: '__three yok (DEV değil)' };
  // "Konuşan" katman uzaktayken görünmez; parantezler görünür olsa da ölçüm için hepsi açılır.
  const gizliler = [];
  t.scene.traverse((n) => {
    if (n.name && n.name.startsWith('parantez')) {
      let p = n.parent;
      while (p) { if (p.visible === false) { gizliler.push(p); p.visible = true; } p = p.parent; }
    }
  });
  t.scene.updateMatrixWorld(true);

  const THREE = t.scene.constructor;
  const satirlar = [];
  t.scene.traverse((kok) => {
    if (!kok.name || !kok.name.startsWith('isaret:')) return;
    const o = kok.userData && kok.userData.olcum;
    if (!o) return;
    const parantez = [];
    let olcek = 1;
    kok.traverse((n) => {
      if (n.name === 'isaret-olcek') olcek = n.scale.x;
      if (n.name && n.name.startsWith('parantez')) parantez.push(n);
    });
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const m of parantez) {
      m.updateWorldMatrix(true, false);
      const g = m.geometry;
      if (!g || !g.attributes || !g.attributes.position) continue;
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const v = { x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) };
        const vv = m.localToWorld(new (Object.getPrototypeOf(m.position).constructor)(v.x, v.y, v.z));
        minX = Math.min(minX, vv.x); maxX = Math.max(maxX, vv.x);
        minZ = Math.min(minZ, vv.z); maxZ = Math.max(maxZ, vv.z);
      }
    }
    const var_ = Number.isFinite(minX);
    satirlar.push({
      ad: o.label,
      x: +kok.position.x.toFixed(5),
      z: +kok.position.z.toFixed(5),
      r: o.r,
      yazanHw: o.hw, yazanHh: o.hh, arrow: !!o.arrow,
      olcek: +olcek.toFixed(5),
      parantezSayisi: parantez.length,
      cizilenHw: var_ ? +(((maxX - minX) / 2) / olcek).toFixed(5) : null,
      cizilenHh: var_ ? +(((maxZ - minZ) / 2) / olcek).toFixed(5) : null,
    });
  });
  for (const p of gizliler) p.visible = false;
  void THREE;
  return { isaret: satirlar.length, satirlar };
})()`;

// =============================================================================================
//  2) IZGARA — erişilebilirlik ve alan integralleri
// =============================================================================================

/** Oyuncunun merkezi buraya GİREBİLİR mi? (tick ile aynı kural: activeSolids + playerRadius) */
const erisilir = (x: number, z: number, katilar: Solid[]) =>
  !hitsSolid(x, z, katilar, LAYOUT.playerRadius);

type Izgara = {
  n: number;
  x0: number;
  z0: number;
  /** erisim[i] = o hücrenin merkezine oyuncu girebilir mi */
  erisim: Uint8Array;
  yari: number;
};

/** İşaretin çevresinde, en geniş kolu da kapsayan kare ızgara; erişim bir kez hesaplanır. */
function izgaraKur(m: Isaret, enGenisYari: number, katilar: Solid[]): Izgara {
  const yari = enGenisYari + 2 * HUCRE;
  const n = Math.ceil((2 * yari) / HUCRE);
  const x0 = m.x - yari + HUCRE / 2;
  const z0 = m.z - yari + HUCRE / 2;
  const erisim = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) {
    const z = z0 + j * HUCRE;
    for (let i = 0; i < n; i++) {
      erisim[j * n + i] = erisilir(x0 + i * HUCRE, z, katilar) ? 1 : 0;
    }
  }
  return { n, x0, z0, erisim, yari };
}

type KolSonuc = {
  tetikAlan: number;
  cerceveAlan: number;
  disariPay: number;
  oluPay: number;
  erisimPay: number;
  durakR: number;
  tetikErisilirAlan: number;
};

/**
 * Bir kolun beş sayısı. `tetikIci` kolun test fonksiyonudur (daire ya da dikdörtgen); çerçeve
 * HER ZAMAN çizilen dikdörtgendir — kollar tetiği değiştirir, çizileni değil.
 */
function kolOlc(m: Isaret, iz: Izgara, tetikIci: (dx: number, dz: number) => boolean, cerceve: Kutu): KolSonuc {
  const { n, x0, z0, erisim } = iz;
  const hucreAlan = HUCRE * HUCRE;
  let tetik = 0, cer = 0, disari = 0, olu = 0, tetikEris = 0;
  // Durak yarıçapı için: tetik∩erişilebilir maskesi + chamfer mesafe dönüşümü.
  const maske = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) {
    const dz = z0 + j * HUCRE - m.z;
    for (let i = 0; i < n; i++) {
      const dx = x0 + i * HUCRE - m.x;
      const iT = tetikIci(dx, dz);
      const iC = Math.abs(dx) <= cerceve.hw && Math.abs(dz) <= cerceve.hh;
      if (iT) tetik++;
      if (iC) cer++;
      if (iT && !iC) disari++;
      if (iC && !iT) olu++;
      const e = erisim[j * n + i] === 1;
      if (iT && e) { tetikEris++; maske[j * n + i] = 1; }
    }
  }
  return {
    tetikAlan: tetik * hucreAlan,
    cerceveAlan: cer * hucreAlan,
    disariPay: tetik ? disari / tetik : 0,
    oluPay: cer ? olu / cer : 0,
    erisimPay: tetik ? tetikEris / tetik : 0,
    tetikErisilirAlan: tetikEris * hucreAlan,
    durakR: enBuyukDaire(maske, n),
  };
}

/**
 * Maskeye sığan en büyük dairenin yarıçapı — iki geçişli chamfer mesafe dönüşümü (3-4 çekirdeği,
 * /3 ölçekli). Öklid'e göre ~%2 hata payı var; kararı bu hata payı çevirecek kadar yakın bir
 * sayı çıkarsa rapor onu ayrıca söyler.
 */
function enBuyukDaire(maske: Uint8Array, n: number): number {
  const BUYUK = 1e9;
  const d = new Float64Array(n * n);
  for (let k = 0; k < n * n; k++) d[k] = maske[k] ? BUYUK : 0;
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= n || j >= n ? 0 : d[j * n + i]);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      if (!maske[j * n + i]) continue;
      d[j * n + i] = Math.min(
        d[j * n + i],
        at(i - 1, j) + 3, at(i, j - 1) + 3,
        at(i - 1, j - 1) + 4, at(i + 1, j - 1) + 4,
      );
    }
  }
  for (let j = n - 1; j >= 0; j--) {
    for (let i = n - 1; i >= 0; i--) {
      if (!maske[j * n + i]) continue;
      d[j * n + i] = Math.min(
        d[j * n + i],
        at(i + 1, j) + 3, at(i, j + 1) + 3,
        at(i + 1, j + 1) + 4, at(i - 1, j + 1) + 4,
      );
    }
  }
  let en = 0;
  for (let k = 0; k < n * n; k++) if (d[k] < BUYUK && d[k] > en) en = d[k];
  return (en / 3) * HUCRE;
}

// =============================================================================================
//  KOŞU
// =============================================================================================
kipBandi();

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ viewport: { width: 1280, height: 800 } });
const konsolHata: string[] = [];
sayfa.on('console', (m) => { if (m.type() === 'error') konsolHata.push(m.text().slice(0, 160)); });
await sayfa.goto(adres(PORT), { waitUntil: 'domcontentloaded' });
await sayfa.waitForSelector('canvas', { timeout: 20000 });
await sayfa.waitForFunction(() => typeof (window as never as { __game?: unknown }).__game === 'function', { timeout: 20000 });
// `__three` perf örneklemesinin İÇİNDE yazılıyor (saniyede bir) — canvas hazır olması yetmez.
await sayfa.waitForFunction(() => (window as never as { __three?: unknown }).__three != null, { timeout: 20000 });

const dunya = (await sayfa.evaluate(hazirlikKodu(!KISA))) as { tables: number; areasOpen: number; padsDone: string[] };

/**
 * İŞARETLER GECİKMELİ ÇİZİLİYOR — ve bu sabit bir bekleme ile değil KOŞULLA karşılanır.
 *
 * İlk tam koşu `0 işaret` döndü, kısa koşu 5 bulmuştu. Ölçüldü: zengin dünya taze durumdan
 * kurulunca işaretler **~2,5 sn** sonra sahneye giriyor (alan açılış sırası); 1,2 sn beklemek
 * tam koşuda yetmiyor, kısa koşuda tesadüfen yetiyordu. Sabit süre yazmak bu tuzağı yalnız
 * erteler — araç artık sayının KENDİSİNİ bekliyor, sonra iki örnekle KARARLI olduğunu doğruluyor.
 */
const BEKLENEN = KISA ? 5 : 10;
await sayfa.waitForFunction((n) => {
  const t = (window as never as { __three?: { scene: { traverse: (f: (o: { name?: string }) => void) => void } } }).__three;
  if (!t) return false;
  let k = 0;
  t.scene.traverse((o) => { if (o.name?.startsWith('isaret:')) k++; });
  return k >= n;
}, BEKLENEN, { timeout: 30000 });
const say = async () => sayfa.evaluate(() => {
  const t = (window as never as { __three: { scene: { traverse: (f: (o: { name?: string }) => void) => void } } }).__three;
  let k = 0;
  t.scene.traverse((o) => { if (o.name?.startsWith('isaret:')) k++; });
  return k;
});
const say1 = await say();
await sayfa.waitForTimeout(900);
const say2 = await say();
damga('isaret sayisi kararli', say1 === say2, `${say1} → ${say2}`);
const sahne = (await sayfa.evaluate(SAHNE_KODU)) as
  | { hata: string }
  | { isaret: number; satirlar: Array<Record<string, number | string | boolean | null>> };

await tarayici.close();
sunucu.kill();

if ('hata' in sahne) { console.error(sahne.hata); process.exit(1); }

// --- İşaretleri sınıflandır: tetik yarıçapı KONUMDAN çözülür (tick.ts da öyle yapıyor).
const servisUp = servicePlace(dunya.areasOpen).upgradeSpot;
const yakin = (a: readonly number[], x: number, z: number) => Math.hypot(a[0] - x, a[2] - z) < 0.06;

const isaretler: Isaret[] = sahne.satirlar.map((s) => {
  const x = s.x as number;
  const z = s.z as number;
  let kind: Isaret['kind'] = 'bilinmiyor';
  let tabanR = PAD_RADIUS;
  if (yakin(servisUp, x, z)) kind = 'servis';
  else if (yakin(LAVABO.spot, x, z)) kind = 'lavabo';
  else if (Object.values(LAYOUT.padPos).some((p) => yakin(p, x, z))) kind = 'pad';
  // Sınıflandırma TÜM masalara bakar, `dunya.tables`a DEĞİL: kaç masa açık olduğu tetik
  // yarıçapını değiştirmez, yalnız işaretin çizilip çizilmediğini belirler.
  else if (LAYOUT.tables.some((t) => yakin(t.upgradeSpot, x, z))) {
    kind = 'masa';
    tabanR = TABLE_UP_RADIUS;
  }
  return {
    ad: String(s.ad),
    kind, x, z,
    r: s.r as number,
    yazan: { hw: s.yazanHw as number, hh: s.yazanHh as number },
    cizilen: s.cizilenHw == null ? null : { hw: s.cizilenHw as number, hh: s.cizilenHh as number },
    olcek: s.olcek as number,
    tabanR,
  };
});

const katilar = activeSolids(dunya.tables, dunya.areasOpen);

// --- DAMGALAR: araç gerçekten ölçüyor mu?
damga('isaret bulundu', isaretler.length >= (KISA ? 5 : 10), `${isaretler.length} isaret`);
damga('konsol hatasiz', konsolHata.length === 0, konsolHata.slice(0, 2).join(' | '));
damga(
  'sinif cozuldu',
  isaretler.every((m) => m.kind !== 'bilinmiyor'),
  isaretler.filter((m) => m.kind === 'bilinmiyor').map((m) => m.ad).join(','),
);
damga('parantez okundu', isaretler.every((m) => m.cizilen != null), 'bazi isarette parantez yok');

// --- §1 İKİ AYRI DOĞRU: yazan hw/hh ile çizilen hw/hh aynı mı?
const sapmalar = isaretler
  .filter((m) => m.cizilen)
  .map((m) => ({
    ad: m.ad, r: m.r,
    yazanHw: m.yazan.hw, cizilenHw: m.cizilen!.hw,
    yazanHh: m.yazan.hh, cizilenHh: m.cizilen!.hh,
    sapmaHw: m.cizilen!.hw - m.yazan.hw,
    sapmaHh: m.cizilen!.hh - m.yazan.hh,
  }));
const enBuyukSapma = Math.max(0, ...sapmalar.map((s) => Math.max(Math.abs(s.sapmaHw), Math.abs(s.sapmaHh))));

/** Ölçümün tabanı ÇİZİLEN çerçevedir (varsa) — "yazan"a değil, göze görünene bakılır. */
const cerceveOf = (m: Isaret): Kutu => m.cizilen ?? m.yazan;

// --- KOLLAR
const A1_R = Math.min(...isaretler.map((m) => Math.min(cerceveOf(m).hw, cerceveOf(m).hh)));

type Kol = { ad: string; aciklama: string; tetik: (m: Isaret) => (dx: number, dz: number) => boolean; menzil: (m: Isaret) => number };
const KOLLAR: Kol[] = [
  {
    ad: 'T', aciklama: 'taban — bugunku daire (masa 1,0 · pad 1,3)',
    tetik: (m) => (dx, dz) => dx * dx + dz * dz < m.tabanR * m.tabanR,
    menzil: (m) => m.tabanR,
  },
  {
    ad: 'A1', aciklama: `daire→tek kuresel yaricap (${A1_R.toFixed(3).replace('.', ',')} br)`,
    tetik: () => (dx, dz) => dx * dx + dz * dz < A1_R * A1_R,
    menzil: () => A1_R,
  },
  {
    ad: 'A2', aciklama: 'daire→isaret basina min(hw,hh)',
    tetik: (m) => { const r = Math.min(cerceveOf(m).hw, cerceveOf(m).hh); return (dx, dz) => dx * dx + dz * dz < r * r; },
    menzil: (m) => Math.min(cerceveOf(m).hw, cerceveOf(m).hh),
  },
  {
    /**
     * ADAY DEĞİL — ÖLÇÜLEN ÜÇÜNCÜ GEOMETRİ. `GroundMarker` oyuncuyu "işaretin üstünde" sayınca
     * çerçeveyi 1,12 kat kabartıyor ve bu "üstünde" testi kendi dairesini kullanıyor
     * (`hw * UZERINDE_PAYI`, bugün 1,35). Yani ekranda oyuncuya "buradasın" diyen sınır ile
     * parayı akıtan sınır da birbirinden ayrı. Kararın kapsamı buna bağlı: çerçeveye geçilirse
     * kabarma da çerçeveden türemeli, yoksa kusur biçim değiştirip kalır.
     */
    ad: 'G', aciklama: 'GÖRSEL "üstündesin" kabarması (hw × 1,35) — aday DEĞİL',
    tetik: (m) => { const r = cerceveOf(m).hw * 1.35; return (dx, dz) => dx * dx + dz * dz < r * r; },
    menzil: (m) => cerceveOf(m).hw * 1.35,
  },
  {
    ad: 'B', aciklama: 'CERCEVE — cizilen dikdortgenin kendisi',
    tetik: (m) => { const c = cerceveOf(m); return (dx, dz) => Math.abs(dx) <= c.hw && Math.abs(dz) <= c.hh; },
    menzil: (m) => Math.hypot(cerceveOf(m).hw, cerceveOf(m).hh),
  },
];

const enGenis = Math.max(...isaretler.flatMap((m) => KOLLAR.map((k) => k.menzil(m))));
const sonuc: Record<string, KolSonuc[]> = {};
for (const k of KOLLAR) sonuc[k.ad] = [];
for (const m of isaretler) {
  const iz = izgaraKur(m, enGenis, katilar);
  for (const k of KOLLAR) sonuc[k.ad].push(kolOlc(m, iz, k.tetik(m), cerceveOf(m)));
}

// --- ÇAKIŞMA: iki işaretin tetiği (ya da biri diğerinin çerçevesi) örtüşüyor mu?
function cakisma(kol: Kol): { tetikCift: number; cerceveCift: number; enYakin: number } {
  let tetikCift = 0, cerceveCift = 0, enYakin = Infinity;
  for (let i = 0; i < isaretler.length; i++) {
    for (let j = i + 1; j < isaretler.length; j++) {
      const a = isaretler[i], b = isaretler[j];
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      enYakin = Math.min(enYakin, d);
      if (kol.ad === 'B') {
        const ca = cerceveOf(a), cb = cerceveOf(b);
        if (Math.abs(a.x - b.x) < ca.hw + cb.hw && Math.abs(a.z - b.z) < ca.hh + cb.hh) tetikCift++;
      } else if (d < kol.menzil(a) + kol.menzil(b)) tetikCift++;
      // Tetik, KOMŞUNUN çizili çerçevesine giriyor mu? (oyuncu B'nin karesinde durup A'yı dolduruyor)
      const cb2 = cerceveOf(b), ca2 = cerceveOf(a);
      const ra = kol.ad === 'B' ? 0 : kol.menzil(a);
      const rb = kol.ad === 'B' ? 0 : kol.menzil(b);
      if (ra > 0 && Math.abs(a.x - b.x) < ra + cb2.hw && Math.abs(a.z - b.z) < ra + cb2.hh) cerceveCift++;
      else if (rb > 0 && Math.abs(a.x - b.x) < rb + ca2.hw && Math.abs(a.z - b.z) < rb + ca2.hh) cerceveCift++;
    }
  }
  return { tetikCift, cerceveCift, enYakin };
}

// =============================================================================================
//  RAPOR (stdout)
// =============================================================================================
const f = (x: number, k = 3) => x.toFixed(k).replace('.', ',');
const p = (x: number) => `%${(100 * x).toFixed(1).replace('.', ',')}`;
const ortala = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

console.log('='.repeat(94));
console.log('S24 ÖLÇÜM — YÜKSELTME TETİĞİ: DAİRE mi ÇERÇEVE mi');
console.log(`damga: ${new Date().toISOString()} · kip: ${KIP} · ızgara: ${f(HUCRE)} br`);
console.log(`dünya: ${dunya.tables} masa · ${dunya.areasOpen} salon · ${katilar.length} katı · ${isaretler.length} işaret`);
console.log('='.repeat(94));

console.log('\n§1 — ÇİZİLEN ÇERÇEVE, YAZAN ÇERÇEVEYLE AYNI MI? (S23 deseninin sınavı)');
console.log('  işaret                r      yazan hw   çizilen hw   sapma      yazan hh   çizilen hh   sapma');
for (const s of sapmalar) {
  console.log(
    `  ${s.ad.padEnd(20)} ${f(s.r, 2).padStart(5)}  ${f(s.yazanHw, 4).padStart(9)} ${f(s.cizilenHw, 4).padStart(12)} ${f(s.sapmaHw, 4).padStart(9)}  ${f(s.yazanHh, 4).padStart(9)} ${f(s.cizilenHh, 4).padStart(12)} ${f(s.sapmaHh, 4).padStart(9)}`,
  );
}
console.log(`  → en büyük sapma: ${f(enBuyukSapma, 4)} br`);

console.log('\n§2 — KOL BAŞINA ÖZET (tüm işaretlerin ortalaması)');
console.log('  kol  açıklama                                    disarı%   ölü%   erişim%  durakR   tetikAlan');
for (const k of KOLLAR) {
  const rs = sonuc[k.ad];
  console.log(
    `  ${k.ad.padEnd(4)} ${k.aciklama.padEnd(42)} ${p(ortala(rs.map((r) => r.disariPay))).padStart(7)} ${p(ortala(rs.map((r) => r.oluPay))).padStart(7)} ${p(ortala(rs.map((r) => r.erisimPay))).padStart(8)} ${f(ortala(rs.map((r) => r.durakR))).padStart(7)} ${f(ortala(rs.map((r) => r.tetikAlan))).padStart(9)}`,
  );
}

console.log('\n§3 — İŞARET BAŞINA (disarı% · ölü% · erişim% · durakR)');
const baslik = KOLLAR.map((k) => k.ad.padStart(28)).join('');
console.log(`  ${'işaret'.padEnd(20)}${'kind'.padEnd(9)}${baslik}`);
isaretler.forEach((m, i) => {
  const hucreler = KOLLAR.map((k) => {
    const r = sonuc[k.ad][i];
    return `${p(r.disariPay)}/${p(r.oluPay)}/${p(r.erisimPay)}/${f(r.durakR, 2)}`.padStart(28);
  }).join('');
  console.log(`  ${m.ad.padEnd(20)}${m.kind.padEnd(9)}${hucreler}`);
});

console.log('\n§4 — ÇAKIŞMA VE ERİŞİM RİSKİ');
console.log('  kol  tetik↔tetik çifti   tetik↔komşu çerçevesi   erişimi 0 olan işaret   durakR < 0,10 olan');
for (const k of KOLLAR) {
  const c = cakisma(k);
  const rs = sonuc[k.ad];
  const olu = rs.filter((r) => r.erisimPay <= 0.0001).length;
  const dar = rs.filter((r) => r.durakR < 0.1).length;
  console.log(`  ${k.ad.padEnd(4)} ${String(c.tetikCift).padStart(17)} ${String(c.cerceveCift).padStart(23)} ${String(olu).padStart(22)} ${String(dar).padStart(18)}`);
}
console.log(`  (en yakın iki işaret arası: ${f(cakisma(KOLLAR[0]).enYakin)} br)`);

console.log('\n§5 — MENZİL: tetik merkeze göre nereye kadar uzanıyor (br)');
console.log('  kol  eksende(x)  eksende(z)   köşede    çerçeve hw/hh (ort)');
for (const k of KOLLAR) {
  const ex = ortala(isaretler.map((m) => (k.ad === 'B' ? cerceveOf(m).hw : k.menzil(m))));
  const ez = ortala(isaretler.map((m) => (k.ad === 'B' ? cerceveOf(m).hh : k.menzil(m))));
  const kose = ortala(isaretler.map((m) => (k.ad === 'B' ? Math.hypot(cerceveOf(m).hw, cerceveOf(m).hh) : k.menzil(m))));
  console.log(`  ${k.ad.padEnd(4)} ${f(ex).padStart(10)} ${f(ez).padStart(11)} ${f(kose).padStart(9)}    ${f(ortala(isaretler.map((m) => cerceveOf(m).hw)))} / ${f(ortala(isaretler.map((m) => cerceveOf(m).hh)))}`);
}

const json = {
  damga: new Date().toISOString(), kip: KIP, hucre: HUCRE,
  dunya, A1_R, enBuyukSapma, konsolHata,
  isaretler: isaretler.map((m, i) => ({
    ...m, cerceve: cerceveOf(m),
    kollar: Object.fromEntries(KOLLAR.map((k) => [k.ad, sonuc[k.ad][i]])),
  })),
  cakisma: Object.fromEntries(KOLLAR.map((k) => [k.ad, cakisma(k)])),
};
mkdirSync(path.join(KOK, 'docs'), { recursive: true });
writeFileSync(path.join(KOK, 'docs', 'olcum-tetik-s24.json'), JSON.stringify(json, null, 2));
console.log('\nham: docs/olcum-tetik-s24.json');

damgaOzeti();
