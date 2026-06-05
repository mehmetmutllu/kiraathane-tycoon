# projectBrief — Köşe Kıraathanesi

## Oyun nedir
Üretim kalitesinde, mağazaya çıkacak **3D idle-tycoon** mobil oyun. Oyuncu bir Türk
kıraathanesinin (çayhane) sahibidir; mekânı sıfırdan büyütür: çay servisi, mutfak,
garsonlar, okey/tavla masaları, nargile terası.

## Çekirdek döngü
NPC (müşteri) gelir → boş masaya oturur → çay/ürün **sipariş** eder → garson (ya da
başta sahip) **taşır** → müşteri içer/öder → **para yere düşer** → oyuncu sahip
karakteriyle dolaşıp **parayı toplar** → para ile yükseltme/yeni istasyon alır →
satın-alma **pad'inde** bekleyip mekânı **büyütür**.

- **Saniyelik:** dolaş, para topla, sipariş ak.
- **Oturum:** birkaç yükseltme + 1-2 pad açılışı + bir prestige hedefine yaklaşma.
- **Uzun vade:** istasyon çeşitliliği, okey salonu, nargile terası, prestige (Renovasyon).

## Tür / Platform / Stil
- **Tür:** 3D idle / tycoon / management (Roblox-tycoon + Idle Miner DNA'sı).
- **Platform:** Mobil (Android öncelik, iOS). Web build geliştirme/test için.
- **Stil:** LOW-POLY STİLİZE, tek kaynaklı tutarlı sanat. Gerçekçiye kaçma.
- **Para:** ₺ Para (yumuşak) + 💎 Elmas (sert). Sayılar break_infinity Decimal.

## Hedef his
Sıcak, samimi bir mahalle kıraathanesi: semaver fokurdar, ince belli bardaklarda çay,
okey pulları takırdar, nargile fısıldar. Çocuk-güvenli, etik monetizasyon.

## Bu projenin çalışma biçimi
Çok-oturumlu. Her oturum `/kiraathane-devam` ile başlar, `oturum-bitir` protokolüyle
biter (docs güncelle → test → commit → push). Hafıza `/memory-bank/`'te.
