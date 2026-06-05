import { useEffect } from 'react';
import { Scene } from './components/three/Scene';
import { HUD } from './components/ui/HUD';
import { Joystick } from './components/ui/Joystick';
import { useGame } from './game/store';
import { installDevHooks } from './game/devHooks';

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

export default function App() {
  useEffect(() => {
    useGame.getState().init();
    installDevHooks();

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

  return (
    <div className="app">
      <Scene />
      <HUD />
      <Joystick />
    </div>
  );
}
