/**
 * hedefler.test.ts — D-089'UN BEKÇİSİ: hedefler (koleksiyon) sistemi.
 *
 * Üç ayrı sözleşmeyi kilitler; üçü de bu turda ölçülerek ya da çürütülerek kazanıldı:
 *
 *   A. KİMLİK (D-088'in dersinin tekrarı). Kayıtta yalnız TOPLANMIŞ kimlikler durur; "kaçıncı
 *      kademedeyim" hiçbir yerde saklanmaz. Kademe eklemek, eşik değiştirmek, kategori sırasını
 *      değiştirmek ilerlemiş bir kaydı GERİ ÇEKMEZ.
 *   B. KURAL TEK YERDE. Eşik kontrolü yalnız `goals.ts`tedir; store kendi başına karar vermez.
 *      Ödül config'ten gelir — HUD'a gömülü sayı yoktur (D3 öncesi tam bu vardı).
 *   C. DENGE. `economy.config.ts`in gerçek `goals` bloğu, D-089'da SEÇİLEN kolun bandında kalır.
 *      Bu bandın kendisi ölçülerek bulundu ve iki kez çürütüldü (rapor §4 Bulgu 10): ortak ödül
 *      merdiveni önce toplamı, sonra ödemelerin YERİNİ tutturamadı. Bir gün biri ödülleri
 *      "biraz artıralım" derse, bu test o artışın zincire ne yaptığını söyler.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  activeTier, claimGoalReward, claimableGoals, goalCategories, goalId, goalViews, tierState,
  type GoalMetrics,
} from '../src/game/goals';
import { economyConfig as C, type GoalCategory } from '../src/config/economy.config';
import { kolAyarla, VARSAYILAN, onbellekTemizle, milestoneTazele, m1Ayarla, olcutler, hedefAkisiAyarla } from '../tools/simulate';
import { HEDEF_KOLLARI, odemeleriSifirla, sonKosuToplami } from '../tools/hedef-kollari';

const bos = (): GoalMetrics => ({ served: 0, pads: 0, lifetime: 0, dishes: 0, masterTables: 0 });
const kat = (id: string): GoalCategory => goalCategories().find((c) => c.id === id)!;

// Testlerin kendi kategorisi: gerçek config'e bağlı kalmadan kimlik/durum kuralları sınanır.
const T: GoalCategory = {
  id: 'test', name: 'Test', metric: 'served', note: '—',
  tiers: [10, 20, 30], rewards: [1, 2, 3],
};

describe('A · kimlik: konum SAKLANMAZ, toplanmış kimliklerden türetilir', () => {
  it('aktif kademe = toplanmamış ilk kademe', () => {
    expect(activeTier(T, new Set())).toBe(0);
    expect(activeTier(T, new Set(['test:0']))).toBe(1);
    expect(activeTier(T, new Set(['test:0', 'test:1', 'test:2']))).toBe(3); // kategori bitti
  });

  it('ARAYA kademe eklemek ilerlemiş kaydı geri çekmez', () => {
    // Oyuncu üç kademeyi de toplamış. Sonra hatta yeni bir kademe eklenir (tiers 4 olur).
    const claimed = new Set(['test:0', 'test:1', 'test:2']);
    const genis: GoalCategory = { ...T, tiers: [10, 20, 30, 40], rewards: [1, 2, 3, 4] };
    // Aktif kademe yeni eklenen SON kademedir — 0'a dönmez.
    expect(activeTier(genis, claimed)).toBe(3);
  });

  it('EŞİK değiştirmek toplanmış kademeyi geri açmaz', () => {
    const claimed = new Set(['test:0']);
    const zorlastirilmis: GoalCategory = { ...T, tiers: [999, 20, 30] };
    // Sayaç 999'un çok altında ama 0. kademe TOPLANMIŞ: durumu 'claimed' kalır.
    expect(tierState(zorlastirilmis, 0, { ...bos(), served: 5 }, claimed)).toBe('claimed');
  });

  it('kimlik biçimi kategori+kademe (index kayda yazılmaz)', () => {
    expect(goalId('earn', 2)).toBe('earn:2');
  });
});

describe('B · dört durum ve tek karar yeri', () => {
  const claimed = new Set<string>();

  it('kilitli · ilerliyor · toplanabilir · toplandı', () => {
    expect(tierState(T, 0, { ...bos(), served: 5 }, claimed)).toBe('progress');
    expect(tierState(T, 0, { ...bos(), served: 10 }, claimed)).toBe('claimable');
    // Sıradaki kademe, öncekisi toplanmadan KİLİTLİ — sayaç yetse bile.
    expect(tierState(T, 1, { ...bos(), served: 999 }, claimed)).toBe('locked');
    expect(tierState(T, 0, { ...bos(), served: 10 }, new Set(['test:0']))).toBe('claimed');
  });

  it('sıra atlanamaz: 2. kademe 1. toplanmadan ödül vermez', () => {
    const cat = goalCategories()[0];
    const cok: GoalMetrics = { served: 1e9, pads: 99, lifetime: 1e9, dishes: 1e9, masterTables: 99 };
    expect(claimGoalReward(goalId(cat.id, 1), cok, [])).toBeNull();
    expect(claimGoalReward(goalId(cat.id, 0), cok, [])).not.toBeNull();
  });

  it('toplanmış hedef ikinci kez ödül vermez', () => {
    const cat = goalCategories()[0];
    const cok: GoalMetrics = { served: 1e9, pads: 99, lifetime: 1e9, dishes: 1e9, masterTables: 99 };
    const id = goalId(cat.id, 0);
    expect(claimGoalReward(id, cok, [])).not.toBeNull();
    expect(claimGoalReward(id, cok, [id])).toBeNull();
  });

  it('geçersiz kimlik ödül vermez (kırık kayıt oyunu bozamaz)', () => {
    const cok: GoalMetrics = { served: 1e9, pads: 99, lifetime: 1e9, dishes: 1e9, masterTables: 99 };
    for (const id of ['', 'yok:0', 'earn:99', 'earn:-1', 'earn:abc', 'earn']) {
      expect(claimGoalReward(id, cok, [])).toBeNull();
    }
  });

  it('ödül CONFIG`ten gelir — kategori başına, HUD`a gömülü değil', () => {
    const cat = kat('master');
    const cok: GoalMetrics = { served: 1e9, pads: 99, lifetime: 1e9, dishes: 1e9, masterTables: 99 };
    expect(claimGoalReward(goalId('master', 0), cok, [])).toEqual({
      reward: cat.rewards[0],
      diamonds: C.goals.diamondByTier[0],
    });
  });

  it('GEÇ kategori BÜYÜK başlar — ortak merdiven ölçümde çürüdü (rapor Bulgu 10②)', () => {
    // Usta kategorisinin ilk kademesi ~4. saatte gelir; erken kategorilerin ilkiyle aynı ödülü
    // verirse ödeme eğrinin yanlış yerine düşer. Bu, bir stil tercihi değil ölçüm sonucudur.
    expect(kat('master').rewards[0]).toBeGreaterThan(kat('service').rewards[0] * 5);
  });

  it('her kategoride rewards ve tiers aynı uzunlukta', () => {
    for (const cat of goalCategories()) {
      expect(cat.rewards.length).toBe(cat.tiers.length);
      // Eşikler ARTAN olmalı — değilse "sıradaki kademe" kavramı anlamını yitirir.
      for (let i = 1; i < cat.tiers.length; i++) expect(cat.tiers[i]).toBeGreaterThan(cat.tiers[i - 1]);
    }
  });
});

describe('B2 · görünüm: kategori başına TEK aktif satır', () => {
  it('beş kategori, beş satır', () => {
    expect(goalViews(bos(), []).length).toBe(goalCategories().length);
  });

  it('sayaç durumdan gelir, satır aktif kademeyi gösterir', () => {
    const m: GoalMetrics = { ...bos(), pads: 7 };
    const g = goalViews(m, [])!.find((x) => x.categoryId === 'space')!;
    expect(g.cur).toBe(7);
    expect(g.target).toBe(kat('space').tiers[0]); // 0. kademe toplanmadıkça satır orada durur
    expect(g.state).toBe('claimable');
  });

  it('claimableGoals yalnız gerçekten toplanabilirleri sayar', () => {
    expect(claimableGoals(bos(), [])).toEqual([]);
    const m: GoalMetrics = { ...bos(), pads: 3, lifetime: 1_000 };
    expect(claimableGoals(m, []).sort()).toEqual(['earn:0', 'space:0']);
  });

  it('kategori bitince satır son kademede `claimed` kalır', () => {
    const cat = kat('space');
    const hepsi = cat.tiers.map((_, i) => goalId('space', i));
    const g = goalViews({ ...bos(), pads: 99 }, hepsi).find((x) => x.categoryId === 'space')!;
    expect(g.state).toBe('claimed');
    expect(g.tier).toBe(cat.tiers.length - 1);
  });
});

describe('C · denge: uygulanan config SEÇİLEN kolun bandında', () => {
  /** Ölçüt koşusu pahalı (iki 12 saatlik profil) — sonuç hatırlanır. */
  const bellek = new Map<string, { serit: number; odenen: number }>();
  function olc(anahtar: string, kur: () => void) {
    const hit = bellek.get(anahtar);
    if (hit) return hit;
    odemeleriSifirla();
    kolAyarla(VARSAYILAN);
    m1Ayarla(false);
    kur();
    onbellekTemizle();
    milestoneTazele();
    const o = olcutler();
    const r = { serit: o.serit ?? NaN, odenen: sonKosuToplami() };
    bellek.set(anahtar, r);
    return r;
  }

  const taban = () => olc('taban', () => hedefAkisiAyarla(null));
  const uygulanan = () => olc('hUYG', () => hedefAkisiAyarla(HEDEF_KOLLARI.hUYG.fabrika(1)));

  beforeEach(() => {
    hedefAkisiAyarla(null);
    onbellekTemizle();
    milestoneTazele();
  });

  it('hedef ödülü GERÇEKTEN düşüyor (kanca tetikleniyor)', { timeout: 90_000 }, () => {
    // D1'de `iade:0.25` varyantı hiç tetiklenmemiş ve rapora sahte bir "fark yok" satırı
    // girmişti. Bu beklenti o tuzağın bekçisi: ödeme sıfırsa aşağıdaki bant testi anlamsızdır.
    expect(uygulanan().odenen).toBeGreaterThan(1_000);
  });

  it('Kat 1`de fiilen ödenen ₺ ölçülen bantta (2.900-3.500 · yürürlükte 3.175)', { timeout: 90_000 }, () => {
    // Bu beklenti bir MUTASYON KAÇIŞINDAN doğdu: ilk hâlde yalnız zincir bedeline bakılıyordu ve
    // TEK bir kategorinin ödülleri 3'e katlandığında test geçiyordu (zincir %-3,2 → ~%-4,5, üst
    // sınır %5'in altında kalıyordu). Zincir bedeli dolaylı ve gürültülü bir göstergedir; ödenen
    // ₺ doğrudandır ve config'teki her ödül değişikliğini yakalar.
    // Bant DAR tutuldu (±%10). İlk hâli 2.500-4.000 idi ve ikinci bir mutasyon (tek kategorinin
    // ödülleri 1,5×) oradan da kaçtı. Denge bekçisinin bandı, ölçülen değerin etrafında dar
    // olmalı: geniş bant "bir şey değişti mi" sorusuna hep hayır der.
    expect(uygulanan().odenen).toBeGreaterThan(2_900);
    expect(uygulanan().odenen).toBeLessThan(3_500);
    // ÇÖZÜNÜRLÜK ~%10, bilerek: tek bir kategorinin ödüllerini %20 artıran ince bir mutasyon bu
    // banttan KAÇAR (M9). Bandı ±%3'e indirmek sim modelinin her küçük değişiminde testi kırardı
    // ve bekçi "kurt geldi" diye bağıran bir teste dönerdi. Daha ince bir denge sorusu varsa
    // cevabı test değil ölçüm aracıdır: `OLCUM=tam npx tsx tools/olcum-hedefler.ts`.
  });

  it('zincir bedeli SEÇİLEN kolun bandında (%2-4) — ölçülen hedef %2,7', { timeout: 90_000 }, () => {
    const d = (uygulanan().serit - taban().serit) / taban().serit;
    expect(d).toBeLessThan(0); // ödül zinciri kısaltır, uzatmaz
    expect(Math.abs(d)).toBeGreaterThan(0.025);
    // ÜST SINIR asıl bekçi: D1'de elenen dokuz kolun en ucuzu %7 götürüyordu. Hedef ödülü o
    // bandın altında kaldığı sürece meşru; üstüne çıkarsa D1'in eleme gerekçesine düşer.
    // Üst sınır yürürlükteki %3,2'ye YAKIN tutuldu (%4). Geniş bırakmak (%5) bir mutasyonun
    // kaçmasına yol açmıştı — bant, ölçülen değerin etrafında dar olmalı ki bekçilik etsin.
    expect(Math.abs(d)).toBeLessThan(0.038);
  });

  it('💎 ödülü tempoya GİRMEZ (h0 kolunun hükmü)', { timeout: 90_000 }, () => {
    // `h0` kolu tabanın birebir kopyası çıkmıştı: elmasın bugün harcaması yok. Bu, elmas
    // ödüllerinin ekonomiye HİÇBİR kanaldan giremediğini söyler — D5 Usta katmanı elması
    // harcanabilir yaptığı gün bu beklenti kırılır ve D-089'un elmas hükmü yeniden okunur.
    const h0 = olc('h0', () => hedefAkisiAyarla(HEDEF_KOLLARI.h0.fabrika(0)));
    expect(h0.serit).toBe(taban().serit);
    expect(h0.odenen).toBe(0);
  });

  it('AÇILIŞ ölçütleri (D-079) hedef ödülünden etkilenmedi', { timeout: 90_000 }, () => {
    odemeleriSifirla();
    kolAyarla(VARSAYILAN);
    m1Ayarla(false);
    hedefAkisiAyarla(HEDEF_KOLLARI.hUYG.fabrika(1));
    onbellekTemizle();
    milestoneTazele();
    const o = olcutler();
    expect(o.ilkAlim!).toBeLessThan(90);
    expect(o.acilisEnUzun).toBeLessThanOrEqual(2 * 60);
    expect(o.otomasyon!).toBeLessThan(15 * 60);
  });
});
