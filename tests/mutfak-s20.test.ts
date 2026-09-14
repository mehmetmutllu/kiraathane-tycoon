import { describe, it, expect } from 'vitest';
import { PLAYER_RADIUS } from '../src/config/actor';
import { WAITER_STATION, servicePlace } from '../src/game/layout';
import {
  CAYCI_TEMPO,
  FAYANS,
  GECIS_ESIGI,
  cayBekleyenSayisi,
  cayciHali,
  cayciHizCarpani,
  onHatAcikliklari,
  sinirBolmeleri,
} from '../src/components/three/kitchenLook';

/**
 * S20 BEKÇİSİ (D-118) — mutfağın sınırı (E2) ve çaycının temposu (Ç1).
 *
 * NEDEN BU TEST VAR: ikisi de bir ÖLÇÜMÜN bulgusunu kapatıyor ve ikisi de sessizce geri
 * dönebilir — bölme bir gövde silinince kaybolur, tempo bir sabit değişince düzleşir. Ölçüm
 * sayıları `docs/olcum-mutfak.txt`te (tam koşu); burada o sayıların KURALI bekçileniyor.
 *
 * Aşağıdaki beklenen sayıların hiçbiri elle yazılmadı: hepsi `layout`/`kitchenLook`ten türer.
 * Elle yazılsaydı test, koruduğu şeyin kopyası olur ve kaynak değişince sessizce yalan söylerdi.
 */

/** Servis arka banda taşındıktan sonraki hâl — mutfak odasının var olduğu tek durum. */
const ACIK = 3;

describe('S20/E2 — mutfağın ön yüzünde geçişe yeten açıklık kalmaz', () => {
  it('geçiş eşiği iki oyuncu yarıçapıdır', () => {
    expect(GECIS_ESIGI).toBeCloseTo(PLAYER_RADIUS * 2, 6);
  });

  it('ölçümün bulduğu İKİ açıklık için iki bölme üretilir', () => {
    const b = sinirBolmeleri(ACIK);
    expect(b).toHaveLength(2);
    expect(b.map((q) => q.uc).sort()).toEqual(['bati', 'dogu']);
  });

  it('batı bölmesi odanın kenarı ile çay tezgâhının batı ucu arasını tam kapatır', () => {
    const p = servicePlace(ACIK);
    const bati = sinirBolmeleri(ACIK).find((q) => q.uc === 'bati');
    expect(bati).toBeDefined();
    const x0 = bati!.x - bati!.w / 2;
    const x1 = bati!.x + bati!.w / 2;
    expect(x0).toBeCloseTo(FAYANS.x0, 6);
    expect(x1).toBeCloseTo(p.station[0] - p.half[0], 6);
  });

  it('doğu bölmesi bulaşığın doğu ucu ile odanın kenarı arasını tam kapatır', () => {
    const p = servicePlace(ACIK);
    const dogu = sinirBolmeleri(ACIK).find((q) => q.uc === 'dogu');
    expect(dogu).toBeDefined();
    const x0 = dogu!.x - dogu!.w / 2;
    const x1 = dogu!.x + dogu!.w / 2;
    expect(x0).toBeCloseTo(p.dish[0] + p.dishHalf[0], 6);
    expect(x1).toBeCloseTo(FAYANS.x1, 6);
  });

  it('her bölme geçiş eşiğinden geniştir — yoksa zaten kapatılacak bir şey yoktu', () => {
    for (const b of sinirBolmeleri(ACIK)) expect(b.w).toBeGreaterThanOrEqual(GECIS_ESIGI);
  });

  it('bölmeler ön hattın z hizasında ve derinliğindedir (banko tek çizgi okunur)', () => {
    const p = servicePlace(ACIK);
    for (const b of sinirBolmeleri(ACIK)) {
      expect(b.z).toBeCloseTo(p.station[2], 6);
      expect(b.d).toBeCloseTo(p.half[1] * 2, 6);
    }
  });

  /**
   * ASIL DEĞİŞMEZ. Bölmeler eklendikten sonra odanın ön yüzünde geçişe yeten hiçbir aralık
   * kalmamalı. Boşluk hesabı `onHatAcikliklari` ile AYNI yöntemi kullanır ama bölmeleri de
   * gövde sayar — yani "kapandı mı" sorusunu ölçümün kendi diliyle sorar.
   */
  it('bölmelerden SONRA geçişe yeten açıklık kalmaz', () => {
    const p = servicePlace(ACIK);
    const govdeler = [
      { x0: p.station[0] - p.half[0], x1: p.station[0] + p.half[0] },
      { x0: WAITER_STATION.pos[0] - WAITER_STATION.half[0], x1: WAITER_STATION.pos[0] + WAITER_STATION.half[0] },
      { x0: p.dish[0] - p.dishHalf[0], x1: p.dish[0] + p.dishHalf[0] },
      ...sinirBolmeleri(ACIK).map((b) => ({ x0: b.x - b.w / 2, x1: b.x + b.w / 2 })),
    ].sort((a, b) => a.x0 - b.x0);

    const kalan: number[] = [];
    let uc = FAYANS.x0;
    for (const g of govdeler) {
      if (g.x0 - uc >= GECIS_ESIGI) kalan.push(g.x0 - uc);
      uc = Math.max(uc, g.x1);
    }
    if (FAYANS.x1 - uc >= GECIS_ESIGI) kalan.push(FAYANS.x1 - uc);

    expect(kalan).toEqual([]);
  });

  /**
   * İÇERİDEKİ DİKİŞLER BİLEREK AÇIK: ölçüm onları "geçmez" işaretledi (0,20 < 0,94). Kapatmak
   * üç tezgâhı tek kütleye çevirir ve çay ocağı / garson istasyonu / bulaşık ayrımını siler.
   */
  it('tezgâhlar arasındaki dar dikişler KAPATILMAZ', () => {
    const p = servicePlace(ACIK);
    const dikisOrta = (p.station[0] + p.half[0] + (WAITER_STATION.pos[0] - WAITER_STATION.half[0])) / 2;
    for (const b of sinirBolmeleri(ACIK)) {
      const icinde = dikisOrta > b.x - b.w / 2 && dikisOrta < b.x + b.w / 2;
      expect(icinde).toBe(false);
    }
  });

  it('servis hâlâ sol duvardayken ön hat yoktur — bölme de yoktur', () => {
    expect(sinirBolmeleri(2)).toEqual([]);
    expect(onHatAcikliklari(2)).toEqual([]);
  });

  it('bölmesiz hâlde açıklık GERÇEKTEN vardı — ölçümün bulgusu yeniden üretilir', () => {
    const acik = onHatAcikliklari(ACIK);
    expect(acik).toHaveLength(2);
    for (const a of acik) expect(a.w).toBeGreaterThanOrEqual(GECIS_ESIGI);
  });
});

describe('S20/Ç1 — çaycının temposu salonun yükünden gelir', () => {
  const npc = (state: string) => ({ state });

  it('yük = yalnız çay bekleyen müşteri', () => {
    expect(cayBekleyenSayisi([])).toBe(0);
    expect(
      cayBekleyenSayisi([npc('waitingForTea'), npc('drinking'), npc('toTable'), npc('waitingForTea'), npc('leaving')]),
    ).toBe(2);
  });

  it('yük yokken çaycı DURUR — yavaşlamaz, durur', () => {
    expect(cayciHizCarpani(0)).toBe(0);
    expect(cayciHizCarpani(-1)).toBe(0);
    expect(cayciHali(0)).toBe('dur');
  });

  it('tek müşteri gelince çalışmaya başlar', () => {
    expect(cayciHizCarpani(1)).toBeCloseTo(CAYCI_TEMPO.azCarpan, 6);
    expect(cayciHali(1)).toBe('calis');
  });

  it('doyumda ve üstünde tempo sabitlenir', () => {
    expect(cayciHizCarpani(CAYCI_TEMPO.doyum)).toBeCloseTo(CAYCI_TEMPO.cokCarpan, 6);
    expect(cayciHizCarpani(CAYCI_TEMPO.doyum + 1)).toBeCloseTo(CAYCI_TEMPO.cokCarpan, 6);
    expect(cayciHizCarpani(50)).toBeCloseTo(CAYCI_TEMPO.cokCarpan, 6);
  });

  it('tempo yükle birlikte artar ve hiç azalmaz', () => {
    let onceki = -1;
    for (let n = 0; n <= CAYCI_TEMPO.doyum + 2; n++) {
      const c = cayciHizCarpani(n);
      expect(c).toBeGreaterThanOrEqual(onceki);
      onceki = c;
    }
  });

  it('dolu salon boş salondan GÖZLE görülür hızlıdır', () => {
    // Tek sayı değil ORAN bekçilenir: ikisi birlikte kayarsa fark yine korunur.
    expect(cayciHizCarpani(CAYCI_TEMPO.doyum)).toBeGreaterThan(cayciHizCarpani(1) * 1.5);
  });

  it('temel hız eski sabitten geliyor (tempo çarpanı onun ÜSTÜNE biner)', () => {
    expect(CAYCI_TEMPO.temelHiz).toBeGreaterThan(0);
    expect(CAYCI_TEMPO.azCarpan).toBeGreaterThan(0);
    expect(CAYCI_TEMPO.cokCarpan).toBeGreaterThan(CAYCI_TEMPO.azCarpan);
  });
});
