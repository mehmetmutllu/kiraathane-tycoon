/**
 * ekranKanali.ts — EKRANI KESEN KANALLARIN TEK ÖNCELİK SIRASI (G-60, 2026-09-18).
 *
 * ## Kusur
 * HUD'da ekranı kesen dört kanal vardı ve her biri KENDİ koşulunu taşıyordu: çevrimdışı kazanç
 * modali, Usta onay modali, karakter paneli spotlight'ı, tepsi ipucu. Aralarındaki ilişki elle
 * yazılmış `&& !showOffline && !spotlight` zincirleriyle kuruluyordu — yani sıra bir KURAL değil,
 * dört ayrı ifadenin tesadüfi kesişimiydi. Yeni bir kanal eklendiğinde (ya da biri unutulduğunda)
 * iki şey aynı anda açılıyordu.
 *
 * Kullanıcı bunu iki ayrı cümleyle bildirdi (2026-09-18):
 *   *"çay butonuna [basınca] uyarı geliyor; uyarı geldiği anda altta biten görev de var — onların
 *     bir sıralaması olması gerekiyor"*
 *   *"'kimse yokken çayları tezgâha geri bırakabilirsiniz' … o anda hiçbir görev olmamalı …
 *     sıralı bir şekilde olacak ki: görev bitti, sonra bu buton, o da gitti, ondan sonra yeni bir şey"*
 *
 * ## Çözüm
 * Sıra tek yerde ve SAF bir fonksiyonda. HUD artık koşul kurmuyor, yalnız "şu an hangi kanal
 * üstte" diye soruyor. Aynı anda birden fazla kanalın açılması yapısal olarak imkânsız: fonksiyon
 * TEK değer döndürüyor. (`visiblePads` deseni — çizen de karar veren de aynı çağrıyı yapar.)
 *
 * ## Sıranın gerekçesi
 *   1. **çevrimdışı** — oyunun ilk karesi; oyuncu daha hiçbir şey yapmadı, ilk gördüğü bu olmalı.
 *   2. **usta** — oyuncunun KENDİ eylemiyle (noktada durarak) istediği onay; 💎 harcaması.
 *   3. **ipucular** — öğretici. Panel açıkken, bir bildirim ekrandayken ya da görev kutlaması
 *      sürerken BEKLERLER; kullanıcının istediği "sıralı" his tam olarak budur. İpucu kaybolmaz,
 *      koşulları sürdüğü sürece sırası gelince çıkar.
 *   4. Karakter ipucu tepsininkinden önce: biri görevin talimatı (ne yapacağını söyler), öteki
 *      bir kolaylık (yapabileceğini söyler).
 */

/** Ekranı kesen kanallar. `null` = ekran serbest. */
export type EkranKanali = 'cevrimdisi' | 'usta' | 'ipucu-karakter' | 'ipucu-tepsi' | null;

export interface EkranGirdisi {
  /** Çevrimdışı kazanç var ve henüz kapatılmadı. */
  cevrimdisiVar: boolean;
  /** Oyuncu bir Usta noktasında bekledi ve modali kapatmadı. */
  ustaVar: boolean;
  /** Oyuncunun kendi açtığı bir panel (Görevler · Hedefler · Mağaza · Karakter · Ayarlar). */
  panelAcik: boolean;
  /** Ekranda ÇİZİLEN bir bildirim (toast) var. */
  bildirimVar: boolean;
  /** Görev geçiş penceresi (kutlama + boşluk) sürüyor. */
  gecisPenceresi: boolean;
  /** Karakter paneli ipucunun kendi koşulları sağlandı (karakter görevi aktif, panel hiç açılmadı). */
  karakterIpucuHazir: boolean;
  /** Tepsi ipucunun kendi koşulları sağlandı (tepside ürün var, ipucu hiç görülmedi). */
  tepsiIpucuHazir: boolean;
}

export function ekranKanali(g: EkranGirdisi): EkranKanali {
  if (g.cevrimdisiVar) return 'cevrimdisi';
  if (g.ustaVar) return 'usta';
  // İpucular SIRA BEKLER: panel açıkken, bildirim ekrandayken ya da kutlama sürerken çıkmazlar.
  if (g.panelAcik || g.bildirimVar || g.gecisPenceresi) return null;
  if (g.karakterIpucuHazir) return 'ipucu-karakter';
  if (g.tepsiIpucuHazir) return 'ipucu-tepsi';
  return null;
}
