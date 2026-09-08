/**
 * tek-odak.test.ts — D-038'in DÖRDÜNCÜ kanalının (dünyadaki işaret) bekçisi. C2, 2026-09-08.
 *
 * Ölçüm (`docs/tek-odak-c2.md`): ekranda ort. 7,8 / en çok 16 zemin işareti vardı ve hepsi AYNI
 * görsel ağırlıktaydı → "hangisi şu anki adım" okunmuyordu. Çözüm noktaları SİLMEK değil (kullanıcı
 * kararı: yükseltme obje-başı, her masanın noktası kendi yanında), sesi katmanlamak (`markerTier`).
 *
 * Korunan dört şey:
 *   1. `markerTier`in davranışı — aktiflik MESAFEDEN değil aktif adımın hedefinden gelir.
 *   2. **En fazla BİR aktif işaret** — ankrajlar birbirinden ayrı olduğu için yapısal garanti.
 *   3. **Aktif adımın hedefi bir işaret ankrajına DENK GELİR** — `questFocusPos` (bant/kamera/ok)
 *      ile işaretlerin çizildiği yer ayrışırsa aktif işaret sessizce hiç yanmaz. Sessiz sapma budur.
 *   4. Yakınlık eşiğinin BÜTÇESİ: tek noktada dururken en çok kaç işaret birden konuşur.
 */
import { describe, expect, it } from 'vitest';
import { markerTier, SPEAK_RADIUS, type ActiveStep } from '../src/game/activeStep';
import { LAVABO, LAYOUT, servicePlace } from '../src/game/layout';
import { questFocusPos } from '../src/game/rules';
import { economyConfig as C } from '../src/config/economy.config';
import { MAX_AREAS } from '../src/game/world';

const OFF: ActiveStep = { has: false, x: 0, z: 0 };
const at = (x: number, z: number): [number, number, number] => [x, 0, z];
const mesafe = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);

interface Anchor {
  name: string;
  pos: readonly [number, number, number];
}

/**
 * Sahnede bir işaretin belirebileceği bütün ankrajlar.
 *
 * `lavabo` PAD'İ bilerek DIŞARIDA: lavabo pad'i ile lavabo yükseltme noktası AYNI noktada durur
 * (pad bitince aynı yerde yükseltme belirir — obje-başı yükseltme kuralı) ve ikisi asla birlikte
 * çizilmez. Bu kasıtlı paylaşımı ayrı bir bekçi tutuyor ("aynı yerde durduğu KASITLI").
 */
function allAnchors(): Anchor[] {
  const out: Anchor[] = [];
  for (const p of C.pads) {
    if (p.id === 'lavabo') continue;
    const pos = LAYOUT.padPos[p.id];
    if (pos) out.push({ name: `pad:${p.id}`, pos });
  }
  LAYOUT.tables.forEach((t, i) => out.push({ name: `masa:${i}`, pos: t.upgradeSpot }));
  // Servis TEK; yeri `areasOpen`la değişiyor (3. alan açılınca arka banda taşınır). Aynı noktayı
  // veren alanlar tek ankraj sayılır — yoksa "iki işaret çakıştı" diye okunur, oysa aynı işaret.
  for (let a = 1; a <= MAX_AREAS; a++) {
    const pos = servicePlace(a).upgradeSpot;
    if (!out.some((o) => mesafe(o.pos, pos) < 0.01)) out.push({ name: `servis@alan${a}`, pos });
  }
  out.push({ name: 'lavabo', pos: LAVABO.spot });
  return out;
}

/** AYNI ANDA çizilebilenler: bütün masa noktaları + TEK servis + lavabo. (Pad ayrı: en fazla 1 tane.) */
function coDrawable(areasOpen: number): Anchor[] {
  const out: Anchor[] = LAYOUT.tables.map((t, i) => ({ name: `masa:${i}`, pos: t.upgradeSpot }));
  out.push({ name: 'servis', pos: servicePlace(areasOpen).upgradeSpot });
  out.push({ name: 'lavabo', pos: LAVABO.spot });
  return out;
}

describe('C2 · markerTier — işaretin katmanı', () => {
  it('aktif adımın ankrajındaki işaret AKTİF olur', () => {
    expect(markerTier(at(4, -2), { has: true, x: 4, z: -2 }, at(0, 0))).toBe('aktif');
  });

  it('aktiflik MESAFEDEN gelmez — uzaktaki aktif adım da aktiftir', () => {
    expect(markerTier(at(40, 40), { has: true, x: 40, z: 40 }, at(0, 0))).toBe('aktif');
  });

  it('aktif adım yokken yakındaki konuşur, uzaktaki susar', () => {
    expect(markerTier(at(0, SPEAK_RADIUS - 0.1), OFF, at(0, 0))).toBe('konusan');
    expect(markerTier(at(0, SPEAK_RADIUS + 0.1), OFF, at(0, 0))).toBe('sessiz');
  });

  it('eşik tam üstünde konuşur (kapalı aralık — sınırda titremesin)', () => {
    expect(markerTier(at(SPEAK_RADIUS, 0), OFF, at(0, 0))).toBe('konusan');
  });

  it('aktif adım varken UZAKTAKİ başka işaret yine sessizdir', () => {
    const step: ActiveStep = { has: true, x: 20, z: 20 };
    expect(markerTier(at(0, 0), step, at(0, 40))).toBe('sessiz');
  });
});

describe('C2 · en fazla BİR aktif işaret', () => {
  const anchors = allAnchors();

  it('bekçi boşa dönmesin — ankraj kümesi dolu', () => {
    expect(anchors.length).toBeGreaterThan(30);
  });

  it('işaret ankrajları birbirinden ayrı → iki işaret aynı anda aktif olamaz', () => {
    const cakisan: string[] = [];
    for (let i = 0; i < anchors.length; i++) {
      for (let j = i + 1; j < anchors.length; j++) {
        const d = mesafe(anchors[i].pos, anchors[j].pos);
        if (d < 0.1) cakisan.push(`${anchors[i].name} ↔ ${anchors[j].name} (${d.toFixed(3)})`);
      }
    }
    expect(cakisan).toEqual([]);
  });

  it('her ankraj hedef alındığında aktif sayısı tam 1', () => {
    for (const a of anchors) {
      const step: ActiveStep = { has: true, x: a.pos[0], z: a.pos[2] };
      const aktif = anchors.filter((b) => markerTier(b.pos, step, at(999, 999)) === 'aktif');
      expect(aktif.length, `${a.name} için aktif sayısı`).toBe(1);
    }
  });

  it('lavabo padi ile lavabo yükseltme noktasının aynı yerde durması KASITLI', () => {
    // Pad bitince aynı noktada yükseltme belirir; ikisi birlikte çizilmez. Bu eşitlik bozulursa
    // yükseltme noktası pad'in bıraktığı yerden kayar — o yüzden burada tutuluyor.
    expect(mesafe(LAYOUT.padPos['lavabo'], LAVABO.spot)).toBeLessThan(0.01);
  });
});

describe('C2 · aktif adımın hedefi bir işaret ankrajına denk gelir', () => {
  // `questFocusPos` bandı/kamerayı/oku besliyor; işaretler ayrı sabitlerden çizilseydi aktif işaret
  // sessizce hiç yanmazdı. Bu bekçi ikisinin AYNI sayıdan okuduğunu tutar.
  const anchors = allAnchors();
  const tableLevels = LAYOUT.tables.map(() => 0);
  const tables = LAYOUT.tables.length;
  const ISARETLI = ['pad', 'stationLevel', 'lavaboLevel', 'tableLevel', 'tablesAtLevel'];
  const hedefli = C.quests.filter((q) => ISARETLI.includes(q.target.type));

  it('işaretli hedefi olan görev var (bekçi boşa dönmesin)', () => {
    expect(hedefli.length).toBeGreaterThan(10);
  });

  it('her işaretli görev hedefi TAM BİR ankraja oturur', () => {
    const sapan: string[] = [];
    for (const q of hedefli) {
      for (let areasOpen = 1; areasOpen <= MAX_AREAS; areasOpen++) {
        const pos = questFocusPos(q.target, tableLevels, tables, areasOpen, q.area ?? 0);
        if (!pos) {
          sapan.push(`${q.target.type}: hedef yok`);
          continue;
        }
        const step: ActiveStep = { has: true, x: pos[0], z: pos[2] };
        const n = anchors.filter((b) => markerTier(b.pos, step, at(999, 999)) === 'aktif').length;
        if (n !== 1) sapan.push(`${q.target.type} · alan ${areasOpen} · [${pos.join(',')}] → ${n} ankraj`);
      }
    }
    expect(sapan).toEqual([]);
  });
});

describe('C2 · yakınlık bütçesi', () => {
  // Ölçülen: aynı anda çizilen (pad dışı) işaretlerden en çok 3'ü bir noktanın 3,2 br'sinde;
  // üstüne en fazla 1 pad → 4. Ölçümdeki 16'ya karşı %75 düşüş, ve bunların en fazla BİRİ aktif.
  const BUTCE = 4;

  it(`bir işaretin üstünde dururken en çok ${BUTCE} işaret konuşur`, () => {
    let enCok = 0;
    let nerede = '';
    for (let areasOpen = 1; areasOpen <= MAX_AREAS; areasOpen++) {
      const set = coDrawable(areasOpen);
      const padlar = C.pads.map((p) => LAYOUT.padPos[p.id]).filter(Boolean);
      for (const q of [...set.map((s) => s.pos), ...padlar]) {
        // pad dışı konuşanlar + o noktada görünebilecek EN FAZLA bir pad
        const n = set.filter((s) => mesafe(s.pos, q) <= SPEAK_RADIUS).length
          + (padlar.some((p) => mesafe(p, q) <= SPEAK_RADIUS) ? 1 : 0);
        if (n > enCok) {
          enCok = n;
          nerede = `alan ${areasOpen} @ ${q[0].toFixed(1)},${q[2].toFixed(1)}`;
        }
      }
    }
    expect(enCok, `en kalabalık nokta: ${nerede}`).toBeLessThanOrEqual(BUTCE);
  });

  it('masa noktaları arası aralık eşiğin altında kalmasın (komşu ağı zincirlemesin)', () => {
    let enKisa = Infinity;
    LAYOUT.tables.forEach((a, i) =>
      LAYOUT.tables.forEach((b, j) => {
        if (i < j) enKisa = Math.min(enKisa, mesafe(a.upgradeSpot, b.upgradeSpot));
      }),
    );
    // 3,20 = sütun aralığı. Eşik (3,2) bunun ALTINA inerse tek noktada durunca komşunun komşusu da
    // konuşmaya başlar; bütçe testi de bunu yakalar ama sebebi burada okunur.
    expect(enKisa).toBeCloseTo(3.2, 2);
  });
});
