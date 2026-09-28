/**
 * i18n-sar.mjs — oyuncuya görünen metinleri `t()` ile sarar (bir kerelik dönüştürücü, i18n turu 2026-09-28).
 * Yalnız sözlükte (src/i18n/en.ts) anahtarı olan metne dokunur; ayar dosyalarındaki VERİ sarılmaz (ekrana
 * basıldığı yerde çevrilir). Konumlar TypeScript ayrıştırıcısından gelir — metin araması değil.
 *   JSX metni        Mağaza            → {t('Mağaza')}
 *   JSX özelliği     title="Kapat"     → title={t('Kapat')}
 *   dize             'Kapat'           → t('Kapat')
 *   şablon           `Seviye ${n}!`    → t('Seviye {1}!', n)
 * Kullanım: node tools/i18n-sar.mjs <dosya>…   (değişiklik sayısını yazar)
 */
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const KOK = process.cwd();
const enKaynak = readFileSync(path.join(KOK, 'src/i18n/en.ts'), 'utf8');
const ANAHTAR = new Set([...enKaynak.matchAll(/^ {2}("(?:[^"\\]|\\.)*"): /gm)].map((m) => JSON.parse(m[1])));
const ATLA_OZELLIK = new Set(['className', 'data-testid', 'key', 'id', 'type', 'role', 'src', 'href', 'target', 'rel', 'name', 'htmlFor', 'testid', 'lang']);
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const tek = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

for (const dosya of process.argv.slice(2)) {
  const kaynak = readFileSync(dosya, 'utf8');
  const sf = ts.createSourceFile(dosya, kaynak, ts.ScriptTarget.Latest, true, dosya.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const duzen = []; // {bas, son, yeni}
  const tIcinde = (n) => { for (let p = n.parent; p; p = p.parent) { if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === 't') return true; if (ts.isBlock(p) || ts.isSourceFile(p)) return false; } return false; };
  const gez = (n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    if (ts.isJsxText(n)) {
      const ham = n.getFullText();
      const cekirdek = norm(ham);
      if (cekirdek && ANAHTAR.has(cekirdek)) {
        const bas = n.pos + (ham.length - ham.trimStart().length), son = n.end - (ham.length - ham.trimEnd().length);
        duzen.push({ bas, son, yeni: `{t(${tek(cekirdek)})}` });
      }
      return;
    }
    const dize = ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n);
    if (dize || ts.isTemplateExpression(n)) {
      if (tIcinde(n)) return;
      const p = n.parent;
      if (ts.isPropertyAssignment(p) && p.name === n) return;
      if (ts.isElementAccessExpression(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause(p)) return;
      if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(p.operatorToken.kind)) return;
      let kalip, argumanlar = [];
      if (dize) kalip = n.text;
      else {
        kalip = n.head.text;
        n.templateSpans.forEach((sp, i) => { argumanlar.push(sp.expression.getText()); kalip += `{${i + 1}}` + sp.literal.text; });
      }
      if (!ANAHTAR.has(norm(kalip)) || norm(kalip) !== kalip) { ts.forEachChild(n, gez); return; }
      const cagri = `t(${[tek(kalip), ...argumanlar].join(', ')})`;
      if (ts.isJsxAttribute(p)) {
        if (ATLA_OZELLIK.has(p.name.getText())) return;
        duzen.push({ bas: n.getStart(), son: n.getEnd(), yeni: `{${cagri}}` });
      } else duzen.push({ bas: n.getStart(), son: n.getEnd(), yeni: cagri });
      return;
    }
    ts.forEachChild(n, gez);
  };
  gez(sf);
  if (!duzen.length) { console.log('0', dosya); continue; }
  let cikti = kaynak;
  for (const d of duzen.sort((a, b) => b.bas - a.bas)) cikti = cikti.slice(0, d.bas) + d.yeni + cikti.slice(d.son);
  if (!/import \{[^}]*\bt\b[^}]*\} from '[./]+i18n'/.test(cikti)) {
    const rel = path.relative(path.dirname(dosya), path.join(KOK, 'src/i18n')).replace(/\\/g, '/');
    const yol = rel.startsWith('.') ? rel : './' + rel;
    const sonImport = [...cikti.matchAll(/^import [^;]+;\r?$/gm)].pop();
    const at = sonImport ? sonImport.index + sonImport[0].length : 0;
    const nl = cikti.includes('\r\n') ? '\r\n' : '\n';
    cikti = cikti.slice(0, at) + `${nl}import { t } from '${yol}';` + cikti.slice(at);
  }
  writeFileSync(dosya, cikti);
  console.log(String(duzen.length).padStart(3), dosya);
}
