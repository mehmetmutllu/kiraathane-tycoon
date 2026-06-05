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
2. **Testler:**
   - `npm run test` (Vitest mantık testleri) — varsa.
   - Mümkünse Playwright MCP duman testi (sahne render hatasız mı, hareket, NPC ödeme,
     toplama, pad). Başarısızsa düzelt ya da bilinen-bug olarak `progress.md`'ye yaz.
3. **Commit:** `git add -A && git commit -m "<anlamlı, kapsamı özetleyen mesaj>"`.
   - Sırlar (.env vb.) commit'lenmez. Pre-commit hook hata verirse düzelt, yeni commit at.
4. **Push:** `git push` (ilk seferde gerekiyorsa `-u origin <branch>`).
5. **Bitiş mesajı (AYNEN):**
   `✅ Kaydedildi ve push'landı. Artık /clear yapıp yeni oturumda /kiraathane-devam ile devam edebilirsin.`

## Kurallar
- Kullanıcı açıkça istemedikçe force-push / reset --hard / amend yapma.
- Push uzak hata verirse net çözümü kullanıcıya söyle (auth, branch, çakışma).
- Dosyaları her anlamlı adımda da güncel tut; bu protokol oturum SONUNU resmileştirir.
