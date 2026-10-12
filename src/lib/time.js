import { HOURS, DAY_NAMES, MONTH_NAMES, SLOT_STEP, BUFFER_MIN, LEAD_MIN } from '../data';

const MYT = 8 * 60 * 60 * 1000; // Malaysia tiada DST

export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function nowMYT() {
  const d = new Date(Date.now() + MYT);
  return {
    date: d.toISOString().slice(0, 10),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
    dow: d.getUTCDay(),
  };
}

export const dowOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();
export function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// "6:00 ptg", "8:30 pagi", "12:15 tgh", "9:00 mlm"
export function clock(min) {
  const h = Math.floor(min / 60), m = min % 60;
  const part = h < 12 ? 'pagi' : h < 14 ? 'tgh' : h < 19 ? 'ptg' : 'mlm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''} ${part}`;
}

export function hoursOf(date) {
  const [o, c] = HOURS[dowOf(date)];
  return { open: toMin(o), close: toMin(c) };
}

export function longDate(date) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Status langsung untuk header / hero
export function liveStatus() {
  const n = nowMYT();
  const { open, close } = hoursOf(n.date);
  if (n.minutes >= open && n.minutes < close) {
    return { open: true, text: `Buka sekarang, sampai ${clock(close)}` };
  }
  if (n.minutes < open) return { open: false, text: `Tutup. Buka hari ini ${clock(open)}` };
  const t = addDays(n.date, 1);
  const tmr = hoursOf(t);
  return { open: false, text: `Tutup. Buka esok ${clock(tmr.open)}` };
}

// Tukar masa dari database (ISO) kepada minit dalam hari (waktu Malaysia) untuk tarikh tertentu
export function busyToMinutes(busy, date) {
  const base = Date.parse(`${date}T00:00:00Z`);
  return busy.map((b) => ({
    start: Math.round((Date.parse(b.starts_at) + MYT - base) / 60000),
    end: Math.round((Date.parse(b.ends_at) + MYT - base) / 60000),
  }));
}

export function slotsFor(date, minutes, busyMin = []) {
  const { open, close } = hoursOf(date);
  const n = nowMYT();
  const earliest = date === n.date ? n.minutes + LEAD_MIN : -1;
  const out = [];
  for (let s = open; s + minutes <= close; s += SLOT_STEP) {
    const e = s + minutes + BUFFER_MIN;
    const clash = busyMin.some((b) => s < b.end && e > b.start);
    out.push({ time: fromMin(s), min: s, available: !clash && s >= earliest });
  }
  return out;
}
