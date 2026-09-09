/**
 * kabuk.ts — DUVAR KABUĞU KİPİNİN TEK KAYNAĞI (S4).
 *
 * Kullanıcı 2026-09-09: *"duvarı direkt komple KayKit'e bağlama, eğer beğenmezsek eskisine
 * dönebilir olalım."* Bu yüzden takas bir SİLME değil bir KİP: maketin üç katmanlı duvarı
 * (`wallPanel.tsx`) yerinde duruyor, KayKit modülleri (`KayWalls.tsx`) onun yanına kondu ve
 * ikisi de aynı parça listesini (`wallLook.WALL_RUNS`) okuyor.
 *
 * GERİ DÖNÜŞ = BU SATIR. Bir commit revert'ı ya da dosya silme gerekmez.
 * Çalışırken çevirmek için: `window.__kabuk('maket')` ya da DevSandbox → Kabuk.
 *
 * Kayda GİRMEZ (bkz. `store.kabuk`): geliştirme ayarı, oyuncu ilerlemesi değil.
 */
export type KabukKipi = 'maket' | 'kaykit';

/**
 * Yeni oturumun açılış kipi — **'maket'** (kullanıcı kararı 2026-09-09, D-100).
 *
 * KayKit duvarı denendi ve REDDEDİLDİ. İki gerekçe, ikisi de ölçülebilir:
 *  1. **Duvar ikiye bölünüyor.** Modülün kendi yatay oluğu dünyada y = 1,60'ta, yani tam
 *     ortada; maketin lambri hattı 0,94'te. Ölçüm bunu §B2'de önceden söylemişti, kullanıcı
 *     ekranda görünce *"duvar 2'ye bölünük"* dedi.
 *  2. **Parçalar birbirinden farklı.** K4 eş dağıtım gerilmeyi HER HAT İÇİNDE eşitliyor ama
 *     HATLAR ARASINDA eşitlemiyor: modül eni 3,00 · 3,06 · 3,18 · 3,40 · 3,60 · 3,80 çıkıyor
 *     (%27 fark) ve iki hattın buluştuğu köşede yan yana düşüyor. Kullanıcı: *"her parça
 *     arasında fark var"*. Bu ÖLÇÜLMEDİ — rapor gerilmeyi hat içinde ölçtü, bina genelinde
 *     değil. Tekrar denenirse çözüm bina için TEK adım (global 3,2 yerine ortak bir adım).
 *
 * Kip silinmedi: `'kaykit'` yazmak yeter, hat çalışır durumda. Yeni bir düz duvar paketi
 * gelirse (S11) ölçü katmanı ve döşeme matematiği hazır bekliyor.
 */
export const KABUK_VARSAYILAN: KabukKipi = 'maket';
