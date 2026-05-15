'use strict';

// ── Gauge constants ───────────────────────────────────────────────────────────
// r=80, circumference = 2π×80 = 502.65 ; 240° sweep = 335.10
const CIRC  = 502.65;
const SWEEP = 335.10;
const CX = 100, CY = 100, R = 80;

// ── Tyre arc constants ────────────────────────────────────────────────────────
// Semi-circle (180° sweep) r=30 → CIRC=188.50, SWEEP=94.25. Max display: 150°C.
const TG_CIRC  = 188.50;
const TG_SWEEP = 94.25;
const TEMP_MAX = 150;

// Gauge arc: 240° sweep, gap centered at bottom (6-o'clock).
// Start at 240° compass (8-o'clock), end at 480°=120° (4-o'clock).
const GAUGE_START = 240;
const GAUGE_SWEEP = 240;

// ── SVG helpers ───────────────────────────────────────────────────────────────
function polarXY(compassDeg, r) {
    const rad = (compassDeg - 90) * Math.PI / 180;
    return { x: +(CX + r * Math.cos(rad)).toFixed(2),
             y: +(CY + r * Math.sin(rad)).toFixed(2) };
}

function arcPath(startDeg, endDeg, r) {
    r = r ?? R;
    const s = polarXY(startDeg, r);
    const e = polarXY(endDeg,   r);
    const span = ((endDeg - startDeg) + 360) % 360;
    const large = span > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

// ── Gauge fill (stroke-dasharray on CSS-rotated circle) ───────────────────────
function setGaugeFill(fillEl, frac) {
    const filled = Math.max(0, Math.min(1, frac)) * SWEEP;
    fillEl.style.strokeDasharray = `${filled.toFixed(2)} ${CIRC}`;
}

// ── Needle (SVG rotate attribute around gauge center) ─────────────────────────
function setNeedle(needleEl, frac) {
    const angle = GAUGE_START + Math.max(0, Math.min(1, frac)) * GAUGE_SWEEP;
    needleEl.setAttribute('transform', `rotate(${angle.toFixed(2)},${CX},${CY})`);
}

// ── Tick marks ────────────────────────────────────────────────────────────────
function buildTicks(groupEl, max, majStep, minStep) {
    groupEl.innerHTML = '';
    for (let v = 0; v <= max; v += minStep) {
        const major = (v % majStep === 0);
        const ang   = GAUGE_START + (v / max) * GAUGE_SWEEP;
        const outer = polarXY(ang, R + 5);
        const inner = polarXY(ang, major ? R - 9 : R - 3);
        const ln    = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('x1', outer.x); ln.setAttribute('y1', outer.y);
        ln.setAttribute('x2', inner.x); ln.setAttribute('y2', inner.y);
        ln.setAttribute('class', major ? 'g-tick major' : 'g-tick');
        if (major && groupEl.id === 'speed-ticks' && v > 0) {
            const lp = polarXY(ang, R + 20);
            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', lp.x); txt.setAttribute('y', lp.y);
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('dominant-baseline', 'middle');
            txt.setAttribute('class', 'g-label');
            txt.textContent = v;
            groupEl.appendChild(txt);
        }
        groupEl.appendChild(ln);
    }
}

// ── Redline arc (path drawn once on init/maxRpm change) ───────────────────────
function updateRedlineArc(redlineFrac) {
    redlineFrac = redlineFrac ?? 0.90;
    const startAng = GAUGE_START + redlineFrac * GAUGE_SWEEP;
    const endAng   = GAUGE_START + GAUGE_SWEEP;
    dom.rpmRedline.setAttribute('d', arcPath(startAng, endAng));
}

// ── Colour helpers ─────────────────────────────────────────────────────────────
function rpmColour(frac) {
    if (frac > 0.93) return 'var(--red)';
    if (frac > 0.80) return 'var(--orange)';
    if (frac > 0.65) return 'var(--yellow)';
    return 'var(--blue)';
}
function tempClass(t) {
    if (t < 55)  return 't-cold';
    if (t < 75)  return 't-cool';
    if (t < 100) return 't-good';
    if (t < 112) return 't-hot';
    return 't-vhot';
}
function tyreBorderClass(t) {
    return tempClass(t); // same 5-state scale as temperature ring
}
function wearColour(w) {
    return w > 0.80 ? 'var(--green)' : w > 0.55 ? 'var(--yellow)' : 'var(--red)';
}

// ── Shift lights ──────────────────────────────────────────────────────────────
const SHIFT_COUNT = 10;
const SHIFT_CFG = [
    [0.65, 'sl-green'], [0.70, 'sl-green'], [0.74, 'sl-green'], [0.78, 'sl-green'],
    [0.82, 'sl-amber'], [0.86, 'sl-amber'],
    [0.90, 'sl-red'],   [0.94, 'sl-red'],   [0.97, 'sl-red'],   [0.99, 'sl-red'],
];

function updateShiftLights(rpmFrac) {
    for (let i = 0; i < SHIFT_COUNT; i++) {
        slDots[i].classList.toggle('lit', rpmFrac >= SHIFT_CFG[i][0]);
    }
    const redline = rpmFrac >= 0.98;
    dom.redlineOverlay.classList.toggle('active', redline);
    document.getElementById('shift-lights').classList.toggle('all-flash', redline);
}

// ── Cached DOM refs ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
    redlineOverlay: $('redline-overlay'),
    // header
    hdrCar:     $('hdr-car'),     hdrTrack:   $('hdr-track'),
    hdrSession: $('hdr-session'), hdrStatus:  $('hdr-status'),
    hdrPlayer:  $('hdr-player'),  hdrPos:     $('hdr-position'),
    hdrLap:     $('hdr-lap'),
    // times
    tCurrent:  $('t-current'), tBest:     $('t-best'),
    tLast:     $('t-last'),    tFuelXLap: $('t-fuelxlap'),
    // speed gauge
    speedFill:   $('speed-fill'),
    speedNeedle: $('speed-needle'),
    speedVal:    $('speed-val'),
    speedMph:    $('speed-mph'),
    speedTicks:  $('speed-ticks'),
    // gear
    gearNum:    $('gear-num'),
    gearPitLim: $('gear-pit-lim'),
    gearDrs:    $('gear-drs'),
    // rpm gauge
    rpmFill:    $('rpm-fill'),
    rpmRedline: $('rpm-redline'),
    rpmNeedle:  $('rpm-needle'),
    rpmVal:     $('rpm-val'),
    rpmPct:     $('rpm-pct'),
    rpmTicks:   $('rpm-ticks'),
    // pedals
    pedGas:      $('ped-gas'),    pedGasPct:    $('ped-gas-pct'),
    pedBrake:    $('ped-brake'),  pedBrakePct:  $('ped-brake-pct'),
    pedClutch:   $('ped-clutch'), pedClutchPct: $('ped-clutch-pct'),
    extTc:  $('ext-tc'),  extAbs: $('ext-abs'),
    extMap: $('ext-map'), extBb:  $('ext-bb'),
    pedBoost:  $('ped-boost'),
    boostVal:  $('boost-val'),
    // tyres
    tyreCompound: $('tyre-compound'),
    // drift
    driftSlip:  $('drift-slip'),
    driftSlipL: $('drift-slip-left'),
    driftSlipR: $('drift-slip-right'),
    gfDot:      $('gf-dot'),
    dLatG:      $('d-latg'),    dLongG:    $('d-longg'),
    dYaw:       $('d-yaw'),     dSteer:    $('d-steer'),
    dOversteer: $('d-oversteer'), dVlat:   $('d-vlat'),
    dFuel:      $('d-fuel'),    dMaxFuel:  $('d-maxfuel'),
    dAirTemp:   $('d-airtemp'), dRoadTemp: $('d-roadtemp'),
    dTurbo:     $('d-turbo'),
};

const slDots = Array.from({ length: SHIFT_COUNT }, (_, i) => $(`sl-${i}`));

// ── Init ──────────────────────────────────────────────────────────────────────
let lastMaxRpm = 0;

function init() {
    buildTicks(dom.speedTicks, 300, 50, 10);
    updateRedlineArc(0.90);
    setNeedle(dom.speedNeedle, 0);
    setNeedle(dom.rpmNeedle,   0);
}
init();

// ── Helpers ───────────────────────────────────────────────────────────────────
const SESSION_LABELS = ['Antrenman','Kalifikasyon','Yarış','Hızlı Tur','Zaman Saldırısı','Drift','Drag'];
const STATUS_LABELS  = { 0:'Menü', 1:'Tekrar', 2:'Canlı', 3:'Duraklatıldı' };
const GEAR_LABEL     = g => g === 0 ? 'R' : g === 1 ? 'N' : String(g - 1);

function setPedal(fillEl, pctEl, v) {
    fillEl.style.width    = `${(v * 100).toFixed(1)}%`;
    pctEl.textContent     = `${(v * 100).toFixed(0)}%`;
}

// ── Main update ───────────────────────────────────────────────────────────────
function update(d) {
    document.getElementById('offline-banner').classList.toggle('show', !d.acConnected);
    if (!d.acConnected) return;

    // ── Header ──────────────────────────────────────────────────────────────
    dom.hdrCar.textContent   = d.carModel || '—';
    dom.hdrTrack.textContent = d.trackConfig
        ? `${d.track} (${d.trackConfig})` : (d.track || '—');

    dom.hdrSession.textContent = SESSION_LABELS[d.session] ?? '—';
    dom.hdrSession.className   = 'badge';

    dom.hdrStatus.textContent = STATUS_LABELS[d.acStatus] ?? '—';
    dom.hdrStatus.className   = 'badge'
        + (d.acStatus === 2 ? ' live' : d.acStatus === 3 ? ' pause' : '');

    // Flag colour on session badge
    const flagMap = { 1: 'blue-f', 2: 'yel-f', 5: 'chk-f' };
    if (flagMap[d.flag]) dom.hdrSession.classList.add(flagMap[d.flag]);

    dom.hdrPlayer.textContent = d.playerName || '—';
    dom.hdrPos.textContent    = `P${d.position}`;
    dom.hdrLap.textContent    = d.numberOfLaps > 0
        ? `Tur ${d.completedLaps + 1}/${d.numberOfLaps}`
        : `Tur ${d.completedLaps + 1}`;

    // ── Times ────────────────────────────────────────────────────────────────
    dom.tCurrent.textContent  = d.currentTime || '—';
    dom.tBest.textContent     = d.bestTime    || '—';
    dom.tLast.textContent     = d.lastTime    || '—';
    dom.tFuelXLap.textContent = d.fuelXLap > 0 ? `${d.fuelXLap.toFixed(2)} L` : '—';

    // ── Speed gauge ──────────────────────────────────────────────────────────
    const speedFrac = Math.min(1, d.speedKmh / 300);
    setGaugeFill(dom.speedFill, speedFrac);
    setNeedle(dom.speedNeedle, speedFrac);
    dom.speedFill.style.stroke = speedFrac > 0.85 ? 'var(--red)'
        : speedFrac > 0.67 ? 'var(--orange)' : 'var(--blue)';
    dom.speedVal.textContent = Math.round(d.speedKmh);
    dom.speedMph.textContent = `${Math.round(d.speedMph)} mph`;

    // ── RPM gauge ────────────────────────────────────────────────────────────
    if (d.maxRpm > 0 && d.maxRpm !== lastMaxRpm) {
        lastMaxRpm = d.maxRpm;
        buildTicks(dom.rpmTicks, d.maxRpm, 1000, 500);
        updateRedlineArc(0.90);
    }
    const maxRpm  = lastMaxRpm || 8500;
    const rpmFrac = Math.min(1, d.rpms / maxRpm);
    setGaugeFill(dom.rpmFill, rpmFrac);
    setNeedle(dom.rpmNeedle, rpmFrac);
    const rc = rpmColour(rpmFrac);
    dom.rpmFill.style.stroke   = rc;
    dom.rpmNeedle.style.stroke = rc;
    dom.rpmVal.textContent = d.rpms.toLocaleString('tr-TR');
    dom.rpmPct.textContent = `${(rpmFrac * 100).toFixed(1)}%`;
    dom.rpmRedline.classList.toggle('flashing', rpmFrac >= 0.97);

    // ── Shift lights ─────────────────────────────────────────────────────────
    updateShiftLights(rpmFrac);

    // ── Gear ─────────────────────────────────────────────────────────────────
    dom.gearNum.textContent = GEAR_LABEL(d.gear);
    dom.gearNum.className   = 'gear-num'
        + (d.gear === 0 ? ' reverse' : d.gear === 1 ? ' neutral' : '');

    dom.gearPitLim.className = d.pitLimiter  === 1 ? 'gbadge on orange' : 'gbadge orange';
    dom.gearDrs.className    = d.drsEnabled  === 1 ? 'gbadge on drs'
                             : d.drsAvailable === 1 ? 'gbadge on'        : 'gbadge drs';

    // ── Pedals ───────────────────────────────────────────────────────────────
    setPedal(dom.pedGas,    dom.pedGasPct,    d.gas);
    setPedal(dom.pedBrake,  dom.pedBrakePct,  d.brake);
    setPedal(dom.pedClutch, dom.pedClutchPct, d.clutch);

    dom.extTc.textContent  = `TC lv${d.tcLevel}`;
    dom.extAbs.textContent = `ABS lv${d.absLevel}`;
    dom.extMap.textContent = `MAP ${d.engineMap}`;
    dom.extBb.textContent  = `BB ${(d.brakeBias * 100).toFixed(1)}%`;

    // ── Turbo boost ──────────────────────────────────────────────────────────
    const turbo = d.turboBoost ?? 0;
    const turboPct = Math.min(100, Math.max(0, turbo / 2.0) * 100);
    dom.pedBoost.style.width   = `${turboPct.toFixed(1)}%`;
    dom.boostVal.textContent   = turbo.toFixed(2);
    dom.boostVal.className     = turbo >= 0.05 ? 'boost-val positive' : 'boost-val vacuum';

    // ── Tyres ────────────────────────────────────────────────────────────────
    dom.tyreCompound.textContent = d.tyreCompound || '—';
    const TMAP = [['FL',0],['FR',1],['RL',2],['RR',3]];
    for (const [id, i] of TMAP) {
        const temp = d.tyreCoreTemp[i];
        const wear = d.tyreWear[i];
        const slip = d.wheelSlip[i];
        const tc   = tempClass(temp);

        $(`tyre-${id}`).className = `tyre-card ${tc}`;

        // SVG arc fill — semi-circle fills proportional to temp (0–150°C)
        const tgFrac = Math.min(1, Math.max(0, temp / TEMP_MAX));
        $(`tg-${id}`).style.strokeDasharray = `${(tgFrac * TG_SWEEP).toFixed(2)} ${TG_CIRC}`;

        $(`tt-${id}`).textContent = `${temp.toFixed(0)}°`;
        $(`tpsi-${id}`).textContent = d.tyrePressure[i].toFixed(1);

        // Wear bar
        const we = $(`twear-${id}`);
        we.style.width      = `${(wear * 100).toFixed(0)}%`;
        we.style.background = wearColour(wear);
        $(`twear-pct-${id}`).textContent = `${(wear * 100).toFixed(1)}%`;

        // Slip bar (0–15 range fills 100%)
        const slipPct = Math.min(100, (slip / 15) * 100);
        const slipBar = $(`tslip-bar-${id}`);
        slipBar.style.width = `${slipPct.toFixed(1)}%`;
        slipBar.className   = slip > 8 ? 'tc-bar-fill slip-fill high' : 'tc-bar-fill slip-fill';
        const se = $(`tslip-${id}`);
        se.textContent = slip.toFixed(1);
        se.style.color = slip > 8 ? 'var(--red)' : slip > 4 ? 'var(--orange)' : '';
    }

    // ── Drift ─────────────────────────────────────────────────────────────────
    const absSlip = Math.abs(d.slipAngle);
    dom.driftSlip.textContent = `${d.slipAngle.toFixed(1)}°`;
    dom.driftSlip.className   = 'slip-big'
        + (absSlip > 30 ? ' hard' : absSlip > 10 ? ' drifting' : '');

    const slipPct = Math.min(50, absSlip / 60 * 50);
    if (d.slipAngle < 0) {
        dom.driftSlipL.style.width = `${slipPct}%`;
        dom.driftSlipR.style.width = '0%';
    } else {
        dom.driftSlipR.style.width = `${slipPct}%`;
        dom.driftSlipL.style.width = '0%';
    }

    const gMax = 2.5;
    const gx = Math.max(10, Math.min(110, 60 + (d.lateralG      / gMax) * 50));
    const gy = Math.max(10, Math.min(110, 60 - (d.longitudinalG / gMax) * 50));
    dom.gfDot.setAttribute('cx', gx.toFixed(1));
    dom.gfDot.setAttribute('cy', gy.toFixed(1));
    dom.dLatG.textContent   = d.lateralG.toFixed(2);
    dom.dLongG.textContent  = d.longitudinalG.toFixed(2);

    dom.dYaw.textContent       = `${d.yawRate.toFixed(1)}°/s`;
    dom.dSteer.textContent     = `${d.steerAngleDeg.toFixed(1)}°`;
    dom.dOversteer.textContent = d.oversteerIndex.toFixed(2);
    dom.dVlat.textContent      = `${d.localVelLateral.toFixed(1)} m/s`;

    for (const [id, i] of TMAP) {
        const v   = d.wheelSlip[i];
        const pct = Math.min(100, (v / 20) * 100);
        const bar = $(`ws-${id}`);
        bar.style.height  = `${pct.toFixed(1)}%`;
        bar.className     = v > 10 ? 'ws-bar danger' : v > 5 ? 'ws-bar warn' : 'ws-bar ok';
        const vEl = $(`wsv-${id}`);
        vEl.textContent = v.toFixed(1);
        vEl.style.color = v > 10 ? 'var(--red)' : v > 5 ? 'var(--orange)' : '';
    }

    dom.dFuel.textContent     = d.fuel.toFixed(1);
    dom.dMaxFuel.textContent  = d.maxFuel.toFixed(0);
    dom.dAirTemp.textContent  = d.airTemp.toFixed(0);
    dom.dRoadTemp.textContent = d.roadTemp.toFixed(0);
    dom.dTurbo.textContent    = d.turboBoost.toFixed(2);
}

// ── SignalR ────────────────────────────────────────────────────────────────────
const connection = new signalR.HubConnectionBuilder()
    .withUrl('/telemetry')
    .withAutomaticReconnect([0, 500, 1000, 2000, 5000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

connection.on('telemetry', update);
connection.onreconnecting(() => document.getElementById('offline-banner').classList.add('show'));
connection.onreconnected(() => document.getElementById('offline-banner').classList.remove('show'));

(async function start() {
    try {
        await connection.start();
    } catch {
        setTimeout(start, 3000);
    }
})();
