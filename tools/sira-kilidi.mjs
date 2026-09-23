/**
 * sira-kilidi.mjs — VARYANT KAPISININ COMMIT SIRASINI MAKİNE DENETLER (D-084 P3).
 *
 * NEDEN: D-084'ün ana bulgusu şuydu — *"önce ölç, sonra karar sor"* kuralı bir tur önce koda
 * YAZILI OLARAK girmişti ve yine ihlal edildi (bir seçenek önce uygulandı, sonra ölçüldü, sonra
 * geri alındı; bir tam tur boşa gitti). Sorun kuralın bilinmemesi değil, kuralın hiçbir şeyi
 * ENGELLEMEMESİYDİ. P3'ün işi: kuralı denetleyen bir şey koymak.
 *
 * KURAL (D-084 §3.2): denge dosyasına dokunan ilk commit'ten ÖNCE, aynı menzilde, ölçüm çıktısı
 * taşıyan (ve dengeye dokunmayan) bir commit bulunmak zorundadır.
 *   commit #1 → araç + ham çıktı + rapor (KARAR BÖLÜMÜ BOŞ)
 *   commit #2 → kod + test + rapor tamam + D-0xx        ← dengeye burada dokunulur
 *
 * Araç yalnız SIRAYI denetler; raporda o kolun sayı satırı olup olmadığını denetleyemez —
 * o insanın işi. Bu yüzden çıktı, bakılacak rapor dosyalarını da adıyla basar.
 *
 * DOĞRULANDIĞI GERÇEK GEÇMİŞ (tests/sira-kilidi.test.ts):
 *   C3 turu (3c396db ölçüm → 6fbac30 kod)  → TEMİZ
 *   C4 turu (df7ddee: ölçüm + kod aynı commit'te) → İHLAL  ← D-084'ün doğduğu tur
 *
 * İKİ YANLIŞ POZİTİF DESENİ KAPANDI (D-144 · T9a — sekiz turda alarm doğru sırayı suçluyordu):
 *   ① commit #1 karar paketinden önce push'lanıyor → kapanıştaki `@{upstream}..HEAD` menzili onu
 *     görmüyordu, commit #2 "karma" sayılıyordu. Çare: menzilden GERİYE bakılır (`oncesi`) — durak
 *     son denge commit'i ya da §Karar'ı dolu bir rapor (önceki tur kapanışı); arada §Karar'ı BOŞ
 *     bir commit varsa o bu turun commit #1'idir.
 *   ② commit #1 `tick.ts`e ölçüm DİKİŞİ koymak zorunda (kollar dosyaya yazılmadan ölçülür). Ayırt
 *     edici işaret protokolün kendisi: raporun §Karar bölümü BOŞ. Böyle bir commit'te `tick.ts` /
 *     `rules.ts` dokunuşu dikiş sayılır (davranış-nötr olmalı — parmak izi insanın işi); ama
 *     `economy.config.ts` sayısı dikiş olamaz, orada karma ihlal yine yakalanır.
 *
 * KULLANIM
 *   node tools/sira-kilidi.mjs                       # push'lanmamış commit'ler (oturumun kendisi)
 *   node tools/sira-kilidi.mjs --menzil=A..B         # geçmiş bir turu denetle
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Denge = bu üç dosya. Buraya dokunan commit "kod commit'i"dir (CLAUDE.md · varyant kapısı). */
export const DENGE_DOSYALARI = [
  'src/config/economy.config.ts',
  'src/game/tick.ts',
  'src/game/rules.ts',
];

/** Ölçüm izi = araç, ham çıktı, rapor. Bunlardan biri değişmişse commit ölçüm taşıyor. */
export const OLCUM_KALIPLARI = [
  /^tools\/olcum-.*\.ts$/,
  /^docs\/olcum-.*\.txt$/,
  /^docs\/.*raporu.*\.md$/,
];

/** Dikiş olamayan denge dosyası: sayı sayıdır. */
const SAYI_DOSYASI = 'src/config/economy.config.ts';

/**
 * `kararBos`: commit'teki raporlardan birinin §Karar bölümü boş mu (commit #1'in imzası).
 * Öyleyse `tick.ts`/`rules.ts` dokunuşu `dikis`e ayrılır, denge sayılmaz.
 */
export function sinifla(dosyalar, { kararBos = false } = {}) {
  const denge = dosyalar.filter((d) => DENGE_DOSYALARI.includes(d));
  const dikis = kararBos ? denge.filter((d) => d !== SAYI_DOSYASI) : [];
  return {
    denge: denge.filter((d) => !dikis.includes(d)),
    dikis,
    olcum: dosyalar.filter((d) => OLCUM_KALIPLARI.some((r) => r.test(d))),
  };
}

/** Rapor metninde `§Karar` başlığının altındaki ilk satır "(boş" ile mi başlıyor. */
export function kararBolumuBos(metin) {
  const m = /^#+\s*§Karar[^\n]*\n+([^\n]*)/m.exec(metin);
  return !!m && /^[_*]*\(?\s*boş/i.test(m[1].trim());
}

/**
 * `commitler` ESKİDEN YENİYE sıralı: `[{ sha, konu, dosyalar }]`.
 * `calismaAgaci`: henüz commit'lenmemiş dosyalar (kapanış commit'ine gidecekler).
 */
export function siraDenetle(commitler, { calismaAgaci = [], calismaKararBos = false, oncesi = [] } = {}) {
  const kayit = commitler.map((c) => ({ ...c, ...sinifla(c.dosyalar, c) }));
  const ca = sinifla(calismaAgaci, { kararBos: calismaKararBos });
  if (ca.denge.length || ca.olcum.length) {
    kayit.push({ sha: '(commit edilmemiş)', konu: 'çalışma ağacı — kapanış commit\'ine gidecek', dosyalar: calismaAgaci, ...ca });
  }

  const ilk = kayit.findIndex((k) => k.denge.length);
  if (ilk === -1) {
    return { durum: 'temiz', sebep: 'menzilde denge dosyasına dokunan commit yok — varyant kapısı devrede değil', kayit, ihlaller: [], raporlar: [] };
  }

  const dengeCommit = kayit[ilk];
  // Kural tek: İLK denge commit'inden önce bir ölçüm commit'i olmalı. "İlk" olması şart —
  // ondan öncekiler tanım gereği dengeye dokunmaz, yani ayrıca elemeye gerek yok. Ölçümü ve
  // kodu aynı commit'e koymak da bu kurala takılır: o commit kendinden önce gelemez.
  // `oncesi`: menzilden önce, son denge commit'ine kadar olanlar (push'lanmış commit #1 burada).
  const oncekiOlcum = [
    ...oncesi.map((c) => ({ ...c, ...sinifla(c.dosyalar, c) })).filter((k) => k.kararBos && !k.denge.length),
    ...kayit.slice(0, ilk).filter((k) => k.olcum.length),
  ];
  const ihlaller = [];
  if (!oncekiOlcum.length) {
    ihlaller.push({
      tip: dengeCommit.olcum.length ? 'karma-commit' : 'olcum-yok',
      sha: dengeCommit.sha,
      konu: dengeCommit.konu,
      aciklama: dengeCommit.olcum.length
        ? `${dengeCommit.sha} ölçüm çıktısıyla kodu AYNI commit'e koymuş (${[...dengeCommit.olcum, ...dengeCommit.denge].join(', ')}) — raporun karar bölümü boş olamazdı`
        : `${dengeCommit.sha} dengeye dokunuyor (${dengeCommit.denge.join(', ')}) ama menzilde ondan önce gelen bir ölçüm commit'i yok`,
    });
  }

  const raporlar = [...new Set(kayit.flatMap((k) => k.olcum).filter((d) => /raporu.*\.md$/.test(d)))];
  return { durum: ihlaller.length ? 'ihlal' : 'temiz', sebep: null, kayit, ihlaller, raporlar, dengeCommit, oncekiOlcum };
}

// ---------------------------------------------------------------------------
// git okuma
// ---------------------------------------------------------------------------
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });

const raporMu = (d) => /raporu.*\.md$/.test(d);

function commitOku(sha, konu) {
  const dosyalar = git('show', '--name-only', '--format=', sha).split('\n').map((x) => x.trim()).filter(Boolean);
  const kararBos = dosyalar.filter(raporMu).some((d) => {
    try { return kararBolumuBos(git('show', `${sha}:${d}`)); } catch { return false; }   // silinmiş dosya
  });
  return { sha, konu, dosyalar, kararBos };
}

const logOku = (...a) => git('log', '--format=%h %s', ...a).split('\n').filter(Boolean).map((s) => {
  const bosluk = s.indexOf(' ');
  return commitOku(s.slice(0, bosluk), s.slice(bosluk + 1));
});

export function menzilOku(menzil) {
  return logOku('--reverse', menzil);
}

/**
 * Menzilin başından geriye — eskiden yeniye. Durak: denge commit'i ya da §Karar'ı DOLU bir rapora
 * dokunan commit (önceki tur orada kapandı; onun commit #1'i bu tura sayılmaz).
 */
export function oncesiOku(menzil, sinir = 30) {
  const oncesi = [];
  for (const c of logOku(`-${sinir}`, menzil.split('..')[0])) {
    if (sinifla(c.dosyalar, c).denge.length || (c.dosyalar.some(raporMu) && !c.kararBos)) break;
    oncesi.unshift(c);
  }
  return oncesi;
}

export function calismaAgaciOku() {
  const cikti = git('status', '--porcelain');
  return cikti.split('\n').filter(Boolean).map((s) => s.slice(3).split(' -> ').pop().trim().replace(/^"|"$/g, ''));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tools/sira-kilidi.mjs')) {
  const arg = (ad) => {
    const b = process.argv.find((a) => a.startsWith(`--${ad}=`));
    return b ? b.slice(ad.length + 3) : null;
  };
  let menzil = arg('menzil');
  let calismaAgaci = [];
  let calismaKararBos = false;
  if (!menzil) {
    let uzak;
    try { uzak = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}').trim(); }
    catch { console.error('Uzak dal yok — menzil belirlenemedi. `--menzil=A..B` verin.'); process.exit(1); }
    menzil = `${uzak}..HEAD`;
    calismaAgaci = calismaAgaciOku();      // kapanışta henüz commit'lenmemiş kod da sayılır
    calismaKararBos = calismaAgaci.filter(raporMu).some((d) => {
      try { return kararBolumuBos(readFileSync(d, 'utf8')); } catch { return false; }
    });
  }

  const commitler = menzilOku(menzil);
  const oncesi = oncesiOku(menzil);
  const s = siraDenetle(commitler, { calismaAgaci, calismaKararBos, oncesi });

  console.log(`SIRA KİLİDİ · menzil ${menzil} · ${commitler.length} commit${calismaAgaci.length ? ` + ${calismaAgaci.length} commit'lenmemiş dosya` : ''}`);
  for (const k of oncesi.filter((c) => s.oncekiOlcum?.some((o) => o.sha === c.sha))) {
    console.log(`  ${k.sha}  ${'ÖLÇÜM'.padEnd(12)} ${k.konu}  (menzilden önce)`);
  }
  for (const k of s.kayit) {
    const et = [k.olcum.length ? 'ÖLÇÜM' : null, k.dikis?.length ? 'DİKİŞ' : null, k.denge.length ? 'DENGE' : null].filter(Boolean).join('+') || '—';
    console.log(`  ${k.sha}  ${et.padEnd(12)} ${k.konu}`);
  }

  if (s.durum === 'temiz') {
    console.log(`\n✓ Sıra temiz${s.sebep ? ` — ${s.sebep}` : '.'}`);
    const dikis = [...new Set(s.kayit.flatMap((k) => k.dikis ?? []))];
    if (dikis.length) console.log(`  Dikiş (§Karar boş commit'te ${dikis.join(', ')}): davranış-nötr mü — parmak izi rapora yazıldı mı?`);
    if (s.raporlar?.length) console.log(`  Elle bakılacak (araç denetleyemez): ${s.raporlar.join(', ')} §Bulgular'da uygulanan kolun SAYI SATIRI var mı?`);
    process.exit(0);
  }

  console.error(`\n!! SIRA KİLİDİ İHLALİ — ${s.ihlaller.length} bulgu (D-084 §3.2):`);
  for (const i of s.ihlaller) console.error(`   ✗ [${i.tip}] ${i.aciklama}`);
  console.error('\n   Beklenen sıra: commit #1 = araç + ham çıktı + rapor (KARAR BÖLÜMÜ BOŞ) → karar paketi');
  console.error('                  commit #2 = kod + test + rapor tamam + D-0xx');
  console.error('   Bu bir uyarıdır, geri alma değil: sebebini kullanıcıya söyle ve `decisions.md`\'ye kayda geç — sessizce geçme.');
  process.exit(1);
}
