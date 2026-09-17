/**
 * HUD ikon seti — D-108 GRAMERİ (S10'da çizildi, S11a'da koda girdi).
 *
 * TEK GRAMER, beş kural:
 *   · 24×24 ızgara (görev "fotoğrafları" 48'lik kalır — onlar simge değil KÜÇÜK RESİM)
 *   · kontur 2,2 · hiçbir detay 2 birimden ince değil · düz dolgu (gradyan yok)
 *   · AKSAN HER İKONDA YALNIZ BİR YERDE — sarı nokta gözün nereye gideceğini söyler
 *
 * NEDEN YENİDEN ÇİZİLDİ: eskiler üç ayrı aileden geliyordu ve küçüldükçe dağılıyordu.
 * Çark en kötüsüydü — çok dişli bir yıldız 21 pikselde lekeye dönüyordu; dişleri artık elle
 * değil HESAPLANARAK duruyor (8 diş, dış yarıçap 10,4, iç 7,8).
 * Gerçek boyda sınandı ve üçü düzeltildi: Hedefler (üç ince halka 26 px'te birbirine giriyordu
 * → disk + koyu iç disk + aksan gözbebeği) · Para (orta çubuk 17 px'te yarık gibi okunuyordu
 * → iç elips) · Elmas (çapraz kesim çizgileri 16 px'te tırtık yapıyordu → yalnız kuşak çizgisi).
 *
 * Kenney UI Pack ikon KAYNAĞI olmadı: aynı ölçüm o paket için *"kalın koyu kontur yok"* demişti,
 * yani zaten bu gramere girmek için yeniden konturlanacaktı (D-108). Paket şekil kaynağı olarak
 * açık kalıyor — bu bir geri alma değil, SIRALAMA: önce gramer, sonra gerekirse paketten şekil.
 *
 * Renkler `var(--…)` ile index.css'ten okunur; burada ham renk YOKTUR (bekçi: tests/mor-dil).
 * `currentColor` = ikonun bulunduğu yerin metin rengi — aynı ikon aksan üstünde de okunur.
 */
import type { ReactNode } from 'react';
import type { QuestTarget } from '../../config/economy.config';
import { TOST_LEVEL } from '../../game/world';

const OT = 'var(--ot)';
const AC = 'var(--ac)';

/** D-108 kabuğu: 24 ızgara, `size` piksel. */
function Ic({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

/* ══════════════ PARA BİRİMLERİ ══════════════ */

/** Para — madenî pul. Ortadaki düz çubuk 17 px'te YARIK gibi okunuyordu, iç elipse döndü. */
export function CoinIcon({ size = 28 }: { size?: number }) {
  return (
    <Ic size={size}>
      <ellipse cx="12" cy="14.8" rx="8.6" ry="4.2" fill="var(--ac2)" stroke={OT} strokeWidth="1.9" />
      <ellipse cx="12" cy="10" rx="8.6" ry="4.5" fill="var(--para)" stroke={OT} strokeWidth="1.9" />
      <ellipse cx="12" cy="10" rx="4.1" ry="2" fill="none" stroke={OT} strokeWidth="1.8" />
    </Ic>
  );
}

/** Elmas — iki çapraz kesim çizgisi 16 px'te tırtık yapıyordu, yalnız KUŞAK çizgisi kaldı. */
export function GemIcon({ size = 28 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M7.4 3.4h9.2l4.2 5.4L12 20.6 3.2 8.8z" fill="var(--elmas)" stroke={OT} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M3.2 8.8h17.6" fill="none" stroke={OT} strokeWidth="1.9" />
    </Ic>
  );
}

/* ══════════════ ALT GEZİNME (geometri D-106'da kilitli; değişen yalnız DİL) ══════════════ */

/** Görevler — pano + onay. Aksan yalnız üstteki mandalda. */
export function QuestListIcon({ size = 26 }: { size?: number }) {
  return (
    <Ic size={size}>
      <rect x="4" y="3.6" width="16" height="17.2" rx="3" fill="currentColor" stroke={OT} strokeWidth="2.2" />
      <rect x="8.4" y="1.5" width="7.2" height="4.2" rx="1.9" fill={AC} stroke={OT} strokeWidth="2.2" />
      <path d="M7.9 12.5l2.5 2.5 4.1-4.5" fill="none" stroke={OT} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 18h8" stroke={OT} strokeWidth="2.4" strokeLinecap="round" />
    </Ic>
  );
}

/** Hedefler — disk + koyu iç disk + aksan gözbebeği (üç ince halka 26 px'te birbirine giriyordu). */
export function TargetIcon({ size = 26 }: { size?: number }) {
  return (
    <Ic size={size}>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke={OT} strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.8" fill={OT} />
      <circle cx="12" cy="12" r="2.1" fill={AC} />
    </Ic>
  );
}

/** Mağaza — tenteli vitrin. Aksan yalnız tentede. */
export function ShopAwningIcon({ size = 26 }: { size?: number }) {
  return (
    <Ic size={size}>
      <rect x="4" y="10.6" width="16" height="10.4" rx="2.4" fill="currentColor" stroke={OT} strokeWidth="2.2" />
      <path d="M2.6 10.6l2.1-5.5h14.6l2.1 5.5z" fill={AC} stroke={OT} strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="9.4" y="13.9" width="5.2" height="7.1" rx="1.3" fill={OT} />
    </Ic>
  );
}

/** Karakter — omuz + baş. Tek kütle; 21 px'te yüz detayı zaten okunmuyordu. */
export function CharIcon({ size = 22 }: { size?: number }) {
  return (
    <Ic size={size}>
      <circle cx="12" cy="7.8" r="4.6" fill="currentColor" stroke={OT} strokeWidth="2.2" />
      <path d="M4.2 21c0-4.3 3.5-6.9 7.8-6.9s7.8 2.6 7.8 6.9z" fill="currentColor" stroke={OT} strokeWidth="2.2" strokeLinejoin="round" />
    </Ic>
  );
}

/* ══════════════ KABUK DÜĞMELERİ ══════════════ */

/** Ayarlar — 8 diş, dış yarıçap 10,4 · iç 7,8. HESAPLANARAK çizildi: eskisi çok dişli bir
 *  yıldızdı ve 21 pikselde lekeye dönüyordu (kullanıcı: *"sağ en üstteki ayarlar kötü duruyor"*). */
export function GearIcon({ size = 22 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path
        d="M10.2 4.4 L10.3 1.7 L13.7 1.7 L13.8 4.4 L16.1 5.3 L18.0 3.5 L20.5 6.0 L18.7 7.9 L19.6 10.2 L22.3 10.3 L22.3 13.7 L19.6 13.8 L18.7 16.1 L20.5 18.0 L18.0 20.5 L16.1 18.7 L13.8 19.6 L13.7 22.3 L10.3 22.3 L10.2 19.6 L7.9 18.7 L6.0 20.5 L3.5 18.0 L5.3 16.1 L4.4 13.8 L1.7 13.7 L1.7 10.3 L4.4 10.2 L5.3 7.9 L3.5 6.0 L6.0 3.5 Z"
        fill="currentColor"
        stroke={OT}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.7" fill="var(--oyuk)" stroke={OT} strokeWidth="2.2" />
    </Ic>
  );
}

/** Geri (sol chevron) — tek kabuğun sol üst köşesi. */
export function BackIcon({ size = 20 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M14.8 4.8L7.4 12l7.4 7.2" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </Ic>
  );
}

/** Sağ ok (alt bant → "hedefe götür"). Geri okunun aynası — tek gramer. */
export function ChevronIcon({ size = 20 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M9.2 4.8l7.4 7.2-7.4 7.2" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </Ic>
  );
}

/** Kapat (✕) — B6: metin glifi değil çizim. Kontur 2,2 değil 3,0: iki çizgi 21 px'te ince kalıyordu. */
export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </Ic>
  );
}

/** Sıfırla (↺) — B6: metin glifi değil çizim. Ok başı dolu üçgen, 2 birimden ince değil. */
export function ResetIcon({ size = 18 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M19.4 12a7.4 7.4 0 1 1-2.6-5.6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M18.2 1.9v5.6h-5.6z" fill="currentColor" />
    </Ic>
  );
}

/** Asma kilit — B6: `🔒` emojisinin yerini alan çizim. Aksan yalnız GÖVDEDE, kol ikincil metin
 *  renginde: kilit "kapalı" değil "HENÜZ" demeli, uyarı gibi durmamalı. */
export function LockIcon({ size = 46 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M7.4 10.6V7.9a4.6 4.6 0 0 1 9.2 0v2.7" fill="none" stroke="var(--tx2)" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="4.4" y="10.6" width="15.2" height="10.6" rx="3" fill={AC} stroke={OT} strokeWidth="2.2" />
      <circle cx="12" cy="15" r="2" fill={OT} />
      <rect x="11" y="15" width="2" height="3.6" rx="1" fill={OT} />
    </Ic>
  );
}

/** Reklam izle — ekran + oynat üçgeni. Aksan yalnız üçgende. */
export function PlayAdIcon({ size = 20 }: { size?: number }) {
  return (
    <Ic size={size}>
      <rect x="2.4" y="4.4" width="19.2" height="15.2" rx="3.4" fill="currentColor" stroke={OT} strokeWidth="2.2" />
      <path d="M9.8 8.4l6.4 3.6-6.4 3.6z" fill={AC} stroke={OT} strokeWidth="1.9" strokeLinejoin="round" />
    </Ic>
  );
}

/** Onay tiki (satır içi) — `✓` metin glifinin yerine. Kendi rengini alır. */
export function TickIcon({ size = 14 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M4.4 12.6l4.6 4.6 10.6-11.4" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </Ic>
  );
}

/** Boş madde işareti — `•` yerine; tikle AYNI kutuda durur ki liste zıplamasın. */
export function DotIcon({ size = 14 }: { size?: number }) {
  return (
    <Ic size={size}>
      <circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" strokeWidth="3" />
    </Ic>
  );
}

/** "Şuna çıkar" oku — `→` metin glifinin yerine (karakter panelindeki 4 → 5 gösterimi). */
export function ToIcon({ size = 13 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M3.4 12h14.2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M14.6 5.8L21.4 12l-6.8 6.2z" fill="currentColor" />
    </Ic>
  );
}

/* ══════════════ ROZETLER ══════════════ */

/** Seviye rozeti — içine seviye rakamı oturur (CSS .lvl-num). Yıldız 5 uçlu ve kalın:
 *  eski 10 köşeli yıldız küçük boyda dişli bir lekeydi. */
export function StarBadge({ size = 54 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path
        d="M12 1.8l3.2 6.5 7.2 1-5.2 5.1 1.2 7.2L12 18.2l-6.4 3.4 1.2-7.2L1.6 9.3l7.2-1z"
        fill={AC}
        stroke={OT}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </Ic>
  );
}

/** Onay madalyonu (görev-tamam). Yeşil burada aksan değil İLERLEME anlamı (D-107). */
export function CheckBadge({ size = 30 }: { size?: number }) {
  return (
    <Ic size={size}>
      <circle cx="12" cy="12" r="9.4" fill="var(--ok)" stroke={OT} strokeWidth="2.2" />
      <path d="M7.4 12.4l3 3 6.2-6.6" fill="none" stroke={OT} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </Ic>
  );
}

/** Ünlem madalyonu (yeni-özellik). Aksan zemin + koyu ünlem — tek aksan kuralı. */
export function BangBadge({ size = 30 }: { size?: number }) {
  return (
    <Ic size={size}>
      <circle cx="12" cy="12" r="9.4" fill={AC} stroke={OT} strokeWidth="2.2" />
      <rect x="10.4" y="5.6" width="3.2" height="8.4" rx="1.6" fill={OT} />
      <circle cx="12" cy="17.4" r="1.8" fill={OT} />
    </Ic>
  );
}

/** İtibar madalyonu — çelenk + yıldız. Aksan yalnız yıldızda, çelenk ilerleme yeşili. */
export function ReputationIcon({ size = 26 }: { size?: number }) {
  return (
    <Ic size={size}>
      {/* YILDIZ KALKTI (R3 · D-128). Madalyonun üstünde HER İKİ kullanımda da seviye sayısı
          duruyor ve sayının konturu yıldızın ortasını kaplıyordu: 56 px'lik madalyonda yıldızdan
          geriye yalnız uç dilimleri kalıyor, göz bunu *"yarım yıldız"* olarak okuyordu. Süs ile
          bilgi aynı 56 px'i paylaşamaz; bilgi (seviye) kazandı. Disk buna karşılık açıldı
          (`--madalyon`) — sayı artık zeminine gömülmüyor. */}
      <circle cx="12" cy="12" r="8.4" fill="var(--madalyon)" stroke={OT} strokeWidth="2.2" />
    </Ic>
  );
}

/* ══════════════ YÜKSELTME SİMGELERİ ══════════════
   Bunlar hem karakter panelinde (24 ızgara) hem görev fotoğrafında (48 kutu, ×2 ölçekli)
   çizilir — TEK çizim iki yerde. Ölçek `QuestPhoto` içinde `scale(2)` ile verilir. */

/** Çay bardağı — ince belli, kırmızı çay. */
function CayGlyph() {
  return (
    <g>
      <path d="M7.7 3.8h8.6l-1.1 12.4a3.2 3.2 0 0 1-6.4 0z" fill="var(--tx)" stroke={OT} strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M8.7 11h6.6l-.7 5.2a2.6 2.6 0 0 1-5.2 0z" fill="var(--uyari)" />
      <path d="M8.2 20.2h7.6" stroke={OT} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/** Tepsi + iki bardak. */
function TepsiGlyph() {
  return (
    <g>
      <rect x="5.4" y="7.4" width="5.4" height="7.8" rx="1.3" fill="var(--uyari)" stroke={OT} strokeWidth="1.9" />
      <rect x="13.2" y="7.4" width="5.4" height="7.8" rx="1.3" fill="var(--uyari)" stroke={OT} strokeWidth="1.9" />
      <rect x="2.2" y="15.2" width="19.6" height="3.4" rx="1.6" fill={AC} stroke={OT} strokeWidth="1.9" />
    </g>
  );
}

/** Mıknatıs — at nalı, uçları açık. */
function MiknatisGlyph() {
  return (
    <g>
      <path d="M4.4 4.2h5.2v8.6a2.4 2.4 0 0 0 4.8 0V4.2h5.2v8.6a7.6 7.6 0 0 1-15.2 0z" fill="var(--uyari)" stroke={OT} strokeWidth="2" strokeLinejoin="round" />
      <rect x="4.4" y="4.2" width="5.2" height="3.6" fill="var(--tx)" stroke={OT} strokeWidth="1.9" />
      <rect x="14.4" y="4.2" width="5.2" height="3.6" fill="var(--tx)" stroke={OT} strokeWidth="1.9" />
    </g>
  );
}

/** Hız — bot + hareket çizgileri. Aksan yalnız hareket çizgilerinde. */
function HizGlyph() {
  return (
    <g>
      <path d="M6.4 18.4V9.2h3.8l2.4 2.6h2.2a6.2 6.2 0 0 1 6.2 6.2v.4z" fill="currentColor" stroke={OT} strokeWidth="2" strokeLinejoin="round" />
      <rect x="6.4" y="18.4" width="14.6" height="2.8" rx="1.3" fill={OT} />
      <path d="M3.4 11.4H1.2M4 15.4H1.2" stroke={AC} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/** Leğen — bulaşık. Aksan yalnız köpükte. */
function LeganGlyph() {
  return (
    <g>
      <path d="M3.4 10.6h17.2v3.6a6.2 6.2 0 0 1-6.2 6.2h-4.8a6.2 6.2 0 0 1-6.2-6.2z" fill="currentColor" stroke={OT} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="8.4" cy="6.2" r="2.4" fill={AC} stroke={OT} strokeWidth="1.9" />
      <circle cx="14.6" cy="4.8" r="2" fill="currentColor" stroke={OT} strokeWidth="1.9" />
    </g>
  );
}

/** Tost dilimi — üçgen + ızgara izi. */
function TostGlyph() {
  return (
    <g>
      <path d="M4.6 19.4L12 5.2l7.4 14.2z" fill={AC} stroke={OT} strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M9 15.4l3-5.6 3 5.6" fill="none" stroke={OT} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/** Masa — tabla + ayak + üstünde bardak. */
function MasaGlyph() {
  return (
    <g>
      <rect x="10.7" y="10.4" width="2.6" height="7.4" fill="currentColor" stroke={OT} strokeWidth="1.9" />
      <ellipse cx="12" cy="9.6" rx="8.2" ry="3.2" fill="currentColor" stroke={OT} strokeWidth="2.1" />
      <rect x="10.9" y="5.3" width="2.2" height="3.8" rx="0.8" fill={AC} stroke={OT} strokeWidth="1.9" />
      <rect x="6.6" y="18.4" width="10.8" height="2.6" rx="1.2" fill={OT} />
    </g>
  );
}

/** Kapı (lavabo odası) — kanat + kol. Aksan yalnız kolda. */
function KapiGlyph() {
  return (
    <g>
      <rect x="5.4" y="2.6" width="13.2" height="18.8" rx="2.4" fill="currentColor" stroke={OT} strokeWidth="2.2" />
      <rect x="8.2" y="5.6" width="7.6" height="7.2" rx="1.6" fill={OT} />
      <circle cx="15.8" cy="16.4" r="1.8" fill={AC} stroke={OT} strokeWidth="1.6" />
    </g>
  );
}

/** Kişi (garson/bulaşıkçı fotoğrafı) — karakter ikonunun aynısı, gövde rengi rolü söyler. */
function KisiGlyph({ fill = 'currentColor' }: { fill?: string }) {
  return (
    <g>
      <circle cx="12" cy="7.8" r="4.6" fill="var(--tx)" stroke={OT} strokeWidth="2.2" />
      <path d="M4.2 21c0-4.3 3.5-6.9 7.8-6.9s7.8 2.6 7.8 6.9z" fill={fill} stroke={OT} strokeWidth="2.2" strokeLinejoin="round" />
    </g>
  );
}

/* ── Panel/buton dışa açımları: aynı çizim, kendi kutusunda ── */

export function TrayIcon({ size, food = false }: { size?: number; food?: boolean }) {
  const inner = food ? <TostGlyph /> : <TepsiGlyph />;
  if (size == null) return inner;
  return <Ic size={size}>{inner}</Ic>;
}

export function BasinIcon({ size }: { size?: number }) {
  const inner = <LeganGlyph />;
  if (size == null) return inner;
  return <Ic size={size}>{inner}</Ic>;
}

export function MagnetIcon({ size }: { size?: number }) {
  const inner = <MiknatisGlyph />;
  if (size == null) return inner;
  return <Ic size={size}>{inner}</Ic>;
}

export function BootIcon({ size }: { size?: number }) {
  const inner = <HizGlyph />;
  if (size == null) return inner;
  return <Ic size={size}>{inner}</Ic>;
}

export function DoorIcon({ size }: { size?: number }) {
  const inner = <KapiGlyph />;
  if (size == null) return inner;
  return <Ic size={size}>{inner}</Ic>;
}

/** Boya fırçası (kozmetik dekor mağazası, WP6). Aksan yalnız boyada. */
export function BrushIcon({ size = 22 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M19.6 2.6l2.2 2.2-8.6 8.6-2.2-2.2z" fill="currentColor" stroke={OT} strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M10.4 11.6l2.6 2.6c-.5 2.2-2 3.9-4.2 4.6-1.8.6-3.8.6-5.6.2 1.2-1 1.8-2 1.9-3.4.1-2 1.2-3.5 3-4.1.8-.2 1.6-.2 2.3.1z" fill={AC} stroke={OT} strokeWidth="2.1" strokeLinejoin="round" />
    </Ic>
  );
}

/** Tepsiyi boşalt (çay) — tepsi + geri oku. Aksan tepside, ok konturda. */
export function TrayEmptyIcon({ size = 28 }: { size?: number }) {
  return (
    <Ic size={size}>
      <TepsiGlyph />
      <path d="M2.6 6.4a6.4 6.4 0 0 1 9.6-2.4" fill="none" stroke={OT} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M1.6 1.9v5h5z" fill={OT} />
    </Ic>
  );
}

/** Tepsiyi boşalt (tost) — çayınkinden AYRI: tepside üçgen dilim. */
export function TostEmptyIcon({ size = 28 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M6.4 15.2L12 4.6l5.6 10.6z" fill={AC} stroke={OT} strokeWidth="2.1" strokeLinejoin="round" />
      <rect x="2.2" y="15.2" width="19.6" height="3.4" rx="1.6" fill="currentColor" stroke={OT} strokeWidth="1.9" />
      <path d="M2.6 6.4a6.4 6.4 0 0 1 9.6-2.4" fill="none" stroke={OT} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M1.6 1.9v5h5z" fill={OT} />
    </Ic>
  );
}

/** Kamera genel-bakış: out=false → içe oklar (yakınlaş), out=true → dışa oklar (uzaklaş). */
export function CamZoomIcon({ size = 28, out = false }: { size?: number; out?: boolean }) {
  return (
    <Ic size={size}>
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="4.4" fill="currentColor" stroke={OT} strokeWidth="2.2" />
      {out ? (
        <g stroke={OT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M10 10L6 6M10 10V6.6M10 10H6.6" />
          <path d="M14 14l4 4M14 14v3.4M14 14h3.4" />
        </g>
      ) : (
        <g stroke={OT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M6 6l4 4M6 6h3.4M6 6v3.4" />
          <path d="M18 18l-4-4M18 18h-3.4M18 18v-3.4" />
        </g>
      )}
      <circle cx="12" cy="12" r="1.8" fill={AC} />
    </Ic>
  );
}

/* ══════════════ GÖREV "FOTOĞRAFI" ══════════════
   Bunlar simge değil KÜÇÜK RESİM: kartın solunda duran, konusunu tek bakışta söyleyen bir kare.
   Kutu artık mor kart dilinde (oyuk zemin + kontur); içindeki çizim yükseltme simgeleriyle
   AYNI gramerden geliyor — eskiden üç ayrı aileden geliyordu ve her görev başka bir oyundandı. */

/** Yükseltme işareti: fotoğrafın sağ üstünde küçük yukarı ok (ilerleme yeşili — aksan değil). */
function UpArrowOverlay() {
  return (
    <g transform="translate(30 2)">
      <path d="M8 0l7 8h-4v6H5V8H1z" fill="var(--ok)" stroke={OT} strokeWidth="2.2" strokeLinejoin="round" />
    </g>
  );
}

/**
 * Görev hedef tipine göre "fotoğraf" (quest kartının solundaki kare).
 * İçerideki çizim 24 ızgarada; kare 48 → `scale(2)`. Tek çizim, iki boy.
 */
export function QuestPhoto({ target, size = 44 }: { target: QuestTarget; size?: number }) {
  let inner: ReactNode = <CayGlyph />;
  let up = false;
  switch (target.type) {
    case 'pickupTea':
      inner = <CayGlyph />;
      break;
    case 'serveTea':
      // Tost alanı görevi (v27): bardak değil TOST dilimi.
      inner = target.area === 2 ? <TostGlyph /> : <CayGlyph />;
      break;
    case 'collectCoin':
      inner = (
        <g>
          <ellipse cx="12" cy="15" rx="8.6" ry="4.2" fill="var(--ac2)" stroke={OT} strokeWidth="1.9" />
          <ellipse cx="12" cy="10.2" rx="8.6" ry="4.5" fill="var(--para)" stroke={OT} strokeWidth="1.9" />
          <ellipse cx="12" cy="10.2" rx="4.1" ry="2" fill="none" stroke={OT} strokeWidth="1.8" />
        </g>
      );
      break;
    case 'washDish':
      inner = <LeganGlyph />;
      break;
    case 'pad':
      // turu-4 SVG tutarlılığı: z2waiter/z3waiter/waiter2… yalnız 'waiter' İD'siyle eşleşmediği
      // için MASA ikonu alıyordu → tüm garson/bulaşıkçı pad'leri KİŞİ ikonu.
      if (target.id.includes('waiter')) {
        inner = <KisiGlyph fill={target.id.startsWith('z3') ? AC : 'var(--ok)'} />;
      } else if (target.id.includes('dishwasher')) {
        inner = <KisiGlyph fill="var(--elmas)" />;
      } else {
        inner = <MasaGlyph />;
      }
      break;
    case 'stationLevel':
      // B2: tek servis merdiveni — L5 (tost) hedefi tost dilimiyle, altı çay bardağıyla anlatılır.
      inner = target.level >= TOST_LEVEL ? <TostGlyph /> : <CayGlyph />;
      up = true;
      break;
    case 'waiterSpeed':
      inner = <KisiGlyph fill="var(--ok)" />;
      up = true;
      break;
    case 'lavaboLevel':
      inner = <KapiGlyph />;
      up = true;
      break;
    case 'tableLevel':
    case 'tablesAtLevel':
      inner = <MasaGlyph />;
      up = true;
      break;
    case 'waiterTray':
      inner = <TepsiGlyph />;
      up = true;
      break;
    case 'charStat':
      inner =
        target.stat === 'tray' ? <TepsiGlyph /> : target.stat === 'magnet' ? <MiknatisGlyph /> : <HizGlyph />;
      up = true;
      break;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect x="1.6" y="1.6" width="44.8" height="44.8" rx="14" fill="var(--oyuk)" stroke={OT} strokeWidth="3.2" />
      <g transform="translate(3 3) scale(1.75)" color="var(--tx)">
        {inner}
      </g>
      {up && <UpArrowOverlay />}
    </svg>
  );
}
