# F4c-4 — dekor yerinde önizleme + satın alma metinleri raporu

**Soru (kullanıcı 2026-09-25):** *"dekorları oyunda nasıl görünecek görse o an daha iyi olmaz mı uzak bir açıdan 21.
fotodaki gibi ama daha profesyonel · metinler üzerinde microcopy üzerinde çalışılması gerek, satın alımlar için olan
uyarılar çok boğuk geldi gözüme mesela 23'teki"* (kareler: https://claude.ai/artifact/WSH385msDgxYkCZUMbwbMj).

Denge dosyasına dokunmayan görsel/metin turu; ölçü = aday kareleri (feedback_show_dont_ask).
Karar paketi: https://claude.ai/artifact/Uysjk79bfpLWpP7r35ntQi

## Araçlar
- `tools/aday-dekor-f4c4.mjs` — gerçek sahne, ayrı kamera, önizleme kutusunun en-boyunda (720 × 660). 5 eşya × (boş · A oyun
  açısı uzak · B vitrin yakın · C vitrin uzak). Oyun kodu değişmez (tuval geçici boyutlanır, `gl.render` + `toDataURL`).
- `tools/aday-teklif-f4c4.mjs` — teklif kartı oyunun içinde yerinde değiştirilir (gerçek font/ışık/önizleme): T0 bugün · T1 · T2 · T3.
- `tools/shot-magaza-son.mjs` — mağaza turu (22 kare), bulguların kaynağı.

## Bulgular
| # | Bulgu | Kaynak |
|---|---|---|
| B1 | Oyun kamerası yuvaya odaklanınca dikey karenin ~yarısı dış çimene düşüyor (duvar kenarı) → oyun kamerası önizleme için uygun değil; ayrı kamera gerek | ilk aday turu |
| B2 | Vitrin açısı duvara dik bakınca yan duvar eşyasında kare boş duvar; duvar boyunca (güneyden) 3/4 bakınca oda karenin yarısı | ikinci aday turu |
| B3 | A (oyun açısı uzak) semaver/tablo'yu kutuda ~20-30 px boyda gösteriyor — okunmuyor | montaj |
| B4 | Teklif kartında 100 💎 = kartın en küçük yazılarından (p4); kıyafet gri cümle içinde; CTA'da yalnız fiyat | kare 23 |
| B5 | Satın alma sonrası geri bildirim YOK (bildirim/ses/ödül ekranı) — kart sessizce "Sahipsin" olur | `HUD.tsx` Paketler/ShopPanel |
| B6 | Paketler alt notu kesiliyor (yarım satır) | kare 13 |
| B7 | Kilitli dekorun düğmesi yeşil (yalnız soluk); satır ve düğme aynı cümle | kare 11 |
| B9 | Sabit mesafeli kadraj eşyayı kenarda/küçük bırakıyor (kullanıcı: "bazıları belli olmuyor ve ortalı değil") → OTOMATİK KADRAJ: çizilen gövdenin dünya kutusu ölçülür, kamera merkezine bakar, mesafe = boy / pay / (2·tan(fov/2)). 9 yuvanın hepsi ortada | `f4c4-oto-*` |
| B10 | Otomatik kadrajla da oyun açısı yan duvar eşyasını yandan görüyor (tablo görünmez, kare yarısı dışarı); çapraz açı 9/9 okunuyor | `f4c4-oto-*-oyun` ↔ `-capraz*` |
| B8 | 3 elmas paketi aynı adla ("Elmas"); "Mağaza hazır değil" sebep/çözüm söylemiyor | kare 13 |

## Kollar
- **Dekor (v2, otomatik kadraj):** A oyun açısı · B çapraz %30 · C çapraz %38 · D çapraz %45 (eşyanın ekranda dikey payı). Öneri C.
  (v1 kolları — sabit mesafe — B9 ile elendi; kareleri `f4c4-dekor-*`.)
  v3 (kullanıcı 2026-09-25: "çapraz uzak daha iyi, çok az daha uzak olabilir"): çapraz %30 · %25 · %22. %22'de lamba/kanarya
  çok inceliyor, duvar üstünden dış (çit/ağaç) kare tepesini kaplıyor. Öneri %25.
- **Teklif:** T1 büyük sayı · T2 iki karo · T3 ışıklı kart. Öneri T3 ("Bir kereye özel" → "Bir kez alınabilir").
- **Metin:** 14 satır eski → yeni (karar paketinde tablo). 14. satır yeni davranış (alım bildirimi + ses + paket ödül ekranı).

## §Karar (D-157 · kullanıcı 2026-09-25: "senin önerin olsun")
- **Dekor:** çapraz uzak **%25**, otomatik kadraj (çizilen gövdenin kutusu → merkez + mesafe), yuvasının salonu kapalıysa eski
  yalıtık vitrin. Önizleme = ana sahnenin ayrı kamerayla çekilmiş anlık görüntüsü (ikinci WebGL bağlamı yok).
- **Teklif:** T3, üst yazı "Bir kez alınabilir".
- **Metin:** 14 satırın hepsi. 14 = alım bildirimi (mağazanın üstünde) + satın alma sesi + paket ödül kartı.

## Uygulama
| Parça | Yer |
|---|---|
| Kadraj sayıları | `config/decor.ts` `DEKOR_KADRAJ` (fov 34 · pay 0,25 · yön tablosu) |
| Kadraj hesabı (saf) | `game/dekorKadraj.ts` |
| Önizleme eşyası geçici | `game/vitrin.ts` `cizilenDekor` · store `dekorOnizleme` (kayda girmez) |
| Çekim | `components/three/DekorCekimi.tsx` (tuvalin köşesine çiz → aynı görevde kopyala, 0,5 sn'de bir) |
| Mağaza kutusu | `ui/DekorOnizleme.tsx` `SalondaOnizleme` (kutunun kendi en/boy oranında çekim) |
| Teklif T3 + alım kartı | `ui/HUD.tsx` `BaslangicTeklifi` · `SatinOdulu` · `hud.css` (renk token, vurgu kenarlıkla) |
| Bildirim | `vitrin.ts` `satinBildirimi` · `rules.ts` `CIZILEN_TOAST` + `satin` · süre `cosmetics.bildirimSn` |
| Ses | `audio.ts` `alimSayisi` → `purchase` (işlenmiş işlem sayılır, geri yükleme sayılmaz) |
| B6 kesik not | `index.css` `.shop-card` eski `max-height 78vh + overflow` (iç içe iki kaydırma) kaldırıldı |
| B7 / Kaldır | `.shop-buy.kilitli` gri · `.shop-buy.notr` |
| Paket adları | `economy.config` `iap.diamondPackLabels` |

## Final (2026-09-25)
| Denetim | Sonuç |
|---|---|
| Bekçi | `tests/magaza-f4c4.test.ts` 24 test |
| Mutasyon | **12/12** (`tools/mutasyon-magaza-f4c4.mjs`) |
| Vitest | 1670/1670 |
| Duman | **67/67** (+2: alım bildirimi · önizleme salondan çekiliyor) — `DUMAN_PORT=4000` (5199 bu makinede takıldı) |
| Final kareler | `tools/shot-magaza-son.mjs` → `son-onizleme-*` (9 eşya mağazanın kendi kutusunda) · `son-*` 25 kare · konsol temiz |
| Bekçi güncellemesi | `ses.test` (yeni alan) · `iap-f4a` (kablo) · `ekran-kabugu` (4. modal: alım kartı) |

Not: bu turda Python ile yazılan dosyalar Windows'ta CRLF'e dönmüştü; bir kayıt bekçisi (`\n}\n` ile bölen) yanlış
blok okudu, dosyalar LF'e döndürüldü. Bekçinin bir kez kararsız düşmesi `kayitVerisi`nin `lastSaved: Date.now()`
alanındandı — test sabit saatle koşuyor.
