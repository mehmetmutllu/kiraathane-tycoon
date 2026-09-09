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
import { webSesArkaUcu } from './audioWeb';
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
  };
}

/**
 * Store'a abone olup sesi çalar. Dönüş: aboneliği bitiren fonksiyon.
 *
 * `motor` dışarıdan verilebilir (test/dev). Verilmezse tarayıcı arka ucuyla kurulur.
 * İlk kesit KIYAS NOKTASI olarak alınır ve HİÇBİR ses çalmaz — yoksa yükleme anında oyuncunun
 * bütün geçmişi bir anda çalardı (`sesOlaylari`in `onceki === null` kuralı).
 */
export function sesiBagla(motor?: SesMotoru): () => void {
  const m = motor ?? sesMotoruKur(webSesArkaUcu(), useGame.getState().settings.sound);
  let onceki: SesKesit | null = null;

  // Mobil tarayıcı kullanıcı dokunmadan ses çalmaz; ilk dokunuş/tuş kilidi açar.
  const ac = () => m.kilidiAc();
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', ac, { passive: true });
    window.addEventListener('keydown', ac, { passive: true });
  }

  const cikar = useGame.subscribe((s: Durum) => {
    // Ayar KAYITTAN geliyor ve panelden değişebiliyor — her karede motora yansıtılır.
    // (Bu satır olmadan ayar kayıtta durur ama hiçbir şeye bağlı olmazdı; E3a'dan önceki hâli.)
    m.ayarla(s.settings.sound);
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
