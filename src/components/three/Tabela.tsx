import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useGame } from '../../game/store';
import { tabelaYazisi } from '../../game/kafeAdi';
import { PALETTE } from '../../config/palette';
import { TABELA, TABELA_YAZI, tabelaFontPx } from './streetLook';

const TUVAL_EN = 1024;
const TUVAL_BOY = Math.round((TUVAL_EN * TABELA.h) / TABELA.w);

/** Ahşap levha + kafe adı (Türkçe büyük harf). Yazı uzunsa küçülür, levhadan taşmaz. */
function tabelaDokusu(metin: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = TUVAL_EN;
  c.height = TUVAL_BOY;
  const x = c.getContext('2d')!;
  x.fillStyle = PALETTE.tabela;
  x.fillRect(0, 0, TUVAL_EN, TUVAL_BOY);
  x.font = TABELA_YAZI.font.replace('{px}', '100');
  const harf100 = x.measureText('H').actualBoundingBoxAscent || 70;
  const px = tabelaFontPx(harf100, x.measureText(metin).width, TUVAL_EN, TUVAL_BOY);
  x.font = TABELA_YAZI.font.replace('{px}', px.toFixed(1));
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  x.fillStyle = PALETTE.tabelaYazi;
  x.fillText(metin, TUVAL_EN / 2, TUVAL_BOY / 2 + (harf100 * px) / 200);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * ALINLIK TABELASI (F4c-3 · D-156) — oyuncunun kafe adını taşır. Geometri `streetLook.TABELA`;
 * yazı yalnız ön yüzde (kutunun +z yüzü, BoxGeometry malzeme sırası 4), öteki yüzler düz ahşap.
 */
export function Tabela({ x }: { x: number }) {
  const kafeAdi = useGame((s) => s.kafeAdi);
  const metin = tabelaYazisi(kafeAdi);
  const doku = useMemo(() => tabelaDokusu(metin), [metin]);
  useEffect(() => () => doku.dispose(), [doku]);
  return (
    <mesh castShadow position={[x, TABELA.y, TABELA.z]} userData={{ tabela: true }}>
      <boxGeometry args={[TABELA.w, TABELA.h, TABELA.d]} />
      <meshStandardMaterial attach="material-0" color={PALETTE.tabela} />
      <meshStandardMaterial attach="material-1" color={PALETTE.tabela} />
      <meshStandardMaterial attach="material-2" color={PALETTE.tabela} />
      <meshStandardMaterial attach="material-3" color={PALETTE.tabela} />
      <meshStandardMaterial attach="material-4" map={doku} roughness={0.8} />
      <meshStandardMaterial attach="material-5" color={PALETTE.tabela} />
    </mesh>
  );
}
