/* Ignition Timing Helper — UI.
 * Plain JavaScript, no dependencies. The engine lives in timing.js;
 * this file only wires the DOM. The timing log lives in this
 * browser's localStorage and moves as a JSON file you export. */
'use strict';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function $(id) { return document.getElementById(id); }
function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function todayISO() {
  var d = new Date();
  function p(n) { return (n < 10 ? '0' : '') + n; }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

/* ------------------------------------------------------------------ */
/* Bottom nav                                                          */
/* ------------------------------------------------------------------ */

var navButtons = document.querySelectorAll('.nav button');
navButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    navButtons.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    $(btn.getAttribute('data-view')).classList.add('active');
    window.scrollTo(0, 0);
    if (btn.getAttribute('data-view') === 'view-log') renderLog();
  });
});

/* ------------------------------------------------------------------ */
/* Timing procedures — steps quoted from the published sources.       */
/* ------------------------------------------------------------------ */

var PROCEDURES = {
  'stock-dynamic': {
    note: 'Factory setting: 20° BTDC at 1050–1500 rpm. Check every 5000 miles. Source: #99482-98, Ch. 1 and Ch. 8.',
    steps: [
      { t: 'Fit the view plug', d: 'Remove the timing plug from the inspection hole (left side of the crankcase, below the cylinders). Screw in the timing mark view plug, HD-96295-65D — be sure it does not touch the flywheel.' },
      { t: 'Hook up the timing light', d: 'Connect the inductive timing light (HD-33813) to the front spark plug cable, battery positive terminal, and a suitable ground.' },
      { t: 'Check the vacuum hose', d: 'Be sure the vacuum hose is properly installed at the carburetor and at the V.O.E.S.' },
      { t: 'Run it at 1050–1500 rpm', d: 'Start the engine and hold 1050–1500 rpm. (No tach? Connect a test tachometer to the negative ignition coil terminal.) The light flashes each time the front plug fires.' },
      { t: 'Read the mark', d: 'Aim the timing light into the inspection hole. The front cylinder advance timing mark (20° BTDC) should be centered in the hole.' },
      { t: 'If it is off', d: 'Remove the timer covers. Loosen the cam position sensor screws just enough that the plate can be rotated with a screwdriver in the notch. With the light aimed into the hole, rotate the plate until the mark is centered. Tighten the plate screws to 15–30 in-lbs (1.7–3.4 Nm).' },
      { t: 'V.O.E.S. check — always', d: 'Factory caution: always check V.O.E.S. operation when checking advance timing, or the engine may run with too much advance and knock. With the engine idling, pull the vacuum hose off the carburetor and plug the fitting — timing retards and rpm drops. Reinstall the hose — the mark reappears and rpm rises. If it does not, check the V.O.E.S. connector directly above the switch; replace the V.O.E.S. if it is malfunctioning.' },
      { t: 'Button it up', d: 'Remove the view plug and install the hex socket timing plug. Reinstall the timer covers — outer cover with NEW special rivets, HD-8699, only. Regular rivets can fall into the timing compartment.' }
    ]
  },
  'stock-static': {
    note: 'Static timing gets you close; the strobe finishes the job. The voltmeter reads 5 V (±0.5) and drops to 0–1 V at the firing point. Source: #99482-98, Ch. 8.',
    steps: [
      { t: 'Make it safe to turn over', d: 'Disconnect the battery cables, negative cable first. Remove the spark plugs — the crank turns much easier without compression fighting you.' },
      { t: 'Find the compression stroke', d: 'Jack up the rear wheel and shift into fifth gear. Standing on the left side, slowly rotate the rear wheel counter-clockwise until the front intake valve opens and closes (watch through the spark plug hole).' },
      { t: 'Find TDC', d: 'Keep rotating until the TDC mark (vertical line) is centered in the timing inspection hole.' },
      { t: 'Hook up the meter', d: 'Connect a voltmeter between the GN (+) and BK/W (−) wires on the cam position sensor connector (a test harness helps). Turn the ignition switch to IGNITION.' },
      { t: 'Set the plate', d: 'Loosen the two sensor plate screws and rotate the plate just until the voltmeter changes from 5 V (±0.5 V) to 0–1 V. That is the firing point.' },
      { t: 'Lock it down', d: 'Tighten the sensor plate screws to 15–30 in-lbs (1.7–3.4 Nm). Install the spark plugs, shift to neutral, remove the jack.' },
      { t: 'Reconnect and verify', d: 'Reconnect the battery, positive cable first. Now do the dynamic check (timing light) — static timing compensates for production tolerances in the rotor, cam indexing, and flywheel marking only when verified with the strobe.' }
    ]
  },
  'dyna-2000i-static': {
    note: 'Static timing with the 2000i uses its red LED: on at about 45° BTDC, off at TDC. Source: Dynatek 2801103 Rev. C.',
    steps: [
      { t: 'Find TDC on the front cylinder', d: 'Remove the timing inspection plug. Bike in high gear, turn the rear wheel to get the crankshaft to top dead center on the compression stroke of the front cylinder (TDC mark aligned in the inspection hole). Removing the spark plugs makes it easier to turn.' },
      { t: 'Watch the LED', d: 'Turn the ignition on. As the engine is cranked the red LED blinks; it comes on at about 45° BTDC and goes off at TDC for each cylinder. That is the leading edge of the window in the rotating cup (45° BTDC) and the trailing edge (TDC).' },
      { t: 'Set the plate', d: 'Rotate the 2000i base plate clockwise and find the point where the LED just turns off. Lock the 2000i down. Initial timing is now set close to optimum.' },
      { t: 'If it runs out of adjustment', d: 'If the 2000i has to be rotated an extreme amount, the engine may be on its exhaust stroke. Remove the ignition and look at the timing rotor: the pickup (nearest the switches) should be sitting in one of the windows, with the shorter distance to the other window CLOCKWISE. If not, rotate the crankshaft one revolution and check again.' },
      { t: 'Verify dynamically', d: 'Static timing gets you close. Final timing is checked and set dynamically (timing light) to compensate for production tolerances in the timing rotor, camshaft indexing, and flywheel marking.' }
    ]
  },
  'dyna-2000i-dynamic': {
    note: 'Dynamic check: all switches OFF + VOES grounded = 35° advance by 1500 rpm. Source: Dynatek 2801103 Rev. C.',
    steps: [
      { t: 'Set the check mode', d: 'Set all six mode switches to OFF and ground the VOES (violet) wire. This makes the ignition advance 35° by 1500 rpm.' },
      { t: 'Hook up the light', d: 'Connect a timing light to the front cylinder plug wire.' },
      { t: 'Rev past 1500 rpm', d: 'Rev the engine above 1500 rpm. The full advance mark should come into view — that verifies the ignition is set properly.' },
      { t: 'If the mark is off', d: 'Rotate the module to shift the whole curve: clockwise advances, counter-clockwise retards. Move it one or two degrees at a time — excessive advance causes pinging and hard starting.' },
      { t: 'Set your running mode', d: 'Reset the DIP switches for the mode you want to run — use the Dyna 2000i tab for the switch positions.' },
      { t: 'Power cycle', d: 'Turn power off and back on. Switch changes only take effect after a power cycle.' },
      { t: '1995-and-later flywheels', d: 'Per the Dyna 2000 instructions (Rev. 2/99): the timing mark on 1995 and later Evo flywheels is for idle advance. Use a dial-back timing light with the TDC mark on those bikes.' }
    ]
  }
};

function renderTimingSteps() {
  var key = $('t-ignition').value + '-' + $('t-method').value;
  var proc = PROCEDURES[key];
  $('t-method-note').textContent = proc.note;
  var box = $('timing-steps');
  box.innerHTML = '';
  var card = el('div', 'card');
  var h = el('h3', null, 'Steps — ' +
    ($('t-ignition').value === 'stock' ? 'stock module' : 'Dyna 2000i') +
    ', ' + ($('t-method').value === 'static' ? 'static' : 'dynamic'));
  h.style.marginTop = '0';
  card.appendChild(h);
  var ol = el('ol');
  ol.style.paddingLeft = '22px';
  proc.steps.forEach(function (s, i) {
    var li = el('li');
    li.style.marginBottom = '10px';
    var label = el('label');
    label.style.display = 'block';
    label.style.fontWeight = '400';
    label.style.margin = '0';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.style.width = '22px';
    cb.style.height = '22px';
    cb.style.marginRight = '8px';
    cb.style.verticalAlign = 'middle';
    cb.id = 'step-' + key + '-' + i;
    label.appendChild(cb);
    var strong = el('strong', null, s.t + ' — ');
    label.appendChild(strong);
    label.appendChild(document.createTextNode(s.d));
    li.appendChild(label);
    ol.appendChild(li);
  });
  card.appendChild(ol);
  var reset = el('button', 'secondary', 'Reset checklist');
  reset.type = 'button';
  reset.addEventListener('click', function () {
    box.querySelectorAll('input[type="checkbox"]').forEach(function (c) { c.checked = false; });
  });
  card.appendChild(reset);
  box.appendChild(card);
}

$('t-ignition').addEventListener('change', renderTimingSteps);
$('t-method').addEventListener('change', renderTimingSteps);

/* ------------------------------------------------------------------ */
/* Log (localStorage)                                                  */
/* ------------------------------------------------------------------ */

var LOG_KEY = 'ignition-timing-helper-log-v1';

function loadLog() {
  try {
    var raw = localStorage.getItem(LOG_KEY);
    if (!raw) return { version: 1, entries: [] };
    var data = JSON.parse(raw);
    if (!data || !Array.isArray(data.entries)) return { version: 1, entries: [] };
    return data;
  } catch (e) { return { version: 1, entries: [] }; }
}
function saveLog(data) {
  localStorage.setItem(LOG_KEY, JSON.stringify(data));
}

function renderLog() {
  var data = loadLog();
  var box = $('log-list');
  box.innerHTML = '';
  if (!data.entries.length) {
    var empty = el('div', 'card');
    empty.appendChild(el('p', 'muted', 'No timing jobs logged yet. Time a bike on the Timing tab and save the result — it lands here.'));
    box.appendChild(empty);
    return;
  }
  var sorted = data.entries.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  sorted.forEach(function (e, idx) {
    var card = el('div', 'card');
    var h = el('h3', null, esc(e.bike) + ' — ' + esc(e.date));
    h.style.marginTop = '0';
    card.appendChild(h);
    var meta = el('p', 'muted',
      (e.ignition === 'dyna-2000i' ? 'Dyna 2000i' : 'Stock module') +
      ' · ' + e.method +
      (e.curve ? ' · curve ' + e.curve : ''));
    card.appendChild(meta);
    card.appendChild(el('p', null, e.result));
    if (e.notes) card.appendChild(el('p', 'muted', e.notes));
    var del = el('button', 'danger', 'Delete this entry');
    del.type = 'button';
    del.addEventListener('click', function () {
      if (!window.confirm('Delete this log entry?')) return;
      var all = loadLog();
      var pos = all.entries.indexOf(e);
      if (pos !== -1) all.entries.splice(pos, 1);
      saveLog(all);
      renderLog();
    });
    card.appendChild(del);
    box.appendChild(card);
  });
}

function logJSON() { return JSON.stringify(loadLog(), null, 2); }

$('log-export').addEventListener('click', function () {
  var blob = new Blob([logJSON()], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ignition-timing-log.json';
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  $('log-msg').textContent = 'Log downloaded.';
});
$('log-copy').addEventListener('click', function () {
  navigator.clipboard.writeText(logJSON()).then(
    function () { $('log-msg').textContent = 'Log copied to clipboard.'; },
    function () { $('log-msg').textContent = 'Copy failed — use Download instead.'; });
});
function importLogText(text) {
  var data;
  try { data = JSON.parse(text); }
  catch (e) { $('log-msg').textContent = 'Not valid JSON: ' + e.message; return; }
  if (!data || !Array.isArray(data.entries)) {
    $('log-msg').textContent = 'That JSON has no "entries" array.';
    return;
  }
  try { data.entries.forEach(function (e) { validateLogEntry(e); }); }
  catch (e) { $('log-msg').textContent = 'Import rejected: ' + e.message; return; }
  if (!window.confirm('Replace the current log with this import (' + data.entries.length + ' entries)? Export first if you want to keep it.')) return;
  saveLog({ version: 1, entries: data.entries });
  renderLog();
  $('log-msg').textContent = 'Log imported (' + data.entries.length + ' entries).';
}
$('log-import-file').addEventListener('change', function () {
  var file = $('log-import-file').files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () { importLogText(reader.result); };
  reader.readAsText(file);
});
$('log-import-text-btn').addEventListener('click', function () {
  importLogText($('log-import-text').value);
});
$('log-clear').addEventListener('click', function () {
  if (!window.confirm('Delete EVERYTHING in this log? This cannot be undone — export first if you want a backup.')) return;
  saveLog({ version: 1, entries: [] });
  renderLog();
  $('log-msg').textContent = 'Log cleared.';
});

/* Log form on the Timing tab. */
(function () {
  var bike = $('t-bike');
  var list = document.createElement('datalist');
  list.id = 'bike-list';
  LOG_BIKES.forEach(function (b) {
    var o = document.createElement('option');
    o.value = b;
    list.appendChild(o);
  });
  document.body.appendChild(list);
  bike.setAttribute('list', 'bike-list');
  bike.value = LOG_BIKES[0];
  $('t-date').value = todayISO();
})();

$('t-log-btn').addEventListener('click', function () {
  var entry = {
    date: $('t-date').value,
    bike: $('t-bike').value.trim(),
    ignition: $('t-ignition').value,
    method: $('t-method').value,
    curve: null,
    result: $('t-result').value.trim(),
    notes: $('t-notes').value.trim()
  };
  if (entry.ignition === 'dyna-2000i') {
    var curveSel = document.querySelector('#d-curve');
    entry.curve = curveSel ? Number(curveSel.value) : null;
  }
  try { validateLogEntry(entry); }
  catch (e) { $('t-log-msg').textContent = 'Cannot save: ' + e.message; return; }
  var data = loadLog();
  data.entries.push(entry);
  saveLog(data);
  $('t-log-msg').textContent = 'Saved to the log (' + entry.bike + ', ' + entry.date + ').';
  $('t-result').value = '';
  $('t-notes').value = '';
});

/* ------------------------------------------------------------------ */
/* Dyna 2000i configurator                                             */
/* ------------------------------------------------------------------ */

function renderDynaSuggest() {
  var s = suggestCurve($('d-build').value);
  $('d-suggest').textContent = 'Suggested starting curve: ' + s.curve + ' — ' + s.why;
  $('d-curve').value = String(s.curve);
}

$('d-build').addEventListener('change', renderDynaSuggest);

$('d-run').addEventListener('click', function () {
  var out = $('d-results');
  out.innerHTML = '';
  var cfg;
  try {
    cfg = dynaSwitches({
      curve: Number($('d-curve').value),
      revLimit: Number($('d-rev').value),
      voes: $('d-voes').value,
      firing: $('d-fire').value
    });
  } catch (e) {
    var err = el('div', 'warn', 'Cannot configure: ' + e.message);
    out.appendChild(err);
    return;
  }
  var coil = coilPick(cfg.firing, Number($('d-plugs').value));

  var card = el('div', 'card');
  var h = el('h3', null, 'Switch settings — curve ' + cfg.curve +
    ', ' + cfg.revLimit.toLocaleString('en-US') + ' rpm limit, ' +
    (cfg.firing === 'single' ? 'single fire' : 'dual fire'));
  h.style.marginTop = '0';
  card.appendChild(h);

  var table = document.createElement('table');
  var rows = [
    ['Switch 1 — V.O.E.S.', cfg.switches.s1, cfg.voes === 'normal' ? 'Normal' : 'Retard'],
    ['Switch 2 — curve', cfg.switches.s2, ''],
    ['Switch 3 — curve', cfg.switches.s3, ''],
    ['Switch 4 — rev limit', cfg.switches.s4, ''],
    ['Switch 5 — rev limit', cfg.switches.s5, ''],
    ['Switch 6 — firing mode', cfg.switches.s6, cfg.firing === 'single' ? 'Single fire' : 'Dual fire']
  ];
  table.innerHTML = '<tr><th>Switch</th><th class="num">Position</th><th>Means</th></tr>' +
    rows.map(function (r) {
      return '<tr><td>' + esc(r[0]) + '</td><td class="num"><strong>' + r[1] +
        '</strong></td><td>' + esc(r[2]) + '</td></tr>';
    }).join('');
  card.appendChild(table);

  var facts = el('div', null);
  facts.innerHTML =
    '<p><strong>Final advance:</strong> ' + cfg.finalAdvanceDeg + '° ' +
    '(curve ' + cfg.curve + '). With retard activated: limited to ' +
    cfg.retardLimitDeg + '° — ' + cfg.totalRetardDeg + '° of retard.</p>' +
    '<p><strong>Rev limit:</strong> ' + cfg.revLimit.toLocaleString('en-US') +
    ' rpm — ' + esc(cfg.revApplication) + '.</p>' +
    '<p><strong>V.O.E.S.:</strong> ' + esc(cfg.voesNote) + '</p>' +
    '<p><strong>Coil:</strong> ' + esc(coil.coils) + ' — primary resistance ' +
    coil.primaryOhms[0] + '–' + coil.primaryOhms[1] + ' ohms. ' + esc(coil.note) + '</p>' +
    '<p class="muted">' + esc(cfg.reminder) + '</p>';
  card.appendChild(facts);
  out.appendChild(card);

  var curveCard = el('div', 'card');
  var ci = DYNA.curves[cfg.curve];
  curveCard.innerHTML = '<h3 style="margin-top:0">Curve ' + cfg.curve + '</h3><p>' +
    esc(ci.blurb) + '</p><p class="muted">' + esc(ci.use) + '</p>' +
    '<p class="muted">Source: Dynatek Dyna 2000i-P instructions, 2801103 Rev. C. ' +
    'Curves 5–8 are programmable with the optional DIPK-1 kit — this tool does not guess their settings.</p>';
  out.appendChild(curveCard);
});

/* ------------------------------------------------------------------ */
/* Mark math                                                           */
/* ------------------------------------------------------------------ */

$('m-run').addEventListener('click', function () {
  var out = $('m-out');
  out.innerHTML = '';
  try {
    var dia = Number($('m-dia').value);
    var deg = Number($('m-deg').value);
    var r = markArc(dia, deg);
    var one = oneDegreeArc(dia);
    var div = el('div', 'card');
    div.innerHTML = '<p><strong>' + deg + '° on a ' + dia + ' in flywheel = ' +
      r.inches + ' in (' + r.mm + ' mm) between marks.</strong></p>' +
      '<p class="muted">One degree on this flywheel is ' + one.inches +
      ' in (' + one.mm + ' mm). Factory reference: the stock Evo advance mark is 20° BTDC from TDC.</p>';
    out.appendChild(div);
  } catch (e) {
    out.appendChild(el('div', 'warn', e.message));
  }
});

$('m-run2').addEventListener('click', function () {
  var out = $('m-out2');
  out.innerHTML = '';
  try {
    var dia = Number($('m-dia2').value);
    var arcIn = Number($('m-arc').value);
    var deg = markDegrees(dia, arcIn);
    var div = el('div', 'card');
    div.innerHTML = '<p><strong>' + arcIn + ' in on a ' + dia +
      ' in flywheel = ' + deg + '° of crank rotation.</strong></p>' +
      '<p class="muted">For reference: the factory advance mark is 20° BTDC — if your ' +
      'measured gap works out near 20°, you are looking at the advance mark, not TDC.</p>';
    out.appendChild(div);
  } catch (e) {
    out.appendChild(el('div', 'warn', e.message));
  }
});

/* ------------------------------------------------------------------ */
/* Bench tests                                                         */
/* ------------------------------------------------------------------ */

$('c-run').addEventListener('click', function () {
  var out = $('c-out');
  out.innerHTML = '';
  try {
    var r = coilCheck(
      $('c-prim').value === '' ? null : $('c-prim').value,
      $('c-sec').value === '' ? null : $('c-sec').value);
    var div = el('div', 'card');
    var lines = '';
    if (r.primary) {
      lines += '<p>Primary: <strong>' + r.primary.value + ' Ω</strong> — spec ' +
        r.primary.spec[0] + '–' + r.primary.spec[1] + ' Ω — ' +
        (r.primary.ok ? 'PASS' : 'FAIL') + '</p>';
    }
    if (r.secondary) {
      lines += '<p>Secondary: <strong>' + r.secondary.value.toLocaleString('en-US') +
        ' Ω</strong> — spec ' + r.secondary.spec[0].toLocaleString('en-US') + '–' +
        r.secondary.spec[1].toLocaleString('en-US') + ' Ω — ' +
        (r.secondary.ok ? 'PASS' : 'FAIL') + '</p>';
    }
    div.innerHTML = lines + '<p><strong>' + esc(r.verdict) + '</strong></p>' +
      '<p class="muted">Note: the Dyna 2000i accepts coil primaries of 2.5–3.5 Ω, ' +
      'wider than the factory 2.5–3.1 Ω. A 3.2 Ω primary passes for the 2000i but ' +
      'fails the factory spec — this check grades against the factory spec.</p>';
    out.appendChild(div);
  } catch (e) {
    out.appendChild(el('div', 'warn', e.message));
  }
});

$('v-run').addEventListener('click', function () {
  var out = $('v-out');
  out.innerHTML = '';
  try {
    var r = voesCheck($('v-vac').value,
      $('v-ohms').value === '' ? null : $('v-ohms').value);
    var div = el('div', 'card');
    var verdict = '<p><strong>' + esc(r.verdict) + '</strong></p>';
    if (r.closed) {
      verdict += '<p>Switch reading: <strong>' + r.closed.ohms + ' Ω</strong> at ' +
        r.vacuumInHg + ' inHg — ' + (r.closed.ok ? 'closed, as it should be here' : 'not closed') + '.</p>';
    }
    verdict += '<p class="muted">Factory spec: open circuit at rest; closes (&lt;1 Ω) at ' +
      r.spec[0] + '–' + r.spec[1] + ' inHg (89–114 mm Hg). Closure at any other vacuum means replace the V.O.E.S. (#99482-98, Ch. 8).</p>';
    div.innerHTML = verdict;
    out.appendChild(div);
  } catch (e) {
    out.appendChild(el('div', 'warn', e.message));
  }
});

$('l-run').addEventListener('click', function () {
  var out = $('l-out');
  out.innerHTML = '';
  try {
    var div = el('div', 'card');
    div.innerHTML = '<p><strong>' + esc(ledMeaning($('l-pattern').value)) + '</strong></p>' +
      '<p class="muted">Source: Dynatek Dyna 2000i-P instructions, 2801103 Rev. C.</p>';
    out.appendChild(div);
  } catch (e) {
    out.appendChild(el('div', 'warn', e.message));
  }
});

/* ------------------------------------------------------------------ */
/* Reference tab — rendered from the sourced data, not hand-typed.    */
/* ------------------------------------------------------------------ */

(function renderReference() {
  var box = $('reference');
  var F = FACTORY, D = DYNA;

  function section(title, innerHTML) {
    var card = el('div', 'card');
    var h = el('h3', null, title);
    h.style.marginTop = '0';
    card.appendChild(h);
    var div = document.createElement('div');
    div.innerHTML = innerHTML;
    card.appendChild(div);
    box.appendChild(card);
  }

  section('Factory timing — stock module (#99482-98)',
    '<table>' +
    '<tr><td>Timing setting</td><td><strong>' + F.timingSettingDeg + '° BTDC at ' +
    F.timingSettingRpmLow + '–' + F.timingSettingRpmHigh + ' rpm</strong></td></tr>' +
    '<tr><td>Check interval</td><td>Every ' + F.checkIntervalMiles.toLocaleString('en-US') + ' miles (8000 km)</td></tr>' +
    '<tr><td>TDC mark</td><td>' + esc(F.marks.tdc) + '</td></tr>' +
    '<tr><td>Advance mark</td><td>' + esc(F.marks.advance) + '</td></tr>' +
    '<tr><td>Cam position sensor plate screws</td><td>' + F.sensorPlateTorque.inLbs[0] + '–' + F.sensorPlateTorque.inLbs[1] +
    ' in-lbs (' + F.sensorPlateTorque.nm[0] + '–' + F.sensorPlateTorque.nm[1] + ' Nm)</td></tr>' +
    '<tr><td>Inner timer cover screws</td><td>' + F.innerCoverTorque.inLbs[0] + '–' + F.innerCoverTorque.inLbs[1] +
    ' in-lbs (' + F.innerCoverTorque.nm[0] + '–' + F.innerCoverTorque.nm[1] + ' Nm)</td></tr>' +
    '<tr><td>Static timing (stock sensor)</td><td>Voltmeter ' + F.staticVoltHigh + ' V (±' + F.staticVoltHighTol +
    ' V) dropping to 0–' + F.staticVoltLowMax + ' V at the firing point</td></tr>' +
    '<tr><td>Idle speed</td><td>' + F.idleRpm[0] + '–' + F.idleRpm[1] + ' rpm</td></tr>' +
    '<tr><td>Spark plugs</td><td>' + esc(F.plug) + ', gap ' + F.plugGapIn[0] + '–' + F.plugGapIn[1] +
    ' in (' + F.plugGapMm[0] + '–' + F.plugGapMm[1] + ' mm)</td></tr>' +
    '<tr><td>Ignition coil</td><td>Primary ' + F.coilPrimaryOhms[0] + '–' + F.coilPrimaryOhms[1] +
    ' Ω; secondary ' + F.coilSecondaryOhms[0].toLocaleString('en-US') + '–' +
    F.coilSecondaryOhms[1].toLocaleString('en-US') + ' Ω</td></tr>' +
    '<tr><td>V.O.E.S.</td><td>Open at rest; closes (&lt;' + F.voesClosedOhmsMax + ' Ω) at ' +
    F.voesCloseInHg[0] + '–' + F.voesCloseInHg[1] + ' inHg (' +
    F.voesCloseMmHg[0] + '–' + F.voesCloseMmHg[1] + ' mm Hg)</td></tr>' +
    '</table>' +
    '<p class="muted">Source: ' + esc(F.source) + '.</p>');

  section('Special tools',
    '<table>' + F.tools.map(function (t) {
      return '<tr><td><strong>' + esc(t.part) + '</strong></td><td>' + esc(t.what) + '</td></tr>';
    }).join('') + '</table>');

  var curveRows = Object.keys(D.curves).map(function (n) {
    var c = D.curves[n];
    return '<tr><td><strong>Curve ' + n + '</strong></td><td class="num">' + c.finalDeg +
      '°</td><td class="num">' + c.totalRetardDeg + '°</td><td>' + esc(c.blurb) + '</td></tr>';
  }).join('');
  section('Dyna 2000i — advance curves (switch-selectable)',
    '<table><tr><th>Curve</th><th class="num">Final advance</th><th class="num">Retard</th><th>Character</th></tr>' +
    curveRows + '</table>' +
    '<p>Retard mode (switch 1 ON, violet wire grounded) limits timing to ' + D.retardLimitDeg +
    '° regardless of curve. ' + esc(D.programmableNote) + '</p>' +
    '<p class="muted">Source: ' + esc(D.source) + '.</p>');

  var revRows = Object.keys(D.revLimits).map(function (r) {
    return '<tr><td><strong>' + Number(r).toLocaleString('en-US') + ' rpm</strong></td><td>' +
      esc(D.revLimits[r].application) + '</td></tr>';
  }).join('');
  section('Dyna 2000i — rev limits',
    '<table><tr><th>Limit</th><th>Application</th></tr>' + revRows + '</table>' +
    '<p>Dynamic check: ' + esc(D.dynamicCheck.switches) + ' — ' + D.dynamicCheck.advanceDeg +
    '° by ' + D.dynamicCheck.rpm + ' rpm. ' + esc(D.dynamicCheck.note) + '</p>' +
    '<p>Static timing: LED on at about ' + D.ledOnDeg + '° BTDC, off at TDC. ' +
    'Rotate the plate clockwise until the LED just turns off, then lock it down.</p>' +
    '<p class="muted">Source: ' + esc(D.source) + '.</p>');

  section('Dyna 2000i — coils, rotor, wires',
    '<p><strong>Rotor:</strong> ' + esc(D.rotor) + '</p>' +
    '<p><strong>Coil primary:</strong> ' + D.coilPrimaryOhms[0] + '–' + D.coilPrimaryOhms[1] +
    ' ohms (all installations).</p>' +
    '<table><tr><th>Setup</th><th>Coil</th></tr>' +
    '<tr><td>Dual fire, single plug</td><td>Dynatek DC6-1 or stock coil</td></tr>' +
    '<tr><td>Dual fire, dual plug</td><td>Two DC2-1 coils wired in series (equals 3 ohms)</td></tr>' +
    '<tr><td>Single fire, single plug</td><td>DC6-5 Twin-Fire II, or two DC3-1 single-output coils</td></tr>' +
    '<tr><td>Single fire, dual plug</td><td>Two DC1-1 coils, or DC6-4 Twin-Fire</td></tr></table>' +
    '<table><tr><th>Wire</th><th>Goes to</th></tr>' + D.wires.map(function (w) {
      return '<tr><td><strong>' + esc(w.color) + '</strong></td><td>' + esc(w.what) + '</td></tr>';
    }).join('') + '</table>' +
    '<p>' + esc(D.plugWires) + '</p>' +
    '<p class="muted">Source: ' + esc(D.source) + '.</p>');

  section('1995-and-later flywheel note',
    '<p>' + esc(D.lateFlywheelNote) + '</p>' +
    '<p class="muted">Source: Dynatek Dyna 2000 instructions, Rev. 2/99.</p>');

  section('What this tool does NOT have',
    '<p>Curves 5–8 on the 2000i (programmable with the DIPK-1 kit only — no switch positions published). ' +
    'Any ignition other than the stock Evo module and the Dyna 2000i. Any model-year spec outside the ' +
    '1997–1998 Softail manual quoted above. If you need one of those, check the manual for your year — ' +
    'this tool will not guess it.</p>');
})();

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

renderTimingSteps();
renderDynaSuggest();
renderLog();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline use still works without it */ });
  });
}
