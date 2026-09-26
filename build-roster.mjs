/* Regenerates every block of client markup on the site from roster.json, which
   is the single place a name lives. Real static HTML ships: nothing on the
   page is assembled from a config object at runtime.

   Usage:  node build-roster.mjs                                          */

import { readFile, writeFile } from "node:fs/promises";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const { clients } = JSON.parse(await readFile(new URL("./roster.json", import.meta.url)));

/* Seven objects carry the rail. The rest are the index below it. */
const FEATURED = [
  "Adidas", "Ostrander Ford", "Pemberton Furniture", "Fairmount Credit Union",
  "Tillman Heating & Air", "Marigold Bakery", "Wickham Feed & Seed",
];
const featured = FEATURED.map((n) => clients.find((c) => c.name === n)).filter(Boolean);

/* One label schema, no exceptions. The schema is what makes this a collection
   rather than a grid, and it has to survive being read half cropped. */
const label = (c) => `<b>${esc(c.sector)}</b><br>${esc(c.format)}<br>${esc(c.daypart)}<br>${esc(c.year)}`;
/* Same four fields, same order, on every object. The rail plate stacks them
   because a card is narrow; the index sets them as columns because an index is
   a sheet. The schema does not change, only its setting. */
const row = (c) => `<span>${esc(c.sector)}</span><span>${esc(c.format)}</span><span>${esc(c.daypart)}</span><span>${esc(c.year)}</span>`;
const bars = `<span class="obj__bars" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>`;

const ticker = (() => {
  const one = clients.map((c) => `        <span class="ticker__i">${esc(c.name)}</span>`).join("\n");
  const g = `      <div class="ticker__g" aria-hidden="true">\n${one}\n      </div>`;
  /* Duplicated so the -50% loop is seamless. The first copy is the real list
     and carries the accessible names; the second is presentational. */
  const real = `      <div class="ticker__g">\n${one}\n      </div>`;
  return `      <div class="ticker">\n    <div class="ticker__t">\n${real}\n${g}\n    </div>\n      </div>`;
})();

const rail = featured.map((c, i) => `        <article class="obj" style="--i:${i}"${i ? ` data-sc-tilt="6"` : ""}>
          <h3 class="obj__n">${esc(c.name)}</h3>
          ${bars}
          <p class="obj__l">${label(c)}</p>
        </article>`).join("\n");

/* The index groups by sector, and every group is a jump target, because in this
   grammar the nav IS an index of the objects. */
const sectors = [...new Set(clients.map((c) => c.sector))].sort();
const idx = sectors.map((s) => `    <a href="#s-${slug(s)}">${esc(s)}</a>`).join("\n");

const sheet = sectors.map((s) => {
  const inSector = clients.filter((c) => c.sector === s);
  const objs = inSector.map((c) => `        <article class="sheet__o">
          <h3>${esc(c.name)}</h3>
          <p class="sheet__f">${row(c)}</p>
        </article>`).join("\n");
  return `      <section class="sheet__g" id="s-${slug(s)}">
        <h2 class="label sheet__h">${esc(s)}</h2>
        <div class="sheet">
${objs}
        </div>
      </section>`;
}).join("\n");

async function splice(file, blocks) {
  let src = await readFile(new URL(`./${file}`, import.meta.url), "utf8");
  for (const [name, body] of Object.entries(blocks)) {
    const open = `<!-- roster:${name}:start -->`;
    const close = `<!-- roster:${name}:end -->`;
    const re = new RegExp(`${open}[\\s\\S]*?${close}`);
    if (!re.test(src)) throw new Error(`${file}: no ${name} block`);
    src = src.replace(re, `${open}\n${body}\n      ${close}`);
  }
  await writeFile(new URL(`./${file}`, import.meta.url), src);
  console.log(`  ${file}  ${Object.keys(blocks).join(", ")}`);
}

console.log(`roster: ${clients.length} clients, ${sectors.length} sectors`);
await splice("index.html", { ticker });
await splice("work.html", { idx, rail, sheet });
console.log("done");
