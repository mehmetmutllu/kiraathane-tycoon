/**
 * duman.mjs — duman testinin KOŞUCUSU: sunucuyu kendi kaldırır, testi koşar, indirir.
 *
 * NEDEN: `tools/smoke.mjs` çalışan bir sunucuya bağlanıyordu ve onu ayağa kaldırmak ELLE
 * yapılıyordu (`npm run dev`, sonra ayrı terminalde `node tools/smoke.mjs`). Bu yüzden duman
 * testi 41 denetime çıktığı hâlde `package.json`'da yeri yoktu ve kapanış protokolünde
 * "mümkünse" diye geçiyordu. Faz E'nin kapısı tam olarak bu: **duman testi bağlı ve yeşil.**
 *
 * Koşu:  npm run duman                    (dev sunucusu — ÖLÇÜLEN taban budur, 41/41)
 *        DUMAN_MOD=preview npm run duman  (üretim derlemesi — `npm run build` gerektirir)
 *        DUMAN_PORT=4000 npm run duman    (port çakışırsa)
 *
 * TASARIM KARARLARI ve gerekçeleri:
 *
 * 1) SUNUCU `npx` ile DEĞİL, vite'ın kendi giriş dosyasıyla açılır. `npx`/`npm` bir kabuk
 *    süreci doğurur; Windows'ta `child.kill()` o kabuğu öldürüp TORUNU arkada bırakabilir ve
 *    port bir sonraki koşuda dolu kalır. Doğrudan `node .../vite.js` tek süreçtir, tek sinyalle
 *    kapanır.
 *
 * 2) PORT AYRI ve `--strictPort`. Geliştirici 5173'te kendi sunucusunu açık tutuyor olabilir;
 *    vite serbest bırakılsa sessizce 5174'e kayar ve duman testi **başka bir uygulamayı**
 *    ölçerdi. strictPort ile port doluysa koşu yeşil değil KIRMIZI olur — sessiz yanlış ölçüm,
 *    açık hatadan beterdir (D-084'ün damga mantığının aynısı).
 *
 * 3) VARSAYILAN dev sunucusu, preview değil. 41/41'lik taban dev sunucusunda ölçüldü; koşucuyu
 *    bağlarken kipi de değiştirmek, ölçülmemiş bir değişikliği "araç bağlama" işinin içine
 *    gizlemek olurdu. Üretim derlemesi ayrı bir kip olarak duruyor ve Faz F'de kapı olacak.
 *
 * 4) ÇIKIŞ KODU duman testinden gelir, sunucunun kapanışından değil: sunucu SIGTERM ile
 *    indirildiği için sıfırdan farklı bir kodla biter ve o kod sonucu maskelerdi.
 */
import { spawn } from 'node:child_process';
import { setTimeout as bekle } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Kip → vite alt komutu. `preview` üretim derlemesini sunar (önce `npm run build`). */
export function kipAyari(mod) {
  if (mod === 'preview') return { komut: 'preview', aciklama: 'uretim derlemesi (dist/)' };
  return { komut: 'dev', aciklama: 'gelistirme sunucusu' };
}

/** Port: elle verilebilir, yoksa 5173'ten AYRI bir port (bkz. tasarım kararı 2). */
export function portSec(env = {}) {
  const p = Number.parseInt(env.DUMAN_PORT ?? '', 10);
  return Number.isInteger(p) && p > 0 && p < 65536 ? p : 5199;
}

/** Koşucunun çıkış kodu: duman testinin kodu; o okunamadıysa 1 (bkz. tasarım kararı 4). */
export function cikisKodu(dumanKodu) {
  return typeof dumanKodu === 'number' ? dumanKodu : 1;
}

/**
 * Sunucunun yoklanacağı adres. **`localhost`, `127.0.0.1` DEĞİL** — bu bir stil tercihi değil,
 * koşucunun ilk hâlinde gerçekten yaşanan hata: vite `localhost`a bağlanıyor, o ad bu makinede
 * IPv6 `::1`e çözülüyor ve IPv4 yoklaması sunucu AYAKTAYKEN bağlantı reddi alıp
 * "ayağa kalkmadı" diyordu.
 */
export const adres = (port) => `http://localhost:${port}/`;

/**
 * Sunucuyu açan komut: çalıştırılacak dosya ve argümanlar. AYRI BİR FONKSİYON, çünkü bekçi
 * bunu dosya METNİNDE aramak zorunda kalmasın — ilk hâlinde tam o yüzden bir mutasyon kaçtı:
 * `--strictPort` yorumda da geçtiği için bayrak argümanlardan SİLİNDİĞİ hâlde metin araması
 * hâlâ buluyordu. Bekçi artık kodun ne YAZDIĞINI değil ne ÇALIŞTIRDIĞINI okuyor.
 */
export function sunucuKomutu(port, mod, kok = KOK) {
  return {
    dosya: process.execPath,
    argv: [
      path.join(kok, 'node_modules', 'vite', 'bin', 'vite.js'),
      kipAyari(mod).komut,
      '--port', String(port),
      '--strictPort',
    ],
  };
}

/**
 * Vite'ın "hazırım" satırı. Bu satır GERÇEK ÖLÇÜMDEN doğdu: `--strictPort`in yeterli olduğu
 * varsayılmıştı, port bilerek doldurulup sınandı ve **varsayım çürüdü** — koşu kırmızıya döndü
 * ama YANLIŞ sebeple. Yoklama, portu tutan YABANCI sunucunun 200'ünü "hazır" sanıyor, duman
 * testi başka bir uygulamaya bağlanıyor ve hata "canvas bulunamadı" diye görünüyordu. Yani
 * hata mesajı gerçek sebebi (port dolu) hiç söylemiyordu.
 *
 * Doğrusu: portu kimin tuttuğunu HTTP'ye sormak yerine **sunucunun kendisine** sormak. Vite
 * ayağa kalkınca stdout'a "ready in" yazar; kalkamazsa süreç ölür. İkisi de kesin sinyal.
 */
export const HAZIR_KALIBI = /ready in|Local:\s+http/i;

/**
 * Sunucunun kendi hazır sinyalini bekler. Dönüş: `'hazir'` · `'oldu'` (süreç kapandı) ·
 * `'zamanasimi'`. Süreç ölürse ANINDA döner — 60 saniye boşuna beklenmez.
 */
export function hazirSinyali(sunucu, { toplamMs = 60_000 } = {}) {
  return new Promise((coz) => {
    let bitti = false;
    const bir = (sonuc) => { if (!bitti) { bitti = true; clearTimeout(sayac); coz(sonuc); } };
    const sayac = setTimeout(() => bir('zamanasimi'), toplamMs);
    sunucu.stdout.on('data', (d) => { if (HAZIR_KALIBI.test(String(d))) bir('hazir'); });
    sunucu.on('exit', () => bir('oldu'));
  });
}

/** Sunucu bağlantı kabul ediyor mu — 200 dönene kadar yoklar. Süre dolarsa `false`. */
export async function sunucuyuBekle(url, { toplamMs = 60_000, araMs = 250, getir = fetch } = {}) {
  const son = Date.now() + toplamMs;
  while (Date.now() < son) {
    try {
      const r = await getir(url);
      if (r.ok) return true;
    } catch {
      // sunucu henüz dinlemiyor — yokla
    }
    await bekle(araMs);
  }
  return false;
}

/** Bu dosya doğrudan mı koşuyor (test dosyası import ettiğinde koşmasın)? */
const dogrudan = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (dogrudan) {
  const port = portSec(process.env);
  const url = adres(port);
  const { aciklama } = kipAyari(process.env.DUMAN_MOD);

  console.log(`duman: ${aciklama} · ${url}`);

  const { dosya, argv } = sunucuKomutu(port, process.env.DUMAN_MOD);
  const sunucu = spawn(dosya, argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  // Sunucunun kendi çıktısı sessiz kalır ama HATASI görünmeli: strictPort ihlali buradan okunur.
  sunucu.stderr.on('data', (d) => process.stderr.write(`  [vite] ${d}`));
  let sunucuOldu = false;
  sunucu.on('exit', (kod) => {
    sunucuOldu = true;
    if (kod !== 0 && kod !== null) console.error(`  [vite] sunucu ${kod} koduyla kapandi`);
  });

  const indir = () => { if (!sunucuOldu) sunucu.kill(); };
  process.on('exit', indir);
  process.on('SIGINT', () => { indir(); process.exit(130); });

  // ÖNCE sunucunun kendi sinyali (portu yabancı bir sunucu tutuyorsa burada yakalanır),
  // SONRA bağlantı yoklaması (sinyal ile dinlemeye başlama arasındaki payı kapatır).
  const sinyal = await hazirSinyali(sunucu);
  if (sinyal !== 'hazir') {
    console.error(
      sinyal === 'oldu'
        ? `duman: vite ayaga kalkamadan kapandi — port ${port} dolu olabilir (DUMAN_PORT ile degistir)`
        : `duman: vite ${url} adresinde zaman asimina ugradi`,
    );
    indir();
    process.exit(1);
  }

  const hazir = await sunucuyuBekle(url, { toplamMs: 15_000 });
  if (!hazir || sunucuOldu) {
    console.error(`duman: vite hazir dedi ama ${url} cevap vermiyor`);
    indir();
    process.exit(1);
  }

  const duman = spawn(process.execPath, [path.join(KOK, 'tools', 'smoke.mjs')], {
    cwd: KOK,
    stdio: 'inherit',
    env: { ...process.env, SMOKE_URL: url },
  });
  const kod = await new Promise((c) => duman.on('exit', c));

  indir();
  process.exit(cikisKodu(kod));
}
