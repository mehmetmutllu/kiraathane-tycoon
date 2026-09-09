/**
 * audioWeb.ts — `audio.ts`in TARAYICI arka ucu. Saf çekirdekten AYRI dosya: `audio.ts` node'da
 * (vitest) sorunsuz import edilebilsin diye burada hiç `window`/`AudioContext` yok değil —
 * VAR, ve tam bu yüzden ayrı. Çekirdek testte bu dosyaya hiç dokunmaz.
 *
 * DOSYA YOKSA TON: `.ogg`ler henüz yok (E3b'nin işi). Bu arka uç dosyayı bir kez denemeye
 * çalışır; 404 alırsa o kimliği "yok" diye işaretler ve BİR DAHA denemez — yoksa her para
 * toplamada bir başarısız ağ isteği çıkardı. Dosya sonradan eklenince tek satır kod değişmeden
 * çalmaya başlar (`Model.tsx` fallback loader deseni).
 */
import type { SesArkaUc, SesTanim } from './audio';

/** Yüklenmiş tampon önbelleği. `null` = denendi ve YOK (bir daha denenmez). */
const tamponlar = new Map<string, AudioBuffer | null>();

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

  /** Dosyayı arka planda getirip önbelleğe koyar. İlk çağrıda çalmaz — o an ton çalınır. */
  const yukle = (yol: string): void => {
    if (tamponlar.has(yol)) return;
    tamponlar.set(yol, null); // "deneniyor / yok" — ikinci bir istek çıkmasın
    const c = baglam();
    if (!c) return;
    fetch(yol)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('yok'))))
      .then((buf) => c.decodeAudioData(buf))
      .then((b) => { tamponlar.set(yol, b); })
      .catch(() => { /* dosya yok → ton kalıcı fallback */ });
  };

  return {
    simdi: () => (baglam()?.currentTime ?? performance.now() / 1000),

    kilidiAc() {
      const c = baglam();
      if (c && c.state === 'suspended') void c.resume();
    },

    dosyaCal(yol, gain) {
      const c = baglam();
      if (!c) return false;
      const buf = tamponlar.get(yol);
      if (!buf) {
        yukle(yol);
        return false; // bu sefer ton çalınacak
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      g.gain.value = gain;
      src.connect(g).connect(c.destination);
      src.start();
      return true;
    },

    tonCal(ton: SesTanim['ton']) {
      const c = baglam();
      if (!c) return;
      const t0 = c.currentTime;
      const adim = ton.sure / ton.hz.length;
      const g = c.createGain();
      // Zarf: anında açılıp yumuşak kapanır. Sert kesme "tık" sesi üretir — sentez tonun
      // ucuz durmasının en büyük sebebi budur.
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(ton.gain, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + ton.sure);
      g.connect(c.destination);
      const osc = c.createOscillator();
      osc.type = ton.dalga;
      ton.hz.forEach((hz, i) => osc.frequency.setValueAtTime(hz, t0 + i * adim));
      osc.connect(g);
      osc.start(t0);
      osc.stop(t0 + ton.sure + 0.02);
    },
  };
}
