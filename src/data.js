// Semua maklumat RK Studio di satu tempat — ubah sini, seluruh website ikut.

export const CONTACT = {
  whatsapp: '601171171509',
  whatsappDisplay: '011-7117 1509',
  tiktok: 'https://www.tiktok.com/@rkstudiobesut',
  tiktokHandle: '@rkstudiobesut',
  beacons: 'https://beacons.ai/rkstudio',
  maps: 'https://maps.app.goo.gl/xMm264ejBH5iPhow8',
  waze: 'https://waze.com/ul?q=RK%20Studio%20Limbongan%20Besut',
  area: 'Limbongan, Besut, Terengganu',
};

export const PACKAGES = [
  {
    id: 'spotlight', name: 'Spotlight', price: 25, pax: 1, maxExtra: 0, minutes: 10, prints: 0,
    blurb: 'Untuk sorang. Masa untuk diri sendiri.',
    blurbEn: 'Just you. Some time for yourself.',
    extras: [], extrasEn: [],
  },
  {
    id: 'twogether', name: 'Twogether', price: 42, pax: 2, maxExtra: 2, minutes: 25, prints: 1,
    blurb: 'Berdua, dengan pasangan, kawan baik atau si kecil.',
    blurbEn: 'For two: your partner, best friend or little one.',
    extras: ['Baby & toddler boleh masuk sekali'], extrasEn: ['Babies & toddlers welcome'],
  },
  {
    id: 'vibetribe', name: 'Vibe Tribe', price: 75, pax: 5, maxExtra: 2, minutes: 30, prints: 2,
    blurb: 'Satu geng, satu keluarga kecil.',
    blurbEn: 'A small family or your travel crew.',
    extras: [], extrasEn: [],
  },
  {
    id: 'chaoscrew', name: 'Chaos Crew', price: 100, pax: 8, maxExtra: 2, minutes: 40, prints: 2,
    blurb: 'Ramai-ramai. Makin ramai, makin huru-hara.',
    blurbEn: 'The whole group. The more, the merrier (and messier).',
    extras: [], extrasEn: [],
  },
];

export const EXTRA_PAX_PRICE = 10;
export const EXTRA_PRINT_PRICE = 4;

export const BACKDROPS = [
  { id: 'pongee', name: 'Pongee', hex: '#D8CFAE', ink: '#1b1712', mood: 'Lembut dan hangat. Sesuai untuk gambar keluarga.', moodEn: 'Soft and warm. Lovely for family photos.' },
  { id: 'lightgrey', name: 'Light Grey', hex: '#C4D3CE', ink: '#1b1712', mood: 'Bersih dan moden. Baju warna apa pun naik.', moodEn: 'Clean and modern. Works with any outfit.' },
  { id: 'deepblue', name: 'Deep Blue', hex: '#34495F', ink: '#EFE8DE', mood: 'Gelap dan dramatik. Muka lebih menyerlah.', moodEn: 'Dark and dramatic. Faces really pop.' },
  { id: 'flame', name: 'Flame', hex: '#8E2F37', ink: '#EFE8DE', mood: 'Berani dan meriah. Untuk yang nak lain dari lain.', moodEn: 'Bold and lively. For something different.' },
];

// Waktu operasi (waktu Malaysia). 0 = Ahad ... 6 = Sabtu
export const HOURS = {
  0: ['17:00', '22:00'],
  1: ['17:00', '22:00'],
  2: ['17:00', '22:00'],
  3: ['17:00', '22:00'],
  4: ['17:00', '22:00'],
  5: ['08:00', '22:00'],
  6: ['08:00', '22:00'],
};

export const DAY_NAMES = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
export const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
export const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dayNames = (lang) => (lang === 'en' ? DAY_NAMES_EN : DAY_NAMES);
export const monthNames = (lang) => (lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES);

export const SLOT_STEP = 15;     // minit antara slot
export const BUFFER_MIN = 5;     // masa tukar giliran
export const LEAD_MIN = 20;      // paling awal boleh tempah sebelum sesi
export const MAX_DAYS = 365;   // tempahan dibuka sehingga setahun ke depan
export const WAIT_PRINTS = 10;  // minit tunggu jika customer sebelum ada printed photos
export const WAIT_PLAIN = 5;    // minit kemas & tukar backdrop

// Nama penerima pada QR DuitNow — customer semak sebelum bayar (elak scam QR palsu)
export const PAY_NAME = 'KASMA MURNI BINTI MAT DAU';
