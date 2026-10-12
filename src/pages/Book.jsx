import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PACKAGES, BACKDROPS, EXTRA_PAX_PRICE, EXTRA_PRINT_PRICE, MAX_DAYS, DAY_NAMES, MONTH_NAMES } from '../data';
import { nowMYT, addDays, dowOf, slotsFor, busyToMinutes, clock, longDate, hoursOf } from '../lib/time';
import { supabase, friendlyError } from '../lib/supabase';
import { backdropImg } from '../components/Backdrops';

const STEPS = ['Pakej', 'Backdrop', 'Tarikh & masa', 'Butiran', 'Bayaran'];

function Stepper({ value, min = 0, max, onChange, label }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Kurang ${label}`}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Tambah ${label}`}>+</button>
    </div>
  );
}

function partOfDay(min) {
  if (min < 12 * 60) return 'Pagi';
  if (min < 14 * 60) return 'Tengah hari';
  if (min < 19 * 60) return 'Petang';
  return 'Malam';
}

function firstBookableDate() {
  const n = nowMYT();
  const { close } = hoursOf(n.date);
  return n.minutes + 30 >= close ? addDays(n.date, 1) : n.date;
}

export default function Book() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initPkg = PACKAGES.find((p) => p.id === params.get('pakej'));

  const [step, setStep] = useState(initPkg ? 1 : 0);
  const [pkgId, setPkgId] = useState(initPkg ? initPkg.id : 'twogether');
  const pkg = PACKAGES.find((p) => p.id === pkgId);
  const [extraPax, setExtraPax] = useState(Math.min(Number(params.get('tambah')) || 0, initPkg ? initPkg.maxExtra : 0));
  const [prints, setPrints] = useState(0);
  const [bd, setBd] = useState('');
  const startDate = useMemo(firstBookableDate, []);
  const [date, setDate] = useState(startDate);
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState({ loading: false, list: [], error: '' });
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' });
  const [pay, setPay] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [touched, setTouched] = useState(false);
  const [sumOpen, setSumOpen] = useState(false);
  const top = useRef(null);

  useEffect(() => { setExtraPax((x) => Math.min(x, pkg.maxExtra)); setTime(''); }, [pkgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = pkg.price + extraPax * EXTRA_PAX_PRICE + prints * EXTRA_PRINT_PRICE;
  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => addDays(startDate, i)).filter((d, i) => i < MAX_DAYS), [startDate]);

  const loadBusy = async (d) => {
    setBusy({ loading: true, list: [], error: '' });
    const { data, error } = await supabase.rpc('get_busy', { p_date: d });
    if (error) setBusy({ loading: false, list: [], error: friendlyError(error) });
    else setBusy({ loading: false, list: busyToMinutes(data || [], d), error: '' });
  };
  useEffect(() => { if (step === 2) loadBusy(date); }, [date, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const slots = useMemo(() => slotsFor(date, pkg.minutes, busy.list), [date, pkg.minutes, busy.list]);
  const groups = useMemo(() => {
    const g = {};
    slots.forEach((s) => { (g[partOfDay(s.min)] ||= []).push(s); });
    return Object.entries(g);
  }, [slots]);
  const anyFree = slots.some((s) => s.available);

  const phoneOk = form.phone.replace(/\D/g, '').length >= 9;
  const nameOk = form.name.trim().length >= 2;
  const canNext = [true, !!bd, !!time, nameOk && phoneOk, !!pay][step];

  const go = (n) => {
    setErr(''); setTouched(false);
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
    setSending(true); setErr('');
    const { data, error } = await supabase.rpc('create_booking', {
      p_package: pkg.id, p_extra_pax: extraPax, p_extra_prints: prints, p_backdrop: bd,
      p_date: date, p_time: time, p_name: form.name, p_phone: form.phone,
      p_email: form.email || null, p_note: form.note || null, p_payment: pay,
    });
    setSending(false);
    if (error) {
      const msg = friendlyError(error);
      setErr(msg);
      if (/SLOT_TAKEN|TOO_SOON/.test(error.message)) { setTime(''); go(2); setErr(msg); }
      return;
    }
    const booking = {
      code: data.code, total: data.total, pkg: pkg.name, pkgId: pkg.id, extraPax, prints,
      backdrop: BACKDROPS.find((b) => b.id === bd).name, date, time, minutes: pkg.minutes,
      name: form.name.trim(), phone: form.phone, pay, starts_at: data.starts_at,
    };
    try { sessionStorage.setItem(`rk-booking-${data.code}`, JSON.stringify(booking)); } catch { /* tak apa */ }
    nav(`/siap/${data.code}`, { state: booking });
  }

  const bdObj = BACKDROPS.find((b) => b.id === bd);

  return (
    <main className="book">
      <div className="book__wrap" ref={top}>
        <header className="book__head">
          <Link to="/" className="book__back">Kembali</Link>
          <h1 className="display">Tempah slot</h1>
          <ol className="book__steps" aria-label="Langkah tempahan">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? 'is-now' : i < step ? 'is-done' : ''}>
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
                <h2>Pilih pakej</h2>
                <div className="pick-pkgs">
                  {PACKAGES.map((p) => (
                    <label key={p.id} className={`pick-pkg ${pkgId === p.id ? 'is-on' : ''}`}>
                      <input type="radio" name="pkg" value={p.id} checked={pkgId === p.id} onChange={() => setPkgId(p.id)} />
                      <span className="pick-pkg__name">{p.name}</span>
                      <span className="pick-pkg__meta">{p.pax} orang, {p.minutes} minit{p.prints ? `, ${p.prints} printed photo${p.prints > 1 ? 's' : ''}` : ''}</span>
                      <span className="pick-pkg__price">RM{p.price}</span>
                    </label>
                  ))}
                </div>
                <div className="addons">
                  <div className="addon">
                    <div><b>Orang tambahan</b><p>RM{EXTRA_PAX_PRICE} seorang, maksimum {pkg.maxExtra}</p></div>
                    <Stepper value={extraPax} max={pkg.maxExtra} onChange={setExtraPax} label="orang tambahan" />
                  </div>
                  <div className="addon">
                    <div><b>Tambah printed photos (4R)</b><p>RM{EXTRA_PRINT_PRICE} sekeping{pkg.prints ? `, selain ${pkg.prints} yang termasuk` : ''}</p></div>
                    <Stepper value={prints} max={20} onChange={setPrints} label="printed photo" />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2>Pilih backdrop</h2>
                <div className="pick-bds" role="radiogroup" aria-label="Backdrop">
                  {BACKDROPS.map((b) => (
                    <button key={b.id} type="button" role="radio" aria-checked={bd === b.id}
                      className={`pick-bd ${bd === b.id ? 'is-on' : ''}`} style={{ '--c': b.hex }} onClick={() => setBd(b.id)}>
                      <img src={backdropImg(b.id)} alt="" />
                      <span><b>{b.name}</b>{b.mood}</span>
                    </button>
                  ))}
                </div>
                {touched && !bd && <p className="field-err">Pilih satu backdrop dulu.</p>}
              </>
            )}

            {step === 2 && (
              <>
                <h2>Pilih tarikh & masa</h2>
                <div className="days" role="listbox" aria-label="Tarikh">
                  {days.map((d) => {
                    const dt = new Date(`${d}T00:00:00Z`);
                    const wk = dowOf(d) === 5 || dowOf(d) === 6;
                    return (
                      <button key={d} type="button" role="option" aria-selected={d === date}
                        className={`day ${d === date ? 'is-on' : ''} ${wk ? 'is-wk' : ''}`}
                        onClick={() => { setDate(d); setTime(''); }}>
                        <small>{d === startDate && d === nowMYT().date ? 'Hari ini' : DAY_NAMES[dt.getUTCDay()].slice(0, 3)}</small>
                        <b>{dt.getUTCDate()}</b>
                        <small>{MONTH_NAMES[dt.getUTCMonth()]}</small>
                      </button>
                    );
                  })}
                </div>
                <p className="days__hint">{longDate(date)}. Buka {clock(hoursOf(date).open)} hingga {clock(hoursOf(date).close)}. Sesi {pkg.name} {pkg.minutes} minit.</p>

                {busy.loading && <div className="slots slots--loading" aria-label="Memuatkan slot">{Array.from({ length: 8 }).map((_, i) => <i key={i} />)}</div>}
                {busy.error && <p className="field-err">{busy.error} <button type="button" className="linkish" onClick={() => loadBusy(date)}>Cuba lagi</button></p>}
                {!busy.loading && !busy.error && (
                  anyFree ? groups.map(([g, list]) => (
                    <div key={g} className="slotgroup">
                      <h3>{g}</h3>
                      <div className="slots">
                        {list.map((s) => (
                          <button key={s.time} type="button" disabled={!s.available}
                            className={`slot ${time === s.time ? 'is-on' : ''}`} onClick={() => setTime(s.time)}
                            aria-pressed={time === s.time}>
                            {clock(s.min)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )) : <p className="empty">Slot hari ni dah penuh. Cuba pilih tarikh lain di atas.</p>
                )}
                {touched && !time && <p className="field-err">Pilih satu masa yang masih kosong.</p>}
              </>
            )}

            {step === 3 && (
              <>
                <h2>Butiran kamu</h2>
                <div className="fields">
                  <label className="field">
                    <span>Nama</span>
                    <input autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama penuh" maxLength={80} />
                    {touched && !nameOk && <em className="field-err">Isi nama dulu.</em>}
                  </label>
                  <label className="field">
                    <span>No. telefon (WhatsApp)</span>
                    <input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="012-345 6789" maxLength={20} />
                    {touched && !phoneOk && <em className="field-err">Nombor tak lengkap. Contoh: 012-345 6789</em>}
                  </label>
                  <label className="field">
                    <span>E-mel <i>(tak wajib)</i></span>
                    <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" maxLength={120} />
                  </label>
                  <label className="field">
                    <span>Catatan <i>(tak wajib)</i></span>
                    <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Contoh: bawa baby 1 tahun, nak tema raya" maxLength={300} />
                  </label>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2>Cara bayar</h2>
                <div className="pays" role="radiogroup" aria-label="Cara bayar">
                  <button type="button" role="radio" aria-checked={pay === 'qr'} className={`pay ${pay === 'qr' ? 'is-on' : ''}`} onClick={() => setPay('qr')}>
                    <b>Scan QR DuitNow</b>
                    <span>QR dan jumlah dipaparkan lepas ni. Lepas bayar, hantar resit di WhatsApp.</span>
                  </button>
                  <button type="button" role="radio" aria-checked={pay === 'cash'} className={`pay ${pay === 'cash' ? 'is-on' : ''}`} onClick={() => setPay('cash')}>
                    <b>Tunai di studio</b>
                    <span>Bayar bila sampai, sebelum sesi bermula.</span>
                  </button>
                </div>
                {touched && !pay && <p className="field-err">Pilih cara bayar.</p>}
                <p className="book__fine">Dengan menekan Sahkan tempahan, kamu faham gambar adalah medium shot (separuh badan) dan sesi tamat ikut masa slot.</p>
              </>
            )}

            {err && <p className="book__err" role="alert">{err}</p>}
          </section>

          <aside className={`summary ${sumOpen ? 'is-open' : ''}`} aria-label="Ringkasan tempahan">
            <h2>Ringkasan</h2>
            <button type="button" className="summary__toggle" aria-expanded={sumOpen} onClick={() => setSumOpen((o) => !o)}>
              {sumOpen ? 'Tutup ringkasan' : 'Lihat ringkasan'}
            </button>
            <dl>
              <div><dt>Pakej</dt><dd>{pkg.name} <span>RM{pkg.price}</span></dd></div>
              {extraPax > 0 && <div><dt>Orang tambahan</dt><dd>{extraPax} <span>RM{extraPax * EXTRA_PAX_PRICE}</span></dd></div>}
              {prints > 0 && <div><dt>Printed photos</dt><dd>{prints} <span>RM{prints * EXTRA_PRINT_PRICE}</span></dd></div>}
              <div><dt>Backdrop</dt><dd>{bdObj ? <><i className="dot" style={{ '--c': bdObj.hex }} />{bdObj.name}</> : <em>Belum pilih</em>}</dd></div>
              <div><dt>Bila</dt><dd>{time ? `${longDate(date)}, ${clock(Number(time.slice(0, 2)) * 60 + Number(time.slice(3)))}` : <em>Belum pilih</em>}</dd></div>
            </dl>
            <p className="summary__total"><span>Jumlah</span><b>RM{total}</b></p>
            <div className="summary__actions">
              {step > 0 && <button type="button" className="btn btn--line" onClick={() => go(step - 1)}>Balik</button>}
              <button type="button" className="btn btn--dark" onClick={next} disabled={sending}>
                {sending ? 'Menempah…' : step < 4 ? 'Seterusnya' : 'Sahkan tempahan'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
