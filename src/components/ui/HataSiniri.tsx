/**
 * HataSiniri.tsx — oyunun ÇÖKME ağı (Sprint A).
 *
 *  - `HataSiniri`: React hata sınırı. Bir bileşen çizerken hata fırlatırsa beyaz ekran yerine sade bir
 *    "yeniden başlat" ekranı çıkar. Çökme anındaki durum KAYDEDİLMEZ (bozuk olabilir); yeniden
 *    başlatma son sağlam kayıttan açar.
 *  - `SahneKurtarici`: WebGL bağlamı kaybolursa (Android'de arka plan/bellek baskısı, GPU sıfırlanması)
 *    `preventDefault` ile tarayıcıya "geri isteyeceğiz" denir; bağlam geri gelince sahne baştan kurulur
 *    (yeni Canvas = yeni bağlam, bütün dokular/geometriler yeniden yüklenir). Olay tuvalden kabarmaz —
 *    yakalama (capture) evresinde dinlenir.
 */
import { Component, Fragment, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { dil } from '../../i18n';

// i18n: geçici sabit — orkestratör t() anahtarlarına taşıyacak (_taslak, ChatGPT mikrometin turu).
const METIN = {
  tr: {
    baslik: 'Bir şeyler ters gitti',
    aciklama: 'Oyun beklenmedik bir hatayla durdu. Yeniden başlatınca son kaydından devam edersin.',
    dugme: 'Yeniden başlat',
  },
  en: {
    baslik: 'Something went wrong',
    aciklama: 'The game stopped because of an unexpected error. Restart to continue from your last save.',
    dugme: 'Restart',
  },
} as const;

export class HataSiniri extends Component<{ children: ReactNode }, { hata: boolean }> {
  state = { hata: false };

  static getDerivedStateFromError() {
    return { hata: true };
  }

  componentDidCatch(hata: unknown, bilgi: ErrorInfo) {
    console.error('[HataSiniri]', hata, bilgi.componentStack);
  }

  render() {
    if (!this.state.hata) return this.props.children;
    const m = METIN[dil()];
    return (
      <div
        role="alertdialog"
        aria-labelledby="hata-siniri-baslik"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          background: '#2b1d14',
          color: '#f7ecd9',
        }}
      >
        <h1 id="hata-siniri-baslik" style={{ margin: 0, fontSize: 24 }}>{m.baslik}</h1>
        <p style={{ margin: 0, maxWidth: 360, lineHeight: 1.4 }}>{m.aciklama}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 28px',
            border: 0,
            borderRadius: 12,
            background: '#e8a33d',
            color: '#2b1d14',
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {m.dugme}
        </button>
      </div>
    );
  }
}

export function SahneKurtarici({ children }: { children: ReactNode }) {
  const kap = useRef<HTMLDivElement>(null);
  const [nesil, setNesil] = useState(0);
  useEffect(() => {
    const el = kap.current;
    if (!el) return;
    const kayboldu = (e: Event) => e.preventDefault();
    const geldi = () => setNesil((n) => n + 1);
    el.addEventListener('webglcontextlost', kayboldu, true);
    el.addEventListener('webglcontextrestored', geldi, true);
    return () => {
      el.removeEventListener('webglcontextlost', kayboldu, true);
      el.removeEventListener('webglcontextrestored', geldi, true);
    };
  }, []);
  return (
    <div ref={kap} style={{ display: 'contents' }}>
      <Fragment key={nesil}>{children}</Fragment>
    </div>
  );
}
