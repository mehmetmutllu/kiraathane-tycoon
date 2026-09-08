# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **D-084 P1+P2 BİTTİ** · Faz C 4/5 · Faz İA 2/3)

Son tamamlanan oyun turu: **C4 — bardak kilidi ölçüldü ve açıldı (D-083)**; garson boşta
bulaşık topluyor. Rapor: `docs/bardak-raporu-c4.md`.

Bu tur OYUN KODUNA DOKUNMADI. Kullanıcının *"oturumlar neden 2 saat sürüyor"* sorusu
Fable 5.1 tarafından **ölçülerek** yanıtlandı → `docs/oturum-akisi-mantik.md`; dört karar da
önerilen seçenekle onaylandı. Uygulananlar:
- **P1 — hafıza kesimi:** `memory-bank/arsiv/` · activeContext 4.219 → 61 satır tur kartı ·
  progress 1.952 → 73 satır · başlangıç okuma seti 150-350 KB → **9,7 KB** · iki skill +
  `CLAUDE.md` yeni sıraya göre yazıldı (varyant kapısı artık her oturumda otomatik yükleniyor).
- **P2 — `tools/olcum-lib.ts`:** ortak iskelet (tohum · sahte depo · biçimleyici · istatistik) +
  **üç damga** (bot yürüdü · korunum · varyant etkili) + `OLCUM=kisa|tam`. Üç araç bağlandı.
  Kısa koşu bardak **11,0 sn** · kuyruk **14,6 sn**; tam koşu çıktıları tabanla **birebir aynı**.
  Damga, C4 tuzağı ②'yi yeniden üretince yakaladı (çıkış kodu 1). Bekçi `tests/olcum-lib.test.ts`
  (10 test, iki mutasyonla doğrulandı).

## SIRADAKİ TAM ADIM

**P3 — kapanış otomasyonu** (½ oturum): `tools/pano-guncelle.mjs` (pano JSON'unu
`progress.md` tablosundan üretir; bugün hâlâ elle 6 adım) + `oturum-bitir`'e **sıra kilidi
kontrolü** (kod commit'i ölçüm commit'inden önceyse uyar).
Sonra **C5** yeni akışla; süre git damgalarıyla ölçülür ve `docs/oturum-akisi-mantik.md` §4
tahminiyle (168 → ~95 dk) karşılaştırılır — sapma > %15 ise mantık düzeltilir (P4).

**C5'in içeriği (değişmedi):** `simulate.ts`'i gerçeğe yaklaştırmak — taşıma modeli
(G4'te gerçekleşen %58, model ideal taşıyıcı varsayıyor) · masa yükseltmesi kalem kalem
(sahte 21,4 dk kapanır) · bardak döngüsü artık D-083'ü de saymalı · sabır.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- `servis L6` 23,4 dk beklemesi · D-046 ④ kaba hâlde, ⑤ yok · sipariş nesnesi v1.1'de.
- **Nav ızgarası ↔ oyuncu çarpışması aynı dünyayı görmüyor** (`actorRadius` sandalyesiz,
  `playerRadius` sandalyeler katı): personelin geçtiği boşluktan oyuncu geçemiyor. **Faz D.**
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski).
- `docs/olcum-bardak.txt` ve `docs/olcum-kuyruk.txt` D-083 ÖNCESİNDEN kalma; C5'in tam koşusu
  bunları tazeleyecek (bu turda bilerek dokunulmadı — kod değişmedi, sayı değişmedi).
- **Damgalar tam koşuda İKİ gerçek kusur yakaladı** (ikisi de C4'ten kalma, kod bu turda
  BİLEREK değiştirilmedi — ölçüm değişikliği kendi turunu ister):
  ① `iade:0.25` varyantı hiç tetiklenmemiş → C4 raporundaki "%25'te sıfır fark" satırı ölçüm
  değil totolojiymiş (`botRnd`'in sabit tohumunun ilk 12 çekilişi hep 0,25 üstü, B2'de tam 12
  bardak doğuyor). Düzeltme `docs/bardak-raporu-c4.md` §4'e yazıldı; **Bulgu 3'ün sonucu**
  **değişmedi** (%50 kolu gerçekten koştu ve kilidi açmadı).
  ② B1 · oyuncu kipi satırında bot **hiç yürümüyor** (0,0 br/dk). Taban çıktıda da yazıyordu
  (563 satırın içinde bir uyarı satırı); damga artık çıkış kodunu düşürüyor. C4 kararları
  `park` kipinden alındığı için karar etkilenmiyor, ama o satır ölçüm değil.

**Bekleyen denge kararı YOK.**

---

## TUR KARTI ŞABLONU (her yeni tur bunu doldurur, öncekinin üstüne)

```
SORU            : (tek cümle — bu tur neyi çözüyor)
ÖLÇÜLECEK KOLLAR: (varyant olarak ölçülecek seçenekler; kod YAZILMADAN)
SAYILAR         : (adım 2'den sonra dolar — rapor §Bulgular'a link)
KARAR           : (adım 3, kullanıcı seçer — D-0xx)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Sıra (D-084 §3.2) — ihlali commit yapısı engeller:**
`0 BAŞLA → 1 SORU (kart açılır) → 2 ÖLÇ → commit #1 (araç + ham çıktı + rapor, KARAR BÖLÜMÜ BOŞ)
→ 3 KARAR (tek karar paketi) → 4 UYGULA + bekçi + mutasyon + final tam koşu
→ commit #2 (kod + test + rapor tamam + D-0xx) → 5 KAPAT`

**Varyant kapısı:** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan denge değişikliği,
raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz.
