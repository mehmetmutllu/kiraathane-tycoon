import { useRef, useState } from 'react';
import { useGame } from '../../game/store';

const RADIUS = 55;

// Sol-alt dokunmatik joystick (mobil). Masaüstünde fareyle de çalışır; klavye paraleldir.
export function Joystick() {
  const setJoystick = useGame((s) => s.setJoystickInput);
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef(false);

  const update = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    // ekran yukarı (dy<0) = ileri (z<0)
    setJoystick(+(dx / RADIUS).toFixed(3), +(dy / RADIUS).toFixed(3));
  };

  const end = () => {
    active.current = false;
    setKnob({ x: 0, y: 0 });
    setJoystick(0, 0);
  };

  return (
    <div
      ref={baseRef}
      className="joystick"
      data-testid="joystick"
      onPointerDown={(e) => {
        active.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
