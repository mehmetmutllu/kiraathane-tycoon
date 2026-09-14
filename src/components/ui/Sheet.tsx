import type { ReactNode } from 'react';
import { useGame } from '../../game/store';
import { fmt } from '../../game/decimal';
import { BackIcon, CoinIcon, GemIcon } from './icons';

/**
 * K3 — TEK EKRAN KABUĞU (D-106, S12). Tüm paneller bunu paylaşır.
 *
 * NEDEN ALT SAYFA KALKTI: S10/S12 ölçümü "ekranlar tutarsız" (G-17) şikâyetinin kaynağını
 * saydı — kabuk TİPİ zaten tutarlıydı (5/5 alt sayfa), tutarsız olan BOYdu: beş ekran dört
 * farklı yükseklikte açılıyordu (675 · 675 · 473 · 538 · 431 px) ve panelin üst kenarı her
 * sekmede başka yere zıplıyordu. Tam ekranda yükseklik bir SEÇİM olmaktan çıkar: hepsi %100.
 *
 * ÜÇ BÖLGE, sırası sabit: sol üstte GERİ · ortada BAŞLIK · sağ üstte CÜZDAN. Cüzdan burada,
 * çünkü tam ekran sahneyi örtüyor ve üst şeridin parası görünmez oluyor — satın alma ekranında
 * paranı göremezsen ekran yarım kalır.
 *
 * T2 (kullanıcı kararı 2026-09-14): ikincil metinler kartsız gövde zemininde durmaz. Gövdenin
 * kendisi `--kart` yüzeyine oturur; `--tx2` orada 3,84 değil 4,57 verir (WCAG AA ≥ 4,5).
 */
export function Sheet({
  title,
  testid,
  onClose,
  children,
}: {
  title: string;
  testid: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const wallet = useGame((s) => s.wallet);
  const diamonds = useGame((s) => s.diamonds);
  return (
    <div className="modal-backdrop screen-backdrop" data-testid={testid}>
      <div className="modal-card screen">
        <div className="screen-top">
          <button className="sheet-back" onClick={onClose} aria-label="Geri">
            <BackIcon size={20} />
          </button>
          <span className="screen-title">{title}</span>
          <span className="screen-purse">
            <span className="screen-cur">
              <CoinIcon size={18} />
              <b>{fmt(wallet)}</b>
            </span>
            <span className="screen-cur">
              <GemIcon size={16} />
              <b>{fmt(diamonds)}</b>
            </span>
          </span>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
