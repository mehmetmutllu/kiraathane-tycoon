import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { OYUN_ADI } from '../../game/kafeAdi';

// Açılış yükleme ekranı (talimat #2/#3): asset (KayKit gltf + atlas) yüklenene kadar sahneyi örter →
// greybox→model "pop"u ve ilk-kare FPS sıçraması GÖRÜNMEZ. drei useProgress GLTFLoader ilerlemesini izler.
// Gating fresh (yükleme olur) ve cache (hiç yükleme görünmez) durumlarını ayrı ele alır + sert üst sınır.
const MIN_MS = 700; // markalı ekran en az bu kadar görünür (anlık flash olmasın)
const MAX_MS = 6000; // güvenlik: asset takılsa bile oyun açılır
const YOKLAMA_MS = 100; // ilerleme bu aralıkla OKUNUR (abone olunmaz — gerekçe aşağıda)

/**
 * İLERLEME ABONE OLUNARAK DEĞİL YOKLANARAK OKUNUR — ve bu bir stil tercihi değil, bir HATA kapatması.
 *
 * `useProgress()` bileşeni drei'nin yükleme store'una ABONE eder: `LoadingManager` her `itemEnd`
 * olayında store'u günceller, yani her dosya için bir React render'ı doğar. Soğuk açılışta bu
 * olaylar ağ süresine yayıldığı için zararsız; dosyalar tarayıcı önbelleğinde SICAKken hepsi
 * AYNI KAREDE biter ve React iç içe güncelleme sınırını aşıp patlar:
 *   "Maximum update depth exceeded"  (yığın: DefaultLoadingManager.onProgress → forceStoreRerender)
 * Üç açılışın ikisinde ölçüldü — ilk (soğuk) açılış temiz, sonrakiler patlıyor. Kusurun sinsiliği
 * bu: geliştirme sırasında ilk açılış temiz görünüyor.
 *
 * İkinci bir çarpan daha vardı: tamamlanmayı denetleyen `useEffect`in bağımlılığı `progress`ti,
 * yani her ilerleme olayı `setInterval`i de söküp yeniden kuruyordu.
 *
 * Çözüm store'u OKUMAK ama ona abone OLMAMAK: `useProgress.getState()` aynı veriyi render'sız
 * verir. Ekran zaten 100 ms'lik bir yoklamayla güncelleniyordu; çubuk için bundan ince bir
 * çözünürlük gerekmiyor. Böylece render sayısı dosya sayısından BAĞIMSIZ hale geliyor.
 *
 * (S16 aynı hatayı `Customers.tsx`te yol dizisini memoize ederek kapatmıştı; o gerçek bir
 * kusurdu ama tek kaynak değilmiş — abonelik yolu açık kaldığı sürece her yeni yükleyici
 * çağrısı aynı patlamayı geri getirebiliyordu. Bu düzeltme kaynağı değil YOLU kapatıyor.)
 */
export function SplashScreen() {
  // Açılış anı ilk effect'te damgalanır (render'da `performance.now()` saf değil — react-hooks/purity).
  const mount = useRef(0);
  const sawLoading = useRef(false);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (mount.current === 0) mount.current = performance.now();
    const check = () => {
      const { active, progress } = useProgress.getState();
      if (active) sawLoading.current = true;
      // Yüzde yalnız GÖRÜNÜR biçimde değiştiyse yazılır: aynı değeri yazmak boş render olurdu.
      const yeni = Math.min(100, Math.round(progress));
      setPct((eski) => (eski === yeni ? eski : yeni));
      const elapsed = performance.now() - mount.current;
      // Tamamlanma koşulu: yükleme görüldüyse !active && %100; görülmediyse (cache) MIN_MS sonra.
      const loadedDone = sawLoading.current ? !active && progress >= 100 : true;
      if (elapsed >= MIN_MS && loadedDone) setDone(true);
    };
    check();
    const id = setInterval(check, YOKLAMA_MS);
    const max = setTimeout(() => setDone(true), MAX_MS);
    return () => {
      clearInterval(id);
      clearTimeout(max);
    };
  }, [done]);

  // fade-out bitince DOM'dan kalk.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 480);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;
  return (
    <div className={`splash${done ? ' splash--out' : ''}`} aria-hidden={done}>
      <div className="splash__glow" />
      <div className="splash__title">{OYUN_ADI}</div>
      <div className="splash__bar">
        <div className="splash__fill" style={{ width: `${done ? 100 : pct}%` }} />
      </div>
      <div className="splash__hint">Semaver ısınıyor…</div>
    </div>
  );
}
