-- ═══════════════════════════════════════════════════════════════
--  RK Studio — notifikasi WhatsApp bila ada booking baru
--  Guna CallMeBot (percuma, untuk kegunaan sendiri):
--  database hantar mesej WhatsApp ke nombor pemilik setiap kali
--  customer tempah. Tak perlu log masuk website untuk tahu ada booking.
--
--  Fail ini TIADA API key. Key disimpan dalam Supabase Vault (lihat bawah).
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pg_net with schema extensions;

-- Bina teks mesej (ringkas — detail penuh tengok di /admin)
create or replace function public.rk_wa_text(b public.rk_bookings)
returns text language plpgsql stable set search_path = public as $$
declare
  v_local timestamp := b.starts_at at time zone 'Asia/Kuala_Lumpur';
  v_end   timestamp := (b.ends_at - interval '5 minutes') at time zone 'Asia/Kuala_Lumpur';
  v_days  text[] := array['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];
  v_mons  text[] := array['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];
  v_pkg   text;  v_bd text;  v_extra text := '';  v_site text;
begin
  v_pkg := case b.package when 'spotlight' then 'Spotlight' when 'twogether' then 'Twogether'
                          when 'vibetribe' then 'Vibe Tribe' when 'chaoscrew' then 'Chaos Crew' else b.package end;
  v_bd  := case b.backdrop when 'pongee' then 'Pongee' when 'lightgrey' then 'Light Grey'
                           when 'deepblue' then 'Deep Blue' when 'flame' then 'Flame' else coalesce(b.backdrop,'-') end;
  if b.extra_pax > 0 then v_extra := v_extra || ' · +' || b.extra_pax || ' orang'; end if;
  if b.extra_prints > 0 then v_extra := v_extra || ' · +' || b.extra_prints || ' printed photos'; end if;
  select decrypted_secret into v_site from vault.decrypted_secrets where name = 'rk_site_url' limit 1;

  return '🔔 *Booking baru — RK Studio*' || chr(10) || chr(10)
    || '📅 ' || v_days[extract(dow from v_local)::int + 1] || ', ' || extract(day from v_local)::int || ' '
             || v_mons[extract(month from v_local)::int] || ' · '
             || to_char(v_local, 'FMHH12:MI AM') || '–' || to_char(v_end, 'FMHH12:MI AM') || chr(10)
    || '📦 ' || v_pkg || v_extra || chr(10)
    || '🎨 ' || v_bd || chr(10)
    || '💳 ' || case b.payment when 'qr' then 'QR DuitNow' when 'cash' then 'Tunai' else b.payment end
             || ' · RM' || b.total || chr(10)
    || '👤 ' || b.name || chr(10)
    || '🔖 ' || b.code || chr(10) || chr(10)
    || 'Detail: ' || coalesce(rtrim(v_site,'/') || '/admin', 'log masuk /admin');
end $$;

-- Hantar ke semua penerima. Senarai dalam Vault "rk_wa_targets", satu baris setiap penerima:
--   60123456789:APIKEY
create or replace function public.rk_wa_send(p_text text)
returns int language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_targets text; v_line text; v_phone text; v_key text; n int := 0;
begin
  select decrypted_secret into v_targets from vault.decrypted_secrets where name = 'rk_wa_targets' limit 1;
  if v_targets is null then return 0; end if;
  foreach v_line in array regexp_split_to_array(v_targets, '[\n,;]+') loop
    v_phone := regexp_replace(split_part(v_line, ':', 1), '[^0-9]', '', 'g');
    v_key   := trim(split_part(v_line, ':', 2));
    continue when length(v_phone) < 9 or v_key = '';
    perform net.http_get(
      url := 'https://api.callmebot.com/whatsapp.php',
      params := jsonb_build_object('phone', '+' || v_phone, 'text', p_text, 'apikey', v_key),
      timeout_milliseconds := 15000
    );
    n := n + 1;
  end loop;
  return n;
end $$;

-- Trigger: setiap booking customer yang baru masuk (bukan slot yang admin tutup)
create or replace function public.rk_notify_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.rk_wa_send(public.rk_wa_text(new));
  exception when others then
    -- notifikasi gagal tak boleh sesekali gagalkan tempahan customer
    raise warning 'rk_notify_new_booking: %', sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists rk_notify_new_booking on public.rk_bookings;
create trigger rk_notify_new_booking
  after insert on public.rk_bookings
  for each row when (new.package <> 'block')
  execute function public.rk_notify_new_booking();

revoke all on function public.rk_wa_text(public.rk_bookings), public.rk_wa_send(text),
  public.rk_notify_new_booking() from public, anon, authenticated;

-- ── Set penerima (run SEKALI dalam SQL Editor, jangan simpan dalam repo) ──
-- 1. Save +34 644 94 58 67 dalam contact, WhatsApp: I allow callmebot to send me messages
-- 2. Bot balas dengan APIKEY. Kemudian run:
-- select vault.create_secret('60123456789:APIKEY', 'rk_wa_targets');
-- select vault.create_secret('https://rkstudio.vercel.app', 'rk_site_url');   -- pilihan: link admin dalam mesej
-- Tukar kemudian: select vault.update_secret((select id from vault.secrets where name='rk_wa_targets'), '60...:KEY');
-- Uji: select public.rk_wa_send('Test notifikasi RK Studio ✅');
