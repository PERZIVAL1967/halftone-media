/* =========================================================== HALFTONE ==
   Page-level behaviour only. The engine is the mechanism and is never
   edited; everything here reads scroll itself, because the signature move
   has to outlive the act it starts in, which is precisely what an act's
   own --sc-p cannot do.

   Two things live in this file:
     1. the frequency rotation, which is the signature move
     2. the break strip in the chrome, which fills as the reader travels
   ======================================================================= */
(function () {
  "use strict";

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------ the frequency rotation --
     Six exposures of one line. Each is tied to the act it floats over, so the
     placement survives any change to how long the acts are: the window is
     derived from the target's real position, never from a hardcoded page
     fraction.                                                              */

  var imps = [].slice.call(document.querySelectorAll(".imp[data-over]"));
  var freq = document.querySelector(".freq");
  var freqN = document.querySelector("[data-freq]");
  var seen = 0;

  imps.forEach(function (el) {
    el.__target = document.querySelector(el.getAttribute("data-over"));
    el.__seen = false;
    /* The last exposure is the peak: it holds far longer than the five that
       set it up, and it is the only one that carries its own ground. */
    el.__peak = el.classList.contains("imp--6");
  });

  var ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth",
             "seventh", "eighth", "ninth", "tenth"];
  var peakN = document.querySelector("[data-peak-n]");

  function envelope(p, peak) {
    /* An exposure may only be on screen while its own act actually holds the
       screen. Progress runs across the act's whole visible life, so p = 0.5 is
       the instant the act fills the viewport: anything outside a tight band
       around that paints the line over the NEIGHBOURING act's ground, in ink
       mixed for the wrong one. That is invisible in any single screenshot and
       it is a guaranteed contrast failure.

       Front loaded inside that band, because this grammar does not crossfade
       and a cue the reader outruns is the failure mode at speed.           */
    var IN0  = peak ? 0.24 : 0.34;
    var IN1  = peak ? 0.32 : 0.41;
    var OUT0 = peak ? 0.74 : 0.60;
    var OUT1 = peak ? 0.84 : 0.67;
    if (p <= IN0 || p >= OUT1) return 0;
    if (p < IN1) return (p - IN0) / (IN1 - IN0);
    if (p <= OUT0) return 1;
    return 1 - (p - OUT0) / (OUT1 - OUT0);
  }

  function rotate() {
    var vh = innerHeight;
    var lit = null;

    for (var i = 0; i < imps.length; i++) {
      var el = imps[i], t = el.__target;
      if (!t) continue;

      var r = t.getBoundingClientRect();
      /* Progress across the target's entire visible life, the same shape the
         engine gives a flow act: 0 as it starts to enter, 1 as it finishes
         leaving. */
      var p = (vh - r.top) / (r.height + vh);
      if (p < 0) p = 0; else if (p > 1) p = 1;

      var o = envelope(p, el.__peak);
      el.style.opacity = o;

      if (!reduced && !el.__peak) {
        /* A short travel against the scroll. Transform and opacity only. */
        var y = (0.5 - p) * 44;
        el.style.transform = "translate3d(0," + y.toFixed(2) + "px,0)";
      }

      if (o > 0.55) lit = el;

      /* An exposure counts once it has actually been legible, not once it has
         technically been in the DOM. */
      if (!el.__seen && o > 0.92) {
        el.__seen = true;
        seen++;
        if (freqN) freqN.textContent = seen;
        /* The peak claims a count, so the count has to be the true one. A
           viewport that drops an exposure must not be told it had six. */
        if (peakN && !el.__peak) peakN.textContent = ORD[seen + 1] || (seen + 1);
      }
    }

    if (freq) {
      if (seen > 0 && !freq.__shown) { freq.hidden = false; freq.__shown = true; }
      /* The readout inks against whichever ground is under the lit exposure,
         and goes away entirely while the peak owns the screen. */
      if (lit && !lit.__peak) {
        freq.classList.add("is-lit");
        var bone = lit.classList.contains("imp--on-bone");
        freq.classList.toggle("freq--on-bone", bone);
        freq.classList.toggle("freq--on-dark", !bone);
      } else {
        freq.classList.remove("is-lit");
      }
    }
  }

  /* ------------------------------------------------------- the break strip --
     Four real slot lengths at their true proportions, filling as the reader
     travels. The chrome says how far through the break they are without a
     percentage readout and without numbering the sections.                 */

  var slotEls = [].slice.call(document.querySelectorAll("[data-slot]"));
  var WEIGHTS = [60, 30, 15, 6];
  var TOTAL = 111;

  function strip() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - innerHeight;
    var p = max > 0 ? (window.scrollY || doc.scrollTop) / max : 0;
    if (p < 0) p = 0; else if (p > 1) p = 1;

    var travelled = p * TOTAL, at = 0;
    for (var i = 0; i < slotEls.length; i++) {
      var w = WEIGHTS[i];
      var f = (travelled - at) / w;
      if (f < 0) f = 0; else if (f > 1) f = 1;
      slotEls[i].style.width = (f * 100) + "%";
      at += w;
    }
  }

  /* ------------------------------------------------------------- the loop -- */

  var queued = false;
  function frame() { queued = false; rotate(); strip(); }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(frame); } }

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(frame);
  frame();
})();
