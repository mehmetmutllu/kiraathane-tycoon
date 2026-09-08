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
 * KULLANIM
 *   node tools/sira-kilidi.mjs                       # push'lanmamış commit'ler (oturumun kendisi)
 *   node tools/sira-kilidi.mjs --menzil=A..B         # geçmiş bir turu denetle
 */
import { execFileSync } from 'node:child_process';

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

export function sinifla(dosyalar) {
  return {
    denge: dosyalar.filter((d) => DENGE_DOSYALARI.includes(d)),
    olcum: dosyalar.filter((d) => OLCUM_KALIPLARI.some((r) => r.test(d))),
  };
}

/**
 * `commitler` ESKİDEN YENİYE sıralı: `[{ sha, konu, dosyalar }]`.
 * `calismaAgaci`: henüz commit'lenmemiş dosyalar (kapanış commit'ine gidecekler).
 */
export function siraDenetle(commitler, { calismaAgaci = [] } = {}) {
  const kayit = commitler.map((c) => ({ ...c, ...sinifla(c.dosyalar) }));
  const ca = sinifla(calismaAgaci);
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
  const oncekiOlcum = kayit.slice(0, ilk).filter((k) => k.olcum.length);
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

export function menzilOku(menzil) {
  const satirlar = git('log', '--reverse', '--format=%h %s', menzil).split('\n').filter(Boolean);
  return satirlar.map((s) => {
    const bosluk = s.indexOf(' ');
    const sha = s.slice(0, bosluk);
    const konu = s.slice(bosluk + 1);
    const dosyalar = git('show', '--name-only', '--format=', sha).split('\n').map((x) => x.trim()).filter(Boolean);
    return { sha, konu, dosyalar };
  });
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
  if (!menzil) {
    let uzak;
    try { uzak = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}').trim(); }
    catch { console.error('Uzak dal yok — menzil belirlenemedi. `--menzil=A..B` verin.'); process.exit(1); }
    menzil = `${uzak}..HEAD`;
    calismaAgaci = calismaAgaciOku();      // kapanışta henüz commit'lenmemiş kod da sayılır
  }

  const commitler = menzilOku(menzil);
  const s = siraDenetle(commitler, { calismaAgaci });

  console.log(`SIRA KİLİDİ · menzil ${menzil} · ${commitler.length} commit${calismaAgaci.length ? ` + ${calismaAgaci.length} commit'lenmemiş dosya` : ''}`);
  for (const k of s.kayit) {
    const et = [k.olcum.length ? 'ÖLÇÜM' : null, k.denge.length ? 'DENGE' : null].filter(Boolean).join('+') || '—';
    console.log(`  ${k.sha}  ${et.padEnd(12)} ${k.konu}`);
  }

  if (s.durum === 'temiz') {
    console.log(`\n✓ Sıra temiz${s.sebep ? ` — ${s.sebep}` : '.'}`);
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
