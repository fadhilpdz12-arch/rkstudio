# RK Studio — website

Website rasmi **RK Studio**, self photo studio di Limbongan, Besut.
Pengunjung boleh tengok pakej, cuba remote, pilih backdrop, dan **tempah slot terus** (bayar QR DuitNow atau tunai).

## Halaman

| Laluan | Fungsi |
|---|---|
| `/` | Laman utama (kamera 3D, galeri, cara guna, pakej, backdrop, lokasi) |
| `/tempah` | Tempah slot: pakej → backdrop → tarikh & masa → butiran → bayaran |
| `/siap/KOD` | Pengesahan tempahan + butang hantar ke WhatsApp |
| `/admin` | Senarai tempahan, sahkan bayaran, batal, tutup slot (perlu kata laluan) |

## Jalankan di komputer

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil dalam folder dist/
```

## Online (Netlify, percuma)

1. Masuk netlify.com → **Add new site → Import an existing project → GitHub** → pilih repo `rkstudio`.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Deploy. Setiap kali push ke GitHub, website auto kemas kini.

Vercel pun boleh, `vercel.json` dah disediakan.

## Nak ubah maklumat?

Semua dalam **`src/data.js`**: harga pakej, waktu operasi, nombor WhatsApp, link TikTok, link Google Maps.

> Kalau ubah harga atau waktu operasi, fungsi `create_booking` di Supabase pun kena dikemas kini sama.
> Database yang kira harga sebenar dan semak waktu, supaya tak boleh diubah dari browser.

## QR DuitNow

Letak gambar QR di `src/assets/pay/qr.png` (atau .jpg/.webp), kemudian push.
Halaman pengesahan akan tunjuk QR tu secara automatik. Selagi tiada fail QR, customer diminta dapatkan QR melalui WhatsApp.

## Database (Supabase)

- Jadual `rk_bookings` simpan semua tempahan. Dilindungi RLS; browser cuma boleh guna fungsi
  `get_busy` (slot terisi, tanpa nama/telefon), `create_booking`, dan fungsi `admin_*` (perlu kata laluan).
- Satu slot tak boleh ditempah dua kali (dikunci di peringkat database).
- Kata laluan admin boleh ditukar melalui fungsi `admin_change_pin`.
