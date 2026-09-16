/**
 * erisim-h1.test.ts — BEKÇİ: tetik ÇİZİLEN GÖVDEDİR, pan yalnız görünmeyen hedefe atılır (H1).
 *
 * NE KORUYOR. H1'e kadar üç ayrı yerde "yakınlık" bir NOKTAYA olan daireydi ve üçü de yanlış
 * noktayı seçiyordu:
 *   · kirli kap tetiği KABIN rastgele düştüğü noktadan ölçülüyordu → dörtlü masaya yanaşılabilen
 *     yönlerin yalnız %42,2'si topluyordu, kap en kötü yerdeyse %23,8 (yani masanın hangi yanından
 *     toplanacağını `Math.random()` seçiyordu);
 *   · ürün alma tetiği 3,2 br uzunluğundaki TEZGÂHIN MERKEZİNDEN ölçülüyordu → önünde durulabilen
 *     3,22 br'lik hattın 0,72 br'si ölüydü (semaverin tam önünde durup hiçbir şey alamamak);
 *   · görev panı hedefin görünürlüğüne hiç bakmıyordu → 6 panın 6'sında hedef zaten ekrandaydı ve
 *     oyuncu erken zincirde toplam 11,02 sn kendi karakterini göremiyordu.
 * Sayılar: `docs/erisim-raporu-h1.md` · ham çıktı `docs/olcum-erisim-h1.txt`.
 *
 * BU DOSYA İSME DEĞİL DAVRANIŞA BAKAR (S23'ün dersi): denetimlerin çoğu GERÇEK TICK'i sürüyor.
 * Kamera denetimleri de sahte bir matris uydurmuyor — gerçek `THREE.PerspectiveCamera`yı oyunun
 * kendi ankrajıyla (`config/camera.ts`) kuruyor ve onun matrislerini besliyor.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PerspectiveCamera, Vector3 } from 'three';
import { economyConfig } from '../src/config/economy.config';
import { CAMERA_DIST, CAMERA_FOV } from '../src/config/camera';
import { LAYOUT, atServiceBody, atTableBody, boxDist2D, servicePlace, tableHalfFor, useGame } from '../src/game/store';
import { cameraViewSifirla, cameraViewYaz, hedefEkranda } from '../src/game/cameraView';
import type { Vec3 } from '../src/game/types';

const REACH_MASA = economyConfig.cups.collectReach;
const REACH_OCAK = economyConfig.serving.pickupReach;
/** H1 ÖNCESİ yarıçaplar — "eskiden burada olmuyordu" cümlesini SAYIYLA kurmak için. */
const ESKI_MASA_R = 1.4;
const ESKI_OCAK_R = 1.6;

const yorumsuz = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** Oyuncuyu koy, girdiyi sıfırla, müşteri akışını durdur. */
function dur(x: number, z: number): void {
  useGame.setState({
    player: [x, 0.6, z] as Vec3,
    inputKeyboard: [0, 0], inputJoystick: [0, 0],
    npcs: [], spawnTimer: 999,
  });
}

/** Masanın dört yüzünde, gövdeye collision standoff'u kadar yanaşmış duraklar. */
function masaYuzleri(i: number): Array<{ ad: string; x: number; z: number }> {
  const t = LAYOUT.tables[i].table;
  const h = tableHalfFor(i);
  const d = LAYOUT.playerRadius + 0.02;
  return [
    { ad: '+z', x: t[0], z: t[2] + h[1] + d },
    { ad: '-z', x: t[0], z: t[2] - h[1] - d },
    { ad: '+x', x: t[0] + h[0] + d, z: t[2] },
    { ad: '-x', x: t[0] - h[0] - d, z: t[2] },
  ];
}

// =============================================================================================
//  1) M3 — kirli kap tetiği MASANIN gövdesinden (gerçek tick)
// =============================================================================================
describe('H1/M3 · kirli kap tetiği masanın gövdesidir', () => {
  /** Kabı masanın EN KÖTÜ köşesine koy: oyuncudan en uzak saçılma noktası. */
  function kapEnKotuKose(i: number, oyuncu: { x: number; z: number }): [number, number, number] {
    const t = LAYOUT.tables[i].table;
    const yari = 0.3; // tick.ts'in saçılma yarısı (±0,30 br)
    return [
      t[0] + (oyuncu.x > t[0] ? -yari : yari),
      0.95,
      t[2] + (oyuncu.z > t[2] ? -yari : yari),
    ];
  }

  it('1 · masanın DÖRT yüzünden de toplanır — kap en kötü köşedeyken bile', () => {
    for (const yuz of masaYuzleri(0)) {
      useGame.getState().hardReset();
      const kap = kapEnKotuKose(0, yuz);
      dur(yuz.x, yuz.z);
      useGame.setState({ tray: 0, carriedDirty: 0, carriedDirtyFood: 0, dishes: [{ id: 9001, pos: kap, tableIndex: 0 }] });
      useGame.getState().tick(0.1);
      expect(useGame.getState().carriedDirty, `${yuz.ad} yüzünden toplanmalı`).toBe(1);
      expect(useGame.getState().dishes.length).toBe(0);
    }
  });

  it('2 · ESKİ DAİRENİN kaçırdığı durum artık toplanıyor (regresyon: sayıyla)', () => {
    // Bu denetim ancak eski tetik o noktada GERÇEKTEN ölü idiyse anlamlı — önce onu doğrula.
    const yuz = masaYuzleri(0)[0];
    const kap = kapEnKotuKose(0, yuz);
    const eskiMesafe = Math.hypot(yuz.x - kap[0], yuz.z - kap[2]);
    expect(eskiMesafe, 'eski 1,40 br daire bu noktada ölü olmalıydı').toBeGreaterThan(ESKI_MASA_R);
    expect(atTableBody(yuz.x, yuz.z, 0, REACH_MASA), 'gövde tetiği ateşlemeli').toBe(true);
  });

  it('3 · masadan UZAKLAŞINCA tetik söner (pay sınırsız değil)', () => {
    const t = LAYOUT.tables[0].table;
    const h = tableHalfFor(0);
    const uzak = t[2] + h[1] + REACH_MASA + 0.2;
    expect(atTableBody(t[0], uzak, 0, REACH_MASA)).toBe(false);
    useGame.getState().hardReset();
    dur(t[0], uzak);
    useGame.setState({ tray: 0, carriedDirty: 0, dishes: [{ id: 9002, pos: [t[0], 0.95, t[2]], tableIndex: 0 }] });
    useGame.getState().tick(0.1);
    expect(useGame.getState().carriedDirty).toBe(0);
    expect(useGame.getState().dishes.length).toBe(1);
  });

  it('4 · SIZINTI YOK: bir masanın başında KOMŞU masanın kabı toplanmaz', () => {
    // Kattaki EN YAKIN masa çifti seçilir — sızıntı olacaksa orada olur.
    let a = 0, b = 1, enYakin = Infinity;
    for (let i = 0; i < LAYOUT.tables.length; i++) {
      for (let j = i + 1; j < LAYOUT.tables.length; j++) {
        const d = Math.hypot(
          LAYOUT.tables[i].table[0] - LAYOUT.tables[j].table[0],
          LAYOUT.tables[i].table[2] - LAYOUT.tables[j].table[2],
        );
        if (d < enYakin) { enYakin = d; a = i; b = j; }
      }
    }
    for (const yuz of masaYuzleri(a)) {
      expect(atTableBody(yuz.x, yuz.z, a, REACH_MASA), `${a} kendi masası`).toBe(true);
      expect(atTableBody(yuz.x, yuz.z, b, REACH_MASA), `${a}'nın başında ${b} tetiklenmemeli`).toBe(false);
    }
  });

  it('5 · TEK KAYNAK: tick kirli kap tetiğini kabın noktasından ölçmüyor', () => {
    const src = yorumsuz(readFileSync('src/game/tick.ts', 'utf8'));
    expect(src).toContain('atTableBody(player[0], player[2], d.tableIndex');
    expect(src, 'oyuncunun tetiği kabın noktasına geri dönmemeli')
      .not.toMatch(/dist2D\(player,\s*d\.pos\)/);
  });
});

// =============================================================================================
//  2) O3 — ürün alma tetiği TEZGÂHIN gövdesinden (gerçek tick)
// =============================================================================================
describe('H1/O3 · ürün alma tetiği tezgâhın gövdesidir', () => {
  /** Tezgâhın ÖLÜ UCU: uzun kenarın ucunda, ön yüze gövdesiyle yanaşmış durak. */
  function oluUc(areasOpen: number): { x: number; z: number; sp: ReturnType<typeof servicePlace> } {
    const sp = servicePlace(areasOpen);
    const uzunX = sp.half[0] >= sp.half[1];
    const yarim = uzunX ? sp.half[0] : sp.half[1];
    const derin = (uzunX ? sp.half[1] : sp.half[0]) + LAYOUT.playerRadius + 0.02;
    // Ön yüz: sol duvarda +x, arka bantta +z (rot'tan).
    return uzunX
      ? { x: sp.station[0] + yarim, z: sp.station[2] + derin, sp }
      : { x: sp.station[0] + derin, z: sp.station[2] + yarim, sp };
  }

  it('6 · tezgâhın UCUNDA duran oyuncu tepsisini doldurur (eski daire orada ÖLÜYDÜ)', () => {
    const { x, z, sp } = oluUc(1);
    // Önce kusurun oradaydı olduğunu SAYIYLA doğrula, sonra düzeldiğini.
    const eskiMesafe = Math.hypot(x - sp.station[0], z - sp.station[2]);
    expect(eskiMesafe, 'eski 1,60 br daire tezgâhın ucunda ölü olmalıydı').toBeGreaterThan(ESKI_OCAK_R);
    expect(atServiceBody(x, z, sp, REACH_OCAK), 'gövde tetiği ateşlemeli').toBe(true);

    useGame.getState().hardReset();
    dur(x, z);
    for (let i = 0; i < 300 && useGame.getState().tray === 0; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().tray, 'tezgâhın ucunda tepsi dolmalı').toBeGreaterThan(0);
  });

  it('7 · tezgâhtan UZAKLAŞINCA tetik söner', () => {
    const sp = servicePlace(1);
    const uzak = sp.station[0] + sp.half[0] + REACH_OCAK + 0.2;
    expect(atServiceBody(uzak, sp.station[2], sp, REACH_OCAK)).toBe(false);
  });

  it('8 · GARDİYAN AYNI YERDEN OKUYOR: tezgâhın ucunda yükseltme dolumu BAŞLAMAZ', () => {
    // `serveSystem` "al" derken, `fillTargetSystem` gardiyanı "o hâlde yükseltme dolumu dursun"
    // diyor. İkisi ayrı yazılsaydı arada tepsinin dolduğu ama gardiyanın görmediği bant kalırdı.
    const kur = () => {
      useGame.getState().hardReset();
      useGame.getState().addMoney(100000);
      useGame.setState({ padsDone: ['table2'], padFills: {}, upgradeFills: [0, 0, 0] });
    };
    const dolum = (x: number, z: number): number => {
      kur();
      dur(x, z);
      for (let i = 0; i < 8; i++) useGame.getState().tick(0.05);
      return useGame.getState().upgradeFills[0];
    };
    // POZİTİF KONTROL ÖNCE: yükseltme noktasında dolum GERÇEKTEN akıyor mu? Akmıyorsa aşağıdaki
    // sıfır gardiyanı değil (kilit · para · pad) başka bir şeyi ölçüyor olurdu.
    const sp = servicePlace(1);
    expect(dolum(sp.upgradeSpot[0], sp.upgradeSpot[2]), 'yükseltme noktasında dolum akmalı').toBeGreaterThan(0);
    const { x, z } = oluUc(1);
    expect(dolum(x, z), 'ocağın menzilindeyken dolum başlamamalı').toBe(0);
  });

  it('9 · yükseltme NOKTASI gövde tetiğinin dışında (gardiyan onu yutmuyor)', () => {
    for (const areasOpen of [1, 2, 3]) {
      const sp = servicePlace(areasOpen);
      expect(
        atServiceBody(sp.upgradeSpot[0], sp.upgradeSpot[2], sp, REACH_OCAK),
        `${areasOpen} alanda yükseltme noktası ocağın menzilinde olmamalı`,
      ).toBe(false);
      // Payın ne kadar kaldığı da yazılı olsun: daralırsa bu sayı önce düşer.
      expect(boxDist2D(sp.upgradeSpot[0], sp.upgradeSpot[2], sp.station, sp.half))
        .toBeGreaterThan(REACH_OCAK + 0.3);
    }
  });

  it('10 · TEK KAYNAK: alma ile gardiyan AYNI yüklemi çağırıyor', () => {
    const src = yorumsuz(readFileSync('src/game/tick.ts', 'utf8'));
    const kez = src.split('atServiceBody(player[0], player[2], c.place, C.serving.pickupReach)').length - 1;
    expect(kez, 'alma + gardiyan: iki çağrı, tek yüklem').toBe(2);
    expect(src, 'tetik tezgâhın merkezine geri dönmemeli')
      .not.toMatch(/dist2D\(player,\s*c\.place\.station\)/);
  });
});

// =============================================================================================
//  3) K2 — görev panı yalnız GÖRÜNMEYEN hedefe
// =============================================================================================
describe('H1/K2 · pan yalnız hedef ekran dışındaysa', () => {
  afterEach(() => cameraViewSifirla());

  /** Oyunun kendi ankrajıyla kurulmuş gerçek kamera: `[p.x, d, p.z + d]`, bakış `p`. */
  function kamerayiKur(px: number, pz: number, d = CAMERA_DIST): void {
    const cam = new PerspectiveCamera(CAMERA_FOV, 1280 / 800, 0.1, 200);
    cam.position.set(px, d, pz + d);
    cam.lookAt(new Vector3(px, 0.9, pz));
    cam.updateMatrixWorld();
    cameraViewYaz(cam.projectionMatrix.elements, cam.matrixWorldInverse.elements);
  }

  it('11 · kamera YOKKEN (vitest/sim) eski davranış: hedef "ekranda değil" sayılır', () => {
    cameraViewSifirla();
    expect(hedefEkranda(0, 0)).toBe(false);
  });

  it('12 · oyuncunun dibindeki hedef EKRANDA, katın öbür ucundaki DEĞİL', () => {
    kamerayiKur(0, 0);
    expect(hedefEkranda(0, 0), 'oyuncunun kendi noktası ekranda olmalı').toBe(true);
    expect(hedefEkranda(0, -3), 'ölçülen en dar görüş yarıçapı 4,25 br').toBe(true);
    expect(hedefEkranda(0, 40), 'katın dışı ekranda olmamalı').toBe(false);
    expect(hedefEkranda(-60, 0)).toBe(false);
  });

  it('13 · GERÇEK GEÇİŞ: hedef ekrandaysa pan YOK, ekran dışındaysa pan VAR', () => {
    const qi = economyConfig.quests.findIndex((q) => q.id === 'q_table2');
    expect(qi).toBeGreaterThan(0);
    const hedef = LAYOUT.padPos.table2;

    /** Görev geçiş ritminin son adımını kur (gap → active) ve tick'i sür. */
    const panOldu = (kameraX: number, kameraZ: number): boolean => {
      useGame.getState().hardReset();
      kamerayiKur(kameraX, kameraZ);
      useGame.setState({
        camFocus: null, questIndex: qi, questDoneIndex: qi - 1,
        questPhase: 'gap', questPhaseT: 0.02,
        inputKeyboard: [0, 0], inputJoystick: [0, 0], npcs: [], spawnTimer: 999,
      });
      useGame.getState().tick(0.05);
      // GEÇİŞ GERÇEKTEN OLDU MU? Olmadıysa `camFocus == null` panın kısıldığını değil, hiç
      // denenmediğini gösterirdi — sınavın kendisi boşa çıkardı.
      expect(useGame.getState().questPhase, 'gap dolup görev aktifleşmeliydi').toBe('active');
      expect(useGame.getState().questIndex).toBe(qi);
      return useGame.getState().camFocus != null;
    };

    // ① Kamera hedefin üstünde → hedef ekranda → pan ATILMAZ.
    expect(hedefEkranda(hedef[0], hedef[2])).toBe(false); // (henüz kamera kurulmadı)
    expect(panOldu(hedef[0], hedef[2]), 'hedef ekrandayken pan atılmamalı').toBe(false);
    // ② Kamera katın çok uzağında → hedef ekran dışında → pan ATILIR.
    expect(panOldu(hedef[0] + 120, hedef[2] + 120), 'hedef görünmezken pan atılmalı').toBe(true);
  });

  it('14 · HUD düğmesi (focusQuest) kapıdan GEÇMEZ: oyuncu isterse pan hep olur', () => {
    const qi = economyConfig.quests.findIndex((q) => q.id === 'q_table2');
    useGame.getState().hardReset();
    const hedef = LAYOUT.padPos.table2;
    kamerayiKur(hedef[0], hedef[2]);
    useGame.setState({ camFocus: null, questIndex: qi, questPhase: 'active', questPhaseT: 0 });
    expect(hedefEkranda(hedef[0], hedef[2]), 'bu sınav ancak hedef ekrandaysa anlamlı').toBe(true);
    useGame.getState().focusQuest();
    expect(useGame.getState().camFocus, 'oyuncunun kendi isteği kısılmamalı').not.toBeNull();
  });

  it('16 · KAMERANIN ARKASI ekran değildir (derinlik testi)', () => {
    // MUTASYON TURUNUN BULGUSU: `nz` denetimi bugün ZEMİN hedefleri için ÖLÜ — kamera 8,5 br
    // yukarıdan ~45° bakıyor ve y = 0,6 düzleminde arkada kalan hiçbir nokta x/y sınavını zaten
    // geçmiyor (160 × 160 br tarandı: 0 nokta). Yani derinlik satırını silmek bugün hiçbir şeyi
    // bozmuyordu ve mutasyon KAÇMIŞTI. Ama `hedefEkranda` YÜKSEKLİK alıyor ve kamera kipleri
    // (uzaklaş · odak zoom · portre) mesafeyi değiştiriyor: y yükseldiğinde kameranın ARKASINDAKİ
    // noktalar x/y sınavını geçip "ekranda" sanılıyor (taban kipte 3.773 nokta, portrede 862).
    // Kat 3 çatı terası gibi yükseltilmiş bir hedef geldiğinde kapı sessizce ters çalışırdı.
    kamerayiKur(0, 0);
    expect(hedefEkranda(-44, 60, 40), 'kameranın arkasında ve yukarıda').toBe(false);
    expect(hedefEkranda(0, 0, 40), 'tam tepede ama kadrajın dışında').toBe(false);
  });

  it('15 · TEK KAYNAK: kapı requestFocus\'ta, kamerayı sahne besliyor', () => {
    const tick = yorumsuz(readFileSync('src/game/tick.ts', 'utf8'));
    expect(tick).toMatch(/requestFocus[\s\S]{0,400}hedefEkranda\(pos\[0\], pos\[2\]\)/);
    const scene = yorumsuz(readFileSync('src/components/three/Scene.tsx', 'utf8'));
    expect(scene, 'sahne her karede görüş matrisini yazmalı')
      .toContain('cameraViewYaz(camera.projectionMatrix.elements, camera.matrixWorldInverse.elements)');
  });
});
