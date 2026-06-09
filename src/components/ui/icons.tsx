/**
 * HUD ikon seti — elle çizilmiş SVG (UI redesign 2026-06-10, kullanıcı onayı).
 * Emoji/CSS-circle yerine gerçek ikonografi; gradyan + parlama ile "şeker" tycoon stili
 * (referans: My Perfect Hotel / Burger Please ikon dili). Hepsi vektör → her DPI'da net.
 */
import type { QuestTarget } from '../../config/economy.config';

/** Altın para destesi (yumuşak para birimi — ₺ sembolü kullanılmaz, jenerik pul). */
export function CoinIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="ic-coin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe082" />
          <stop offset="1" stopColor="#f9a825" />
        </linearGradient>
      </defs>
      <ellipse cx="22" cy="35" rx="16" ry="7.5" fill="#b26a00" />
      <ellipse cx="22" cy="32" rx="16" ry="7.5" fill="url(#ic-coin)" stroke="#8d5b00" strokeWidth="1.6" />
      <ellipse cx="26" cy="23" rx="16" ry="7.5" fill="#b26a00" />
      <ellipse cx="26" cy="20" rx="16" ry="7.5" fill="url(#ic-coin)" stroke="#8d5b00" strokeWidth="1.6" />
      <ellipse cx="26" cy="18.6" rx="9.5" ry="3.8" fill="rgba(255,255,255,.5)" />
    </svg>
  );
}

/** Mavi elmas (sert para birimi). */
export function GemIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="ic-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#81d4fa" />
          <stop offset="1" stopColor="#0277bd" />
        </linearGradient>
      </defs>
      <path d="M14 10h20l9 11-19 19L5 21l9-11z" fill="url(#ic-gem)" stroke="#01579b" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 10l10 11L34 10M5 21h38M24 40l-7-19M24 40l7-19" stroke="rgba(255,255,255,.75)" strokeWidth="1.5" fill="none" />
      <path d="M14 10h9l-7 9-9 2 7-11z" fill="rgba(255,255,255,.45)" />
    </svg>
  );
}

/** Altın yıldız rozeti — içine seviye rakamı oturur (CSS .lvl-num). */
export function StarBadge({ size = 54 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="ic-star" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd54f" />
          <stop offset="1" stopColor="#ff9800" />
        </linearGradient>
      </defs>
      <path
        d="M32 3l8.6 17.4 19.2 2.8-13.9 13.5 3.3 19.1L32 46.8 14.8 55.8l3.3-19.1L4.2 23.2l19.2-2.8L32 3z"
        fill="url(#ic-star)"
        stroke="#fff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M32 9.5l6.2 12.6 13.9 2-10 9.8 2.4 13.8L32 41.2" fill="rgba(255,255,255,.3)" />
    </svg>
  );
}

/** Ayarlar dişlisi (beyaz). */
export function GearIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#fff"
        d="M19.4 13c.04-.32.1-.65.1-1s-.06-.68-.1-1l2.1-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.3 7.3 0 0 0-1.73-1l-.38-2.65A.5.5 0 0 0 13.93 2h-4a.5.5 0 0 0-.5.42l-.37 2.65c-.63.26-1.2.6-1.74 1l-2.48-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64L4.45 11c-.04.32-.07.65-.07 1s.03.68.07 1l-2.1 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.42.33.6.22l2.5-1c.53.42 1.1.76 1.73 1l.37 2.66c.04.24.25.41.5.41h4c.25 0 .46-.17.5-.41l.37-2.66c.63-.25 1.2-.59 1.74-1l2.48 1c.23.1.47 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64L19.4 13Zm-7.47 2.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
      />
    </svg>
  );
}

/** Posta/zarf (gelecekte gelen kutusu — MPH deseni). */
export function MailIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="#fff" />
      <path d="M3.5 6.5L12 13l8.5-6.5" stroke="#b07a2a" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Görev "fotoğrafı" ikonları (quest kartı solunda; hedef tipine göre) ---------- */

function TeaGlass() {
  // İnce belli Türk çay bardağı + kırmızı çay.
  return (
    <g>
      <path d="M17 12h14l-1.6 8.5c-.5 2.2-.6 3.5-.6 5 0 1.5.1 2.8.6 5L31 36H17l1.6-5.5c.5-2.2.6-3.5.6-5 0-1.5-.1-2.8-.6-5L17 12z" fill="#e3f2fd" fillOpacity="0.55" stroke="#90a4ae" strokeWidth="1.4" />
      <path d="M18.4 17h11.2l-1 5.5c-.4 2-.5 3.2-.5 4.5 0 1.3.1 2.5.5 4.5l.7 3.5H18.7l.7-3.5c.4-2 .5-3.2.5-4.5 0-1.3-.1-2.5-.5-4.5l-1-5.5z" fill="#c62828" />
      <ellipse cx="24" cy="17.6" rx="5.6" ry="1.6" fill="#ef5350" />
      <rect x="14.5" y="36" width="19" height="3.4" rx="1.7" fill="#eceff1" stroke="#90a4ae" strokeWidth="1.2" />
    </g>
  );
}

function CoinSmall() {
  return (
    <g>
      <ellipse cx="24" cy="30" rx="13" ry="6" fill="#b26a00" />
      <ellipse cx="24" cy="27" rx="13" ry="6" fill="#ffd54f" stroke="#8d5b00" strokeWidth="1.4" />
      <ellipse cx="24" cy="25.8" rx="7.5" ry="3" fill="rgba(255,255,255,.5)" />
    </g>
  );
}

function TableIcon() {
  return (
    <g>
      <ellipse cx="24" cy="18" rx="15" ry="6.5" fill="#8d6e63" stroke="#5d4037" strokeWidth="1.4" />
      <ellipse cx="24" cy="16.6" rx="15" ry="6.5" fill="#a1887f" stroke="#5d4037" strokeWidth="1.4" />
      <rect x="21.6" y="22" width="4.8" height="14" rx="2" fill="#6d4c41" />
      <rect x="12" y="33.5" width="24" height="3.6" rx="1.8" fill="#5d4037" />
    </g>
  );
}

function PersonIcon({ color = '#43a047', dark = '#2e7d32' }: { color?: string; dark?: string }) {
  return (
    <g>
      <circle cx="24" cy="14.5" r="7" fill="#ffcc80" stroke="#e0a96d" strokeWidth="1.2" />
      <path d="M11 40c0-8 5.8-13 13-13s13 5 13 13v1H11v-1z" fill={color} stroke={dark} strokeWidth="1.4" />
    </g>
  );
}

function WashIcon() {
  return (
    <g>
      <path d="M10 22h28v6a10 10 0 0 1-10 10h-8a10 10 0 0 1-10-10v-6z" fill="#78909c" stroke="#546e7a" strokeWidth="1.4" />
      <rect x="13" y="19" width="22" height="4" rx="2" fill="#90a4ae" />
      <circle cx="18" cy="13" r="3.2" fill="#b3e5fc" stroke="#81d4fa" strokeWidth="1.2" />
      <circle cx="26" cy="9.5" r="2.4" fill="#b3e5fc" stroke="#81d4fa" strokeWidth="1.2" />
      <circle cx="31" cy="14.5" r="2.8" fill="#b3e5fc" stroke="#81d4fa" strokeWidth="1.2" />
    </g>
  );
}

function UpArrowOverlay() {
  return (
    <g>
      <path d="M37 6l6 7h-3.6v6h-4.8v-6H31l6-7z" fill="#aed581" stroke="#558b2f" strokeWidth="1.3" strokeLinejoin="round" />
    </g>
  );
}

/**
 * Görev hedef tipine göre "fotoğraf" (quest kartının solundaki rozet).
 * Arka plan rengi tipe göre değişir → görevler birbirinden tek bakışta ayrılır.
 */
export function QuestPhoto({ target, size = 44 }: { target: QuestTarget; size?: number }) {
  let bg = '#8d6e63';
  let inner: React.ReactNode = <TeaGlass />;
  let up = false;
  switch (target.type) {
    case 'pickupTea':
    case 'serveTea':
      bg = '#bf6b3f';
      inner = <TeaGlass />;
      break;
    case 'collectCoin':
      bg = '#8a7430';
      inner = <CoinSmall />;
      break;
    case 'washDish':
      bg = '#4a6572';
      inner = <WashIcon />;
      break;
    case 'pad':
      if (target.id === 'waiter') {
        bg = '#33691e';
        inner = <PersonIcon />;
      } else if (target.id === 'dishwasher') {
        bg = '#1565c0';
        inner = <PersonIcon color="#42a5f5" dark="#1976d2" />;
      } else {
        bg = '#6d4c41';
        inner = <TableIcon />;
      }
      break;
    case 'stationLevel':
      bg = '#bf6b3f';
      inner = <TeaGlass />;
      up = true;
      break;
    case 'waiterLevel':
      bg = '#33691e';
      inner = <PersonIcon />;
      up = true;
      break;
    case 'tableLevel':
      bg = '#6d4c41';
      inner = <TableIcon />;
      up = true;
      break;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect x="1.5" y="1.5" width="45" height="45" rx="11" fill={bg} stroke="rgba(255,255,255,.85)" strokeWidth="3" />
      {inner}
      {up && <UpArrowOverlay />}
    </svg>
  );
}
