/**
 * markerFrame.ts — ZEMİN İŞARETİNİN ÇERÇEVESİ: tek doğru kaynağı (S24 · D-121).
 *
 * NEDEN AYRI MODÜL. S24 ölçümü şunu buldu: oyuncunun bir yükseltme noktasını doldurması
 * DAİRE testine bağlıydı (`dist2D(player, spot) < TABLE_UP_RADIUS | PAD_RADIUS`), ama ekranda
 * daire çizilmiyordu — çizilen şey köşe parantezli bir DİKDÖRTGEN'di. İki geometri birbirinden
 * türemiyordu ve ölçülen sonuç: **tetikleyen alanın %50,4'ü çerçevenin dışında** kalıyordu
 * (kullanıcının *"yanında falan değil, çerçeve içinde olayım"* cümlesi bu). Üstelik geometri
 * iki değil ÜÇTÜ: işaretin "üstündesin" kabarması da kendi dairesini kuruyordu (`hw × 1,35`),
 * onun da %34,3'ü çerçeve dışındaydı.
 *
 * S23'ten farkı önemli: orada ölçü YANLIŞ yazılmıştı (gizli bir √3 çarpanı). Burada ölçü doğru
 * yazılıyor — çizilen çerçeve yazanla birebir aynı (sapma 0,0000 br, 13 işaretin 13'ünde).
 * Kusur sayıda değil, **aynı şeyin iki ayrı yerde ayrı ayrı tanımlanmasında**. O yüzden çözüm
 * de sayı düzeltmek değil: çerçeve artık BURADA bir kez hesaplanır, hem çizim (`GroundMarker`)
 * hem tetik (`tick.ts`) hem de kabarma aynı fonksiyondan okur. Üçü bir daha ayrışamaz.
 *
 * Bu modülde oyun DURUMU tutulmaz; hepsi saf fonksiyon veya sabittir (`rules.ts` deseni) ve
 * three/react'e DOKUNMAZ — tick ve testler onu düğüm ağacı olmadan çağırabilsin diye.
 *
 * Sayılar: `docs/tetik-raporu-s24.md` · ham `docs/olcum-tetik-s24.txt`.
 */
import type { Vec3 } from './types';

/**
 * ÇERÇEVENİN GENİŞLİĞİ YAZIDAN ÇÖZÜLÜR, TAHMİN EDİLMEZ.
 *
 * İlk hâlde çerçeve `radius`tan türüyordu ve yazı ortalanıyordu; küçük işaretlerde (masa/Usta,
 * r = 0,6) "YÜKSELT" ile solundaki ok üst üste biniyordu (kullanıcı 2026-09-09). Artık genişlik
 * `ok bloğu + boşluk + yazının gerçek genişliği` olarak kuruluyor. Baloo 2 Bold'da ortalama
 * harf ilerlemesi ≈ 0,58 em; kısa büyük-harf etiketlerde yeterli yaklaşım — ve çizimdeki
 * `maxWidth` üst sınırı ayrıca kilitliyor, yani hata payı taşmaya değil sarmaya gider.
 */
export const HARF_EM = 0.58;
export const ETIKET_PUNTO = 0.38;
/**
 * OKUN AYRILAN BLOĞU — ve **çizilen okun eni bu sayıdan TÜRER** (S23 · D-120).
 *
 * S23 ölçümü kusurun yerini bulmuştu: blok 0,340 r yazılıyken çizilen uç 0,554 r idi, çünkü uç
 * `circleGeometry(r·0,32, 3)` idi ve 3 kenarlı çemberin KENARI yarıçapın √3 katıdır. Yapısal
 * kapatma: okun eni ayrı bir sayı değil, `OK_GENIS`in kendisi.
 */
export const OK_GENIS = 0.4;
export const OK_BOSLUK = 0.16;
export const KENAR_PAYI = 0.18;

/** İşaret yarıçapları (çerçevenin YARI-YÜKSEKLİĞİ; genişlik yazıdan çözülür). */
export const ISARET_R = 0.85;
/** Masa ve Usta noktaları küçüktür — orta koridor boş kalsın (D-018 §1). */
export const MASA_ISARET_R = 0.6;

/** İşaretin zemindeki dikdörtgeni: yarı-genişlik × yarı-yükseklik (dünya birimi). */
export interface Cerceve {
  hw: number;
  hh: number;
}

/**
 * Çizilen çerçeve. `GroundMarker` bu kutuyu çizer, `tick.ts` bu kutuyu test eder.
 *
 * DİKKAT — bu fonksiyonun çıktısı bir GÖRSEL ölçü değil, artık bir OYUN KURALI: değiştirirsen
 * hem işaretin boyu hem de oyuncunun nerede durunca dolum başlattığı birlikte değişir. Kasıtlı:
 * ayrışmalarını engellemenin tek yolu tek kaynak olmalarıydı.
 */
export function markerFrame(label: string, radius: number, arrow: boolean): Cerceve {
  const punto = radius * ETIKET_PUNTO;
  const yaziGen = label.length * HARF_EM * punto;
  const okBlok = arrow ? (OK_GENIS + OK_BOSLUK) * radius : 0;
  return {
    hw: Math.max(radius * 1.05, (okBlok + yaziGen) / 2 + KENAR_PAYI * radius),
    hh: radius,
  };
}

/**
 * Oyuncu çerçevenin İÇİNDE mi? (Eksene hizalı kutu testi — işaretler döndürülmüyor.)
 *
 * `pay` yalnız görsel kabarma gibi "biraz daha geniş" isteyen çağıranlar içindir; TETİK payı
 * KULLANMAZ — tetik tam olarak çizilen dikdörtgendir, ölçümün "dışarı %0,0 · ölü %0,0" satırı
 * bu yüzden doğrudur.
 */
export function inFrame(px: number, pz: number, spot: Vec3, c: Cerceve, pay = 0): boolean {
  return Math.abs(px - spot[0]) <= c.hw + pay && Math.abs(pz - spot[2]) <= c.hh + pay;
}

// --- ETİKETLER: hem çizim hem tetik aynı metni okumalı, yoksa çerçeve genişliği ayrışır.
// (Etiket uzunluğu `hw`ye giriyor: "YÜKSELT" ile "SV 12" aynı kutuyu vermez.)

/** G-11: her yükseltme noktası AYNI sözü söyler; hangi obje olduğunu metin değil KONUM anlatır. */
export const ETIKET_SERVIS = 'YÜKSELT';
export const ETIKET_LAVABO = 'Lavaboyu Büyüt';
/** G-18: masa noktasının yazısı seviyeyi taşır (çoklu sinyalin sayı kanalı). */
export const masaEtiketi = (seviye: number): string => `SV ${seviye + 1}`;

export const servisCercevesi = (): Cerceve => markerFrame(ETIKET_SERVIS, ISARET_R, true);
export const masaCercevesi = (seviye: number): Cerceve => markerFrame(masaEtiketi(seviye), MASA_ISARET_R, true);
export const padCercevesi = (label: string): Cerceve => markerFrame(label, ISARET_R, false);
export const lavaboCercevesi = (): Cerceve => markerFrame(ETIKET_LAVABO, ISARET_R, false);
