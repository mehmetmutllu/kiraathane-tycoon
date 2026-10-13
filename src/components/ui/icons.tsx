/**
 * HUD ikon seti. Sprint C'den (D-166) beri oyun nesnesi/para/gezinme ikonları BİTMAP (aşağıda `Ikon`);
 * bu başlıktaki D-108 grameri yalnız kalan SVG çizgi glifleri ve rozetler için geçerli.
 *
 * D-108 GRAMERİ (S10'da çizildi, S11a'da koda girdi).
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

/**
 * BİTMAP İKONLAR (Sprint C, D-166) — ChatGPT'nin iki 4×4 ızgarasından kesildi (`tools/ui-kit/izgara.py`),
 * 256 px saydam webp, `public/assets/ui/ikon/`. Oyun nesnesi/para/gezinme ikonları bunlar; SVG yalnız
 * çizgi glifleri (geri, kapat, tik, ok) ve içine sayı oturan rozetlerde kaldı.
 */
export type IkonAd =
  | 'para' | 'elmas' | 'gorevler' | 'hedefler' | 'magaza' | 'cayci' | 'ayarlar' | 'kiyafet'
  | 'cay-tepsi' | 'lamba' | 'elmas-kese' | 'masa' | 'zemin' | 'duvar' | 'kilit' | 'reklamsiz'
  | 'cay' | 'tepsi' | 'para-yigin' | 'legen' | 'masa-ekle' | 'semaver' | 'hiz' | 'kapi'
  | 'masa-yukselt' | 'tepsi-buyuk' | 'miknatis' | 'kanat' | 'tost' | 'rozet' | 'video' | 'elmas-sandik';

const ikonUrl = (ad: IkonAd) => `/assets/ui/ikon/${ad}.webp`;

export function Ikon({ ad, size }: { ad: IkonAd; size: number }) {
  return <img className="ikon" src={ikonUrl(ad)} width={size} height={size} alt="" draggable={false} aria-hidden />;
}

/* ══════════════ PARA BİRİMLERİ ══════════════ */

/** Para — altın sikke yığını. */
export function CoinIcon({ size = 28 }: { size?: number }) {
  return <Ikon ad="para" size={size} />;
}

/** Elmas — mavi taşlar. */
export function GemIcon({ size = 28 }: { size?: number }) {
  return <Ikon ad="elmas" size={size} />;
}

/* ══════════════ ALT GEZİNME (geometri D-106'da kilitli; değişen yalnız DİL) ══════════════ */

/** Görevler — onaylı pano. */
export function QuestListIcon({ size = 26 }: { size?: number }) {
  return <Ikon ad="gorevler" size={size} />;
}

/** Hedefler — dart tahtası. */
export function TargetIcon({ size = 26 }: { size?: number }) {
  return <Ikon ad="hedefler" size={size} />;
}

/** Mağaza — tenteli dükkân. */
export function ShopAwningIcon({ size = 26 }: { size?: number }) {
  return <Ikon ad="magaza" size={size} />;
}

/** Çaycı — fesli usta. */
export function CharIcon({ size = 22 }: { size?: number }) {
  return <Ikon ad="cayci" size={size} />;
}

/* ══════════════ KABUK DÜĞMELERİ ══════════════ */

/** Ayarlar — çark. */
export function GearIcon({ size = 22 }: { size?: number }) {
  return <Ikon ad="ayarlar" size={size} />;
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

/** Asma kilit. */
export function LockIcon({ size = 46 }: { size?: number }) {
  return <Ikon ad="kilit" size={size} />;
}

/** Reklam izle — oynat düğmeli film karesi. */
export function PlayAdIcon({ size = 20 }: { size?: number }) {
  return <Ikon ad="video" size={size} />;
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

/** E5 — sürükleyen el (öğretici). Yukarıyı gösteren işaret parmağı; AKSAN parmak ucundaki dokunuş
 *  izi — gözün gideceği yer "buraya bas". Kontur 2,2, düz dolgu (D-108). */
export function HandIcon({ size = 44 }: { size?: number }) {
  return (
    <Ic size={size}>
      <path d="M4.2 5.2l-1.6-1M4 8.4H2.2M6.4 2.6l-.8-1.4" fill="none" stroke={AC} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M9 13.2V4.3a2 2 0 0 1 4 0v6.3a1.8 1.8 0 0 1 3.6.4v.3a1.8 1.8 0 0 1 3.4.8V16c0 3.6-2.5 6-6 6h-1.3c-2.1 0-3.6-.9-4.8-2.6L3.8 15.2a1.7 1.7 0 0 1 2.7-2.1z"
        fill="var(--tx)"
        stroke={OT}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M13 10.6v2.6M16.6 11.3v2" fill="none" stroke={OT} strokeWidth="1.6" strokeLinecap="round" />
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

/* ══════════════ YÜKSELTME SİMGELERİ (bitmap) + "tepsiyi boşalt" düğmesinin çizimi ══════════════ */

/** Tepsi + iki bardak (yalnız TrayEmptyIcon'un içinde — düğme glifi, SVG kalır). */
function TepsiGlyph() {
  return (
    <g>
      <rect x="5.4" y="7.4" width="5.4" height="7.8" rx="1.3" fill="var(--uyari)" stroke={OT} strokeWidth="1.9" />
      <rect x="13.2" y="7.4" width="5.4" height="7.8" rx="1.3" fill="var(--uyari)" stroke={OT} strokeWidth="1.9" />
      <rect x="2.2" y="15.2" width="19.6" height="3.4" rx="1.6" fill={AC} stroke={OT} strokeWidth="1.9" />
    </g>
  );
}

/* ── Panel/buton dışa açımları: aynı çizim, kendi kutusunda ── */

/** Tepsi (oyuncunun) — `food` ise tost. */
export function TrayIcon({ size = 24, food = false }: { size?: number; food?: boolean }) {
  return <Ikon ad={food ? 'tost' : 'tepsi'} size={size} />;
}

/** Leğen — köpüklü bulaşık. */
export function BasinIcon({ size = 24 }: { size?: number }) {
  return <Ikon ad="legen" size={size} />;
}

/** Para mıknatısı. */
export function MagnetIcon({ size = 24 }: { size?: number }) {
  return <Ikon ad="miknatis" size={size} />;
}

/** Hareket hızı — koşan ayakkabı. */
export function BootIcon({ size = 24 }: { size?: number }) {
  return <Ikon ad="hiz" size={size} />;
}

/** Lavabo kapısı. */
export function DoorIcon({ size = 24 }: { size?: number }) {
  return <Ikon ad="kapi" size={size} />;
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
   Kutu mor kart dilinde (oyuk zemin + kontur); içindeki ikon yükseltme simgeleriyle AYNI setten. */

/** Yükseltme işareti: fotoğrafın sağ üstünde küçük yukarı ok (ilerleme yeşili — aksan değil). */
function UpArrowOverlay() {
  return (
    <g transform="translate(30 2)">
      <path d="M8 0l7 8h-4v6H5V8H1z" fill="var(--ok)" stroke={OT} strokeWidth="2.2" strokeLinejoin="round" />
    </g>
  );
}

/**
 * Görev hedef tipine göre "fotoğraf" (quest kartının solundaki kare): oyuk kutu + bitmap ikon.
 * Yükseltme görevinde sağ üstte yeşil ok (ikonun kendisinde ok yoksa).
 */
export function QuestPhoto({ target, size = 44 }: { target: QuestTarget; size?: number }) {
  let ad: IkonAd = 'cay';
  let up = false;
  switch (target.type) {
    case 'pickupTea':
      ad = 'cay';
      break;
    case 'serveTea':
      // Tost alanı görevi (v27): bardak değil TOST.
      ad = target.area === 2 ? 'tost' : 'cay-tepsi';
      break;
    case 'collectCoin':
      ad = 'para-yigin';
      break;
    case 'washDish':
      ad = 'legen';
      break;
    case 'pad':
      // turu-4: z2waiter/z3waiter/waiter2… hepsi garson; bulaşıkçı leğenle, kalan pad'ler yeni masa.
      ad = target.id.includes('waiter') ? 'cayci' : target.id.includes('dishwasher') ? 'legen' : 'masa-ekle';
      break;
    case 'stationLevel':
      // B2: tek servis merdiveni — L5 (tost) hedefi tostla, altı semaverle anlatılır.
      ad = target.level >= TOST_LEVEL ? 'tost' : 'semaver';
      up = true;
      break;
    case 'waiterSpeed':
      ad = 'kanat';
      up = true;
      break;
    case 'lavaboLevel':
      ad = 'kapi';
      up = true;
      break;
    case 'tableLevel':
    case 'tablesAtLevel':
      ad = 'masa-yukselt';
      break;
    case 'waiterTray':
      ad = 'tepsi-buyuk';
      up = true;
      break;
    case 'charStat':
      ad = target.stat === 'tray' ? 'tepsi' : target.stat === 'magnet' ? 'miknatis' : 'hiz';
      up = true;
      break;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect x="1.6" y="1.6" width="44.8" height="44.8" rx="14" fill="var(--oyuk)" stroke={OT} strokeWidth="3.2" />
      <image href={ikonUrl(ad)} x="4" y="4" width="40" height="40" />
      {up && <UpArrowOverlay />}
    </svg>
  );
}

/* ══════════════ MAĞAZA SEKMELERİ (2026-10-13) ══════════════
   Sekme satırı tek sıra, ikon + tam yazı. */

/** Kıyafet — yelek. */
export function ShirtIcon({ size = 22 }: { size?: number }) {
  return <Ikon ad="kiyafet" size={size} />;
}

/** Dekor — ayaklı lamba. */
export function LampIcon({ size = 22 }: { size?: number }) {
  return <Ikon ad="lamba" size={size} />;
}

/** Masa. */
export function TableIcon({ size = 22 }: { size?: number }) {
  return <Ikon ad="masa" size={size} />;
}

/** Zemin — karo. */
export function FloorIcon({ size = 22 }: { size?: number }) {
  return <Ikon ad="zemin" size={size} />;
}

/** Duvar — lambrili duvar. */
export function WallIcon({ size = 22 }: { size?: number }) {
  return <Ikon ad="duvar" size={size} />;
}

/** Reklamları Kaldır. */
export function NoAdsIcon({ size = 40 }: { size?: number }) {
  return <Ikon ad="reklamsiz" size={size} />;
}

/* ══════════════ ELMAS PAKETLERİ — avuç · kese · sandık ══════════════
   Kademe büyüdükçe kap büyür: oyuncu fiyatı okumadan hangisinin "çok" olduğunu görür. */

const PAKET_IKON = ['elmas', 'elmas-kese', 'elmas-sandik'] as const;
export function GemPackArt({ kademe, size = 64 }: { kademe: number; size?: number }) {
  return <Ikon ad={PAKET_IKON[Math.min(Math.max(kademe, 0), PAKET_IKON.length - 1)]} size={size} />;
}
