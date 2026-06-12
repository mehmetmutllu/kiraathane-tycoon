import { useRef, useState } from 'react';
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
  waiterTrayCapacityFor,
  waiterTrayNextCost,
  type CharStat,
  type WaiterKind,
} from '../../config/economy.config';
import { PALETTE } from '../../config/palette';
import { OwnerBody, CupTray } from '../three/Player';
import { CoinIcon, TrayIcon, MagnetIcon, BootIcon } from './icons';

/**
 * Karakter paneli (v20 + Y3 SEKMELER; docs/yemek-alani-garson-plan.md §3): Oyuncu | Çay Garsonu |
 * Tostçu. Oyuncu sekmesi v20 içeriği (canlı tepsi önizleme + 3 özellik). Garson sekmeleri tepsi
 * yükseltmesi satar (çay garsonları z0+z1 ORTAK eğri; tostçu kendi eğrisi) — garson tutulmadan kilitli.
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
      sway.current.rotation.y = -0.38 + Math.sin(t * 0.6) * 0.1;
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

// Garson önizlemesi (Y3): sahnedeki WaiterUnit greybox diliyle aynı — kapsül + elde tepsi,
// tepside MEVCUT kapasite kadar birim; tostçu hardal gövde + beyaz kep.
function WaiterPreviewModel({ cap, food }: { cap: number; food: boolean }) {
  const sway = useRef<Group>(null);
  const trayG = useRef<Group>(null);
  const prevCap = useRef(cap);
  const pop = useRef(0);
  if (cap > prevCap.current) pop.current = 1;
  prevCap.current = cap;
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    if (sway.current) {
      sway.current.rotation.y = -0.38 + Math.sin(t * 0.6) * 0.1;
      sway.current.position.y = Math.sin(t * 1.6) * 0.015;
    }
    if (trayG.current) {
      pop.current = Math.max(0, pop.current - dt * 2.2);
      trayG.current.scale.setScalar(1 + 0.3 * pop.current);
    }
  });
  const w = Math.max(0.3, 0.14 + cap * 0.13);
  return (
    <group ref={sway}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
        <meshStandardMaterial color={food ? PALETTE.foodApron : '#2e8b57'} />
      </mesh>
      {food && (
        <mesh castShadow position={[0, 1.24, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.14, 10]} />
          <meshStandardMaterial color={PALETTE.foodCap} />
        </mesh>
      )}
      <group ref={trayG} position={[0, 0.95, 0.4]}>
        <mesh castShadow>
          <boxGeometry args={[w, 0.04, 0.24]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
        {Array.from({ length: cap }, (_, i) => {
          const x = (i - (cap - 1) / 2) * 0.13;
          return food ? (
            <mesh key={i} castShadow position={[x, 0.06, 0]}>
              <boxGeometry args={[0.11, 0.05, 0.12]} />
              <meshStandardMaterial color={PALETTE.toast} roughness={0.7} />
            </mesh>
          ) : (
            <mesh key={i} castShadow position={[x, 0.1, 0]}>
              <cylinderGeometry args={[0.045, 0.036, 0.13, 8]} />
              <meshStandardMaterial color="#c0392b" emissive="#7a1f17" emissiveIntensity={0.25} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

const STAT_ROWS: { stat: CharStat; name: string; unit: string; icon: React.ReactNode }[] = [
  { stat: 'tray', name: 'Tepsi', unit: 'bardak', icon: <TrayIcon size={34} /> },
  { stat: 'magnet', name: 'Para Mıknatısı', unit: 'alan', icon: <MagnetIcon size={34} /> },
  { stat: 'speed', name: 'Hareket Hızı', unit: 'hız', icon: <BootIcon size={34} /> },
];

type Tab = 'player' | 'tea' | 'tost';

// Garson sekmesi içeriği: kilit (garson yok) | tepsi yükseltme satırı.
// NOT: kendi Canvas'ı YOK — panel TEK Canvas kullanır (sekme başına yeni WebGL context açmak
// tarayıcı context limitine takılıp önizlemeyi karartıyordu; Playwright canlı bulgusu 2026-06-12).
function WaiterTab({ kind, hired }: { kind: WaiterKind; hired: boolean }) {
  const wallet = useGame((s) => s.wallet);
  const waiterUpgrades = useGame((s) => s.waiterUpgrades);
  const buyWaiterTray = useGame((s) => s.buyWaiterTray);
  const cash = wallet.toNumber();
  const tier = kind === 'tea' ? waiterUpgrades.teaTray : waiterUpgrades.tostTray;
  const cap = waiterTrayCapacityFor(kind, tier);
  const cost = waiterTrayNextCost(kind, tier);
  const food = kind === 'tost';
  const unit = food ? 'tost' : 'bardak';
  if (!hired) {
    return (
      <div className="char-locked" data-testid={`waiter-locked-${kind}`}>
        {food ? 'Tost salonuna garson tutunca açılır.' : 'Garson tutunca açılır.'}
      </div>
    );
  }
  return (
    <>
      <div className="char-stat">
        <span className="char-stat-icon"><TrayIcon size={34} /></span>
        <span className="char-stat-info">
          <span className="char-stat-name">Tepsi</span>
          <span className="char-stat-val" data-testid={`waiter-val-${kind}`}>
            {cost != null ? (
              <>
                {cap} <i>→ {cap + 1}</i> {unit}
              </>
            ) : (
              <>
                {cap} {unit}
              </>
            )}
          </span>
        </span>
        {cost != null ? (
          <button
            className="char-buy"
            data-testid={`waiter-buy-${kind}`}
            disabled={cash < cost}
            onClick={() => buyWaiterTray(kind)}
          >
            <CoinIcon size={16} />
            {fmt(D(cost))}
          </button>
        ) : (
          <span className="char-max" data-testid={`waiter-buy-${kind}`}>
            MAX
          </span>
        )}
      </div>
      <div className="char-note">
        {food
          ? 'Tostçu garson tost salonunda çalışır; tepsisine aldığı tostları tek durakta bırakır.'
          : 'Çay garsonlarının (tüm çay salonları) ortak tepsisi. Hız yükseltmesi salondaki noktadan.'}
      </div>
    </>
  );
}

export function CharacterPanel({ onClose }: { onClose: () => void }) {
  const wallet = useGame((s) => s.wallet);
  const charUpgrades = useGame((s) => s.charUpgrades);
  const waiterUpgrades = useGame((s) => s.waiterUpgrades);
  const buyCharUpgrade = useGame((s) => s.buyCharUpgrade);
  const padsDone = useGame((s) => s.padsDone);
  const [tab, setTab] = useState<Tab>('player');
  const cash = wallet.toNumber();
  const cap = trayCapacityFor(charUpgrades.tray);
  const lvl = charLevel(charUpgrades);
  const teaHired = padsDone.includes('waiter') || padsDone.includes('z2waiter');
  const tostHired = padsDone.includes('z3waiter');
  const showCanvas = tab === 'player' || (tab === 'tea' ? teaHired : tostHired);

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
          <span className="modal-title">
            {tab === 'player' ? 'Çaycı' : tab === 'tea' ? 'Çay Garsonu' : 'Tostçu Garson'}
          </span>
        </div>

        {/* Y3 sekmeleri: Oyuncu | Çay Garsonu | Tostçu */}
        <div className="char-tabs" role="tablist">
          <button
            className={`char-tab${tab === 'player' ? ' active' : ''}`}
            data-testid="char-tab-player"
            onClick={() => setTab('player')}
          >
            Oyuncu
          </button>
          <button
            className={`char-tab${tab === 'tea' ? ' active' : ''}`}
            data-testid="char-tab-tea"
            onClick={() => setTab('tea')}
          >
            Çay Garsonu
          </button>
          <button
            className={`char-tab${tab === 'tost' ? ' active' : ''}`}
            data-testid="char-tab-tost"
            onClick={() => setTab('tost')}
          >
            Tostçu
          </button>
        </div>

        {/* TEK Canvas (3/4 yukarı-çapraz açı): sekme MODELİ değiştirir, context'i değil —
            sekme başına yeni WebGL context tarayıcı limitine takılıp boş kalıyordu (2026-06-12). */}
        <div className="char-canvas" style={showCanvas ? undefined : { display: 'none' }}>
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0.75, 1.45, 2.05], fov: 36 }}
            onCreated={({ camera }) => camera.lookAt(0, 0.78, 0.1)}
          >
            <ambientLight intensity={0.85} />
            <directionalLight position={[2, 4, 3]} intensity={1.2} />
            {tab === 'player' && <PreviewModel cap={cap} />}
            {tab === 'tea' && teaHired && (
              <WaiterPreviewModel cap={waiterTrayCapacityFor('tea', waiterUpgrades.teaTray)} food={false} />
            )}
            {tab === 'tost' && tostHired && (
              <WaiterPreviewModel cap={waiterTrayCapacityFor('tost', waiterUpgrades.tostTray)} food />
            )}
          </Canvas>
        </div>

        {tab === 'player' && (
          <>
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
          </>
        )}

        {tab === 'tea' && <WaiterTab kind="tea" hired={teaHired} />}
        {tab === 'tost' && <WaiterTab kind="tost" hired={tostHired} />}

        <button className="modal-btn" data-testid="char-ok" onClick={onClose}>
          Tamam
        </button>
      </div>
    </div>
  );
}
