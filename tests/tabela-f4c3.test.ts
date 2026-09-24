/**
 * BEKÇİ — F4c-3 tabela + kafe adı (D-156). Ölçüm: `docs/tabela-raporu-f4c3.md`. Kullanıcı kararı:
 * tabela "alınlığı dolduran büyük tabela" (K2); üstünde oyuncunun girişte verdiği ad yazar; ad Ayarlar'dan
 * ücretsiz değişir, eski kayıtlara bir kez sorulur, en fazla 20 harf; yükleniyor ekranında oyunun adı.
 *
 * Neyi korur:
 *  - ÖRTÜ: tabelanın arka yüzü lento/üst kordonun ÖNÜNDE (eski tabelanın yarısı onların arkasındaydı, B4),
 *    alınlığı (2,65 … 3,20) doldurur, eni lentoyu geçmez.
 *  - YAZI: uzun adda harf küçülür, levhadan taşmaz; boy da en de sınırlar (B6).
 *  - AD: temizlenir (boşluk, denetim karakteri, 20 harf), boş → varsayılan, Türkçe büyük harf (i → İ).
 *  - KAYIT: yeni ve ESKİ kayıt "hiç sorulmadı" (null) açılır; verilen ad kayda girer ve geri okunur;
 *    sıfırlama yeniden sordurur.
 *  - SIRA: ad kutusu ekranı kesen kanalların EN ÖNÜNDE (çevrimdışı kazançtan da önce); geri tuşu onu kaydeder.
 *  - AD AYRIMI: yükleniyor ekranı ve sayfa başlığı oyunun adını (Tea House Tycoon) taşır, kafenin adını değil.
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame, kayitVerisi } from '../src/game/store';
import { defaultSave, kayitCoz } from '../src/game/save';
import { KAFE_ADI_MAX, KAFE_ADI_VARSAYILAN, OYUN_ADI, kafeAdiOku, kafeAdiTemizle, tabelaYazisi } from '../src/game/kafeAdi';
import { ekranKanali, geriTusu, type EkranGirdisi } from '../src/game/ekranKanali';
import { ALINLIK_ORTUCU_ON_Z, STREET_Z0, TABELA, TABELA_YAZI, tabelaFontPx } from '../src/components/three/streetLook';
import { DOOR } from '../src/components/three/wallPanel';
import { WALL_M } from '../src/components/three/wallLook';
import { LAYOUT } from '../src/game/layout';

const mem: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};

describe('tabela geometrisi (D-156 · rapor B4/B8)', () => {
  it('örtücü (lento + üst kordon) ön yüzü Scene giriş bloğundan türüyor', () => {
    // Scene: frontEdgeZ = areaBounds[0].maxZ + WALL_M; lento/kordon z + 0,22'de, 0,34 derin.
    const frontEdgeZ = LAYOUT.areaBounds[0].maxZ + WALL_M;
    expect(frontEdgeZ + 0.22 + 0.34 / 2).toBeCloseTo(ALINLIK_ORTUCU_ON_Z, 2);
  });
  it('arka yüzü örtücülerin önünde — lento ve kordon yazıyı kesmez', () => {
    expect(TABELA.z - TABELA.d / 2).toBeGreaterThan(ALINLIK_ORTUCU_ON_Z);
    expect(TABELA.z).toBeLessThan(STREET_Z0 + 0.6); // duvardan kopmuş bir levha değil
  });
  it('alınlığı doldurur: lento üstü (2,65) … kordon üstü (3,20)', () => {
    expect(TABELA.y - TABELA.h / 2).toBeCloseTo(DOOR.height, 2);
    expect(TABELA.y + TABELA.h / 2).toBeCloseTo(3.2, 2);
  });
  it('eni lento kadar (kapı + söveler), taşmaz', () => {
    expect(TABELA.w).toBeCloseTo(DOOR.half * 2 + 0.6, 2);
  });
});

describe('tabela yazısı sığdırma (B6)', () => {
  const W = 1024;
  const H = Math.round((W * TABELA.h) / TABELA.w);
  // 100 px fontta büyük harf 69 px; yazı eni harfin 17,14 katı/100 px ölçeğinde.
  const harf100 = 69;
  const en = (n: number) => n * 58; // karakter başına ~58 px (100 px font)
  it('kısa adda harf levha boyunun %42,7si (boydan sınırlı)', () => {
    const px = tabelaFontPx(harf100, en(8), W, H);
    expect((harf100 * px) / 100).toBeCloseTo(TABELA_YAZI.harfBoy * H, 5);
    expect((en(8) * px) / 100).toBeLessThanOrEqual(TABELA_YAZI.doluluk * W + 1e-9);
  });
  it('20 harfte harf küçülür, yazı levhanın %78,7sini aşmaz (enden sınırlı)', () => {
    const kisa = tabelaFontPx(harf100, en(8), W, H);
    const uzun = tabelaFontPx(harf100, en(KAFE_ADI_MAX), W, H);
    expect(uzun).toBeLessThan(kisa);
    expect((en(KAFE_ADI_MAX) * uzun) / 100).toBeCloseTo(TABELA_YAZI.doluluk * W, 5);
  });
});

describe('kafe adı kuralları', () => {
  it('boşlukları toplar, uçları kırpar, denetim karakterini atar', () => {
    expect(kafeAdiTemizle('  Çınar   Kahvesi  ')).toBe('Çınar Kahvesi');
    expect(kafeAdiTemizle('Çınar\u0000​Kahve')).toBe('ÇınarKahve');
    expect(kafeAdiTemizle('   ')).toBe('');
  });
  it('en fazla 20 harf (Türkçe harf tek sayılır)', () => {
    expect(Array.from(kafeAdiTemizle('ÇĞİÖŞÜ'.repeat(5)))).toHaveLength(KAFE_ADI_MAX);
    expect(kafeAdiTemizle('a'.repeat(19) + ' b')).toBe('a'.repeat(19));
  });
  it('tabela Türkçe büyük harfle yazar; ad yoksa varsayılan', () => {
    expect(tabelaYazisi('çınar kahvesi')).toBe('ÇINAR KAHVESİ');
    expect(tabelaYazisi(null)).toBe('KÖŞE KIRAATHANESİ');
    expect(tabelaYazisi('')).toBe('KÖŞE KIRAATHANESİ');
  });
  it('kayıttan okuma: dize değilse hiç sorulmadı (null), boş dize varsayılan', () => {
    expect(kafeAdiOku(undefined)).toBeNull();
    expect(kafeAdiOku(42)).toBeNull();
    expect(kafeAdiOku('')).toBe(KAFE_ADI_VARSAYILAN);
    expect(kafeAdiOku('  Ada  Çay ')).toBe('Ada Çay');
  });
});

describe('kafe adı kayıtta', () => {
  beforeEach(() => {
    for (const k of Object.keys(mem)) delete mem[k];
    useGame.getState().hardReset();
  });
  it('yeni oyun: hiç sorulmadı', () => {
    expect(useGame.getState().kafeAdi).toBeNull();
    expect(defaultSave().kafeAdi).toBeNull();
  });
  it('ESKİ kayıt (alan yok) hiç sorulmamış açılır → kutu bir kez çıkar', () => {
    const eski = { ...defaultSave() } as Record<string, unknown>;
    delete eski.kafeAdi;
    expect(kayitCoz(eski).data.kafeAdi).toBeNull();
  });
  it('verilen ad temizlenip kayda girer ve geri okunur', () => {
    useGame.getState().kafeAdiKoy('  Köprübaşı   Çay Evi ');
    expect(useGame.getState().kafeAdi).toBe('Köprübaşı Çay Evi');
    const v = kayitVerisi(useGame.getState());
    expect(v.kafeAdi).toBe('Köprübaşı Çay Evi');
    expect(kayitCoz(JSON.parse(JSON.stringify(v))).data.kafeAdi).toBe('Köprübaşı Çay Evi');
    useGame.getState().init();
    expect(useGame.getState().kafeAdi).toBe('Köprübaşı Çay Evi');
  });
  it('boş ad varsayılanı kaydeder (kutu bir daha çıkmaz)', () => {
    useGame.getState().kafeAdiKoy('   ');
    expect(useGame.getState().kafeAdi).toBe(KAFE_ADI_VARSAYILAN);
  });
  it('sıfırlama adı siler → yeniden sorulur', () => {
    useGame.getState().kafeAdiKoy('Ada Çay');
    useGame.getState().hardReset();
    expect(useGame.getState().kafeAdi).toBeNull();
  });
});

describe('ekran sırası', () => {
  const bos: EkranGirdisi = {
    panelAcik: false, bildirimVar: false, gecisPenceresi: false, cevrimdisiVar: false, ustaVar: false,
    bulasikOgretmeHazir: false, karakterIpucuHazir: false, tepsiIpucuHazir: false,
  };
  it('ad kutusu her şeyin önünde — çevrimdışı kazanç ve Usta bile bekler', () => {
    expect(ekranKanali({ ...bos, kafeAdiSorulacak: true, cevrimdisiVar: true, ustaVar: true, seviyeVar: true })).toBe('kafe-adi');
    expect(ekranKanali({ ...bos, kafeAdiSorulacak: false, cevrimdisiVar: true })).toBe('cevrimdisi');
  });
  it('geri tuşu ad kutusunu kaydeder (panelden önce)', () => {
    expect(geriTusu('kafe-adi', true)).toBe('kafe-adi');
  });
});

describe('oyunun adı ile kafenin adı ayrı', () => {
  it('yükleniyor ekranı ve sayfa başlığı oyunun adını taşır', () => {
    expect(OYUN_ADI).toBe('Tea House Tycoon');
    const splash = readFileSync('src/components/ui/SplashScreen.tsx', 'utf8');
    expect(splash).toContain('{OYUN_ADI}');
    expect(splash).not.toContain('Köşe Kıraathanesi');
    expect(readFileSync('index.html', 'utf8')).toContain('<title>Tea House Tycoon</title>');
  });
  it('tabela kafenin adını store\'dan okur (sabit yazı yok)', () => {
    const t = readFileSync('src/components/three/Tabela.tsx', 'utf8');
    expect(t).toContain('tabelaYazisi(kafeAdi)');
    const scene = readFileSync('src/components/three/Scene.tsx', 'utf8');
    expect(scene).toContain('<Tabela x={e[0]} />');
    expect(scene).not.toMatch(/args=\{\[3\.4, 0\.34/);
  });
});
