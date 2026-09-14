/**
 * karakter.test.ts — S14'ün BEKÇİSİ (D-112).
 *
 * **Neyi koruyor:** personel gövdeleri artık dosyadan geliyor ve dört ayrı şeyin aynı anda
 * tutmasına bağlı — model dosyası, klip dosyası, klip ADI, ve ekipman ayrımı. Dördü de sessizce
 * bozulabilecek cinsten:
 *
 * - Bir model adı değişirse oyun **yedeksiz** kalır: `KayActor` `Model.tsx` gibi ilkel şekle
 *   düşmüyor, doğrudan `useGLTF` çağırıyor. Dosya yoksa sahne patlar.
 * - Klip ADI dosyanın içinde yazılı; KayKit sürüm atlarsa (`Idle_A` → `Idle`) kod sessizce
 *   `undefined` eylem alır ve karakter **T-pozunda** donar — konsol hatası bile vermez.
 * - Ekipman ayrımı adın SON bölümüne bakar. Ölçüm turunda ilk hâli adın TAMAMINA bakıyordu ve
 *   `Rogue_Hooded_Head`i "hood" diye ekipman sayıp karakterin **başını** söküyordu. Bu testin
 *   asıl sebebi o: kural doğru parçayı gizlediğini kendi kanıtlamalı.
 * - Ölçek tek sayıdan türüyor (`KAY_SCALE`); elle bir yere 0,8 yazılırsa boy 1,75 olmaktan çıkar.
 *
 * Sayılar: `docs/karakter-raporu-s14.md` · ham `docs/olcum-karakter.json`.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  ACTOR_HEIGHT,
  AUTHORED_HEIGHT,
  KAY_AUTHORED,
  KAY_KIYAFET,
  KAY_KLIPLER,
  KAY_KOK,
  KAY_MODEL,
  KAY_SCALE,
  KAY_TEPSI_KAYMA,
  KAY_GARSON_TEPSI_KAYMA,
} from '../src/config/actor';
// @ts-expect-error — ölçüm aracı düz .mjs; tip yok, glTF okuyucu var.
import { gltfOku, karakterOlc } from '../tools/olcum-karakter.mjs';

const DIZIN = path.join('public', KAY_KOK.replace(/^\//, ''));
const yol = (ad: string) => path.join(DIZIN, `${ad}.glb`);
const KAYNAK = readFileSync('src/components/three/KayActor.tsx', 'utf8');

/** KayActor'ün KLİP tablosunu kaynaktan okur — test ile kod tek yerden beslensin. */
function klipTablosu(): Record<string, string> {
  const blok = KAYNAK.slice(KAYNAK.indexOf('const KLIP = {'), KAYNAK.indexOf('} as const;', KAYNAK.indexOf('const KLIP = {')));
  const cikti: Record<string, string> = {};
  for (const m of blok.matchAll(/(\w+):\s*'([^']+)'/g)) cikti[m[1]] = m[2];
  return cikti;
}

describe('S14 — karakter gövdeleri (D-112)', () => {
  it('① her role bir gövde yazılı ve dosyası repoda', () => {
    for (const kind of Object.keys(AUTHORED_HEIGHT) as (keyof typeof AUTHORED_HEIGHT)[]) {
      const model = KAY_MODEL[kind];
      expect(model, `${kind} için gövde yazılmamış`).toBeTruthy();
      expect(existsSync(yol(model)), `${kind} → ${model}.glb repoda yok`).toBe(true);
    }
  });

  it('② klip dosyalarının hepsi repoda ve hepsi AYNI rig', () => {
    const rigler = new Set<string>();
    for (const dosya of KAY_KLIPLER) {
      expect(existsSync(yol(dosya)), `${dosya}.glb yok`).toBe(true);
      const { j } = gltfOku(yol(dosya));
      expect((j.animations ?? []).length, `${dosya} klip taşımıyor`).toBeGreaterThan(0);
      rigler.add((j.scenes?.[0]?.nodes ?? []).map((i: number) => j.nodes[i].name).join('+'));
    }
    // Tek rig şartı: klip başka iskelete yazılmışsa gövdeye HİÇ tutmaz (sessiz T-poz).
    expect([...rigler], 'klip dosyaları farklı rig taşıyor').toEqual(['Rig_Medium']);
  });

  it('③ KayActor’ün çağırdığı her klip ADI dosyaların içinde gerçekten var', () => {
    const mevcut = new Set<string>();
    for (const dosya of KAY_KLIPLER) {
      const { j } = gltfOku(yol(dosya));
      for (const a of j.animations ?? []) mevcut.add(a.name);
    }
    const tablo = klipTablosu();
    expect(Object.keys(tablo).length, 'KLIP tablosu okunamadı').toBeGreaterThanOrEqual(5);
    for (const [hal, klip] of Object.entries(tablo)) {
      expect(mevcut.has(klip), `"${hal}" için "${klip}" klibi hiçbir dosyada yok → T-poz`).toBe(true);
    }
  });

  it('④ gövdeler aynı iskeleti paylaşıyor → TEK ölçek doğru', () => {
    for (const model of Object.values(KAY_MODEL)) {
      const o = karakterOlc(yol(model));
      expect(o.iskelet, `${model} başka rig`).toBe('Rig_Medium');
      expect(o.skinned, `${model} skinned değil`).toBe(true);
      // Bacak mesh'i hepsinde 0…0,53: gövde ölçüsü iskeletten geliyor, saç/sakaldan değil.
      const bacak = o.parcalar.find((p: { ad: string }) => /leg/i.test(p.ad));
      expect(bacak, `${model} bacak parçası yok`).toBeTruthy();
      expect(bacak.yBoy).toBeGreaterThan(0.5);
      expect(bacak.yBoy).toBeLessThan(0.56);
    }
  });

  it('⑤ ekipman ayrımı BAŞI sökmüyor (Rogue_Hooded_Head tuzağı)', () => {
    // REPODAKİ HER gövde denenir, yalnız role atanmış olanlar değil: tuzağı taşıyan model
    // (Rogue_Hooded) şu an hiçbir role atanmamış durumda ve yalnız atananlara bakan bir test
    // kuralın bozulmasını KAÇIRIYOR (mutasyon M4 böyle kaçtı). Kuralı kural olarak sınamak
    // için tuzağın kendisi listede durmalı.
    const hepsi = readdirSync(DIZIN)
      .filter((f) => f.endsWith('.glb') && !f.startsWith('Rig_'))
      .map((f) => f.replace(/\.glb$/, ''));
    expect(hepsi, 'tuzak modeli repoda yok — test kendi kapsamını kaybetmiş').toContain('Rogue_Hooded');
    for (const model of hepsi) {
      const o = karakterOlc(yol(model));
      const govdeRolleri = o.parcalar.filter(
        (p: { ad: string }) => /_(Head|Body|ArmLeft|ArmRight|LegLeft|LegRight)$/i.test(p.ad),
      );
      expect(govdeRolleri.length, `${model} gövde parçaları bulunamadı`).toBeGreaterThanOrEqual(6);
      for (const p of govdeRolleri) {
        expect(p.ekipman, `${model}: "${p.ad}" ekipman sayıldı — gövde parçası sökülüyor`).toBe(false);
      }
      // Ve gerçekten sökülen bir şey OLMALI: aksi hâlde kural hiç çalışmıyor demektir.
      // (Barbarian BearHat · Knight Cape/Helmet/Visor · Mage Cape/Hat · Ranger Cape/Quiver · Rogue Cape)
      expect(o.ekipmanParca.length, `${model}: hiç ekipman ayıklanmadı`).toBeGreaterThan(0);
    }
  });

  it('⑥ ölçek tek sayıdan türüyor ve boy 1,75’te kalıyor', () => {
    expect(KAY_AUTHORED * KAY_SCALE).toBeCloseTo(ACTOR_HEIGHT, 6);
    // Ölçek gövdelerin ham boyundan DEĞİL iskeletten geliyor; 2,16…2,63 aralığının içinde olmalı.
    expect(KAY_AUTHORED).toBeGreaterThan(2.1);
    expect(KAY_AUTHORED).toBeLessThan(2.7);
  });

  it('⑦ taşınan eşya gövde ölçeğinin DIŞINDA ve ELE takılı (S16 ile güncellendi)', () => {
    // S16'ya kadar tepsi SABİT bir dünya noktasına asılıydı ve kaymalar onu oraya taşıyordu.
    // Ölçüm o tasarımın kusurunu gösterdi (`docs/olcum-tepsi.json`): eller 0,66'da, çapa
    // 0,953'te — tepsi ellerin 29 cm üstünde. Artık grup ELİ takip ediyor; kaymaların TEK işi
    // bileşenin İÇİNDEKİ çapayı sıfırlamak (`CupTray` [0,1,00,0,45] · `WaiterTray` [0,0,95,0,40]).
    expect(KAY_TEPSI_KAYMA[1] + 1.0).toBeCloseTo(0, 6);
    expect(KAY_TEPSI_KAYMA[2] + 0.45).toBeCloseTo(0, 6);
    expect(KAY_GARSON_TEPSI_KAYMA[1] + 0.95).toBeCloseTo(0, 6);
    expect(KAY_GARSON_TEPSI_KAYMA[2] + 0.4).toBeCloseTo(0, 6);
    // Tepsi bileşenleri artık gövde ölçeğinin altında DURMAMALI.
    for (const dosya of ['Player.tsx', 'Waiter.tsx', 'Dishwasher.tsx']) {
      const s = readFileSync(path.join('src/components/three', dosya), 'utf8');
      expect(s.includes('scale={actorScale('), `${dosya}: eşya hâlâ gövde ölçeğinin içinde`).toBe(false);
      // Taşınan eşya `KayActor`ün ÇOCUĞU olmalı — kardeş kalırsa eli takip edemez.
      expect(s, `${dosya}: taşınan eşya KayActor'ün çocuğu değil`).toMatch(/<KayActor[\s\S]*?<\/KayActor>/);
    }
  });

  it('⑧ her rolün kıyafeti yazılı ve lisans künyesi repoda', () => {
    for (const kind of Object.keys(AUTHORED_HEIGHT) as (keyof typeof AUTHORED_HEIGHT)[]) {
      expect(KAY_KIYAFET[kind], `${kind} kıyafeti yazılmamış`).toBeTruthy();
    }
    // Önlük personelin tamamında var; kasket yalnız çaycı hattında (sahip + usta).
    expect(Object.values(KAY_KIYAFET).every((k) => k.onluk)).toBe(true);
    expect(Object.values(KAY_KIYAFET).filter((k) => k.kasket).length).toBeGreaterThan(0);
    expect(existsSync(path.join(DIZIN, 'License-Adventurers.txt'))).toBe(true);
    expect(existsSync(path.join(DIZIN, 'License-CharacterAnimations.txt'))).toBe(true);
    expect(readFileSync('public/assets/README.md', 'utf8')).toContain('kaykit-characters');
  });

  it('⑨ BAŞ boyanmıyor — yüz/saç/sakal gövdenin kendi dokusundan gelir', () => {
    // Ölçüm turunda gövdeyi düz boyamak saçı da yutmuştu: Barbarian'ın ak sakalı ten rengine
    // döndü. Kural o günden kaldı ve tek satırlık bir regex'e bağlı — bekçisi olmazsa
    // "tutarlılık olsun" diye baş listeye geri eklenir ve kimse fark etmez.
    const blok = KAYNAK.slice(KAYNAK.indexOf('const PARCA_RENK'), KAYNAK.indexOf('];', KAYNAK.indexOf('const PARCA_RENK')));
    expect(blok).toContain('/arm/i');
    expect(blok).toContain('/leg/i');
    expect(/head|skull/i.test(blok), 'baş boyama listesine girmiş — saç ten rengine döner').toBe(false);
  });

  it('⑩ skinned klon SkeletonUtils ile yapılıyor (düz klon iskeleti paylaştırır)', () => {
    expect(KAYNAK).toContain('skinKlon(scene)');
    const model = readFileSync('src/components/three/Model.tsx', 'utf8');
    expect(model).toContain('isSkinnedMesh');
    // Dizgede "SkeletonUtils" geçmesi YETMEZ: import durup klon satırı düz klona dönebilir ve
    // test yeşil kalır (mutasyon M8 böyle kaçtı). Klon İFADESİNİN kendisi aranır.
    expect(
      /skinned\s*\?\s*skinKlon\(scene\)\s*:\s*scene\.clone\(true\)/.test(model),
      'Model.tsx klon satırı skinned dalını kaybetmiş',
    ).toBe(true);
  });

  it('⑪ ekipman kuralı araç ile çalışma zamanında AYNI', () => {
    // Kural iki yerde yazılı: ölçüm aracı (`tools/olcum-karakter.mjs`) ve `KayActor`. İkisi
    // ayrışırsa ölçüm "sivil" der, oyun pelerini çizer — ve hiçbir test görmez.
    const liste = (s: string) => {
      const blok = s.slice(s.indexOf('const EKIPMAN'), s.indexOf('];', s.indexOf('const EKIPMAN')));
      return [...blok.matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort();
    };
    const arac = readFileSync('tools/olcum-karakter.mjs', 'utf8');
    expect(liste(KAYNAK), 'ekipman listeleri ayrışmış').toEqual(liste(arac));
    // Rol çıkarımı da aynı olmalı: ikisi de adın SON bölümüne bakar.
    for (const s of [KAYNAK, arac]) {
      expect(s).toContain("split('_').pop()");
      expect(/rol\.startsWith\(k\)\s*\|\|\s*rol\.endsWith\(k\)/.test(s)).toBe(true);
    }
  });
});
