import { useRef, useState } from 'react';
import { useGame } from '../../game/store';

const RADIUS = 55;

// Drag-anywhere dokunmatik kontrol (mobil standardı): ekranın HERHANGİ bir yerine parmak basıp sürükleyince
// hareket eder; joystick parmağın bastığı yerde BELİRİR (sabit köşe joystick yok). Masaüstünde fareyle de çalışır;
// klavye paraleldir. Tüm ekranı kaplayan görünmez katman pointer alır; HUD chip'leri pointer-events:none olduğundan
// engellenmez.
export function Joystick() {
  const setJoystick = useGame((s) => s.setJoystickInput);
  const [stick, setStick] = useState<{ ox: number; oy: number; kx: number; ky: number } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const move = (clientX: number, clientY: number) => {
    const o = origin.current;
    if (!o) return;
    let dx = clientX - o.x;
    let dy = clientY - o.y;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setStick({ ox: o.x, oy: o.y, kx: dx, ky: dy });
    // ekran yukarı (dy<0) = ileri (z<0)
    setJoystick(+(dx / RADIUS).toFixed(3), +(dy / RADIUS).toFixed(3));
  };

  const end = () => {
    origin.current = null;
    setStick(null);
    setJoystick(0, 0);
  };

  return (
    <div
      className="touch-layer"
      data-testid="joystick"
      onPointerDown={(e) => {
        origin.current = { x: e.clientX, y: e.clientY };
        setStick({ ox: e.clientX, oy: e.clientY, kx: 0, ky: 0 });
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* bazı tarayıcılarda sentetik/edge pointer'da atabilir — yakalama olmadan da çalışır */
        }
      }}
      onPointerMove={(e) => {
        if (origin.current) move(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {stick && (
        <div className="joystick" style={{ left: stick.ox, top: stick.oy }}>
          <div className="joystick-knob" style={{ transform: `translate(${stick.kx}px, ${stick.ky}px)` }} />
        </div>
      )}
    </div>
  );
}
