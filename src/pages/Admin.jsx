import { useEffect, useMemo, useState } from 'react';
import { supabase, friendlyError } from '../lib/supabase';
import { nowMYT, addDays, longDate, clock, toMin } from '../lib/time';
import { PACKAGES, BACKDROPS } from '../data';
import { WaIcon } from '../components/Bits';

const STATUS = {
  pending: 'Belum sah',
  confirmed: 'Disahkan',
  done: 'Selesai',
  cancelled: 'Batal',
};

const MYT = 8 * 3600 * 1000;
const local = (iso) => { const d = new Date(Date.parse(iso) + MYT); return { date: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() }; };

const IDLE_MS = 20 * 60 * 1000; // log keluar automatik selepas 20 minit tiada aktiviti

export default function Admin() {
  // kelayakan disimpan dalam memori sahaja (bukan localStorage) — refresh = log masuk semula
  const [pin, setPin] = useState('');
  const [user, setUser] = useState('');
  const [input, setInput] = useState('');
  const [busyLogin, setBusyLogin] = useState(false);
  const [from, setFrom] = useState(nowMYT().date);
  const [span, setSpan] = useState(7);
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState('');
  const [block, setBlock] = useState({ date: nowMYT().date, time: '17:00', minutes: 60, note: '' });

  const load = async (p = pin) => {
    setErr('');
    const { data, error } = await supabase.rpc('admin_list', { p_pin: p, p_from: from, p_to: addDays(from, span - 1) });
    if (error) { setErr(friendlyError(error)); return false; }
    setRows(data);
    return true;
  };

  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots'; m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  // log keluar bila tiada aktiviti
  useEffect(() => {
    if (!pin) return undefined;
    let t = setTimeout(() => setPin(''), IDLE_MS);
    const bump = () => { clearTimeout(t); t = setTimeout(() => setPin(''), IDLE_MS); };
    ['pointerdown', 'keydown', 'scroll'].forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => { clearTimeout(t); ['pointerdown', 'keydown', 'scroll'].forEach((e) => window.removeEventListener(e, bump)); };
  }, [pin]);

  useEffect(() => { if (pin) load(); }, [pin, from, span]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (e) => {
    e.preventDefault();
    setErr(''); setBusyLogin(true);
    const cred = `${user.trim().toLowerCase()}:${input}`;
    const { data, error } = await supabase.rpc('admin_login', { p_pin: cred });
    setBusyLogin(false);
    if (error) { setErr(friendlyError(error)); return; }
    if (data !== 'OK') { setErr(friendlyError({ message: data })); setInput(''); return; }
    setInput('');
    setPin(cred);
  };

  const setStatus = async (id, status) => {
    setBusyId(id);
    const { error } = await supabase.rpc('admin_set_status', { p_pin: pin, p_id: id, p_status: status });
    setBusyId('');
    if (error) setErr(friendlyError(error)); else load();
  };

  const addBlock = async (e) => {
    e.preventDefault();
    const { error } = await supabase.rpc('admin_block', { p_pin: pin, p_date: block.date, p_time: block.time, p_minutes: Number(block.minutes), p_note: block.note || null });
    if (error) setErr(friendlyError(error)); else { setBlock({ ...block, note: '' }); load(); }
  };

  // sandaran: muat turun senarai tempahan sebagai CSV (buka dengan Excel / Google Sheets)
  const exportCsv = () => {
    const cols = ['code', 'status', 'starts_at', 'package', 'extra_pax', 'extra_prints', 'backdrop', 'name', 'phone', 'email', 'payment', 'total', 'note', 'created_at'];
    const esc = (v) => {
      let t = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(t)) t = `'${t}`; // elak formula injection dalam Excel
      return `"${t.replace(/"/g, '""')}"`;
    };
    const lines = [cols.join(',')].concat((rows || []).map((r) => cols.map((c) => esc(r[c])).join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rk-tempahan-${from}-${span}hari.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const grouped = useMemo(() => {
    const g = {};
    (rows || []).forEach((r) => { const l = local(r.starts_at); (g[l.date] ||= []).push({ ...r, _min: l.min }); });
    return Object.entries(g);
  }, [rows]);

  const stats = useMemo(() => {
    const live = (rows || []).filter((r) => r.status !== 'cancelled' && r.package !== 'block');
    return { count: live.length, sum: live.reduce((a, r) => a + r.total, 0), pending: live.filter((r) => r.status === 'pending').length };
  }, [rows]);

  if (!pin) {
    return (
      <main className="admin admin--login">
        <form onSubmit={login} className="admin__login">
          <h1 className="display">Admin</h1>
          <label className="field">
            <span>Username</span>
            <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck="false" autoFocus />
          </label>
          <label className="field">
            <span>Kata laluan</span>
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="current-password" />
          </label>
          {err && <p className="field-err">{err}</p>}
          <button className="btn btn--dark" type="submit" disabled={busyLogin || !user || !input}>{busyLogin ? 'Menyemak…' : 'Masuk'}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin">
      <div className="admin__wrap">
        <header className="admin__head">
          <h1 className="display">Tempahan</h1>
          <div className="admin__filters">
            <label className="field field--inline"><span>Dari</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="field field--inline"><span>Tempoh</span>
              <select value={span} onChange={(e) => setSpan(Number(e.target.value))}>
                <option value={1}>1 hari</option><option value={7}>7 hari</option><option value={30}>30 hari</option><option value={60}>60 hari</option><option value={180}>6 bulan</option><option value={365}>1 tahun</option>
              </select>
            </label>
            <button className="btn btn--line btn--small" type="button" onClick={() => load()}>Muat semula</button>
            <button className="btn btn--line btn--small" type="button" onClick={exportCsv} disabled={!rows || !rows.length}>Muat turun CSV</button>
            <button className="btn btn--line btn--small" type="button" onClick={() => { setPin(''); setRows(null); }}>Keluar</button>
          </div>
          <p className="admin__stats">{stats.count} tempahan, RM{stats.sum}. {stats.pending} belum disahkan.</p>
        </header>
        {err && <p className="book__err">{err}</p>}

        {rows && !grouped.length && <p className="empty">Tiada tempahan dalam tempoh ni.</p>}
        {grouped.map(([d, list]) => (
          <section key={d} className="admin__day">
            <h2>{longDate(d)}</h2>
            {list.map((r) => {
              const pk = PACKAGES.find((p) => p.id === r.package);
              const bd = BACKDROPS.find((b) => b.id === r.backdrop);
              const phone = r.phone.replace(/\D/g, '').replace(/^0/, '60');
              return (
                <article key={r.id} className={`arow arow--${r.status} ${r.package === 'block' ? 'arow--block' : ''}`}>
                  <div className="arow__time">{clock(r._min)}<small>{clock(local(r.ends_at).min)}</small></div>
                  <div className="arow__main">
                    {r.package === 'block' ? <b>Slot ditutup{r.note ? `: ${r.note}` : ''}</b> : (
                      <>
                        <b>{r.name}</b> <span className="arow__code">{r.code}</span>
                        <p>{pk ? pk.name : r.package}{r.extra_pax ? ` + ${r.extra_pax} orang` : ''}{r.extra_prints ? `, +${r.extra_prints} printed photos` : ''}{bd ? `, ${bd.name}` : ''}</p>
                        <p>RM{r.total}, {r.payment === 'qr' ? 'QR' : 'tunai'}{r.note ? `. Nota: ${r.note}` : ''}</p>
                        <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="arow__wa"><WaIcon />{r.phone}</a>
                      </>
                    )}
                  </div>
                  <div className="arow__side">
                    <span className={`chip chip--${r.status}`}>{STATUS[r.status]}</span>
                    <div className="arow__btns">
                      {r.status === 'pending' && <button disabled={busyId === r.id} onClick={() => setStatus(r.id, 'confirmed')}>Sahkan</button>}
                      {r.status === 'confirmed' && r.package !== 'block' && <button disabled={busyId === r.id} onClick={() => setStatus(r.id, 'done')}>Selesai</button>}
                      {r.status !== 'cancelled' && <button disabled={busyId === r.id} onClick={() => { if (window.confirm('Batalkan dan buka semula slot ni?')) setStatus(r.id, 'cancelled'); }}>{r.package === 'block' ? 'Buka slot' : 'Batal'}</button>}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ))}

        <p className="admin__safety">Sebelum tekan <b>Sahkan</b> untuk bayaran QR, semak duit betul-betul dah masuk dalam app bank. Jangan percaya screenshot resit sahaja, sebab resit boleh dipalsukan.</p>

        <form className="admin__block" onSubmit={addBlock}>
          <h2>Tutup slot</h2>
          <p>Untuk cuti, kerja selenggara atau tempahan melalui WhatsApp.</p>
          <div className="admin__blockrow">
            <label className="field"><span>Tarikh</span><input type="date" value={block.date} onChange={(e) => setBlock({ ...block, date: e.target.value })} /></label>
            <label className="field"><span>Mula</span><input type="time" step="900" value={block.time} onChange={(e) => setBlock({ ...block, time: e.target.value })} /></label>
            <label className="field"><span>Berapa minit</span><input type="number" min="15" max="840" step="15" value={block.minutes} onChange={(e) => setBlock({ ...block, minutes: e.target.value })} /></label>
            <label className="field"><span>Nota</span><input value={block.note} onChange={(e) => setBlock({ ...block, note: e.target.value })} placeholder="Contoh: Ali, booking WhatsApp" /></label>
          </div>
          <button className="btn btn--dark" type="submit">Tutup slot ni</button>
          <p className="admin__hint">Masa {clock(toMin(block.time || '00:00'))} hingga {clock(toMin(block.time || '00:00') + Number(block.minutes || 0))}.</p>
        </form>
      </div>
    </main>
  );
}
