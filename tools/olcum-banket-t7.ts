/**
 * olcum-banket-t7.ts — T7 ÖLÇÜM (G-83/G-84): banket büyüme kollarının SAYILARI.
 *
 * Kareler (`tools/shot-banket-t7.mjs`) "nasıl görünüyor"u gösterir; bu araç kareye bakarak
 * söylenemeyecek üç şeyi sayar — her kol × şeritte açık masa sayısı (1 · 2 · 3 · 4 · 6 · 8 · 12):
 *
 *   boy      sahnedeki banket boyu toplamı (br) — "banket de büyüsün" isteğinin ölçüsü
 *   bos      masası OLMAYAN oturak yüzü boyu (br) — kullanıcının şikâyeti "banketler tamamen açık
 *            geliyor, sadece masa ekliyorum" tam bu sayıdır; tadilat iskeleti ayrı sayılır
 *   isk      tadilat iskeleti (B3) boyu (br)
 *   mesh     banketin çizim çağrısı (mesh) sayısı, seviye 4'te — telefon yükü (T4/T6 turu)
 *
 * Çalıştır:  npx tsx tools/olcum-banket-t7.ts > docs/olcum-banket-t7.txt
 * (Saf geometri, deterministik; koşu kipi yok.)
 */
import { banketSutunlari, yuzGorunus } from '../src/components/three/banketLook';
import type { Buyume, Gorunus } from '../src/game/banketAday';
import { areaTableStart } from '../src/game/world';

const A2 = areaTableStart(2);
const ASAMALAR = [1, 2, 3, 4, 6, 8, 12];
const KOLLAR: Array<[Buyume, Gorunus]> = [['B0', 'R0'], ['B1', 'R2'], ['B2', 'R2'], ['B3', 'R2'], ['B4', 'R2']];

/** Scene.tsx `BanketSutunu` ile aynı sayım (sırt 2 · yüz: kaide+gövde 2 + oturak 1 + şerit + sırt minderi + yastık). */
function meshSay(buyume: Buyume, gorunus: Gorunus, n: number, level: number): number {
  const lv = new Array(24).fill(level);
  let m = 0;
  for (const s of banketSutunlari(A2 + n, lv, buyume)) {
    m += 2;
    for (const y of s.yuzler) {
      if (y.durum === 'yok') continue;
      if (y.durum === 'iskelet') { m += 3 + 3; continue; } // kaide+gövde+branda · duba (3 mesh)
      const g = yuzGorunus(gorunus, y.level);
      m += 3 + (g.minder && g.serit ? g.serit.length : 0) + (g.sirtMinder ? 1 : 0) + (g.yastik ? Math.max(1, Math.floor(s.len / 1.6)) : 0);
    }
  }
  return m;
}

console.log('# T7 · G-83/G-84 · banket büyüme kolları (boy/bos/isk = br · mesh = seviye 4)');
console.log('# Taban (B0) bugünkü hâl: iki ada tam boy, masa yalnız üstüne dizilir. Görünüş B1-B4: R2.');
console.log('# B0 satırının mesh sütunu yeni çizicinin sayımıdır; bugünkü BanketIslands sabit 24 mesh çizer (ada başına 12).');
for (const [b, g] of KOLLAR) {
  console.log(`\n## ${b} (${g})`);
  console.log('masa  sutun  boy     bos     isk     mesh');
  for (const n of ASAMALAR) {
    const lv = new Array(24).fill(4);
    const sutun = banketSutunlari(A2 + n, lv, b);
    let boy = 0, bos = 0, isk = 0;
    for (const s of sutun) {
      boy += s.len;
      for (const y of s.yuzler) {
        if (y.durum === 'iskelet') isk += s.len;
      }
    }
    // Masasız yüz: çizilen 'acik' yüz sayısı − açık masa sayısı, sütun boyuyla tartılı.
    const acikYuz = sutun.flatMap((s) => s.yuzler.filter((y) => y.durum === 'acik').map(() => s.len));
    const toplamAcik = acikYuz.reduce((a, c) => a + c, 0);
    const masali = sutun.reduce((a, s) => a + s.len * s.yuzler.filter((y) => y.durum === 'acik' && y.level > 0).length, 0);
    bos = Math.max(0, toplamAcik - masali) + 0;
    console.log(
      `${String(n).padStart(4)}  ${String(sutun.length).padStart(5)}  ${boy.toFixed(1).padStart(5)}  ${bos.toFixed(1).padStart(6)}  ${isk.toFixed(1).padStart(6)}  ${String(meshSay(b, g, n, 4)).padStart(5)}`,
    );
  }
}
