/**
 * music.ts — ARKA PLAN MÜZİĞİ: parçanın künyesi ve ÖLÇÜLMÜŞ seviyesi (S9 · D-122 kol O5).
 *
 * NEDEN AYRI DOSYA — ve neden `audio.ts`in içinde değil:
 * `audio.ts` bir OLAY motoru. Dokuz sesin tamamı tek atış, durumun farkından türetiliyor ve
 * hiçbiri döngüye girmiyor (S17 §6: "katalogda 9/9 ses tek atış, döngü alanı 0"). Müzik bunun
 * hiçbir özelliğini paylaşmıyor: bir olaydan doğmuyor, sürekli çalıyor, kendi ayarı var.
 * İkisini aynı katalogda toplamak `SesTanim`ı iki farklı şeye hizmet ettirmek olurdu.
 *
 * NEDEN UĞULTU DEĞİL MÜZİK: ilk tasarım bir kalabalık uğultusuydu (O1) ve ölçülmüştü; kullanıcı
 * reddetti — *"uğultu da hiç olmasın"* — ve yerine bir tycoon arka planı istedi. Uğultunun
 * ölçüsü (yatak RMS ≤ 0,0095) çöpe gitmedi: aşağıdaki TAVAN aynı kuralın müzikteki karşılığı.
 */

/** Bir arka plan parçasının künyesi + ölçülmüş seviyesi. */
export interface MuzikParca {
  /** `public/` altındaki yol. Dosya yoksa müzik SESSİZCE çalmaz — oyun tam oynanır. */
  dosya: string;
  /** Künye: eser · sanatçı · lisans. `public/assets/README.md` ile birebir aynı olmak zorunda. */
  kunye: string;
  /**
   * ÖLÇÜLMÜŞ TAVAN KAZANÇ (doğrusal, 0..1). Dokuz olay sesinin HEPSİNİ kendi baskın bandında
   * +12 dB üstte tutan EN YÜKSEK müzik seviyesi — `docs/olcum-muzik-s9.txt` §3.
   *
   * Bu bir zevk ayarı değil, bir SINIR: üstüne çıkıldığı anda müzik oyuncunun kendi eyleminin
   * geri bildirimini (para topladı, çay aldı, seviye atladı) örtmeye başlar. Oyuncunun slider'ı
   * bu tavanın ALTINI gezer; 1 = tam olarak burası.
   */
  tavan: number;
  /** Döngü boyu (sn) — künye ve teşhis için; çalma dosyanın kendi boyunu kullanır. */
  dongu: number;
}

/**
 * SALON MÜZİĞİ. 23 aday ölçüldü (`docs/ses-raporu-s17.md` §Bulgular B16-B21) ve bu parça
 * DİKİŞİYLE seçildi: baş/son seviye farkı **+0,2 dB** — kataloğun en tutarlısı. Ölçümün
 * birincisi (Troubadeck 04) daha az kısılıyordu (−18,0 dB) ama sonu başından **7,4 dB alçak**,
 * yani her 40 saniyede bir duyulur bir sıçrama üretiyordu. Bir kerelik 4,4 dB'lik kısma payı,
 * tekrarlayan bir kusura tercih edildi.
 */
export const SALON_MUZIGI: MuzikParca = {
  dosya: '/assets/audio/muzik_salon.ogg',
  kunye: 'Sketchbook 2024-01-24_02 — Abstraction (Tallbeard Studios), CC0 1.0',
  // -22,4 dB  →  10^(-22,4/20)
  tavan: 0.0759,
  dongu: 56,
};

/** Oyuncunun seçtiği seviye (0..1) ile ölçülmüş tavanı birleştirir. Tavanın üstüne ÇIKILMAZ. */
export const muzikKazanci = (parca: MuzikParca, seviye: number): number =>
  parca.tavan * Math.min(1, Math.max(0, seviye));

/** Müziğin tarayıcıya bakan yüzü. Testte sahtesi verilir — `jsdom`da WebAudio yok. */
export interface MuzikArkaUc {
  /** Döngüyü başlat (zaten çalıyorsa hiçbir şey yapma). */
  basla(yol: string, kazanc: number): void;
  /** Döngüyü durdur ve kaynağı bırak. */
  dur(): void;
  /** Çalarken seviyeyi değiştir — yeniden başlatmadan. */
  kazanc(v: number): void;
  readonly caliyor: boolean;
}

export interface MuzikMotoru {
  /** Ayarları yansıt. `acik` = `settings.music`, `seviye` = `settings.musicVolume`. */
  ayarla(acik: boolean, seviye: number): void;
  /** Tarayıcı ses kilidi açıldı — bu ana kadar müzik başlatılmaz. */
  kilidiAc(): void;
  readonly caliyor: boolean;
}

/**
 * Müzik motoru. Üç kelepçe, üçü de `audio.ts`inkilerle aynı gerekçeye sahip:
 *
 *  1. AYAR — `settings.music` kapalıysa müzik hiç başlamaz. Bu anahtar S10'dan beri kayıtta
 *     duruyordu ve HİÇBİR ŞEYE BAĞLI DEĞİLDİ; bağlandığı yer burası.
 *  2. KİLİT — tarayıcı kullanıcı dokunmadan ses çalmaz. Müzikte bu daha sert: bir döngü
 *     "sessizce düşmez", askıda kalır. Kilit açılana kadar başlatılmıyor.
 *  3. SEVİYE 0 — slider dibe çekilince döngü DURDURULUYOR, kazancı 0'a inmiyor. Sessiz bir
 *     döngüyü arka planda döndürmek pil yakar; oyuncu sesi açınca yeniden başlar.
 */
export function muzikMotoruKur(
  arkaUc: MuzikArkaUc,
  parca: MuzikParca,
  acik: boolean,
  seviye = 1,
): MuzikMotoru {
  let aktif = acik;
  let ses = Math.min(1, Math.max(0, seviye));
  let kilitli = true;

  const esitle = (): void => {
    const calmali = aktif && !kilitli && ses > 0;
    if (calmali && !arkaUc.caliyor) arkaUc.basla(parca.dosya, muzikKazanci(parca, ses));
    else if (!calmali && arkaUc.caliyor) arkaUc.dur();
    else if (calmali) arkaUc.kazanc(muzikKazanci(parca, ses));
  };

  return {
    get caliyor() { return arkaUc.caliyor; },
    kilidiAc() {
      if (!kilitli) return;
      kilitli = false;
      esitle();
    },
    ayarla(v: boolean, yeniSeviye: number) {
      const oncekiAktif = aktif;
      const oncekiSes = ses;
      aktif = v;
      ses = Math.min(1, Math.max(0, yeniSeviye));
      // Hiçbir şey değişmediyse dokunma: abonelik her karede çağırıyor ve her karede
      // `kazanc()` yazmak gereksiz WebAudio trafiği üretir.
      if (oncekiAktif === aktif && oncekiSes === ses) return;
      esitle();
    },
  };
}
