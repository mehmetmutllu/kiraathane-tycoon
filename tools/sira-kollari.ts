/**
 * sira-kollari.ts — H2 "masa yükseltme SIRASI" varyant kolları (D-084 varyant kapısı).
 *
 * Kod DEĞİŞTİRİLMEDEN ölçülebilsin diye kollar buraya yazılır; `simulate.ts`'in
 * `masaSirasiAyarla` kancası bunları takar. `rules.ts` ve `economy.config.ts`'e
 * bu turda DOKUNULMAZ — karar paketi çıkana kadar hiçbir kol kalıcı değildir.
 *
 * Her kol İKİ parçadan kurulur, çünkü soru ikisini birden soruyor:
 *
 *   KAPI (`isaretler`)  — o an noktası CANLI olan masaların kümesi. Ekranda çizilen
 *                         zemin işareti budur; oyuncunun dikkat bütçesini bu belirler.
 *   POLİTİKA (`tercih`) — oyuncu o kümenin içinden hangisini önce alır. Kapı serbestse
 *                         politika oyuncunun SEÇİMİDİR (yani kendine verebileceği ceza);
 *                         kapı darsa politikanın seçecek bir şeyi kalmaz.
 *
 * Bu ayrım turun çekirdeği: "serbest sıra kötü mü?" sorusunun cevabı, kapıyı değiştirmenin
 * etkisiyle oyuncunun kendi seçiminin etkisini AYIRMADAN verilemez. T ile P arasındaki
 * fark oyuncunun kendine yaptığıdır; T ile B arasındaki fark kapının oyuncuya yaptığıdır.
 */
import type { SiraDurum, MasaSirasi } from './simulate.ts';

export interface SiraKol {
  kod: string;
  ad: string;
  /** Kapının bir cümlelik tarifi (rapor tablosunun kolonu). */
  kapi: string;
  /** Politikanın bir cümlelik tarifi. */
  oyuncu: string;
  /** O an noktası canlı masaların indeksleri (ekranda çizilen işaret kümesi). */
  isaretler: (d: SiraDurum) => number[];
  /** Tercih sırası — sim listenin İLK öğesini hedefler, parası yetene kadar biriktirir. */
  tercih: (d: SiraDurum, canli: number[], rnd: () => number) => number[];
}

/* ─────────────────────────── KAPILAR ─────────────────────────── */

/** BUGÜNKÜ KURAL: alan kapısı açık + tavan altı olan HER masa canlı. Masanın kendi
 *  seviyesine bakılmaz, komşusunun seviyesine hiç bakılmaz. */
const serbestKapi = (d: SiraDurum): number[] => {
  const out: number[] = [];
  for (let i = 0; i < d.seviyeler.length; i++) {
    if (d.kapiAcik[i] && d.seviyeler[i] < d.tavan) out.push(i);
  }
  return out;
};

/** A — TEK HEDEF: aynı anda yalnız BİR masanın noktası canlı. Başlanan masa tavana
 *  varmadan sıradaki açılmaz. Yarım bırakılmış masa varsa hedef odur ("başladığını bitir");
 *  yoksa en küçük indeksli el değmemiş masa. */
const tekHedefKapi = (d: SiraDurum): number[] => {
  const uygun = serbestKapi(d);
  const yarim = uygun.find((i) => d.seviyeler[i] > 0);
  if (yarim != null) return [yarim];
  return uygun.length ? [uygun[0]] : [];
};

/** B — KUŞAK: açık masaların EN DÜŞÜK seviyesi kuşaktır; yalnız o seviyedekiler canlı.
 *  Hepsi L'ye varmadan hiçbiri L+1'e çıkamaz. Yeni alan açılınca kuşak L0'a düşer →
 *  eski salonun masaları yeni salon yetişene kadar donar (kuralın dürüst okunuşu). */
const kusakKapi = (d: SiraDurum): number[] => {
  const uygun = serbestKapi(d);
  if (!uygun.length) return [];
  let en = Infinity;
  for (const i of uygun) if (d.seviyeler[i] < en) en = d.seviyeler[i];
  return uygun.filter((i) => d.seviyeler[i] === en);
};

/* ─────────────────────────── POLİTİKALAR ─────────────────────────── */

const ucuz = (d: SiraDurum, canli: number[]): number[] =>
  [...canli].sort((a, b) => d.maliyet(a) - d.maliyet(b) || a - b);

const pahali = (d: SiraDurum, canli: number[]): number[] =>
  [...canli].sort((a, b) => d.maliyet(b) - d.maliyet(a) || a - b);

/** DERİN: bir masayı tavana çıkarmadan ötekine geçme. Serbest kapıda bu oyuncunun
 *  SEÇİMİDİR — A kolunun kapısı bunu zorunlu kılar, burada oyuncu gönüllü yapar. */
const derin = (d: SiraDurum, canli: number[]): number[] => {
  const yarim = [...canli].filter((i) => d.seviyeler[i] > 0).sort((a, b) => a - b);
  const bos = [...canli].filter((i) => d.seviyeler[i] === 0).sort((a, b) => a - b);
  return [...yarim, ...bos];
};

/** RASTGELE: tohumlu karıştırma (Fisher-Yates). "Plansız oynayan" oyuncunun vekili. */
const rastgele = (_d: SiraDurum, canli: number[], rnd: () => number): number[] => {
  const a = [...canli];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ─────────────────────────── KOLLAR ─────────────────────────── */

export const SIRA_KOLLARI: readonly SiraKol[] = [
  {
    kod: 'T', ad: 'TABAN · serbest kapı + en ucuz',
    kapi: 'serbest (bugünkü kural)', oyuncu: 'en ucuzu al',
    isaretler: serbestKapi, tercih: ucuz,
  },
  {
    kod: 'D', ad: 'serbest kapı + DERİN oyuncu',
    kapi: 'serbest (bugünkü kural)', oyuncu: 'bir masayı tavana çıkar, sonra ötekine geç',
    isaretler: serbestKapi, tercih: derin,
  },
  {
    kod: 'P', ad: 'serbest kapı + EN PAHALI oyuncu',
    kapi: 'serbest (bugünkü kural)', oyuncu: 'hep en pahalı yükseltmeyi al',
    isaretler: serbestKapi, tercih: pahali,
  },
  {
    kod: 'R', ad: 'serbest kapı + RASTGELE oyuncu',
    kapi: 'serbest (bugünkü kural)', oyuncu: 'canlı noktalardan rastgele birini al',
    isaretler: serbestKapi, tercih: rastgele,
  },
  {
    kod: 'A', ad: 'TEK HEDEF kapısı',
    kapi: 'aynı anda TEK masa canlı; tavana varmadan sonraki açılmaz', oyuncu: '(kapı tek seçenek bırakır)',
    isaretler: tekHedefKapi, tercih: ucuz,
  },
  {
    kod: 'B', ad: 'KUŞAK kapısı',
    kapi: 'yalnız EN DÜŞÜK seviyedeki masalar canlı; hepsi L olmadan L+1 yok', oyuncu: 'kuşak içinde en ucuzu al',
    isaretler: kusakKapi, tercih: ucuz,
  },
];

export const kolBul = (kod: string): SiraKol => {
  const k = SIRA_KOLLARI.find((x) => x.kod === kod);
  if (!k) throw new Error(`bilinmeyen sıra kolu: ${kod}`);
  return k;
};

/** Tohumlu RNG — rastgele kol koşu başına sıfırlanır (aynı tohum = aynı ölçüm). */
export function tohum(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Kolu `simulate.ts`'in kancasına takılabilir FABRİKA'ya çevirir (koşu başına taze RNG). */
export const fabrika = (kol: SiraKol, seed = 1234): (() => MasaSirasi) => () => {
  const rnd = tohum(seed);
  return (d: SiraDurum) => kol.tercih(d, kol.isaretler(d), rnd);
};
