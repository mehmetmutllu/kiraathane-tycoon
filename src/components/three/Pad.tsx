import { useGame, LAYOUT, currentPad, availableOptionalPads } from '../../game/store';
import type { PadDef } from '../../config/economy.config';
import { GroundMarker } from './GroundMarker';

// Aktif pad'ler (D-017 §2/§3): sıradaki OMURGA pad'i + (sıralı reveal) AYNI ANDA tek opsiyonel pad.
// Görsel artık sade zemin işareti (havada rozet/iri koni yok). Renk: yeşil=aç (omurga), mavi=opsiyonel.
export function Pad() {
  const padsDone = useGame((s) => s.padsDone);
  const padFills = useGame((s) => s.padFills);
  const tables = useGame((s) => s.tables);
  const stationLevel = useGame((s) => s.stationLevel);
  const lifetime = useGame((s) => s.lifetime);
  const wallet = useGame((s) => s.wallet);
  const cash = wallet.toNumber();
  const gate = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber() };

  const backbone = currentPad(gate);
  // Sıralı reveal: hepsi birden değil, AYNI ANDA yalnız ilk alınabilir opsiyonel (clutter + ekran-dışı azalır).
  const optional = availableOptionalPads(gate)[0] ?? null;

  const markers: { pad: PadDef; tint: string }[] = [];
  if (backbone) markers.push({ pad: backbone, tint: '#43d17a' }); // yeşil = aç (omurga)
  if (optional) markers.push({ pad: optional, tint: '#42a5f5' }); // mavi = opsiyonel (personel)

  return (
    <>
      {markers.map(({ pad, tint }) => {
        const fill = padFills[pad.id] ?? 0;
        return (
          <GroundMarker
            key={pad.id}
            pos={LAYOUT.padPos[pad.id]}
            label={pad.label}
            sub={`₺${pad.cost}`}
            tint={tint}
            progress={fill / pad.cost}
            afford={cash >= pad.cost}
          />
        );
      })}
    </>
  );
}
