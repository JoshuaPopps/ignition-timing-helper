# Ignition Timing Helper

Static and dynamic ignition timing for Evo Harleys, Dyna 2000i
setup, flywheel mark math, and the bench tests that back them up —
as a phone app you install from the browser. No app store, no
account, no server.

Pick your ignition and the job, walk the steps with the timing
light in your hand, and log what you set so the next time you time
a bike you know what you did last time. Every spec comes from a
published source — the tool never invents one.

> All bikes, names, and numbers below are examples only.

## What it does

- **Timing tab** — step-by-step walkthroughs with checkboxes, for
  four jobs: stock module dynamic (timing light), stock module
  static (voltmeter), Dyna 2000i static (LED), Dyna 2000i dynamic
  (timing light). Each step quotes the source procedure, including
  the factory V.O.E.S. check that must run with every advance
  check. Log the result per bike when you are done.
- **Dyna 2000i tab** — mode-switch configurator: pick a build level
  (it suggests a starting curve), advance curve 1–4, rev limit
  (6000/6500/7000/7500 rpm), V.O.E.S. mode, firing mode, and plugs
  per cylinder. It returns the six switch positions, the final
  advance and retard for that curve, the rev-limit application, and
  the right coil for the setup (DC6-1, DC2-1, DC6-5, DC3-1, DC1-1,
  or DC6-4 — per the Dynatek sheet).
- **Mark Math tab** — flywheel geometry: degrees ↔ arc distance
  between timing marks. You measure your own flywheel diameter;
  the tool only does the arithmetic. No spec to look up, no number
  invented.
- **Tests tab** — bench tests that grade a measurement against the
  published spec: coil resistance (primary 2.5–3.1 Ω, secondary
  10,000–12,500 Ω), V.O.E.S. vacuum closing point (3.5–4.5 inHg),
  and a Dyna 2000i status-LED decoder.
- **Reference tab** — every number in the tool with its source:
  factory timing setting (20° BTDC at 1050–1500 rpm), torque
  values, coil and plug specs, V.O.E.S. spec, special tools,
  Dyna 2000i curves / rev limits / coils / wires / LEDs.
- **Log tab** — per-bike timing log (date, bike, ignition, method,
  curve, result, notes). Lives on the device; JSON export/import
  for backup or moving to another device.
- **Installable & offline** — open it in Chrome (Android) or Safari
  (iPhone), "Add to Home Screen," and it works in the garage with
  no signal. Plain JavaScript, zero dependencies — no runtime
  download, no network at all. A service worker caches the app
  shell after the first load.

## Install

No build step for the app itself. Any static host works — GitHub
Pages, a folder on your home server, or just the files on disk:

```bash
# Local preview
python3 -m http.server 8000
# then open http://localhost:8000/ on your phone or desktop
```

On your phone, open the hosted URL and use **Add to Home Screen**
(Android Chrome: menu → Add to Home Screen; iPhone Safari: Share →
Add to Home Screen). It then launches full-screen like a native app
and works offline from the first visit — there is no runtime to
download and nothing to fetch from the network.

To test after editing the engine:

```bash
node test.js            # 84 engine tests, no dependencies
python3 test_ui.py      # real-browser UI test (Playwright, see TESTING.md)
```

## Try it

Time the stock module dynamically — the factory procedure:

```
1. Fit the view plug (HD-96295-65D) — do not let it touch the flywheel
2. Timing light (HD-33813) on the front plug wire, battery +, ground
3. Vacuum hose on at the carburetor and the V.O.E.S.
4. Hold 1050–1500 rpm — the 20° BTDC advance mark should sit centered
   in the inspection hole
5. Off? Loosen the sensor plate screws, rotate the plate with a
   screwdriver in the notch, tighten to 15–30 in-lbs
6. V.O.E.S. check: pull the vacuum hose at idle — timing retards,
   rpm drops; reinstall — the mark reappears, rpm rises
```

Or set up a Dyna 2000i for a mild bolt-on Evo, single fire:

```
  Build: mild bolt-ons → start on curve 2
  Curve 2, 6500 rpm limit, normal V.O.E.S., single fire, single plug
  Switches: 1 OFF, 2 ON, 3 OFF, 4 ON, 5 OFF, 6 ON
  Final advance 35°, retard limit 25°
  Coil: DC6-5 Twin-Fire II (or two DC3-1), primary 2.5–3.5 ohms
  Remember: cycle power off and on — switch changes only take
  effect after a power cycle.
```

Or check a coil on the bench:

```
  Primary 2.8 Ω, secondary 11,000 Ω → PASS
  (factory spec: primary 2.5–3.1 Ω, secondary 10,000–12,500 Ω)
```

## Where the numbers come from

- **Factory procedures and specs** — Harley-Davidson 1997–1998
  Softail Service Manual #99482-98, Chapter 1 ("Ignition Timing
  and V.O.E.S.") and Chapter 8 ("Ignition Timing", "V.O.E.S.").
  Timing setting 20° BTDC at 1050–1500 rpm, check every 5000
  miles; sensor plate screws 15–30 in-lbs; inner cover screws
  12–20 in-lbs; coil primary 2.5–3.1 Ω / secondary 10,000–12,500
  Ω; V.O.E.S. closes below 1 Ω at 3.5–4.5 inHg; plugs HD 5R6A,
  gap 0.038–0.043 in; idle 1000–1050 rpm.
- **Dyna 2000i curves, switches, coils, LEDs** — Dynatek Dyna
  2000i-P instructions, part 2801103 Rev. C (the manufacturer's
  instruction sheet): 8 advance curves (4 switch-selectable +
  4 programmable via the DIPK-1 kit), 4 rev limits, coil primary
  2.5–3.5 Ω, gold rotor HD 32402-83, LED on at ~45° BTDC / off at
  TDC, dynamic check 35° by 1500 rpm with all switches OFF and
  the VOES wire grounded.
- **One note from the earlier sheet** — the 1995-and-later
  flywheel mark warning (mark is for idle advance; use a
  dial-back light with the TDC mark) comes from the Dynatek Dyna
  2000 instructions, Rev. 2/99, and is labeled as such wherever
  it appears.

## On specs: real numbers or nothing

This tool will never invent a torque, clearance, or spec value.
The rules it follows:

- **Every number carries its source**, shown in the Reference tab
  and next to the result that uses it.
- **Curves 5–8 on the 2000i are programmable-only.** The
  instruction sheet gives no switch positions or numbers for
  them, so the configurator refuses them instead of guessing.
- **Mark math takes your measurement.** Flywheel diameters vary
  by year and model; the tool asks for yours instead of assuming
  one. The 20° factory advance mark is quoted as a reference, not
  baked into the math.
- **The factory spec and the Dyna spec are kept separate.** The
  coil test grades against the factory 2.5–3.1 Ω primary; the
  Dyna 2000i accepts 2.5–3.5 Ω. Where they differ, the tool says
  so — a 3.2 Ω primary passes for the 2000i but fails the factory
  spec, and the test result names that.

## Files

| File | What it is |
|---|---|
| `index.html` | App shell (Timing / Dyna 2000i / Mark Math / Tests / Reference / Log / About) |
| `timing.js` | Engine + all sourced data (source of truth) |
| `app.js` | UI — procedures, configurator, tests, log |
| `test.js` | 84 engine tests — `node test.js` |
| `test_ui.py` | Real-browser UI test (Playwright) — see TESTING.md |
| `styles.css` | Shop-manual styling, big touch targets |
| `sw.js` | Service worker — caches the app for offline use |
| `manifest.webmanifest` | Install metadata (name, icons, colors) |
| `icons/` | App icons (192/512 PNG + SVG) |
| `make_icons.py` | Renders the PNG icons from the flywheel-mark design |

## Testing

See [TESTING.md](TESTING.md) for the full test log: 84 engine
tests (`node test.js`), a real-browser UI test that drives the
actual app in headless Chromium (procedures, Dyna configurator,
mark math, bench tests, reference, log, offline reload), and a
static-server check that every asset serves.

## Known limits

- Covers the stock Evo ignition module and the Dyna 2000i only.
  Other ignitions (Dyna S, Crane HI-4, Daytona Twin Tec, points)
  are not in this tool — their procedures and curves are different
  and are not sourced here.
- Factory specs are from the 1997–1998 Softail manual. Other
  model years may differ — your manual wins if they disagree.
- The log lives in one browser on one device. Export the JSON to
  back it up or move it.

## Version history

- **v1.1.0** (Nov 18, 2026) — restyled to the Evo visual system
  (palette 1a): aged-cream shop paper, typewriter display type,
  red-wire accent. Same specs, same behavior, new look.
- **v1.0.0** (Nov 18, 2026) — first release.

## License

MIT. Do whatever you want with it — it's a garage tool.
