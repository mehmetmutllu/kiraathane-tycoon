import { useGame, LAYOUT, visiblePads } from '../../game/store';
import { GroundMarker } from './GroundMarker';

// EKRANDA TEK PAD (quest sistemi, 2026-06-09): yalnız aktif görevin pad'i çizilir (visiblePads —
// tick'teki dolum mantığıyla AYNI kaynak). Renk: personel (hire*) mavi, masa açılışı yeşil.
export function Pad() {
  const padsDone = useGame((s) => s.padsDone);
  const padFills = useGame((s) => s.padFills);
  const tables = useGame((s) => s.tables);
  const stationLevel = useGame((s) => s.stationLevels[0]);
  const lifetime = useGame((s) => s.lifetime);
  const wallet = useGame((s) => s.wallet);
  const questIndex = useGame((s) => s.questIndex);
  const waiterServed = useGame((s) => s.stats.waiterServed);
  const cash = wallet.toNumber();
  const gate = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber(), waiterServed };

  const pads = visiblePads(questIndex, gate);

  return (
    <>
      {pads.map((pad) => {
        const fill = padFills[pad.id] ?? 0;
        const isHire = pad.effect.type === 'hireWaiter' || pad.effect.type === 'hireDishwasher';
        return (
          <GroundMarker
            key={pad.id}
            pos={LAYOUT.padPos[pad.id]}
            label={pad.label}
            sub={String(pad.cost)}
            coin
            tint={isHire ? '#42a5f5' : '#43d17a'}
            progress={fill / pad.cost}
            afford={cash >= pad.cost}
          />
        );
      })}
    </>
  );
}
