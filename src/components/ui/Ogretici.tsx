import type { CSSProperties } from 'react';
import { ONBOARDING, type OgreticiAdim } from '../../config/onboarding';
import type { OgreticiMetinAnahtari } from '../../game/onboarding';
import { HandIcon } from './icons';
import { t } from '../../i18n';

/** Adımların ekrandaki sırası (ilerleme noktaları). `yuru` görev hattında değil, ilk görevin içinde. */
const SIRA: readonly OgreticiAdim[] = ['yuru', ...ONBOARDING.gorevler.map((g) => g.adim)];

/**
 * E5 — İLK DAKİKALARIN SATIRI + SÜRÜKLEYEN EL.
 *
 * Ekranı KESMEZ: karartma yok, dokunma yalnız "Atla"ya gider; gerisi alttaki joystick katmanına
 * geçer (`pointer-events: none`). Metin bandın üstünde tek satır — bant NE, bu NASIL/NEREDE.
 * El yalnız ilk adımda: joystick parmağın bastığı yerde doğar, yani ekranda onu gösteren hiçbir
 * şey yoktur; el bas → sürükle → bırak hareketini döngüde oynatır. Oyuncu gerçekten yürüyünce
 * (adım oyun durumundan türer) el kaybolur — süre sayılmaz.
 */
export function Ogretici({
  adim,
  metin,
  onAtla,
}: {
  adim: OgreticiAdim;
  metin: OgreticiMetinAnahtari;
  onAtla: () => void;
}) {
  const sira = SIRA.indexOf(adim);
  return (
    <div
      className="ogretici"
      data-testid="ogretici"
      data-adim={adim}
      style={{ '--el-tur': `${ONBOARDING.elTurSn}s` } as CSSProperties}
    >
      {adim === 'yuru' && (
        <div className="ogretici-el-alan" data-testid="ogretici-el" aria-hidden>
          <span className="ogretici-taban" />
          <span className="ogretici-dugme" />
          <span className="ogretici-el">
            <HandIcon size={52} />
          </span>
        </div>
      )}
      <div className="ogretici-satir" key={metin}>
        <span className="ogretici-noktalar" aria-label={t('Adım {1}/{2}', sira + 1, SIRA.length)}>
          {SIRA.map((a, i) => (
            <i key={a} className={i < sira ? 'bitti' : i === sira ? 'simdi' : undefined} />
          ))}
        </span>
        <span className="ogretici-metin" data-testid="ogretici-metin">
          {t(ONBOARDING.metin[metin])}
        </span>
        <button className="ogretici-atla" data-testid="ogretici-atla" onClick={onAtla}>
          {t('Atla')}
        </button>
      </div>
    </div>
  );
}
