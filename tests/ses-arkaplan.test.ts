/**
 * BEKÇİ — Sprint A perf #5: arka planda ve reklam sırasında ses SUSAR.
 *  - Gizlenince `AudioContext.suspend()`; görünür olunca yalnız biz askıya aldıysak `resume()`.
 *  - Reklam + arka plan üst üste binerse son neden kalkana dek askıda kalır; dokunuş uyandırmaz.
 *  - App.tsx bağlantısı: görünürlük → `sesDuraklat('gizli')`, reklam aboneliği → `sesDuraklat('reklam')`.
 */
import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';

class SahteBaglam {
  state = 'running';
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  resume() { this.state = 'running'; return Promise.resolve(); }
}

afterAll(() => { delete (globalThis as Record<string, unknown>).window; });

describe('ses susturma', () => {
  it('gizlenince suspended, dönünce running; reklam üst üste binerse ikisi de kalkana dek susar', async () => {
    (globalThis as Record<string, unknown>).window = { AudioContext: SahteBaglam };
    const { sesBaglami, sesDuraklat, sesDuraklatildi, sesiUyandir } = await import('../src/game/audioWeb');
    const c = sesBaglami() as unknown as SahteBaglam;
    expect(c.state).toBe('running');

    sesDuraklat('gizli', true);
    expect(c.state).toBe('suspended');
    expect(sesDuraklatildi()).toBe(true);
    sesiUyandir(); // dokunuş askıyı bozmaz
    expect(c.state).toBe('suspended');

    sesDuraklat('reklam', true);
    sesDuraklat('gizli', false);
    expect(c.state).toBe('suspended'); // reklam hâlâ ekranda
    sesDuraklat('reklam', false);
    expect(c.state).toBe('running');
    expect(sesDuraklatildi()).toBe(false);
  });

  it('kullanıcı jesti beklenen (biz askıya almadığımız) bağlamı kendiliğinden açmaz', async () => {
    const { sesBaglami, sesDuraklat } = await import('../src/game/audioWeb');
    const c = sesBaglami() as unknown as SahteBaglam;
    c.state = 'suspended';
    sesDuraklat('gizli', true);
    sesDuraklat('gizli', false);
    expect(c.state).toBe('suspended');
  });

  it('App.tsx: görünürlük ve reklam susturmaya bağlı', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain("sesDuraklat('gizli', true);");
    expect(app).toContain("sesDuraklat('gizli', false);");
    expect(app).toContain("reklamAbone(() => sesDuraklat('reklam', reklamEkranda()))");
    expect(app).toContain('void reklamYenidenKur();');
    expect(app).toMatch(/<HataSiniri>[\s\S]*<SahneKurtarici>[\s\S]*<Scene \/>[\s\S]*<\/SahneKurtarici>[\s\S]*<\/HataSiniri>/);
  });

  it('WebGL bağlam kaybı: preventDefault + geri gelince sahne yeniden kurulur', () => {
    const k = readFileSync('src/components/ui/HataSiniri.tsx', 'utf8');
    expect(k).toMatch(/addEventListener\('webglcontextlost', kayboldu, true\)/);
    expect(k).toContain('const kayboldu = (e: Event) => e.preventDefault();');
    expect(k).toMatch(/addEventListener\('webglcontextrestored', geldi, true\)/);
    expect(k).toContain('<Fragment key={nesil}>');
  });
});
