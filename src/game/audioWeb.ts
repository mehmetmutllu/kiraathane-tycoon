/**
 * audioWeb.ts — `audio.ts`in TARAYICI arka ucu. Saf çekirdekten AYRI dosya, çünkü burada
 * `window`/`AudioContext` VAR; çekirdek testte bu dosyaya hiç dokunmaz.
 *
 * E4'TE NE DEĞİŞTİ: bu dosya artık SES ÜRETMİYOR, yalnız ÇALIYOR.
 * E3'te sentez burada, WebAudio düğüm zinciriyle kuruluydu (osilatör + kazanç rampaları). Sonuç:
 * ölçüm aracı o zinciri taklit etmek zorunda kaldı ve "ölçülen ses" ile "duyulan ses" iki ayrı
 * kod oldu; aralarındaki sapmayı hiçbir şey tutmuyordu. Artık örnekler `audioSynth.ts`te (saf,
 * deterministik) üretiliyor, burada yalnızca bir `AudioBuffer`a kopyalanıp çalınıyor. Ölçüm aracı
 * da aynı fonksiyonu çağırıyor — ölçülen şey birebir duyulan şey.
 *
 * DOSYA OPSİYONELDİR (E4 · D-013'ün sesteki karşılığı): sentez NİHAİ sestir. Bir `.ogg`
 * bırakılırsa üstüne yazar. Arka uç dosyayı bir kez denemeye çalışır; 404 alırsa o yolu "yok"
 * diye işaretler ve BİR DAHA denemez — yoksa her para toplamada başarısız bir ağ isteği çıkardı.
 */
import type { SesArkaUc, SesId } from './audio';
import { ORNEKLEME, seslendir, type Katman } from './audioSynth';

/** Yüklenmiş dosya tamponları. `null` = denendi ve YOK (bir daha denenmez). */
const dosyaTamponlari = new Map<string, AudioBuffer | null>();
/** Sentezlenmiş tamponlar — ses başına BİR KEZ üretilir, sonra hep aynısı çalınır. */
const sentezTamponlari = new Map<SesId, AudioBuffer>();

export function webSesArkaUcu(): SesArkaUc {
  let ctx: AudioContext | null = null;

  const baglam = (): AudioContext | null => {
    if (ctx) return ctx;
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  };

  /** Tamponu çal. Kazanç katmanlarda zaten var, burada 1'de bırakılır. */
  const calTampon = (c: AudioContext, tampon: AudioBuffer): void => {
    const src = c.createBufferSource();
    src.buffer = tampon;
    src.connect(c.destination);
    src.start();
  };

  /** Dosyayı arka planda getirip önbelleğe koyar. İlk çağrıda çalmaz — o an sentez çalar. */
  const yukle = (yol: string): void => {
    if (dosyaTamponlari.has(yol)) return;
    dosyaTamponlari.set(yol, null); // "deneniyor / yok" — ikinci bir istek çıkmasın
    const c = baglam();
    if (!c) return;
    fetch(yol)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('yok'))))
      .then((buf) => c.decodeAudioData(buf))
      .then((b) => { dosyaTamponlari.set(yol, b); })
      .catch(() => { /* dosya yok → sentez kalıcı olarak çalar (nihai ses zaten o) */ });
  };

  return {
    simdi: () => (baglam()?.currentTime ?? performance.now() / 1000),

    kilidiAc() {
      const c = baglam();
      if (c && c.state === 'suspended') void c.resume();
    },

    dosyaCal(yol) {
      const c = baglam();
      if (!c) return false;
      const buf = dosyaTamponlari.get(yol);
      if (!buf) {
        yukle(yol);
        return false; // bu sefer sentez çalacak
      }
      calTampon(c, buf);
      return true;
    },

    sentezCal(id: SesId, katmanlar: readonly Katman[]) {
      const c = baglam();
      if (!c) return;
      let tampon = sentezTamponlari.get(id);
      if (!tampon) {
        const ornekler = seslendir(katmanlar);
        // Bağlamın örnekleme hızı cihazdan cihaza değişir (44100/48000). Tampon KENDİ hızıyla
        // yaratılır; WebAudio çalarken yeniden örnekler. Sesin perdesi böylece cihaza göre
        // kaymaz — sabit hız yazılsaydı 48 kHz'lik bir cihazda her ses tizleşirdi.
        tampon = c.createBuffer(1, ornekler.length, ORNEKLEME);
        tampon.getChannelData(0).set(ornekler);
        sentezTamponlari.set(id, tampon);
      }
      calTampon(c, tampon);
    },
  };
}
