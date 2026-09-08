/**
 * olcu-donduruldu.test.ts — **ÖLÇÜ KATMANININ BEKÇİSİ** (D-072 katman 1 · BM adım 6).
 *
 * D-072 karışıklığı üç katmana ayırdı ve aralarına TEK YÖNLÜ bir sıra koydu:
 *
 *   1 · ÖLÇÜ/ANKRAJ → 2 · SİSTEM (denge, fazlar) → 3 · SANAT CİLASI (dekor, materyal, ışık)
 *
 * Katman 1 bitti (BM adım 1-5). Bu dosya onu **DONDURUR**. Kural şu: katman 3'ün turları
 * sınırsızdır ama ankrajlara DOKUNAMAZ — çünkü katman 2'nin denge ölçümleri bu sayıların
 * üstüne kurulur ve ölçü sonradan değişirse o ölçümler ikinci kez yapılır. Faz B'nin bütçesi
 * (9 → 12 oturum) tam olarak bu yüzden düzeltilmişti.
 *
 * NEDEN BELGE DEĞİL TEST: "ölçüyü değiştirme" yazılı bir kural olarak zaten vardı ve üç kez
 * kendiliğinden ihlal edildi (D-074, D-075 ve D-076 turlarında mobilya ölçüsü üç kez değişti).
 * Yazılı kuralın yakalayamadığı şey sessiz sapmadır: bir cila turu `STOOL_S`'i 0,9'dan 0,85'e
 * çekse hiçbir test kırılmaz, kimse fark etmez, ve denge ölçümü yanlış zemine oturur.
 *
 * NASIL OKUNUR: aşağıdaki `SAYI` ve `NOKTA` tabloları dondurulmuş DEĞERLERDİR; `canli` alanı
 * ise o değerin BUGÜN kodun neresinden türediğini gösterir. Test ikisinin eşitliğini bekçiler.
 * Tablo **ikinci bir doğru kaynak değildir** — çalışan kod hâlâ kendi dosyalarından okur
 * (`actor.ts` · `camera.ts` · `layout.ts` · `tableLook.ts` · `wallPanel.tsx`); buradaki liste
 * yalnız testin gördüğü fotoğraftır.
 *
 * DEĞİŞTİRMEK İÇİN: sayıyı kodda değiştirmek testi kırar — ve kırması AMAÇTIR. Doğru sıra
 * (1) kullanıcı kararı → (2) `decisions.md`'ye D-xxx → (3) buradaki değer + `karar` alanı
 * güncellenir → (4) `docs/olcu-donduruldu.md` güncellenir. Testi susturarak geçme.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ACTOR_HEIGHT,
  ACTOR_RADIUS,
  AUTHORED_HEIGHT,
  BUBBLE_Y,
  CAMERA_LOOK_Y,
  CAPSULE_RADIUS,
  PLAYER_RADIUS,
  SEATED_DROP,
} from '../src/config/actor';
import {
  CAMERA_DIST,
  CAMERA_FOCUS_MUL,
  CAMERA_FOV,
  CAMERA_PORTRAIT_CLAMP,
  CAMERA_ZOOM_OUT_MUL,
  cameraDistance,
} from '../src/config/camera';
import {
  BAND,
  BAND_SHELL,
  BANKET,
  LAVABO,
  LAYOUT,
  NAV_CELL,
  NPC_SPEED,
  PAD_RADIUS,
  REACH_HOME,
  REACH_PICKUP,
  REACH_TABLE,
  TABLE_UP_RADIUS,
  WAITER_HOME_GAP,
  WAITER_STATION,
  doorX,
  entranceAt,
  servicePlace,
  streetAt,
} from '../src/game/layout';
import { STOOL_REF, STOOL_S, STOOL_SEAT_Y, TABLE_TOP_Y, tableWidth } from '../src/components/three/tableLook';
import { DOOR, WAINSCOT_H, WALL_H } from '../src/components/three/wallPanel';

/** Dondurulmuş bir sayı: değeri, onu donduran karar, ve bugün kodun neresinden türediği. */
interface Donmus {
  deger: number;
  karar: string;
  canli: () => number;
}

/** Dondurulmuş bir NOKTA (zeminde x/z; y hiçbir ankrajda anlam taşımıyor). */
interface DonmusNokta {
  deger: readonly [number, number];
  karar: string;
  canli: () => readonly [number, number];
}

const xz = (v: readonly number[]): readonly [number, number] => [v[0], v[2]];

// ---------------------------------------------------------------------------
// 1 · KAT KABUĞU — B3-1 (D-061/062) · BM adım 1 (D-073) · BM adım 3
// ---------------------------------------------------------------------------
const KABUK: Record<string, Donmus> = {
  'kat.yariBoy': { deger: 17, karar: 'D-061 (maket v13 ölçeği: 34 × 34)', canli: () => LAYOUT.area.maxX },
  'kat.enArkaKenar': { deger: -9.8, karar: 'D-062 (alanlar bandın önünde biter)', canli: () => BAND.front },
  'bant.arkaKenar': { deger: -16.9, karar: 'D-062', canli: () => BAND.back },
  'bant.odaDuvariY': { deger: 2.2, karar: 'BM adım 3 (maket: "kamera içeri görsün")', canli: () => BAND_SHELL.roomH },
  'duvar.yukseklik': { deger: 3.2, karar: 'D-073 (maket v13 WALL_H; 1,20 reddedildi)', canli: () => WALL_H },
  'duvar.lambri': { deger: 0.9, karar: 'D-073', canli: () => WAINSCOT_H },
  'kapi.yariGenislik': { deger: 2.2, karar: 'BM adım 1 (maketin giriş bloğu)', canli: () => DOOR.half },
  'kapi.yukseklik': { deger: 2.65, karar: 'BM adım 1 (maket `DH`)', canli: () => DOOR.height },
};

// ---------------------------------------------------------------------------
// 2 · MOBİLYA — BM adım 2 (D-073) · D-074 · D-075
// Bu blok üç turda üst üste değişti; donduran şey karakterin büyütülmesi oldu (D-076).
// ---------------------------------------------------------------------------
const MOBILYA: Record<string, Donmus> = {
  'masa.dortlu.tablaL0': { deger: 1.05, karar: 'D-075 (D-073ün 1,75i kısıldı)', canli: () => tableWidth('four', 0) },
  'masa.dortlu.tablaL3': { deger: 1.68, karar: 'D-075 (1,75 → 1,68)', canli: () => tableWidth('four', 3) },
  'masa.ikili.tablaL0': { deger: 0.9, karar: 'D-075 (D-074ün 1,00i kısıldı)', canli: () => tableWidth('deuce', 0) },
  'masa.ikili.tablaL3': { deger: 1.05, karar: 'D-075 (D-074ün 1,20si kısıldı)', canli: () => tableWidth('deuce', 3) },
  'masa.tablaUstu': { deger: 0.795, karar: 'D-073 (masa yüksekliği 0,75 kullanıcı kararıyla DONDU)', canli: () => TABLE_TOP_Y },
  'tabure.olcek': { deger: 0.9, karar: 'D-075 (D-074ün 1,11i kısıldı)', canli: () => STOOL_S },
  'tabure.greyboxReferans': { deger: 1.11, karar: 'maketin `stool()`ı — greybox yedeği bu ölçekte yazılı', canli: () => STOOL_REF },
  'tabure.oturakUstu': { deger: 0.45, karar: 'D-075 (türev: 0,555 × 0,90/1,11)', canli: () => STOOL_SEAT_Y },
  'masa.dortlu.footprint': { deger: 0.84, karar: 'D-075 (tabla 1,68in yarısı)', canli: () => LAYOUT.tableHalf[0] },
  'masa.ikili.footprint': { deger: 0.525, karar: 'D-075 (tabla 1,05in yarısı)', canli: () => LAYOUT.deuceHalf[0] },
  'tabure.footprint': { deger: 0.3, karar: 'D-076 (tabure gövdesi; OTURAN kişi katı değil)', canli: () => LAYOUT.chairHalf[0] },
  'koltuk.ofset': { deger: 1.45, karar: 'D-073 (maketin SEATS4ü)', canli: () => LAYOUT.chairSpots[0][1] },
};

// ---------------------------------------------------------------------------
// 3 · YERLEŞİM RİTMİ — masa kümesi + banket adaları
// ---------------------------------------------------------------------------
const RITIM: Record<string, Donmus> = {
  'masa.kumeAraligi': {
    deger: 6.4,
    karar: 'D-073 (1,6lık şerit ızgarası yanlışlıkla ön çeyreğe de uygulanmıştı)',
    canli: () => LAYOUT.tables[1].table[0] - LAYOUT.tables[0].table[0],
  },
  'masa.yukseltmeOfseti': {
    deger: 2.15,
    karar: 'D-073 (nokta koltuğun 1,45inin DIŞINDA kalmalı)',
    canli: () => LAYOUT.tables[0].upgradeSpot[0] - LAYOUT.tables[0].table[0],
  },
  'banket.ekseni': { deger: -3.8, karar: 'B3-2 (maketin −2,95i 0,85 geri alındı: iki yüz de alanının içinde)', canli: () => BANKET.z },
  'banket.gorselDerinlik': { deger: 2.5, karar: 'B3-2 (maket)', canli: () => BANKET.depth },
  'banket.collisionYariDerinlik': { deger: 0.4, karar: 'B3-2 (yalnız sırtlık çekirdeği — 2,5 katı olursa BFS koltuğa giremiyor)', canli: () => BANKET.coreHalf },
  'banket.sutunAraligi': { deger: 3.2, karar: 'B3-2 (maket)', canli: () => BANKET.colGap },
  'banket.ucPayi': { deger: 0.6, karar: 'B3-2 (maket)', canli: () => BANKET.endPad },
  'banket.disUc': { deger: 12.3, karar: 'D-064 (ada TAM BOY doğar, uç sabit)', canli: () => BANKET.outerX },
  'banket.sutunSayisi': { deger: 3, karar: 'D-064 (boy 7,6 — maket)', canli: () => BANKET.cols },
  'banket.bankOturagi': { deger: 0.74, karar: 'B3-2 (maket)', canli: () => BANKET.benchDz },
  'banket.masaMesafesi': { deger: 2.0, karar: 'D-075 (1,85 → 2,00: kullanıcı masayı banketten uzaklaştırdı)', canli: () => BANKET.tableDz },
  'banket.sandalyeMesafesi': { deger: 3.02, karar: 'D-075 (2,95 → 3,02: masayla arasındaki 0,16 korundu)', canli: () => BANKET.chairDz },
  'banket.koridorNoktasi': { deger: 3.5, karar: 'D-075 (3,65 denendi, `waiter` padinin dairesine giriyordu)', canli: () => BANKET.aisleDz },
};

// ---------------------------------------------------------------------------
// 4 · AKTÖR — BM adım 5 (D-076)
// ---------------------------------------------------------------------------
const AKTOR: Record<string, Donmus> = {
  'aktor.boy': { deger: 1.75, karar: 'D-076 (1,29 → 1,75; mobilya KISILMADI)', canli: () => ACTOR_HEIGHT },
  'aktor.kapsulYaricapi': { deger: 0.3, karar: 'D-076 (kapsül boyuna uzar, enine şişmez)', canli: () => CAPSULE_RADIUS },
  'aktor.oyuncuYaricapi': { deger: 0.47, karar: 'D-076 (0,35 × ölçek — sahibin PARÇALI gövdesi enine de büyüdü)', canli: () => PLAYER_RADIUS },
  'aktor.personelYaricapi': { deger: 0.28, karar: 'D-076 (DEĞİŞMEDİ: kapsül kesiti aynı kaldı)', canli: () => ACTOR_RADIUS },
  'aktor.oturmaKaymasi': { deger: -0.45, karar: 'D-076 (baş tepesi 1,30)', canli: () => SEATED_DROP },
  'aktor.baloncukY': { deger: 1.9, karar: 'D-076 (türev: boy + 0,15)', canli: () => BUBBLE_Y },
  'govde.sahip': { deger: 1.29, karar: 'yazıldığı ham boy (ölçek bundan türer)', canli: () => AUTHORED_HEIGHT.owner },
  'govde.garson': { deger: 1.24, karar: 'yazıldığı ham boy', canli: () => AUTHORED_HEIGHT.waiter },
  'govde.bulasikci': { deger: 1.24, karar: 'yazıldığı ham boy', canli: () => AUTHORED_HEIGHT.dishwasher },
  'govde.cayci': { deger: 1.08, karar: 'yazıldığı ham boy', canli: () => AUTHORED_HEIGHT.kitchenHand },
};

// ---------------------------------------------------------------------------
// 5 · KAMERA — BM adım 4, karar D-076
// ---------------------------------------------------------------------------
const KAMERA: Record<string, Donmus> = {
  'kamera.fov': { deger: 50, karar: 'D-076 (34 ölçüldü ve REDDEDİLDİ: %16 düzleşme, sis %29 → %84)', canli: () => CAMERA_FOV },
  'kamera.mesafe': { deger: 8.5, karar: 'D-061 (bir banket adası tam sığar); D-076da bilerek DEĞİŞMEDİ', canli: () => CAMERA_DIST },
  'kamera.portreTavani': { deger: 1.3, karar: 'D-061', canli: () => CAMERA_PORTRAIT_CLAMP },
  'kamera.uzaklasKademesi': { deger: 1.35, karar: 'D-061 (8,5 ↔ 11,5)', canli: () => CAMERA_ZOOM_OUT_MUL },
  'kamera.odakYakinlasmasi': { deger: 0.72, karar: 'quest odağı', canli: () => CAMERA_FOCUS_MUL },
  'kamera.bakisY': { deger: 0.8, karar: 'D-076 (gövdenin %46sı — 1,29daki 0,60ın karşılığı)', canli: () => CAMERA_LOOK_Y },
};

// ---------------------------------------------------------------------------
// 6 · NAV + ERİŞİM KATILARI — yürüme döngüsünün geometrisi (denge ölçümü bunlara oturur)
// ---------------------------------------------------------------------------
const NAV: Record<string, Donmus> = {
  'nav.hucreBoyu': { deger: 0.3, karar: 'B3-1 (masalar arası koridorları açık tutar)', canli: () => NAV_CELL },
  'erisim.masa': {
    deger: 1.47,
    karar: 'B3-1 türevi: tableHalf + actorRadius + NAV_CELL + 0,05 (ızgara yuvarlaması dahil)',
    canli: () => REACH_TABLE,
  },
  'erisim.tepsi': { deger: 0.45, karar: '2026-06-11 (çay ÖN yüzden alınır)', canli: () => REACH_PICKUP },
  'erisim.kose': { deger: 0.4, karar: 'boştayken köşeye dönüş', canli: () => REACH_HOME },
  'pad.yaricap': { deger: 1.3, karar: 'Faz 2', canli: () => PAD_RADIUS },
  'masa.yukseltmeYaricapi': { deger: 1.0, karar: 'Faz 2h (padden küçük → komşu masayı tetiklemez)', canli: () => TABLE_UP_RADIUS },
  'personel.beklemeAraligi': { deger: 0.7, karar: 'B6a (garson sırasının ritmi)', canli: () => WAITER_HOME_GAP },
  'npc.hiz': { deger: 2.6, karar: 'Faz 2', canli: () => NPC_SPEED },
};

// ---------------------------------------------------------------------------
// 7 · NOKTALAR — pad'ler, kapı, servisin iki dönemi
// ---------------------------------------------------------------------------
const NOKTA: Record<string, DonmusNokta> = {
  'kapi.x.tekAlan': { deger: [-8.5, 16.6], karar: 'maket v13 adım 1 (ilk salonun cephesi)', canli: () => xz(entranceAt(1)) },
  'kapi.x.ikiAlan': { deger: [0, 16.6], karar: 'maket v13 adım 2 (binanın kapısı ortaya kayar)', canli: () => xz(entranceAt(2)) },
  'kaldirim': { deger: [-8.5, 20.5], karar: 'müşterinin belirdiği nokta', canli: () => xz(streetAt(1)) },
  'oyuncu.dogusYeri': { deger: [-8.5, 13.4], karar: 'B3-1', canli: () => xz(LAYOUT.player) },
  'pad.garson': { deger: [-12.4, 2.0], karar: 'B3-1', canli: () => xz(LAYOUT.padPos.waiter) },
  'pad.bulasikci': { deger: [-13.4, 10.6], karar: 'B3-1', canli: () => xz(LAYOUT.padPos.dishwasher) },
  'pad.alan2': { deger: [-1.6, 8.5], karar: 'B3-1 (alanın eşiğinde, AÇIK tarafta)', canli: () => xz(LAYOUT.padPos.zone2) },
  'pad.alan3': { deger: [2.0, 1.8], karar: 'B3-1', canli: () => xz(LAYOUT.padPos.zone3) },
  'pad.garson2': { deger: [-14.7, -5.0], karar: 'B5a (koridordan adanın dış ucunun ötesine çekildi)', canli: () => xz(LAYOUT.padPos.waiter2) },
  'pad.garson3': { deger: [14.7, -5.0], karar: 'B5a', canli: () => xz(LAYOUT.padPos.waiter3) },
  'lavabo.kapi': { deger: [13.4, -9.3], karar: 'B4 (pad + yükseltme noktası + müşteri hedefi AYNI nokta)', canli: () => xz(LAVABO.spot) },
  'lavabo.paraIstifi': { deger: [13.4, -8.4], karar: 'B4', canli: () => xz(LAVABO.coinSpot) },
  'servis.solDuvar.tezgah': { deger: [-16.2, 6.4], karar: 'maket v13 adım 1-2', canli: () => xz(servicePlace(1).station) },
  'servis.solDuvar.tepsi': { deger: [-15.0, 6.4], karar: 'D-025', canli: () => xz(servicePlace(1).pickup) },
  'servis.solDuvar.bulasik': { deger: [-16.2, 10.6], karar: 'D-025 (bulaşık ocağın yanında)', canli: () => xz(servicePlace(1).dish) },
  'servis.arkaBant.tezgah': { deger: [-13.0, -10.3], karar: 'D-074 (küme mutfağın İÇİNE alındı: ön yüz bandın hattında)', canli: () => xz(servicePlace(3).station) },
  'servis.arkaBant.tepsi': { deger: [-13.0, -9.3], karar: 'D-074 (erişim 0,85 br sabit kaldı)', canli: () => xz(servicePlace(3).pickup) },
  'servis.arkaBant.bulasik': { deger: [-7.4, -10.3], karar: 'D-074', canli: () => xz(servicePlace(3).dish) },
  'servis.arkaBant.garsonIstasyonu': { deger: [-9.9, -10.3], karar: 'D-074 (tezgâhla aynı hizada)', canli: () => xz(WAITER_STATION.pos) },
  'personel.garsonBeklemesi': { deger: [-14.6, -6.6], karar: 'B6a (yükseltme işaretinin üstünden çekildi)', canli: () => xz(servicePlace(3).waiterHome) },
  'personel.bulasikciBeklemesi': { deger: [-6.9, -7.75], karar: 'B6a (iki işaret sütununun ARASINA)', canli: () => xz(servicePlace(3).dishwasherHome) },
};

const SAYI = { ...KABUK, ...MOBILYA, ...RITIM, ...AKTOR, ...KAMERA, ...NAV };

// ---------------------------------------------------------------------------

describe('ÖLÇÜ DONDURULDU — sayılar (D-072 katman 1)', () => {
  for (const [ad, f] of Object.entries(SAYI)) {
    it(`${ad} = ${f.deger}  [${f.karar}]`, () => {
      expect(f.canli(), `${ad} DONDURULDU. Değiştirmek karar ister — testin başlığındaki yolu izle.`).toBeCloseTo(
        f.deger,
        6,
      );
    });
  }
});

describe('ÖLÇÜ DONDURULDU — noktalar', () => {
  for (const [ad, f] of Object.entries(NOKTA)) {
    it(`${ad} = [${f.deger[0]}, ${f.deger[1]}]  [${f.karar}]`, () => {
      const [x, z] = f.canli();
      expect(x, `${ad} x DONDURULDU`).toBeCloseTo(f.deger[0], 6);
      expect(z, `${ad} z DONDURULDU`).toBeCloseTo(f.deger[1], 6);
    });
  }
});

/**
 * Dondurulmuş sayıların BİRBİRİYLE ilişkisi. Tek tek eşitlik yukarıda bekçilendi; buradakiler
 * "sayı doğru ama ANLAMI bozulmuş" hâlini yakalar — bir ankraj tek başına değişmeden, ona bağlı
 * bir türev başka yerde elle yazılırsa buradan çıkar.
 */
describe('dondurulmuş ölçüler tutarlı', () => {
  it('erişim mesafesi hâlâ TÜREV (elle yazılmış sabit değil)', () => {
    expect(REACH_TABLE).toBeCloseTo(LAYOUT.tableHalf[0] + LAYOUT.actorRadius + NAV_CELL + 0.05, 6);
  });

  it('kapı boşluğu duvarın içinde kalır', () => {
    expect(DOOR.height).toBeLessThan(WALL_H);
    expect(WAINSCOT_H).toBeLessThan(DOOR.height);
  });

  it('ara oda duvarı bina duvarını aşmaz', () => {
    expect(BAND_SHELL.roomH).toBeLessThan(WALL_H);
  });

  it('banket birimi sıralı: bank < masa < sandalye < koridor noktası', () => {
    expect(BANKET.benchDz).toBeLessThan(BANKET.tableDz);
    expect(BANKET.tableDz).toBeLessThan(BANKET.chairDz);
    expect(BANKET.chairDz).toBeLessThan(BANKET.aisleDz);
  });

  it('kamera portrede geri çekilir, landscapete taban mesafede kalır', () => {
    expect(cameraDistance(16 / 9)).toBeCloseTo(CAMERA_DIST, 6);
    expect(cameraDistance(9 / 16)).toBeCloseTo(CAMERA_DIST * CAMERA_PORTRAIT_CLAMP, 6);
  });

  it('kapı iki alan açılınca binanın ortasına kayar', () => {
    expect(doorX(1)).toBeCloseTo(-8.5, 6);
    expect(doorX(2)).toBeCloseTo(0, 6);
  });

  it('mobilya/karakter oranı D-076nın kabul aralığında (asıl kabul kriteri)', () => {
    expect(TABLE_TOP_Y / ACTOR_HEIGHT).toBeGreaterThan(0.4);
    expect(TABLE_TOP_Y / ACTOR_HEIGHT).toBeLessThan(0.48);
    expect(STOOL_SEAT_Y / ACTOR_HEIGHT).toBeGreaterThan(0.22);
    expect(STOOL_SEAT_Y / ACTOR_HEIGHT).toBeLessThan(0.3);
  });
});

/**
 * BELGE BEKÇİSİ. `docs/olcu-donduruldu.md` bu listenin insan tarafıdır (gerekçe + değiştirme
 * yolu). İkisi ayrı dosya olduğu için sapabilirler: yeni bir ankraj dondurulur ama belgeye
 * yazılmaz, ve belge sessizce eksik kalır. Biçim değil VARLIK bekçileniyor — her ankrajın adı
 * belgede geçmek zorunda, nasıl yazıldığına karışılmıyor.
 */
describe('belge listeyle aynı ankrajları taşıyor', () => {
  const belge = readFileSync(new URL('../docs/olcu-donduruldu.md', import.meta.url), 'utf8');
  for (const ad of [...Object.keys(SAYI), ...Object.keys(NOKTA)]) {
    it(`docs/olcu-donduruldu.md → ${ad}`, () => {
      expect(belge, `${ad} donduruldu ama belgede geçmiyor`).toContain(ad);
    });
  }
});
