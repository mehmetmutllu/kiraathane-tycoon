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
import type { Vec3 } from '../game/types';

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

// ───────────────────────────────────────────────────────────────────────────────
// KAYKIT KARAKTERLERİ (S14 · D-112) — ölçüm: `docs/karakter-raporu-s14.md`
// ───────────────────────────────────────────────────────────────────────────────

/** Karakter dosyalarının kökü. Hepsi CC0; künye `public/assets/README.md`. */
export const KAY_KOK = '/assets/models/kaykit-characters/';

/**
 * Klip dosyaları. KayKit klipleri gövdeden AYRI dosyalarda tutuyor ve hepsi aynı `Rig_Medium`
 * iskeletine (23 kemik) bağlı — ölçüldü: klipler gövdeye **69/69 iz** tutuyor, retarget yok.
 * Dövüş/büyü dosyaları bilerek ALINMADI (repo bedeli §B9).
 */
export const KAY_KLIPLER = [
  'Rig_Medium_General', // Idle_A/B · Interact · PickUp · Use_Item
  'Rig_Medium_MovementBasic', // Walking_A/B/C · Running_A/B
  'Rig_Medium_Simulation', // Sit_Chair_Down/Idle/StandUp · Waving
  'Rig_Medium_Tools', // Holding_A/B/C · Working_A/B/C
] as const;

/**
 * TEK ÖLÇEK, bütün gövdeler için. Gövdeler farklı ham yüksekliklerde ÖLÇÜLÜYOR (2,16…2,63) ama
 * fark **saç/sakal geometrisinden** geliyor: hepsi aynı iskeleti paylaşıyor ve bacak mesh'i
 * hepsinde 0,00…0,53. Ölçek bu yüzden gövdeye göre değil İSKELETE göre sabitlenir — yoksa uzun
 * saçlı karakter kısa boylu çizilirdi. Referans manken gövdesi: ham 2,204 → `ACTOR_HEIGHT`.
 */
export const KAY_AUTHORED = 2.204;
export const KAY_SCALE = ACTOR_HEIGHT / KAY_AUTHORED;

/**
 * Rolden gövdeye eşleme. Gövdeler KayKit Adventurers'tan; **ekipman düğümleri gizlenir**
 * (pelerin/miğfer/şapka ayrı mesh — ölçüldü, §B3) ve gövde/bacak oyunun paletine boyanır.
 * BAŞ boyanmaz: yüz, saç ve sakal başın kendi dokusundan gelir (boyanınca saç da ten oluyordu).
 */
export const KAY_MODEL = {
  owner: 'Ranger', // bıyıklı — kasket + bordo önlükle çaycı
  waiter: 'Knight', // sarışın genç — önlüklü garson
  dishwasher: 'Rogue', // kadın — önlüklü
  kitchenHand: 'Barbarian', // ak sakallı usta — kasket + önlük
} as const;

/** Rolün üstüne takılan kimlik parçaları (kasket/önlük). Gövdede yok, bizim. */
export const KAY_KIYAFET: Record<ActorKind, { kasket: boolean; onluk: boolean }> = {
  // Sahibin kasketi S15'te KALKTI (kullanıcı 2026-09-14: "ana karakterdeki kasketi çıkar").
  // Mutfak elemanında duruyor — usta kimliğini o taşıyor.
  // PATRON ONLUK TAKMAZ (S18): onluk personelin UNIFORMASI, patronun degil. Ayirt edici
  // isaret bu yoklukla koyu lacivert gomlegin birlesimi — gerekce `KayActor.parcaRenk`.
  owner: { kasket: false, onluk: false },
  waiter: { kasket: false, onluk: true },
  dishwasher: { kasket: false, onluk: true },
  kitchenHand: { kasket: true, onluk: true },
};

/**
 * KAFA KEMİĞİ ÖLÇEĞİ (S15 · D-113) — "kafalar çok büyük duruyo, baya küçült".
 *
 * ÖLÇÜM (`docs/karakter-raporu-s15.md` §K): KayKit başı gövde boyunun **%42-52**'si; bugüne
 * kadarki ilkel gövdede %33'tü. Başı `head` kemiğinden küçültmenin iki yolu ölçüldü:
 *
 *   TELAFİLİ   — toplam boy 1,75'te tutulur, gövde o boyu doldurmak için büyür. ×0,80'de
 *                omuz 0,616'ya çıkıyor ve D-076'nın blob kuralını (0,60) KIRIYOR.
 *   TELAFİSİZ  — gövde ölçeği (`KAY_SCALE`) hiç değişmez, karakter kısalır. Omuz beş kolda da
 *                0,552; bacak/gövde/kalça kıpırdamadığı için masa, tabure ve tepsiyle olan
 *                ilişkinin tamamı BİREBİR aynı kalır. Kısalan tek şey siluetin tepesi.
 *
 * Seçilen: TELAFİSİZ ×0,75 → baş payı %42 → ~%36, siluet 1,75 → ~1,52. Bu sayı `KAY_SCALE`'i
 * ETKİLEMEZ; o yüzden `ACTOR_HEIGHT` ve ondan türeyen hiçbir şey (SEATED_DROP, PLAYER_RADIUS,
 * BUBBLE_Y, CAMERA_LOOK_Y, nav) kıpırdamaz — kol bilerek bu yüzden seçildi.
 */
export const KAY_KAFA_OLCEK: number = 0.75;

/**
 * KLİPLERİN YAZILI YER HIZI (br/sn) — `docs/olcum-yuruyus.json` §S_senkron'dan, tam koşu damgalı.
 *
 * Bir yürüme klibi belli bir yer hızı için çizilir: basılı ayak, gövde sabitken geriye kayar ve
 * kaydığı mesafe o döngünün ilerlemesidir. Karakter bundan hızlı giderse ayak kayar — kullanıcının
 * 2026-09-14'te bildirdiği "havada süzülüyor" kusuru budur. Ölçüldü: `Walking_A` **0,571** br/sn
 * için çizilmiş, oyuncu 4,5-5,4 br/sn gidiyor → ayak **7,9-9,5 katı** kayıyordu.
 *
 * Sayılar HAM rig hızının `KAY_SCALE` ile çarpılmışıdır; `KAY_SCALE` değişirse bunlar da değişir
 * (`tests/karakter.test.ts` bu bağı denetler).
 */
export const KLIP_HIZI: Record<string, number> = {
  Walking_A: 0.571,
  Walking_B: 0.655,
  Running_A: 1.247,
};

/**
 * `timeScale` KELEPÇESİ. Tavan, gerçek insanın sprint kadansından (4,5 adım/sn) türer:
 * `Running_A` 2,50 adım/sn çalıyor → 4,5 / 2,50 = **1,80**. Üstünde bacak değil pervane olur.
 * Taban, çok yavaş aktörün yerinde tepinmemesi için; altında klip donuk görünür.
 *
 * Tavan yüzünden oyuncunun (4,5-5,4 br/sn) kayması SIFIRLANMAZ: kelepçede klip 2,24 br/sn taşır,
 * geriye **2,0×** artık kayma kalır — bugünkü 7,9×'ın dörtte biri. Sıfırlamanın tek yolu oyuncu
 * hızını düşürmek; o `economy.config.ts`'e dokunur, varyant kapısına tabidir ve ÖLÇÜLMEDİ.
 */
export const TIMESCALE_TAVAN = 1.8;
export const TIMESCALE_TABAN = 0.6;

/**
 * OTURAN SKINNED GÖVDENİN KÖK KALDIRMASI (S15 · D-113) — `SEATED_DROP`un gerçek karşılığı.
 *
 * `SEATED_DROP` (−0,45) bir NUMARAydı: kapsül oturamadığı için gövde aşağı indirilip taburenin
 * üstünde yalnız üst gövde bırakılıyordu. Gerçek `Sit_Chair_Idle` klibinde gövde ZATEN oturuyor;
 * sorulacak sayı "rig kökü hangi yükseklikten asılsın ki kalça taburenin oturağına gelsin".
 *
 * ÖLÇÜM (`docs/olcum-yuruyus.json` §Oturus): klipte kalça ham 0,481 → dünyada **0,382**.
 * Tabure oturağı 0,45 (donmuş, D-073) → kaldırma = 0,45 − 0,382 = **0,068**.
 * (Aynı klipte ayak 0,322'de duruyor: KayKit oturuşu ayakları toplayan bir poz, yere basmıyor.)
 */
export const KAY_OTURMA_KALDIRMA = 0.068;

/**
 * SKINNED MÜŞTERİ BÜTÇESİ. Ölçüldü (`tools/skin-perf.mjs 24 Knight`, RTX 3060):
 * 24 birleşik skinned = **1,01 ms/kare · 24 çizim · 140 bin üçgen**; aynı sayıda 6 parçalı
 * gövde 3,44 ms ve 216 çizim tutuyordu, bugünkü instanced kapsül ise 0,04 ms ve 1 çizim.
 *
 * TAVAN NEDEN 48: `maxConcurrent` geç oyunda `totalSeats + 2`ye çıkıyor. Oyun içinde ÖLÇÜLDÜ —
 * yalnız 12 masa açıkken **38 eşzamanlı müşteri** vardı (`docs/gorsel/ss/s15-oyun-genis.png`),
 * yani ilk seçilen 24'lük tavan normal oyunda aşılıyor ve aşanlar kapsül olarak duruyordu.
 * Ölçülen bedel (RTX 3060, 120 kare ortalaması, baş+gövde biçimi):
 *
 *   | müşteri | ms/kare | çizim |
 *   |--------:|--------:|------:|
 *   |      24 |    0,52 |    48 |
 *   |      48 |    1,00 |    96 |
 *   |      80 |    1,57 |   112 |   (frustum culling devrede)
 *
 * TAVAN 80 (kullanıcı kararı, 2026-09-14): **kapsül hiç görünmesin.** `maxConcurrent` geç oyunda
 * `totalSeats + 2`ye çıkıyor ve 24 masa tam açıkken müşteri 70'i geçebiliyor; 48'lik tavanda o
 * durumda kapsüller yine belirirdi. 80, oyunun üretebildiği en yüksek sayının üstünde kalır.
 *
 * Kapsül kolu yine de SİLİNMEDİ: tavan bir gün aşılırsa müşteri kaybolmasın, kapsüle düşsün.
 * Sessizce yok olmak, çirkin çizilmekten kötüdür.
 *
 * MOBİLDE ÖLÇÜLMEDİ: bunlar masaüstü sayısıdır, telefonda tipik 4-6 katı. APK turu ister.
 */
export const NPC_SKIN_CAP = 80;

/** Müşteri gövdeleri. Kapüşonlu Rogue bilerek YOK: kapüşonu ekipman süzgecine takılmıyor (S14). */
export const KAY_MUSTERI_GOVDE = ['Knight', 'Rogue', 'Mage', 'Barbarian', 'Ranger'] as const;

/**
 * TAŞINAN EŞYANIN ÇAPASI (S16'dan beri ELE BAĞLI).
 *
 * ESKİDEN: tepsi gövdenin yanında SABİT bir dünya noktasına asılıydı (`KAY_EL_Y` 0,953 /
 * `KAY_EL_Z` 0,437). Ölçüm kusuru gösterdi (`docs/olcum-tepsi.json`): taşırken oynayan klipte
 * eller **0,66**'da duruyor, yani tepsi ellerin **29 cm üstünde** ve göğse yapışık kalıyordu;
 * üstelik kollar boşta sallanıyordu (kullanıcı 2026-09-14: *"elde tepsi tutma falan sorun"*).
 *
 * ŞİMDİ: `KayActor` taşınan eşyanın grubunu her kare **iki `handslot` kemiğinin ORTASINA**
 * taşıyor (KayKit'in kendi eşya çapaları) ve taşırken üst gövde `Holding_A` oynuyor — eller
 * önde, kıpırdamadan (ölçüldü: el oynaması 0,002).
 *
 * Aşağıdaki kaymaların TEK işi, taşınan bileşenlerin İÇLERİNDEKİ çapayı sıfırlamaktır:
 * `CupTray` kendini [0, 1,00, 0,45]'te, `WaiterTray` ve `CarriedDirty` [0, 0,95, 0,40]'ta
 * çiziyor ve o sayılara dokunulamıyor — aynı bileşenleri karakter paneli de kullanıyor.
 * Negatifleri, bileşeni grubun orijinine (yani ELE) getirir.
 */
export const KAY_TEPSI_KAYMA: Vec3 = [0, -1.0, -0.45];
export const KAY_GARSON_TEPSI_KAYMA: Vec3 = [0, -0.95, -0.4];
