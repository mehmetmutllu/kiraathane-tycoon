/**
 * karakter-senkron.test.ts — S15'in BEKÇİSİ (D-113).
 *
 * **Neyi koruyor:** bu turda üç şey aynı anda değişti ve üçü de sessizce bozulabilir cinsten.
 *
 * 1. **Yürüme senkronu.** Kullanıcının "havada süzülüyor" dediği kusurun sebebi kliplerin
 *    `timeScale = 1`de çalmasıydı: `Walking_A` 0,571 br/sn için çizilmiş, oyuncu 4,5-5,4 br/sn
 *    gidiyordu (ayak 7,9-9,5 katı kayıyor). Artık klip HIZDAN seçiliyor ve katsayı hızdan
 *    türüyor. `KLIP_HIZI`'ndaki sayılar ÖLÇÜMDÜR (`docs/olcum-yuruyus.json` §S_senkron) —
 *    elle "ayarlanırsa" kusur geri gelir ve kimse fark etmez, çünkü konsol hatası vermez.
 *    Sayılar ham rig hızının `KAY_SCALE` ile çarpımıdır: ölçek değişirse bunlar da değişmeli.
 *
 * 2. **Kafa ölçeği TELAFİSİZ olmalı.** Kolun seçilme sebebi `ACTOR_HEIGHT`e ve ondan türeyen
 *    hiçbir şeye dokunmamasıydı (SEATED_DROP, PLAYER_RADIUS, BUBBLE_Y, CAMERA_LOOK_Y, nav).
 *    Biri `KAY_SCALE`i kafa ölçeğiyle "telafi" ederse omuz blob sınırını aşar (ölçüldü: ×0,80
 *    telafili kolda omuz 0,616 > 0,60) ve bunu ancak bir ekran görüntüsü yakalar.
 *
 * 3. **`head` ölçek izinin sökülmesi.** KayKit her klipte her kemiğin ölçeğini yazıyor; iz
 *    sökülmezse mixer `KAY_KAFA_OLCEK`in üstüne her karede 1,0 yazar ve kafa küçülmez. Sökmek
 *    ancak izler TAM 1,0 olduğu için güvenli — o varsayım burada doğrulanır.
 *
 * Sayılar: `docs/karakter-raporu-s15.md` · ham `docs/olcum-yuruyus.json`.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  ACTOR_HEIGHT,
  KAY_SCALE,
  KAY_AUTHORED,
  KAY_KAFA_OLCEK,
  KAY_KIYAFET,
  KLIP_HIZI,
  TIMESCALE_TAVAN,
  TIMESCALE_TABAN,
  KAY_OTURMA_KALDIRMA,
  NPC_SKIN_CAP,
  SEATED_DROP,
  BUBBLE_Y,
  PLAYER_RADIUS,
  CAMERA_LOOK_Y,
} from '../src/config/actor';
import { lokomosyonSec, LOKOMOSYON } from '../src/components/three/KayActor';

const OLCUM = JSON.parse(readFileSync('docs/olcum-yuruyus.json', 'utf8'));
const KAYNAK_ACTOR = readFileSync('src/components/three/KayActor.tsx', 'utf8');
const KAYNAK_MUSTERI = readFileSync('src/components/three/Customers.tsx', 'utf8');

/** Oyunun hareket hızları — ölçüm dosyasının damgaladığı takım. */
const HIZLAR = OLCUM.kaynak.hizlar as Record<string, number>;

describe('S15 · yürüme senkronu (D-113)', () => {
  it('KLIP_HIZI ölçüm dosyasıyla birebir aynı — koddaki sayı elle "ayarlanamaz"', () => {
    for (const [ad, hiz] of Object.entries(KLIP_HIZI)) {
      const olculen = OLCUM.S_senkron[ad];
      expect(olculen, `${ad} ölçüm dosyasında yok`).toBeDefined();
      expect(hiz, `${ad} koddaki hız ölçümden sapmış`).toBeCloseTo(olculen.dunyaHizi, 3);
    }
  });

  it('klip hızları KAY_SCALE ile tutarlı — ölçek değişirse bu sayılar da değişmeli', () => {
    for (const [ad, hiz] of Object.entries(KLIP_HIZI)) {
      const ham = OLCUM.S_senkron[ad].hamHiz;
      expect(hiz, `${ad}: ham hız × KAY_SCALE tutmuyor`).toBeCloseTo(ham * KAY_SCALE, 2);
    }
    expect(KAY_SCALE).toBeCloseTo(ACTOR_HEIGHT / KAY_AUTHORED, 6);
  });

  it('klipler YERİNDE — kök kayması sıfır olmasaydı timeScale yaklaşımı geçersizdi', () => {
    for (const ad of Object.keys(KLIP_HIZI)) {
      expect(OLCUM.S_senkron[ad].kokKayma, `${ad} kök kayması var`).toBeCloseTo(0, 3);
    }
  });

  it('yavaş aktör YÜRÜR, hızlı aktör KOŞAR', () => {
    expect(lokomosyonSec(LOKOMOSYON.yuru, 0.6).klip).toBe('Walking_A');
    expect(lokomosyonSec(LOKOMOSYON.yuru, HIZLAR['garson k0']).klip).toBe('Running_A');
    expect(lokomosyonSec(LOKOMOSYON.yuru, HIZLAR['oyuncu k3']).klip).toBe('Running_A');
    // Taşıyan garson kendi klibinden başlar; hızlanınca koşuya geçer.
    expect(lokomosyonSec(LOKOMOSYON.tasi, 0.7).klip).toBe('Walking_B');
  });

  it('katsayı hızdan türer — personel ve müşteride ayak KAYMAZ', () => {
    // Kelepçeye çarpmayan aktörlerde seçilen klip × katsayı = gerçek hız (kayma = 1,00×).
    for (const ad of ['garson k0', 'garson k1', 'bulasikci k0']) {
      const hiz = HIZLAR[ad];
      const { klip, timeScale } = lokomosyonSec(LOKOMOSYON.yuru, hiz);
      expect(timeScale, `${ad} kelepçeye çarpmamalı`).toBeLessThan(TIMESCALE_TAVAN);
      expect(KLIP_HIZI[klip] * timeScale, `${ad} ayak kayıyor`).toBeCloseTo(hiz, 2);
    }
  });

  it('OYUNCU kelepçeye çarpar ve artık kayma raporun söylediği kadardır (2,0×)', () => {
    const { klip, timeScale } = lokomosyonSec(LOKOMOSYON.yuru, HIZLAR['oyuncu k0']);
    expect(timeScale).toBe(TIMESCALE_TAVAN);
    const tasinan = KLIP_HIZI[klip] * timeScale;
    expect(HIZLAR['oyuncu k0'] / tasinan).toBeCloseTo(2.0, 1);
    // Kelepçe OLMASAYDI kayma 7,9× olurdu — kusurun bugünkü hâli.
    expect(HIZLAR['oyuncu k0'] / KLIP_HIZI.Walking_A).toBeCloseTo(7.9, 1);
  });

  it('katsayı iki uçtan da kelepçelidir', () => {
    expect(lokomosyonSec(LOKOMOSYON.yuru, 50).timeScale).toBe(TIMESCALE_TAVAN);
    expect(lokomosyonSec(LOKOMOSYON.yuru, 0.001).timeScale).toBe(TIMESCALE_TABAN);
  });

  it('katsayı KOD içinde her kare yazılır — yalnız klip değişince yazılsa hız yükseltmesi tutmazdı', () => {
    expect(KAYNAK_ACTOR).toMatch(/yeni\.timeScale = secim \? secim\.timeScale : 1;/);
    // Atama, "klip değişti mi" kontrolünden ÖNCE gelmeli.
    expect(KAYNAK_ACTOR.indexOf('yeni.timeScale =')).toBeLessThan(
      KAYNAK_ACTOR.indexOf('if (hedefKlip === suAn.current) return;'),
    );
  });
});

describe('S15 · kafa ölçeği TELAFİSİZ (D-113)', () => {
  it('kafa ölçeği türeyen HİÇBİR sayıyı kıpırdatmaz — kolun seçilme sebebi bu', () => {
    expect(KAY_SCALE).toBeCloseTo(ACTOR_HEIGHT / KAY_AUTHORED, 6);
    expect(SEATED_DROP).toBeCloseTo(1.3 - ACTOR_HEIGHT, 6);
    expect(BUBBLE_Y).toBeCloseTo(ACTOR_HEIGHT + 0.15, 6);
    expect(PLAYER_RADIUS).toBeCloseTo(0.47, 2);
    expect(CAMERA_LOOK_Y).toBeCloseTo(0.8, 6);
  });

  it('KAY_SCALE kafa ölçeğini TELAFİ ETMEZ (telafi omuzu blob sınırının üstüne çıkarır)', () => {
    // Telafili kol `ACTOR_HEIGHT / (KAY_AUTHORED × f(kafa))` biçiminde olurdu; burada yok.
    const telafili = ACTOR_HEIGHT / (KAY_AUTHORED * KAY_KAFA_OLCEK);
    expect(KAY_SCALE).not.toBeCloseTo(telafili, 3);
    expect(KAY_SCALE * KAY_AUTHORED).toBeCloseTo(ACTOR_HEIGHT, 6);
  });

  it('kafa ölçeği 0 ile 1 arasında — 1 üstü büyütme, 0 baş yok demek', () => {
    expect(KAY_KAFA_OLCEK).toBeGreaterThan(0.3);
    expect(KAY_KAFA_OLCEK).toBeLessThanOrEqual(1);
  });

  it('kafa yalnız `head` KEMİĞİNDEN küçültülür ve kıyafetten ÖNCE — kasket onunla küçülsün', () => {
    expect(KAYNAK_ACTOR).toMatch(/n\.name === 'head'\) n\.scale\.setScalar\(KAY_KAFA_OLCEK\)/);
    expect(KAYNAK_ACTOR.indexOf('kafaKucult(o)')).toBeLessThan(KAYNAK_ACTOR.indexOf('kiyafetTak(o, kind)'));
  });

  it('`head` ölçek izi sökülür VE sökmek güvenli (kullanılan kliplerde ölçek tam 1,0)', () => {
    expect(KAYNAK_ACTOR).toMatch(/filter\(\(t\) => t\.name !== 'head\.scale'\)/);
    // Klip KLONLANMAMALI: klonlamak her render'da 139 klip üretiyor ve müşteri havuzunun
    // kimliğini kaydırıyordu — duman testi canvas'ı 15 sn'de göremiyordu.
    expect(KAYNAK_ACTOR).not.toMatch(/\.map\(\(klip\) => \{[\s\S]*?klip\.clone\(\)/);
  });
});

describe('S15 · sahibin kasketi kalktı (kullanıcı kararı)', () => {
  it('sahipte kasket YOK, mutfak elemanında VAR', () => {
    expect(KAY_KIYAFET.owner.kasket).toBe(false);
    expect(KAY_KIYAFET.kitchenHand.kasket).toBe(true);
  });

  it('önlük dört rolde de duruyor — kalkan yalnız kasketti', () => {
    for (const rol of ['owner', 'waiter', 'dishwasher', 'kitchenHand'] as const) {
      expect(KAY_KIYAFET[rol].onluk, `${rol} önlüğü kayboldu`).toBe(true);
    }
  });
});

describe('S15 · müşteri skinned (D-113)', () => {
  it('bütçe oyunun üretebildiği EN YÜKSEK müşteri sayısını kapsar — kapsül görünmemeli', () => {
    // `maxConcurrent = max(8, totalSeats + 2)`; 24 masa tam açıkken müşteri 70'i geçebiliyor.
    // Oyunda ölçüldü: yalnız 12 masada 38 eşzamanlı müşteri. Kullanıcı kararı: kapsül hiç
    // görünmesin (2026-09-14) → tavan o tepenin üstünde kalmalı.
    expect(NPC_SKIN_CAP).toBeGreaterThanOrEqual(80);
  });

  it('tavanı aşan müşteri için kapsül kolu DURUYOR — silinirse geç oyunda müşteri kaybolur', () => {
    expect(KAYNAK_MUSTERI).toMatch(/CapsuleGeometry/);
    expect(KAYNAK_MUSTERI).toMatch(/i < yuvalar\.length/);
  });

  it('havuz TAM BİR KEZ kurulur — useMemo kimliği kayarsa 48 gövde her render yeniden kurulur', () => {
    expect(KAYNAK_MUSTERI).toMatch(/const havuz = useRef</);
    expect(KAYNAK_MUSTERI).toMatch(/if \(!havuz\.current\)/);
  });

  it('oturan müşteri GERÇEK oturuş klibinde; kapsülün SEATED_DROP numarası ona uygulanmaz', () => {
    expect(KAY_OTURMA_KALDIRMA).toBeGreaterThan(0); // kapsül numarası NEGATİF (−0,45)
    expect(SEATED_DROP).toBeLessThan(0);
    // Skinned kol kaldırmayı, kapsül kolu düşürmeyi kullanır.
    expect(KAYNAK_MUSTERI).toMatch(/oturan \? KAY_OTURMA_KALDIRMA : 0/);
    expect(KAYNAK_MUSTERI).toMatch(/oturan \? SEATED_DROP \+ Math\.sin/);
  });

  it('gövde başına İKİ mesh — baş dokusunu korur, gövde köşe renginden boyanır', () => {
    expect(KAYNAK_MUSTERI).toMatch(/vertexColors: true/);
    expect(KAYNAK_MUSTERI).toMatch(/basMi\(p\.name\)/);
    // Baş boyanmamalı: `govdeMat` yalnız gövde kümesine verilir.
    const basBlok = KAYNAK_MUSTERI.slice(KAYNAK_MUSTERI.indexOf('if (bas.length)'), KAYNAK_MUSTERI.indexOf('if (govde.length)'));
    expect(basBlok).not.toMatch(/govdeMat/);
  });

  it('gömlek rengi müşteriden gelir — yuva el değiştirince yeniden yazılır', () => {
    expect(KAYNAK_MUSTERI).toMatch(/y\.govdeMat\.color\.set\(npc\.color\)/);
  });

  it('OTURAN müşteri MASAYA döner — yön hareketten değil masa merkezinden gelir', () => {
    // Yön normalde hareketten türüyor; oturunca hareket bitiyor ve müşteri geldiği yöne
    // bakakalıyordu (kullanıcı 2026-09-14: "oturmalar sıkıntı, masaya dönük değiller").
    expect(KAYNAK_MUSTERI).toMatch(/LAYOUT\.tables\[npc\.tableIndex\]\?\.table/);
    expect(KAYNAK_MUSTERI).toMatch(/Math\.atan2\(masa\[0\] - x, masa\[2\] - z\)/);
    // Oturan koluna, hareket kolundan ÖNCE bakılmalı; sonra bakılsa hareket yönü kazanırdı.
    const oturanDal = KAYNAK_MUSTERI.indexOf('if (oturan) {');
    const hareketDal = KAYNAK_MUSTERI.indexOf('} else if (dx * dx + dz * dz > 1e-5) {');
    expect(oturanDal).toBeGreaterThan(-1);
    expect(oturanDal).toBeLessThan(hareketDal);
  });

  it('yuva el değiştirince açı SNAP eder — önceki müşterinin yönünden dönmez', () => {
    expect(KAYNAK_MUSTERI).toMatch(/y\.yeniYuva = true;/);
    expect(KAYNAK_MUSTERI).toMatch(/y\.aci = y\.yeniYuva \? y\.hedefAci : MathUtils\.damp/);
  });
});
