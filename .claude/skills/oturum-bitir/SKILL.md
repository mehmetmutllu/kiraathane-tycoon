---
name: oturum-bitir
description: Köşe Kıraathanesi oturumunu güvenle kapatır — hafızayı günceller, testleri çalıştırır, commit + push yapar ve standart devam mesajını verir. Tetik: kullanıcı "oturumu bitir" / "oturum bitir" dediğinde veya anlamlı bir parça tamamlandığında.
---

# oturum-bitir — Oturum kapatma protokolü

Köşe Kıraathanesi projesinde oturumu temiz kapat. **Kapanışta YENİ metin yazılmaz** —
tur boyunca zaten yazıldı; burada yalnız yerine oturtulur (D-084, `docs/oturum-akisi-mantik.md`).

## Adımlar
1. **Hafıza — dört yer, her bilgi BİR kez:**
   - `memory-bank/progress.md` → aktif faza **1-2 satır**: `✅ <tur> — <tek cümle> · D-0xx ·
     docs/<rapor>.md · vitest <n>`. Anlatı yok, sayı yok (rapordadır).
   - `memory-bank/activeContext.md` → tur kartını **ÜZERİNE YAZ** (≤ 80 satır): şu an, tam
     sıradaki adım, açık kalemler. Eski turun anlatısı **taşınmaz, silinir** (git tutuyor).
   - `memory-bank/decisions.md` → yeni karar varsa `D-0xx`: karar cümlesi + **belirleyici 1-2 sayı**
     + gerekçe, **≤ 12 satır**, sonunda rapor linki. Sayı tablosu KOPYALANMAZ.
   - `docs/<konu>-raporu-<faz>.md` → sayılar, yöntem, tuzaklar, etki. **Tek kaynak budur.**
   Kalıcı tercih/ilke çıktıysa otomatik hafızaya (`~/.claude/projects/.../memory/`) — memory-bank'e
   kopyalanmaz.
2. **SIRA KİLİDİ KONTROLÜ** (D-084 §3.2): bu turda denge/tick değişmişse
   - raporda o kolun **§Bulgular sayı satırı** var mı?
   - ölçüm commit'i (#1) kod commit'inden (#2) **önce** mi?
   Değilse kullanıcıya söyle ve nedenini kayda geç — sessizce geçme.
3. **İLERLEME PANOSU** — `docs/pano/ilerleme-panosu.html`. Kaynak `memory-bank/progress.md`
   tablosudur; pano onun türevidir. (P3'ten sonra: `node tools/pano-guncelle.mjs`.)
   Elle yapılıyorsa tek `<script type="application/json" id="durum">` bloğunda: fazın `yapilan`+1 ·
   toplam `yapilan`+1 · `ozet` · `siradaki` · `gunluk` listesinin en üstüne yeni kart (progress
   satırının 3-4 cümlelik hâli) · `guncelleme` tarihi. **Başka hiçbir yerini elle değiştirme.**
   Sonra aynı dosya yoluyla yeniden yayınla (Artifact tool, `file_path` aynı; bağlantı değişmez):
   https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a
4. **Testler:** `npm run test` (vitest ~12 sn) + mümkünse duman testi (`node tools/smoke.mjs`).
   Başarısızsa düzelt ya da bilinen-bug olarak `progress.md`'ye yaz.
5. **Commit:** `git add -A && git commit -m "<anlamlı, kapsamı özetleyen mesaj>"`.
   Sırlar (.env vb.) commit'lenmez. Pre-commit hook hata verirse düzelt, yeni commit at.
6. **Push:** `git push` (ilk seferde gerekiyorsa `-u origin <branch>`).
7. **Bitiş mesajı (AYNEN):**
   `✅ Kaydedildi ve push'landı. Artık /clear yapıp yeni oturumda /kiraathane-devam ile devam edebilirsin.`

## Kurallar
- Kullanıcı açıkça istemedikçe force-push / reset --hard / amend yapma.
- Push uzak hata verirse net çözümü kullanıcıya söyle (auth, branch, çakışma).
- Bu protokol oturum SONUNU resmileştirir; ara commit'ler (#1/#2) tur içinde zaten atılır.
