import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
const E = [], err = m => { E.push(m); console.log('::error::' + m); };
const walk = d => readdirSync(d).flatMap(f => f === 'node_modules' || f[0] === '.' ? [] : statSync(d + '/' + f).isDirectory() ? walk(d + '/' + f) : [d + '/' + f]);
for (const f of walk('.').filter(f => f.endsWith('.js'))) try { execSync('node --check ' + f, { stdio: 'pipe' }); } catch (e) { const L = String(e.stderr).split('\n'), n = (L[0].match(/:(\d+)$/) || [])[1]; err(f.slice(2) + ': erreur de syntaxe' + (n ? ' ligne ' + n : '') + ' : ' + (L.find(l => /Error/.test(l)) || '') + ' — « ' + (L[1] || '').trim().slice(0, 110) + ' »'); }
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = createServer((q, s) => { const u = q.url.split('?')[0], p = '.' + (u === '/' ? '/index.html' : u); if (!existsSync(p)) { s.statusCode = 404; return s.end(); } s.setHeader('content-type', mime[path.extname(p)] || 'application/octet-stream'); s.end(readFileSync(p)); }).listen(8123);
const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 390, height: 800 } });
pg.on('pageerror', e => err('js/app.js: erreur JS à l’exécution : ' + e.message));
pg.on('console', m => m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text()) && err('js/app.js: console.error : ' + m.text()));
await pg.goto('http://localhost:8123/'); await pg.waitForTimeout(2000);
for (const f of JSON.parse(readFileSync('qa/features.json', 'utf8'))) if (!(await pg.locator('[data-feature="' + f.id + '"]').count())) err('index.html: fonction ' + f.id + ' absente (data-feature)');
let budget = 160, dlg = false; pg.on('dialog', d => { dlg = true; d.accept().catch(() => {}); });
const SEL = 'button:visible, [role=tab]:visible, summary:visible, a[href^="#"]:visible';
const sig = () => pg.evaluate(() => document.documentElement.outerHTML.length + '|' + document.body.innerText.length + '|' + JSON.stringify(localStorage).length + '|' + location.hash);
const vis = () => pg.evaluate(() => [...document.querySelectorAll('[data-feature]')].filter(e => e.checkVisibility({ checkVisibilityCSS: true }) && e.getBoundingClientRect().height > 0).map(e => e.dataset.feature));
const btns = () => pg.locator(SEL).evaluateAll(es => es.map(e => ({ id: e.id || '', label: (e.innerText || e.getAttribute('aria-label') || e.getAttribute('href') || '').trim().slice(0, 40) })).filter(b => b.id !== 'tlm-share'));
const loc = b => b.id ? pg.locator('[id="' + b.id + '"]') : pg.locator(SEL).filter({ hasText: b.label }).first();
const seen = new Set(await vis());
const step = async l => { const s0 = await sig(), v0 = await vis(); dlg = false; await l.click({ timeout: 1500 }).catch(() => {}); await pg.waitForTimeout(350); const s1 = await sig(), v1 = await vis(); v1.forEach(f => seen.add(f)); return dlg || s0 !== s1 || v1.length !== v0.length || v1.some(f => !v0.includes(f)); };
const restore = async path => { await pg.goto('http://localhost:8123/'); await pg.waitForTimeout(600); budget--; for (const p of path) { await loc(p).click({ timeout: 1500 }).catch(() => {}); await pg.waitForTimeout(250); } };
const noEffect = new Set();
async function explore(path) { // parcourt jusqu'à 3 clics de profondeur
  for (const b of (await btns()).slice(0, 20)) {
    b.k = b.id || b.label; if (budget <= 0) return; if (path.some(p => p.k === b.k)) continue;
    await restore(path);
    if (!(await step(loc(b)))) { if (!path.length && !noEffect.has(b.k)) { noEffect.add(b.k); err('js/app.js: le bouton ' + (b.id ? '#' + b.id + ' ' : '') + '« ' + b.label + ' » n’a aucun effet visible au clic (écouteur absent ou cassé)'); } continue; }
    if (path.length < 2) await explore([...path, b]);
  }
}
await explore([]);
for (const f of JSON.parse(readFileSync('qa/features.json', 'utf8'))) if (!seen.has(f.id)) err('index.html: fonction ' + f.id + ' inaccessible : jamais visible, même après clic sur les boutons (section masquée sans moyen de l’ouvrir, ou élément factice)');
await restore([]);
await pg.waitForTimeout(800);
if ((await pg.innerText('body')).length < 400) err('index.html: page quasi vide');
if (await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) err('style.css: débordement horizontal sur mobile');
await b.close(); srv.close(); process.exit(E.length ? 1 : 0);
