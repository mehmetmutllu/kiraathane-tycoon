/**
 * hedefler.test.ts — D-089 + D-090'IN BEKÇİSİ: hedefler (koleksiyon) sistemi.
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
  activeTier, claimGoalReward, claimableGoals, collectionBonus, collectionMult, goalCategories,
  goalId, goalViews, tierBonus, tierState, totalTiers,
  type GoalMetrics,
} from '../src/game/goals';
import { economyConfig as C, type GoalCategory } from '../src/config/economy.config';
import {
  kolAyarla, VARSAYILAN, onbellekTemizle, milestoneTazele, m1Ayarla, olcutler,
  hedefAkisiAyarla, hedefCarpaniAyarla,
} from '../tools/simulate';
import { HEDEF_KOLLARI, odemeleriSifirla, sonKosuToplami } from '../tools/hedef-kollari';

const bos = (): GoalMetrics => ({ served: 0, pads: 0, lifetime: 0, dishes: 0, masterTables: 0 });
const kat = (id: string): GoalCategory => goalCategories().find((c) => c.id === id)!;

// Testlerin kendi kategorisi: gerçek config'e bağlı kalmadan kimlik/durum kuralları sınanır.
const T: GoalCategory = {
  id: 'test', name: 'Test', metric: 'served', note: '—',
  tiers: [10, 20, 30],
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

  it('ödül CONFIG`ten gelir — KALICI ÇARPAN payı + 💎, HUD`a gömülü değil', () => {
    const cok: GoalMetrics = { served: 1e9, pads: 99, lifetime: 1e9, dishes: 1e9, masterTables: 99 };
    expect(claimGoalReward(goalId('master', 0), cok, [])).toEqual({
      bonus: tierBonus(),
      diamonds: C.goals.diamondByTier[0],
    });
  });

  it('ödül ₺ VERMEZ — kalıp D-090`da değişti (sabit ₺ merdiveni kalktı)', () => {
    // Bu beklenti bir REGRESYON bekçisidir: "hedefe biraz da para koyalım" diyen bir değişiklik
    // ölçülmemiş bir ₺ akışı açar ve D-089'un üç ölçüm turu kaybettiren tuzağına geri döner
    // (rapor Bulgu 10 · Bulgu 14). ₺ isteniyorsa önce `tools/olcum-hedefler.ts` koşulur.
    const cok: GoalMetrics = { served: 1e9, pads: 99, lifetime: 1e9, dishes: 1e9, masterTables: 99 };
    const odul = claimGoalReward(goalId('service', 0), cok, []) as unknown as Record<string, unknown>;
    expect(odul).not.toHaveProperty('reward');
    expect(Object.keys(odul).sort()).toEqual(['bonus', 'diamonds']);
    // Hiçbir kategori kendi ₺ merdivenini taşımaz.
    for (const cat of goalCategories()) expect(cat).not.toHaveProperty('rewards');
  });

  it('kademe payı EŞİT ve toplamı config`teki TEK sayıya eşit', () => {
    // Ölçülen `hF` kolunun biçimi: çarpan açılan kademe sayısıyla DOĞRUSAL. Payı kademeye göre
    // değiştirmek (geç kademe daha çok versin) ölçülmemiş bir eksen ekler.
    const hepsi = goalCategories().flatMap((c) => c.tiers.map((_, i) => goalId(c.id, i)));
    expect(hepsi.length).toBe(totalTiers());
    expect(collectionBonus(hepsi)).toBeCloseTo(C.goals.incomeBonusTotal, 10);
    expect(collectionMult([])).toBe(1); // hiç toplanmamışken ekonomi BİREBİR eski
    expect(collectionMult(hepsi)).toBeCloseTo(1 + C.goals.incomeBonusTotal, 10);
    for (const g of goalViews(bos(), [])) expect(g.bonus).toBeCloseTo(tierBonus(), 12);
  });

  it('eşikler ARTAN — değilse "sıradaki kademe" anlamını yitirir', () => {
    for (const cat of goalCategories()) {
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
    hedefAkisiAyarla(null);
    hedefCarpaniAyarla(null);
    kur();
    onbellekTemizle();
    milestoneTazele();
    const o = olcutler();
    const r = { serit: o.serit ?? NaN, odenen: sonKosuToplami() };
    bellek.set(anahtar, r);
    return r;
  }

  const taban = () => olc('taban', () => {});
  /** UYGULANAN hâl: config'in gerçek `incomeBonusTotal`ini koşturan kol (hUYG deseni, D-090). */
  const uygulanan = () => olc('hUYGF', () => hedefCarpaniAyarla(HEDEF_KOLLARI.hUYGF.carpanFabrika!(1)));

  beforeEach(() => {
    hedefAkisiAyarla(null);
    hedefCarpaniAyarla(null);
    onbellekTemizle();
    milestoneTazele();
  });

  it('çarpan GERÇEKTEN uygulanıyor (kanca tetikleniyor)', { timeout: 90_000 }, () => {
    // D1'de `iade:0.25` varyantı hiç tetiklenmemiş ve rapora sahte bir "fark yok" satırı
    // girmişti. `hF` kolu ₺ ÖDEMEDİĞİ için "ödenen > 0" damgası burada kullanılamaz — kanca
    // tetiklendiğinin tek kanıtı şeridin tabandan FARKLI olmasıdır (rapor Bulgu 15).
    expect(uygulanan().serit).not.toBe(taban().serit);
    expect(uygulanan().odenen).toBe(0); // kalıp ₺ ödemez: ödeme düşerse kalıp sessizce değişmiş demektir
  });

  it('DOZ ÖLÇÜLEN değerde SABİTLİ — değiştirmek yeniden ölçüm ister', () => {
    // Bu beklenti bir MUTASYON KAÇIŞINDAN doğdu (M9): dozu %10 → %11 yapan ince bir değişiklik
    // aşağıdaki zincir-bedeli bandından KAÇIYOR (%4,0 → ~%4,4, üst sınır %5'in altında). Bandı
    // ±%5'e indirmek sim modelinin her küçük değişiminde testi kırardı — D-089'da tam bu tuzağa
    // düşülmüştü. Çözüm bandı daraltmak değil, ölçülen sayıyı DOĞRUDAN çivilemek: dolaylı ölçüt
    // gürültülüdür, doğrudan olan her değişikliği yakalar.
    //
    // Bu test "kırılsın diye" yazıldı: dozu değiştirmek MEŞRU bir iş, ama varyant kapısından
    // geçmek zorunda (`OLCUM=tam npx tsx tools/olcum-hedefler.ts` → rapor §6.3'e yeni satır →
    // karar). Testi güncellemek o turun son adımıdır, ilk adımı değil.
    expect(C.goals.incomeBonusTotal).toBe(0.10);
    expect(tierBonus()).toBeCloseTo(0.004, 12); // 25 kademe → kademe başına +%0,4
  });

  it('zincir bedeli SEÇİLEN kolun bandında (%3-5) — ölçülen hedef %4,0', { timeout: 90_000 }, () => {
    const d = (uygulanan().serit - taban().serit) / taban().serit;
    expect(d).toBeLessThan(0); // çarpan zinciri kısaltır, uzatmaz
    expect(Math.abs(d)).toBeGreaterThan(0.03);
    // ÜST SINIR asıl bekçi: D1'de elenen dokuz kolun en ucuzu %7 götürüyordu ve `hF` %20 dozu
    // (%-7,6) tam bu yüzden alınmadı. Bant ölçülen %4,0'ın etrafında DAR tutuldu — geniş bant
    // "bir şey değişti mi" sorusuna hep hayır der (D-089'da iki mutasyon geniş banttan kaçmıştı).
    expect(Math.abs(d)).toBeLessThan(0.05);
  });

  it('UYGULANAN config, seçilen SENTETİK kola denk (hUYG dersi)', { timeout: 120_000 }, () => {
    // D-089'un en pahalı dersi: "seçilen doz iyiydi, config'e yazdığım da ona denktir" bir
    // VARSAYIMDI ve iki kez çürüdü (rapor Bulgu 10). Bu beklenti o varsayımı teste çevirir:
    // config'in gerçek bloğu, kararın dayandığı `hF` %10 satırından anlamlı biçimde sapamaz.
    const hF10 = olc('hF10', () => hedefCarpaniAyarla(HEDEF_KOLLARI.hF.carpanFabrika!(0.1)));
    const dUyg = Math.abs(uygulanan().serit - taban().serit) / taban().serit;
    const dhF = Math.abs(hF10.serit - taban().serit) / taban().serit;
    expect(Math.abs(dUyg - dhF)).toBeLessThan(0.005);
  });

  it('SABİT ₺ kalıbı geri gelirse bekçi kırılır (D-089`un kolu artık yürürlükte değil)', { timeout: 90_000 }, () => {
    // `hUYG` (dondurulmuş D-089 merdiveni) hâlâ ölçülebilir ve tempoya HİÇ dokunmadığı hâlde
    // zincirden %-3,2 götürüyordu — bu satır kararın kıyas noktasıdır ve yeniden üretilebilir
    // kalmalı. Bir gün biri "hem çarpan hem ₺ verelim" derse önce bu iki satır okunur.
    const eski = olc('hUYG', () => hedefAkisiAyarla(HEDEF_KOLLARI.hUYG.fabrika(1)));
    expect(eski.odenen).toBeGreaterThan(2_900);
    expect(eski.odenen).toBeLessThan(3_500);
    const d = Math.abs(eski.serit - taban().serit) / taban().serit;
    expect(d).toBeGreaterThan(0.025);
    expect(d).toBeLessThan(0.038);
  });

  it('💎 ödülü tempoya GİRMEZ (h0 kolunun hükmü)', { timeout: 90_000 }, () => {
    // `h0` kolu tabanın birebir kopyası çıkmıştı: elmasın bugün harcaması yok. Bu, elmas
    // ödüllerinin ekonomiye HİÇBİR kanaldan giremediğini söyler — D5 Usta katmanı elması
    // harcanabilir yaptığı gün bu beklenti kırılır ve D-089'un elmas hükmü yeniden okunur.
    const h0 = olc('h0', () => hedefAkisiAyarla(HEDEF_KOLLARI.h0.fabrika(0)));
    expect(h0.serit).toBe(taban().serit);
    expect(h0.odenen).toBe(0);
  });

  it('AÇILIŞ ölçütleri (D-079) çarpandan etkilenmedi', { timeout: 90_000 }, () => {
    // `hF`'in kararı kazanmasının SEBEBİ buydu (rapor Bulgu 12): elenen `hG` kolu açılışı
    // eziyordu (otomasyon 6,1 → 1,7 dk). Bu beklenti o farkı kilitler.
    odemeleriSifirla();
    kolAyarla(VARSAYILAN);
    m1Ayarla(false);
    hedefAkisiAyarla(null);
    hedefCarpaniAyarla(HEDEF_KOLLARI.hUYGF.carpanFabrika!(1));
    onbellekTemizle();
    milestoneTazele();
    const o = olcutler();
    expect(o.ilkAlim!).toBeLessThan(90);
    expect(o.acilisEnUzun).toBeLessThanOrEqual(2 * 60);
    expect(o.otomasyon!).toBeLessThan(15 * 60);
    // Açılış SABİT kalmalı, yalnız "ölçütü geçmeli" değil: taban 6,1 dk (366 sn).
    expect(Math.abs(o.otomasyon! - 366)).toBeLessThan(30);
  });
});
