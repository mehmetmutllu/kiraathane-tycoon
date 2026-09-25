/**
 * audioBridge.ts — ses sistemini STORE'a bağlayan katman (Faz E · E3a).
 *
 * `tick.ts`'e neden dokunulmadığı `audio.ts`in başında yazılı. Bu dosya o kararın uygulaması:
 * store'a abone olur, her değişimde bir KESİT çıkarır, iki kesitin farkından olayları türetir
 * (`sesOlaylari` — saf) ve motora verir.
 *
 * `kesitAl` de SAF ve dışa veriliyor: bekçinin doğruladığı asıl şey, hangi durum alanının hangi
 * olayı doğurduğu. "Duyuldu mu" doğrulanamaz; "para sayacı arttığında `coin` olayı doğar mı"
 * doğrulanabilir.
 */
import { levelProgress } from '../config/economy.config';
import { sesOlaylari, sesMotoruKur, type SesKesit, type SesMotoru } from './audio';
import { sesBaglami, webSesArkaUcu } from './audioWeb';
import { muzikMotoruKur, SALON_MUZIGI, type MuzikMotoru } from './music';
import { webMuzikArkaUcu } from './musicWeb';
import { useGame } from './store';

type Durum = ReturnType<typeof useGame.getState>;

/**
 * Durumdan ses kesiti. Store'un TAMAMI okunmaz — yalnız ses üreten alanlar; böylece alakasız
 * bir alan değişince sessizce yeni bir ses doğmaz ve listeye bakan biri "ne ses çıkarıyor"
 * sorusunu tek yerden cevaplar.
 */
export function kesitAl(s: Durum): SesKesit {
  return {
    coinsCollected: s.stats.coinsCollected,
    teaPickups: s.stats.teaPickups,
    // Oyuncunun ELİYLE bıraktığı ürün. Garsonun taşıdığı (`waiterServed`) BİLEREK yok: garson
    // arka planda sürekli servis yapıyor, o sayaç sese bağlansaydı mekân dolduğunda ses
    // kesintisiz bir uğultuya dönerdi. Ses oyuncunun KENDİ eyleminin geri bildirimi.
    served: s.stats.teasServed,
    // Hangi merdivenin yükseldiği sesi değiştirmiyor → tek toplam yeterli.
    yukseltmeToplam:
      s.stationLevels.reduce((a, b) => a + b, 0) +
      s.tableLevels.reduce((a, b) => a + b, 0) +
      s.lavaboLevel,
    padSayisi: s.padsDone.length,
    questIndex: s.questIndex,
    seviye: levelProgress(s.xp).level,
    ustaSayisi: (s.mastersOwned ?? []).length,
    odulSayisi: (s.goalsClaimed ?? []).length + (s.daily?.claimed ?? []).length,
    // İŞLENMİŞ işlem sayılır, `satin.baslangic` değil: geri yükleme (telefon değişti) sahipliği
    // döndürür ama yeni bir alım değildir — ses çalmamalı. Kozmetikte geri yükleme yok (kayıtla gelir).
    alimSayisi: s.ownedCosmetics.length + (s.satin.islenen ?? []).length,
  };
}

/**
 * Store'a abone olup sesi çalar. Dönüş: aboneliği bitiren fonksiyon.
 *
 * `motor` dışarıdan verilebilir (test/dev). Verilmezse tarayıcı arka ucuyla kurulur.
 * İlk kesit KIYAS NOKTASI olarak alınır ve HİÇBİR ses çalmaz — yoksa yükleme anında oyuncunun
 * bütün geçmişi bir anda çalardı (`sesOlaylari`in `onceki === null` kuralı).
 */
export function sesiBagla(motor?: SesMotoru, muzik?: MuzikMotoru): () => void {
  const ayar = useGame.getState().settings;
  const m = motor ?? sesMotoruKur(webSesArkaUcu(), ayar.sound, ayar.soundVolume);
  // MÜZİK ayrı motor: olaylardan doğmuyor, sürekli çalıyor, kendi ayarı ve kendi tavanı var
  // (`music.ts` başlığı). İkisi yalnız TARAYICI KİLİDİNİ paylaşıyor.
  const mz = muzik ?? muzikMotoruKur(
    webMuzikArkaUcu(sesBaglami), SALON_MUZIGI, ayar.music, ayar.musicVolume);
  let onceki: SesKesit | null = null;

  // Mobil tarayıcı kullanıcı dokunmadan ses çalmaz; ilk dokunuş/tuş kilidi açar.
  const ac = () => { m.kilidiAc(); mz.kilidiAc(); };
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', ac, { passive: true });
    window.addEventListener('keydown', ac, { passive: true });
  }

  const cikar = useGame.subscribe((s: Durum) => {
    // Ayar KAYITTAN geliyor ve panelden değişebiliyor — her karede motora yansıtılır.
    // (Bu satır olmadan ayar kayıtta durur ama hiçbir şeye bağlı olmazdı; E3a'dan önceki hâli.)
    m.ayarla(s.settings.sound, s.settings.soundVolume);
    // "Müzik" anahtarı S10'dan beri kayıtta duruyor ve hiçbir şeye bağlı DEĞİLDİ — bağlandığı
    // satır bu (D-122). Seviye de aynı yerden geliyor; motor değişmediyse hiçbir şey yapmıyor.
    mz.ayarla(s.settings.music, s.settings.musicVolume);
    const simdi = kesitAl(s);
    for (const id of sesOlaylari(onceki, simdi)) m.cal(id);
    onceki = simdi;
  });

  return () => {
    cikar();
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', ac);
      window.removeEventListener('keydown', ac);
    }
  };
}
