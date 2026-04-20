// Cabrillo 3.0 parser for MQP log files
// QSO line format: QSO: freq mode date time sentCall sentRST sentQth rcvCall rcvRST rcvQth

export function parseCabrillo(fileText) {
  const warnings = [];
  let hasLFOnly = false;

  // Detect line ending style
  const hasCRLF = fileText.includes('\r\n');
  const hasLF = fileText.includes('\n');
  if (hasLF && !hasCRLF) {
    hasLFOnly = true;
    warnings.push({
      type: 'encoding',
      message: 'File uses LF-only line endings instead of required CR LF. The file was accepted but may have been exported from a non-Windows system.',
    });
  }

  // Normalize line endings
  const lines = fileText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let hasStartTag = false;
  let hasEndTag = false;
  const qsos = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i].trim();
    if (!raw) continue;

    const upper = raw.toUpperCase();

    if (upper.startsWith('START-OF-LOG:')) {
      hasStartTag = true;
      continue;
    }
    if (upper.startsWith('END-OF-LOG:')) {
      hasEndTag = true;
      continue;
    }

    if (!upper.startsWith('QSO:')) continue;

    const result = parseQsoLine(raw, lineNum);
    if (result.error) {
      warnings.push({ type: 'parse', lineNum, message: result.error, raw });
    } else {
      qsos.push(result.qso);
    }
  }

  if (!hasStartTag) {
    warnings.push({ type: 'format', message: 'Missing START-OF-LOG tag.' });
  }
  if (!hasEndTag) {
    warnings.push({ type: 'format', message: 'Missing END-OF-LOG tag.' });
  }
  if (qsos.length === 0 && !warnings.some(w => w.type === 'parse')) {
    warnings.push({ type: 'format', message: 'No QSO records found in file.' });
  }

  return { qsos, warnings, hasLFOnly };
}

function parseQsoLine(line, lineNum) {
  // Strip the "QSO:" prefix (case-insensitive) and split on whitespace
  const withoutPrefix = line.replace(/^QSO:\s*/i, '');
  const parts = withoutPrefix.trim().split(/\s+/);

  if (parts.length < 10) {
    return {
      error: `Line ${lineNum}: QSO record has ${parts.length} field(s), expected 10. Skipping. (${line})`,
    };
  }

  const [freq, mode, date, time, sentCall, sentRST, sentQth, rcvCall, rcvRST, rcvQth] = parts;

  // Basic field presence checks
  if (!freq || !mode || !date || !time || !sentCall || !sentRST || !sentQth || !rcvCall || !rcvRST || !rcvQth) {
    return {
      error: `Line ${lineNum}: QSO record has one or more empty fields. Skipping. (${line})`,
    };
  }

  return {
    qso: {
      lineNum,
      freq: freq.toUpperCase(),
      mode: mode.toUpperCase(),
      date,
      time,
      sentCall: sentCall.toUpperCase(),
      sentRST,
      sentQth: sentQth.toUpperCase(),
      rcvCall: rcvCall.toUpperCase(),
      rcvRST,
      rcvQth: rcvQth.toUpperCase(),
      raw: line,
    },
  };
}
