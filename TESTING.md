# Test notes — ignition-timing-helper v1.1.0

Tested 2026-11-18. The app is plain JavaScript — `index.html` +
`timing.js` (engine + sourced data) + `app.js` (UI) + `styles.css` +
service worker. No dependencies, no runtime download, no network.

## Engine tests — `node test.js` (84 passed, 0 failed)

Run from the app directory; no dependencies, Node 18+:

- **Dyna switch configurator** — all four curves × all four rev
  limits map to the switch table in the Dynatek sheet: curve 1
  OFF/OFF, curve 2 ON/OFF, curve 3 OFF/ON, curve 4 ON/ON (switches
  2+3); 6000 OFF/OFF, 6500 ON/OFF, 7000 OFF/ON, 7500 ON/ON
  (switches 4+5); VOES normal = SW1 OFF, retard = SW1 ON; dual
  fire = SW6 OFF, single fire = SW6 ON. Final advance 35°/35°/32°/30°
  and total retard 10°/10°/7°/5° match the retard chart in the
  instructions. Every config reminds about the power cycle.
- **Invalid configs rejected** — curve 5 (programmable-only),
  curve 0, rev limit 5500, bad VOES mode, bad firing mode all throw
  instead of returning a guess.
- **Curve suggestions** — stock → 2, mild → 2, built → 3,
  detonates → 3, still-detonates → 4; unknown build throws.
- **Coil picker** — dual/single × single/dual plug returns the
  sheet's coil (DC6-1, two DC2-1 in series, DC6-5, two DC1-1 /
  DC6-4) with the 2.5–3.5 Ω primary range.
- **Mark math** — 20° on an 8.5 in flywheel = 1.48 in (37.59 mm);
  0° = 0; 360° = full circumference; degrees invert the arc within
  rounding (2-decimal inches cost ~0.05° on the round trip — the
  tolerance is 0.1°, noted in the test). Zero diameter, >360°,
  and negative arc all throw.
- **Coil check** — 2.8 Ω / 11,000 Ω passes; 1.2 Ω primary and
  8,000 Ω secondary fail; boundaries 2.5 Ω and 3.1 Ω pass; 3.2 Ω
  fails the factory spec (and the test notes it passes the wider
  Dyna 2.5–3.5 Ω range). Primary-only check works; no measurements
  throws.
- **V.O.E.S. check** — closed (0.5 Ω) at 4.0 inHg passes; closed
  at 2.0 inHg (too early) fails; open at 6.0 inHg (failed to close)
  fails; open at rest passes; closed at rest fails. Negative vacuum
  throws.
- **LED decoder** — rapid flash = over-current fault; cranking
  blink cites the 45° BTDC window; power-on blink = self test;
  unknown pattern throws.
- **Factory data sanity** — timing 20° BTDC at 1050–1500 rpm,
  plate torque 15–30 in-lbs, inner cover 12–20 in-lbs, VOES closes
  at 3.5–4.5 inHg, plug gap 0.038–0.043 in, rotor HD 32402-83,
  dynamic check 35° by 1500 rpm, 8 curves total.
- **Log validation** — good entries pass; bad date, curve 5, and
  empty result throw.

### Two real bugs the tests caught (fixed, not waived)

1. **mm and inches disagreed.** `markArc` rounded inches to 2
   decimals but computed mm from the unrounded value, so 1.48 in
   showed 37.67 mm instead of 37.59 mm. Fix: derive mm from the
   rounded inches so the two displayed numbers agree.
2. **Bike field saved empty.** The HTML used a `<select>` for the
   bike while `app.js` treated it as a text input with a datalist,
   so `.value` stayed empty and every log save failed validation
   ("Log entry needs a bike"). Caught by the UI test, not the
   engine tests. Fix: the bike field is now a text input with a
   datalist of the example bikes.

## UI test — real browser (Playwright) — PASSED

`python3 test_ui.py` drives the app in headless Chromium
(Playwright, `pip install playwright` + `playwright install
chromium` — one-time setup, not shipped with the app). It
serves the project dir on localhost and checks:

1. **Timing tab** — stock dynamic renders 8 steps naming the 20°
   setting, the V.O.E.S. check, and the HD-8699 rivets; checking a
   box works; switching to static gives 7 steps citing the 5 V
   drop; Dyna static cites the 45° BTDC LED window; Dyna dynamic
   cites 35°.
2. **Log save from the Timing tab** — a result saves and the
   confirmation appears.
3. **Dyna configurator** — curve 3 / 7000 rpm / single fire /
   single plug returns final advance 32°, coil DC6-5, and the
   power-cycle reminder; the switch table renders. Build level
   "built" suggests curve 3 and sets the select.
4. **Mark math** — 20° on 8.5 in = 1.48 in; 1.48 in back-converts
   to ~19.95°.
5. **Bench tests** — coil 2.8 Ω / 11,000 Ω PASS, 1.2 Ω primary
   FAIL; VOES 4.0 inHg / 0.5 Ω closed; rapid-flash LED decodes to
   over-current.
6. **Reference tab** — renders with 20° BTDC, rotor 32402-83,
   #99482-98, 2801103, and the 3.5–4.5 inHg VOES range.
7. **Log tab** — the entry saved in step 2 appears with its bike
   and result text.
8. **About tab** renders.
9. **Offline** — reload with the network cut: the service worker
   cache serves the app shell and the procedure renders. No page
   errors, no failed requests anywhere in the run.

## v1.1.0 restyle — Evo visual system (palette 1a), Nov 18, 2026

The v1.0.0 ship wore the dyno's old dark-charcoal/amber look. v1.1.0
restyles the app to the house system shared with the bike maintenance
log and the Evo wiring planner: aged-cream shop paper with a
blue-green graph grid, heavy black ink, Special Elite typewriter
display type, Caveat eyebrow, Chivo body, IBM Plex Mono for data, and
the red-wire orange accent. No rounded corporate cards, hard offset
shadows, radius 0. Fonts load from Google Fonts with graceful
offline fallback (system/Courier stacks) — same pattern as the bike
log. Changed files: `styles.css` (full rewrite), `index.html` (font
links, theme-color, eyebrow), `manifest.webmanifest` (theme colors),
`sw.js` (cache v1 → v2), About version line. No behavior changed.

After the restyle: `node test.js` still 84/84; `python3 test_ui.py`
passes in full. One test change: the UI test now tolerates the two
Google Fonts hosts failing (they are unreachable in this sandbox and
fall back by design) while still failing on any other failed request
— see the `font_hosts` filter in `test_ui.py`. The test docstring
was corrected too ("no external requests" is no longer true).

## Visual check

Screenshots of the Timing and Dyna 2000i tabs in headless Chromium
(390×844, phone width) were eyeballed after the v1.1.0 restyle:
aged-cream paper with graph grid and coffee-ring patina, typewriter
headings, red-wire eyebrow and accents, hard-shadow cards and
fieldsets, mono inputs and bottom nav with all seven tabs. No layout
overflow at 390 px width. (Screenshots render with fallback type in
this sandbox — the CDN fonts are unreachable here; on a phone they
load as Special Elite / Caveat / Chivo / IBM Plex Mono.)

## Static-server check

`python3 -m http.server` serves every asset with HTTP 200
(index, timing.js, app.js, styles.css, manifest, sw.js, all three
icons) — confirmed in the UI test's request log (zero failed
requests).

## Spec verification (done by hand, not by the tests)

Every number in `timing.js` was checked against its source before
shipping:

- Factory values read directly from the 1997–1998 Softail Service
  Manual #99482-98 text (Ch. 1, pp. 1-47–1-48; Ch. 8, pp. 8-9–8-12):
  20° BTDC at 1050–1500 rpm, 5000-mile check interval, TDC vertical
  line / advance 20° BTDC marks, plate screws 15–30 in-lbs,
  inner cover 12–20 in-lbs, 5 V → 0–1 V static transition, VOES
  closes <1 Ω at 3.5–4.5 inHg, coil 2.5–3.1 Ω / 10,000–12,500 Ω,
  plugs 5R6A gap 0.038–0.043 in, idle 1000–1050 rpm, tools
  HD-96295-65D / HD-33813 / HD-8699 / HD-23738.
- Dyna values read from the Dynatek Dyna 2000i-P instruction sheet
  (part 2801103 Rev. C): switch table, curve final timing
  (35/35/32/30° from the retard chart), rev limits, coil picks,
  rotor 32402-83, LED behavior, static/dynamic procedures, wire
  colors, power-cycle rule.
- The 1995-and-later flywheel note is from the Dyna 2000
  instructions Rev. 2/99 and is labeled as such in the app.
- No flywheel diameter is assumed anywhere: mark math requires the
  user to measure and enter theirs. The 8.5 in figure in the
  README and UI examples is labeled as an example.
- Curves 5–8 are deliberately absent from the configurator: the
  sheet gives no switch positions for them (DIPK-1 programmable
  only). The engine throws on curve 5 rather than guessing.

## Known limits

- Engine tests cover the engine; the UI test covers one path per
  tab. It does not exercise every procedure variant's full text
  (all four procedures render and their step counts are asserted).
- Playwright was installed into this machine's user site-packages
  for the test run (`pip install --user playwright` + `playwright
  install chromium`); it is a test dependency, not part of the app.
