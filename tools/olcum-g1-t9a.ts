/**
 * olcum-g1-t9a.ts — T9a: g1 kolu (garson tepsi kademeleri görev hattına) D-142 SONRASI ne yapar?
 *
 * D1 (D-087) g1'i ihlali ARTIRDIĞI için eledi (6 → 7). D-142 garsonu 2'li tepsiyle başlattı;
 * `tempo-olcutu` bekçisi o günden beri g1'in ikinci dozunun ölçütü İYİLEŞTİRDİĞİNİ kayda geçiriyor
 * (3 → 2). Elenme gerekçesi düştü — ama bir kolu açmak için "iyileştiriyor" yetmez; bedeli de
 * okunmalı: Kat 1 süresi (şerit) ve açılış temposu kısalıyor mu? (D1: ölçütü tutturan her kol Kat 1
 * içeriğini kısaltıyordu.) Bu araç g1'in her dozunu tabanla AYNI tabloya koyar.
 *
 * Kol çalışma anında uygulanır ve geri alınır (`tools/denge-kollari.ts`); economy.config.ts DEĞİŞMEZ.
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-g1-t9a.ts > docs/olcum-g1-t9a.txt
 */
import { olcutler, onbellekTemizle, milestoneTazele, m1Ayarla, kolAyarla, VARSAYILAN, type Olcut } from './simulate.ts';
import { DENGE_KOLLARI, geriAl } from './denge-kollari.ts';
import { KIP, KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur } from './olcum-lib.ts';

const dk = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 60).toFixed(1)} dk` : '—');
const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)} sa` : '—');
const yuzde = (a: number | undefined, b: number | undefined) =>
  a != null && b != null && b !== 0 ? `${a >= b ? '+' : '−'}%${Math.abs((100 * (a - b)) / b).toFixed(1)}` : '—';

function olc(doz: number): { o: Olcut; iz: string; ad: string } {
  geriAl();
  m1Ayarla(false);
  kolAyarla(VARSAYILAN);
  if (doz > 0) DENGE_KOLLARI.g1.uygula(doz);
  const ad = DENGE_KOLLARI.g1.yaz(doz); // geriAl'dan ÖNCE: yaz() config'i okur
  onbellekTemizle();
  milestoneTazele();
  const o = olcutler();
  const h = izOlustur();
  for (const b of o.bosluklarNormal) h.ekle(b.t, b.gap);
  geriAl();
  return { o, iz: h.deger, ad };
}

kipBandi();
console.log(`=== T9a — g1 (taşıma tavanı: tepsi kademeleri görev hattında) D-142 sonrası (${KIP} koşu) ===`);
console.log('');
console.log(`g1: ${DENGE_KOLLARI.g1.ne}`);
console.log('Hüküm profili İDEALİZE (D-087); Normal gözlem bandı. Şerit = Kat 1 süresi (Normal profil, 20. masa).');
console.log('');

const dozlar = KISA ? [0, 1] : [0, 1, 2];
const sonuc = dozlar.map((d) => ({ d, ...olc(d) }));
const t = sonuc[0];
for (const s of sonuc.slice(1)) varyantDamgasi(`g1 doz ${s.d}`, t.iz, s.iz);
// HAT TIKANMADI MI? (T9a'nın kendi dersi: bayat g1 hattı tıkıyordu ve "ihlal düştü" okunuyordu.)
// Kat 1 bitmeyen bir satır ölçüm değildir — tıkanan hat pahalı alımları sayıdan siler.
for (const s of sonuc) damga(`hat tıkanmadı (g1 doz ${s.d})`, s.o.serit != null, 'Kat 1 (20. masa) 12 saatte bitmedi — görev hattı takılıyor');

console.log('doz | kol                          | İdealize aşan | en uzun (İd.)       | Normal aşan | Normal en uzun      | Kat 1 (şerit)     | ilk alım | otomasyon');
for (const s of sonuc) {
  const o = s.o;
  console.log(
    [
      String(s.d).padStart(3),
      s.ad.padEnd(28),
      String(o.idealAsan).padStart(13),
      `${dk(o.idealEnUzun)} ${o.idealEnUzunEtiket}`.padEnd(19),
      String(o.normalAsan).padStart(11),
      `${dk(o.normalEnUzun)} ${o.normalEnUzunEtiket}`.padEnd(19),
      `${sa(o.serit)} ${s.d ? yuzde(o.serit, t.o.serit) : ''}`.padEnd(17),
      dk(o.ilkAlim).padStart(8),
      dk(o.otomasyon),
    ].join(' | '),
  );
}
console.log('');
console.log('--- Normal profilde 20 dk`yi aşan alımlar (doz başına) ---');
for (const s of sonuc) {
  console.log(`doz ${s.d}: ${s.o.asanlar.map((b) => `${b.label} ${dk(b.gap)}`).join(' · ') || '(yok)'}`);
}
damgaOzeti();
