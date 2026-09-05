import type { ReactNode } from 'react';

/** Ortak alt sayfa kabuğu: başlık + kapat + kaydırılabilir gövde. Tüm paneller bunu paylaşır. */
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
  return (
    <div className="modal-backdrop sheet-backdrop" data-testid={testid} onClick={onClose}>
      <div className="modal-card sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title">{title}</span>
          <button className="sheet-x" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
