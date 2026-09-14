/**
 * ses-adaylari.ts — S17'nin ADAY HAVUZU: hangi olay için hangi Kenney dosyaları ölçülecek.
 *
 * NEDEN AYRI DOSYA: havuzu hem ölçüm aracı (`olcum-ses-s17.ts`) hem dinleme panosu
 * (`ses-panosu.mjs`) okuyor. İki yerde ayrı liste tutmak, panoda DUYULAN adayla raporda
 * ÖLÇÜLEN adayın ayrışması demekti — S17'nin cevaplamaya çalıştığı sorunun ta kendisi.
 *
 * HAVUZ NASIL SEÇİLDİ (ve neden "seçim" burada BİTMİYOR):
 * 9 CC0 Kenney paketindeki 706 dosya ADIYLA tarandı; her olay için ada göre makul olan adaylar
 * havuza alındı. Havuz bir KARAR DEĞİL, ölçülecek kollar listesidir — hangisinin gireceği
 * ① ölçümün sayısı (kataloğun 36 çiftlik ayırt matrisini bozuyor mu) ② kullanıcının KULAĞI
 * (`feedback_show_dont_ask` — estetik çatal metinle değil duyurularak sorulur) ile belirlenir.
 *
 * İKİ OLAY HAVUZSUZ VE GEREKÇESİ ÖLÇÜLDÜ:
 *   · `pour` — akan sıvı sesi 706 dosyanın HİÇBİRİNDE yok (ad taraması: 0 eşleşme). Ama olayın
 *     kendisi "semaverden tepsiye çay almak"tır ve D-106 semaver karşılığını `metalPot`ta
 *     bulmuştu; havuz bu yüzden metal kap sesleriyle kuruldu — su sesiyle değil.
 *   · ORTAM UĞULTUSU — 9 paketin hiçbiri ortam/döngü paketi değil (ad taraması: 0 eşleşme).
 *     O kolunun adayı bu yüzden dosya değil; rapor §6'ya bakın.
 */

/** Havuzun kök klasörü — `.gitignore`da; `tools/indir-kenney.ps1` yeniden indirir. */
export const KOK = 'indirilen';

const RPG = `${KOK}/kenney_rpg-audio/Audio`;
const ARAYUZ = `${KOK}/kenney_interface-sounds/Audio`;
const CARPMA = `${KOK}/kenney_impact-sounds/Audio`;
const JINGLE = `${KOK}/kenney_music-jingles/Audio`;

/** Bir aday: hangi olay için, hangi dosya, hangi paketten. */
export interface Aday {
  /** Kısa kimlik — PCM önbelleği ve pano bunu kullanır. */
  ad: string;
  yol: string;
  paket: string;
}

/** Olay → aday dosyalar. Anahtarlar `SesId` ile birebir aynı. */
export const HAVUZ: Record<string, Aday[]> = {
  // D-106: coin = RPG Audio `handleCoins` (GERÇEK madenî para). Casino Audio'nun jetonu
  // plastik çıkmıştı ve Kat 2'ye (okey/tavla) ayrıldı — bu havuza bilerek girmiyor.
  coin: [
    { ad: 'coin_handleCoins', yol: `${RPG}/handleCoins.ogg`, paket: 'rpg-audio' },
    { ad: 'coin_handleCoins2', yol: `${RPG}/handleCoins2.ogg`, paket: 'rpg-audio' },
    { ad: 'coin_metalClick', yol: `${RPG}/metalClick.ogg`, paket: 'rpg-audio' },
    { ad: 'coin_metalLatch', yol: `${RPG}/metalLatch.ogg`, paket: 'rpg-audio' },
  ],
  // Olay "ocaktan tepsiye çay alındı" = SEMAVERE dokunmak. Akan su sesi hiçbir pakette yok.
  pour: [
    { ad: 'pour_metalPot1', yol: `${RPG}/metalPot1.ogg`, paket: 'rpg-audio' },
    { ad: 'pour_metalPot2', yol: `${RPG}/metalPot2.ogg`, paket: 'rpg-audio' },
    { ad: 'pour_metalPot3', yol: `${RPG}/metalPot3.ogg`, paket: 'rpg-audio' },
  ],
  // D-106: bardak = Interface `glass_00x`. Cam çarpma sesleri ikinci aile olarak havuzda.
  serve: [
    { ad: 'serve_glass_001', yol: `${ARAYUZ}/glass_001.ogg`, paket: 'interface-sounds' },
    { ad: 'serve_glass_003', yol: `${ARAYUZ}/glass_003.ogg`, paket: 'interface-sounds' },
    { ad: 'serve_glass_005', yol: `${ARAYUZ}/glass_005.ogg`, paket: 'interface-sounds' },
    { ad: 'serve_impactGlass_light_000', yol: `${CARPMA}/impactGlass_light_000.ogg`, paket: 'impact-sounds' },
    { ad: 'serve_impactGlass_light_002', yol: `${CARPMA}/impactGlass_light_002.ogg`, paket: 'impact-sounds' },
  ],
  // Para HARCAMA. Sentezdeki jest bilerek İNİYOR (audio.ts); hazır adayların jesti ölçülecek.
  purchase: [
    { ad: 'purchase_confirmation_001', yol: `${ARAYUZ}/confirmation_001.ogg`, paket: 'interface-sounds' },
    { ad: 'purchase_drop_002', yol: `${ARAYUZ}/drop_002.ogg`, paket: 'interface-sounds' },
    { ad: 'purchase_bookPlace1', yol: `${RPG}/bookPlace1.ogg`, paket: 'rpg-audio' },
    { ad: 'purchase_close_002', yol: `${ARAYUZ}/close_002.ogg`, paket: 'interface-sounds' },
  ],
  // Pad DOLUYOR — yükselen/açılan bir jest aranıyor.
  padFill: [
    { ad: 'padFill_maximize_003', yol: `${ARAYUZ}/maximize_003.ogg`, paket: 'interface-sounds' },
    { ad: 'padFill_maximize_006', yol: `${ARAYUZ}/maximize_006.ogg`, paket: 'interface-sounds' },
    { ad: 'padFill_maximize_009', yol: `${ARAYUZ}/maximize_009.ogg`, paket: 'interface-sounds' },
    { ad: 'padFill_open_002', yol: `${ARAYUZ}/open_002.ogg`, paket: 'interface-sounds' },
  ],
  quest: [
    { ad: 'quest_confirmation_002', yol: `${ARAYUZ}/confirmation_002.ogg`, paket: 'interface-sounds' },
    { ad: 'quest_PIZZI05', yol: `${JINGLE}/Pizzicato jingles/jingles_PIZZI05.ogg`, paket: 'music-jingles' },
    { ad: 'quest_STEEL03', yol: `${JINGLE}/Steel jingles/jingles_STEEL03.ogg`, paket: 'music-jingles' },
    { ad: 'quest_pluck_002', yol: `${ARAYUZ}/pluck_002.ogg`, paket: 'interface-sounds' },
  ],
  // Kataloğun en uzunu ve en "olaylı"sı — jingle ailesi burada gerçek aday.
  level: [
    { ad: 'level_STEEL08', yol: `${JINGLE}/Steel jingles/jingles_STEEL08.ogg`, paket: 'music-jingles' },
    { ad: 'level_SAX03', yol: `${JINGLE}/Sax jingles/jingles_SAX03.ogg`, paket: 'music-jingles' },
    { ad: 'level_PIZZI10', yol: `${JINGLE}/Pizzicato jingles/jingles_PIZZI10.ogg`, paket: 'music-jingles' },
    { ad: 'level_STEEL16', yol: `${JINGLE}/Steel jingles/jingles_STEEL16.ogg`, paket: 'music-jingles' },
  ],
  // 💎 Usta — sentezde ÇAN. Hazır tarafta gerçek çan çarpması var.
  master: [
    { ad: 'master_impactBell_001', yol: `${CARPMA}/impactBell_heavy_001.ogg`, paket: 'impact-sounds' },
    { ad: 'master_impactBell_003', yol: `${CARPMA}/impactBell_heavy_003.ogg`, paket: 'impact-sounds' },
    { ad: 'master_bong_001', yol: `${ARAYUZ}/bong_001.ogg`, paket: 'interface-sounds' },
    { ad: 'master_STEEL13', yol: `${JINGLE}/Steel jingles/jingles_STEEL13.ogg`, paket: 'music-jingles' },
  ],
  reward: [
    { ad: 'reward_pluck_001', yol: `${ARAYUZ}/pluck_001.ogg`, paket: 'interface-sounds' },
    { ad: 'reward_HIT07', yol: `${JINGLE}/Hit jingles/jingles_HIT07.ogg`, paket: 'music-jingles' },
    { ad: 'reward_confirmation_003', yol: `${ARAYUZ}/confirmation_003.ogg`, paket: 'interface-sounds' },
    { ad: 'reward_HIT12', yol: `${JINGLE}/Hit jingles/jingles_HIT12.ogg`, paket: 'music-jingles' },
  ],
};

/** Havuzun düz listesi — çözücüye verilen sıra. */
export const TUM_ADAYLAR: Aday[] = Object.values(HAVUZ).flat();
