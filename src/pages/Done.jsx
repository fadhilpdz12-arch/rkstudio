import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { longDate, clock, toMin } from '../lib/time';
import { BACKDROPS } from '../data';
import { waLink, WaIcon } from '../components/Bits';

const qrFiles = import.meta.glob('../assets/pay/qr.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
const QR = Object.values(qrFiles)[0];

function load(code, state) {
  if (state && state.code === code) return state;
  try { return JSON.parse(sessionStorage.getItem(`rk-booking-${code}`)); } catch { return null; }
}

function ics(b) {
  const start = new Date(b.starts_at);
  const end = new Date(start.getTime() + b.minutes * 60000);
  const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RK Studio//Tempahan//MS', 'BEGIN:VEVENT',
    `UID:${b.code}@rkstudio`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:RK Studio - ${b.pkg}`, `DESCRIPTION:Kod tempahan ${b.code}. Backdrop ${b.backdrop}.`,
    'LOCATION:RK Studio\\, Lorong Tiara\\, Limbongan\\, Besut', 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

/** Cebisan kertas backdrop jatuh — sekali sahaja. */
function PaperBits() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const c = ref.current; const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.width = window.innerWidth * dpr; const H = c.height = window.innerHeight * dpr;
    const cols = BACKDROPS.map((b) => b.hex).concat('#EFE8DE');
    const bits = Array.from({ length: 70 }, () => ({
      x: Math.random() * W, y: -Math.random() * H * 0.6, w: (8 + Math.random() * 14) * dpr, h: (5 + Math.random() * 8) * dpr,
      vy: (1.2 + Math.random() * 2.2) * dpr, vx: (Math.random() - 0.5) * dpr, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.12,
      c: cols[Math.floor(Math.random() * cols.length)],
    }));
    let raf; const t0 = performance.now();
    const tick = (t) => {
      ctx.clearRect(0, 0, W, H);
      const fade = Math.max(0, 1 - (t - t0 - 2800) / 1200);
      bits.forEach((b) => {
        b.y += b.vy; b.x += b.vx + Math.sin((t / 600) + b.a); b.a += b.va;
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(b.x, b.y); ctx.rotate(b.a);
        ctx.scale(1, Math.cos(b.a * 2)); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      });
      if (fade > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="bits" aria-hidden="true" />;
}

export default function Done() {
  const { code } = useParams();
  const { state } = useLocation();
  const b = useMemo(() => load(code, state), [code, state]);

  if (!b) {
    return (
      <main className="done">
        <div className="done__card">
          <h1 className="display">Kod {code}</h1>
          <p>Butiran tempahan tak dapat dipaparkan di peranti ni. Simpan kod di atas, atau WhatsApp kami untuk semak.</p>
          <a className="btn btn--dark" href={waLink(`Salam RK Studio, saya nak semak tempahan ${code}.`)} target="_blank" rel="noreferrer"><WaIcon />Semak di WhatsApp</a>
        </div>
      </main>
    );
  }

  const when = `${longDate(b.date)}, ${clock(toMin(b.time))}`;
  const msg = [
    `Salam RK Studio, saya dah tempah slot.`,
    ``,
    `Kod: ${b.code}`,
    `Nama: ${b.name}`,
    `Pakej: ${b.pkg}${b.extraPax ? ` + ${b.extraPax} orang` : ''}${b.prints ? `, +${b.prints} printed photos` : ''}`,
    `Backdrop: ${b.backdrop}`,
    `Masa: ${when}`,
    `Jumlah: RM${b.total} (${b.pay === 'qr' ? 'QR DuitNow' : 'tunai di studio'})`,
    b.pay === 'qr' ? `\nIni resit bayaran saya:` : '',
  ].join('\n');
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics(b))}`;

  return (
    <main className="done">
      <div className="done__flash" aria-hidden="true" />
      <PaperBits />
      <div className="done__card">
        <p className="done__kicker">Slot dah ditempah</p>
        <h1 className="done__code">{b.code}</h1>
        <p className="done__keep">Simpan kod ni. Tunjuk kepada kami bila sampai.</p>

        <dl className="done__list">
          <div><dt>Bila</dt><dd>{when}</dd></div>
          <div><dt>Pakej</dt><dd>{b.pkg}{b.extraPax ? ` + ${b.extraPax} orang` : ''}{b.prints ? `, +${b.prints} printed photos` : ''}</dd></div>
          <div><dt>Backdrop</dt><dd>{b.backdrop}</dd></div>
          <div><dt>Jumlah</dt><dd><b>RM{b.total}</b></dd></div>
        </dl>

        {b.pay === 'qr' ? (
          <div className="done__pay">
            <h2>Bayar RM{b.total} guna QR</h2>
            {QR
              ? <img src={QR} alt="QR DuitNow RK Studio" className="done__qr" />
              : <p className="done__noqr">QR DuitNow akan dihantar di WhatsApp. Tekan butang di bawah.</p>}
            <p>Masukkan <b>{b.code}</b> sebagai rujukan. Lepas bayar, hantar resit kepada kami di WhatsApp.</p>
            <a className="btn btn--dark" href={waLink(msg)} target="_blank" rel="noreferrer"><WaIcon />Hantar resit di WhatsApp</a>
          </div>
        ) : (
          <div className="done__pay">
            <h2>Bayar tunai di studio</h2>
            <p>Sediakan RM{b.total} dan bayar sebelum sesi bermula. Tekan butang di bawah supaya kami dapat butiran kamu.</p>
            <a className="btn btn--dark" href={waLink(msg)} target="_blank" rel="noreferrer"><WaIcon />Hantar butiran di WhatsApp</a>
          </div>
        )}

        <div className="done__more">
          <a className="btn btn--line" href={icsHref} download={`RK-Studio-${b.code}.ics`}>Simpan dalam kalendar</a>
          <Link className="btn btn--line" to="/">Ke laman utama</Link>
        </div>
      </div>
    </main>
  );
}
