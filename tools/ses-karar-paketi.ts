/**
 * ses-karar-paketi.ts — S9 KARAR PANOSUNUN SES YÜKÜNÜ üretir (`docs/pano/ses-karar/sesler.js`).
 *
 * NEDEN: ses kararı metinle sorulamaz. `feedback_show_dont_ask` estetik çatalda kolların
 * ANLATILMASINI değil GÖSTERİLMESİNİ istiyor; sesin karşılığı DUYURULMAK. Kullanıcının bu turu
 * açan cümlesi de zaten bir dinleme cümlesiydi (*"panodaki seslere çok ısınmadım"*) — yani ilk
 * pano vardı ama kol yerine tek bir hâl duyuruyordu.
 *
 * DUYULAN = ÖLÇÜLEN: sentez tamponu `audioSynth.seslendir()`in ta kendisi, dosya tamponu da
 * oyunun kendi çözücüsünden geçmiş PCM (`indirilen/_pcm/*.f32`, Chromium `decodeAudioData`).
 * Seçilen dokuzlu `ses-secim.ts`ten gelir — raporla aynı kaynak, kopya yok.
 *
 * SEVİYE BİLEREK HAM BIRAKILIR: dosyalar sentezden 16,6 dB yüksek (rapor B4) ve bu fark bir
 * A/B'yi tek başına kazanır — "daha yüksek" kulakta "daha iyi" diye okunur. Kazanç bu yüzden
 * burada değil PANODA, çalma anında uygulanır: pano iki kip sunar (eşit seviye / oyun seviyesi)
 * ve ikisinin kazancını da tamponların kendi RMS'inden hesaplar. Böylece ham veri tek kalır.
 *
 * Çalıştır: npx tsx tools/ses-karar-paketi.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { SES_KATALOG, type SesId } from '../src/game/audio.ts';
import { ORNEKLEME, seslendir } from '../src/game/audioSynth.ts';
import { SURE_WEBER, YARIM_SES, etkinSure, izParmak, izParmakPcm, mesafe, transpoze } from './ses-metrik.ts';
import { ortamYatagi, seriKarisim, wav } from './ses-taslak.ts';
import { IDLER, secilenDokuzlu } from './ses-secim.ts';

const HEDEF = 'docs/pano/ses-karar';
const b64 = (buf: Buffer): string => 'data:audio/wav;base64,' + buf.toString('base64');

mkdirSync(HEDEF, { recursive: true });

const secim = secilenDokuzlu();

// --- 1) Dokuz olayin SENTEZ ve DOSYA hali ---------------------------------
const sentez: Record<string, string> = {};
const dosya: Record<string, string> = {};
const kunye: Record<string, { ad: string; paket: string; kb: number; aralik: number; etkin: number }> = {};
for (const id of IDLER) {
  sentez[id] = b64(wav(seslendir(SES_KATALOG[id].katmanlar)));
  const S = secim.get(id);
  if (!S) continue;
  dosya[id] = b64(wav(S.pcm));
  kunye[id] = { ad: S.ad, paket: S.paket, kb: +S.kb.toFixed(1), aralik: S.aralik, etkin: +S.etkin.toFixed(3) };
}

// --- 2) I kolu: bes toplamalik seri, uc basamakla -------------------------
// Sentez tarafinda basamak FREKANS carpanidir (sure degismez); dosya tarafinda `playbackRate`
// olur ve sureyi de kisaltir — panoda dosya serisi bu yuzden tarayicida, playbackRate ile kurulur.
const seri: Record<string, string> = {};
const seriHamTepe: Record<string, number> = {};
for (const [kod, basamak, tavan] of [['I1', 0, 0], ['I2', 1, 5], ['I3', 2, 8]] as const) {
  const { karisim, hamTepe } = seriKarisim(SES_KATALOG.coin.katmanlar, basamak, tavan);
  seri[kod] = b64(wav(karisim));
  seriHamTepe[kod] = +hamTepe.toFixed(3);
}

// --- 3) O1 kolu: ortam yatagi taslagi -------------------------------------
// Tavan rapor B10'dan: dokuz sesin HEPSINI +12 dB ustte tutmak icin yatak RMS <= 0,0095.
// Birim yatak RMS 0,0925 -> kazanc 0,0095/0,0925 = 0,103.
const YATAK_TAVAN_ORAN = 0.0095 / 0.0925;
const yatakSn = 6;
const yatak = ortamYatagi(yatakSn, YATAK_TAVAN_ORAN);
// Dongu dikisi duyulmasin: son 0,25 sn basa capraz sonumle karisir.
const gecis = Math.round(0.25 * ORNEKLEME);
for (let i = 0; i < gecis; i++) {
  const t = i / gecis;
  const j = yatak.length - gecis + i;
  yatak[i] = yatak[i] * t + yatak[j] * (1 - t);
}
const ortam = b64(wav(yatak.subarray(0, yatak.length - gecis)));

// --- 4) SAYILAR: panoya ELLE YAZILMAZ, ayni metrikten turetilir --------------
// Panoda GOSTERILEN sayi ile raporda OLCULEN sayi ayrisamasin diye (feedback_single_source_of_truth).
// Denetimi `tests/ses-karar-paketi.test.ts` yapar: burada uretilen deger `docs/olcum-ses-karma.txt`
// icindeki satirla birebir tutmali.
const sentezIz = new Map<SesId, number[][]>();
const sentezEtkin = new Map<SesId, number>();
for (const id of IDLER) {
  const p = seslendir(SES_KATALOG[id].katmanlar);
  sentezIz.set(id, izParmakPcm(p));
  sentezEtkin.set(id, etkinSure(p));
}
const MUTLAK_TABAN = IDLER.reduce((a, id) =>
  a + mesafe(izParmak(SES_KATALOG[id].katmanlar), izParmak(transpoze(SES_KATALOG[id].katmanlar, YARIM_SES))), 0) / IDLER.length;

const capraz = IDLER.map((a) => IDLER.map((b) => +mesafe(secim.get(a)!.iz, sentezIz.get(b)!).toFixed(2)));

const BOLUSUM: Record<string, SesId[]> = {
  K1: [],
  K2: [...IDLER],
  K3: ['coin', 'pour', 'serve'],
  K4: ['coin'],
  K5: ['purchase', 'padFill', 'quest', 'level', 'master', 'reward'],
};
const kollar = Object.entries(BOLUSUM).map(([kod, dosyadan]) => {
  const küme = new Set(dosyadan);
  const iz = (id: SesId): number[][] => (küme.has(id) ? secim.get(id)!.iz : sentezIz.get(id)!);
  const etkin = (id: SesId): number => (küme.has(id) ? secim.get(id)!.etkin : sentezEtkin.get(id)!);
  let karisir = 0;
  let enYakin = Infinity;
  let enYakinAd = '';
  const minler: number[] = [];
  for (let i = 0; i < IDLER.length; i++) {
    let benim = Infinity;
    for (let j = 0; j < IDLER.length; j++) {
      if (i === j) continue;
      const d = mesafe(iz(IDLER[i]), iz(IDLER[j]));
      if (d < benim) benim = d;
      if (j <= i) continue;
      const jnd = Math.abs(Math.log(etkin(IDLER[i]) / etkin(IDLER[j]))) / Math.log(SURE_WEBER);
      if (d < MUTLAK_TABAN && jnd < 2) karisir++;
      if (d < enYakin) {
        enYakin = d;
        enYakinAd = (küme.has(IDLER[i]) ? IDLER[i] + '·dosya' : IDLER[i] + '·sentez') + ' ↔ ' +
          (küme.has(IDLER[j]) ? IDLER[j] + '·dosya' : IDLER[j] + '·sentez');
      }
    }
    minler.push(benim);
  }
  return {
    kod,
    dosyadan,
    karisir,
    enYakin: +enYakin.toFixed(2),
    enYakinAd,
    ortMin: +(minler.reduce((a, b) => a + b, 0) / minler.length).toFixed(2),
    kb: +dosyadan.reduce((a, id) => a + secim.get(id)!.kb, 0).toFixed(1),
    tasan: dosyadan.filter((id) => secim.get(id)!.etkin > SES_KATALOG[id].aralik).map(String),
  };
});

// --- 5) Yaz ----------------------------------------------------------------
const paket = {
  uretim: new Date().toISOString().slice(0, 10),
  ornekleme: ORNEKLEME,
  sentez,
  dosya,
  kunye,
  seri,
  seriHamTepe,
  ortam,
  yatakTavanOran: +YATAK_TAVAN_ORAN.toFixed(4),
  aralik: Object.fromEntries(IDLER.map((id) => [id, SES_KATALOG[id].aralik])),
  idler: IDLER,
  taban: +MUTLAK_TABAN.toFixed(2),
  capraz,
  kollar,
};

const js = '/* URETILMIS DOSYA — elle duzenleme. Kaynak: tools/ses-karar-paketi.ts */\n' +
  'window.SESLER = ' + JSON.stringify(paket) + ';\n';
writeFileSync(`${HEDEF}/sesler.js`, js);

const mb = (js.length / 1024 / 1024).toFixed(2);
console.log(`yazildi: ${HEDEF}/sesler.js — ${mb} MB`);
console.log(`  sentez ${Object.keys(sentez).length} · dosya ${Object.keys(dosya).length} · seri ${Object.keys(seri).length} · ortam ${yatakSn - 0.25} sn`);
for (const id of IDLER) {
  const k = kunye[id];
  if (k) console.log(`  ${id.padEnd(9)} ${k.ad.padEnd(28)} ${String(k.kb).padStart(5)} KB  etkin ${k.etkin}s  aralik ${k.aralik}s`);
}
