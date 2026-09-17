/**
 * bahceLook.ts — BAHÇENİN ÖLÇÜ VE YERLEŞİM KATMANI (R4 · D-129).
 *
 * `tableLook` · `kitchenLook` · `wallLook` · `streetLook` ile aynı gerekçe: `Scene.tsx` vitest'te
 * import EDİLEMEZ (`recolor` → `Image`), yani çizimin içine yazılmış hiçbir koordinat
 * bekçilenemez. Sayı burada durur, çizim buradan okur, bekçi burayı okur.
 *
 * ---------------------------------------------------------------------------------------------
 * KULLANICININ CÜMLESİ, BİREBİR (2026-09-17):
 *   *"c2 Bahçe: çim + çit + ağaç çok güzel olur ama alan olarak açmadığım her yer öyle olsun,
 *   açtıklarım zaten oynanabilir olacak."*
 *
 * Bu, R4 karar paketindeki C2 kolunun KAPSAMINI değiştirir ve önemli olan fark budur: bahçe
 * binanın DIŞINDAKİ kuşak değil, **açılmamış olan her yer**. İkisi aynı şey değil —
 * açılmamış bir alan zemin karesinin İÇİNDE de olabilir (1. alan açıkken 2. ve 3. alanların
 * dikdörtgenleri tam da orada duruyor). Yani bahçe `areasOpen` ile KÜÇÜLÜR: satın alınan her
 * alan bahçeden düşer ve oynanabilir zemine döner.
 *
 * Bu yüzden bahçe bir "süs kuşağı" değil, **binanın ayak izinin TÜMLEYENİ**. Tek doğru kaynak
 * `binaAyakIzi(areasOpen)`; çim, çit ve bitki üçü de ondan TÜRER (`feedback_single_source_of_truth`).
 * Yeni bir alan açıldığında üçü birden kendiliğinden geri çekilir; elle güncellenecek ikinci
 * bir liste yoktur.
 *
 * ---------------------------------------------------------------------------------------------
 * ÖLÇÜLER NEREDEN GELDİ — `docs/olcum-cevre-r4.txt` (TAM koşu · 18 kare · 6.400 ışın/kare),
 * rapor `docs/cevre-raporu-r4.md`. Elle tahmin edilen sayı yok:
 *
 *  - §E: ufuk altı boşluğun **%53,1'i sol · %27,3'ü sağ · %17,9'u arka**, ÖN (sokak) kenarda
 *    yalnız **%1,6**. Bahçe bu yüzden sokağa taşmaz: `ARSA.maxZ = STREET_Z0`.
 *  - §E: kenardan taşmanın ortancası 1,0-10,1 br · **P90 11,11** · en uzak **15,12**.
 *    → `DIS_PAY = 30` (en uzak ölçülen taşmanın iki katı; çim iki üçgen, bedeli yok)
 *    → `CIT_PAY = 6` ortanca ile P90'ın arasında: çit hem GÖRÜNÜR hem arkasında çim kalır,
 *      yani hiçbir kadrajda "çitin ötesi boşluk" olmaz.
 *    → `BITKI_MENZIL = 14`: P90'ı geçer, en uzak taşmaya yaklaşır; ötesine konan bitki
 *      hiçbir karede ekrana girmez (S6'nın karşı bina dersi).
 *  - §A/§B: zeminin sapması 1,39 ve ayrık rengi 11 — "bitmemiş" hissinin sayısı buydu.
 *    **Bu yüzden çim TEK RENK DEĞİL:** her çim parçası kendi konumundan türeyen bir ton alır.
 *    Düz bir yeşil düzlem, şikâyetin kendisini yeşile boyamak olurdu.
 */
import { BAND, BAND_SHELL, FLOOR_HALF, LAYOUT } from '../../game/layout';
import { STREET_Z0 } from './streetLook';
import { WALL_M, WALL_T_WAINSCOT } from './wallPanel';

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };

/** Zemin düzleminin yarı kenarı — `Ground` 34 + 1,2 çiziyor, yarısı 17,6. */
export const ZEMIN_YARI = FLOOR_HALF + 0.6;

/**
 * Çim duvarın DIŞ YÜZÜNDE başlar — pay elle yazılmaz, duvarın kendi sayılarından TÜRER.
 *
 * İlk yazımda 0,60 sabitti ve bu **yanlıştı**: zemin hizasında duvarın en dış yüzünü gövde
 * (0,18) değil LAMBRİ (0,22) belirliyor, yani dış yüz 0,50 + 0,11 = **0,61**. Çim 0,60'ta
 * başlayınca lambri 0,01 br çimin üstüne biniyordu. Mutasyon M6 bu payın sıfırlanmasını
 * yakalayamamıştı çünkü bekçi payı kendi kaynağından okuyordu — sayının nereden geldiğini
 * sormayan bir bekçi, sayının değişmesini de göremez.
 */
const DUVAR_PAY = WALL_M + WALL_T_WAINSCOT / 2;

export const BAHCE = {
  /** Çimin zemin karesinden dışarı uzandığı pay (§E: en uzak ölçülen taşma 15,12). */
  disPay: 30,
  /** Çit hattının zemin karesinden uzaklığı (§E: ortanca ile P90 arası). */
  citPay: 6,
  /** Bitkilerin konduğu en uzak nokta — ötesi hiçbir kadrajda görünmüyor. */
  bitkiMenzil: 14,
  /** Bitki ızgarasının adımı; her hücrede en çok bir bitki, konumu hücre içinde sapar. */
  izgara: 4.2,
  /** Bitki ayak izine bu kadar yaklaşamaz — ağaç duvarın içinden çıkmasın. */
  binaPayi: 1.7,
  /** Çit: direk aralığı · direk kesiti · korkuluk kalınlığı · toplam boy. */
  citAralik: 2.2,
  citDirek: 0.17,
  citKorkuluk: 0.1,
  citBoy: 0.85,
  /** Çim düzleminin y'si — taban ahşabın (0) ve alan kaplamasının (0,004/0,006) üstünde. */
  cimY: 0.012,
} as const;

/** Bahçenin dış sınırı. ÖN kenar sokakta biter (§E: boşluğun yalnız %1,6'sı önde). */
export const ARSA: Rect = {
  minX: -ZEMIN_YARI - BAHCE.disPay,
  maxX: ZEMIN_YARI + BAHCE.disPay,
  minZ: -ZEMIN_YARI - BAHCE.disPay,
  maxZ: STREET_Z0,
};

const genislet = (r: Rect, p: number): Rect => ({
  minX: r.minX - p,
  maxX: r.maxX + p,
  minZ: r.minZ - p,
  maxZ: r.maxZ + p,
});

export const noktaIcinde = (r: Rect, x: number, z: number): boolean =>
  x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;

/**
 * BİNANIN AYAK İZİ — bahçenin tümleyeni buradan çıkar, yani bu listenin TEK doğru kaynak
 * olması şart. İki parçası var ve ikisi de `areasOpen`a bağlı:
 *  1. Açık alanların dikdörtgenleri (duvar payıyla genişletilmiş).
 *  2. Arka bandın kabuğu — bant `areasOpen < 3` iken HİÇ ÇİZİLMİYOR (`Scene.BackBand`, D-057),
 *     yani o dönemde bandın yeri de bahçedir. Bu satır unutulursa arka yarı, bant görünmeden
 *     önce çıplak ahşap kalır ve tam da kullanıcının şikâyet ettiği yüzey geri gelir.
 */
export function binaAyakIzi(areasOpen: number): Rect[] {
  const out = LAYOUT.areaBounds.slice(0, areasOpen).map((r) => genislet(r, DUVAR_PAY));
  if (areasOpen >= 3) {
    out.push({
      minX: BAND_SHELL.left - 0.1,
      maxX: BAND_SHELL.right + 0.1,
      minZ: BAND_SHELL.back - 0.1,
      maxZ: BAND.front + DUVAR_PAY,
    });
  }
  return out;
}

/**
 * DİKDÖRTGEN FARKI — `p` eksi `cikar` birleşimi, eksen hizalı dikdörtgenler olarak.
 *
 * Yöntem: bütün kenar koordinatları toplanır, ızgara hücrelerine bölünür, kapalı hücreler
 * atılır, kalanlar SATIR BOYUNCA birleştirilir. Yaklaşık değil TAM: hiçbir hücre iki
 * dikdörtgene birden ait olmaz, yani çim parçaları üst üste binmez (binseydi z-fighting).
 */
export function dikdortgenFarki(p: Rect, cikar: Rect[]): Rect[] {
  const xs = new Set<number>([p.minX, p.maxX]);
  const zs = new Set<number>([p.minZ, p.maxZ]);
  for (const c of cikar) {
    for (const v of [c.minX, c.maxX]) if (v > p.minX && v < p.maxX) xs.add(v);
    for (const v of [c.minZ, c.maxZ]) if (v > p.minZ && v < p.maxZ) zs.add(v);
  }
  const X = [...xs].sort((a, b) => a - b);
  const Z = [...zs].sort((a, b) => a - b);
  const out: Rect[] = [];
  for (let j = 0; j < Z.length - 1; j++) {
    let acik: Rect | null = null;
    for (let i = 0; i < X.length - 1; i++) {
      const cx = (X[i] + X[i + 1]) / 2;
      const cz = (Z[j] + Z[j + 1]) / 2;
      if (cikar.some((c) => noktaIcinde(c, cx, cz))) {
        if (acik) out.push(acik);
        acik = null;
        continue;
      }
      if (acik) acik.maxX = X[i + 1];
      else acik = { minX: X[i], maxX: X[i + 1], minZ: Z[j], maxZ: Z[j + 1] };
    }
    if (acik) out.push(acik);
  }
  return out.filter((r) => r.maxX - r.minX > 1e-6 && r.maxZ - r.minZ > 1e-6);
}

/** Açılmamış her yer. `areasOpen` büyüdükçe küçülür — ikinci bir liste yok. */
export const cimAlanlari = (areasOpen: number): Rect[] => dikdortgenFarki(ARSA, binaAyakIzi(areasOpen));

/** Konuma bağlı, kararlı sözde-rastgele [0, 1] — aynı ağaç her yüklemede aynı yerde/tonda. */
export function bahceNoise(a: number, b: number): number {
  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/** Çim parçasının tonu — düz tek yeşil olmasın diye konumdan türer (§B dersi). */
export const cimTonu = (r: Rect): number => 0.93 + bahceNoise(r.minX * 0.37, r.minZ * 0.53) * 0.14;

export type CitParca = { x: number; z: number; w: number; d: number };

/**
 * ÇİTİN ÖN UCU — sokak hattının TAM üstünde değil, direğin yarı kalınlığı kadar içeride.
 * Bekçi bunu yakaladı: son direk z = `STREET_Z0`'a düşüyordu, yani gövdesinin yarısı arsanın
 * dışında, kaldırımın üstünde kalıyordu. Bahçeye ait bir parça bahçenin dışında duramaz.
 */
export const CIT_ON = STREET_Z0 - BAHCE.citDirek / 2;

/**
 * ÇİT — arsanın SOL · SAĞ · ARKA kenarında, zemin karesinden `citPay` dışarıda.
 * Ön kenarda çit YOK: orası sokak cephesi, müşteri oradan giriyor ve §E ön kenarda boşluk
 * olmadığını söylüyor.
 */
export function citParcalari(): CitParca[] {
  const h = ZEMIN_YARI + BAHCE.citPay;
  const uz = CIT_ON + h;
  return [
    { x: -h, z: (-h + CIT_ON) / 2, w: BAHCE.citKorkuluk, d: uz },
    { x: h, z: (-h + CIT_ON) / 2, w: BAHCE.citKorkuluk, d: uz },
    { x: 0, z: -h, w: 2 * h + BAHCE.citKorkuluk, d: BAHCE.citKorkuluk },
  ];
}

/** Çit direkleri — korkuluk hattı boyunca `citAralik` aralıkla. */
export function citDirekleri(): { x: number; z: number }[] {
  const h = ZEMIN_YARI + BAHCE.citPay;
  const out: { x: number; z: number }[] = [];
  const say = (uzunluk: number) => Math.max(2, Math.round(uzunluk / BAHCE.citAralik) + 1);
  const yanUzunluk = CIT_ON + h;
  for (const x of [-h, h]) {
    const n = say(yanUzunluk);
    for (let i = 0; i < n; i++) out.push({ x, z: -h + (yanUzunluk * i) / (n - 1) });
  }
  const n = say(2 * h);
  for (let i = 0; i < n; i++) {
    const x = -h + (2 * h * i) / (n - 1);
    if (Math.abs(Math.abs(x) - h) < 1e-6) continue; // köşe direği iki kez konmaz
    out.push({ x, z: -h });
  }
  return out;
}

export type Bitki = { tur: 'agac' | 'cali'; x: number; z: number; boy: number; ton: number };

/**
 * BİTKİLER — ızgara + sapma, sonra ELEME. Tek düze dağıtım denendi ve ekrana tek ağaç bile
 * girmedi (`tools/shot-cevre-r4.mjs` başındaki not): §E'ye göre görünen şey kenardan yalnız
 * ilk birkaç birim, yani bitkiyi uzağa değil binanın KENARINA koymak gerekiyor.
 *
 * İki eleme kuralı:
 *  1. Bitki ayak izine `binaPayi` kadar yaklaşamaz (ağaç duvarın içinden çıkmaz).
 *  2. Bitki zemin karesinden `bitkiMenzil` ötede olamaz (görünmeyen bitki, konmamış bitki).
 *
 * ÜÇÜNCÜ BİR KURAL VARDI VE SİLİNDİ — mutasyon onu ÖLÜ KOD olarak açığa çıkardı. "Müşteri
 * koridorunu boş bırak" diye bir eleme yazılmıştı; M12 (kuralı tamamen kaldır) ve M13 (kuralı
 * kapıyla taşıtma) mutasyonlarının İKİSİ de kaçtı, çünkü kural hiçbir `areasOpen` değerinde
 * ateşlenmiyor: kapı her zaman AÇIK bir alanın ayak izinin içinde (1 alanda x −8,5 → 0. alan;
 * 2+ alanda x 0 → iki ön çeyreğin ortak kenarı) ve bahçe zaten sokak hattında (`ARSA.maxZ =
 * STREET_Z0`) bitiyor. Koridorun bahçe olması yapısal olarak imkânsız. Ateşlenemeyen bir kural
 * koruma değil gürültüdür; yerini `tests/bahce-r4.test.ts`teki gerçek değişmez aldı:
 * kapı eşiği ve sokak noktası hiçbir zaman çimin üstünde değildir.
 */
export function bitkiler(areasOpen: number): Bitki[] {
  const ayak = binaAyakIzi(areasOpen);
  const yasak = ayak.map((r) => genislet(r, BAHCE.binaPayi));
  const menzil = {
    minX: -ZEMIN_YARI - BAHCE.bitkiMenzil,
    maxX: ZEMIN_YARI + BAHCE.bitkiMenzil,
    minZ: -ZEMIN_YARI - BAHCE.bitkiMenzil,
    maxZ: STREET_Z0,
  };
  const out: Bitki[] = [];
  const adim = BAHCE.izgara;
  for (let gx = Math.ceil(menzil.minX / adim); gx * adim < menzil.maxX; gx++) {
    for (let gz = Math.ceil(menzil.minZ / adim); gz * adim < menzil.maxZ; gz++) {
      const n1 = bahceNoise(gx, gz);
      const n2 = bahceNoise(gz * 3.7, gx * 1.9);
      const x = gx * adim + (n1 - 0.5) * adim * 0.8;
      const z = gz * adim + (n2 - 0.5) * adim * 0.8;
      if (!noktaIcinde(menzil, x, z)) continue;
      if (yasak.some((r) => noktaIcinde(r, x, z))) continue;
      const secim = bahceNoise(gx * 5.1, gz * 7.3);
      if (secim > 0.82) continue; // her hücre dolmaz — sıralı dizilim izlenimi kırılır
      const agac = secim < 0.34;
      out.push({
        tur: agac ? 'agac' : 'cali',
        x,
        z,
        boy: agac ? 2.6 + n1 * 1.8 : 0.5 + n2 * 0.45,
        ton: 0.9 + bahceNoise(gx * 11.3, gz * 2.7) * 0.2,
      });
    }
  }
  return out;
}
