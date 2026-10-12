-- ═══════════════════════════════════════════════════════════════
--  RK Studio — notifikasi Telegram bila ada booking baru
--  Database hantar mesej ke bot Telegram setiap kali customer tempah,
--  jadi tak perlu log masuk website untuk tahu ada booking.
--  Detail penuh & tindakan (sahkan, batal) masih di /admin.
--
--  Fail ini TIADA token. Token & chat ID disimpan dalam Supabase Vault (lihat bawah).
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pg_net with schema extensions;

-- Escape teks untuk Telegram parse_mode=HTML (nama/nota customer)
create or replace function public.rk_tg_esc(t text)
returns text language sql immutable set search_path = public as $$
  select replace(replace(replace(coalesce(t,''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

-- Bina teks mesej
create or replace function public.rk_tg_text(b public.rk_bookings)
returns text language plpgsql stable set search_path = public as $$
declare
  v_local timestamp := b.starts_at at time zone 'Asia/Kuala_Lumpur';
  v_end   timestamp := (b.ends_at - interval '5 minutes') at time zone 'Asia/Kuala_Lumpur';
  v_days  text[] := array['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];
  v_mons  text[] := array['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];
  v_pkg text; v_bd text; v_extra text := ''; v_site text; v_wa text; v_msg text;
begin
  v_pkg := case b.package when 'spotlight' then 'Spotlight' when 'twogether' then 'Twogether'
                          when 'vibetribe' then 'Vibe Tribe' when 'chaoscrew' then 'Chaos Crew' else b.package end;
  v_bd  := case b.backdrop when 'pongee' then 'Pongee' when 'lightgrey' then 'Light Grey'
                           when 'deepblue' then 'Deep Blue' when 'flame' then 'Flame' else coalesce(b.backdrop,'-') end;
  if b.extra_pax > 0 then v_extra := v_extra || ' · +' || b.extra_pax || ' orang'; end if;
  if b.extra_prints > 0 then v_extra := v_extra || ' · +' || b.extra_prints || ' printed photos'; end if;
  v_wa := regexp_replace(regexp_replace(b.phone, '[^0-9]', '', 'g'), '^0', '60');
  select decrypted_secret into v_site from vault.decrypted_secrets where name = 'rk_site_url' limit 1;

  v_msg := '🔔 <b>Booking baru — RK Studio</b>' || chr(10) || chr(10)
    || '📅 <b>' || v_days[extract(dow from v_local)::int + 1] || ', ' || extract(day from v_local)::int || ' '
             || v_mons[extract(month from v_local)::int] || '</b> · '
             || to_char(v_local, 'FMHH12:MI AM') || '–' || to_char(v_end, 'FMHH12:MI AM') || chr(10)
    || '📦 ' || v_pkg || v_extra || chr(10)
    || '🎨 ' || v_bd || chr(10)
    || '💳 ' || case b.payment when 'qr' then 'QR DuitNow (semak duit masuk sebelum sahkan)' when 'cash' then 'Tunai' else b.payment end
             || ' · <b>RM' || b.total || '</b>' || chr(10) || chr(10)
    || '👤 ' || public.rk_tg_esc(b.name) || chr(10)
    || '📱 <a href="https://wa.me/' || v_wa || '">' || public.rk_tg_esc(b.phone) || '</a>' || chr(10);
  if b.note is not null then v_msg := v_msg || '📝 ' || public.rk_tg_esc(b.note) || chr(10); end if;
  v_msg := v_msg || '🔖 <code>' || b.code || '</code>';
  if v_site is not null then
    v_msg := v_msg || chr(10) || chr(10) || '<a href="' || rtrim(v_site,'/') || '/admin">Buka admin →</a>';
  end if;
  return v_msg;
end $$;

-- Hantar ke semua chat dalam Vault "rk_tg_chats" (chat ID dipisah koma; group bermula dengan -)
create or replace function public.rk_tg_send(p_text text)
returns int language plpgsql volatile security definer set search_path = public, extensions as $$
declare v_token text; v_chats text; v_chat text; n int := 0;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'rk_tg_token' limit 1;
  select decrypted_secret into v_chats from vault.decrypted_secrets where name = 'rk_tg_chats' limit 1;
  if v_token is null or v_chats is null then return 0; end if;
  foreach v_chat in array regexp_split_to_array(v_chats, '[\s,;]+') loop
    continue when v_chat !~ '^-?[0-9]+$';
    perform net.http_post(
      url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
      body := jsonb_build_object('chat_id', v_chat, 'text', p_text, 'parse_mode', 'HTML',
                                 'disable_web_page_preview', true),
      timeout_milliseconds := 15000
    );
    n := n + 1;
  end loop;
  return n;
end $$;

-- Trigger: setiap booking customer baru (bukan slot yang admin tutup)
create or replace function public.rk_notify_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.rk_tg_send(public.rk_tg_text(new));
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

revoke all on function public.rk_tg_esc(text), public.rk_tg_text(public.rk_bookings), public.rk_tg_send(text),
  public.rk_notify_new_booking() from public, anon, authenticated;

-- ── Set bot (run SEKALI dalam SQL Editor, jangan simpan token dalam repo) ──
-- 1. Telegram → @BotFather → /newbot → dapat TOKEN. Buka bot, tekan Start.
-- 2. Cari chat ID: buka https://api.telegram.org/botTOKEN/getUpdates → "chat":{"id": ...}
-- 3. Run:
-- select vault.create_secret('TOKEN', 'rk_tg_token');
-- select vault.create_secret('123456789', 'rk_tg_chats');            -- lebih dari satu: '123,-100456'
-- select vault.create_secret('https://rkstudio.vercel.app', 'rk_site_url');   -- pilihan
-- Tukar: select vault.update_secret((select id from vault.secrets where name='rk_tg_chats'), '123,456');
-- Uji:   select public.rk_tg_send('Test notifikasi RK Studio ✅');
