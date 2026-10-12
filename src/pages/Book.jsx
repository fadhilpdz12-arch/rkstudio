import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PACKAGES, BACKDROPS, EXTRA_PAX_PRICE, EXTRA_PRINT_PRICE, MAX_DAYS, WAIT_PRINTS, WAIT_PLAIN, dayNames } from '../data';
import { nowMYT, addDays, dowOf, slotsFor, busyToMinutes, clock, longDate, hoursOf, toMin } from '../lib/time';
import { supabase, friendlyError } from '../lib/supabase';
import { backdropImg } from '../components/Backdrops';
import { useLang } from '../i18n';

function Stepper({ value, min = 0, max, onChange, label, lessLabel, moreLabel }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`${lessLabel} ${label}`}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`${moreLabel} ${label}`}>+</button>
    </div>
  );
}

function partOfDay(min, en) {
  if (min < 12 * 60) return en ? 'Morning' : 'Pagi';
  if (min < 14 * 60) return en ? 'Midday' : 'Tengah hari';
  if (min < 19 * 60) return en ? 'Afternoon' : 'Petang';
  return en ? 'Evening' : 'Malam';
}

const MONTHS_LONG = {
  ms: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** Kalendar bulanan: pilih mana-mana tarikh dari hari ini hingga setahun ke depan. */
function Calendar({ value, min, max, today, onPick, lang, tr }) {
  const [view, setView] = useState(value.slice(0, 7));
  useEffect(() => { setView(value.slice(0, 7)); }, [value]);
  const [y, m] = view.split('-').map(Number);
  const first = `${view}-01`;
  const lead = new Date(`${first}T00:00:00Z`).getUTCDay();
  const len = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: len }, (_, i) => addDays(first, i))];
  const shift = (n) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); setView(d.toISOString().slice(0, 7)); };
  const canPrev = view > min.slice(0, 7);
  const canNext = view < max.slice(0, 7);
  const wd = dayNames(lang);
  return (
    <div className="cal">
      <div className="cal__head">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label={tr('Bulan sebelum', 'Previous month')}>‹</button>
        <b aria-live="polite">{MONTHS_LONG[lang === 'en' ? 'en' : 'ms'][m - 1]} {y}</b>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label={tr('Bulan seterusnya', 'Next month')}>›</button>
      </div>
      <div className="cal__grid" role="grid" aria-label={tr('Tarikh', 'Date')}>
        {wd.map((d, i) => <span key={d} className={`cal__wd ${i >= 5 ? 'is-wk' : ''}`} aria-hidden="true">{d.slice(0, lang === 'en' ? 2 : 3)}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`x${i}`} />;
          const off = d < min || d > max;
          const wk = dowOf(d) >= 5;
          return (
            <button key={d} type="button" disabled={off} aria-pressed={d === value} aria-label={longDate(d, lang)}
              className={`cal__day ${d === value ? 'is-on' : ''} ${wk ? 'is-wk' : ''} ${d === today ? 'is-today' : ''}`}
              onClick={() => onPick(d)}>
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
      <p className="cal__key"><i className="is-wk" />{tr('Jumaat & Sabtu: buka dari 8 pagi', 'Fri & Sat: open from 8 am')}</p>
    </div>
  );
}

function firstBookableDate() {
  const n = nowMYT();
  const { close } = hoursOf(n.date);
  return n.minutes + 30 >= close ? addDays(n.date, 1) : n.date;
}

export default function Book() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { lang, tr } = useLang();
  const en = lang === 'en';
  const initPkg = PACKAGES.find((p) => p.id === params.get('pakej'));

  const STEPS = [tr('Pakej', 'Package'), 'Backdrop', tr('Tarikh & masa', 'Date & time'), tr('Butiran', 'Details'), tr('Bayaran', 'Payment')];

  const [step, setStep] = useState(initPkg ? 1 : 0);
  const [pkgId, setPkgId] = useState(initPkg ? initPkg.id : 'twogether');
  const pkg = PACKAGES.find((p) => p.id === pkgId);
  const [extraPax, setExtraPax] = useState(Math.min(Number(params.get('tambah')) || 0, initPkg ? initPkg.maxExtra : 0));
  const [prints, setPrints] = useState(0);
  const [bd, setBd] = useState('');
  const startDate = useMemo(firstBookableDate, []);
  const [date, setDate] = useState(startDate);
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState({ loading: false, list: [], error: null });
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' });
  const [pay, setPay] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const [touched, setTouched] = useState(false);
  const [sumOpen, setSumOpen] = useState(false);
  const top = useRef(null);

  useEffect(() => { setExtraPax((x) => Math.min(x, pkg.maxExtra)); setTime(''); }, [pkgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = pkg.price + extraPax * EXTRA_PAX_PRICE + prints * EXTRA_PRINT_PRICE;
  const lastDate = useMemo(() => addDays(nowMYT().date, MAX_DAYS), []);

  const loadBusy = async (d) => {
    setBusy({ loading: true, list: [], error: null });
    const { data, error } = await supabase.rpc('get_slots_busy', { p_date: d });
    if (error) setBusy({ loading: false, list: [], error });
    else setBusy({ loading: false, list: busyToMinutes(data || [], d), error: null });
  };
  useEffect(() => { if (step === 2) loadBusy(date); }, [date, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const slots = useMemo(() => slotsFor(date, pkg.minutes, busy.list), [date, pkg.minutes, busy.list]);
  const groups = useMemo(() => {
    const g = {};
    slots.forEach((s) => { (g[partOfDay(s.min, en)] ||= []).push(s); });
    return Object.entries(g);
  }, [slots, en]);
  const anyFree = slots.some((s) => s.available);
  // Ada customer betul-betul sebelum slot ni? Kalau ya, mungkin perlu tunggu sekejap.
  const waitMin = useMemo(() => {
    if (!time) return 0;
    const t = toMin(time);
    const prev = busy.list.filter((b) => b.end <= t && t - b.end < 15).sort((a, b) => b.end - a.end)[0];
    return prev ? (prev.prints ? WAIT_PRINTS : WAIT_PLAIN) : 0;
  }, [time, busy.list]);

  const phoneOk = form.phone.replace(/\D/g, '').length >= 9;
  const nameOk = form.name.trim().length >= 2;
  const canNext = [true, !!bd, !!time, nameOk && phoneOk, !!pay][step];

  const go = (n) => {
    setErr(null); setTouched(false);
    setStep(n);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const next = () => {
    if (!canNext) {
      setTouched(true);
      setTimeout(() => document.querySelector('.book__panel .field-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      return;
    }
    if (step < 4) go(step + 1); else submit();
  };

  async function submit() {
    setSending(true); setErr(null);
    const { data, error } = await supabase.rpc('create_booking', {
      p_package: pkg.id, p_extra_pax: extraPax, p_extra_prints: prints, p_backdrop: bd,
      p_date: date, p_time: time, p_name: form.name, p_phone: form.phone,
      p_email: form.email || null, p_note: form.note || null, p_payment: pay,
    });
    setSending(false);
    if (error) {
      if (/SLOT_TAKEN|TOO_SOON/.test(error.message)) { setTime(''); go(2); }
      setErr(error);
      return;
    }
    const booking = {
      code: data.code, total: data.total, pkg: pkg.name, pkgId: pkg.id, extraPax, prints,
      backdrop: BACKDROPS.find((b) => b.id === bd).name, date, time, minutes: pkg.minutes,
      name: form.name.trim(), phone: form.phone, pay, starts_at: data.starts_at, waitMin,
    };
    try { sessionStorage.setItem(`rk-booking-${data.code}`, JSON.stringify(booking)); } catch { /* tak apa */ }
    nav(`/siap/${data.code}`, { state: booking });
  }

  const waitNote = waitMin > 0 && (
    <p className="waitnote" role="status">
                    {en
                      ? <><b>Heads up:</b> there&apos;s a session just before yours. You may need to wait about <b>{waitMin} minutes</b> while we {waitMin === WAIT_PRINTS ? 'print their photos, tidy up and change the backdrop' : 'tidy up and change the backdrop'}. Your full session time stays the same.</>
                      : <><b>Makluman:</b> ada customer sebelum masa ni. Kamu mungkin perlu tunggu lebih kurang <b>{waitMin} minit</b> untuk kami kemas dan tukar backdrop{waitMin === WAIT_PRINTS ? ' serta siapkan printed photos mereka' : ''}. Masa sesi kamu tetap penuh.</>}
                  </p>
  );
  const bdObj = BACKDROPS.find((b) => b.id === bd);
  const unit = (n) => (en ? (n > 1 ? 'people' : 'person') : 'orang');
  const today = nowMYT().date;

  return (
    <main className="book">
      <div className="book__wrap" ref={top}>
        <header className="book__head">
          <Link to="/" className="book__back">{tr('Kembali', 'Back')}</Link>
          <h1 className="display">{tr('Tempah slot', 'Book a slot')}</h1>
          <ol className="book__steps" aria-label={tr('Langkah tempahan', 'Booking steps')}>
            {STEPS.map((s, i) => (
              <li key={i} className={i === step ? 'is-now' : i < step ? 'is-done' : ''}>
                <button type="button" disabled={i > step} onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}>
                  <span>{i + 1}</span>{s}
                </button>
              </li>
            ))}
          </ol>
        </header>

        <div className="book__body">
          <section className="book__panel" key={step} aria-live="polite">
            {step === 0 && (
              <>
                <h2>{tr('Pilih pakej', 'Choose a package')}</h2>
                <div className="pick-pkgs">
                  {PACKAGES.map((p) => (
                    <label key={p.id} className={`pick-pkg ${pkgId === p.id ? 'is-on' : ''}`}>
                      <input type="radio" name="pkg" value={p.id} checked={pkgId === p.id} onChange={() => setPkgId(p.id)} />
                      <span className="pick-pkg__name">{p.name}</span>
                      <span className="pick-pkg__meta">
                        {p.pax} {unit(p.pax)}, {p.minutes} {tr('minit', 'min')}{p.prints ? `, ${p.prints} printed photo${p.prints > 1 ? 's' : ''}` : ''}
                      </span>
                      <span className="pick-pkg__price">RM{p.price}</span>
                    </label>
                  ))}
                </div>
                <div className="addons">
                  <div className="addon">
                    <div>
                      <b>{tr('Orang tambahan', 'Extra people')}</b>
                      <p>{en ? `RM${EXTRA_PAX_PRICE} each, up to ${pkg.maxExtra}` : `RM${EXTRA_PAX_PRICE} seorang, maksimum ${pkg.maxExtra}`}</p>
                    </div>
                    <Stepper value={extraPax} max={pkg.maxExtra} onChange={setExtraPax} label={tr('orang tambahan', 'extra people')} lessLabel={tr('Kurang', 'Fewer')} moreLabel={tr('Tambah', 'More')} />
                  </div>
                  <div className="addon">
                    <div>
                      <b>{tr('Tambah printed photos (4R)', 'Extra printed photos (4R)')}</b>
                      <p>
                        {en
                          ? `RM${EXTRA_PRINT_PRICE} each${pkg.prints ? `, on top of the ${pkg.prints} free with your package` : ''}`
                          : `RM${EXTRA_PRINT_PRICE} sekeping${pkg.prints ? `, selain ${pkg.prints} percuma dalam pakej` : ''}`}
                      </p>
                    </div>
                    <Stepper value={prints} max={20} onChange={setPrints} label="printed photo" lessLabel={tr('Kurang', 'Fewer')} moreLabel={tr('Tambah', 'More')} />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2>{tr('Pilih backdrop', 'Choose a backdrop')}</h2>
                <div className="pick-bds" role="radiogroup" aria-label="Backdrop">
                  {BACKDROPS.map((b) => (
                    <button key={b.id} type="button" role="radio" aria-checked={bd === b.id}
                      className={`pick-bd ${bd === b.id ? 'is-on' : ''}`} style={{ '--c': b.hex }} onClick={() => setBd(b.id)}>
                      <img src={backdropImg(b.id)} alt="" />
                      <span><b>{b.name}</b>{en ? b.moodEn : b.mood}</span>
                    </button>
                  ))}
                </div>
                {touched && !bd && <p className="field-err">{tr('Pilih satu backdrop dulu.', 'Pick a backdrop first.')}</p>}
              </>
            )}

            {step === 2 && (
              <>
                <h2>{tr('Pilih tarikh & masa', 'Choose a date & time')}</h2>
                <Calendar value={date} min={startDate} max={lastDate} today={today} lang={lang} tr={tr}
                  onPick={(d) => { setDate(d); setTime(''); }} />
                <p className="days__hint">
                  {en
                    ? `${longDate(date, lang)}. Open ${clock(hoursOf(date).open, lang)} to ${clock(hoursOf(date).close, lang)}. ${pkg.name} session: ${pkg.minutes} min. Times are Malaysia time.`
                    : `${longDate(date, lang)}. Buka ${clock(hoursOf(date).open, lang)} hingga ${clock(hoursOf(date).close, lang)}. Sesi ${pkg.name} ${pkg.minutes} minit.`}
                </p>

                {busy.loading && <div className="slots slots--loading" aria-label={tr('Memuatkan slot', 'Loading slots')}>{Array.from({ length: 8 }).map((_, i) => <i key={i} />)}</div>}
                {busy.error && <p className="field-err">{friendlyError(busy.error, lang)} <button type="button" className="linkish" onClick={() => loadBusy(date)}>{tr('Cuba lagi', 'Try again')}</button></p>}
                {!busy.loading && !busy.error && (
                  anyFree ? groups.map(([g, list]) => (
                    <div key={g} className="slotgroup">
                      <h3>{g}</h3>
                      <div className="slots">
                        {list.map((s) => (
                          <button key={s.time} type="button" disabled={!s.available}
                            className={`slot ${time === s.time ? 'is-on' : ''}`} onClick={() => setTime(s.time)}
                            aria-pressed={time === s.time}>
                            {clock(s.min, lang)}
                          </button>
                        ))}
                      </div>
                      {list.some((s) => s.time === time) && waitNote}
                    </div>
                  )) : <p className="empty">{tr('Slot tarikh ni dah penuh. Cuba pilih tarikh lain di atas.', 'This day is fully booked. Try another date above.')}</p>
                )}
                {touched && !time && <p className="field-err">{tr('Pilih satu masa yang masih kosong.', 'Pick an open time.')}</p>}
              </>
            )}

            {step === 3 && (
              <>
                <h2>{tr('Butiran kamu', 'Your details')}</h2>
                <div className="fields">
                  <label className="field">
                    <span>{tr('Nama', 'Name')}</span>
                    <input autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tr('Nama penuh', 'Full name')} maxLength={80} />
                    {touched && !nameOk && <em className="field-err">{tr('Isi nama dulu.', 'Please enter your name.')}</em>}
                  </label>
                  <label className="field">
                    <span>{tr('No. telefon (WhatsApp)', 'Phone (WhatsApp)')}</span>
                    <input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={tr('012-345 6789', '+44 7700 900123')} maxLength={20} />
                    {touched && !phoneOk && <em className="field-err">{tr('Nombor tak lengkap. Contoh: 012-345 6789', 'Number looks incomplete. Include your country code.')}</em>}
                  </label>
                  <label className="field">
                    <span>{tr('E-mel', 'Email')} <i>({tr('tak wajib', 'optional')})</i></span>
                    <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={tr('nama@email.com', 'name@email.com')} maxLength={120} />
                  </label>
                  <label className="field">
                    <span>{tr('Catatan', 'Notes')} <i>({tr('tak wajib', 'optional')})</i></span>
                    <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={tr('Contoh: bawa baby 1 tahun, nak tema raya', 'E.g. bringing a 1-year-old, celebrating a birthday')} maxLength={300} />
                  </label>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2>{tr('Cara bayar', 'How to pay')}</h2>
                <div className="pays" role="radiogroup" aria-label={tr('Cara bayar', 'How to pay')}>
                  <button type="button" role="radio" aria-checked={pay === 'qr'} className={`pay ${pay === 'qr' ? 'is-on' : ''}`} onClick={() => setPay('qr')}>
                    <b>{tr('Scan QR DuitNow', 'Scan DuitNow QR')}</b>
                    <span>{tr('QR dan jumlah dipaparkan lepas ni. Lepas bayar, hantar resit di WhatsApp.', 'Works with Malaysian banking and e-wallet apps. The QR shows on the next page; send us the receipt on WhatsApp.')}</span>
                  </button>
                  <button type="button" role="radio" aria-checked={pay === 'cash'} className={`pay ${pay === 'cash' ? 'is-on' : ''}`} onClick={() => setPay('cash')}>
                    <b>{tr('Tunai di studio', 'Cash at the studio')}</b>
                    <span>{tr('Bayar bila sampai, sebelum sesi bermula.', 'Pay in Ringgit when you arrive, before your session starts.')}</span>
                  </button>
                </div>
                {touched && !pay && <p className="field-err">{tr('Pilih cara bayar.', 'Choose how you will pay.')}</p>}
                <p className="book__fine">
                  {tr(
                    'Dengan menekan Sahkan tempahan, kamu faham gambar adalah medium shot (separuh badan) dan sesi tamat ikut masa slot.',
                    'By tapping Confirm booking, you understand photos are medium shots (waist up) and the session ends at the end of your slot.',
                  )}
                </p>
              </>
            )}

            {err && <p className="book__err" role="alert">{friendlyError(err, lang)}</p>}
          </section>

          <aside className={`summary ${sumOpen ? 'is-open' : ''}`} aria-label={tr('Ringkasan tempahan', 'Booking summary')}>
            <h2>{tr('Ringkasan', 'Summary')}</h2>
            <button type="button" className="summary__toggle" aria-expanded={sumOpen} onClick={() => setSumOpen((o) => !o)}>
              {sumOpen ? tr('Tutup ringkasan', 'Hide summary') : tr('Lihat ringkasan', 'View summary')}
            </button>
            <dl>
              <div><dt>{tr('Pakej', 'Package')}</dt><dd>{pkg.name} <span>RM{pkg.price}</span></dd></div>
              {extraPax > 0 && <div><dt>{tr('Orang tambahan', 'Extra people')}</dt><dd>{extraPax} <span>RM{extraPax * EXTRA_PAX_PRICE}</span></dd></div>}
              {pkg.prints > 0 && <div><dt>Printed photos</dt><dd>{pkg.prints} <span className="free">{tr('PERCUMA', 'FREE')}</span></dd></div>}
              {prints > 0 && <div><dt>{tr('Tambahan printed', 'Extra prints')}</dt><dd>{prints} <span>RM{prints * EXTRA_PRINT_PRICE}</span></dd></div>}
              <div><dt>Backdrop</dt><dd>{bdObj ? <><i className="dot" style={{ '--c': bdObj.hex }} />{bdObj.name}</> : <em>{tr('Belum pilih', 'Not chosen')}</em>}</dd></div>
              <div><dt>{tr('Bila', 'When')}</dt><dd>{time ? `${longDate(date, lang)}, ${clock(toMin(time), lang)}` : <em>{tr('Belum pilih', 'Not chosen')}</em>}</dd></div>
            </dl>
            <p className="summary__total"><span>{tr('Jumlah', 'Total')}</span><b>RM{total}</b></p>
            <div className="summary__actions">
              {step > 0 && <button type="button" className="btn btn--line" onClick={() => go(step - 1)}>{tr('Balik', 'Back')}</button>}
              <button type="button" className="btn btn--dark" onClick={next} disabled={sending}>
                {sending ? tr('Menempah…', 'Booking…') : step < 4 ? tr('Seterusnya', 'Next') : tr('Sahkan tempahan', 'Confirm booking')}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
