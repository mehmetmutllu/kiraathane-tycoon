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
 *  1. **DUVAR 1,2 BİRİM** (`wallPanel.WALL_H`), makette 3,2. Oyunun duvarı bir KESİT duvarıdır;
 *     kamera tepeden baktığı için tavana çıkmaz. Maketin y = 1,85…2,20'deki duvar programı bu
 *     duvara SIĞMAZ. Buradan çıkan asıl karar: **ağır öğeler duvardan indi, zemine oturdu.**
 *     TV ve konsol artık asılı değil AYAKLI — 45°'lik kamera bir dolabın ÜST YÜZEYİNİ, dar bir
 *     duvar şeridinden çok daha iyi okuyor, ve "havada obje" kusuru kökten kapanıyor. (Oyunda TV
 *     bugüne kadar y = 1,85'te, yani 1,2'lik duvarın ÜSTÜNDE havada duruyordu.)
 *     Duvarda kalanlar yalnız İNCE öğeler: askı rayı · tablo · aplik · saat · pencere.
 *  2. **KAMERA −z'ye BAKAR** (oyuncunun 8,5 arkasından, 45°). Üç sonucu var:
 *     - ÖN duvarın (z = +17,5) İÇ yüzü hiçbir kadrajda görünmez; kamera hep onun iç tarafındadır.
 *       Maketin "giriş holü" duvar öğeleri (tablo · saat) oraya asılırsa hiç okunmaz → giriş
 *       hissi duvarla değil **kapının iki yanındaki düşey siluetlerle** kuruluyor (askılık ·
 *       şemsiyelik · lamba · saksı), hepsi arkadan da okunan hacimler.
 *     - SOL ve SAĞ duvarların iç yüzleri her kadrajda görünür → duvar programı oraya iner.
 *     - Kapıdan kuzeye giden koridoru iki yandan saksıyla çerçevelemek, "hol ↔ salon" ayrımını
 *       tek hamlede kuruyor: boşluğu kıran şey obje SAYISI değil, boşluğun BÖLGELERE ayrılması.
 *
 * DÜŞEY ÖLÇEK: maketin düşey ölçüleri ~**0,72** ile çarpılır (maket insanı ~1,8 · oyun karakteri
 * 1,3 · maket masası 0,72 · oyun masası 0,52). PLAN (x, z) ölçüleri **1:1** — kat ikisinde de 34 × 34.
 *
 * HALI YOK: kullanıcı üç kez reddetti ("zemini tek renk ayarla yeter"); maket v13 de ön
 * çeyreklerde halı taşımaz. Zemindeki tek dokuma parça **kapı paspasıdır** ve o da kapıyla
 * birlikte yer değiştirir.
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
import { FLOOR_HALF, doorX } from '../game/layout';

/** Duvar öğelerinin ASILDIĞI düzlem: krem gövdenin yüzünün ~0,1 önü (tüm profilleri geçer). */
export const WALL_FACE = FLOOR_HALF + 0.32;
/** Zemine oturan ama duvara YASLANAN öğelerin (konsol · TV ünitesi · petek) sırt hattı. */
export const WALL_BACK = FLOOR_HALF + 0.15;

/**
 * KESİK DUVARIN ASMA BANDI. Altında lambri kuşağı (0…0,50) + üstü çıtası (0,54), üstünde
 * kartonpiyer (1,15…1,20) var; asılan hiçbir şey bu iki profilin üstüne binmemeli.
 */
export const MOUNT = { mid: 0.86, high: 1.0 } as const;

export type DecorKind =
  | 'saksi' // küçük saksı (zemin)
  | 'buyukSaksi' // büyük saksı (zemin)
  | 'denizlikSaksi' // pencere denizliğindeki küçük çiçek
  | 'copKovasi' // çöp kovası (zemin)
  | 'askilik' // portmanto (zemin)
  | 'semsiyelik' // şemsiyelik (zemin)
  | 'gazetelik' // gazete/dergi sehpası (zemin)
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
  { kind: 'tablo', pos: [-WALL_FACE, 0.95, 6.0], rot: Math.PI / 2, from: 3, len: 1.2, h: 0.42 },
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
  { kind: 'pencere', pos: [WALL_FACE, 0.92, 2.6], rot: -Math.PI / 2, from: 2, len: 3.0, h: 0.48 },
  { kind: 'denizlikSaksi', pos: [WALL_FACE - 0.15, 0.71, 2.6], rot: -Math.PI / 2, from: 2 },
  { kind: 'aplik', pos: [WALL_FACE, MOUNT.high, 5.0], rot: -Math.PI / 2, from: 2 },
  { kind: 'pencere', pos: [WALL_FACE, 0.92, 7.4], rot: -Math.PI / 2, from: 2, len: 3.0, h: 0.48 },
  { kind: 'petek', pos: [WALL_BACK, 0, 7.4], rot: -Math.PI / 2, from: 2, len: 1.6 },
  { kind: 'aplik', pos: [WALL_FACE, MOUNT.high, 9.8], rot: -Math.PI / 2, from: 2 },
  { kind: 'pencere', pos: [WALL_FACE, 0.92, 12.2], rot: -Math.PI / 2, from: 2, len: 3.0, h: 0.48 },
  { kind: 'denizlikSaksi', pos: [WALL_FACE - 0.15, 0.71, 12.2], rot: -Math.PI / 2, from: 2 },
  { kind: 'gazetelik', pos: [16.4, 0, 14.4], rot: -Math.PI / 2, from: 2 },
];

/**
 * GİRİŞ — kapıya GÖRELİ olanlar `entryAtDoor()`te (kapı a1 açılınca x = −8,5'ten 0'a kayar,
 * onunla birlikte taşınmaları gerekiyor); burada sabit duranlar var. Askı rayı ve saat kapı
 * tarafındaki SOL duvarda, yani ilk andan itibaren görünür bandın içinde.
 */
const ENTRY: DecorItem[] = [
  { kind: 'askiRayi', pos: [-WALL_FACE, MOUNT.high, 15.2], rot: Math.PI / 2, from: 1, len: 2.2 },
  { kind: 'duvarSaati', pos: [-WALL_FACE, MOUNT.high, 13.0], rot: Math.PI / 2, from: 1 },
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
