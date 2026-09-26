# Halftone Media

A two page site for a cable and broadcast advertising company, built on the
[scroll-craft](https://github.com/nateherkai/scroll-craft) design standard.

- `index.html` the pitch. Rhythmic cutlist grammar: twelve short hard-cut acts,
  nothing pinned, nothing over 1.3 viewport-heights.
- `work.html` the roster. Gallery/catalog grammar: a panning rail of seven
  objects over a full traffic-sheet index.
- `BRIEF.md` why the page is shaped the way it is: the feeling curve, the peak,
  the score, and why the other seven grammars lost.

## Run it

```bash
node .skill/plugins/nateherk-design/skills/scroll-craft/scripts/serve.mjs --root . --port 4500
```

## Changing the client list

`roster.json` is the only place a client name lives. Edit it, then:

```bash
node build-roster.mjs
```

That regenerates the ticker on the home page and the rail and index on the work
page, in place, as real static HTML. Nothing is assembled from a config object
at runtime.

## Before this goes public

Both pages ship `<meta name="robots" content="noindex, nofollow">` and Vercel
sends a matching `X-Robots-Tag`. That is deliberate while the roster is a
placeholder: the page names Adidas and twenty other companies as clients.
Remove the meta tag and the header in `vercel.json` once the roster reflects
real, agreed relationships.

## What is not here

No statistics. The design standard forbids invented figures in a counter, and
none of the numbers a page like this usually carries are real yet. The only
count on the page is the exposure counter, which counts the reader's own passes
over the rotation line and is verifiable by scrolling.
