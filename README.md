# RK Studio — website

Website rasmi **RK Studio**, self photo studio di Limbongan, Besut.
Pengunjung boleh tengok pakej, cuba remote, pilih backdrop, dan **tempah slot terus** (bayar QR DuitNow atau tunai).

## Halaman

| Laluan | Fungsi |
|---|---|
| `/` | Laman utama (kamera 3D, galeri, cara guna, pakej, backdrop, lokasi) |
| `/tempah` | Tempah slot: pakej → backdrop → tarikh & masa → butiran → bayaran |
| `/siap/KOD` | Pengesahan tempahan, QR bayaran, butang hantar ke WhatsApp |
| `/admin` | Senarai tempahan, sahkan bayaran, batal, tutup slot, muat turun CSV (perlu username + kata laluan) |

## Livekan di Vercel

1. Masuk vercel.com → **Sign Up / Log In with GitHub**.
2. **Add New… → Project** → pilih repo `rkstudio` → **Import**.
3. Framework Preset: **Vite** (Vercel kesan sendiri). Build Command `npm run build`, Output Directory `dist`.
4. Tekan **Deploy**. Siap dalam ±1 minit.
5. Setiap kali push ke GitHub, Vercel deploy semula secara automatik.

`vercel.json` dah ada: laluan SPA + header keselamatan (CSP, HSTS, anti-iframe).

## Jalankan di komputer

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil dalam folder dist/
```

## Nak ubah maklumat?

Semua dalam **`src/data.js`**: harga pakej, waktu operasi, nombor WhatsApp, link TikTok, Google Maps, nama penerima QR.

> Kalau ubah harga atau waktu operasi, fungsi `create_booking` dan `rk_pkg` di Supabase pun kena dikemas kini sama
> (lihat `supabase/schema.sql`). Database yang kira harga sebenar dan semak waktu, supaya tak boleh diubah dari browser.

QR DuitNow ada di `src/assets/pay/qr.png`. Ganti fail tu kalau tukar akaun.

## Keselamatan & sandaran

Lihat **[SECURITY.md](SECURITY.md)**. Struktur database disandarkan dalam **`supabase/schema.sql`** (tanpa data customer dan tanpa kata laluan).

## Keep-alive Supabase (automatik)
`api/keepalive.js` + `crons` dalam `vercel.json` buat Vercel ping database sekali sehari (9 pagi waktu Malaysia),
supaya projek Supabase plan percuma tak di-pause. Ia hanya membaca, tiada data diubah.
Pilihan: set env `CRON_SECRET` (apa-apa teks rawak panjang) di Vercel supaya hanya Vercel Cron boleh panggil endpoint tu.
Semak di Vercel → Project → Settings → Cron Jobs.
