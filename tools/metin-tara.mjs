/**
 * metin-tara.mjs — oyuncuya görünebilecek METİNLERİN envanteri (i18n turu, 2026-09-28).
 * TypeScript ayrıştırıcısıyla src/ taranır; her JSX metni, JSX özelliği ve harf içeren dize literali bağlamıyla
 * listelenir. `t('…')` içindekiler "çevrildi", diğerleri "açık" sayılır. İç kimlikler (className, testid, import,
 * anahtar karşılaştırmaları) elenir.
 * Kullanım: node tools/metin-tara.mjs [--json]  → docs/i18n/metin-envanteri.json
 */
import ts from 'typescript';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const ATLA_DOSYA = /[\\/](three|i18n)[\\/]|dev[A-Z]\w*\.tsx?$|DevSandbox|FurniturePrototype|olcum\.ts$|perf\.ts$|\.d\.ts$/;
const ATLA_OZELLIK = new Set(['className', 'data-testid', 'key', 'id', 'type', 'role', 'src', 'href', 'target', 'rel', 'name', 'htmlFor', 'inputMode', 'autoComplete', 'enterKeyHint', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'strokeLinecap', 'strokeLinejoin', 'transform', 'points', 'xmlns', 'fillRule', 'clipRule', 'testid', 'icon', 'kind', 'tab', 'variant', 'size', 'tone', 'lang', 'dir', 'pattern', 'accept']);

function dosyalar(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((g) => {
    const t = path.join(d, g.name);
    if (g.isDirectory()) return dosyalar(t);
    return /\.tsx?$/.test(g.name) && !ATLA_DOSYA.test(t) ? [t] : [];
  });
}

/** İç kimliğe benzeyen dize: boşluksuz, küçük harf/rakam/_-:./ — ekrana çıkmaz sayılır. */
const kimlikGibi = (s) => /^[a-z0-9_:\-./#%@?=&]+$/i.test(s) && !/[çğıöşüÇĞİÖŞÜ]/.test(s) && !/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]+$/.test(s);
const harfVar = (s) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s);

const kayit = [];
for (const f of dosyalar(path.join(KOK, 'src'))) {
  const kaynak = readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, kaynak, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rel = path.relative(KOK, f).replace(/\\/g, '/');
  const ekle = (n, metin, tur, ceviri) => {
    const s = metin.replace(/\s+/g, ' ').trim();
    if (!s || !harfVar(s)) return;
    const { line } = sf.getLineAndCharacterOfPosition(n.getStart());
    kayit.push({ dosya: rel, satir: line + 1, tur, metin: s, ceviri });
  };
  const tIcinde = (n) => { let p = n.parent; while (p && !ts.isSourceFile(p)) { if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === 't') return true; if (ts.isJsxElement(p) || ts.isBlock(p)) return false; p = p.parent; } return false; };
  const gez = (n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    if (ts.isJsxText(n)) ekle(n, n.text, 'jsx', false);
    else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) {
      const metin = ts.isTemplateExpression(n) ? n.getText().slice(1, -1) : n.text;
      const p = n.parent;
      let tur = 'dize';
      if (ts.isJsxAttribute(p)) { if (ATLA_OZELLIK.has(p.name.getText())) return; tur = 'ozellik:' + p.name.getText(); }
      if (ts.isPropertyAssignment(p) && p.name === n) return; // nesne anahtarı
      if (ts.isElementAccessExpression(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause(p)) return;
      if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken].includes(p.operatorToken.kind)) return;
      if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && ['getItem', 'setItem', 'removeItem', 'querySelector', 'querySelectorAll', 'addEventListener', 'removeEventListener', 'includes', 'startsWith', 'endsWith', 'split', 'join', 'replace', 'toLocaleUpperCase', 'toLocaleString', 'getPlatform', 'isPluginAvailable', 'get', 'has', 'set', 'delete', 'padStart'].includes(p.expression.name.text)) return;
      if (kimlikGibi(metin)) return;
      if (tur === 'dize' && !/[ çğıöşüÇĞİÖŞÜ]/.test(metin) && !/^[A-ZÇĞİÖŞÜ]/.test(metin)) return;
      ekle(n, metin, tur, tIcinde(n));
      return;
    }
    ts.forEachChild(n, gez);
  };
  gez(sf);
}
const acik = kayit.filter((k) => !k.ceviri);
mkdirSync(path.join(KOK, 'docs/i18n'), { recursive: true });
writeFileSync(path.join(KOK, 'docs/i18n/metin-envanteri.json'), JSON.stringify(kayit, null, 1));
const dosyaSay = {};
for (const k of acik) dosyaSay[k.dosya] = (dosyaSay[k.dosya] ?? 0) + 1;
console.log(`toplam ${kayit.length} · çevrilmiş ${kayit.length - acik.length} · açık ${acik.length}`);
for (const [d, n] of Object.entries(dosyaSay).sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(4), d);
