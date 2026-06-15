import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';

// Açılış yükleme ekranı (talimat #2/#3): asset (KayKit gltf + atlas) yüklenene kadar sahneyi örter →
// greybox→model "pop"u ve ilk-kare FPS sıçraması GÖRÜNMEZ. drei useProgress GLTFLoader ilerlemesini izler.
// Gating fresh (yükleme olur) ve cache (hiç yükleme görünmez) durumlarını ayrı ele alır + sert üst sınır.
const MIN_MS = 700; // markalı ekran en az bu kadar görünür (anlık flash olmasın)
const MAX_MS = 6000; // güvenlik: asset takılsa bile oyun açılır

export function SplashScreen() {
  const { active, progress } = useProgress();
  const mount = useRef(performance.now());
  const sawLoading = useRef(false);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (active) sawLoading.current = true;
  }, [active]);

  // Tamamlanma koşulu: yükleme görüldüyse !active && %100; görülmediyse (cache) MIN_MS sonra.
  useEffect(() => {
    if (done) return;
    const check = () => {
      const elapsed = performance.now() - mount.current;
      const loadedDone = sawLoading.current ? !active && progress >= 100 : true;
      if (elapsed >= MIN_MS && loadedDone) setDone(true);
    };
    check();
    const id = setInterval(check, 100);
    const max = setTimeout(() => setDone(true), MAX_MS);
    return () => {
      clearInterval(id);
      clearTimeout(max);
    };
  }, [active, progress, done]);

  // fade-out bitince DOM'dan kalk.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 480);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;
  const pct = Math.min(100, Math.round(progress));
  return (
    <div className={`splash${done ? ' splash--out' : ''}`} aria-hidden={done}>
      <div className="splash__glow" />
      <div className="splash__title">Köşe Kıraathanesi</div>
      <div className="splash__bar">
        <div className="splash__fill" style={{ width: `${done ? 100 : pct}%` }} />
      </div>
      <div className="splash__hint">Semaver ısınıyor…</div>
    </div>
  );
}
