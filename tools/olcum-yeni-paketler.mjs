/**
 * olcum-yeni-paketler.mjs — S13: altı yeni KayKit paketinin REPO BEDELİNİ ölçer.
 *
 * NEDEN: "ücretsiz olduğu sürece her asseti çek" kararı indirmeyi serbest bırakır, repoyu değil.
 * Paketler `public/assets/models/`e girince APK'ya da girer; "hepsini al" ile "yalnız gerekeni al"
 * arasındaki fark bir SAYI olmadan tartışılamaz. Bu araç o sayıyı üretir:
 *   - paket başına model adedi, gltf hattı KB, atlas KB
 *   - eşleşen ALT KÜME (aşağıdaki GEREKEN listesi) adedi ve KB'ı
 *   - toplam: bugünkü models/ ağırlığı → her kolun ağırlığı
 *
 * Çıktı: ekrana özet tablo. Ham dosya (`docs/olcum-yeni-paketler.json`) KARAR ÖNCESİ durumun
 * damgası olduğu için ancak `OLCUM_YAZ=1` verilince üzerine yazılır — budama sonrası bir koşu
 * onu sessizce silmesin.
 * Kullanım: node tools/olcum-yeni-paketler.mjs   ·   OLCUM_YAZ=1 node tools/olcum-yeni-paketler.mjs
 *
 * Bu dosya aynı zamanda KARAR TABLOSUNU dışa verir (GEREKEN · TAM_ALINAN · REDDEDILEN) ve
 * `tests/yeni-paketler.test.ts` onu içe aktarır; o yüzden ölçüm gövdesi yalnız DOĞRUDAN
 * çalıştırıldığında koşar (import ederken yan etki yok).
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = 'public/assets/models';

// Alt kümeler — her satır bir AÇIK KALEME karşılık gelir (docs/asset-secim-panosu.html §1-2,
// activeContext açık kalemler). Desen: tam ad ya da `*` ile biten önek.
//
// KARAR D-111 (2026-09-14): kol B — repoya yalnız bu desenlere uyan modeller girdi.
// TEK İSTİSNA board-game-bits: kullanıcı onu TAM aldı, gerekçesi Kat 2 — okey/tavla masası
// açılırken hangi taş/jeton/zar lazım olacağı bugün belli değil (`tamAlinan`).
// Bu tablo hem ölçümün hem `tests/yeni-paketler.test.ts` bekçisinin kaynağıdır; buradan
// silinen bir desen o modelin repoda durmasını bekçide KIRMIZI yapar.
export const TAM_ALINAN = ['kaykit-board-game-bits'];
export const REDDEDILEN = ['kaykit-block-bits']; // voxel küpü — mekân hacmi için parça değil

/**
 * F2'de (D-125) DEPODAN ÇIKARILAN paketler. Reddedilmiş değiller — S13'te bilerek alındılar,
 * ama ölçüm hiçbir kod yolunun onlara ULAŞAMADIĞINI gösterdi (11,2 MB, model yükünün %48,5'i)
 * ve Kat 2 v1 kapsamı dışında. Git geçmişinde duruyorlar; geri getirilirse entegrasyonu da
 * aynı turda yapılmalı (`tests/asset-olu-yuk.test.ts` kodda karşılığı olmayan paketi geçirmez).
 */
// T7 (D-141): prototype-bits'in tek işi WC kabin kapısıydı; kabin elle çizime geçti, paket söküldü.
export const CIKARILAN = ['kaykit-board-game-bits', 'kaykit-resource-bits', 'kaykit-holiday-bits', 'kaykit-forest-nature', 'kaykit-prototype-bits'];
export const GEREKEN = {
  'kaykit-board-game-bits': {
    gerekce: 'okey/tavla masası (Kat 2 kimliği)',
    desen: ['playerstand', 'playerstand_*', 'domino_tile_*', 'D6_A', 'D6_B', 'tile_blue', 'tile_red', 'container_A'],
  },
  'kaykit-forest-nature': {
    gerekce: 'saksı bitkisi + dış yeşil',
    desen: ['Bush_1_*', 'Bush_2_*', 'Bush_4_*', 'Grass_1_A_Color1', 'Grass_1_B_Color1', 'Grass_2_A_Color1', 'Tree_1_*', 'Tree_2_*', 'Rock_1_A_Color1', 'Rock_1_B_Color1', 'Rock_1_C_Color1'],
  },
  'kaykit-holiday-bits': {
    gerekce: 'koltuk/tabure/halı/fener/tabak — renk varyantlı',
    desen: ['chair_large_*', 'footstool_*', 'stool', 'carpet_round_*', 'lantern', 'lantern_mini', 'plate_*'],
  },
  'kaykit-resource-bits': {
    gerekce: 'depo stoğu + kilitli obje "tadilat hâli"',
    desen: ['Wood_Planks_Stack_*', 'Wood_Plank_*', 'Wood_Log_*', 'Pallet_Wood*', 'Stone_Bricks_Stack_*', 'Textiles_*'],
  },
  'kaykit-prototype-bits': {
    gerekce: 'itme barsız kapı (door_A açık kalemi)',
    desen: ['Door_A', 'Door_A_Decorated', 'Door_B'],
  },
  'kaykit-block-bits': { gerekce: '— (eşleşme bulunamadı)', desen: [] },
};

const kb = (b) => Math.round(b / 1024);
export const esles = (ad, desenler) =>
  desenler.some((d) => (d.endsWith('*') ? ad.startsWith(d.slice(0, -1)) : ad === d));

function paketOlc(paket) {
  const dizin = path.join(KOK, paket);
  const dosyalar = readdirSync(dizin);
  const modeller = dosyalar.filter((f) => f.endsWith('.gltf')).map((f) => f.replace(/\.gltf$/, ''));
  const boy = (f) => statSync(path.join(dizin, f)).size;
  const atlas = dosyalar.filter((f) => f.endsWith('_texture.png')).reduce((s, f) => s + boy(f), 0);
  const tum = dosyalar.reduce((s, f) => s + boy(f), 0);

  const g = GEREKEN[paket] ?? { gerekce: '', desen: [] };
  const secili = modeller.filter((m) => esles(m, g.desen));
  const seciliBayt =
    secili.reduce((s, m) => s + boy(`${m}.gltf`) + (existsSync(path.join(dizin, `${m}.bin`)) ? boy(`${m}.bin`) : 0), 0) +
    (secili.length ? atlas : 0);

  return {
    paket,
    gerekce: g.gerekce,
    model: modeller.length,
    tumKB: kb(tum),
    atlasKB: kb(atlas),
    seciliModel: secili.length,
    seciliKB: kb(seciliBayt),
    secililer: secili,
  };
}

const DOGRUDAN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (DOGRUDAN) {
  const YENI = Object.keys(GEREKEN);
  const MEVCUT = readdirSync(KOK).filter((d) => statSync(path.join(KOK, d)).isDirectory() && !YENI.includes(d));

  const mevcutKB = MEVCUT.reduce(
    (s, p) => s + readdirSync(path.join(KOK, p)).reduce((t, f) => t + statSync(path.join(KOK, p, f)).size, 0),
    0,
  );
  const satirlar = YENI.filter((p) => existsSync(path.join(KOK, p))).map(paketOlc);

  const kollar = {
    taban: { ad: 'bugünkü models/', kb: kb(mevcutKB) },
    A_tumu: { ad: 'altı paket TAM', kb: kb(mevcutKB) + satirlar.reduce((s, r) => s + r.tumKB, 0) },
    B_gerekenler: { ad: 'yalnız eşleşen modeller', kb: kb(mevcutKB) + satirlar.reduce((s, r) => s + r.seciliKB, 0) },
  };

  if (process.env.OLCUM_YAZ === '1') {
    const cikti = { tarih: new Date().toISOString().slice(0, 10), mevcutPaketler: MEVCUT, satirlar, kollar };
    writeFileSync('docs/olcum-yeni-paketler.json', `${JSON.stringify(cikti, null, 2)}\n`);
  }

  console.log('paket'.padEnd(26), 'model'.padStart(6), 'tamKB'.padStart(7), 'atlasKB'.padStart(8), 'seçili'.padStart(7), 'seçiliKB'.padStart(9));
  for (const r of satirlar) {
    console.log(
      r.paket.padEnd(26),
      String(r.model).padStart(6),
      String(r.tumKB).padStart(7),
      String(r.atlasKB).padStart(8),
      String(r.seciliModel).padStart(7),
      String(r.seciliKB).padStart(9),
    );
  }
  console.log('');
  for (const [k, v] of Object.entries(kollar)) {
    console.log(`${k.padEnd(14)} ${v.ad.padEnd(26)} ${String(v.kb).padStart(7)} KB  (${(v.kb / 1024).toFixed(1)} MB)`);
  }
  console.log(
    process.env.OLCUM_YAZ === '1'
      ? '\nham → docs/olcum-yeni-paketler.json (üzerine yazıldı)'
      : '\n(ham dosya korundu — yazmak için OLCUM_YAZ=1)',
  );
}
