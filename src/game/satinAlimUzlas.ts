/**
 * satinAlimUzlas.ts — MAĞAZA ↔ KAYIT UZLAŞMASI (Sprint A · P2). SAF: durum almaz, yan etki yok.
 *
 * Mağazanın bildiği işlemler (RevenueCat `nonSubscriptionTransactions`) kayıtla karşılaştırılır:
 * kayıtta işlenmemiş ve `uzlasmaBasi`ndan sonraki her işlem bir kez ödenir. Böylece kapanan uygulama,
 * Ask-to-Buy/SCA onayı ya da başka cihazdaki alım 💎'ını sonraki açılışta BİR KEZ alır.
 * Ödül kuralı `rules.ts` `applyPurchase`tır (çift işlem · `islenen` sınırı); burada yalnız başlangıç
 * paketinin 💎'ı "bu kayıtta bir kez" kuralına (kol A, 2026-10-09) bağlanır.
 */
import { applyPurchase, purchaseGrant } from './rules';
import type { SatinAlim } from './save';
import { economyConfig as C } from '../config/economy.config';
import { iapConfig } from '../config/iap.config';

export interface MagazaIslemi {
  /** Mağaza işlem kimliği (customerInfo'daki — satın alma dönüşüyle aynı uzay). */
  kimlik: string;
  urun: string;
  /** Satın alma anı (ms). Okunamadıysa NaN → işlenmez. */
  tarih: number;
}

/** RevenueCat `CustomerInfo`nun oyunun kullandığı özü. */
export interface MusteriOzu {
  /** RevenueCat appUserID (`rcKimlik`, ya da logIn olamadıysa anonim kimlik). */
  kimlik: string;
  hak: { reklamsiz: boolean; baslangic: boolean };
  islemler: MagazaIslemi[];
}

/** Başlangıç 💎'ı bu kayıtta verildi mi. Alan yoksa: doğrudan yol (`satinAlimIsle`) başlangıç işlemine 💎 yazdıysa evet. */
function baslangicElmasVerildi(s: SatinAlim, islemler: readonly MagazaIslemi[]): boolean {
  if (s.baslangicElmas) return true;
  const e = s.islemElmas ?? {};
  return islemler.some((t) => t.urun === iapConfig.urun.baslangic && (e[t.kimlik] ?? 0) > 0);
}

/**
 * Reklamsız asimetrik eşitleme: mağaza "var" derse hemen açılır ve hak o kimliğe bağlanır (logIn sonrası
 * anonimden kalıcı kimliğe taşınır); "yok" derse YALNIZ hakkı
 * veren kimlik aynıysa (iade). Başka kimlikteki boş mağaza (anonim, yeni cihaz) satın alımı düşürmez.
 */
export function reklamsizEsitle(satin: SatinAlim, magazaReklamsiz: boolean, kimlik: string): SatinAlim {
  if (magazaReklamsiz) {
    if (satin.reklamsiz && satin.hakKimlik === kimlik) return satin;
    return { ...satin, reklamsiz: true, hakKimlik: kimlik };
  }
  if (satin.reklamsiz && satin.hakKimlik === kimlik) return { ...satin, reklamsiz: false };
  return satin;
}

/**
 * Mağaza bilgisini kayda uygular → yeni `satin` + verilecek 💎. Eski kayıt (`uzlasmaBasi` yok):
 * yalnız `uzlasmaBasi = simdi` ve `baslangicElmas` yazılır, HİÇBİR ŞEY verilmez (geçmiş zaten ödendi).
 */
export function magazaUzlas(satin: SatinAlim, info: MusteriOzu, simdi: number): { satin: SatinAlim; elmas: number } {
  if (satin.uzlasmaBasi == null)
    return { satin: { ...satin, uzlasmaBasi: simdi, baslangicElmas: satin.baslangicElmas ?? satin.baslangic }, elmas: 0 };
  const bas = satin.uzlasmaBasi;
  // Doğrudan yolun verdiği başlangıç 💎'ı bayrağa yazılır — `islemElmas` 50'de kırpılınca iz kaybolmasın.
  let s = !satin.baslangicElmas && baslangicElmasVerildi(satin, info.islemler) ? { ...satin, baslangicElmas: true } : satin;
  let elmas = 0;
  const yeni = info.islemler
    .filter((t) => t.tarih >= bas && !s.islenen.includes(t.kimlik))
    .sort((a, b) => a.tarih - b.tarih);
  for (const t of yeni) {
    const verildi = baslangicElmasVerildi(s, info.islemler);
    const r = applyPurchase(s, t.kimlik, t.urun);
    if (!r) continue;
    let d = r.diamonds;
    s = r.satin;
    const g = purchaseGrant(t.urun);
    if (g?.baslangic) {
      d = verildi ? 0 : C.iap.starterDiamonds;
      const islemElmas = { ...s.islemElmas };
      if (d > 0) islemElmas[t.kimlik] = d; else delete islemElmas[t.kimlik];
      s = { ...s, baslangicElmas: true, islemElmas };
    }
    if (g?.reklamsiz || g?.baslangic) s = { ...s, hakKimlik: s.hakKimlik ?? info.kimlik };
    elmas += d;
  }
  // Geri yükleme / yeni cihaz: hak var ama işlemi uzlasmaBasi'ndan önce → kıyafet + 💎 bu kayıtta bir kez.
  if (info.hak.baslangic) {
    if (!s.baslangic) s = { ...s, baslangic: true };
    if (!baslangicElmasVerildi(s, info.islemler)) {
      elmas += C.iap.starterDiamonds;
      s = { ...s, baslangicElmas: true };
    }
  }
  s = reklamsizEsitle(s, info.hak.reklamsiz, info.kimlik);
  return { satin: s, elmas };
}
