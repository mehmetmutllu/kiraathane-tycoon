# ① Envanter ajanı — ara not (2026-10-10)

- Betik: `tools/ekran-envanter.mjs` → sunucu duman.mjs kalıbıyla (doğrudan `vite.js`, `--port 5301 --strictPort`, "ready in" sinyali;
  `npx` değil — Windows'ta torun süreç portu tutabilir). Dil = tarayıcı `locale` (tr-TR / en-US; i18n `settings.dil` 'oto').
- İlk koşu 390×844-EN'de "Execution context was destroyed" ile düştü: vite ilk koşuda bağımlılık ön-derlemesi yapıp sayfayı
  yeniden yükledi. İkinci koşu temiz (bağımlılıklar önbellekte). Yeni makinede ilk koşu düşerse bir kez daha koş.
- 4 kombinasyon × 22 ekran = 88 PNG + `sahne-temiz.png` + `sahne-temiz-genis.png`. Ulaşılamayan ekran YOK.
- Konsol hatası: 0 (dört kombinasyonda da). Uyarı: `THREE.Clock deprecated` (vite konsolu, hata değil).
- İlerleme: duman omurgası (q_table2 … q_dish) → 7 masa, 2. Salon, garson + bulaşıkçı; cüzdan 48.250 ₺ / 140 💎, xp ≥ 4000 (Seviye 8).
- Çekim kusurları (ekranın kendisi doğru, durum zayıf):
  · `video`: "İzle" devre dışı, ödül +0 — sarılmış zamanda son dakika kazancı (`gelirIzi`) boş kalıyor.
  · `kafe-adi`: arkadaki sahne henüz koyu (ilk karelerde çekildi).
  · `magaza-masa`: kilitli hâl (tüm salonlar + son seviye masa gerekir); açık Masa sekmesi çekilmedi.
  · Paketler fiyat düğmeleri dev'de "Test" yazar (sahte mağaza) — gerçek fiyat metni yok.
  · Ayarlar ve Görevler panelleri kaydırılır; görüntü yalnız ilk ekranı gösterir (sayım tüm içerikten).
- Ham sayım: `docs/sprintler/sprint-B/envanter-ham.json` (sınıf histogramı, düğme türleri, en uzun 3 metin; 390×844 TR+EN).
