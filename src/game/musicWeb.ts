/**
 * musicWeb.ts — `music.ts`in TARAYICI arka ucu. Motorun İLK DÖNGÜ kaynağı (S9 · D-122).
 *
 * `audioWeb.ts`ten neden ayrı: o dosya tek atış çalıyor — tamponu ver, `start()`, unut. Döngünün
 * bambaşka bir ömrü var: bir kez yüklenir, sürekli döner, seviyesi çalarken değişir ve
 * durdurulduğunda kaynağı bırakılmalı. İkisini tek dosyaya koymak `calTampon`ı iki farklı
 * yaşam döngüsüne hizmet ettirmek olurdu.
 *
 * DOSYA YOKSA SESSİZLİK, HATA DEĞİL: `Model.tsx` fallback deseninin ses karşılığı — dosya 404
 * verirse yol "yok" diye işaretlenir ve bir daha denenmez; oyun tam oynanır, yalnız müziksiz.
 * Sentezden farkı şu: bir olay sesinin YEDEĞİ var (sentez), müziğin yok — ve olmaması doğru,
 * çünkü sentezlenmiş bir arka plan parçası ayrı bir karardır (O1 reddedildi).
 *
 * BAĞLAM PAYLAŞILIYOR: `audioWeb.ts` kendi `AudioContext`ini kuruyor; burada ikinci bir bağlam
 * açmak mobilde gerçek bir maliyet (her bağlam kendi donanım akışını tutar). Bağlam bu yüzden
 * dışarıdan veriliyor.
 */
import type { MuzikArkaUc } from './music';

export function webMuzikArkaUcu(baglamAl: () => AudioContext | null): MuzikArkaUc {
  let kaynak: AudioBufferSourceNode | null = null;
  let kazancDugumu: GainNode | null = null;
  let tampon: AudioBuffer | null = null;
  let yukleniyor = false;
  let yok = false;
  /** İstenen kazanç — dosya inerken seviye değişirse başlarken bu değer kullanılır. */
  let istenen = 0;
  let calmakIsteniyor = false;

  const kur = (c: AudioContext): void => {
    if (!tampon || kaynak) return;
    const src = c.createBufferSource();
    src.buffer = tampon;
    src.loop = true;
    const g = c.createGain();
    g.gain.value = istenen;
    src.connect(g);
    g.connect(c.destination);
    src.start();
    kaynak = src;
    kazancDugumu = g;
  };

  const yukle = (yol: string, c: AudioContext): void => {
    if (yukleniyor || yok) return;
    yukleniyor = true;
    fetch(yol)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('yok'))))
      .then((buf) => c.decodeAudioData(buf))
      .then((b) => {
        tampon = b;
        yukleniyor = false;
        // Dosya inerken oyuncu müziği kapatmış olabilir — inen tamponu zorla çalma.
        if (calmakIsteniyor) kur(c);
      })
      .catch(() => { yok = true; yukleniyor = false; });
  };

  return {
    get caliyor() { return calmakIsteniyor; },

    basla(yol, kazanc) {
      calmakIsteniyor = true;
      istenen = kazanc;
      const c = baglamAl();
      if (!c) return;
      if (!tampon) { yukle(yol, c); return; }
      kur(c);
    },

    dur() {
      calmakIsteniyor = false;
      if (kaynak) {
        try { kaynak.stop(); } catch { /* zaten durmuş */ }
        kaynak.disconnect();
        kaynak = null;
      }
      if (kazancDugumu) { kazancDugumu.disconnect(); kazancDugumu = null; }
    },

    kazanc(v) {
      istenen = v;
      // Rampa bilerek: seviyeyi anında yazmak slider sürüklenirken tık sesi üretir.
      if (kazancDugumu) {
        const c = baglamAl();
        if (c) kazancDugumu.gain.setTargetAtTime(v, c.currentTime, 0.05);
        else kazancDugumu.gain.value = v;
      }
    },
  };
}
