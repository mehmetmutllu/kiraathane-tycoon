# Sprint B planı — ChatGPT tasarım turu · küçük resimler · mikrometin

> Durum: **ONAYLANDI (2026-10-10)** — 5 ekran · ikonlar yeniden çizilir · ChatGPT Chrome'da girişli. Kaynak: `docs/tarama-raporu-2026-10-09.md` §0 · §6 · §7 · D-162.
> Düzen (hafıza `feedback_sprint_yontemi`): Claude orkestratör; tarayıcı (ChatGPT) işi TEK elden Claude'da,
> dosya üreten işler paralel Opus ajanlarında (commit yok, rapor ≤ 25 satır, ara not `docs/sprintler/sprint-B/<ajan>-notu.md`).
> **Bu sprint oyunun arayüz kodunu DEĞİŞTİRMEZ** (`HUD.tsx`, `hud.css`, `CharacterPanel.tsx` Sprint C'de). Çıktı: seçilmiş tasarım
> yönü + kesilmiş parça kiti + 38 küçük resim + gözden geçirilmiş metinler. Denge sayısına dokunulmaz.

## Neden bu kapsam
Tarama ölçtü: panellerin %90-97'si aynı mor, kart/zemin kontrastı 1,19:1 (ayrışma ≥ 1,5-3 ister), tek amber aksan her yerde,
alt bar ekranla aynı gradyan, kozmetik pulları çapraz iki renk (eşyayı anlatmıyor). Kullanıcının şikâyeti: "boğuk, her şey aynı ton,
neyin ne olduğu belli değil". Bunu kafadan düzeltmek yerine (D-106…D-110 denendi) **ChatGPT'ye çizdirip birebir kullanıyoruz**
(AI Dungeon yöntemi: Claude yorum katmaz; ChatGPT'nin HTML/CSS'i yalnız oran referansı).

## Fazlar

### Faz 1 — Envanter + ekran görüntüleri (ajan ①, paralel ②/③ ile)
- Betik `tools/ekran-envanter.mjs` (Playwright, dev kancaları): 390×844 ve 360×640, TR + EN → `docs/tasarim/sprint-B/ekranlar/*.png`
  + tek kontakt sayfası. Ekranlar: oyun içi HUD (görev bandı, cüzdan, alt bar) · Görevler · Hedefler · Mağaza (Kıyafet/Tepsi/Dekor/
  Masa/Zemin/Duvar/Paketler) · Çaycı paneli (oyuncu/garson/bulaşık) · Ayarlar · ödül modalı · video kartı · Usta modalı · Başlangıç
  teklifi · satın alma ödülü · öğretici · kafe adı kutusu · yükleme ekranı.
- Bileşen envanteri `docs/tasarim/sprint-B/envanter.md`: her ekrandaki parça (panel, sekme, düğme türleri, kart, fiyat hapı, ilerleme
  çubuğu, kilit, rozet, pul) + sayısı + en uzun TR/EN metni (uzunluk payı için).
- Ayrıca sıcak ahşap 3B sahnenin temiz bir görüntüsü (arayüzsüz): ChatGPT paleti sahneyle uyumlu seçsin.

### Faz 2 — ChatGPT yön turu (Claude, Chrome)
- İstem `docs/tasarim/sprint-B/istem-1-yon.md` (önce dosyaya, sonra ChatGPT'ye birebir). İçerik:
  - Oyun tarifi (Türk kıraathanesi, 3D arcade-idle; referans My Perfect Hotel · Burger Please · My Mini Mart; 2D idle'lar değil).
  - **Şikâyetler açıkça:** paneller boğuk / her şey aynı ton / neyin ne olduğu belli değil · alt bar kötü · çapraz iki renk pullar
    eşyayı anlatmıyor (yerine eşyanın küçük resmi gelecek) · önemli düğme öne çıkmıyor (her yerde aynı amber).
  - **Katı düzen kuralları:** tam ekran panel · geri sol üst / cüzdan sağ üst · dokunulan her şey ≥ 48 dp · boşluklar 8'in katı ·
    safe-area · TR+EN uzunluk payı (EN %30 uzun varsay) · büyük önizleme + tek satın al · emoji/CSS ikon yok · oyun fontu (Luckiest Guy
    başlık, gövde okunur font) · köşe/kenarlık/gölge/yazı ölçeği her yerde aynı.
  - **Palet ChatGPT'de:** 2-3 palet yönü iste; mor kalabilir ya da gidebilir (D-107 bu turda yeniden karara bağlanır).
  - **Alt bar ihtiyaca göre:** bugün 4 sekme (Görevler · Hedefler · Mağaza · Çaycı); yetiyorsa sayı korunur, yalnız tasarım yenilenir.
  - İstenen görsel: **5 ekran** — **Mağaza (Dekor sekmesi, küçük resimli kareler) · Görevler · oyun içi HUD + alt bar · Çaycı paneli · ödül penceresi**
    (tek resimde 3 + 2 telefon);
    altına ölçü (dp) / renk kodu / yarıçap / yazı boyu listesi. Her palet yönü için bir resim.
- Adaylar tek artifact panoda yan yana (okuma yüzeyi); **seçim sohbette** (hafıza `feedback_decision_surface`). Gerekirse 1 rötuş turu.

### Faz 3 — Parça sayfası + kesim (Claude ChatGPT'de · ajan ② betik)
- Seçilen yönde **macenta (#FF00FF) zeminli parça sayfası** istenir: panel, sekme seçili/seçisiz, alt bar sekmesi seçili/seçisiz,
  birincil/ikincil/devre dışı düğme, kart, fiyat hapı, ilerleme çubuğu (boş/dolu), kilit rozeti, bildirim noktası, kozmetik karesi
  boş/seçili/kilitli/uygulanan, modal çerçevesi, kapatma düğmesi.
- Ajan ② kesim betiği: AI Dungeon `F:\ai-dungeon\tools\icons\{s18_cut,key_magenta,slice}.py` uyarlanır → `tools/ui-kit/` (Python `-I`,
  rb/wb; CRLF tuzağı) → `public/assets/ui/kit/*.webp` + `MANIFEST.json` (9-slice kenar payları) + `public/assets/README.md` satırı.
- İkonlar YENİDEN çizdirilir (kullanıcı kararı): envanter (bugünkü `icons.tsx` seti) + stil cümlesi → 4×4 macenta ızgara → aynı betikle
  `public/assets/ui/ikon/*.webp`.

### Faz 4 — Kozmetik küçük resimleri (ajan ③, Faz 1 ile paralel)
- Betik `tools/kucuk-resim.mjs`: oyunun kendi çekimiyle (DekorCekimi/önizleme kadrajı) 38 kozmetiğin (kıyafet, tepsi, dekor, masa,
  zemin, duvar, kurucu) küçük resmi → `public/assets/thumbs/<tur>-<id>.webp` (toplam ≈ 0,3-0,5 MB, kare, şeffaf ya da tek zemin).
- Kırmızı kutu tuzağı: model yüklenmeden çekim yok (preload + yedek çizilirken bekle) — kutu fotoğraflanırsa betik HATA verir.
- Bekçi testi `tests/kucuk-resim.test.ts`: config'teki her kozmetiğin dosyası var, boyut sınırı aşılmıyor, fazlalık yok.
  (HUD'a bağlama Sprint C'de; bu sprintte yalnız dosyalar + bekçi.)

### Faz 5 — Mikrometin turu (Claude, ChatGPT)
- Liste `docs/metinler/sprint-B-mikrometin.md`: Sprint A'nın 13 yeni metni (mağaza sonuçları, kayıt sorunu notları, "Reklam şu an
  yüklenemedi", "Bekleniyor…", "Al"→"Claim") + çökme ekranı metinleri + EN öğreticide kesilen satır + görev bandı "0/1" metni.
- ChatGPT'ye: "UX yazarı gözüyle eleştirel bak, YALNIZ değişenleri JSON ver; TR 'sen' hitabı, EN sade; karakter sınırı X" → sonuç
  `i18n` dosyalarına Claude işler (bu, arayüz koduna değil metin sözlüğüne dokunur) + `npm run duman` EN.
- Ad her yerde **Tea House Tycoon** (D-159).

## Ajanlar (paralel; dosya sahipliği ayrı)

| Ajan | İş | SENİN dosyaların | DOKUNMA | Kabul ölçütü |
|---|---|---|---|---|
| **① Envanter** | Faz 1 | `tools/ekran-envanter.mjs` · `docs/tasarim/sprint-B/ekranlar/**` · `envanter.md` | `src/**` | 2 boyut × 2 dil × listedeki her ekran PNG; kontakt sayfası ≤ 1600 px; konsol hatası 0 |
| **② Kit kesimi** | Faz 3 betiği (parça sayfası gelince çalışır; önce örnek macenta görselle sınanır) | `tools/ui-kit/**` · `public/assets/ui/kit/**` · README satırı | `src/**` | her parça ayrı dosya, kenarda macenta sızıntısı yok (alfa kenarı denetimi), MANIFEST 9-slice payları dolu |
| **③ Küçük resim** | Faz 4 | `tools/kucuk-resim.mjs` · `public/assets/thumbs/**` · `tests/kucuk-resim.test.ts` | `HUD.tsx` · `hud.css` · store/tick | 38/38 dosya; kırmızı kutu 0; toplam ≤ 0,5 MB; bekçi ≥ 2 mutasyonla doğrulanır |

**Claude'da kalan:** Chrome/ChatGPT (Faz 2, 3'ün istemi, 5) · aday panosu artifact · `i18n/*` · karar kaydı (D-164) · defter.

## Sprint sonu kabul (senin göreceğin)
- Panoda 2-3 palet yönü yan yana; birini seçtin, seçilen yönün parça kiti klasörde.
- Mağaza pulları yerine gerçek küçük resimler hazır (panoda 38'inin hepsini görürsün; oyuna bağlanması Sprint C).
- Yeni metinlerin ChatGPT'den geçmiş hâli oyunda (TR + EN).
- Defter `sprint-B-defter.md`: ne üretildi, nerede, Sprint C'de nasıl bağlanacak.

## Sprint B'nin DIŞINDA
- Arayüz kodunun yeniden yazımı (Sprint C) · P4 saat hilesi · perf Paket 2/3 · iOS 1.0.1 gönderimi (inceleme bitmeden yok).
- Daha önce reddedilenler tekrar önerilmez: dağınık sikke, banner, havada buton, katı ızgara yerleşim, emoji ikon.

## Riskler
- ChatGPT görsel hakkı dolabilir → bildirim + hesap değişimi sende (tur yarıda kalmaz, kaldığı istemden sürer).
- ChatGPT parça sayfasında oranları kaydırabilir → kesimde ölçü listesi esas, görsel yalnız doku.
- Kit 9-slice'a uymayan parça (ör. gölgeli kart) → Sprint C'de CSS ile kurulur, defterde işaretlenir.

## Toplu sorular — cevaplandı (2026-10-10)
1. ChatGPT Chrome'da girişli. 2. 5 ekran (Çaycı paneli + ödül penceresi dahil). 3. İkonlar yeniden çizdirilir.
