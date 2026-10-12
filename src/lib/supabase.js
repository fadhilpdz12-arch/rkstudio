import { createClient } from '@supabase/supabase-js';

// Kunci "publishable" memang selamat untuk didedahkan di website.
// Semua data booking dilindungi di database (RLS + fungsi khas).
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://yqwfkflckyiiwfxphynj.supabase.co';
const KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_1NMr4c2J_ProEP5rNfeFEA_fFJm8L10';

export const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const MESSAGES = {
  SLOT_TAKEN: ['Slot ni baru je ditempah orang lain. Pilih masa lain ya.', 'Someone just booked this slot. Please pick another time.'],
  TOO_SOON: ['Masa tu terlalu dekat. Tempah sekurang-kurangnya 20 minit lebih awal.', 'That time is too soon. Book at least 20 minutes ahead.'],
  OUTSIDE_HOURS: ['Masa tu di luar waktu operasi studio.', 'That time is outside our opening hours.'],
  TOO_MANY: ['Nombor ni dah ada 3 tempahan belum disahkan. WhatsApp kami untuk bantuan.', 'This number already has 3 unconfirmed bookings. WhatsApp us for help.'],
  BAD_PHONE: ['Nombor telefon tak lengkap. Contoh: 012-345 6789', 'Phone number looks incomplete. Include your country code, e.g. +44 7700 900123'],
  BAD_NAME: ['Isi nama penuh dulu.', 'Please enter your name.'],
  TOO_FAR: ['Tempahan boleh dibuat sehingga 60 hari dari sekarang.', 'Bookings open up to 60 days ahead.'],
  BAD_PIN: ['Username atau kata laluan salah.', 'Wrong username or password.'],
  LOCKED: ['Terlalu banyak cubaan salah. Cuba lagi selepas 15 minit.', 'Too many wrong attempts. Try again in 15 minutes.'],
  RATE_LIMIT: ['Terlalu banyak tempahan dari sambungan ini. Cuba lagi sejam lagi, atau WhatsApp kami.', 'Too many bookings from this connection. Try again in an hour, or WhatsApp us.'],
  BAD_EMAIL: ['Format e-mel tak betul. Contoh: nama@email.com', 'That email doesn\'t look right, e.g. name@email.com'],
};

export function friendlyError(err, lang = 'ms') {
  const i = lang === 'en' ? 1 : 0;
  const raw = err?.message || String(err || '');
  const key = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (key) return MESSAGES[key][i];
  if (/fetch|network/i.test(raw)) return ['Sambungan internet terputus. Cuba lagi.', 'Connection lost. Please try again.'][i];
  return ['Ada masalah teknikal. Cuba lagi, atau WhatsApp kami terus.', 'Something went wrong. Try again, or WhatsApp us directly.'][i];
}
