/* Ignition Timing Helper — engine + sourced data.
 *
 * Plain JavaScript, no dependencies. Runs in the browser and under
 * Node for tests (module.exports at the bottom).
 *
 * SPEC POLICY — this file will never invent a torque, clearance, or
 * spec value. Every number below carries its published source:
 *
 *   [FACTORY]  Harley-Davidson 1997–1998 Softail Service Manual
 *              #99482-98 (Chapter 1, "Ignition Timing and V.O.E.S.";
 *              Chapter 8, "Ignition Timing" / "V.O.E.S.").
 *   [DYNA]     Dynatek Dyna 2000i-P instructions, part 2801103
 *              Rev. C (manufacturer's instruction sheet, as supplied
 *              with the unit).
 *   [DYNA-2000] Dynatek Dyna 2000 instructions, Rev. 2/99 — the
 *              earlier 2000-series sheet; used only where noted.
 *
 * Where a value is not published, the field says so and the UI
 * refuses to guess.
 */
'use strict';

/* ------------------------------------------------------------------ */
/* Factory data — Harley #99482-98                                     */
/* ------------------------------------------------------------------ */

var FACTORY = {
  source: 'Harley-Davidson 1997–1998 Softail Service Manual #99482-98, ' +
          'Ch. 1 "Ignition Timing and V.O.E.S." and Ch. 8 "Ignition Timing"',
  // Timing setting, stock ignition module.
  timingSettingDeg: 20,            // degrees BTDC
  timingSettingRpmLow: 1050,
  timingSettingRpmHigh: 1500,
  checkIntervalMiles: 5000,        // check every 5000 mi (8000 km)
  // Flywheel marks (Fig. 1-20 / Fig. 8-4).
  marks: {
    tdc: 'Vertical line — front cylinder top dead center',
    advance: 'Front cylinder advance timing mark — 20° BTDC'
  },
  // Static timing, stock cam position sensor (Ch. 8): voltmeter
  // across the sensor connector reads 5 V (+/-0.5) and drops to
  // 0–1 V as the plate is rotated to the firing point.
  staticVoltHigh: 5,
  staticVoltHighTol: 0.5,
  staticVoltLowMax: 1,
  // Torque values.
  sensorPlateTorque: { inLbs: [15, 30], nm: [1.7, 3.4] },
  innerCoverTorque: { inLbs: [12, 20], nm: [1.4, 2.3] },
  // Coil (quick reference / Ch. 2 electrical specs).
  coilPrimaryOhms: [2.5, 3.1],
  coilSecondaryOhms: [10000, 12500],
  // Plugs and idle.
  plug: 'HD No. 5R6A (no substitute)',
  plugGapIn: [0.038, 0.043],
  plugGapMm: [0.97, 1.09],
  idleRpm: [1000, 1050],
  // V.O.E.S. inspection (Ch. 8): switch closes (<1 ohm) at
  // 3.5–4.5 inHg vacuum; open circuit at rest.
  voesCloseInHg: [3.5, 4.5],
  voesCloseMmHg: [89, 114],
  voesClosedOhmsMax: 1,
  // Special tools.
  tools: [
    { part: 'HD-96295-65D', what: 'Timing mark view plug (screws into the timing inspection hole)' },
    { part: 'HD-33813', what: 'Inductive timing light' },
    { part: 'HD-8699', what: 'Outer timer cover rivets (special rivets only — regular rivets can fall into the timing compartment)' },
    { part: 'HD-23738', what: 'Vacuum pump (V.O.E.S. test)' }
  ]
};

/* ------------------------------------------------------------------ */
/* Dyna 2000i-P data — Dynatek instructions 2801103 Rev. C            */
/* ------------------------------------------------------------------ */

var DYNA = {
  source: 'Dynatek Dyna 2000i-P instructions, part 2801103 Rev. C ' +
          '(manufacturer instruction sheet)',
  fits: '1983 and later Harley-Davidson EVO motors. Replaces the ' +
        'factory ignition module and sensor; fits inside the engine ' +
        'in place of the cam sensor / point plate.',
  rotor: 'Gold colored timing rotor, HD part no. 32402-83. The earlier ' +
         'silver colored cup will not work properly.',
  coilPrimaryOhms: [2.5, 3.5],
  // Switch-selectable advance curves 1–4. Final timing values come
  // from the retard chart in the instructions (final timing per
  // curve, and 25° with retard activated). Curves 5–8 are
  // user-programmable with the optional DIPK-1 / CurveMaker kit —
  // the sheet lists no switch positions or numbers for them, so
  // they are not selectable here.
  curves: {
    1: { finalDeg: 35, totalRetardDeg: 10,
         blurb: 'Most aggressive — brings the advance in earliest and to the highest final value.',
         use: 'Try it if the bike runs clean on curve 2 and you want more.' },
    2: { finalDeg: 35, totalRetardDeg: 10,
         blurb: 'Near stock — brings the advance in a little slower than curve 1 to prevent detonation on near-stock motors.',
         use: 'Start here. Dynatek: "Start with curve 2 which is similar to the stock curve."' },
    3: { finalDeg: 32, totalRetardDeg: 7,
         blurb: 'Built motors that tend to detonate — advance comes in slower than curve 2 and to a lower final value.',
         use: 'First move if you hear pinging on curve 2.' },
    4: { finalDeg: 30, totalRetardDeg: 5,
         blurb: 'Least aggressive — advance comes in still slower and to a lesser final value than curve 3.',
         use: 'Only if the motor still detonates on curve 3.' }
  },
  curveCount: 8,          // 4 switch-selectable + 4 programmable (DIPK-1)
  programmableNote: 'Curves 5–8 are user-defined with the optional ' +
    'DIPK-1 programming kit (CurveMaker software). The instruction ' +
    'sheet gives no switch positions or numbers for them — program ' +
    'them from the kit, not from this tool.',
  // Rev limits, switches 4 + 5.
  revLimits: {
    6000: { application: 'Stock motor' },
    6500: { application: 'Modified street motor' },
    7000: { application: 'Race motor' },
    7500: { application: 'Race motor (most Harley valve trains don\'t like to be revved this high)' }
  },
  retardLimitDeg: 25,     // timing with retard activated (switch 1 ON, violet wire grounded)
  // Dynamic timing check: all switches OFF + VOES wire grounded
  // gives 35° advance by 1500 rpm.
  dynamicCheck: {
    switches: 'All six switches OFF, VOES (violet) wire grounded',
    advanceDeg: 35,
    rpm: 1500,
    note: 'Rev the engine above 1500 rpm — the full advance mark should come into view. ' +
          'Reset the DIP switches for the mode you want to run afterwards, and cycle ' +
          'power off and back on: switch changes only take effect after a power cycle.'
  },
  // Static timing: LED on at ~45° BTDC, off at TDC while cranking.
  ledOnDeg: 45,           // LED comes on about 45° BTDC
  ledOffDeg: 0,           // LED goes off at TDC
  // Wire colors (single-fire wiring; dual-fire leaves the blue wire unconnected).
  wires: [
    { color: 'White', what: '+12 V from the key / Run-Stop switch (find the wire that has +12 V with key and Run/Stop both on)' },
    { color: 'Pink', what: 'Coil (-) — dual fire: the coil primary. Single fire: rear cylinder coil (-)' },
    { color: 'Blue', what: 'Single fire only: front cylinder coil (-). Left unconnected in dual-fire installations' },
    { color: 'Green', what: 'Tach output (.250 blade). Do NOT connect the tach wire to the coil — damage to the ignition may result' },
    { color: 'Purple / violet', what: 'V.O.E.S. wire (.187 receptacle). Grounds through the VOES under light load' }
  ],
  plugWires: 'Carbon, graphite or spiral-core suppression spark plug wires are required. ' +
             'Do not use metal-core wires. (Dyna 2000 instructions Rev. 2/99: 300–4000 ohms per foot.)',
  // 1995-and-later flywheel note, from the Dyna 2000 Rev. 2/99 sheet.
  lateFlywheelNote: 'Per the Dyna 2000 instructions (Rev. 2/99): the timing mark on 1995 and ' +
    'later Evo flywheels is for idle advance. Use a dial-back timing light with the TDC mark ' +
    'on those bikes — do not trust the advance mark alone.'
};

/* Coil recommendations — Dyna 2000i-P instructions. Primary
 * resistance must be 2.5–3.5 ohms in every case. */
function coilPick(firingMode, plugs) {
  if (firingMode !== 'dual' && firingMode !== 'single') {
    throw new Error('Firing mode must be "dual" or "single".');
  }
  if (plugs !== 1 && plugs !== 2) {
    throw new Error('Plugs per cylinder must be 1 or 2.');
  }
  var out;
  if (firingMode === 'dual') {
    out = plugs === 1
      ? { coils: 'One Dynatek DC6-1, or the stock coil',
          note: 'One dual-output coil, primary 2.5–3.5 ohms.' }
      : { coils: 'Two Dynatek DC2-1 coils wired in series (equals 3 ohms)',
          note: 'Dual-plug heads in dual-fire mode need two coils in series.' };
  } else {
    out = plugs === 1
      ? { coils: 'Dynatek DC6-5 Twin-Fire II, or two DC3-1 single-output coils',
          note: 'Two coils, one firing each cylinder.' }
      : { coils: 'Two Dynatek DC1-1 coils, or a DC6-4 Twin-Fire',
          note: 'Dual-plug heads in single-fire mode.' };
  }
  out.primaryOhms = DYNA.coilPrimaryOhms.slice();
  out.source = DYNA.source;
  return out;
}

/* ------------------------------------------------------------------ */
/* Mode-switch configurator — Dyna 2000i-P, 6 switches                */
/* ------------------------------------------------------------------ */

/* cfg: { curve: 1–4, revLimit: 6000|6500|7000|7500,
 *        voes: 'normal' | 'retard', firing: 'dual' | 'single' }
 * Returns { switches: {s1..s6: 'OFF'|'ON'}, curve, revLimit, ... }.
 * Throws on anything the instructions do not define. */
function dynaSwitches(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('Configuration object required.');
  var curve = cfg.curve;
  if (curve !== 1 && curve !== 2 && curve !== 3 && curve !== 4) {
    throw new Error('Curve must be 1, 2, 3 or 4 (switch-selectable). Curves 5–8 are programmable with the DIPK-1 kit only.');
  }
  var rev = cfg.revLimit;
  if (rev !== 6000 && rev !== 6500 && rev !== 7000 && rev !== 7500) {
    throw new Error('Rev limit must be 6000, 6500, 7000 or 7500 rpm.');
  }
  var voes = cfg.voes;
  if (voes !== 'normal' && voes !== 'retard') {
    throw new Error('VOES mode must be "normal" or "retard".');
  }
  var firing = cfg.firing;
  if (firing !== 'dual' && firing !== 'single') {
    throw new Error('Firing mode must be "dual" or "single".');
  }

  // Switch 2 + 3 select the curve: 1 = OFF/OFF, 2 = ON/OFF,
  // 3 = OFF/ON, 4 = ON/ON.
  var sw2 = (curve === 2 || curve === 4) ? 'ON' : 'OFF';
  var sw3 = (curve === 3 || curve === 4) ? 'ON' : 'OFF';
  // Switch 4 + 5 select the rev limit: 6000 = OFF/OFF,
  // 6500 = ON/OFF, 7000 = OFF/ON, 7500 = ON/ON.
  var sw4 = (rev === 6500 || rev === 7500) ? 'ON' : 'OFF';
  var sw5 = (rev === 7000 || rev === 7500) ? 'ON' : 'OFF';

  var info = DYNA.curves[curve];
  return {
    switches: {
      s1: voes === 'retard' ? 'ON' : 'OFF',
      s2: sw2, s3: sw3, s4: sw4, s5: sw5,
      s6: firing === 'single' ? 'ON' : 'OFF'
    },
    curve: curve,
    finalAdvanceDeg: info.finalDeg,
    retardLimitDeg: DYNA.retardLimitDeg,
    totalRetardDeg: info.totalRetardDeg,
    revLimit: rev,
    revApplication: DYNA.revLimits[rev].application,
    voes: voes,
    firing: firing,
    voesNote: voes === 'normal'
      ? 'Normal: timing reaches full advance by 1500 rpm under light engine load (VOES grounded). Most bikes run here.'
      : 'Retard: the violet wire is a retard trigger for nitrous/turbo bikes — do NOT connect it to a VOES in this mode. Timing is limited to 25° while the wire is grounded.',
    reminder: 'Cycle power off and back on after changing switches — new settings only take effect after a power cycle.'
  };
}

/* Suggested starting curve for a build, per the instructions:
 * start with curve 2; step down (3, then 4) if it pings. */
function suggestCurve(build) {
  var map = {
    stock: { curve: 2, why: 'Dynatek says start with curve 2, which is similar to the stock curve.' },
    mild: { curve: 2, why: 'Mild bolt-ons (pipes, air cleaner, mild cam) — start on curve 2; try curve 1 if it runs clean.' },
    built: { curve: 3, why: 'Built motor (high compression, hot cam) — curve 3 brings advance in slower and to a lower final value, which is what a detonation-prone motor wants.' },
    detonates: { curve: 3, why: 'Pinging on curve 2 — step to curve 3 first. Only go to curve 4 if it still detonates on 3.' },
    'still-detonates': { curve: 4, why: 'Still pinging on curve 3 — curve 4 is the least aggressive. If it still pings, the problem is not the curve: check fuel, compression, and carbon.' }
  };
  if (!Object.prototype.hasOwnProperty.call(map, build)) {
    throw new Error('Build must be one of: ' + Object.keys(map).join(', '));
  }
  return map[build];
}

/* ------------------------------------------------------------------ */
/* Flywheel mark math — pure geometry, no spec needed. The user       */
/* measures their own flywheel diameter; the tool only does the math. */
/* ------------------------------------------------------------------ */

/* Arc distance between two timing marks on a flywheel of the given
 * diameter, separated by `degrees`. Returns { inches, mm }. */
function markArc(diameterIn, degrees) {
  if (!(diameterIn > 0)) throw new Error('Flywheel diameter must be a positive number (inches).');
  if (!(degrees >= 0) || degrees > 360) throw new Error('Degrees must be between 0 and 360.');
  var inches = round2(Math.PI * diameterIn * degrees / 360);
  // Derive mm from the rounded inches so the two displayed numbers agree.
  return { inches: inches, mm: round2(inches * 25.4) };
}

/* Degrees of crank rotation for a measured arc distance on a
 * flywheel of the given diameter. */
function markDegrees(diameterIn, arcIn) {
  if (!(diameterIn > 0)) throw new Error('Flywheel diameter must be a positive number (inches).');
  if (!(arcIn >= 0)) throw new Error('Arc distance must be zero or more (inches).');
  return round2(arcIn * 360 / (Math.PI * diameterIn));
}

/* How far apart 1 degree is on this flywheel — handy when scribing
 * your own mark. */
function oneDegreeArc(diameterIn) {
  return markArc(diameterIn, 1);
}

function round2(x) { return Math.round(x * 100) / 100; }

/* ------------------------------------------------------------------ */
/* Bench tests — compare a measurement against the published spec.    */
/* ------------------------------------------------------------------ */

/* Coil resistance check against the factory spec (#99482-98).
 * Pass null for a side you did not measure. */
function coilCheck(primaryOhms, secondaryOhms) {
  var p = FACTORY.coilPrimaryOhms, s = FACTORY.coilSecondaryOhms;
  var out = { primary: null, secondary: null, verdict: '', ok: null };
  if (primaryOhms !== null && primaryOhms !== undefined && primaryOhms !== '') {
    var pv = Number(primaryOhms);
    if (isNaN(pv)) throw new Error('Primary resistance must be a number.');
    out.primary = { value: pv, spec: p, ok: pv >= p[0] && pv <= p[1] };
  }
  if (secondaryOhms !== null && secondaryOhms !== undefined && secondaryOhms !== '') {
    var sv = Number(secondaryOhms);
    if (isNaN(sv)) throw new Error('Secondary resistance must be a number.');
    out.secondary = { value: sv, spec: s, ok: sv >= s[0] && sv <= s[1] };
  }
  if (!out.primary && !out.secondary) {
    throw new Error('Measure at least one side of the coil.');
  }
  var tested = [out.primary, out.secondary].filter(Boolean);
  out.ok = tested.every(function (t) { return t.ok; });
  out.verdict = out.ok
    ? 'In spec. Coil primary ' + p[0] + '–' + p[1] + ' Ω, secondary ' +
      s[0].toLocaleString('en-US') + '–' + s[1].toLocaleString('en-US') + ' Ω (factory #99482-98).'
    : 'Out of spec — replace the coil. Factory spec is primary ' + p[0] + '–' + p[1] +
      ' Ω, secondary ' + s[0].toLocaleString('en-US') + '–' + s[1].toLocaleString('en-US') + ' Ω.';
  return out;
}

/* V.O.E.S. vacuum test against the factory spec: the switch must
 * close (<1 ohm) at 3.5–4.5 inHg and be open at rest. */
function voesCheck(vacuumInHg, closedOhms) {
  var range = FACTORY.voesCloseInHg;
  var v = Number(vacuumInHg);
  if (isNaN(v) || v < 0) throw new Error('Vacuum must be a number of inches of mercury, zero or more.');
  var out = { vacuumInHg: v, spec: range.slice(), closed: null, verdict: '', ok: null };
  if (closedOhms !== null && closedOhms !== undefined && closedOhms !== '') {
    var c = Number(closedOhms);
    if (isNaN(c)) throw new Error('Switch resistance must be a number.');
    out.closed = { ohms: c, ok: c < FACTORY.voesClosedOhmsMax };
  }
  if (v === 0) {
    out.verdict = 'At rest (no vacuum) the switch must read open circuit (infinite ohms). ' +
      'If it reads continuity at rest, the VOES is bad.';
    out.ok = out.closed ? !out.closed.ok : null;
    return out;
  }
  if (v < range[0]) {
    out.verdict = 'Below the closing range (' + range[0] + '–' + range[1] + ' inHg) — the switch ' +
      'should still be open here. If it already reads closed, it closes too early: replace it.';
    out.ok = out.closed ? !out.closed.ok : null;
    return out;
  }
  if (v > range[1]) {
    out.verdict = 'Above the closing range (' + range[0] + '–' + range[1] + ' inHg) — the switch ' +
      'must be closed (<1 ohm) by now. If it is still open, replace the VOES.';
    out.ok = out.closed ? out.closed.ok : null;
    return out;
  }
  out.verdict = 'Inside the closing range (' + range[0] + '–' + range[1] + ' inHg) — the switch ' +
    'should be closed (<1 ohm) at this vacuum.';
  out.ok = out.closed ? out.closed.ok : null;
  return out;
}

/* Dyna 2000i status LED decoder. */
function ledMeaning(pattern) {
  var map = {
    'power-on-blink': 'Power-on self test: the LED blinks for 1/4 second, then — if a pickup is near a firing point — blinks and stays on. Unit passed self test.',
    'rapid-flash': 'Over-current or short-circuit fault (engine not running). Check coil primary resistance (2.5–3.5 ohms) and wiring. Turn the ignition off for one second, then back on to clear the fault.',
    'blinks-while-cranking': 'Normal: the LED blinks as the pickups generate timing pulses. It comes on at about 45° BTDC and goes off at TDC for each cylinder.',
    'on-at-tdc': 'While cranking the LED should be OFF at TDC (it goes off at the trailing edge of the rotor window). If it is on at TDC, the module is rotated too far — re-do static timing.',
    'off': 'No power or no pickup signal. Check +12 V on the white wire (key and Run/Stop on), ground, and the rotor (gold cup, HD 32402-83).'
  };
  if (!Object.prototype.hasOwnProperty.call(map, pattern)) {
    throw new Error('LED pattern must be one of: ' + Object.keys(map).join(', '));
  }
  return map[pattern];
}

/* ------------------------------------------------------------------ */
/* Timing log — validation only; storage lives in app.js.             */
/* ------------------------------------------------------------------ */

var LOG_BIKES = ['1995 Fat Boy', '1990 Softail', '1947 Knucklehead', 'Other'];

function validateLogEntry(e) {
  if (!e || typeof e !== 'object') throw new Error('Log entry must be an object.');
  if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
    throw new Error('Log entry needs a date (YYYY-MM-DD).');
  }
  if (typeof e.bike !== 'string' || !e.bike.trim()) {
    throw new Error('Log entry needs a bike.');
  }
  if (e.ignition !== 'stock' && e.ignition !== 'dyna-2000i') {
    throw new Error('Ignition must be "stock" or "dyna-2000i".');
  }
  if (e.method !== 'static' && e.method !== 'dynamic' && e.method !== 'check') {
    throw new Error('Method must be "static", "dynamic" or "check".');
  }
  if (e.ignition === 'dyna-2000i' && e.curve !== null && e.curve !== undefined) {
    if (e.curve !== 1 && e.curve !== 2 && e.curve !== 3 && e.curve !== 4) {
      throw new Error('Dyna curve in a log entry must be 1–4.');
    }
  }
  if (typeof e.result !== 'string' || !e.result.trim()) {
    throw new Error('Log entry needs a result (what you saw / set).');
  }
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FACTORY: FACTORY, DYNA: DYNA, LOG_BIKES: LOG_BIKES,
    dynaSwitches: dynaSwitches, suggestCurve: suggestCurve,
    coilPick: coilPick, markArc: markArc, markDegrees: markDegrees,
    oneDegreeArc: oneDegreeArc, coilCheck: coilCheck,
    voesCheck: voesCheck, ledMeaning: ledMeaning,
    validateLogEntry: validateLogEntry
  };
}
