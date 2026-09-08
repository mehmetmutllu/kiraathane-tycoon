# progress — Durum Panosu

Durum: ✅ bitti · 🔧 devam · ⏳ bekliyor

> **Bu dosya kısa tutulur** (pano tablosu + aktif faz). Oturum başına **1-2 satır**;
> anlatı yok — sayı raporda, karar `decisions.md`'de, zaman çizelgesi git'te.
> Bitmiş fazların tam anlatısı: `memory-bank/arsiv/progress-tamamlanan.md`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## İLERLEME PANOSU — oturum sayacı
`docs/pano/ilerleme-panosu.html` · https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a
Bu tablo **kaynaktır**; pano JSON'u buradan **türetilir**: `npm run pano` (elle sayı yazılmaz).

**Oturum bütçesi (TOPLAM 76 · YAPILAN 63 · %83):**

| Dönem | Faz | Yapılan/Toplam |
|---|---|---|
| Kuruluş (5 Haz – 11 Ağu) | F0 planlama · F1 greybox · F2 servis · F2Q görev · F3 roller · F6 sanat · DN denetim | **28/28 ✅** |
| Yayın programı (1 Eyl →) | P plan ve maket | 6/6 ✅ |
| | G görsel taban | 4/4 ✅ |
| | A temizlik | 3/3 ✅ |
| | B model geçişi + maket taşıması | 13/13 ✅ |
| | **C zincir ve denge** | **5/5 ✅** |
| | İA iş akışı hızlandırma (D-084) | 3/3 ✅ |
| | D meta katman | 0/5 ⏳ |
| | E arayüz ve cila | 1/4 🔧 |
| | F paketleme ve yayın | 0/5 ⏳ |
| **Program toplam** | | **35/48** |

Kuruluş dönemi sayısı commit kaydından türetildi (114 commit / 14 çalışma günü); oturum-başı
defter tutmak yayın programıyla başladı. **Bütçe düzeltmesi 2026-09-08:** iş akışı hızlandırma
(D-084 P1-P3) üç kalemlik yeni faz olarak eklendi → toplam 73 → 76.

**v1 kapsam çizgisi:** prestij · Kat 2 · sipariş nesnesi · aktif WC döngüsü · dekor instancing
**v1.1'e**; v1 = Kat 1 + elmas/Usta + offline tavan + reklam/IAP + mağaza.

---

## Faz C — ZİNCİR VE DENGE (5/5) ✅
- ✅ **C1 — ölçü donduktan sonraki tek ölçüm (D-078)** · geometri dengeyi bozmadı (zincir +%0,8),
  "plato" bulgusu çürüdü, tempo denetiminin 3 ölçütü de ölçülür oldu · `docs/denge-raporu-c1.md`
  · vitest 463 · denge sayısı değişmedi.
- ✅ **D-079 — açılış temposu ölçütü bayat ilan edildi ve güncellendi** (yeni ölçüt: garsona kadar
  hiçbir alım boşluğu 2 dk'yı aşmaz; ölçülen 1,6 dk ✓) · `docs/denge-raporu-c1.md` §2.
- ✅ **C2 — Tek Odak'ın dördüncü kanalı (D-080)** · nokta silinmedi, ses katmanlandı: çizilen 16 →
  aynı anda konuşan en çok 3 · `docs/tek-odak-c2.md` · vitest 476 · denge sayısı değişmedi.
- ✅ **C3 — sipariş kuyruğu ölçüldü, üstlenme BAĞLAYICI oldu (D-081)** · servis G4 172→239,
  mesafe↔terk korelasyonu 0,53→0,24 · `docs/kuyruk-raporu-c3.md` · vitest 482 · denge sayısı değişmedi.
- ✅ **C4 — bardak kilidi ölçüldü ve açıldı (D-082 → D-083)** · boştaki garson bulaşık topluyor:
  B2 0,80 → 7,53 servis/dk, terk %33 → %5 · `docs/bardak-raporu-c4.md` · vitest 485 ·
  tek yeni denge sayısı `waiter.idleDishCarry: 1`.
- ✅ **C5 — sim gerçeğe yaklaştırıldı (D-086)** · dört model kusuru varyant olarak ölçüldü, ikisi
  girdi (taşıma çok duraklı + masa kalem kalem), üçü ölçülerek elendi. Model↔gerçek sapması
  **%36 → %8**, sahte masa beklemesi **21,4 → 4,5 dk** · `docs/sim-gercek-raporu-c5.md` ·
  bekçi `tests/sim-model.test.ts` (17 test, 3 mutasyon) · vitest 552 · **denge sayısı değişmedi.**
  Açılan kalem: gerçek modelde 20 dk ölçütü 6 kez ihlal (kendi turunu ister).

## Faz İA — İŞ AKIŞI HIZLANDIRMA (3/3) ✅ — D-084
- ✅ **P1 — mantık kuruldu + hafıza kesimi.** Fable 5.1 ölçtü: tam ölçüm koşusu 8 dk 02 sn × 7 =
  168 dk'nın %33'ü (önceki %15 tahmini çürüdü) · activeContext 96 "ŞU AN" bloğu / silme %13 ·
  C4'ün 11 anahtar sayısının 9'u dört dosyanın dördünde de var. Rapor `docs/oturum-akisi-mantik.md`.
  Uygulanan: `memory-bank/arsiv/` kesimi · activeContext → 61 satırlık tur kartı · progress → bu hâl ·
  iki skill güncellendi. Hedef 168 → ~95 dk.
- ✅ **P2 — `tools/olcum-lib.ts` + üç damga + `OLCUM=kisa|tam`.** Kısa koşu bardak **11,0 sn** ·
  kuyruk **14,6 sn** (tabanları 8-13 dk); tam koşu çıktısı tabanla **birebir aynı** (ikisi de).
  Damga C4 tuzağı ② yeniden üretilince yakaladı (3 damga, çıkış kodu 1). Bekçi
  `tests/olcum-lib.test.ts` (10 test, iki mutasyonla doğrulandı). Üç araç lib'e bağlandı.
  **Damgalar ilk tam koşuda iki GERÇEK kusur buldu:** `iade:0.25` varyantı hiç tetiklenmemiş
  (C4 raporu §4 düzeltildi; Bulgu 3'ün sonucu değişmedi) · B1 oyuncu kipinde bot hiç yürümüyor.
- ✅ **P3 — kapanış otomasyonu:** `npm run pano` (sayı progress tablosundan türer + defterin dört
  sayı yerini denetler) · `npm run sira` (varyant kapısının commit sırasını denetler, ihlalde
  çıkış 1). İkisi de `oturum-bitir` adım 2-3'e bağlandı. Bekçi `tests/pano-guncelle.test.ts` +
  `tests/sira-kilidi.test.ts` (40 test, **dokuz mutasyonla** doğrulandı) · sıra kilidi gerçek
  geçmişte sınandı (C3 turu temiz, C4 turu ihlal). Araç ilk koşusunda **üç gerçek sapma** buldu.

**Faz kapısı ÖLÇÜLDÜ (C5 turu, 2026-09-08):** 17:56Z → 18:27Z = **31 dk** (tahmin ~95 dk).
**Ama karşılaştırma birebir DEĞİL ve öyle sayılmamalı:** C4'ün 168 dakikasının üçte biri
tick-temelli tam koşulardı; C5'in aracı ANALİTİK (2 sn) ve gereken iki tick koşusu arkaplanda
PARALEL döndü. Yani kapı geçildi, fakat ~95 dk tahmini bu turla ne doğrulandı ne çürütüldü —
**asıl sınav tick-temelli bir denge turu.** Ölçülen gerçek kazançlar: üç dosyalık okuma seti
(oturum başı), uzun koşuların paralel arkaplanı, hazır ölçüm iskeleti.

## Bilinen açık kalemler
- **Geç-oyun eğrisi 20 dk ölçütünü ihlal ediyor** — D-086'nın açtığı kalem: model gerçeğe
  yaklaşınca Normal profilde aşan alım 2 → **6**, en uzun **43,4 dk** (`servis L6`; eski modelde
  23,4 görünüyordu). `economy.config.ts`'e dokunur → **kendi ölçüm turunu ister.**
- **Sim'in taşıma tavanı 4 masada fazla kötümser** (model 6,36 < ölçülen 7,53 müşteri/dk) —
  elenen `k3` bardak kolunun önündeki tek engel; kodu duruyor, bu kalem çözülünce yeniden ölçülür.
- **Nav ızgarası ↔ oyuncu çarpışması aynı dünyayı görmüyor** (`actorRadius` sandalyesiz,
  `playerRadius` sandalyeler katı) — **Faz D**.
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi — **Faz F riski**.
- Bundle ~1.17MB (three.js) — Faz F'de kod-bölme.
