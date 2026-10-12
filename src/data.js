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
    id: 'spotlight', name: 'Spotlight', price: 25, pax: 1, maxExtra: 1, minutes: 10, prints: 0,
    blurb: 'Untuk sorang. Masa untuk diri sendiri.',
    extras: [],
  },
  {
    id: 'twogether', name: 'Twogether', price: 42, pax: 2, maxExtra: 2, minutes: 25, prints: 1,
    blurb: 'Berdua, dengan pasangan, kawan baik atau si kecil.',
    extras: ['Baby & toddler boleh masuk sekali'],
  },
  {
    id: 'vibetribe', name: 'Vibe Tribe', price: 75, pax: 5, maxExtra: 2, minutes: 30, prints: 2,
    blurb: 'Satu geng, satu keluarga kecil.',
    extras: [],
  },
  {
    id: 'chaoscrew', name: 'Chaos Crew', price: 100, pax: 8, maxExtra: 2, minutes: 40, prints: 2,
    blurb: 'Ramai-ramai. Makin ramai, makin huru-hara.',
    extras: [],
  },
];

export const EXTRA_PAX_PRICE = 10;
export const EXTRA_PRINT_PRICE = 4;

export const BACKDROPS = [
  { id: 'pongee', name: 'Pongee', hex: '#D8CFAE', ink: '#1b1712', mood: 'Lembut dan hangat. Sesuai untuk gambar keluarga.' },
  { id: 'lightgrey', name: 'Light Grey', hex: '#C4D3CE', ink: '#1b1712', mood: 'Bersih dan moden. Baju warna apa pun naik.' },
  { id: 'deepblue', name: 'Deep Blue', hex: '#34495F', ink: '#EFE8DE', mood: 'Gelap dan dramatik. Muka lebih menyerlah.' },
  { id: 'flame', name: 'Flame', hex: '#8E2F37', ink: '#EFE8DE', mood: 'Berani dan meriah. Untuk yang nak lain dari lain.' },
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
export const MONTH_NAMES = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

export const SLOT_STEP = 15;     // minit antara slot
export const BUFFER_MIN = 5;     // masa tukar giliran
export const LEAD_MIN = 20;      // paling awal boleh tempah sebelum sesi
export const MAX_DAYS = 60;

// Nama penerima pada QR DuitNow — customer semak sebelum bayar (elak scam QR palsu)
export const PAY_NAME = 'KASMA MURNI BINTI MAT DAU';
