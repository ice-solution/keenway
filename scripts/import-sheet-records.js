/**
 * Import work records from keenway.xlsx into MongoDB.
 *
 * Usage:
 *   node scripts/import-sheet-records.js Club88 8
 *   node scripts/import-sheet-records.js 瓏珀山 6+7 --machine-row 3 --cols B-L
 *
 * Options:
 *   --machine-row N   Row with machine names (default: 2)
 *   --cols B-L        Column range (default: B-F)
 *   Data rows: single number (8) or merged rows (6+7 or 6,7)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Location = require('../models/Location');
const Diffuser = require('../models/Diffuser');
const WorkRecord = require('../models/WorkRecord');

const SHEET_LOCATION_MAP = {
  Club88: 'Club 88',
  瓏珀山: '瓏珀山',
  '天璽．天': '天璽•天',
  '天璽．海': '天璽•海',
};

function colLetterToIndex(letters) {
  let n = 0;
  const s = letters.toUpperCase();
  for (let i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
  return n - 1;
}

function parseColRange(range) {
  const [start, end] = range.split('-');
  return { start: colLetterToIndex(start), end: colLetterToIndex(end) };
}

function normalizeCell(val) {
  return String(val || '')
    .trim()
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ');
}

function excelDateToJS(serial) {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function parsePerformedAt(cell) {
  if (typeof cell === 'number' && cell > 40000) return excelDateToJS(cell);
  if (typeof cell === 'string' && cell.trim()) {
    const m = cell.match(/(\d{4})[\/\-]?(\d{1,2})[\/\-]?(\d{1,2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date();
}

function parseDataRows(arg) {
  if (!arg) return [8];
  if (arg.includes('+')) return arg.split('+').map((n) => Number(n.trim()));
  if (arg.includes(',')) return arg.split(',').map((n) => Number(n.trim()));
  return [Number(arg)];
}

function parseArgs(argv) {
  const opts = { machineRow: 2, cols: 'B-F', dataRows: [8] };
  const positional = [];

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--machine-row') opts.machineRow = Number(argv[++i]);
    else if (arg === '--cols') opts.cols = argv[++i];
    else positional.push(arg);
  }

  if (positional[0]) opts.sheetName = positional[0];
  if (positional[1]) opts.dataRows = parseDataRows(positional[1]);

  return opts;
}

function mergeActions(rows, col) {
  return rows
    .map((row) => normalizeCell(row[col]))
    .filter(Boolean)
    .join(' ');
}

async function importSheet(options) {
  const { sheetName, machineRow, dataRows, cols } = options;
  const { start: colStart, end: colEnd } = parseColRange(cols);

  const wb = XLSX.readFile(path.join(__dirname, '..', 'keenway.xlsx'));
  if (!wb.Sheets[sheetName]) throw new Error(`找不到 sheet: ${sheetName}`);

  const locationName = SHEET_LOCATION_MAP[sheetName] || sheetName;
  const location = await Location.findOne({ name: locationName });
  if (!location) throw new Error(`找不到地點: ${locationName}`);

  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });
  const machineRowData = data[machineRow - 1];
  const dataRowData = dataRows.map((r) => data[r - 1]);
  if (!machineRowData || dataRowData.some((r) => !r)) {
    throw new Error('無法讀取指定列');
  }

  const performedAt = parsePerformedAt(dataRowData[0][0]);
  const results = [];

  for (let col = colStart; col <= colEnd; col++) {
    const position = normalizeCell(machineRowData[col]);
    const actions = mergeActions(dataRowData, col);
    if (!position) continue;
    if (!actions) {
      results.push({ position, status: 'skipped', reason: '空白動作' });
      continue;
    }

    let diffuser = await Diffuser.findOne({ location: location._id, position, isActive: true });
    if (!diffuser) {
      diffuser = await Diffuser.create({ location: location._id, position });
      results.push({ position, actions, status: 'created diffuser + record' });
    } else {
      results.push({ position, actions, status: 'created record' });
    }

    await WorkRecord.create({
      diffuser: diffuser._id,
      location: location._id,
      checked: true,
      actions,
      oilChanged: false,
      batteryChanged: false,
      notes: '',
      performedAt,
      performedBy: 'System',
    });
  }

  return { locationName, performedAt, dataRows, machineRow, cols, results };
}

async function main() {
  const options = parseArgs(process.argv);
  if (!options.sheetName) throw new Error('請指定 sheet 名稱');

  await mongoose.connect(process.env.MONGODB_URI);
  const out = await importSheet(options);
  console.log(JSON.stringify(out, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
