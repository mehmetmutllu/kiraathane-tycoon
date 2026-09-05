---
name: oturum-bitir
description: Köşe Kıraathanesi oturumunu güvenle kapatır — hafızayı günceller, testleri çalıştırır, commit + push yapar ve standart devam mesajını verir. Tetik: kullanıcı "oturumu bitir" / "oturum bitir" dediğinde veya anlamlı bir parça tamamlandığında.
---

# oturum-bitir — Oturum kapatma protokolü

Köşe Kıraathanesi projesinde oturumu temiz kapat. Sırayla:

## Adımlar
1. **Hafızayı güncelle:**
   - `memory-bank/progress.md` — biten alt görevleri ✅, devam edeni 🔧, bilinen bugları yaz,
     sıradaki kilometre taşını netle.
   - `memory-bank/activeContext.md` — ŞU AN, en son yapılan, TAM sıradaki adım, açık sorular.
   - Yeni karar verildiyse `memory-bank/decisions.md`.
2. **İLERLEME PANOSUNU GÜNCELLE** — `docs/pano/ilerleme-panosu.html`.
   Sayfanın tamamı dosyanın içindeki tek `<script type="application/json" id="durum">` bloğundan
   üretilir; **başka hiçbir yerini elle değiştirme.** Sırayla:
   1. bu oturumun ait olduğu fazın `yapilan` değerini +1
   2. üstteki `yapilan` toplamını +1
   3. `ozet` bloğunu bu oturumun işiyle değiştir
   4. `siradaki` bloğunu bir sonraki oturumun işiyle yeniden yaz
   5. `gunluk` listesinin **en üstüne** yeni satır ekle (tarih, etiket, baslik, govde, maddeler, not)
   6. `guncelleme` tarihini değiştir
   Sonra **aynı dosya yoluyla yeniden yayınla** (Artifact tool, `file_path` aynı) — bağlantı değişmez:
   https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a
   Oturum bütçesi ve faz tablosu: `memory-bank/progress.md` "İLERLEME PANOSU" bölümü.
3. **Testler:**
   - `npm run test` (Vitest mantık testleri) — varsa.
   - Mümkünse Playwright MCP duman testi (sahne render hatasız mı, hareket, NPC ödeme,
     toplama, pad). Başarısızsa düzelt ya da bilinen-bug olarak `progress.md`'ye yaz.
4. **Commit:** `git add -A && git commit -m "<anlamlı, kapsamı özetleyen mesaj>"`.
   - Sırlar (.env vb.) commit'lenmez. Pre-commit hook hata verirse düzelt, yeni commit at.
5. **Push:** `git push` (ilk seferde gerekiyorsa `-u origin <branch>`).
6. **Bitiş mesajı (AYNEN):**
   `✅ Kaydedildi ve push'landı. Artık /clear yapıp yeni oturumda /kiraathane-devam ile devam edebilirsin.`

## Kurallar
- Kullanıcı açıkça istemedikçe force-push / reset --hard / amend yapma.
- Push uzak hata verirse net çözümü kullanıcıya söyle (auth, branch, çakışma).
- Dosyaları her anlamlı adımda da güncel tut; bu protokol oturum SONUNU resmileştirir.
