import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { KARE_TAVANI_FPS, kareZamanlayici } from '../../game/kareTavani';
import { perf } from '../../game/perf';

/**
 * DEV sayacı: **her tuvalin** ilerlettiği kare buraya eklenir (duman testi bunu okur).
 * İki şeyi aynı anda kanıtlar: ① sürücü gerçekten dönüyor (0 kalırsa sahne donmuştur)
 * ② tavan tutuyor (saniyede tuval başına ~60'ı aşmaz). 3D sahne gözle doğrulanamadığı için
 * (CLAUDE.md) "önizleme boş çıktı" gibi sessiz bir gerileme ancak böyle yakalanır.
 */
function sayacArtir() {
  const w = window as unknown as { __kareSayaci?: number };
  w.__kareSayaci = (w.__kareSayaci ?? 0) + 1;
}

/**
 * KARE SÜRÜCÜSÜ (K-A · T4 · D-136) — `frameloop="never"` + elle ilerletme.
 *
 * r3f'in kendi döngüsü (`always`) her rAF'te çizer: 120 Hz ekranda 120 kare. Ölçüm erken oyunda
 * **116,7 fps** gördü (`docs/perf-raporu-t4.md` §E) — oyuncunun göremediği her kare pil demek.
 * Tavan, Canvas'ın döngüsü kapatılıp çizim buradan sürülerek konur; zamanlama kararı
 * `game/kareTavani.ts`te saf ve test edilebilir durur (`tests/kare-tavani-t4.test.ts`).
 *
 * **Her `<Canvas>`a takılır, yalnız sahneye değil.** Panellerdeki önizlemeler (karakter, tema,
 * diyorama) ayrı birer `<Canvas>`tır ve tavansız bırakılsalardı panel açıkken aynı şeyi yaparlardı:
 * neredeyse durağan bir kareyi saniyede 120 kez çizmek. Kusur bir tane, o yüzden çözüm de bir tane.
 *
 * `advance(saniye)` — `never` kipinde r3f delta'yı VERİLEN zaman damgasından türetir
 * (`update()`: `delta = timestamp - clock.elapsedTime`), o yüzden damga saniye cinsinden
 * **biriken oyun saatidir**, `performance.now()` değil.
 */
export function KareTavani({ fps = KARE_TAVANI_FPS, olc = false }: { fps?: number; olc?: boolean }) {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const dene = kareZamanlayici(fps);
    let raf = requestAnimationFrame(function dongu(simdi: number) {
      raf = requestAnimationFrame(dongu);
      const gecen = dene(simdi);
      if (gecen === null) return;
      if (import.meta.env.DEV) sayacArtir();
      if (!olc) {
        advance(gecen);
        return;
      }
      // Karenin İŞİ ayrı ölçülür: tavanlı kipte kareler-arası süre artık maliyeti göstermez
      // (60 fps'te 16,7 ms, sahne ne kadar ucuz olursa olsun). Yalnız ANA sahne yazar —
      // önizleme tuvalleri de yazsaydı `perf.isMs` iki farklı sahnenin karışımı olurdu.
      const basla = performance.now();
      advance(gecen);
      perf.isMs = performance.now() - basla;
    });
    return () => cancelAnimationFrame(raf);
  }, [advance, fps, olc]);
  return null;
}
