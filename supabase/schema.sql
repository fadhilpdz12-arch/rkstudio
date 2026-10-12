-- ═══════════════════════════════════════════════════════════════
--  RK Studio — sandaran struktur database (Supabase / Postgres)
--  Untuk pulihkan: Supabase → SQL Editor → tampal semua → Run.
--  Fail ini TIADA data customer dan TIADA kata laluan.
--  Lepas run, set kata laluan admin (lihat bahagian paling bawah).
-- ═══════════════════════════════════════════════════════════════

create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ── Jadual ──────────────────────────────────────────────────────
create table if not exists public.rk_bookings (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  package text not null,
  extra_pax int not null default 0,
  extra_prints int not null default 0,
  backdrop text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  name text not null,
  phone text not null,
  email text,
  note text,
  payment text not null check (payment in ('qr','cash','admin')),
  total int not null default 0,
  status text not null default 'pending' check (status in ('pending','confirmed','done','cancelled')),
  created_at timestamptz not null default now(),
  -- satu slot tak boleh bertindih (kecuali yang dibatalkan)
  constraint rk_no_overlap exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&) where (status <> 'cancelled')
);
create index if not exists rk_bookings_starts_idx on public.rk_bookings (starts_at);

create table if not exists public.rk_admin (id int primary key default 1 check (id = 1), pin_hash text not null);
create table if not exists public.rk_admin_fail (at timestamptz not null default now());
create table if not exists public.rk_rate (ip_hash text not null, at timestamptz not null default now());
create index if not exists rk_rate_idx on public.rk_rate (ip_hash, at);

-- RLS hidup, tiada polisi = tiada akses terus dari browser. Semua akses melalui fungsi di bawah.
alter table public.rk_bookings enable row level security;
alter table public.rk_admin enable row level security;
alter table public.rk_admin_fail enable row level security;
alter table public.rk_rate enable row level security;
revoke all on public.rk_bookings, public.rk_admin, public.rk_admin_fail, public.rk_rate from anon, authenticated;

-- ── Katalog pakej (harga sebenar dikira di sini, bukan di browser) ──
create or replace function public.rk_pkg(p text, out price int, out dur int, out max_extra int)
language sql immutable set search_path = public as $$
  select v.price, v.dur, v.max_extra from (values
    ('spotlight',25,10,0),  -- pakej seorang: tiada tambah orang
    ('twogether',42,25,2),
    ('vibetribe',75,30,2),
    ('chaoscrew',100,40,2)
  ) v(k,price,dur,max_extra) where v.k = p
$$;

-- ── Slot terisi (masa sahaja, tanpa nama/telefon) ──
create or replace function public.get_busy(p_date date)
returns table(starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.starts_at, b.ends_at from public.rk_bookings b
  where b.status <> 'cancelled'
    and p_date between (now() at time zone 'Asia/Kuala_Lumpur')::date - 1 and (now() at time zone 'Asia/Kuala_Lumpur')::date + 370
    and b.starts_at < ((p_date + 1)::timestamp at time zone 'Asia/Kuala_Lumpur')
    and b.ends_at   > (p_date::timestamp at time zone 'Asia/Kuala_Lumpur');
$$;

-- Sama seperti get_busy + sama ada customer tu ada printed photos (untuk notis "mungkin perlu tunggu 5/10 minit").
create or replace function public.get_slots_busy(p_date date)
returns table(starts_at timestamptz, ends_at timestamptz, has_prints boolean)
language sql stable security definer set search_path = public as $$
  select b.starts_at, b.ends_at,
         (b.package in ('twogether','vibetribe','chaoscrew') or b.extra_prints > 0) as has_prints
  from public.rk_bookings b
  where b.status <> 'cancelled'
    and p_date between (now() at time zone 'Asia/Kuala_Lumpur')::date - 1 and (now() at time zone 'Asia/Kuala_Lumpur')::date + 370
    and b.starts_at < ((p_date + 1)::timestamp at time zone 'Asia/Kuala_Lumpur')
    and b.ends_at   > (p_date::timestamp at time zone 'Asia/Kuala_Lumpur');
$$;

-- ── Hash IP pengunjung (untuk had kadar; IP sebenar tak disimpan) ──
create or replace function public.rk_client_ip_hash() returns text
language plpgsql stable security definer set search_path = public, extensions as $$
declare h json; ip text;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  ip := coalesce(nullif(h->>'cf-connecting-ip',''), nullif(split_part(coalesce(h->>'x-forwarded-for',''), ',', 1),''), nullif(h->>'x-real-ip',''), 'unknown');
  return encode(extensions.digest(trim(ip) || ':rk-salt-2026', 'sha256'), 'hex');
end $$;

-- ── Buat tempahan ──
-- Waktu: Ahad–Khamis 5 ptg–10 mlm, Jumaat & Sabtu 8 pagi–10 mlm. 5 minit tukar giliran.
create or replace function public.create_booking(
  p_package text, p_extra_pax int, p_extra_prints int, p_backdrop text,
  p_date date, p_time text, p_name text, p_phone text, p_email text, p_note text, p_payment text)
returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_price int; v_dur int; v_max int;
  v_start timestamptz; v_end timestamptz;
  v_dow int; v_open time; v_close time := '22:00'; v_t time;
  v_total int; v_code text; v_phone text; v_ip text;
begin
  v_ip := public.rk_client_ip_hash();
  if (select count(*) from public.rk_rate where ip_hash = v_ip and at > now() - interval '1 hour') >= 4
     or (select count(*) from public.rk_rate where ip_hash = v_ip and at > now() - interval '1 day') >= 10 then
    raise exception 'RATE_LIMIT';
  end if;

  select k.price, k.dur, k.max_extra into v_price, v_dur, v_max from public.rk_pkg(p_package) k;
  if v_price is null then raise exception 'BAD_PACKAGE'; end if;
  if p_extra_pax is null or p_extra_pax < 0 or p_extra_pax > v_max then raise exception 'BAD_PAX'; end if;
  if p_extra_prints is null or p_extra_prints < 0 or p_extra_prints > 30 then raise exception 'BAD_PRINTS'; end if;
  if p_backdrop not in ('pongee','lightgrey','deepblue','flame') then raise exception 'BAD_BACKDROP'; end if;
  if p_payment not in ('qr','cash') then raise exception 'BAD_PAYMENT'; end if;
  if coalesce(length(trim(p_name)),0) < 2 or length(p_name) > 80 or p_name ~ '[<>{}]' then raise exception 'BAD_NAME'; end if;
  v_phone := regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g');
  if length(v_phone) < 9 or length(v_phone) > 15 or length(p_phone) > 20 then raise exception 'BAD_PHONE'; end if;
  if p_email is not null and (length(p_email) > 120 or (p_email <> '' and p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')) then raise exception 'BAD_EMAIL'; end if;
  if p_note is not null and length(p_note) > 300 then raise exception 'BAD_NOTE'; end if;

  v_t := p_time::time;
  if extract(minute from v_t)::int % 15 <> 0 then raise exception 'BAD_TIME'; end if;
  v_dow := extract(dow from p_date)::int;
  v_open := case when v_dow in (5,6) then '08:00'::time else '17:00'::time end;
  if v_t < v_open or (v_t + make_interval(mins => v_dur)) > v_close then raise exception 'OUTSIDE_HOURS'; end if;

  v_start := (p_date + v_t) at time zone 'Asia/Kuala_Lumpur';
  if v_start < now() + interval '20 minutes' then raise exception 'TOO_SOON'; end if;
  if v_start > now() + interval '366 days' then raise exception 'TOO_FAR'; end if;  -- tempahan dibuka setahun ke depan
  v_end := v_start + make_interval(mins => v_dur + 5);

  if (select count(*) from public.rk_bookings
      where regexp_replace(phone,'[^0-9]','','g') = v_phone and status = 'pending' and starts_at > now()) >= 3
  then raise exception 'TOO_MANY'; end if;

  v_total := v_price + p_extra_pax * 10 + p_extra_prints * 4;
  v_code := 'RK' || to_char(p_date,'DDMM') || '-' || upper(substr(md5(gen_random_uuid()::text),1,6));

  begin
    insert into public.rk_bookings(code, package, extra_pax, extra_prints, backdrop, starts_at, ends_at,
      name, phone, email, note, payment, total)
    values (v_code, p_package, p_extra_pax, p_extra_prints, p_backdrop, v_start, v_end,
      trim(p_name), p_phone, nullif(trim(coalesce(p_email,'')),''), nullif(trim(coalesce(p_note,'')),''), p_payment, v_total);
  exception when exclusion_violation then
    raise exception 'SLOT_TAKEN';
  end;

  insert into public.rk_rate(ip_hash) values (v_ip);
  return json_build_object('code', v_code, 'starts_at', v_start, 'ends_at', v_end, 'total', v_total);
end $$;

-- ── Admin: semak kata laluan, kunci 15 minit selepas 10 cubaan gagal ──
create or replace function public.rk_check_pin(p_pin text) returns boolean
language plpgsql volatile security definer set search_path = public, extensions as $$
begin
  if (select count(*) from public.rk_admin_fail where at > now() - interval '15 minutes') >= 10 then
    return false;
  end if;
  if exists(select 1 from public.rk_admin where pin_hash = extensions.crypt(coalesce(p_pin,''), pin_hash)) then
    return true;
  end if;
  insert into public.rk_admin_fail default values;
  return false;
end $$;

create or replace function public.admin_login(p_pin text) returns text
language plpgsql volatile security definer set search_path = public as $$
begin
  if (select count(*) from public.rk_admin_fail where at > now() - interval '15 minutes') >= 10 then return 'LOCKED'; end if;
  if public.rk_check_pin(p_pin) then return 'OK'; end if;
  return 'BAD_PIN';
end $$;

create or replace function public.admin_list(p_pin text, p_from date, p_to date)
returns setof public.rk_bookings
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.rk_check_pin(p_pin) then return; end if;
  if p_to - p_from > 370 then p_to := p_from + 370; end if;
  return query select * from public.rk_bookings
    where starts_at >= (p_from::timestamp at time zone 'Asia/Kuala_Lumpur')
      and starts_at <  ((p_to + 1)::timestamp at time zone 'Asia/Kuala_Lumpur')
    order by starts_at;
end $$;

create or replace function public.admin_set_status(p_pin text, p_id uuid, p_status text)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.rk_check_pin(p_pin) then return; end if;
  if p_status not in ('pending','confirmed','done','cancelled') then raise exception 'BAD_STATUS'; end if;
  update public.rk_bookings set status = p_status where id = p_id;
exception when exclusion_violation then raise exception 'SLOT_TAKEN';
end $$;

create or replace function public.admin_block(p_pin text, p_date date, p_time text, p_minutes int, p_note text)
returns void language plpgsql volatile security definer set search_path = public, extensions as $$
declare v_start timestamptz;
begin
  if not public.rk_check_pin(p_pin) then return; end if;
  if p_minutes < 15 or p_minutes > 840 then raise exception 'BAD_MINUTES'; end if;
  if p_note is not null and length(p_note) > 120 then raise exception 'BAD_NOTE'; end if;
  v_start := (p_date + p_time::time) at time zone 'Asia/Kuala_Lumpur';
  insert into public.rk_bookings(code, package, starts_at, ends_at, name, phone, note, payment, total, status)
  values ('BLK-' || upper(substr(md5(gen_random_uuid()::text),1,5)), 'block', v_start, v_start + make_interval(mins => p_minutes),
          'Slot ditutup', '-', p_note, 'admin', 0, 'confirmed');
exception when exclusion_violation then raise exception 'SLOT_TAKEN';
end $$;

create or replace function public.admin_change_pin(p_pin text, p_new text)
returns void language plpgsql volatile security definer set search_path = public, extensions as $$
begin
  if not public.rk_check_pin(p_pin) then return; end if;
  if length(p_new) < 10 then raise exception 'PIN_TOO_SHORT'; end if;
  update public.rk_admin set pin_hash = extensions.crypt(p_new, extensions.gen_salt('bf')) where id = 1;
end $$;

-- ── Kebenaran: browser hanya boleh panggil fungsi awam ──
revoke all on function public.rk_pkg(text), public.rk_check_pin(text), public.rk_client_ip_hash() from public, anon, authenticated;
revoke all on function public.get_busy(date), public.get_slots_busy(date), public.create_booking(text,int,int,text,date,text,text,text,text,text,text),
  public.admin_login(text), public.admin_list(text,date,date), public.admin_set_status(text,uuid,text),
  public.admin_block(text,date,text,int,text), public.admin_change_pin(text,text) from public;
grant execute on function public.get_busy(date), public.get_slots_busy(date), public.create_booking(text,int,int,text,date,text,text,text,text,text,text),
  public.admin_login(text), public.admin_list(text,date,date), public.admin_set_status(text,uuid,text),
  public.admin_block(text,date,text,int,text), public.admin_change_pin(text,text) to anon, authenticated;

-- ── Set kata laluan admin (format: username:kata_laluan) ──
-- Tukar NILAI di bawah, run sekali, kemudian PADAM baris ni dari mana-mana fail.
-- insert into public.rk_admin (id, pin_hash) values (1, extensions.crypt('USERNAME:KATALALUAN', extensions.gen_salt('bf')))
--   on conflict (id) do update set pin_hash = excluded.pin_hash;
