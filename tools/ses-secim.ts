/**
 * ses-secim.ts — "HER OLAY İÇİN EN İYİ ADAY" kuralı, TEK YERDE.
 *
 * NEDEN AYRI DOSYA: kural `olcum-ses-s17.ts`te doğdu (§3b) ve S17-ek'te ikinci bir kopyası
 * çıktı; karar panosu üçüncüsünü isteyecekti. Üç kopya demek, panoda DİNLENEN dosyanın raporda
 * ÖLÇÜLEN dosyadan sessizce ayrışabilmesi demekti — `feedback_single_source_of_truth`un tam
 * olarak yasakladığı şey ve S17'nin zaten düzeltmeye çalıştığı desen.
 *
 * KURAL (aynen S17 §3b): "en iyi" estetik değil GEOMETRİK. Her olay için adaylar, DİĞER
 * olayların TÜM adaylarına olan EN KISA mesafesine göre sıralanır; en yükseği seçilir. Bir
 * adayın puanı, hangi adayın seçildiğine bağlı olmaz — yani sıra etkisi yoktur (açlıklı değil).
 *
 * `olcum-ses-s17.ts` KENDİ kopyasını korur ve bilerek: onun çıktısı (`docs/olcum-ses-s17.txt`)
 * commit'lenmiş ham veridir, dokunulmaz. Bu dosyanın doğruluğu ona karşı DAMGAYLA sınanır
 * (`olcum-ses-karma.ts`: "secim S17 ile ayni dosyalari buldu").
 */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { SES_KATALOG, type SesId } from '../src/game/audio.ts';
import { ORNEKLEME } from '../src/game/audioSynth.ts';
import { etkinSure, izParmakPcm, mesafe } from './ses-metrik.ts';
import { HAVUZ } from './ses-adaylari.ts';

const PCM_KLASOR = 'indirilen/_pcm';

/** `.f32` önbelleğinden PCM. `ses-coz.mjs` little-endian Float32 yazar. */
export function pcmOku(ad: string): Float32Array {
  const b = readFileSync(path.join(PCM_KLASOR, `${ad}.f32`));
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

export interface Secilen {
  /** Aday kimliği (PCM önbelleği ve pano bunu kullanır). */
  ad: string;
  /** Kaynak `.ogg` yolu — künye ve APK payı buradan. */
  yol: string;
  paket: string;
  kb: number;
  pcm: Float32Array;
  iz: number[][];
  /** Sessiz kuyruk düşülmüş gerçek süre (sn). */
  etkin: number;
  /** Olayın `aralik` kelepçesi (sn) — `audio.ts`ten. */
  aralik: number;
}

export const IDLER = Object.keys(SES_KATALOG) as SesId[];

/** Her olay için geometrik olarak en ayrık adayı seçer. Havuzu boş olan olay dönüşte YOKTUR. */
export function secilenDokuzlu(): Map<SesId, Secilen> {
  const havuz = new Map<string, { olay: SesId; yol: string; paket: string; pcm: Float32Array; iz: number[][] }>();
  for (const olay of IDLER) {
    for (const a of HAVUZ[olay] ?? []) {
      const pcm = pcmOku(a.ad);
      havuz.set(a.ad, { olay, yol: a.yol, paket: a.paket, pcm, iz: izParmakPcm(pcm) });
    }
  }

  const secim = new Map<SesId, Secilen>();
  for (const olay of IDLER) {
    const adaylar = (HAVUZ[olay] ?? []).map((a) => a.ad);
    if (adaylar.length === 0) continue;
    let enIyi = '';
    let enIyiPuan = -Infinity;
    for (const ad of adaylar) {
      const A = havuz.get(ad)!;
      let enKisa = Infinity;
      for (const B of havuz.values()) {
        if (B.olay === olay) continue;
        const d = mesafe(A.iz, B.iz);
        if (d < enKisa) enKisa = d;
      }
      if (enKisa > enIyiPuan) { enIyiPuan = enKisa; enIyi = ad; }
    }
    const S = havuz.get(enIyi)!;
    secim.set(olay, {
      ad: enIyi,
      yol: S.yol,
      paket: S.paket,
      kb: statSync(S.yol).size / 1024,
      pcm: S.pcm,
      iz: S.iz,
      etkin: etkinSure(S.pcm),
      aralik: SES_KATALOG[olay].aralik,
    });
  }
  return secim;
}

void ORNEKLEME;
