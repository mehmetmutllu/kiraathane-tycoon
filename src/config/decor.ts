/**
 * decor.ts — SALT GÖRSEL DEKOR KATMANI (Faz B6a).
 *
 * Bu dosya oyunun HİÇBİR kuralına dokunmaz: burada collision yok, nav yok, ekonomi yok, kayıt yok.
 * Yalnız "neyin nerede durduğu" yazar; `components/three/Decor.tsx` okur ve çizer. Ayrı dosya
 * olmasının sebebi D-068 §3: dekor A/B'ye açık tutulacak — aynı şartname iki tarafa verilip aynı
 * kadrajdan karşılaştırılabilsin diye yerleşimin GEOMETRİ tarafından (`game/layout.ts`) ayrıldı.
 * `layout.ts` yürünen/çarpılan dünyayı tarif eder; burası bakılan dünyayı.
 *
 * KAYNAK: maket v13/v14 (`docs/maket/maket-v13.html`, `buildFloor1`) + tasarım turunda alınan
 * Fable 5.1 ikinci görüşü (D-068 §2). Program birebir kopyalanmadı; maket ile oyunun İKİ SERT
 * FARKI var ve ikisi de dekoru doğrudan bağlıyor:
 *
 *  1. ~~**DUVAR 1,2 BİRİM**~~ → **BM/D-070 ile GEÇERSİZ.** Duvar artık maketin 3,20'si
 *     (`wallPanel.WALL_H`) ve asma bandı da maketin bandı (`MOUNT` · `WINDOW` aşağıda).
 *     B6a'nın "1,2'lik kesik duvara maketin y = 1,85…2,20 programı sığmaz → ağır öğeler
 *     duvardan insin" kuralının GEREKÇESİ ÖLÇÜLDÜ ve doğrulanmadı: maketin kamerası da 44°,
 *     tek fark mesafe; 3,2'lik duvar hiçbir kadrajı kapatmıyor. Ağır öğeler (TV · konsol)
 *     şimdilik AYAKLI kalıyor — bu artık bir kısıt değil, bir tercih; BM arka bant adımında
 *     maketin duvar programına dönmek serbest.
 *     Duvarda duranlar: askı rayı · tablo · aplik · saat · pencere.
 *  2. **KAMERA −z'ye BAKAR** (oyuncunun 8,5 arkasından, 45°). Üç sonucu var:
 *     - ÖN duvarın (z = +17,5) İÇ yüzü hiçbir kadrajda görünmez; kamera hep onun iç tarafındadır.
 *       Maketin "giriş holü" duvar öğeleri (tablo · saat) oraya asılırsa hiç okunmaz → giriş
 *       hissi duvarla değil **kapının iki yanındaki düşey siluetlerle** kuruluyor (askılık ·
 *       şemsiyelik · lamba · saksı), hepsi arkadan da okunan hacimler.
 *     - SOL ve SAĞ duvarların iç yüzleri her kadrajda görünür → duvar programı oraya iner.
 *     - Kapıdan kuzeye giden koridoru iki yandan saksıyla çerçevelemek, "hol ↔ salon" ayrımını
 *       tek hamlede kuruyor: boşluğu kıran şey obje SAYISI değil, boşluğun BÖLGELERE ayrılması.
 *
 * DÜŞEY ÖLÇEK: ~~×0,72~~ **KALKTI (D-070/D-072/D-073).** Maket BİTMİŞ HÂLDİR ve ölçü katmanı
 * onun sayılarıyla donar: duvar 3,20 · lambri 0,90 · masa 1,75 @ 0,75. Düşey de yatay da **1:1**
 * — kat ikisinde de 34 × 34. Yeni dekor ölçüsü maketten OKUNUR, çarpanla türetilmez.
 *
 * HALI YOK: kullanıcı üç kez reddetti ("zemini tek renk ayarla yeter"); maket v13 de ön
 * çeyreklerde halı taşımaz. Zemindeki tek dokuma parça **kapı paspasıdır** ve o da kapıyla
 * birlikte yer değiştirir. **S5 (2026-09-10):** o tek parça KayKit'in `rug_rectangle_B`'sine
 * geçti (mavi) — kural değişmedi, kuralın izin verdiği tek parçanın modeli değişti. Ölçüm bu
 * arada şunu da söyledi: bugünkü paspas eni gerçeğin **3,7 katı**, yani ölçüsüyle zaten bir
 * kilim (`docs/dekor-raporu-s5.md` §B6).
 *
 * ALINMAYAN ÜÇ ÖNERİ (gerekçeleriyle, tekrar tartışılmasın diye):
 *  - **Soba + kömür kovası:** maket sobayı ARKA salonun sedir köşesine koyuyor (B6b). Ön çeyreğe
 *    ikinci bir soba koymak katta iki soba demek olurdu.
 *  - **Ayaklı kül tablası:** D-032 nargileyi yaş sınırı için kaldırdı; küllük aynı sinyali geri
 *    getirir.
 *  - **Kümelerin üstüne sarkıt lamba:** "havada obje" hassasiyeti (D-054 çevresi) — önce mockup
 *    onayı ister, B6b'de sorulacak.
 */
import type { RVec3 } from '../game/layout';
import { BAND, FLOOR_HALF, LAVABO, LAYOUT, doorX } from '../game/layout';
import { RAIL_TOP, WAINSCOT_H, WALL_H, WALL_M, WALL_T_BODY, WALL_T_RAIL, WALL_T_WAINSCOT } from '../components/three/wallPanel';

/**
 * Duvar öğelerinin ASILDIĞI düzlem = duvarın oda tarafındaki GERÇEK YÜZÜ (`WALL_INNER`).
 *
 * **S6/② ile düzeltildi.** Eskiden `FLOOR_HALF + 0.32` = 17,32'ydi; gerekçesi *"krem gövdenin
 * yüzünün ~0,1 önü (tüm profilleri geçer)"*di ve o pay bir TAHMİNDİ. Duvarın gövde yüzü 17,41 →
 * duvara asılan HER ŞEY 0,09 br havada duruyordu. Kullanıcı iki ayrı parçada gördü:
 * *"sağ en altta bir raf … o duvardan ayrı duruyo"* ve *"alttaki kalorifer duvardan uzakta"*.
 * Tek kök, tek düzeltme: pay tahmini kalktı, düzlem duvarın kendi kalınlığından TÜRÜYOR.
 *
 * Profilleri geçme kaygısı geçersiz: lambri (0,22) ve çıta (0,26) yalnız y ≤ 0,98'de var,
 * asılan hiçbir öğe oraya inmiyor (`decorLook.CITA_Y` bekçisi).
 */
export const WALL_FACE = FLOOR_HALF + WALL_M - WALL_T_BODY / 2;
/**
 * Duvarın EN KALIN katmanından bırakılan pay (F4c-2). Gömülmeyecek kadar, S6/②'nin *"duvardan
 * ayrı duruyo"* dediği 0,09'luk boşluğa dönmeyecek kadar küçük.
 */
export const DUVAR_PAYI = 0.02;

/**
 * Zemine oturan ama duvara YASLANAN öğelerin (konsol · TV ünitesi · petek) SIRT hattı.
 *
 * **F4c-2 ile düzeltildi (`docs/dekor-raporu-f4c2.md` B5).** S6/②'de `WALL_FACE`e eşitlenmişti,
 * ama o GÖVDENİN yüzü (0,18). Zemin hizasında gövdenin önünde lambri (0,22) ve çıta (0,26) var:
 * 17,41'e yaslanan konsol lambriye 0,02, çıtaya 0,04 GÖMÜLÜYDU — kullanıcının aday karelerinde
 * gördüğü *"dekor duvarla birleşiyor"* kusurunun oyundaki hâli. Sırt artık çıtanın `DUVAR_PAYI` önünde.
 * `parcaYerlesim` `sirt: 'duvar'` parçalarının SIRTINI tam bu hatta getiriyor.
 */
export const WALL_BACK = FLOOR_HALF + WALL_M - WALL_T_RAIL / 2 - DUVAR_PAYI;

/** `WALL_FACE`in okunur takma adı — zemine oturan öğelerin gerekçesi orada yazılı. */
export const WALL_INNER = WALL_FACE;

/**
 * DUVARIN ASMA BANDI — **BM (D-070) ile maketin değerlerine çekildi.**
 *
 * B6a'da duvar 1,2 birimlik KESİK bir duvardı ve asma bandı 0,86…1,00 idi; maketin y = 1,85…2,20
 * arasındaki programı oraya sığmıyordu, bu yüzden ağır öğeler duvardan indirilmişti. BM duvarı
 * maketin 3,2'sine taşıyınca o kısıt KALKTI: maketin kendi asma yükseklikleri kullanılabilir.
 *
 * MAKETİN DEĞERLERİ (`maket-v13.html`): aplik 2,05 · tablo 1,95–2,15 · duvar saati 2,20 ·
 * askı rayı 1,85 · TV 2,02 · pencere denizliği 1,15, pencere başı 2,80.
 * Lambri kuşağı 0…0,90 ve üstündeki çıta 0,90…0,98 — asılan hiçbir şey oraya binmemeli.
 */
export const MOUNT = { mid: 1.95, high: 2.05, clock: 2.2, rail: 1.85 } as const;
/** Maketin pencere bandı (`windowWall`): denizlik 1,15 · pencere başı 2,80. */
export const WINDOW = { sill: 1.15, top: 2.8 } as const;

export type DecorKind =
  | 'saksi' // küçük saksı (zemin)
  | 'buyukSaksi' // büyük saksı (zemin)
  | 'copKovasi' // çöp kovası (zemin)
  | 'askilik' // portmanto (zemin)
  | 'semsiyelik' // şemsiyelik (zemin)
  | 'gazetelik' // S5'ten beri DUVAR kitaplığı (eskiden ayaklı gazete sehpası)
  | 'ayakliLamba' // ayaklı lamba (zemin)
  | 'paspas' // kapı paspası (zemin, düz)
  | 'konsol' // AYAKLI konsol/büfe + üstünde radyo, tepsi, saksı (zemin)
  | 'tvUnitesi' // AYAKLI TV ünitesi + üstünde televizyon (ekranda maç oynar)
  | 'petek' // pencere altı radyatör
  | 'tablo' // duvara asılı çerçeve
  | 'duvarSaati' // duvar saati
  | 'aplik' // duvar apliği
  | 'askiRayi' // duvar boyu askı rayı + kancalar + asılı palto
  | 'pencere'; // duvara oturan pencere ünitesi (çerçeve + cam + denizlik)

export interface DecorItem {
  kind: DecorKind;
  /** Dünya konumu. y = 0 zemin objesi; y > 0 duvara asılı öğenin merkezi. */
  pos: RVec3;
  /** Yaw. Her parçanın YÜZÜ yerel +z'ye bakar; sol duvar +π/2, sağ duvar −π/2, ön duvar π. */
  rot: number;
  /** Kaç alan AÇIKKEN görünür (maketin adım katmanı: 1 = a0 · 2 = a1 · 3 = sol duvar programı). */
  from: number;
  /** Uzun öğelerde boy (askı rayı · konsol · TV ünitesi · tablo · pencere · petek). */
  len?: number;
  /** Yüksekliği boydan bağımsız olan öğeler (tablo · pencere). */
  h?: number;
}

/**
 * a0 — "OCAK DUVARI". Maket v14'ün "EKSİK #2" cevabı: adım 3'te ocak arka banda taşınınca
 * (`serviceMoved`, areasOpen ≥ 3) sol duvarın ön yarısı 13 birim çıplak kalır. Maket oraya
 * OTURMA EKLEMEDEN duvar donanımı asar — bizde de öyle: masa sayısı ve ekonomi zinciri
 * değişmesin (D-066: masa açmak geliri büyütmüyor ama denge satırlarını kaydırır).
 *
 * z sırası kuzeyden güneye: aplik → konsol+tablo → saksı → TV ünitesi → saat. Askı rayı ve
 * girişin öğeleri `from: 1` çünkü servis o dönemde z ∈ [4,8 · 11,6] arasında duruyor, kapı
 * tarafındaki duvar zaten boş.
 */
const LEFT_WALL: DecorItem[] = [
  { kind: 'aplik', pos: [-WALL_FACE, MOUNT.high, 3.2], rot: Math.PI / 2, from: 3 },
  { kind: 'konsol', pos: [-WALL_BACK, 0, 6.0], rot: Math.PI / 2, from: 3, len: 3.0 },
  { kind: 'tablo', pos: [-WALL_FACE, MOUNT.mid, 6.0], rot: Math.PI / 2, from: 3, len: 1.2, h: 0.42 },
  { kind: 'buyukSaksi', pos: [-16.0, 0, 8.3], rot: 0, from: 3 },
  // TV maketteki yerinde (z = 10,8) ama artık DUVARDA DEĞİL, kendi ünitesinin üstünde.
  { kind: 'tvUnitesi', pos: [-WALL_BACK, 0, 10.9], rot: Math.PI / 2, from: 3, len: 1.9 },
  { kind: 'aplik', pos: [-WALL_FACE, MOUNT.high, 12.6], rot: Math.PI / 2, from: 3 },
];

/**
 * a1 — "CAM KENARI". Maket a1'e bu adı veriyor ve sağ duvarın ön yarısına üç büyük pencere
 * koyuyor. Oyunun duvarı katı bir dilim olduğu için pencere duvarı DELMEZ, üstüne oturur:
 * çerçeve + yarı saydam cam + denizlik. İki çeyrek BİLEREK ayrışıyor (Fable'ın D maddesi):
 * a0 kapalı/ahşap duvar (TV · konsol · palto), a1 açık/aydınlık (pencere · petek · çiçek).
 * Aynalı olsalardı iki çeyrek "aynı odanın kopyası" okunur ve düzensizlik hissi sürerdi.
 */
const RIGHT_WALL: DecorItem[] = [
  { kind: 'pencere', pos: [WALL_FACE, (WINDOW.sill + WINDOW.top) / 2, 2.6], rot: -Math.PI / 2, from: 2, len: 3.2, h: WINDOW.top - WINDOW.sill },
  { kind: 'aplik', pos: [WALL_FACE, MOUNT.high, 5.0], rot: -Math.PI / 2, from: 2 },
  { kind: 'pencere', pos: [WALL_FACE, (WINDOW.sill + WINDOW.top) / 2, 7.4], rot: -Math.PI / 2, from: 2, len: 3.2, h: WINDOW.top - WINDOW.sill },
  { kind: 'petek', pos: [WALL_BACK, 0, 7.4], rot: -Math.PI / 2, from: 2, len: 1.6 },
  { kind: 'aplik', pos: [WALL_FACE, MOUNT.high, 9.8], rot: -Math.PI / 2, from: 2 },
  { kind: 'pencere', pos: [WALL_FACE, (WINDOW.sill + WINDOW.top) / 2, 12.2], rot: -Math.PI / 2, from: 2, len: 3.2, h: WINDOW.top - WINDOW.sill },
  // S5: gazetelik KayKit kitaplığına geçti (kullanıcı kararı) ve ölçüm o modelin bir DUVAR rafı
  // olduğunu söyledi (`minZ = 0` → sırtı origin'de, ayağı yok). Bu yüzden zeminden asma bandına
  // taşındı; `MOUNT.mid` çünkü tablo ile aynı üst hizada okunmalı (`decorLook.KITAPLIK_DY`).
  { kind: 'gazetelik', pos: [WALL_FACE, MOUNT.mid, 14.4], rot: -Math.PI / 2, from: 2 },
];

/**
 * GİRİŞ — kapıya GÖRELİ olanlar `entryAtDoor()`te (kapı a1 açılınca x = −8,5'ten 0'a kayar,
 * onunla birlikte taşınmaları gerekiyor); burada sabit duranlar var. Askı rayı ve saat kapı
 * tarafındaki SOL duvarda, yani ilk andan itibaren görünür bandın içinde.
 */
const ENTRY: DecorItem[] = [
  { kind: 'askiRayi', pos: [-WALL_FACE, MOUNT.rail, 15.2], rot: Math.PI / 2, from: 1, len: 2.2 },
  { kind: 'duvarSaati', pos: [-WALL_FACE, MOUNT.clock, 13.0], rot: Math.PI / 2, from: 1 },
  { kind: 'ayakliLamba', pos: [-13.6, 0, 15.9], rot: 0, from: 1 },
  { kind: 'buyukSaksi', pos: [-16.0, 0, 16.0], rot: 0, from: 1 },
  { kind: 'copKovasi', pos: [-3.2, 0, 16.2], rot: 0, from: 1, len: 1 },
  { kind: 'saksi', pos: [16.0, 0, 16.0], rot: 0, from: 2 },
  { kind: 'ayakliLamba', pos: [13.4, 0, 15.9], rot: 0, from: 2 },
  { kind: 'copKovasi', pos: [14.6, 0, 13.0], rot: 0, from: 2, len: 0.85 },
];

/**
 * KORİDOR ÇERÇEVESİ — kapıdan kuzeye giden aksı iki yandan saksıyla kapatır. Fable'ın E-3'ü:
 * ön çeyreklerdeki "boş ve düzensiz" hissini kıran şey obje sayısı değil, boşluğun **hol ·
 * salon · duvar dibi** diye üçe ayrılması. Saksılar masa kümelerinin ve yükseltme noktalarının
 * DIŞINDA (en yakın nokta 2,5 br'den uzak — `tests/decor-b6a.test.ts` bunu bekçiliyor).
 */
// D-073 (BM adım 2): masa kümesi maketin ölçüsüne büyüyünce (aralık 6,40 · koltuk ∓1,45)
// koridor daraldı ve eski ∓4,6'lık saksılar oturma alanının İÇİNDE kaldı; yükseltme noktaları da
// ∓2,15'e taşındığı için z 3,4 / 13,4 hizası onlarla çakışıyordu. Saksılar koridorun gerçek
// genişliğine (∓3,85 koltuk kenarı) ve iki masa SIRASININ ARASINA çekildi.
const CORRIDOR: DecorItem[] = [
  { kind: 'buyukSaksi', pos: [-3.0, 0, 10.4], rot: 0, from: 1 },
  { kind: 'saksi', pos: [-3.0, 0, 6.6], rot: 0, from: 1 },
  { kind: 'buyukSaksi', pos: [3.0, 0, 10.4], rot: 0, from: 2 },
  { kind: 'saksi', pos: [3.0, 0, 6.6], rot: 0, from: 2 },
];

/**
 * KAPIYA GÖRELİ GİRİŞ TAKIMI — paspas + iki yanında askılık ve şemsiyelik. Kapı a1 açılınca
 * cephenin ortasına kaydığı için (`doorX`) bunlar sabit listede duramaz.
 */
export function entryAtDoor(areasOpen: number): DecorItem[] {
  const dx = doorX(areasOpen);
  return [
    { kind: 'paspas', pos: [dx, 0.012, 16.1], rot: 0, from: 1 },
    { kind: 'askilik', pos: [dx + 1.9, 0, 15.7], rot: 0, from: 1 },
    { kind: 'semsiyelik', pos: [dx - 1.9, 0, 15.7], rot: 0, from: 1 },
  ];
}

const FIXED: DecorItem[] = [...ENTRY, ...CORRIDOR, ...LEFT_WALL, ...RIGHT_WALL];

/** O an SAHNEDE olan dekor (kilitli alanın dekoru çizilmez — D-057 ile aynı kural). */
export const decorItems = (areasOpen: number): DecorItem[] =>
  areasOpen < 1 ? [] : [...FIXED.filter((d) => d.from <= areasOpen), ...entryAtDoor(areasOpen)];

// ============================================================================================
//  💎 VİTRİN DEKORU (F4c-2 · D-155) — satın alınınca kendi YUVASINDA belirir
// ============================================================================================
//
// Kullanıcı (2026-09-24): dekor haritada gösterilsin, DÜZEN DEĞİŞMESİN, dekor boş yerlere sığsın.
// Yuvalar ölçülerek seçildi (`tools/olcum-dekor-yuva-f4c2.ts` · `docs/dekor-raporu-f4c2.md`):
// yürüme trafiği %0, en yakın pad/yükseltme noktası 1,0'ın dışında, katı engel ve bugünkü dekorla
// çakışma yok. Onaylanan harita: https://claude.ai/artifact/YbqrWF1n4H9F96QMsMr1tv
//
// Sırt duvarın PROFİLİNE göre konur: yere oturan eşya çıtaya (0,26), asılan eşya gövdeye (0,18)
// değer — ikisi de `DUVAR_PAYI` önde. Aday karelerindeki "duvara gömülme" tam bu farktı.

export type VitrinDuvar = 'sol' | 'sag' | 'wc';

export interface VitrinYuva {
  id: string;
  duvar: VitrinDuvar;
  /** Duvar boyunca merkez (sol/sağ duvar → z · lavabo duvarı → x). */
  boy: number;
  /** Duvar boyunca genişlik · duvardan derinlik · alt/üst y (gövde kutusu). */
  w: number;
  d: number;
  y0: number;
  y1: number;
}

/**
 * Sol arka köşe: radyo · koltuk · lamba · üstte tablo. Sağ arka köşe: semaver · gramofon · kanarya.
 * Lavabo duvarı (kameranın tam karşısı): sarkaçlı saat. Yılbaşı koltuğu + halı sol önde, TV ile
 * askı rayı arasında — oyunun başından görünen tek yuva (kullanıcı A kolunu seçti).
 * Ölçüler modellerin ölçülmüş kutusundan (`kaykit` → `model-olc.mjs`): gövde = çizilen şey.
 */
export const VITRIN_YUVALARI: readonly VitrinYuva[] = [
  { id: 'radyo', duvar: 'sol', boy: -2.2, w: 0.9, d: 0.91, y0: 0, y1: 1.28 },
  { id: 'koltuk', duvar: 'sol', boy: -4.1, w: 1.26, d: 1.12, y0: 0, y1: 0.86 },
  { id: 'lamba', duvar: 'sol', boy: -5.5, w: 0.62, d: 0.62, y0: 0, y1: 1.55 },
  { id: 'tablo', duvar: 'sol', boy: -4.1, w: 1.1, d: 0.05, y0: 1.45, y1: 2.2 },
  { id: 'semaver', duvar: 'sag', boy: -2.2, w: 0.9, d: 0.9, y0: 0, y1: 1.4 },
  { id: 'gramofon', duvar: 'sag', boy: -4.0, w: 0.9, d: 0.9, y0: 0, y1: 1.55 },
  { id: 'kanarya', duvar: 'sag', boy: -5.6, w: 0.45, d: 0.45, y0: 0, y1: 1.85 },
  { id: 'saat', duvar: 'wc', boy: 8.2, w: 0.42, d: 0.16, y0: 1.0, y1: 2.1 },
  { id: 'yilbasi', duvar: 'sol', boy: 13.05, w: 1.4, d: 1.45, y0: 0, y1: 1.07 },
];

export const vitrinYuva = (id: string): VitrinYuva | undefined => VITRIN_YUVALARI.find((y) => y.id === id);

/** Salon duvarının hattı (dış kabuk) ve lavabo odasının ön duvarı (yükseklik 2,2). */
export const SALON_DUVAR_HAT = FLOOR_HALF + WALL_M;
export const WC_ON_DUVAR = { hat: BAND.front, h: 2.2, kapi: [LAVABO.door[0] - 0.7, LAVABO.door[0] + 0.7] } as const;

/** Duvar hattından oda tarafına taşan kalınlık, verilen y aralığında (en kalın katman kazanır). */
export function duvarProfili(y0: number, y1: number): number {
  let t = 0;
  if (y0 < WAINSCOT_H) t = Math.max(t, WALL_T_WAINSCOT / 2);
  if (y0 < RAIL_TOP && y1 > WAINSCOT_H) t = Math.max(t, WALL_T_RAIL / 2);
  if (y1 > WAINSCOT_H) t = Math.max(t, WALL_T_BODY / 2);
  return t;
}

export interface Kutu2 {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Yuvanın ankrajı: SIRTININ ortası (dünya) + oda yönüne bakan yaw. Çizim buradan yerleşir. */
export function yuvaAnkraj(y: VitrinYuva): { pos: [number, number, number]; rot: number } {
  const t = duvarProfili(y.y0, y.y1) + DUVAR_PAYI;
  if (y.duvar === 'wc') return { pos: [y.boy, y.y0, WC_ON_DUVAR.hat + t], rot: 0 };
  const s = y.duvar === 'sol' ? -1 : 1;
  return { pos: [s * (SALON_DUVAR_HAT - t), y.y0, y.boy], rot: -s * (Math.PI / 2) };
}

/** Yuvanın dünya gövde kutusu (xz). */
export function yuvaKutu(y: VitrinYuva): Kutu2 {
  const { pos } = yuvaAnkraj(y);
  if (y.duvar === 'wc') return { minX: y.boy - y.w / 2, maxX: y.boy + y.w / 2, minZ: pos[2], maxZ: pos[2] + y.d };
  const ic = pos[0] + (y.duvar === 'sol' ? y.d : -y.d);
  return { minX: Math.min(pos[0], ic), maxX: Math.max(pos[0], ic), minZ: y.boy - y.w / 2, maxZ: y.boy + y.w / 2 };
}

/** Gövde ile duvar profili arası en küçük boşluk (eksi = gömülü / duvardan taşıyor / kapının önünde). */
export function yuvaDuvarPayi(y: VitrinYuva): number {
  const k = yuvaKutu(y);
  if (y.duvar === 'wc') {
    if (y.y1 > WC_ON_DUVAR.h) return WC_ON_DUVAR.h - y.y1;
    if (k.maxX > WC_ON_DUVAR.kapi[0] && k.minX < WC_ON_DUVAR.kapi[1]) return -1;
    return k.minZ - (WC_ON_DUVAR.hat + duvarProfili(y.y0, y.y1));
  }
  if (y.y1 > WALL_H) return WALL_H - y.y1;
  const yuz = SALON_DUVAR_HAT - duvarProfili(y.y0, y.y1);
  return y.duvar === 'sol' ? k.minX + yuz : yuz - k.maxX;
}

/** Yuvanın alanı (0 ön-sol · 1 ön-sağ · 2 arka yarı) — alan açılmadan yuva çizilmez (D-057). */
export function yuvaAlani(y: VitrinYuva): number {
  const k = yuvaKutu(y);
  const cx = Math.max(-FLOOR_HALF + 0.01, Math.min(FLOOR_HALF - 0.01, (k.minX + k.maxX) / 2));
  const cz = Math.max(BAND.front + 0.01, Math.min(FLOOR_HALF - 0.01, (k.minZ + k.maxZ) / 2));
  return LAYOUT.areaBounds.findIndex((a) => cx >= a.minX && cx <= a.maxX && cz >= a.minZ && cz <= a.maxZ);
}
