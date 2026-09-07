/**
 * actor.ts — AKTÖR ÖLÇÜSÜNÜN TEK KAYNAĞI (D-076).
 *
 * NEDEN VAR: D-075'te kök sebep ölçüldü — maketin insanı **1,80**, oyunun karakteri **1,29**.
 * Maketin mobilyası 1:1 alınınca karakterin yanında %38 büyük kalıyordu. İki çıkış vardı
 * (mobilyayı kıs ↔ karakteri büyüt); kullanıcı **karakteri büyütmeyi** seçti — böylece D-073/D-075
 * ile dondurulan mobilya ölçüleri (masa 0,75 · tabla üstü 0,795 · tabure oturağı 0,45) yerinde kaldı.
 *
 * ÖLÇÜM (değişiklikten ÖNCE, gövdeler koddan okunarak — `tools/shot-oran.mjs` doğruladı):
 *
 * | aktör            | author boy | ZEMİNDEN görünen | kusur                                  |
 * |------------------|-----------:|-----------------:|----------------------------------------|
 * | sahip (Player)   |       1,29 |             1,29 | —                                      |
 * | garson           |       1,24 |             1,17 | kapsül 0,07 zeminin ALTINDA            |
 * | bulaşıkçı        |       1,24 |             1,17 | aynı kapsül                            |
 * | müşteri          |       1,20 |         **0,60** | kapsül y=0'da MERKEZLİ → yarısı gömülü |
 * | çaycı (KitchenHand) |    1,08 |             1,08 | belirgin kısa                          |
 *
 * Yani ortada tek bir "karakter boyu" hiç yoktu: beş gövde, beş farklı boy, ikisi zemine gömülü.
 * Bu dosya o beşini TEK sayıya bağlar (`ACTOR_HEIGHT`); gövdeler yazıldıkları ham boyda kalır,
 * mount noktasında `actorScale()` ile hedef boya çekilir. Gövde geometrisini düzenleyen kişi
 * `AUTHORED_HEIGHT`'taki sayıyı da günceller — başka hiçbir yerde boy yazmaz.
 */

/**
 * HEDEF BOY (dünya birimi = metre). Maketin insanı 1,80; oyun 1,75'te duruyor çünkü kabul
 * kriteri mobilyayla ORAN: masa üstü 0,795 = boyun **%45**'i (gerçek hayatta 0,75/1,75 = %43),
 * tabure oturağı 0,45 = **%26** (gerçek 0,45/1,75 = %26). 1,29'da bu oranlar %62 ve %35'ti.
 */
export const ACTOR_HEIGHT = 1.75;

/**
 * Her gövdenin YAZILDIĞI ham boy (zemin y=0'dan gövdenin tepesine). Ölçek bundan türer, yani
 * bir gövdeyi yeniden çizen kişi burayı güncellemek zorunda — aksi hâlde o aktör yanlış boya gelir
 * ve `tests/actor-scale.test.ts` bunu yakalar.
 */
export const AUTHORED_HEIGHT = {
  /** Player.OwnerBody: kasket tepesi 1,24 + 0,05 (silindir yarısı). */
  owner: 1.29,
  /** Waiter: kapsül + tepsi; kapsül merkezi boyun yarısında. */
  waiter: 1.24,
  /** Dishwasher: garsonun kapsülünün aynısı. */
  dishwasher: 1.24,
  /** Scene.KitchenHand: baş küresi 0,95 + 0,13. */
  kitchenHand: 1.08,
} as const;

export type ActorKind = keyof typeof AUTHORED_HEIGHT;

/** Gövdeyi yazıldığı ham boydan `ACTOR_HEIGHT`'a çeken düzgün ölçek. */
export const actorScale = (kind: ActorKind): number => ACTOR_HEIGHT / AUTHORED_HEIGHT[kind];

/**
 * GREYBOX KAPSÜL GÖVDENİN NİHAİ YARIÇAPI (garson · bulaşıkçı · müşteri).
 *
 * Kapsüller BOYUNA uzar, ENİNE DEĞİL. İlk turda hepsi düzgün ölçeklenmişti ve kapsüller
 * blob'a döndü: yarıçap 0,30 → 0,44, yani **88 cm omuz** — 1,75'lik bir insan için iki katı.
 * Otururken tabureyi tamamen yutuyorlardı (kare: `docs/gorsel/ss/oran-sonra-masa.png`).
 * 0,30 = 60 cm genişlik: gerçek omuz (~45 cm) + low-poly payı.
 *
 * Sahip ve çaycı bu kuralın DIŞINDA: onlar kapsül değil PARÇALI gövde (omuz · kol · baş ayrı
 * mesh), ve o parçaların birbirine oranı gövdenin kendi tasarımı — düzgün ölçeklenirler.
 */
export const CAPSULE_RADIUS = 0.3;

/**
 * Kapsülün gövdenin İÇİNDE yazılacak ham yarıçapı: mount'taki `actorScale` uygulanınca tam
 * `CAPSULE_RADIUS`'a gelir. Böylece tepsi gibi aksesuarlar gövdeyle birlikte ölçeklenmeye devam
 * eder (elde kalırlar), kapsül ise enine şişmez.
 */
export const authoredRadius = (kind: ActorKind): number => CAPSULE_RADIUS / actorScale(kind);

/**
 * OTURAN müşterinin düşey kayması. Kapsül oturamaz (gerçek oturuş pozu Faz 6'da skinned modelle
 * gelir); greybox karşılığı gövdeyi indirip taburenin üstünde YALNIZ ÜST GÖVDEYİ bırakmaktır.
 * Hedef: 1,75'lik biri 0,45'lik tabureye oturunca baş tepesi ≈ **1,30** (oturma yüksekliği 0,85).
 * Kayma = 1,30 − 1,75.
 *
 * NOT: bu kayma YALNIZ `waitingForTea`/`drinking` durumlarında uygulanır. Eskiden yürüyen müşteri
 * de aynı miktarda gömülüydü (kapsül y=0'da merkezliydi) — o bir kusurdu, oturuş numarası değil.
 */
export const SEATED_DROP = 1.3 - ACTOR_HEIGHT;

/** Baloncuğun (☕ bekliyor) baş üstündeki yüksekliği — boydan türer, elle yazılmaz. */
export const BUBBLE_Y = ACTOR_HEIGHT + 0.15;

/**
 * KAMERANIN BAKTIĞI YÜKSEKLİK. 0,6 idi = 1,29'luk gövdenin göğsü; aynı oran (%46) 1,75'te 0,80.
 * Kamera MESAFESİ (taban 8,5) bilerek DEĞİŞMEDİ: o sayı odanın kadrajını anlatır (D-061 —
 * "bir banket adası tam sığar") ve oda büyümedi. Karakterin kadrajda %36 büyümesi bu işin AMACI.
 */
export const CAMERA_LOOK_Y = 0.8;

/**
 * GÖVDE YARIÇAPLARI — engel-kaçınma (nav + collision standoff). Gövde büyüyünce bunlar da büyür;
 * eski değerler 1,29'luk gövdeye göreydi. Oran korunur, sayı türetilir:
 *   playerRadius 0,35 (omuz 0,29 × 1,21) · actorRadius 0,28 (kapsül 0,32'nin 0,88'i).
 * Bağlı olan: `REACH_TABLE` (= tableHalf + actorRadius + NAV_CELL + 0,05) ve nav ızgarasının
 * engel şişirmesi. `layout.ts` bunları buradan okur.
 */
export const PLAYER_RADIUS = round2(0.35 * actorScale('owner'));
/**
 * Personel yarıçapı DEĞİŞMEDİ (0,28). Sebep yukarıda: kapsül gövdeler enine büyümedi, yalnız
 * uzadı — nav'ın gördüğü kesit aynı kaldı. Büyüyen tek şey sahibin PARÇALI gövdesi (omuz 0,29 →
 * 0,39), o yüzden yalnız `PLAYER_RADIUS` türetiliyor.
 */
export const ACTOR_RADIUS = 0.28;

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
