# progress — Durum Panosu

Durum: ✅ bitti · 🔧 devam · ⏳ bekliyor

> **Bu dosya kısa tutulur** (pano tablosu + aktif faz). Oturum başına **1-2 satır**;
> anlatı yok — sayı raporda, karar `decisions.md`'de, zaman çizelgesi git'te.
> Bitmiş fazların tam anlatısı: `memory-bank/arsiv/progress-tamamlanan.md`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## İLERLEME PANOSU — oturum sayacı
`docs/pano/ilerleme-panosu.html` · https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a
Bu tablo **kaynaktır**; pano JSON'u buradan üretilir (P3'te `tools/pano-guncelle.mjs`).

**Oturum bütçesi (TOPLAM 75 · YAPILAN 60 · %80):**

| Dönem | Faz | Yapılan/Toplam |
|---|---|---|
| Kuruluş (5 Haz – 11 Ağu) | F0 planlama · F1 greybox · F2 servis · F2Q görev · F3 roller · F6 sanat · DN denetim | **28/28 ✅** |
| Yayın programı (1 Eyl →) | P plan ve maket | 6/6 ✅ |
| | G görsel taban | 4/4 ✅ |
| | A temizlik | 3/3 ✅ |
| | B model geçişi + maket taşıması | 13/13 ✅ |
| | **C zincir ve denge** | **4/5 🔧** |
| | **İA iş akışı hızlandırma** (D-084) | **1/2 🔧** |
| | D meta katman | 0/5 ⏳ |
| | E arayüz ve cila | 1/4 🔧 |
| | F paketleme ve yayın | 0/5 ⏳ |
| **Program toplam** | | **32/47** |

Kuruluş dönemi sayısı commit kaydından türetildi (114 commit / 14 çalışma günü); oturum-başı
defter tutmak yayın programıyla başladı. **Bütçe düzeltmesi 2026-09-08:** iş akışı hızlandırma
(D-084 P1-P3) iki oturumluk yeni kalem olarak eklendi → toplam 73 → 75.

**v1 kapsam çizgisi:** prestij · Kat 2 · sipariş nesnesi · aktif WC döngüsü · dekor instancing
**v1.1'e**; v1 = Kat 1 + elmas/Usta + offline tavan + reklam/IAP + mağaza.

---

## Faz C — ZİNCİR VE DENGE (4/5) 🔧
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
- ⏳ **C5 — sim'i gerçeğe yaklaştırmak:** taşıma modeli (G4'te gerçekleşen %58) · masa yükseltmesi
  kalem kalem · bardak döngüsü (D-083'ü de saymalı) · sabır. **İA P2-P3'ten sonra, yeni akışla.**

## Faz İA — İŞ AKIŞI HIZLANDIRMA (1/2) 🔧 — D-084
- ✅ **P1 — mantık kuruldu + hafıza kesimi.** Fable 5.1 ölçtü: tam ölçüm koşusu 8 dk 02 sn × 7 =
  168 dk'nın %33'ü (önceki %15 tahmini çürüdü) · activeContext 96 "ŞU AN" bloğu / silme %13 ·
  C4'ün 11 anahtar sayısının 9'u dört dosyanın dördünde de var. Rapor `docs/oturum-akisi-mantik.md`.
  Uygulanan: `memory-bank/arsiv/` kesimi · activeContext → 61 satırlık tur kartı · progress → bu hâl ·
  iki skill güncellendi. Hedef 168 → ~95 dk.
- ⏳ **P2 — `tools/olcum-lib.ts`** (1 oturum): ortak iskelet + üç damga + `OLCUM=kisa|tam`;
  kabul: kısa koşu < 60 sn, tam koşu çıktısı birebir aynı.
- ⏳ **P3 — kapanış otomasyonu** (½ oturum): `tools/pano-guncelle.mjs` + `oturum-bitir`'e sıra
  kilidi kontrolü (kod commit'i rapor commit'inden önceyse uyar).
- ⏳ **P4 — doğrulama:** C5 yeni akışla koşulur, süre git damgalarıyla ölçülür; sapma > %15 ise
  mantık düzeltilir.

## Bilinen açık kalemler
- **Nav ızgarası ↔ oyuncu çarpışması aynı dünyayı görmüyor** (`actorRadius` sandalyesiz,
  `playerRadius` sandalyeler katı) — **Faz D**.
- `servis L6` 23,4 dk beklemesi · D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi — **Faz F riski**.
- Bundle ~1.17MB (three.js) — Faz F'de kod-bölme.
