/**
 * decorLook.ts — DEKORUN ÖLÇÜ VE ANKRAJ KATMANI (S5).
 *
 * NEDEN AYRI DOSYA: `tableLook.ts` (D-072) ve `kitchenLook.ts` (S3) ile aynı gerekçe —
 * `Decor.tsx` R3F bileşeni, vitest'te import edilemez, yani orada yazılı hiçbir sayı
 * bekçilenemez. Sayı burada durur, çizim buradan okur, bekçi burayı okur.
 *
 * ÖLÇÜ NEREDEN GELDİ: `npx tsx tools/olcum-dekor.ts` → `docs/olcum-dekor.txt`,
 * rapor `docs/dekor-raporu-s5.md`. Elle tahmin edilen tek sayı yok.
 *
 * ÖLÇEK KURALI (S5'in kapattığı kol — rapor §B2 · §B8): **mobilya 0,90, aydınlatma gerçek boy.**
 * S3 bunu kasa için bulmuştu (`KASA_S = 0,45`); dekorda iki kez daha ısırdı:
 *  - `lamp_standing` 0,90'da 2,27 br = karakterin **%130'u** → insandan uzun bir direk.
 *  - `lamp_table` 0,90'da 0,90 × 0,92 br → masa lambası değil, yer lambası.
 * Paketin modül karosu (2×2) mobilyanın karosudur; aydınlatma o karoda yazılmış olsa da
 * o karonun ölçeğinde durmaz.
 *
 * GEÇMEYENLER ve NEDENİ (rapor §B1 · §B5 · §B7 — tekrar tartışılmasın diye):
 *  - **Çöp kovası:** üç paket tarandı, iç mekân kovası YOK. `trash_A/B` 18 üçgenlik ikosfer
 *    (0,127 × 0,052) = yerde duran çöp; `dumpster` konteyner (oran 1,78 ↔ kova 0,46).
 *    Elle çizilen kova ölçüsüyle zaten doğru (gerçeğin ×1,02'si) — o yüzden fallback değil ASIL.
 *  - **TV ünitesi:** ekranında maç oynuyor (`useFrame`), paketin dolabı o animasyonu taşımaz.
 *  - **Askılık · şemsiyelik · petek · duvar saati · aplik · askı rayı:** karşılığı yok.
 *  - **Pencere:** S6'nın işi (`wall_window_open`).
 *
 * KULLANICI KARARLARI (2026-09-10 karar paketi): kaktüs GEÇER (bitki kimliği değişiyor,
 * kullanıcı seçti) · paspas `rug_rectangle_B` MAVİ · gazetelik kitaplığa geçer.
 */
import type { DecorKind } from '../../config/decor';
import { ACTOR_HEIGHT } from '../../config/actor';
import { WAINSCOT_H } from './wallPanel';

/** KayKit furniture-bits ham ölçek → dünya. `kitchenLook.KITCHEN_S` ile AYNI sayı, aynı sağlama:
 *  `chair_A` iki pakette de 0,750 geniş (rapor §B0), yani yeni ölçek türetmeye gerek yok. */
export const DECOR_S = 0.9;

export type DecorModel =
  | 'cactus_small_A'
  | 'cactus_small_B'
  | 'cactus_medium_A'
  | 'cactus_medium_B'
  | 'lamp_standing'
  | 'lamp_table'
  | 'cabinet_medium'
  | 'cabinet_small'
  | 'pictureframe_large_A'
  | 'rug_rectangle_B'
  | 'shelf_B_small_decorated';

/**
 * MODELLERİN HAM SINIR KUTUSU — `node tools/model-olc.mjs kaykit-furniture-bits <ad>` çıktısı,
 * BİREBİR. `minX/maxX` ve `minZ/maxZ` de yazılı çünkü KayKit origin'i görsel merkezde olmak
 * zorunda değil (S4 sucuk dersi) ve telafi tahminle yazılmaz.
 */
export const NATIVE: Record<
  DecorModel,
  { w: number; h: number; d: number; minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
> = {
  cactus_small_A: { w: 0.5, h: 0.552, d: 0.5, minX: -0.25, maxX: 0.25, minY: 0, maxY: 0.552, minZ: -0.25, maxZ: 0.25 },
  cactus_small_B: { w: 0.5, h: 0.552, d: 0.5, minX: -0.25, maxX: 0.25, minY: 0, maxY: 0.552, minZ: -0.25, maxZ: 0.25 },
  cactus_medium_A: { w: 0.88, h: 0.827, d: 0.837, minX: -0.44, maxX: 0.44, minY: 0, maxY: 0.827, minZ: -0.418, maxZ: 0.418 },
  cactus_medium_B: { w: 0.88, h: 0.827, d: 0.837, minX: -0.44, maxX: 0.44, minY: 0, maxY: 0.827, minZ: -0.418, maxZ: 0.418 },
  lamp_standing: { w: 1.0, h: 2.52, d: 1.0, minX: -0.5, maxX: 0.5, minY: 0, maxY: 2.52, minZ: -0.5, maxZ: 0.5 },
  lamp_table: { w: 1.0, h: 1.022, d: 1.0, minX: -0.5, maxX: 0.5, minY: -0.002, maxY: 1.02, minZ: -0.5, maxZ: 0.5 },
  // Dolapların SIRTI z = −0,5'te (origin ortada) → duvara yaslamak için z telafisi gerekir.
  cabinet_medium: { w: 2.0, h: 1.0, d: 1.002, minX: -1.0, maxX: 1.0, minY: 0, maxY: 1.0, minZ: -0.5, maxZ: 0.502 },
  cabinet_small: { w: 1.0, h: 1.0, d: 1.002, minX: -0.5, maxX: 0.5, minY: 0, maxY: 1.0, minZ: -0.5, maxZ: 0.502 },
  // Çerçeve: origin DİKEYDE ORTALI (minY −0,6), sırtı z = 0'da → duvara düz yaslanır.
  // x'te 0,005 kayık (minX −0,500 · maxX +0,510) — telafi `parcaX` ile genel olarak uygulanır.
  pictureframe_large_A: { w: 1.01, h: 1.2, d: 0.2, minX: -0.5, maxX: 0.51, minY: -0.6, maxY: 0.6, minZ: 0, maxZ: 0.2 },
  rug_rectangle_B: { w: 3.0, h: 0.1, d: 2.0, minX: -1.5, maxX: 1.5, minY: 0, maxY: 0.1, minZ: -1.0, maxZ: 1.0 },
  // Raf: sırtı z = 0'da → DUVAR rafıdır, ayaklı değil (ölçüm bunu söyledi, rapor §B7 uygulaması).
  shelf_B_small_decorated: { w: 1.0, h: 1.012, d: 0.571, minX: -0.5, maxX: 0.5, minY: -0.1, maxY: 0.912, minZ: 0, maxZ: 0.571 },
};

/**
 * AYDINLATMA ÖLÇEKLERİ — gerçek eşya boyundan türer, `DECOR_S`ten DEĞİL (dosya başlığı).
 * Sayılar gerçek dünya: ayaklı lamba 1,55 m · masa lambası 0,45 m.
 */
export const LAMBA_YER_H = 1.55;
export const LAMBA_MASA_H = 0.45;
export const LAMBA_YER_S = LAMBA_YER_H / NATIVE.lamp_standing.h;
export const LAMBA_MASA_S = LAMBA_MASA_H / NATIVE.lamp_table.h;

/**
 * PENCERE — S6/② ile denizlik ve denizlik saksısı KALKTI (kullanıcı: *"altlarındaki o şerit
 * olmasın, üzerlerindeki kaktüslere de gerek yok, düz cam ve ışıklar yeter"*). Pencere artık
 * duvarda gerçek bir açıklık olduğu için denizliğin taşıdığı "burada boşluk var" işi zaten
 * boşluğun kendisi tarafından yapılıyor; şerit ikinci bir sinyaldi ve fazlaydı.
 */

/** Konsol dolaplarının ÜST yüzü — masa lambası buraya oturur (elle 0,90 yazılmaz). */
export const KONSOL_TOP_Y = NATIVE.cabinet_medium.maxY * DECOR_S;

/**
 * KİTAPLIĞIN ÜST HİZA ANKRAJI — kural: rafın üstündeki eşyaların TEPESİ, asıldığı banda
 * (`config/decor.ts`teki `MOUNT.mid`) oturur; böylece sağ duvarda tablo ile kitaplık tek bir
 * üst hizada okunur. `kitchenLook.WALL_UNIT_Y` ile aynı türetme; elle yazılmaz.
 *
 * Ölçüm bu modelin bir DUVAR rafı olduğunu söyledi (`minZ = 0` → sırtı origin'de, ayak yok):
 * gazetelik bu yüzden zeminden duvara taşındı (rapor §B7 uygulaması).
 */
export const KITAPLIK_DY = -NATIVE.shelf_B_small_decorated.maxY * DECOR_S;

/**
 * PENCERE GÖLGE ATMAZ — kullanıcı 2026-09-10: *"gölgeleri havadalarmış gibi duruyo."*
 *
 * Kasa `castShadow` taşıyordu ve güneş (14, 26, 16) yönünde odaya DÜŞEN dikdörtgen gölgeler
 * duvardan kopuk duruyordu: pencere camdan ibaret, gölgenin dayanacağı bir kütle yok.
 *
 * Bayrak neden burada: `Decor.tsx` vitest'te import EDİLEMEZ, yani orada yazılı bir `castShadow`
 * bekçilenemez — mutasyon testi bunu kanıtladı (gölgeyi geri açan mutasyon KAÇTI). Karar ölçü
 * katmanına çıktı; çizim buradan okuyor, bekçi de buradan.
 */
export const PENCERE_GOLGE = false;

/**
 * DUVARA ASILAN KÜÇÜK PARÇALAR DA GÖLGE ATMAZ — aynı artefakt, aynı gerekçe.
 *
 * Pencerenin gölgesi kapatıldıktan sonra ekranda hâlâ zeminde kopuk kahverengi lekeler kaldı:
 * aplik gibi 0,2 br'lik parçaların güneş (14, 26, 16) yönünde odaya düşen gölgeleri. Küçük bir
 * parçanın gölgesi büyük bir yüzeyde "kir lekesi" olarak okunuyor — kullanıcının pencerede
 * gördüğü *"havadalarmış gibi"* halinin küçük ölçeklisi.
 */
export const DUVAR_GOLGE = false;

/** Lambri çıtasının üstü — duvara asılan hiçbir şey buranın altına inmez (`config/decor.ts`). */
export const CITA_Y = WAINSCOT_H + 0.08;

/** Bir parçanın modeli: sırtı duvarda mı, serbest mi durur. */
export type Sirt = 'duvar' | 'serbest';

export interface DecorPart {
  model: DecorModel;
  olcek: number;
  sirt: Sirt;
  /** Parçanın kendi grubuna göre kayması (uzun yuvaya iki dolap sığdırmak gibi). */
  dx?: number;
  /**
   * Parçanın grubuna göre DÜŞEY kayması (`dx` ile aynı cinsten — mutlak yükseklik DEĞİL).
   * Yerleşim `config/decor.ts`in işidir; burası yalnız modelin o yerleşime nasıl oturduğunu
   * söyler. İkisi karışırsa aynı sayı iki dosyada durur.
   */
  dy?: number;
}

/**
 * KAYKIT'E GEÇEN PARÇALAR. Listede OLMAYAN her `DecorKind` elle çizili kalır (dosya başlığı:
 * hangisi neden geçmedi). Tek kaynak burası — `Decor.tsx` bu listeye bakar, kendi `switch`inde
 * ikinci bir karar vermez.
 *
 * `saksi`/`buyukSaksi` iki varyantlı (A/B): aynı model dokuz kez tekrarlanınca kopyala-yapıştır
 * okunuyor, paketin kendi iki yeşili (#53ab47 · #66b46e) bedavaya çeşitlilik veriyor
 * (`feedback_color_variety` — renk paketin, çeşitlilik paketin içinden).
 */
export const DECOR_MODELS: Partial<Record<DecorKind, readonly DecorPart[]>> = {
  saksi: [{ model: 'cactus_small_A', olcek: DECOR_S, sirt: 'serbest' }],
  buyukSaksi: [{ model: 'cactus_medium_A', olcek: DECOR_S, sirt: 'serbest' }],
  ayakliLamba: [{ model: 'lamp_standing', olcek: LAMBA_YER_S, sirt: 'serbest' }],
  paspas: [{ model: 'rug_rectangle_B', olcek: DECOR_S, sirt: 'serbest' }],
  tablo: [{ model: 'pictureframe_large_A', olcek: DECOR_S, sirt: 'duvar' }],
  gazetelik: [{ model: 'shelf_B_small_decorated', olcek: DECOR_S, sirt: 'duvar', dy: KITAPLIK_DY }],
  /**
   * KONSOL — yuva 3,00 br, `cabinet_medium` 1,80 (= `kitchenLook.MODULE_W`, yani dekor mutfağın
   * ızgara adımını paylaşıyor). İkisi yan yana 2,70 → yuvada 0,30 pay kalır; iki `medium` 3,60
   * olurdu ve yuvayı 0,60 aşardı (rapor §B3). Üstüne masa lambası: bugünkü konsolun radyo/tepsi/
   * saksı dizisinin karşılığı, ama `_decorated` modeli gibi GÖMÜLÜ değil — seçilebilir kalıyor.
   */
  konsol: [
    { model: 'cabinet_medium', olcek: DECOR_S, sirt: 'duvar', dx: -0.45 },
    { model: 'cabinet_small', olcek: DECOR_S, sirt: 'duvar', dx: 0.9 },
    { model: 'lamp_table', olcek: LAMBA_MASA_S, sirt: 'serbest', dx: 0.9, dy: KONSOL_TOP_Y },
  ],
};

/** Aynı türün i. örneğinde kullanılacak varyant (A/B dönüşümlü — bkz. `DECOR_MODELS`). */
export function varyant(model: DecorModel, i: number): DecorModel {
  if (i % 2 === 0) return model;
  if (model === 'cactus_small_A') return 'cactus_small_B';
  if (model === 'cactus_medium_A') return 'cactus_medium_B';
  return model;
}

/**
 * Parçanın YEREL yerleşimi: sırtı duvarda olan model duvara yaslanır (z telafisi kendi
 * `minZ`'sinden türer, `kitchenLook.arkaZ` ile aynı mantık), x kayması origin kaymasını kapatır.
 */
export function parcaYerlesim(p: DecorPart, model: DecorModel): { x: number; y: number; z: number } {
  const n = NATIVE[model];
  return {
    x: (p.dx ?? 0) - ((n.minX + n.maxX) / 2) * p.olcek,
    y: p.dy ?? 0,
    z: p.sirt === 'duvar' ? -n.minZ * p.olcek : 0,
  };
}

/**
 * Bir türün BÜTÜN parçalarını kapsayan YEREL kutu (öğenin kendi merkezine göre). Konsol gibi
 * çok parçalı türlerde tek parçaya bakmak yanıltır: iki dolap yan yana duruyor ve kutu
 * ikisinin birleşimidir.
 */
export function turKutu(kind: DecorKind): { minX: number; maxX: number; minZ: number; maxZ: number } | null {
  const parts = DECOR_MODELS[kind];
  if (!parts) return null;
  const k = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (const p of parts) {
    const n = NATIVE[p.model];
    const yer = parcaYerlesim(p, p.model);
    k.minX = Math.min(k.minX, yer.x + n.minX * p.olcek);
    k.maxX = Math.max(k.maxX, yer.x + n.maxX * p.olcek);
    k.minZ = Math.min(k.minZ, yer.z + n.minZ * p.olcek);
    k.maxZ = Math.max(k.maxZ, yer.z + n.maxZ * p.olcek);
  }
  return k;
}

/**
 * Türün kapsayıcı YARIÇAPI — öğenin merkezinden gövdenin en uzak köşesine. Bekçi açıklığı
 * buradan ölçer; **dönüşten bağımsızdır**, o yüzden `rot` istemez.
 *
 * NEDEN VAR: bugünkü dekor bekçisi (`tests/layout-b6a.test.ts`) parçaları yalnız MERKEZ
 * noktasıyla denetliyordu — "saksının merkezi pad'den 1,3'ten uzak mı". Model geçince merkez
 * aynı kalıp GÖVDE büyüyebilir; kutu pad'in içine sarkar ama bekçi yeşil kalır (rapor §B9).
 */
export function turYaricap(kind: DecorKind): number {
  const k = turKutu(kind);
  if (!k) return 0;
  return Math.max(
    Math.hypot(k.minX, k.minZ),
    Math.hypot(k.minX, k.maxZ),
    Math.hypot(k.maxX, k.minZ),
    Math.hypot(k.maxX, k.maxZ),
  );
}

/**
 * Türün DÜNYA kutusu: yerel kutu çeyrek dönüşle döndürülmüş hâli, öğenin `pos`una göre
 * merkez kayması ve yarı-boyutlarla. Bekçi açıklığı bundan ölçer.
 *
 * NEDEN YARIÇAP DEĞİL: kapsayıcı yarıçap gövdeyi DİSK sanır. Halı 2,70 × 1,80 br ve köşe
 * yarıçapı 1,62; oysa uzun kenarına dik yönde gövde yalnız 0,90 br. Bekçi ilk hâlinde bu
 * yüzden yanlış alarm verdi (halı masa 0'ın işaretini kapatıyor sandı; gerçek mesafe 1,35).
 */
export function turDunyaKutu(
  kind: DecorKind,
  rot: number,
): { cx: number; cz: number; hx: number; hz: number } | null {
  const k = turKutu(kind);
  if (!k) return null;
  const lx = (k.minX + k.maxX) / 2;
  const lz = (k.minZ + k.maxZ) / 2;
  const hx = (k.maxX - k.minX) / 2;
  const hz = (k.maxZ - k.minZ) / 2;
  const c = Math.cos(rot);
  const si = Math.sin(rot);
  return {
    cx: lx * c + lz * si,
    cz: -lx * si + lz * c,
    hx: hx * Math.abs(c) + hz * Math.abs(si),
    hz: hx * Math.abs(si) + hz * Math.abs(c),
  };
}

/** Gövdenin KENARINDAN bir dünya noktasına kalan mesafe (kutunun içindeyse 0). */
export function govdeMesafe(
  kind: DecorKind,
  pos: readonly [number, number, number],
  rot: number,
  hedef: readonly [number, number, number],
): number {
  const b = turDunyaKutu(kind, rot);
  if (!b) return Infinity;
  const dx = Math.max(0, Math.abs(hedef[0] - (pos[0] + b.cx)) - b.hx);
  const dz = Math.max(0, Math.abs(hedef[2] - (pos[2] + b.cz)) - b.hz);
  return Math.hypot(dx, dz);
}

/** Duvara asılan parçanın dünya alt/üst kenarı — bant bekçisi bunu okur. */
export function asmaKenar(p: DecorPart, model: DecorModel, asmaY: number): { alt: number; ust: number } {
  const n = NATIVE[model];
  const y = asmaY + (p.dy ?? 0);
  return { alt: y + n.minY * p.olcek, ust: y + n.maxY * p.olcek };
}

/** Ölçümün insan-oranı sağlaması burada da açık dursun (`feedback_reference_scale_trap`). */
export const INSAN_ORANI = {
  ayakliLamba: (NATIVE.lamp_standing.h * LAMBA_YER_S) / ACTOR_HEIGHT,
  konsol: (NATIVE.cabinet_medium.h * DECOR_S) / ACTOR_HEIGHT,
} as const;
