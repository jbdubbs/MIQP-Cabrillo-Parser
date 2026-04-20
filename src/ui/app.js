import { parseCabrillo } from '../parser/cabrillo.js';
import { scoreLog } from '../scoring/engine.js';

// ── State ──────────────────────────────────────────────────────────────────
let currentFile = null;

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dropZone   = document.getElementById('drop-zone');
  const fileInput  = document.getElementById('file-input');
  const fileName   = document.getElementById('file-name');
  const calcBtn    = document.getElementById('calc-btn');

  // Drag-and-drop
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });

  calcBtn.addEventListener('click', calculate);
  document.getElementById('print-btn').addEventListener('click', printReport);
});

function setFile(file) {
  currentFile = file;
  document.getElementById('file-name').textContent = file.name;
  document.getElementById('calc-btn').disabled = false;
}

function stationType() {
  return document.querySelector('input[name="station-type"]:checked').value;
}

function calculate() {
  if (!currentFile) return;

  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const { qsos, warnings: parseWarnings } = parseCabrillo(text);
    const result = scoreLog(qsos, stationType());
    render(result, parseWarnings);
  };
  reader.readAsText(currentFile);
}

// ── Render ─────────────────────────────────────────────────────────────────
function render(result, parseWarnings) {
  const resultsEl = document.getElementById('results');
  resultsEl.classList.add('visible');

  renderPrintHeader();
  renderScoreSummary(result);
  renderWarnings([...parseWarnings, ...result.warnings]);
  renderBreakdown(result);
  renderMults(result.multDisplay);
  renderQsoLog(result.scoredQsos);

  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPrintHeader() {
  const el = document.getElementById('print-report-header');
  const type = stationType() === 'michigan' ? 'Michigan Station' : 'Non-Michigan Station';
  const now = new Date().toLocaleString();
  el.innerHTML = `
    <h1>Michigan QSO Party &mdash; Score Report</h1>
    <div class="print-meta">
      Station type: <strong>${type}</strong> &nbsp;&bull;&nbsp;
      Log file: <strong>${escHtml(currentFile ? currentFile.name : '')}</strong> &nbsp;&bull;&nbsp;
      Generated: ${now}
    </div>`;
}

function printReport() {
  // Force all <details> open so content is visible to the print engine
  const allDetails = document.querySelectorAll('details');
  const prevOpen = [...allDetails].map(d => d.open);
  allDetails.forEach(d => { d.open = true; });

  window.addEventListener('afterprint', () => {
    allDetails.forEach((d, i) => { d.open = prevOpen[i]; });
  }, { once: true });

  window.print();
}

function renderScoreSummary(result) {
  const el = document.getElementById('score-summary');
  const type = stationType();

  el.innerHTML = `
    <div class="score-card">
      <div class="label">QSO Points</div>
      <div class="value">${result.totalQsoPoints.toLocaleString()}</div>
      <div class="sub">Valid QSOs × mode pts</div>
    </div>
    <div class="score-card">
      <div class="label">CW Mults</div>
      <div class="value">${result.cwMults}</div>
      <div class="sub">Unique on CW</div>
    </div>
    <div class="score-card">
      <div class="label">SSB Mults</div>
      <div class="value">${result.phMults}</div>
      <div class="sub">Unique on PH</div>
    </div>
    <div class="score-card">
      <div class="label">Total Mults</div>
      <div class="value">${result.totalMults}</div>
      <div class="sub">CW + SSB combined</div>
    </div>
    <div class="score-card">
      <div class="label">Claimed Score</div>
      <div class="value final">${result.finalScore.toLocaleString()}</div>
      <div class="sub">Points × Total Mults</div>
    </div>
  `;

  document.getElementById('formula').innerHTML =
    `<span>${result.totalQsoPoints.toLocaleString()}</span> pts &times; <span>${result.totalMults}</span> mults = <span>${result.finalScore.toLocaleString()}</span>`;
}

function renderWarnings(allWarnings) {
  const panel = document.getElementById('warnings-details');
  if (!allWarnings.length) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = '';

  const countEl = document.getElementById('warnings-count');
  countEl.textContent = `${allWarnings.length} warning${allWarnings.length !== 1 ? 's' : ''}`;

  const list = document.getElementById('warnings-list');
  list.innerHTML = allWarnings.map(w => {
    const type = w.type || 'warning';
    const badgeClass = type === 'parse' || type === 'format' ? 'badge-error' :
                       type === 'encoding' ? 'badge-info' : 'badge-warning';
    const badgeLabel = type === 'encoding' ? 'INFO' : type === 'format' ? 'FORMAT' : 'WARNING';
    const lineRef = w.lineNum ? `<span class="warn-line">Line ${w.lineNum}</span>` : '';
    return `<div class="warning-item">
      <span class="badge ${badgeClass}">${badgeLabel}</span>
      <span>${escHtml(w.message)}</span>
      ${lineRef}
    </div>`;
  }).join('');
}

function renderBreakdown(result) {
  const tbody = document.getElementById('breakdown-tbody');
  const tfoot = document.getElementById('breakdown-tfoot');

  if (!result.breakdown.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-dim);text-align:center">No valid QSOs</td></tr>';
    tfoot.innerHTML = '';
    return;
  }

  let totalQsos = 0, totalPts = 0;
  tbody.innerHTML = result.breakdown.map(row => {
    totalQsos += row.qsos;
    totalPts  += row.points;
    const modeClass = row.mode === 'CW' ? 'mode-cw' : 'mode-ph';
    const ptsPer = row.mode === 'CW' ? 2 : 1;
    return `<tr>
      <td>${row.band}</td>
      <td class="${modeClass}">${row.mode}</td>
      <td>${row.qsos}</td>
      <td>${ptsPer}</td>
      <td>${row.points}</td>
    </tr>`;
  }).join('');

  tfoot.innerHTML = `<tr>
    <td colspan="2">Total</td>
    <td>${totalQsos}</td>
    <td>—</td>
    <td>${totalPts}</td>
  </tr>`;
}

function renderMults(sections) {
  const container = document.getElementById('mults-container');
  container.innerHTML = sections.map(section => {
    const items = section.items.map(item => {
      let cls = 'not-worked', dot = '';
      if (item.workedCW && item.workedPH) {
        cls = 'worked-both'; dot = '<span class="dot dot-both"></span>';
      } else if (item.workedCW) {
        cls = 'worked-cw-only'; dot = '<span class="dot dot-cw"></span>';
      } else if (item.workedPH) {
        cls = 'worked-ph-only'; dot = '<span class="dot dot-ph"></span>';
      }
      const label = item.name && item.name !== item.code
        ? `<abbr title="${escHtml(item.name)}">${escHtml(item.code)}</abbr>`
        : escHtml(item.code);
      return `<span class="mult-item ${cls}">${dot}${label}</span>`;
    }).join('');

    const cwCount = section.cwCount;
    const phCount = section.phCount;
    const stats = `${section.workedCount}/${section.total} worked &nbsp;|&nbsp; <span class="mode-cw">${cwCount} CW</span> &nbsp;<span class="mode-ph">${phCount} PH</span>`;

    return `<div class="mult-group">
      <div class="mult-group-header">
        <span class="mult-group-title">${escHtml(section.title)}</span>
        <span class="mult-group-stats">${stats}</span>
      </div>
      <div class="mult-items">${items}</div>
    </div>`;
  }).join('');
}

function renderQsoLog(qsos) {
  const tbody = document.getElementById('qso-tbody');
  tbody.innerHTML = qsos.map(q => {
    const statusClass = `qso-status-${q.status}`;
    const statusLabel = q.status === 'non-scoring' ? 'NO SCORE' : q.status.toUpperCase();
    const newMultBadge = q.isNewMult ? '<span class="new-mult">NEW MULT</span>' : '';
    const pts = q.status === 'valid' ? q.points : '—';
    const modeClass = q.mode === 'CW' ? 'mode-cw' : q.mode === 'PH' ? 'mode-ph' : '';
    const reason = q.reason ? `title="${escHtml(q.reason)}"` : '';
    return `<tr ${reason}>
      <td>${q.lineNum}</td>
      <td>${escHtml(q.freq)}</td>
      <td class="${modeClass}">${escHtml(q.mode)}</td>
      <td>${escHtml(q.date)} ${escHtml(q.time)}</td>
      <td>${escHtml(q.sentCall)}</td>
      <td>${escHtml(q.sentQth)}</td>
      <td>${escHtml(q.rcvCall)}</td>
      <td>${escHtml(q.rcvQth)}</td>
      <td>${pts}</td>
      <td class="${statusClass}">${statusLabel}${newMultBadge}</td>
    </tr>`;
  }).join('');
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
