import { useRef, useState } from 'react';
import { useGame } from '../../game/store';

const RADIUS = 55;

// Drag-anywhere dokunmatik kontrol (mobil standardı): ekranın HERHANGİ bir yerine parmak basıp sürükleyince
// hareket eder; joystick parmağın bastığı yerde BELİRİR (sabit köşe joystick yok). Masaüstünde fareyle de çalışır;
// klavye paraleldir. Tüm ekranı kaplayan görünmez katman pointer alır; HUD chip'leri pointer-events:none olduğundan
// engellenmez.
//
// Perf #8 (Sprint A): React yalnız joystick BELİRİRKEN ve KAYBOLURKEN render eder. Sürükleme sırasında topuz
// doğrudan DOM'a yazılır (`ref.style.transform`) ve store'a giden giriş aynı değerdeyse yazılmaz — eskiden her
// `pointermove` (120 Hz ekranda saniyede 120) bir React render'ı + bir store yazımıydı. Tarayıcı stil yazımlarını
// boyamaya kadar biriktirdiği için topuz eskisiyle aynı karede yerini alır.
export function Joystick() {
  const setJoystick = useGame((s) => s.setJoystickInput);
  const [stick, setStick] = useState<{ ox: number; oy: number } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const knob = useRef<HTMLDivElement>(null);
  const son = useRef<[number, number]>([0, 0]);

  const giris = (x: number, y: number) => {
    if (son.current[0] === x && son.current[1] === y) return;
    son.current = [x, y];
    setJoystick(x, y);
  };

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
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    // ekran yukarı (dy<0) = ileri (z<0)
    giris(+(dx / RADIUS).toFixed(3), +(dy / RADIUS).toFixed(3));
  };

  const end = () => {
    origin.current = null;
    setStick(null);
    son.current = [0, 0];
    setJoystick(0, 0);
  };

  return (
    <div
      className="touch-layer"
      data-testid="joystick"
      onPointerDown={(e) => {
        origin.current = { x: e.clientX, y: e.clientY };
        setStick({ ox: e.clientX, oy: e.clientY });
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
          <div ref={knob} className="joystick-knob" style={{ transform: 'translate(0px, 0px)' }} />
        </div>
      )}
    </div>
  );
}
