/**
 * pano-guncelle.test.ts — KAPANIŞ OTOMASYONUNUN BEKÇİSİ · sayaç kolu (D-084 P3).
 *
 * Bu araç defterin İÇ TUTARLILIĞINI denetliyor. Denetim sessizce bozulursa (bir kural düşer,
 * bir eşleştirme gevşer) araç "temiz" der ve pano yanlış sayıyla yayınlanır — yani tam olarak
 * elle güncellemenin hatası, üstüne bir de "denetlendi" damgasıyla. Bu yüzden testler
 * denetimin GEÇTİĞİ kadar KIRILDIĞINI de tutuyor: her kural için bozuk bir defter örneği var.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { progressOku, panoOku, panoYaz, denetle, panoyaUygula, gunlukUyarisi, yazmaliMi } from '../tools/pano-guncelle.mjs';

// --- Küçük ama gerçeğin biçimini birebir taşıyan defter örneği.
const DEFTER = `# progress

**Oturum bütçesi (TOPLAM 20 · YAPILAN 12 · %60):**

| Dönem | Faz | Yapılan/Toplam |
|---|---|---|
| Kuruluş (5 Haz – 11 Ağu) | F0 planlama · F1 greybox | **6/6 ✅** |
| Yayın programı (1 Eyl →) | P plan ve maket | 2/2 ✅ |
| | **C zincir ve denge** | **3/5 🔧** |
| | **İA iş akışı** (D-084) | **1/3 🔧** |
| | D meta katman | 0/4 ⏳ |
| **Program toplam** | | **6/14** |

## Faz C — ZİNCİR VE DENGE (3/5) 🔧
- ✅ **C1 — ölçüm turu** · docs/denge-raporu-c1.md
- ✅ **D-079 — ölçüt bayat ilan edildi** (C1'in alt kararı, ayrı kalem DEĞİL)
- ✅ **C2 — Tek Odak**
- ✅ **C3 — sipariş kuyruğu**
- ⏳ **C4 — bardak kilidi**
- ⏳ **C5 — sim gerçeğe yaklaşır**

## Faz İA — İŞ AKIŞI (1/3) 🔧 — D-084
- ✅ **P1 — hafıza kesimi**
- ⏳ **P2 — ortak iskelet**
- ⏳ **P3 — kapanış otomasyonu**

## Bilinen açık kalemler
- **Nav ızgarası** — Faz D.
`;

const PANO = {
  guncelleme: '01.09.2026',
  yapilan: 12,
  toplam: 20,
  kilometre: [{ at: 6, etiket: 'Oynanabilir gövde' }, { at: 20, etiket: 'v1.0' }],
  ozet: { baslik: 'ANLATI — araç buraya dokunmamalı' },
  donemler: [
    { ad: 'Kuruluş dönemi', fazlar: [{ k: 'F0', t: 'Planlama', d: 'anlatı', yapilan: 2, toplam: 2 }, { k: 'F1', t: 'Greybox', d: 'anlatı', yapilan: 4, toplam: 4 }] },
    {
      ad: 'Yayın programı',
      fazlar: [
        { k: 'P', t: 'Plan', d: 'anlatı', yapilan: 2, toplam: 2 },
        { k: 'C', t: 'Zincir', d: 'anlatı', yapilan: 3, toplam: 5 },
        { k: 'İA', t: 'İş akışı', d: 'anlatı', yapilan: 1, toplam: 3, durum: 'now' },
        { k: 'D', t: 'Meta', d: 'anlatı', yapilan: 0, toplam: 4 },
      ],
    },
  ],
  gunluk: [{ tarih: '01.09.2026', baslik: 'eski kart' }],
};
const pano = () => JSON.parse(JSON.stringify(PANO));

describe('progressOku — dört sayı yerini BAĞIMSIZ okur', () => {
  const p = progressOku(DEFTER);

  it('bütçe satırını, Kuruluş satırını ve Program toplamı okur', () => {
    expect(p.butce).toEqual({ toplam: 20, yapilan: 12, yuzde: 60 });
    expect(p.kurulus).toMatchObject({ yapilan: 6, toplam: 6, kodlar: ['F0', 'F1'] });
    expect(p.programToplam).toEqual({ yapilan: 6, toplam: 14 });
  });

  it('program fazlarını kod + sayı + im olarak çıkarır (İA gibi Türkçe kod dâhil)', () => {
    expect(p.program.map((f) => f.kod)).toEqual(['P', 'C', 'İA', 'D']);
    expect(p.program.find((f) => f.kod === 'İA')).toMatchObject({ yapilan: 1, toplam: 3, im: '🔧', aktif: true });
    expect(p.program.find((f) => f.kod === 'P')).toMatchObject({ aktif: false });
  });

  it('faz başlıklarındaki (a/b) sayısını ayrı okur', () => {
    expect(p.basliklar).toEqual({ C: { yapilan: 3, toplam: 5 }, 'İA': { yapilan: 1, toplam: 3 } });
  });

  it('kalemleri sayar; "D-079" gibi alt karar satırı harf+sayı kalıbına uymadığı için kalem değildir', () => {
    expect(p.kalemler.C.liste.map((k) => k.onEk + k.no)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);
    expect(p.kalemler.C.onEkler).toEqual(['C']);
  });

  it('kalem ön eki faz kodundan farklı olabilir (Faz İA\'nın kalemleri P1..P3)', () => {
    expect(p.kalemler['İA'].liste.map((k) => k.onEk + k.no)).toEqual(['P1', 'P2', 'P3']);
    expect(p.kalemler['İA'].onEkler).toEqual(['P']);
  });

  it('"## Bilinen açık kalemler" bölümündeki maddeleri faza yazmaz', () => {
    expect(Object.keys(p.kalemler)).toEqual(['C', 'İA']);
  });
});

describe('denetle — tutarlı defter geçer', () => {
  it('hata yok', () => {
    expect(denetle(progressOku(DEFTER), pano()).hatalar).toEqual([]);
  });
});

describe('denetle — her kural için bozuk bir defter (denetim gerçekten yakalıyor mu)', () => {
  const bozukla = (a: string, b: string) => denetle(progressOku(DEFTER.replace(a, b)), pano()).hatalar;
  const kod = (h: string[]) => h.map((x) => x.split(':')[0]);

  it('D2 — faz BAŞLIĞI tabloyla çelişiyor (gerçekte olan: İA başlığı 1/2 kalmıştı)', () => {
    expect(kod(bozukla('## Faz İA — İŞ AKIŞI (1/3)', '## Faz İA — İŞ AKIŞI (1/2)'))).toContain('D2');
  });

  it('E2 — kalem listesi tablo toplamından fazla (gerçekte olan: P4 bütçesiz duruyordu)', () => {
    const h = bozukla('- ⏳ **P3 — kapanış otomasyonu**', '- ⏳ **P3 — kapanış otomasyonu**\n- ⏳ **P4 — doğrulama**');
    expect(kod(h)).toContain('E2');
    expect(h.join(' ')).toContain('P4');
  });

  it('E1 — kalem ✅ sayısı tablo yapılanıyla çelişiyor', () => {
    expect(kod(bozukla('- ⏳ **P2 — ortak iskelet**', '- ✅ **P2 — ortak iskelet**'))).toContain('E1');
  });

  it('E3 — kalem numaralarında boşluk var (bir satır düşmüş)', () => {
    expect(kod(bozukla('- ✅ **C2 — Tek Odak**\n', ''))).toContain('E3');
  });

  it('E4 — bir fazın altında iki ayrı kalem ön eki var, hangisinin sayıldığı belirsiz', () => {
    const h = bozukla('- ⏳ **C5 — sim gerçeğe yaklaşır**', '- ⏳ **C5 — sim gerçeğe yaklaşır**\n- ⏳ **G4 — yanlış faza düşmüş kalem**');
    expect(kod(h)).toContain('E4');
    expect(h.join(' ')).toContain('G');
  });

  it('C1 — faz satırlarının toplamı "Program toplam" ile tutmuyor', () => {
    expect(kod(bozukla('| | D meta katman | 0/4 ⏳ |', '| | D meta katman | 1/4 ⏳ |'))).toContain('C1');
  });

  it('C2 — Kuruluş + Program bütçe satırını tutmuyor', () => {
    expect(kod(bozukla('TOPLAM 20 · YAPILAN 12', 'TOPLAM 20 · YAPILAN 13'))).toContain('C2');
  });

  it('C3 — bütçe satırındaki yüzde sayıya uymuyor', () => {
    expect(kod(bozukla('· %60)', '· %75)'))).toContain('C3');
  });

  it('B1 — bir fazın yapılanı toplamını aşıyor', () => {
    expect(kod(bozukla('| | D meta katman | 0/4 ⏳ |', '| | D meta katman | 9/4 ⏳ |'))).toContain('B1');
  });

  it('F3 — panoda olmayan bir faz tabloya eklenmiş', () => {
    expect(kod(bozukla('| **Program toplam** | | **6/14** |', '| | E arayüz | 0/2 ⏳ |\n| **Program toplam** | | **6/16** |'))).toContain('F3');
  });

  it('F2 — panonun Kuruluş fazları tablo satırıyla tutmuyor', () => {
    const d = pano();
    d.donemler[0].fazlar[0].yapilan = 1;
    d.donemler[0].fazlar[0].toplam = 1;
    expect(kod(denetle(progressOku(DEFTER), d).hatalar)).toContain('F2');
  });

  it('tablo imi sayıya uymuyorsa UYARIR ama yazmayı engellemez', () => {
    const s = denetle(progressOku(DEFTER.replace('| | D meta katman | 0/4 ⏳ |', '| | D meta katman | 0/4 ✅ |')), pano());
    expect(s.hatalar).toEqual([]);
    expect(s.uyarilar.join(' ')).toContain('D');
  });
});

describe('panoyaUygula — yalnız sayı yazar', () => {
  it('sayaçları, faz sayılarını, tarihi ve son kilometre taşını progress\'ten alır', () => {
    const d = pano();
    const p = progressOku(DEFTER.replace('YAPILAN 12 · %60', 'YAPILAN 13 · %65').replace('| | **C zincir ve denge** | **3/5 🔧** |', '| | **C zincir ve denge** | **4/5 🔧** |').replace('**6/14**', '**7/14**').replace('(3/5)', '(4/5)').replace('- ⏳ **C4 — bardak kilidi**', '- ✅ **C4 — bardak kilidi**'));
    expect(denetle(p, d).hatalar).toEqual([]);
    panoyaUygula(d, p, { tarih: '09.09.2026' });
    expect(d.yapilan).toBe(13);
    expect(d.donemler[1].fazlar.find((f: { k: string }) => f.k === 'C')).toMatchObject({ yapilan: 4, toplam: 5 });
    expect(d.guncelleme).toBe('09.09.2026');
  });

  it('ANLATIYA DOKUNMAZ — özet, faz açıklaması ve günlük kartları aynı kalır', () => {
    const d = pano();
    panoyaUygula(d, progressOku(DEFTER), { tarih: '09.09.2026' });
    expect(d.ozet).toEqual(PANO.ozet);
    expect(d.gunluk).toEqual(PANO.gunluk);
    expect(d.donemler[1].fazlar.map((f: { d: string }) => f.d)).toEqual(['anlatı', 'anlatı', 'anlatı', 'anlatı']);
  });

  it('son kilometre taşı bütçe toplamına oturur (73 → 76 düzeltmesinde geride kalmıştı)', () => {
    const d = pano();
    d.kilometre[1].at = 17;
    panoyaUygula(d, progressOku(DEFTER), {});
    expect(d.kilometre[1].at).toBe(20);
    expect(d.kilometre[0].at).toBe(6);
  });

  it('--simdi işareti tek fazda kalır', () => {
    const d = pano();
    panoyaUygula(d, progressOku(DEFTER), { simdi: 'C' });
    const fazlar = d.donemler[1].fazlar;
    expect(fazlar.filter((f: { durum?: string }) => f.durum === 'now').map((f: { k: string }) => f.k)).toEqual(['C']);
  });

  it('sayaç arttığı hâlde yeni günlük kartı yoksa uyarır', () => {
    const d = pano();
    d.yapilan = 13;
    expect(gunlukUyarisi(12, d, '09.09.2026')).toContain('günlük kartı yok');
    d.gunluk.unshift({ tarih: '09.09.2026', baslik: 'yeni kart' });
    expect(gunlukUyarisi(12, d, '09.09.2026')).toBeNull();
  });
});

describe('gerçek dosyalar', () => {
  const html = readFileSync('docs/pano/ilerleme-panosu.html', 'utf8');
  const p = progressOku(readFileSync('memory-bank/progress.md', 'utf8'));

  it('progress.md ile pano tutarlı — defter bozulursa bu test kırılır', () => {
    expect(denetle(p, panoOku(html).durum).hatalar).toEqual([]);
  });

  it('değişmemiş durum geri yazılınca pano BİREBİR aynı kalır (biçim kayması yok)', () => {
    expect(panoYaz(html, panoOku(html).durum)).toBe(html);
  });

  // D8: araç CRLF görünce "JSON bloğu bulunamadı" deyip panoyu yazmıyordu — ve bu İKİ kez oldu.
  // Sebep dosyanın içeriği değil, deponun `core.autocrlf=true` ayarı: her `git checkout` pano
  // dosyasını CRLF'e çeviriyor, yani tuzak kendi kendine geri kuruluyor. Araç artık satır
  // sonundan bağımsız; bu test onu kilitler (LF'e dönüş = kapanışın sessizce kırılması).
  it('CRLF satır sonlu pano da okunur ve BİREBİR geri yazılır', () => {
    const crlf = html.replace(/\r?\n/g, '\r\n');
    expect(panoOku(crlf).durum).toEqual(panoOku(html).durum);
    expect(panoYaz(crlf, panoOku(crlf).durum)).toBe(crlf);
  });

  // 2026-09-09: aracın yazma şartı "veri değişti mi"ydi ve pano elle düzenlenip BİÇİMİ kayınca
  // (JSON bloğunda `\uXXXX` kaçışları ile ham karakterler yan yana) araç "zaten güncel" deyip
  // çıkıyordu — veri aynı, bayt farklı, üstteki BİREBİR bekçisi kırmızı. Şart artık bayt
  // karşılaştırması; bu test kaymanın YAKALANABİLİR olduğunu kilitler.
  it('biçim kayması veri değişmeden de saptanır (kaçışlı JSON aracın çıktısına eşit değildir)', () => {
    const { durum, ham, onEk, sonEk } = panoOku(html);
    // Türkçe karakterleri \uXXXX'e çevirerek elle-düzenlenmiş panoyu taklit et.
    const kacisli = ham.replace(/[^\x00-\x7F]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
    const kaymis = html.replace(onEk + ham + sonEk, onEk + kacisli + sonEk);
    expect(kacisli).not.toBe(ham); // taklit gerçekten kaydı
    expect(panoOku(kaymis).durum).toEqual(durum); // VERİ aynı
    expect(panoYaz(kaymis, panoOku(kaymis).durum)).not.toBe(kaymis); // ama BAYT farklı → yazılmalı
    // ve aracın YAZMA KARARI bunu görmeli: veri değişmedi (degisen boş) ama dosya yazılmalı.
    expect(yazmaliMi(kaymis, panoYaz(kaymis, panoOku(kaymis).durum), [])).toBe(true);
  });

  it('yazma kararı: veri de bayt da aynıysa dosya YAZILMAZ', () => {
    expect(yazmaliMi(html, panoYaz(html, panoOku(html).durum), [])).toBe(false);
  });

  it('yazma kararı: veri değiştiyse bayt aynı olsa bile YAZILIR', () => {
    expect(yazmaliMi(html, html, ['bir sayı değişti'])).toBe(true);
  });

  it('tek sayı değişince diff de tek satır — anlatının korunduğu gözle görülebilir', () => {
    const { durum } = panoOku(html);
    durum.yapilan += 1;
    const yeni = panoYaz(html, durum).split('\n');
    const eski = html.split('\n');
    expect(yeni).toHaveLength(eski.length);
    expect(yeni.filter((s, i) => s !== eski[i])).toHaveLength(1);
  });
});
