// Michigan QSO Party contest rules and reference data

export const MI_COUNTIES = new Map([
  ['ALCO', 'Alcona'],    ['ALGE', 'Alger'],     ['ALLE', 'Allegan'],   ['ALPE', 'Alpena'],
  ['ANTR', 'Antrim'],    ['AREN', 'Arenac'],    ['BARA', 'Baraga'],    ['BARR', 'Barry'],
  ['BAY',  'Bay'],       ['BENZ', 'Benzie'],    ['BERR', 'Berrien'],   ['BRAN', 'Branch'],
  ['CALH', 'Calhoun'],   ['CASS', 'Cass'],      ['CHAR', 'Charlevoix'],['CHEB', 'Cheboygan'],
  ['CHIP', 'Chippewa'],  ['CLAR', 'Clare'],     ['CLIN', 'Clinton'],   ['CRAW', 'Crawford'],
  ['DELT', 'Delta'],     ['DICK', 'Dickinson'], ['EATO', 'Eaton'],     ['EMME', 'Emmet'],
  ['GENE', 'Genesee'],   ['GLAD', 'Gladwin'],   ['GOGE', 'Gogebic'],   ['GRAT', 'Gratiot'],
  ['GRTR', 'Grand Traverse'], ['HILL', 'Hillsdale'], ['HOUG', 'Houghton'], ['HURO', 'Huron'],
  ['INGH', 'Ingham'],    ['IONI', 'Ionia'],     ['IOSC', 'Iosco'],     ['IRON', 'Iron'],
  ['ISAB', 'Isabella'],  ['JACK', 'Jackson'],   ['KALK', 'Kalkaska'],  ['KENT', 'Kent'],
  ['KEWE', 'Keweenaw'],  ['KZOO', 'Kalamazoo'], ['LAKE', 'Lake'],      ['LAPE', 'Lapeer'],
  ['LEEL', 'Leelanau'],  ['LENA', 'Lenawee'],   ['LIVI', 'Livingston'],['LUCE', 'Luce'],
  ['MACK', 'Mackinac'],  ['MACO', 'Macomb'],    ['MANI', 'Manistee'],  ['MARQ', 'Marquette'],
  ['MASO', 'Mason'],     ['MCLM', 'Montcalm'],  ['MECO', 'Mecosta'],   ['MENO', 'Menominee'],
  ['MIDL', 'Midland'],   ['MISS', 'Missaukee'], ['MONR', 'Monroe'],    ['MTMO', 'Montmorency'],
  ['MUSK', 'Muskegon'],  ['NEWA', 'Newaygo'],   ['OAKL', 'Oakland'],   ['OCEA', 'Oceana'],
  ['OGEM', 'Ogemaw'],    ['ONTO', 'Ontonagon'], ['OSCE', 'Osceola'],   ['OSCO', 'Oscoda'],
  ['OTSE', 'Otsego'],    ['OTTA', 'Ottawa'],    ['PRES', 'Presque Isle'], ['ROSC', 'Roscommon'],
  ['SAGI', 'Saginaw'],   ['SANI', 'Sanilac'],   ['SCHO', 'Schoolcraft'],['SHIA', 'Shiawassee'],
  ['STCL', 'St Clair'],  ['STJO', 'St Joseph'], ['TUSC', 'Tuscola'],   ['VANB', 'Van Buren'],
  ['WASH', 'Washtenaw'], ['WAYN', 'Wayne'],     ['WEXF', 'Wexford'],
]);

// US states + DC valid for out-of-state mults (Michigan excluded)
export const US_STATE_MULTS = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI',
  'IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MN','MO',
  'MS','MT','NE','NH','NJ','NM','NV','NY','NC','ND','OH','OK','OR','PA',
  'RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY',
]);

export const CANADIAN_PROVINCE_MULTS = new Set([
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT',
]);

export const DX_MULT = 'DX';

// All valid sent-QTH values for non-Michigan stations
export const VALID_NON_MI_QTHL = new Set([
  ...US_STATE_MULTS,
  ...CANADIAN_PROVINCE_MULTS,
  DX_MULT,
]);

// Returns true if the QTH code is a Michigan county
export function isMichiganQth(qth) {
  return MI_COUNTIES.has(qth.toUpperCase());
}

// Returns true if QTH is a valid non-Michigan sent location
export function isNonMichiganQth(qth) {
  return VALID_NON_MI_QTHL.has(qth.toUpperCase());
}

// Normalize a non-Michigan QTH: DX is a catch-all for any non-W/VE callsign area
// The log file itself will contain 'DX' for these stations
export function normalizeRcvQth(qth) {
  const upper = qth.toUpperCase();
  if (MI_COUNTIES.has(upper)) return upper;
  if (US_STATE_MULTS.has(upper)) return upper;
  if (CANADIAN_PROVINCE_MULTS.has(upper)) return upper;
  if (upper === 'DX') return 'DX';
  return null; // unknown
}

// Map frequency (kHz) to band name; returns null for invalid/non-contest bands
export function freqToBand(freqKhz) {
  const f = parseInt(freqKhz, 10);
  if (f >= 3500  && f <= 4000)  return '80m';
  if (f >= 7000  && f <= 7300)  return '40m';
  if (f >= 14000 && f <= 14350) return '20m';
  if (f >= 21000 && f <= 21450) return '15m';
  if (f >= 28000 && f <= 29700) return '10m';
  return null;
}

export const VALID_MODES = new Set(['CW', 'PH']);

export const QSO_POINTS = { CW: 2, PH: 1 };

// Canonical band order for display
export const BAND_ORDER = ['80m', '40m', '20m', '15m', '10m'];

export const RULES = {
  name: 'Michigan QSO Party',
  MI_COUNTIES,
  US_STATE_MULTS,
  CANADIAN_PROVINCE_MULTS,
  DX_MULT,
  VALID_NON_MI_QTHL,
  isMichiganQth,
  isNonMichiganQth,
  normalizeRcvQth,
  freqToBand,
  VALID_MODES,
  QSO_POINTS,
  BAND_ORDER,
};
