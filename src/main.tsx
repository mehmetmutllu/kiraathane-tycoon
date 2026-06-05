import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// StrictMode bilerek kapalı: çift mount, useFrame tick'ini ikiye katlayıp
// simülasyonu hızlandırırdı (R3F oyunlarında yaygın tercih).
createRoot(document.getElementById('root')!).render(<App />);
