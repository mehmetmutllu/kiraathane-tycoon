import { KAFE_ADI_MAX, KAFE_ADI_VARSAYILAN } from '../../game/kafeAdi';
import { t } from '../../i18n';

/**
 * KAFE ADI KUTUSU (F4c-3 · D-156). İki kip:
 *  - `ilk`: hiç sorulmadıysa açılışta bir kez (ekran kanalı `kafe-adi`). Kapatılamaz; "Tamam" kutudaki
 *    adı, boşsa varsayılanı kaydeder. Kutu hazır adla gelir — oyuncu tek dokunuşla geçebilir.
 *  - `duzenle`: Ayarlar'dan; "Vazgeç" de var.
 * Taslak HUD'da tutulur: Android geri tuşu da o anki taslakla "Tamam" der.
 */
export function KafeAdiKutusu({
  kip,
  taslak,
  onTaslak,
  onKaydet,
  onVazgec,
}: {
  kip: 'ilk' | 'duzenle';
  taslak: string;
  onTaslak: (v: string) => void;
  onKaydet: () => void;
  onVazgec?: () => void;
}) {
  return (
    <div className="modal-backdrop kafe-adi-perde" data-testid="kafe-adi" onClick={kip === 'duzenle' ? onVazgec : undefined}>
      <form
        className="modal-card reward-card kafe-adi-kart"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onKaydet();
        }}
      >
        <div className="reward-title">{kip === 'ilk' ? t('Kafene bir ad ver') : t('Kafenin adı')}</div>
        <p className="onay-metin">
          {kip === 'ilk' ? t('Kapının üstündeki tabelada bu yazacak. Sonra Ayarlar\'dan değiştirebilirsin.') : t('Kapının üstündeki tabelada yazar.')}
        </p>
        <input
          id="kafe-adi-girdi"
          className="kafe-adi-girdi"
          data-testid="kafe-adi-girdi"
          type="text"
          value={taslak}
          maxLength={KAFE_ADI_MAX}
          placeholder={KAFE_ADI_VARSAYILAN}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label={t('Kafenin adı')}
          onChange={(e) => onTaslak(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <div className="kafe-adi-sayac">
          {Array.from(taslak).length}/{KAFE_ADI_MAX}
        </div>
        <button type="submit" className="sheet-cta" data-testid="kafe-adi-tamam">
          {t('Tamam')}
        </button>
        {kip === 'duzenle' && (
          <button type="button" className="sheet-cta ad" data-testid="kafe-adi-vazgec" onClick={onVazgec}>
            {t('Vazgeç')}
          </button>
        )}
      </form>
    </div>
  );
}
