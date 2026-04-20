// Scoring engine — pure functions, no DOM dependencies
import {
  freqToBand, VALID_MODES, QSO_POINTS, BAND_ORDER,
  MI_COUNTIES, US_STATE_MULTS, CANADIAN_PROVINCE_MULTS, DX_MULT,
  isMichiganQth, isNonMichiganQth, normalizeRcvQth,
} from '../contests/mqp.js';

// stationType: 'michigan' | 'non-michigan'
export function scoreLog(qsos, stationType) {
  const isMichigan = stationType === 'michigan';
  const warnings = [];

  // dupe key: sentCall + band + mode + rcvCall + rcvQth
  // Including rcvQth handles mobile stations (same call, different county = new QSO)
  const seen = new Set();

  // Mults tracked per mode: Map<multKey, true>
  const multsWorked = { CW: new Set(), PH: new Set() };

  let totalQsoPoints = 0;

  // band+mode breakdown: { '40m-CW': { qsos: 0, points: 0 }, ... }
  const breakdown = {};

  // Per-QSO result for display
  const scoredQsos = [];

  for (const qso of qsos) {
    const result = scoreQso(qso, isMichigan, seen, multsWorked);
    scoredQsos.push({ ...qso, ...result });

    if (result.status === 'valid') {
      totalQsoPoints += result.points;
      const key = `${result.band}-${qso.mode}`;
      if (!breakdown[key]) breakdown[key] = { band: result.band, mode: qso.mode, qsos: 0, points: 0, mults: 0 };
      breakdown[key].qsos += 1;
      breakdown[key].points += result.points;
    }

    if (result.warnings) {
      warnings.push(...result.warnings.map(msg => ({ lineNum: qso.lineNum, message: msg, raw: qso.raw })));
    }
  }

  // Count mults per mode
  const cwMults = multsWorked.CW.size;
  const phMults = multsWorked.PH.size;
  const totalMults = cwMults + phMults;
  const finalScore = totalQsoPoints * totalMults;

  // Annotate breakdown with mult counts
  for (const key of Object.keys(breakdown)) {
    const [band, mode] = key.split('-');
    breakdown[key].mults = multsWorked[mode]
      ? [...multsWorked[mode]].filter(m => m.startsWith(`${band}|`)).length
      : 0;
  }

  // Build full mult lists for display
  const multDisplay = buildMultDisplay(isMichigan, multsWorked);

  return {
    totalQsoPoints,
    cwMults,
    phMults,
    totalMults,
    finalScore,
    breakdown: buildBreakdownTable(breakdown),
    scoredQsos,
    warnings,
    multDisplay,
  };
}

function scoreQso(qso, isMichigan, seen, multsWorked) {
  const warns = [];

  // Validate mode
  if (!VALID_MODES.has(qso.mode)) {
    return {
      status: 'invalid',
      reason: `Unknown mode "${qso.mode}" — only CW and PH are valid for MQP.`,
      points: 0,
      warnings: [`Unknown mode "${qso.mode}" — skipped.`],
    };
  }

  // Validate band
  const band = freqToBand(qso.freq);
  if (!band) {
    return {
      status: 'invalid',
      reason: `Frequency ${qso.freq} kHz is not a valid MQP band (80/40/20/15/10m only).`,
      points: 0,
      warnings: [`Frequency ${qso.freq} kHz not in a valid MQP band — skipped.`],
    };
  }

  // Validate SentQth matches declared station type
  if (isMichigan) {
    if (!isMichiganQth(qso.sentQth)) {
      return {
        status: 'invalid',
        reason: `SentQth "${qso.sentQth}" is not a Michigan county, but this log is declared as a Michigan station.`,
        points: 0,
        warnings: [`SentQth "${qso.sentQth}" doesn't match Michigan station declaration — skipped.`],
      };
    }
  } else {
    if (!isNonMichiganQth(qso.sentQth)) {
      return {
        status: 'invalid',
        reason: `SentQth "${qso.sentQth}" is not a valid non-Michigan location (state/province/DX).`,
        points: 0,
        warnings: [`SentQth "${qso.sentQth}" is not a valid non-Michigan QTH — skipped.`],
      };
    }
  }

  // For non-Michigan stations: only contacts with Michigan stations count
  if (!isMichigan && !isMichiganQth(qso.rcvQth)) {
    return {
      status: 'non-scoring',
      reason: `Non-Michigan stations only score for contacts with Michigan stations. RcvQth "${qso.rcvQth}" is not a Michigan county.`,
      band,
      points: 0,
      warnings: [`Contact with non-Michigan station (RcvQth "${qso.rcvQth}") does not count for non-Michigan entrants.`],
    };
  }

  // Validate RcvQth
  const normalizedRcvQth = normalizeRcvQth(qso.rcvQth);
  if (!normalizedRcvQth) {
    return {
      status: 'invalid',
      reason: `Unknown RcvQth "${qso.rcvQth}" — not a recognized county, state, province, or DX.`,
      band,
      points: 0,
      warnings: [`Unknown RcvQth "${qso.rcvQth}" — skipped.`],
    };
  }

  // Dupe check: same rcvCall + band + mode + rcvQth
  const dupeKey = `${qso.rcvCall}|${band}|${qso.mode}|${normalizedRcvQth}`;
  if (seen.has(dupeKey)) {
    return {
      status: 'dupe',
      reason: `Duplicate: ${qso.rcvCall} already worked on ${band} ${qso.mode} from ${normalizedRcvQth}.`,
      band,
      points: 0,
      warnings: [],
    };
  }
  seen.add(dupeKey);

  // QSO is valid — calculate points
  const points = QSO_POINTS[qso.mode];

  // Track multiplier: per mode (CW or PH)
  // Mult key includes the entity but NOT the band (mults are per mode, not per band)
  let isNewMult = false;
  let multKey = null;

  if (isMichigan) {
    // Michigan station: mults are MI counties, US states, provinces, DX — all by rcvQth
    multKey = normalizedRcvQth;
  } else {
    // Non-Michigan station: mults are MI counties only (already validated above)
    multKey = normalizedRcvQth;
  }

  if (!multsWorked[qso.mode].has(multKey)) {
    multsWorked[qso.mode].add(multKey);
    isNewMult = true;
  }

  return {
    status: 'valid',
    band,
    points,
    multKey,
    isNewMult,
    warnings: warns.length ? warns : null,
  };
}

function buildBreakdownTable(breakdown) {
  const rows = [];
  for (const band of BAND_ORDER) {
    for (const mode of ['CW', 'PH']) {
      const key = `${band}-${mode}`;
      if (breakdown[key]) {
        rows.push(breakdown[key]);
      }
    }
  }
  return rows;
}

function buildMultDisplay(isMichigan, multsWorked) {
  const sections = [];

  if (isMichigan) {
    // Michigan stations: show counties, states, provinces, DX
    sections.push(buildMultSection('Michigan Counties', [...MI_COUNTIES.keys()], MI_COUNTIES, multsWorked));
    sections.push(buildMultSection('US States & DC', [...US_STATE_MULTS], null, multsWorked));
    sections.push(buildMultSection('Canadian Provinces', [...CANADIAN_PROVINCE_MULTS], null, multsWorked));
    sections.push(buildMultSection('DX', [DX_MULT], null, multsWorked));
  } else {
    // Non-Michigan stations: only Michigan counties
    sections.push(buildMultSection('Michigan Counties', [...MI_COUNTIES.keys()], MI_COUNTIES, multsWorked));
  }

  return sections;
}

function buildMultSection(title, codes, nameMap, multsWorked) {
  const items = codes.map(code => ({
    code,
    name: nameMap ? nameMap.get(code) : code,
    workedCW: multsWorked.CW.has(code),
    workedPH: multsWorked.PH.has(code),
  }));

  const workedCount = items.filter(i => i.workedCW || i.workedPH).length;
  const cwCount = items.filter(i => i.workedCW).length;
  const phCount = items.filter(i => i.workedPH).length;

  return { title, items, workedCount, total: codes.length, cwCount, phCount };
}
