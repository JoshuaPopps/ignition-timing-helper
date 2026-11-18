/* Engine tests — Ignition Timing Helper.
 * Run: node test.js   (no dependencies, Node 18+) */
'use strict';
var T = require('./timing.js');

var passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log('  ok  ' + name); }
  else { failed++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}
function throws(name, fn) {
  try { fn(); check(name, false, 'did not throw'); }
  catch (e) { check(name, true); }
}

console.log('Dyna 2000i switch configurator');
var c1 = T.dynaSwitches({ curve: 1, revLimit: 6000, voes: 'normal', firing: 'dual' });
check('curve 1: SW2 OFF, SW3 OFF', c1.switches.s2 === 'OFF' && c1.switches.s3 === 'OFF');
check('curve 1: final advance 35°', c1.finalAdvanceDeg === 35);
check('curve 1: total retard 10°', c1.totalRetardDeg === 10);
check('6000 rpm: SW4 OFF, SW5 OFF', c1.switches.s4 === 'OFF' && c1.switches.s5 === 'OFF');
check('normal VOES: SW1 OFF', c1.switches.s1 === 'OFF');
check('dual fire: SW6 OFF', c1.switches.s6 === 'OFF');
check('rev application is stock motor', c1.revApplication === 'Stock motor');

var c2 = T.dynaSwitches({ curve: 2, revLimit: 6500, voes: 'normal', firing: 'single' });
check('curve 2: SW2 ON, SW3 OFF', c2.switches.s2 === 'ON' && c2.switches.s3 === 'OFF');
check('6500 rpm: SW4 ON, SW5 OFF', c2.switches.s4 === 'ON' && c2.switches.s5 === 'OFF');
check('single fire: SW6 ON', c2.switches.s6 === 'ON');

var c3 = T.dynaSwitches({ curve: 3, revLimit: 7000, voes: 'retard', firing: 'single' });
check('curve 3: SW2 OFF, SW3 ON', c3.switches.s2 === 'OFF' && c3.switches.s3 === 'ON');
check('curve 3: final advance 32°', c3.finalAdvanceDeg === 32);
check('curve 3: total retard 7°', c3.totalRetardDeg === 7);
check('7000 rpm: SW4 OFF, SW5 ON', c3.switches.s4 === 'OFF' && c3.switches.s5 === 'ON');
check('retard VOES: SW1 ON', c3.switches.s1 === 'ON');
check('retard limit is 25°', c3.retardLimitDeg === 25);
check('retard note warns not to connect a VOES',
  c3.voesNote.indexOf('do NOT connect it to a VOES') !== -1);

var c4 = T.dynaSwitches({ curve: 4, revLimit: 7500, voes: 'normal', firing: 'dual' });
check('curve 4: SW2 ON, SW3 ON', c4.switches.s2 === 'ON' && c4.switches.s3 === 'ON');
check('curve 4: final advance 30°', c4.finalAdvanceDeg === 30);
check('curve 4: total retard 5°', c4.totalRetardDeg === 5);
check('7500 rpm: SW4 ON, SW5 ON', c4.switches.s4 === 'ON' && c4.switches.s5 === 'ON');
check('7500 application warns about valve train',
  c4.revApplication.indexOf("don't like") !== -1);
check('every config reminds about the power cycle',
  c4.reminder.indexOf('power cycle') !== -1);

throws('curve 5 rejected (programmable only)', function () {
  T.dynaSwitches({ curve: 5, revLimit: 6000, voes: 'normal', firing: 'dual' });
});
throws('curve 0 rejected', function () {
  T.dynaSwitches({ curve: 0, revLimit: 6000, voes: 'normal', firing: 'dual' });
});
throws('rev limit 5500 rejected', function () {
  T.dynaSwitches({ curve: 2, revLimit: 5500, voes: 'normal', firing: 'dual' });
});
throws('bad VOES mode rejected', function () {
  T.dynaSwitches({ curve: 2, revLimit: 6000, voes: 'maybe', firing: 'dual' });
});
throws('bad firing mode rejected', function () {
  T.dynaSwitches({ curve: 2, revLimit: 6000, voes: 'normal', firing: 'triple' });
});

console.log('Curve suggestions');
check('stock build starts on curve 2', T.suggestCurve('stock').curve === 2);
check('built motor starts on curve 3', T.suggestCurve('built').curve === 3);
check('detonating motor steps to curve 3', T.suggestCurve('detonates').curve === 3);
check('still detonating steps to curve 4', T.suggestCurve('still-detonates').curve === 4);
throws('unknown build rejected', function () { T.suggestCurve('nitrous'); });

console.log('Coil picker');
var dc = T.coilPick('dual', 1);
check('dual-fire single-plug: DC6-1 or stock coil', dc.coils.indexOf('DC6-1') !== -1);
var dd = T.coilPick('dual', 2);
check('dual-fire dual-plug: two DC2-1 in series', dd.coils.indexOf('DC2-1') !== -1 && dd.coils.indexOf('series') !== -1);
var sc = T.coilPick('single', 1);
check('single-fire single-plug: DC6-5', sc.coils.indexOf('DC6-5') !== -1);
var sd = T.coilPick('single', 2);
check('single-fire dual-plug: DC1-1 or DC6-4', sd.coils.indexOf('DC1-1') !== -1);
check('every coil pick states the 2.5–3.5 ohm range',
  dc.primaryOhms[0] === 2.5 && dc.primaryOhms[1] === 3.5);
throws('coil pick rejects 3 plugs', function () { T.coilPick('dual', 3); });

console.log('Flywheel mark math');
var arc = T.markArc(8.5, 20);
check('20° on an 8.5 in flywheel ≈ 1.48 in',
  Math.abs(arc.inches - 1.48) < 0.01, 'got ' + arc.inches);
check('arc in mm matches inches × 25.4',
  Math.abs(arc.mm - arc.inches * 25.4) < 0.01);
check('0° is 0 arc', T.markArc(8.5, 0).inches === 0);
check('360° is the full circumference',
  Math.abs(T.markArc(8.5, 360).inches - Math.PI * 8.5) < 0.01);
check('markDegrees inverts markArc (within rounding — 2-decimal inches cost ~0.05°)',
  Math.abs(T.markDegrees(8.5, T.markArc(8.5, 20).inches) - 20) < 0.1);
check('1° on an 8.5 in flywheel ≈ 0.07 in',
  Math.abs(T.oneDegreeArc(8.5).inches - 0.07) < 0.01, 'got ' + T.oneDegreeArc(8.5).inches);
throws('markArc rejects zero diameter', function () { T.markArc(0, 20); });
throws('markArc rejects >360°', function () { T.markArc(8.5, 361); });
throws('markDegrees rejects negative arc', function () { T.markDegrees(8.5, -1); });

console.log('Coil resistance check (factory spec)');
var ok = T.coilCheck(2.8, 11000);
check('2.8 Ω / 11,000 Ω passes', ok.ok === true);
check('in-spec primary flagged ok', ok.primary.ok === true);
check('in-spec secondary flagged ok', ok.secondary.ok === true);
var badP = T.coilCheck(1.2, 11000);
check('1.2 Ω primary fails', badP.ok === false && badP.primary.ok === false);
var badS = T.coilCheck(2.8, 8000);
check('8,000 Ω secondary fails', badS.ok === false && badS.secondary.ok === false);
var primOnly = T.coilCheck(3.0, null);
check('primary-only check works', primOnly.ok === true && primOnly.secondary === null);
check('boundary 2.5 Ω passes', T.coilCheck(2.5, null).ok === true);
check('boundary 3.1 Ω passes', T.coilCheck(3.1, null).ok === true);
check('3.2 Ω primary fails factory spec (but is in Dyna range — verdict says factory)',
  T.coilCheck(3.2, null).ok === false);
throws('coil check with no measurements throws', function () { T.coilCheck(null, null); });
throws('coil check rejects non-numbers', function () { T.coilCheck('x', null); });

console.log('V.O.E.S. vacuum check (factory spec)');
var v = T.voesCheck(4.0, 0.5);
check('4.0 inHg, 0.5 Ω: closed in range', v.ok === true);
check('closing range is 3.5–4.5 inHg', v.spec[0] === 3.5 && v.spec[1] === 4.5);
var vEarly = T.voesCheck(2.0, 0.5);
check('closed at 2.0 inHg: too early', vEarly.ok === false);
var vLate = T.voesCheck(6.0, 999);
check('open at 6.0 inHg: failed to close', vLate.ok === false);
var vRest = T.voesCheck(0, 999);
check('open at rest is correct', vRest.ok === true);
var vRestBad = T.voesCheck(0, 0.2);
check('closed at rest is a bad VOES', vRestBad.ok === false);
throws('VOES check rejects negative vacuum', function () { T.voesCheck(-1, 0); });

console.log('LED decoder');
check('rapid flash means over-current',
  T.ledMeaning('rapid-flash').indexOf('Over-current') !== -1 ||
  T.ledMeaning('rapid-flash').indexOf('over-current') !== -1);
check('cranking blink cites 45° BTDC',
  T.ledMeaning('blinks-while-cranking').indexOf('45') !== -1);
check('power-on blink is the self test',
  T.ledMeaning('power-on-blink').indexOf('self test') !== -1);
throws('unknown LED pattern rejected', function () { T.ledMeaning('purple'); });

console.log('Factory data sanity');
check('factory timing is 20° BTDC', T.FACTORY.timingSettingDeg === 20);
check('factory timing rpm window 1050–1500',
  T.FACTORY.timingSettingRpmLow === 1050 && T.FACTORY.timingSettingRpmHigh === 1500);
check('sensor plate torque 15–30 in-lbs',
  T.FACTORY.sensorPlateTorque.inLbs[0] === 15 && T.FACTORY.sensorPlateTorque.inLbs[1] === 30);
check('inner cover torque 12–20 in-lbs',
  T.FACTORY.innerCoverTorque.inLbs[0] === 12 && T.FACTORY.innerCoverTorque.inLbs[1] === 20);
check('VOES closes at 3.5–4.5 inHg',
  T.FACTORY.voesCloseInHg[0] === 3.5 && T.FACTORY.voesCloseInHg[1] === 4.5);
check('plug gap 0.038–0.043 in',
  T.FACTORY.plugGapIn[0] === 0.038 && T.FACTORY.plugGapIn[1] === 0.043);
check('Dyna rotor is HD 32402-83', T.DYNA.rotor.indexOf('32402-83') !== -1);
check('Dyna dynamic check is 35° by 1500 rpm',
  T.DYNA.dynamicCheck.advanceDeg === 35 && T.DYNA.dynamicCheck.rpm === 1500);
check('Dyna lists 8 curves total', T.DYNA.curveCount === 8);

console.log('Log validation');
check('good entry validates', T.validateLogEntry({
  date: '2026-11-18', bike: '1990 Softail', ignition: 'dyna-2000i',
  method: 'dynamic', curve: 2, result: 'Full advance mark centered above 1500 rpm'
}) === true);
check('stock entry without curve validates', T.validateLogEntry({
  date: '2026-11-18', bike: '1995 Fat Boy', ignition: 'stock',
  method: 'static', curve: null, result: '20° mark centered at 1200 rpm'
}) === true);
throws('log entry rejects bad date', function () {
  T.validateLogEntry({ date: 'Nov 18', bike: 'x', ignition: 'stock', method: 'static', result: 'ok' });
});
throws('log entry rejects curve 5', function () {
  T.validateLogEntry({ date: '2026-11-18', bike: 'x', ignition: 'dyna-2000i', method: 'dynamic', curve: 5, result: 'ok' });
});
throws('log entry rejects empty result', function () {
  T.validateLogEntry({ date: '2026-11-18', bike: 'x', ignition: 'stock', method: 'static', result: '  ' });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed.');
process.exit(failed ? 1 : 0);
