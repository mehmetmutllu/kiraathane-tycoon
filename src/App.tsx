import { Suspense, lazy, useEffect } from 'react';
import { Scene } from './components/three/Scene';
import { HUD } from './components/ui/HUD';
import { Joystick } from './components/ui/Joystick';
import { SplashScreen } from './components/ui/SplashScreen';
import { useGame } from './game/store';

const KEY_MAP: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

// Prototip mobilya sayfası: ?proto ile oyun yerine açılır. import.meta.env.DEV üretimde false'a
// derlendiği için hem bu dal hem de dinamik import ölü kod olur — sayfa üretim paketine hiç girmez.
const IS_PROTO =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('proto');

const FurniturePrototype = import.meta.env.DEV
  ? lazy(() =>
      import('./components/three/FurniturePrototype').then((m) => ({ default: m.FurniturePrototype })),
    )
  : null;

// Geliştirici sandbox'ı (her şeyin seviyesini elle ayarla) — yalnız dev; üretimde import edilmez.
const DevSandbox = import.meta.env.DEV
  ? lazy(() => import('./components/ui/DevSandbox').then((m) => ({ default: m.DevSandbox })))
  : null;

export default function App() {
  useEffect(() => {
    if (IS_PROTO) return;
    useGame.getState().init();
    // Hile kancaları (__game/__addMoney/__setState...) yalnız geliştirmede yüklenir.
    if (import.meta.env.DEV) void import('./game/devHooks').then((m) => m.installDevHooks());

    const pressed = new Set<string>();
    const apply = () => {
      let x = 0;
      let z = 0;
      for (const code of pressed) {
        const v = KEY_MAP[code];
        if (v) {
          x += v[0];
          z += v[1];
        }
      }
      const mag = Math.hypot(x, z) || 1;
      useGame.getState().setKeyboardInput(x / mag, z / mag);
    };
    const down = (e: KeyboardEvent) => {
      if (KEY_MAP[e.code]) {
        pressed.add(e.code);
        apply();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (pressed.delete(e.code)) apply();
    };
    const blur = () => {
      pressed.clear();
      apply();
    };
    const onHide = () => useGame.getState().saveNow();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      window.removeEventListener('beforeunload', onHide);
    };
  }, []);

  if (IS_PROTO && FurniturePrototype) {
    return (
      <div className="app">
        <Suspense fallback={null}>
          <FurniturePrototype />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="app">
      <Scene />
      <HUD />
      <Joystick />
      <SplashScreen />
      {DevSandbox && (
        <Suspense fallback={null}>
          <DevSandbox />
        </Suspense>
      )}
    </div>
  );
}
