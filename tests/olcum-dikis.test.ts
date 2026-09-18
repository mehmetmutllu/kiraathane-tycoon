/**
 * olcum-dikis.test.ts — ÖLÇÜM DİKİŞİ NODE'DA DA ÇALIŞMALI.
 *
 * ## Neyi koruyor
 * T4 (D-138) kare bölüşümünü ölçmek için `nav.ts` ve `tick.ts`e `import.meta.env.DEV && …`
 * dikişi koydu. Vite bunu derlemede sabite çevirir, ama **node `import.meta.env`i hiç tanımaz**:
 * `tsx` ile koşan her araç ilk `findNavPath` çağrısında
 *   `TypeError: Cannot read properties of undefined (reading 'DEV')`
 * ile ölüyordu — `npm run sim`, `olcum-kuyruk`, `olcum-bardak`, `olcum-nav-oyuncu`, yani
 * T3 denge turunun BÜTÜN takımı. T5'in ölçüm aracı yazılırken yakalandı.
 *
 * ## Neden ÇALIŞMA ZAMANI testi bunu göremez
 * Vitest vite altında koşar; testin içinde `import.meta.env.DEV` **tanımlıdır**. Yani bu kusur
 * sıradan bir testle YAKALANAMAZ — kapı vitest'te hep açıktır. Bekçi iki koldan kurulur:
 *   1) KAYNAK TARAMASI — oyun kodunda çıplak `import.meta.env.X` okuması olmayacak.
 *      Tek istisna `olcum.ts`in node-güvenli hâli: `(import.meta as {…}).env?.DEV`.
 *   2) GERÇEK NODE KOŞUSU — `tsx` alt süreci `findNavPath`i node'da çağırır. Kusuru birebir
 *      üreten kol budur; yavaş olduğu için tek çağrıyla sınırlı tutulur.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Yorumları at: `import.meta.env` ANLATILDIĞI yerde değil, OKUNDUĞU yerde sorun. */
function yorumsuz(kaynak: string): string {
  return kaynak.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function tsDosyalari(dizin: string): string[] {
  const out: string[] = [];
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, g.name);
    if (g.isDirectory()) out.push(...tsDosyalari(tam));
    else if (g.name.endsWith('.ts') || g.name.endsWith('.tsx')) out.push(tam);
  }
  return out;
}

/** Tarayıcıdan başka yerde hiç yüklenmeyen dosyalar — node güvenliği onlardan istenmez. */
const TARAYICI_ICI = ['devHooks.ts', 'devSandbox.ts', 'devPerf.ts'];

describe('ölçüm dikişi node-güvenli', () => {
  it('oyun kodunda çıplak import.meta.env okuması yok', () => {
    const suclular: string[] = [];
    for (const kok of ['src/game', 'src/config']) {
      for (const dosya of tsDosyalari(path.join(KOK, kok))) {
        if (TARAYICI_ICI.includes(path.basename(dosya))) continue;
        const govde = yorumsuz(readFileSync(dosya, 'utf8'));
        // Çıplak okuma: `import.meta.env.` ya da `import.meta.env[`.
        if (/import\s*\.\s*meta\s*\.\s*env\s*[.[]/.test(govde)) {
          suclular.push(path.relative(KOK, dosya).replace(/\\/g, '/'));
        }
      }
    }
    expect(suclular).toEqual([]);
  });

  it('olcum.ts DEV kapısını node-güvenli biçimde okur', () => {
    const govde = yorumsuz(readFileSync(path.join(KOK, 'src/game/olcum.ts'), 'utf8'));
    expect(govde).toMatch(/\(\s*import\s*\.\s*meta\s+as[\s\S]{0,80}\)\s*\.\s*env\s*\?\./);
  });

  it('findNavPath node (tsx) altında çağrılabilir', () => {
    const tsx = path.join(KOK, 'node_modules/tsx/dist/cli.mjs');
    if (!existsSync(tsx)) {
      // tsx kurulu değilse kaynak taraması tek bekçidir; sessizce geçmek yerine bunu söyle.
      throw new Error('tsx bulunamadı — node kolu koşamadı, bekçi eksik kalır');
    }
    const kod = [
      "import { buildNavGrid, findNavPath } from './src/game/nav.ts';",
      'const g = buildNavGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 }, 0.3, [], 0.28);',
      'const y = findNavPath(g, [-2.5, 0, -2.5], 2.5, 2.5, 0.4);',
      "console.log(y === null ? 'NULL' : 'YOL:' + y.length);",
    ].join('\n');
    const r = spawnSync(process.execPath, [tsx, '-e', kod], { cwd: KOK, encoding: 'utf8', timeout: 120_000 });
    expect(r.stderr ?? '').not.toContain('import.meta');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/YOL:\d+/);
  }, 120_000);
});
