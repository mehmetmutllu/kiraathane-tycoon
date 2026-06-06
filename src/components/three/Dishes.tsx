import { useGame } from '../../game/store';

// Masalarda bekleyen kirli bardaklar (Faz 2e): lekeli ince-belli bardak. Oyuncu/bulaşıkçı
// toplayınca kaybolur. Greybox: gri-kahve silindir (temiz çay kırmızı/sıcak renkten ayrılır).
export function Dishes() {
  const dishes = useGame((s) => s.dishes);
  return (
    <>
      {dishes.map((d) => (
        <mesh key={d.id} castShadow position={[d.pos[0], d.pos[1], d.pos[2]]}>
          <cylinderGeometry args={[0.06, 0.05, 0.16, 8]} />
          <meshStandardMaterial color="#8d8276" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}
