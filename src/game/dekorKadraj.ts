import { DEKOR_KADRAJ, type VitrinDuvar } from '../config/decor';

type V3 = [number, number, number];

/**
 * 💎 DEKOR ÖNİZLEMESİNİN KAMERASI (F4c-4 · D-157) — SAF: çizilen gövdenin dünya kutusu + duvar →
 * kameranın yeri ve baktığı nokta. Kamera kutunun MERKEZİNE bakar (eşya hep ortada) ve eşyanın boyu
 * dikeyin `pay`ını kaplayacak kadar uzaklaşır (koltuk da kanarya kafesi de kutuda aynı boyda).
 */
export function dekorKadraj(min: V3, max: V3, duvar: VitrinDuvar): { kamera: V3; hedef: V3; uzaklik: number } {
  const K = DEKOR_KADRAJ;
  const hedef: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  const boy = max[1] - min[1];
  const yatay = Math.max(max[0] - min[0], max[2] - min[2]);
  const olcu = Math.max(boy, yatay * K.yatayCarpan, K.enAzOlcu);
  const uzaklik = olcu / K.pay / (2 * Math.tan((K.fov * Math.PI) / 360));
  const [x, y, z] = K.yon[duvar];
  const n = Math.hypot(x, y, z);
  return {
    kamera: [hedef[0] + (x / n) * uzaklik, hedef[1] + (y / n) * uzaklik, hedef[2] + (z / n) * uzaklik],
    hedef,
    uzaklik,
  };
}
