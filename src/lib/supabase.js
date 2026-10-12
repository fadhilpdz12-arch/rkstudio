import { createClient } from '@supabase/supabase-js';

// Kunci "publishable" memang selamat untuk didedahkan di website.
// Semua data booking dilindungi di database (RLS + fungsi khas).
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://yqwfkflckyiiwfxphynj.supabase.co';
const KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_1NMr4c2J_ProEP5rNfeFEA_fFJm8L10';

export const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const MESSAGES = {
  SLOT_TAKEN: 'Slot ni baru je ditempah orang lain. Pilih masa lain ya.',
  TOO_SOON: 'Masa tu terlalu dekat. Tempah sekurang-kurangnya 20 minit lebih awal.',
  OUTSIDE_HOURS: 'Masa tu di luar waktu operasi studio.',
  TOO_MANY: 'Nombor ni dah ada 3 tempahan belum disahkan. WhatsApp kami untuk bantuan.',
  BAD_PHONE: 'Nombor telefon tak lengkap. Contoh: 012-345 6789',
  BAD_NAME: 'Isi nama penuh dulu.',
  TOO_FAR: 'Tempahan boleh dibuat sehingga 60 hari dari sekarang.',
  BAD_PIN: 'Username atau kata laluan salah.',
  LOCKED: 'Terlalu banyak cubaan salah. Cuba lagi selepas 15 minit.',
  RATE_LIMIT: 'Terlalu banyak tempahan dari sambungan ini. Cuba lagi sejam lagi, atau WhatsApp kami.',
  BAD_EMAIL: 'Format e-mel tak betul. Contoh: nama@email.com',
};

export function friendlyError(err) {
  const raw = err?.message || String(err || '');
  const key = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (key) return MESSAGES[key];
  if (/fetch|network/i.test(raw)) return 'Sambungan internet terputus. Cuba lagi.';
  return 'Ada masalah teknikal. Cuba lagi, atau WhatsApp kami terus.';
}
