# Keselamatan RK Studio

Ringkasan perlindungan yang dipasang, dan apa yang pemilik perlu jaga.

## Perlindungan dalam sistem

| Ancaman | Perlindungan |
|---|---|
| Curi data customer (nama, telefon) | Jadual dikunci dengan Row Level Security. Browser tak boleh baca jadual terus. Slot kosong dipaparkan tanpa nama atau telefon. Senarai penuh hanya untuk admin. |
| Ubah harga (contoh bayar RM1) | Harga dikira di database, bukan di browser. Harga yang dihantar dari browser diabaikan. |
| Tempah slot yang sama dua kali | Kekangan `rk_no_overlap` di database menolak slot bertindih, walaupun dua orang tekan serentak. |
| Spam tempahan palsu untuk penuhkan slot | Had 4 tempahan sejam dan 10 sehari bagi satu sambungan internet. Satu nombor telefon maksimum 3 tempahan belum disahkan. Semua input disemak (panjang, format). |
| Teka kata laluan admin | Kata laluan disimpan sebagai hash bcrypt. Selepas 10 cubaan salah, log masuk dikunci 15 minit. Sesi admin hanya dalam memori dan log keluar sendiri selepas 20 minit tiada aktiviti. |
| Suntik skrip (XSS) | React escape semua teks. Content-Security-Policy hanya benarkan skrip dari website sendiri dan sambungan ke Supabase sahaja. |
| Website dimasukkan dalam iframe (clickjacking) | `X-Frame-Options: DENY` dan `frame-ancestors 'none'`. |
| Sambungan dicuri (HTTP) | HSTS paksa HTTPS. |
| QR palsu / bayar ke akaun salah | Halaman bayaran tunjuk nama penerima yang sah. Customer diminta semak nama sebelum bayar. |
| Resit palsu | Admin diingatkan semak duit masuk dalam app bank sebelum tekan Sahkan. |
| Admin page muncul di Google | `noindex` + `robots.txt`. |
| Formula jahat dalam fail CSV | Nilai yang bermula dengan `= + - @` di-escape semasa muat turun. |

Kunci `sb_publishable_...` dalam kod memang direka untuk didedahkan. Ia tak boleh baca data sebab semua jadual dikunci.

## Tanggungjawab pemilik (PENTING)

1. **Hidupkan 2FA (Two-Factor Authentication)** pada akaun GitHub, Vercel dan Supabase. Ini perlindungan paling penting. Kalau akaun ni dicuri, penggodam boleh ubah website.
2. Jangan kongsi kata laluan admin. Tukar berkala melalui fungsi `admin_change_pin`.
3. Jangan simpan kata laluan dalam repo (repo ni public).
4. Muat turun CSV tempahan dari page admin seminggu sekali sebagai sandaran data.
5. Kalau nampak tempahan pelik atau banyak serentak, tekan Batal dan semak di Supabase.

## Pulih jika berlaku masalah

- **Kod website**: semua kod ada dalam GitHub (dan salinan ZIP). Deploy semula ke Vercel atau Netlify dari repo dalam 5 minit.
- **Database**: run `supabase/schema.sql` dalam Supabase SQL Editor untuk bina semula struktur, kemudian set kata laluan admin.
- **Vercel digodam**: buang project di Vercel, tukar kata laluan dan hidupkan 2FA, kemudian import semula repo dari GitHub.
