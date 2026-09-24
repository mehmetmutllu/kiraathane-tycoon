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
 *   4. **Öğretme** (bulaşık döngüsü) ipucuların önünde: oyuncu o mekaniği hiç bilmiyor, bilmeden
 *      görev de yapılamaz. İpucular ise var olan bir mekanikte kolaylık sunar.
 *   5. Karakter ipucu tepsininkinden önce: biri görevin talimatı (ne yapacağını söyler), öteki
 *      bir kolaylık (yapabileceğini söyler).
 *   6. **seviye** (D-142, G-66/G-67) — seviye atlama ödül ekranı. Öğreticilerin ÖNÜNDE (bir ödül
 *      bekletilmez) ama ipucular gibi SIRA BEKLER: seviye çoğu zaman görev bitince (XP) atlanır,
 *      yani tam kutlamanın ortasında — ekran kutlama bitince gelir, üstüne binmez.
 */

/** Ekranı kesen kanallar. `null` = ekran serbest. */
export type EkranKanali = 'cevrimdisi' | 'usta' | 'seviye' | 'ogretme-bulasik' | 'ipucu-karakter' | 'ipucu-tepsi' | null;

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
  /** Seviye atlama ödül ekranı bekliyor (D-142). */
  seviyeVar?: boolean;
  /** Bulaşık ÖĞRETME kartının koşulları sağlandı (bulaşık görevi aktif, kart hiç görülmedi). */
  bulasikOgretmeHazir: boolean;
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
  if (g.seviyeVar) return 'seviye';
  // ÖĞRETME, İPUCUNDAN ÖNCE: biri mekaniğin KENDİSİNİ tanıtır (bilmeden oynanamaz), öteki var
  // olan bir mekanikte kolaylık sunar. G-63'ün kartı bu yüzden tepsininkinin önündedir.
  if (g.bulasikOgretmeHazir) return 'ogretme-bulasik';
  if (g.karakterIpucuHazir) return 'ipucu-karakter';
  if (g.tepsiIpucuHazir) return 'ipucu-tepsi';
  return null;
}

/** A4 (T9c · D-147): Android geri tuşunun o anki eylemi. */
export type GeriEylemi = 'cevrimdisi' | 'usta' | 'panel' | 'seviye' | 'ipucu' | 'kucult';

/**
 * GERİ TUŞU — üstte ne varsa onu kapatır; hiçbiri yoksa uygulamayı KÜÇÜLTÜR (kapatmaz).
 * Eskiden dinleyici yoktu: panel açıkken geri → uygulama kapanıyordu (T9b A4). Sıra ekranın çizim
 * sırasıdır: kanal önceliği (`ekranKanali`) paneli ancak çevrimdışı/Usta'nın altına koyar, ipucular
 * ve seviye ekranı panelin altında sıra bekler. Ödül ekranlarında geri = "Al" (₺ kaybolmaz).
 */
export function geriTusu(kanal: EkranKanali, panelAcik: boolean): GeriEylemi {
  if (kanal === 'cevrimdisi' || kanal === 'usta') return kanal;
  if (panelAcik) return 'panel';
  if (kanal === 'seviye') return 'seviye';
  if (kanal != null) return 'ipucu';
  return 'kucult';
}

/**
 * B2 (T9d · D-146): TEPSİ İPUCUNUN ANI. Eskiden koşul yalnız "tepside ürün var"dı ve ipucu İLK
 * servisin ortasında ekranı karartıyordu: "Çayı müşteriye götür" görevi başlarken "Müşteri
 * kalmadıysa tepsini boşaltabilirsin" — görevle çelişik, kutu servis edilecek masanın üstünde.
 * İpucu cümlesinin kendisi koşulu söylüyor: elindeki ürünü isteyen müşteri KALMADIYSA. Yolda gelen
 * (`toTable`) müşteri de sayılır — oturunca o ürünü isteyecek. İlk servis yapılmadan hiç çıkmaz.
 */
export function tepsiIpucuZamani(s: {
  tray: number;
  trayFood: number;
  teasServed: number;
  npcs: readonly { state: string; product: string }[];
}): boolean {
  if (s.tray + s.trayFood <= 0 || s.teasServed < 1) return false;
  return !s.npcs.some(
    (n) =>
      (n.state === 'toTable' || n.state === 'waitingForTea') &&
      (n.product === 'tost' ? s.trayFood > 0 : s.tray > 0),
  );
}
