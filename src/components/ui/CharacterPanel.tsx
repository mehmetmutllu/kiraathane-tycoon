import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { fmt, D } from '../../game/decimal';
import {
  charLevel,
  charValue,
  charNextCost,
  charMaxTier,
  trayCapacityFor,
  type CharStat,
} from '../../config/economy.config';
import { OwnerBody, CupTray } from '../three/Player';
import { CoinIcon, TrayIcon, MagnetIcon, BootIcon } from './icons';

/**
 * Karakter paneli (v20; docs/character-upgrades-design.md §4): karakter ORTADA hafif yukarı-çapraz
 * (3/4) açıdan mini Canvas'ta; elindeki tepside MEVCUT kapasite kadar çay CANLI önizleme (yükseltince
 * +1 bardak scale-pop ile belirir, tepsi tabanı büyür). Altta 3 özellik kartı (tepsi/mıknatıs/hız).
 */

// Yavaş idle salınımı + tepsi pop'u (satın alma anında kapasite artar → tepsi 1.3'ten 1'e söner).
function PreviewModel({ cap }: { cap: number }) {
  const sway = useRef<Group>(null);
  const trayG = useRef<Group>(null);
  const prevCap = useRef(cap);
  const pop = useRef(0);
  if (cap > prevCap.current) pop.current = 1;
  prevCap.current = cap;
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    if (sway.current) {
      sway.current.rotation.y = -0.55 + Math.sin(t * 0.6) * 0.1;
      sway.current.position.y = Math.sin(t * 1.6) * 0.015;
    }
    if (trayG.current) {
      pop.current = Math.max(0, pop.current - dt * 2.2);
      trayG.current.scale.setScalar(1 + 0.3 * pop.current);
    }
  });
  return (
    <group ref={sway}>
      <OwnerBody />
      <group ref={trayG}>
        <CupTray tea={cap} dirty={0} cap={cap} />
      </group>
    </group>
  );
}

const STAT_ROWS: { stat: CharStat; name: string; unit: string; icon: React.ReactNode }[] = [
  { stat: 'tray', name: 'Tepsi', unit: 'bardak', icon: <TrayIcon size={34} /> },
  { stat: 'magnet', name: 'Para Mıknatısı', unit: 'alan', icon: <MagnetIcon size={34} /> },
  { stat: 'speed', name: 'Hareket Hızı', unit: 'hız', icon: <BootIcon size={34} /> },
];

export function CharacterPanel({ onClose }: { onClose: () => void }) {
  const wallet = useGame((s) => s.wallet);
  const charUpgrades = useGame((s) => s.charUpgrades);
  const buyCharUpgrade = useGame((s) => s.buyCharUpgrade);
  const cash = wallet.toNumber();
  const cap = trayCapacityFor(charUpgrades.tray);
  const lvl = charLevel(charUpgrades);

  return (
    <div className="modal-backdrop" data-testid="char-panel" onClick={onClose}>
      <div className="modal-card char-card" onClick={(e) => e.stopPropagation()}>
        <div className="char-head">
          <span className="char-lvl" data-testid="char-level" title="Karakter seviyesi">
            <svg width="30" height="30" viewBox="0 0 48 48" aria-hidden>
              <circle cx="24" cy="24" r="22" fill="#ffd54f" stroke="#fff" strokeWidth="3" />
              <TrayIcon />
            </svg>
            <i>{lvl}</i>
          </span>
          <span className="modal-title">Çaycı</span>
        </div>

        {/* 3/4 yukarı-çapraz açı + canlı tepsi önizleme */}
        <div className="char-canvas">
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0.9, 1.4, 1.6], fov: 38 }}
            onCreated={({ camera }) => camera.lookAt(0, 0.85, 0)}
          >
            <ambientLight intensity={0.85} />
            <directionalLight position={[2, 4, 3]} intensity={1.2} />
            <PreviewModel cap={cap} />
          </Canvas>
        </div>

        {STAT_ROWS.map(({ stat, name, unit, icon }) => {
          const tier = charUpgrades[stat];
          const max = charMaxTier(stat);
          const cost = charNextCost(stat, tier);
          const cur = charValue(stat, tier);
          const next = tier < max ? charValue(stat, tier + 1) : null;
          const afford = cost != null && cash >= cost;
          return (
            <div className="char-stat" key={stat}>
              <span className="char-stat-icon">{icon}</span>
              <span className="char-stat-info">
                <span className="char-stat-name">{name}</span>
                <span className="char-stat-val" data-testid={`char-val-${stat}`}>
                  {next != null ? (
                    <>
                      {cur} <i>→ {next}</i> {unit}
                    </>
                  ) : (
                    <>
                      {cur} {unit}
                    </>
                  )}
                </span>
              </span>
              {cost != null ? (
                <button
                  className="char-buy"
                  data-testid={`char-buy-${stat}`}
                  disabled={!afford}
                  onClick={() => buyCharUpgrade(stat)}
                >
                  <CoinIcon size={16} />
                  {fmt(D(cost))}
                </button>
              ) : (
                <span className="char-max" data-testid={`char-buy-${stat}`}>
                  MAX
                </span>
              )}
            </div>
          );
        })}

        <button className="modal-btn" data-testid="char-ok" onClick={onClose}>
          Tamam
        </button>
      </div>
    </div>
  );
}
