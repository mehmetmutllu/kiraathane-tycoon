/**
 * sira-kilidi.test.ts — KAPANIŞ OTOMASYONUNUN BEKÇİSİ · sıra kolu (D-084 P3).
 *
 * Bu denetimin tek işi bir İHLALİ yakalamak. Sessizce gevşerse hiçbir şey görünmez: kapanış
 * "✓ sıra temiz" der, kural yine hiçbir şeyi engellemez ve D-084 kendi bulgusunu tekrarlar.
 * Bu yüzden testlerin ağırlığı KIRILMA tarafında: her ihlal biçimi için bir örnek var.
 *
 * Son iki test aracı UYDURMA veriye değil GERÇEK GEÇMİŞE tutuyor: C3 turu temiz çıkmalı,
 * C4 turu (D-084'ün doğduğu tur) ihlal çıkmalı.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { sinifla, siraDenetle, menzilOku, DENGE_DOSYALARI } from '../tools/sira-kilidi.mjs';

const c = (sha: string, konu: string, dosyalar: string[]) => ({ sha, konu, dosyalar });
const OLCUM = c('aaa1', 'ölçüldü', ['tools/olcum-bardak.ts', 'docs/olcum-bardak.txt', 'docs/bardak-raporu-c4.md']);
const KOD = c('bbb2', 'uygulandı', ['src/game/tick.ts', 'tests/bardak.test.ts', 'docs/bardak-raporu-c4.md']);

describe('sinifla', () => {
  it('üç denge dosyasını tanır, komşularını tanımaz', () => {
    expect(sinifla(DENGE_DOSYALARI).denge).toEqual(DENGE_DOSYALARI);
    expect(sinifla(['src/game/types.ts', 'src/components/three/Waiter.tsx']).denge).toEqual([]);
  });

  it('ölçüm izini araç · ham çıktı · rapordan tanır', () => {
    expect(sinifla(['tools/olcum-kuyruk.ts']).olcum).toHaveLength(1);
    expect(sinifla(['docs/olcum-kuyruk.txt']).olcum).toHaveLength(1);
    expect(sinifla(['docs/kuyruk-raporu-c3.md']).olcum).toHaveLength(1);
    expect(sinifla(['docs/monetization.md', 'tools/simulate.ts']).olcum).toEqual([]);
  });
});

describe('siraDenetle — geçen sıra', () => {
  it('ölçüm commit\'i koddan ÖNCE gelirse temiz', () => {
    expect(siraDenetle([OLCUM, KOD]).durum).toBe('temiz');
  });

  it('dengeye hiç dokunulmayan tur temiz — varyant kapısı devrede değil', () => {
    const s = siraDenetle([c('x', 'sanat turu', ['src/components/three/Table.tsx'])]);
    expect(s.durum).toBe('temiz');
    expect(s.sebep).toContain('denge dosyasına dokunan commit yok');
  });

  it('commit #2 rapora + koda birlikte dokunabilir (kural bunu ister)', () => {
    const s = siraDenetle([OLCUM, KOD]);
    expect(s.durum).toBe('temiz');
    expect(s.raporlar).toContain('docs/bardak-raporu-c4.md');
  });
});

describe('siraDenetle — KIRILMA (denetim gerçekten yakalıyor mu)', () => {
  it('ölçüm ve kod AYNI commit\'te — C4 turunun biçimi', () => {
    const s = siraDenetle([c('df7', 'ölçüldü ve açıldı', [...OLCUM.dosyalar, 'src/game/tick.ts'])]);
    expect(s.durum).toBe('ihlal');
    expect(s.ihlaller[0].tip).toBe('karma-commit');
  });

  it('menzilde hiç ölçüm yok, doğrudan denge değişmiş', () => {
    const s = siraDenetle([c('y', 'eşik ayarlandı', ['src/config/economy.config.ts'])]);
    expect(s.durum).toBe('ihlal');
    expect(s.ihlaller[0].tip).toBe('olcum-yok');
  });

  it('ölçüm SONRA gelirse geçmez — "önce uygula, sonra ölç" tam olarak yasaklanan sıra', () => {
    expect(siraDenetle([KOD, OLCUM]).durum).toBe('ihlal');
  });

  it('ölçümü koda yamayan commit turun BAŞINDA olsa da geçmez', () => {
    // Ölçüm çıktısı ile eşik değişikliği aynı commit'te → o commit kendinden önce gelemez.
    const karma = c('k', 'ölçüm + eşik', ['docs/olcum-bardak.txt', 'src/game/rules.ts']);
    expect(siraDenetle([karma, KOD]).durum).toBe('ihlal');
    expect(siraDenetle([karma, KOD]).ihlaller[0].tip).toBe('karma-commit');
  });

  it('commit\'lenmemiş denge değişikliği de sayılır (kapanış commit\'ine gidecek)', () => {
    const temiz = siraDenetle([OLCUM], { calismaAgaci: ['src/game/tick.ts'] });
    expect(temiz.durum).toBe('temiz');
    const ihlal = siraDenetle([], { calismaAgaci: ['src/game/tick.ts'] });
    expect(ihlal.durum).toBe('ihlal');
    expect(ihlal.ihlaller[0].sha).toBe('(commit edilmemiş)');
  });

  it('ihlal açıklaması hangi dosyaların suçlandığını yazar', () => {
    const s = siraDenetle([c('y', 'eşik', ['src/config/economy.config.ts'])]);
    expect(s.ihlaller[0].aciklama).toContain('src/config/economy.config.ts');
  });
});

// --- Gerçek geçmiş: araç uydurma veride değil, projenin kendi commit'lerinde de doğru mu?
const varMi = (sha: string) => {
  try { execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
};

describe('gerçek geçmiş', () => {
  it.runIf(varMi('39b2871') && varMi('83c45a7'))('C3 turu TEMİZ — ölçüm commit\'i ayrı atılmıştı', () => {
    expect(siraDenetle(menzilOku('39b2871..83c45a7')).durum).toBe('temiz');
  });

  it.runIf(varMi('83c45a7') && varMi('9b2be1e'))('C4 turu İHLAL — D-084 tam bu turdan doğdu', () => {
    const s = siraDenetle(menzilOku('83c45a7..9b2be1e'));
    expect(s.durum).toBe('ihlal');
    expect(s.ihlaller[0].sha).toBe('df7ddee');
  });
});
