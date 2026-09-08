/**
 * actor-scale.test.ts — AKTÖR ÖLÇÜSÜNÜN BEKÇİSİ (D-076).
 *
 * D-072'nin kuralı: ölçü katmanının kabul kriteri "aynı görünüyor mu" değil, SAYI LİSTESİDİR.
 * Burada o liste duruyor. İki şeyi bekçiliyor:
 *   1. Beş aktörün de aynı boya (1,75) geldiğini ve hiçbirinin zemine gömülmediğini.
 *   2. Mobilya/karakter ORANINI — D-075'te kullanıcının şikâyeti buydu ("masalar ve tabureler
 *      karaktere göre çok büyük"), ve çözüm mobilyayı kısmak değil karakteri büyütmekti.
 *      Mobilya sayıları D-073/D-075'te DONDU; oran bozulursa sebebi karakter tarafıdır.
 */
import { describe, expect, it } from 'vitest';
import {
  ACTOR_HEIGHT,
  ACTOR_RADIUS,
  AUTHORED_HEIGHT,
  actorScale,
  authoredRadius,
  BUBBLE_Y,
  CAPSULE_RADIUS,
  CAMERA_LOOK_Y,
  PLAYER_RADIUS,
  SEATED_DROP,
  type ActorKind,
} from '../src/config/actor';
import { LAYOUT, REACH_TABLE } from '../src/game/layout';
import { STOOL_SEAT_Y, TABLE_TOP_Y } from '../src/components/three/tableLook';

/**
 * Dondurulmuş mobilya ölçüleri (D-073 · D-074 · D-075) — bu testin referans noktaları.
 * BM adım 6'da elle yazılmaktan çıkıp `tableLook.ts`ten okunur oldu: sayılar iki yerde durursa
 * biri değişip diğeri kalabilir ve o hâlde bu test yanlış zemine karşı yeşil kalır.
 * Değerlerin kendisini `tests/olcu-donduruldu.test.ts` bekçiliyor; burası ORANI sınar.
 */
const FURNITURE = {
  /** dörtlü çay masası: tabla üstü */
  tableTop: TABLE_TOP_Y,
  /** tabure oturağı üstü */
  stoolSeat: STOOL_SEAT_Y,
} as const;

const KINDS = Object.keys(AUTHORED_HEIGHT) as ActorKind[];

describe('aktör boyu — tek kaynak (D-076)', () => {
  it('beş aktör de tam olarak ACTOR_HEIGHT boyuna gelir', () => {
    for (const k of KINDS) {
      expect(AUTHORED_HEIGHT[k] * actorScale(k), k).toBeCloseTo(ACTOR_HEIGHT, 6);
    }
  });

  it('hiçbir gövde küçültülmez (hepsi 1,29 ve altında yazılmıştı → ölçek > 1)', () => {
    for (const k of KINDS) expect(actorScale(k), k).toBeGreaterThan(1);
  });

  it('ACTOR_HEIGHT maketin insanına (1,80) yakın, altında', () => {
    expect(ACTOR_HEIGHT).toBeGreaterThan(1.6);
    expect(ACTOR_HEIGHT).toBeLessThanOrEqual(1.8);
  });
});

describe('mobilya / karakter oranı — D-075 şikâyetinin kabul kriteri', () => {
  // Gerçek hayat: masa 0,75 / insan 1,75 = %43 · tabure 0,45 / 1,75 = %26.
  it('masa üstü boyun %40-48 aralığında (1,29 iken %62 idi = şikâyetin kaynağı)', () => {
    const r = FURNITURE.tableTop / ACTOR_HEIGHT;
    expect(r).toBeGreaterThan(0.4);
    expect(r).toBeLessThan(0.48);
  });

  it('tabure oturağı boyun %23-30 aralığında (1,29 iken %35 idi)', () => {
    const r = FURNITURE.stoolSeat / ACTOR_HEIGHT;
    expect(r).toBeGreaterThan(0.23);
    expect(r).toBeLessThan(0.3);
  });

  it('tabure oturağı masa üstünün ALTINDA kalır (oturulabilir mobilya)', () => {
    expect(FURNITURE.stoolSeat).toBeLessThan(FURNITURE.tableTop - 0.25);
  });
});

describe('zemine basma + oturuş (eski kusurlar)', () => {
  it('oturan müşteri İNER ama yerin altına tamamen gömülmez', () => {
    expect(SEATED_DROP).toBeLessThan(0); // aşağı doğru
    expect(ACTOR_HEIGHT + SEATED_DROP).toBeGreaterThan(FURNITURE.stoolSeat + 0.6); // üst gövde görünür
  });

  it('oturan müşterinin baş tepesi masa üstünün üstünde kalır', () => {
    expect(ACTOR_HEIGHT + SEATED_DROP).toBeGreaterThan(FURNITURE.tableTop + 0.3);
  });

  it('baloncuk oturan müşterinin başının ÜSTÜNDE durur', () => {
    expect(BUBBLE_Y + SEATED_DROP).toBeGreaterThan(ACTOR_HEIGHT + SEATED_DROP);
  });

  it('kamera gövdenin ortasına yakın bakar (boyun %40-55i)', () => {
    const r = CAMERA_LOOK_Y / ACTOR_HEIGHT;
    expect(r).toBeGreaterThan(0.4);
    expect(r).toBeLessThan(0.55);
  });
});

describe('yarıçaplar boydan türer (layout.ts tek kaynağı okur)', () => {
  it('LAYOUT yarıçapları actor.ts ile BİREBİR aynı', () => {
    expect(LAYOUT.playerRadius).toBe(PLAYER_RADIUS);
    expect(LAYOUT.actorRadius).toBe(ACTOR_RADIUS);
  });

  it("PARÇALI gövde enine de büyüdü → oyuncu yarıçapı eski 0,35in üstünde", () => {
    expect(PLAYER_RADIUS).toBeGreaterThan(0.35);
  });

  it("KAPSÜL gövdeler enine büyümedi → personel yarıçapı 0,28de kaldı", () => {
    expect(ACTOR_RADIUS).toBe(0.28);
    // Nav'ın gördüğü kesit kapsülün kendisinden dar olmalı (standoff gövdenin içinde kalmasın).
    expect(ACTOR_RADIUS).toBeLessThan(CAPSULE_RADIUS);
  });

  it('kapsül gövde blob değil: yarıçap/boy oranı insan siluetinde (%14-20)', () => {
    const r = CAPSULE_RADIUS / ACTOR_HEIGHT;
    expect(r).toBeGreaterThan(0.14);
    expect(r).toBeLessThan(0.2);
  });

  it('kapsül OTURAN müşteriyken tabureyi tamamen yutmaz (yarıçap tabure yarıçapının 1,5 katından az)', () => {
    const stoolHalf = 0.27 * (0.9 / 1.11); // maketin taburesi × STOOL_S/STOOL_REF
    expect(CAPSULE_RADIUS).toBeLessThan(stoolHalf * 1.5);
  });

  it('gövdenin içine yazılan ham yarıçap, mount ölçeğinden sonra tam CAPSULE_RADIUS olur', () => {
    for (const k of KINDS) {
      expect(authoredRadius(k) * actorScale(k), k).toBeCloseTo(CAPSULE_RADIUS, 9);
    }
  });

  it('personel yarıçapı oyuncununkinden küçük kalır (dar yerlere girebilsin)', () => {
    expect(ACTOR_RADIUS).toBeLessThan(PLAYER_RADIUS);
  });

  it('REACH_TABLE actorRadius büyümesini yansıtır ve masa yarısını aşar', () => {
    expect(REACH_TABLE).toBeGreaterThan(LAYOUT.tableHalf[0] + ACTOR_RADIUS);
    expect(REACH_TABLE).toBeCloseTo(LAYOUT.tableHalf[0] + ACTOR_RADIUS + 0.3 + 0.05, 6);
  });

  it('tabure footprint\'i MOBİLYANIN kendisidir — aktör boyuyla büyümez (D-076)', () => {
    expect(LAYOUT.chairHalf[0]).toBe(0.3);
  });
});
