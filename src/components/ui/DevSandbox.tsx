/**
 * GELİŞTİRİCİ SANDBOX — yalnız `npm run dev`'de görünür (App.tsx `import.meta.env.DEV` ile
 * lazy import eder; üretim paketine hiç girmez). Kullanıcı isteği 2026-09-06:
 * "sınırsız para vs verirsen güzel olur her seviyeyi göreyim veya her şeyin seviyesini
 * ayarlamam için ayar koy".
 *
 * Kural: BU DOSYA OYUN MANTIĞI DEĞİŞTİRMEZ. Yalnız store'a doğrudan yazar (`useGame.setState`),
 * yani oyunun kendi türetme zinciri (D-015: her şey `padsDone`'dan türer) aynen çalışır —
 * pad'i işaretlersin, masa/garson/salon bir sonraki tick'te kendiliğinden belirir.
 *
 * Bilinçli olarak oyunun görsel diliyle AYNI DEĞİL (koyu, teknik, kompakt): arayüz tasarımını
 * değerlendirirken alet takımı oyunun kendisiyle karışmasın.
 */
import { useEffect } from 'react';
import { useGame } from '../../game/store';
import { useSandbox } from '../../game/devSandbox';
import { D } from '../../game/decimal';
import {
  economyConfig as C,
  MAX_ZONES,
  TABLES_PER_ZONE,
  waiterTrayMaxTier,
  waiterSpeedMaxTier,
  dishCarryMaxTier,
  dishSpeedMaxTier,
} from '../../config/economy.config';
import './devSandbox.css';

// Dahili seviyeler 0-tabanlı, ekranda +1 gösterilir. Tavan = masterLevel-1 (o da 'Usta').
const STATION_MAX = C.teaStation.upgrade.masterLevel - 1; // 0..6 → L1..L7 (L7 = Usta)
const TABLE_MAX = C.tables.upgrade.masterLevel - 1; // 0..4 → L1..L5 (L5 = Usta)
const CHAR_MAX = {
  tray: C.character.tray.values.length - 1,
  magnet: C.character.magnet.values.length - 1,
  speed: C.character.speed.values.length - 1,
} as const;

const BIG_MONEY = 1e12;

/** Küçük −/sayı/+ üçlüsü. */
function Stepper({
  label,
  value,
  max,
  min = 0,
  suffix,
  asLevel,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  min?: number;
  suffix?: string;
  /** Seviye alanı: dahili 0-tabanlı değer ekranda L1'den başlar (oyunun gösterdiği gibi). */
  asLevel?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="dsb-step">
      <span className="dsb-step-label">{label}</span>
      <button disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <b>
        {asLevel ? `L${value + 1}` : value}
        {suffix}
      </b>
      <button disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
      <span className="dsb-step-max">/{asLevel ? `L${max + 1}` : max}</span>
    </div>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="dsb-row">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

export function DevSandbox() {
  const open = useSandbox((s) => s.open);
  const timeScale = useSandbox((s) => s.timeScale);
  const infiniteMoney = useSandbox((s) => s.infiniteMoney);
  const hideHud = useSandbox((s) => s.hideHud);
  const setSb = useSandbox((s) => s.set);

  const wallet = useGame((s) => s.wallet);
  const diamonds = useGame((s) => s.diamonds);
  const padsDone = useGame((s) => s.padsDone);
  const stationLevels = useGame((s) => s.stationLevels);
  const tableLevels = useGame((s) => s.tableLevels);
  const charUpgrades = useGame((s) => s.charUpgrades);
  const waiterUpgrades = useGame((s) => s.waiterUpgrades);
  const questIndex = useGame((s) => s.questIndex);
  const zonesOpen = useGame((s) => s.zonesOpen);
  const tables = useGame((s) => s.tables);
  const ownedCosmetics = useGame((s) => s.ownedCosmetics);
  const floorThemeByZone = useGame((s) => s.floorThemeByZone);
  const wallThemeByZone = useGame((s) => s.wallThemeByZone);
  const tableTheme = useGame((s) => s.tableTheme);

  // Sınırsız para: saniyede bir cüzdanı tepeye çeker (yükseltme fiyatı ne olursa olsun yeter).
  useEffect(() => {
    if (!infiniteMoney) return;
    const top = () => {
      const s = useGame.getState();
      if (s.wallet.lt(BIG_MONEY / 2)) useGame.setState({ wallet: D(BIG_MONEY) });
      if (s.diamonds.lt(5000)) useGame.setState({ diamonds: D(9999) });
    };
    top();
    const id = window.setInterval(top, 1000);
    return () => window.clearInterval(id);
  }, [infiniteMoney]);

  // Oyun HUD'ını gizle (temiz sahne görüntüsü) — body sınıfıyla, HUD'a dokunmadan.
  useEffect(() => {
    document.body.classList.toggle('dsb-hide-hud', hideHud);
    return () => document.body.classList.remove('dsb-hide-hud');
  }, [hideHud]);

  // ` (backtick) paneli açar/kapatır.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Backquote') {
        e.preventDefault();
        useSandbox.getState().set({ open: !useSandbox.getState().open });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setPads = (ids: string[]) => useGame.setState({ padsDone: ids, padFills: {} });

  const togglePad = (id: string) => {
    const has = padsDone.includes(id);
    setPads(has ? padsDone.filter((p) => p !== id) : [...padsDone, id]);
  };

  /** Bir pad'i ve önkoşul zincirini birlikte aç (tek tıkla o noktaya kadar ilerle). */
  const openUpTo = (id: string) => {
    const idx = C.pads.findIndex((p) => p.id === id);
    if (idx < 0) return;
    setPads(C.pads.slice(0, idx + 1).map((p) => p.id));
  };

  const setStation = (z: number, lvl: number) => {
    const arr = useGame.getState().stationLevels.slice();
    arr[z] = lvl;
    useGame.setState({ stationLevels: arr });
  };

  const setTable = (i: number, lvl: number) => {
    const arr = useGame.getState().tableLevels.slice();
    arr[i] = lvl;
    useGame.setState({ tableLevels: arr });
  };

  const setAllTables = (lvl: number) =>
    useGame.setState({ tableLevels: useGame.getState().tableLevels.map(() => lvl) });

  const money = (n: number) => useGame.setState({ wallet: useGame.getState().wallet.add(n) });
  const gems = (n: number) => useGame.setState({ diamonds: useGame.getState().diamonds.add(n) });

  const advance = (sec: number) => window.__advanceTime?.(sec);

  const unlockAllCosmetics = () => {
    const ids: string[] = [];
    for (let z = 0; z < MAX_ZONES; z++) {
      for (const t of C.cosmetics.floorThemes) ids.push(`floor:${t.id}:z${z}`);
      for (const t of C.cosmetics.wallThemes) ids.push(`wall:${t.id}:z${z}`);
    }
    for (const t of C.cosmetics.tableThemes) ids.push(`table:${t.id}:z0`);
    useGame.setState({ ownedCosmetics: Array.from(new Set([...ownedCosmetics, ...ids])) });
  };

  const applyFloor = (z: number, id: string) => {
    const arr = useGame.getState().floorThemeByZone.slice();
    arr[z] = id;
    useGame.setState({ floorThemeByZone: arr });
  };
  const applyWall = (z: number, id: string) => {
    const arr = useGame.getState().wallThemeByZone.slice();
    arr[z] = id;
    useGame.setState({ wallThemeByZone: arr });
  };

  if (!open) {
    return (
      <button className="dsb-fab" onClick={() => setSb({ open: true })} title="Geliştirici paneli (`)">
        DEV
      </button>
    );
  }

  const padsByZone = [0, 1, 2].map((z) => C.pads.filter((p) => (p.zone ?? 0) === z));

  return (
    <div className="dsb">
      <header className="dsb-head">
        <span className="dsb-title">SANDBOX</span>
        <span className="dsb-meta">
          salon {zonesOpen}/{MAX_ZONES} · masa {tables} · görev {questIndex}/{C.quests.length}
        </span>
        <button className="dsb-x" onClick={() => setSb({ open: false })}>
          ✕
        </button>
      </header>

      <div className="dsb-body">
        <Row title="Para">
          <div className="dsb-chips">
            <button onClick={() => money(1000)}>+1K ₺</button>
            <button onClick={() => money(100_000)}>+100K ₺</button>
            <button onClick={() => money(10_000_000)}>+10M ₺</button>
            <button onClick={() => gems(100)}>+100 💎</button>
            <label className="dsb-toggle">
              <input
                type="checkbox"
                checked={infiniteMoney}
                onChange={(e) => setSb({ infiniteMoney: e.target.checked })}
              />
              Sınırsız
            </label>
          </div>
          <div className="dsb-note">
            cüzdan {wallet.toNumber().toExponential(2)} ₺ · {diamonds.toNumber()} 💎
          </div>
        </Row>

        <Row title="Zaman">
          <div className="dsb-chips">
            {[1, 2, 5, 10, 25].map((t) => (
              <button
                key={t}
                className={timeScale === t ? 'on' : ''}
                onClick={() => setSb({ timeScale: t })}
              >
                ×{t}
              </button>
            ))}
            <button onClick={() => advance(60)}>+1 dk</button>
            <button onClick={() => advance(600)}>+10 dk</button>
            <button onClick={() => advance(3600)}>+1 sa</button>
          </div>
        </Row>

        <Row title="Çay ocağı / tezgâh seviyesi">
          {Array.from({ length: MAX_ZONES }, (_, z) => (
            <Stepper
              key={z}
              label={`Salon ${z + 1}`}
              value={stationLevels[z] ?? 0}
              max={STATION_MAX}
              asLevel
              onChange={(v) => setStation(z, v)}
              suffix={stationLevels[z] >= STATION_MAX ? ' Usta' : ''}
            />
          ))}
        </Row>

        <Row title="Masa seviyeleri">
          <div className="dsb-chips">
            {[0, 1, 2, 3, 4].map((l) => (
              <button key={l} onClick={() => setAllTables(l)}>
                hepsi L{l + 1}
              </button>
            ))}
          </div>
          <div className="dsb-grid">
            {Array.from({ length: MAX_ZONES * TABLES_PER_ZONE }, (_, i) => (
              <Stepper
                key={i}
                label={`M${i + 1}`}
                value={tableLevels[i] ?? 0}
                max={TABLE_MAX}
                asLevel
                onChange={(v) => setTable(i, v)}
              />
            ))}
          </div>
        </Row>

        <Row title="Karakter">
          {(['tray', 'magnet', 'speed'] as const).map((k) => (
            <Stepper
              key={k}
              label={{ tray: 'Tepsi', magnet: 'Mıknatıs', speed: 'Hız' }[k]}
              value={charUpgrades[k]}
              max={CHAR_MAX[k]}
              onChange={(v) => useGame.setState({ charUpgrades: { ...charUpgrades, [k]: v } })}
            />
          ))}
        </Row>

        <Row title="Personel">
          <Stepper
            label="Çay garsonu tepsi"
            value={waiterUpgrades.teaTray}
            max={waiterTrayMaxTier('tea')}
            onChange={(v) => useGame.setState({ waiterUpgrades: { ...waiterUpgrades, teaTray: v } })}
          />
          <Stepper
            label="Çay garsonu hız"
            value={waiterUpgrades.teaSpeed}
            max={waiterSpeedMaxTier('tea')}
            onChange={(v) => useGame.setState({ waiterUpgrades: { ...waiterUpgrades, teaSpeed: v } })}
          />
          <Stepper
            label="Tostçu tepsi"
            value={waiterUpgrades.tostTray}
            max={waiterTrayMaxTier('tost')}
            onChange={(v) => useGame.setState({ waiterUpgrades: { ...waiterUpgrades, tostTray: v } })}
          />
          <Stepper
            label="Tostçu hız"
            value={waiterUpgrades.tostSpeed}
            max={waiterSpeedMaxTier('tost')}
            onChange={(v) => useGame.setState({ waiterUpgrades: { ...waiterUpgrades, tostSpeed: v } })}
          />
          <Stepper
            label="Bulaşıkçı leğen"
            value={waiterUpgrades.dishCarry}
            max={dishCarryMaxTier()}
            onChange={(v) => useGame.setState({ waiterUpgrades: { ...waiterUpgrades, dishCarry: v } })}
          />
          <Stepper
            label="Bulaşıkçı hız"
            value={waiterUpgrades.dishSpeed}
            max={dishSpeedMaxTier()}
            onChange={(v) => useGame.setState({ waiterUpgrades: { ...waiterUpgrades, dishSpeed: v } })}
          />
        </Row>

        <Row title="İlerleme (pad zinciri)">
          <div className="dsb-chips">
            <button onClick={() => setPads([])}>hiçbiri</button>
            <button onClick={() => setPads(C.pads.filter((p) => !p.optional).map((p) => p.id))}>
              omurga
            </button>
            <button onClick={() => setPads(C.pads.map((p) => p.id))}>hepsi</button>
          </div>
          {padsByZone.map((list, z) =>
            list.length === 0 ? null : (
              <div key={z} className="dsb-pads">
                <span className="dsb-pads-z">S{z + 1}</span>
                {list.map((p) => (
                  <button
                    key={p.id}
                    className={`dsb-pad${padsDone.includes(p.id) ? ' on' : ''}${p.optional ? ' opt' : ''}`}
                    title={`${p.id} · ${p.cost} ₺ · sağ tık: buraya kadar aç`}
                    onClick={() => togglePad(p.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openUpTo(p.id);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ),
          )}
          <div className="dsb-note">sol tık: aç/kapat · sağ tık: o pad'e kadar hepsini aç</div>
        </Row>

        <Row title="Görev">
          <div className="dsb-chips">
            <button onClick={() => useGame.setState({ questIndex: Math.max(0, questIndex - 1) })}>
              ◀ geri
            </button>
            <button
              onClick={() =>
                useGame.setState({ questIndex: Math.min(C.quests.length, questIndex + 1) })
              }
            >
              ileri ▶
            </button>
            <button onClick={() => useGame.setState({ questIndex: C.quests.length })}>
              hattı bitir
            </button>
          </div>
          <select
            value={Math.min(questIndex, C.quests.length - 1)}
            onChange={(e) => window.__setQuest?.(C.quests[+e.target.value].id)}
          >
            {C.quests.map((q, i) => (
              <option key={q.id} value={i}>
                {i + 1}. {q.title}
              </option>
            ))}
          </select>
        </Row>

        <Row title="Kozmetik">
          <div className="dsb-chips">
            <button onClick={unlockAllCosmetics}>hepsini aç</button>
          </div>
          {Array.from({ length: MAX_ZONES }, (_, z) => (
            <div key={z} className="dsb-cos">
              <span className="dsb-pads-z">S{z + 1}</span>
              <select value={floorThemeByZone[z] ?? 'parke'} onChange={(e) => applyFloor(z, e.target.value)}>
                {C.cosmetics.floorThemes.map((t) => (
                  <option key={t.id} value={t.id}>
                    zemin: {t.label}
                  </option>
                ))}
              </select>
              <select value={wallThemeByZone[z] ?? 'krem'} onChange={(e) => applyWall(z, e.target.value)}>
                {C.cosmetics.wallThemes.map((t) => (
                  <option key={t.id} value={t.id}>
                    duvar: {t.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <select value={tableTheme} onChange={(e) => useGame.setState({ tableTheme: e.target.value })}>
            {C.cosmetics.tableThemes.map((t) => (
              <option key={t.id} value={t.id}>
                masa: {t.label}
              </option>
            ))}
          </select>
        </Row>

        <Row title="Ekran / kayıt">
          <div className="dsb-chips">
            <label className="dsb-toggle">
              <input type="checkbox" checked={hideHud} onChange={(e) => setSb({ hideHud: e.target.checked })} />
              HUD'ı gizle
            </label>
            <button onClick={() => useGame.getState().saveNow()}>kaydet</button>
            <button
              className="danger"
              onClick={() => {
                if (window.confirm('Kaydı sıfırla?')) useGame.getState().hardReset();
              }}
            >
              sıfırla
            </button>
          </div>
        </Row>
      </div>
    </div>
  );
}
