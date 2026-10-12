import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { longDate, clock, toMin } from '../lib/time';
import { BACKDROPS, PAY_NAME } from '../data';
import { waLink, WaIcon } from '../components/Bits';
import { useLang } from '../i18n';

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
  const { lang, tr } = useLang();
  const en = lang === 'en';
  const b = useMemo(() => load(code, state), [code, state]);

  if (!b) {
    return (
      <main className="done">
        <div className="done__card">
          <h1 className="display">{tr('Kod', 'Code')} {code}</h1>
          <p>{tr('Butiran tempahan tak dapat dipaparkan di peranti ni. Simpan kod di atas, atau WhatsApp kami untuk semak.', "We can't show the booking details on this device. Keep the code above, or WhatsApp us to check.")}</p>
          <a className="btn btn--dark" href={waLink(tr(`Salam RK Studio, saya nak semak tempahan ${code}.`, `Hi RK Studio, I'd like to check booking ${code}.`))} target="_blank" rel="noreferrer"><WaIcon />{tr('Semak di WhatsApp', 'Check on WhatsApp')}</a>
        </div>
      </main>
    );
  }

  const when = `${longDate(b.date, lang)}, ${clock(toMin(b.time), lang)}`;
  const pkgLine = en
    ? `${b.pkg}${b.extraPax ? ` + ${b.extraPax} extra` : ''}${b.prints ? `, +${b.prints} printed photos` : ''}`
    : `${b.pkg}${b.extraPax ? ` + ${b.extraPax} orang` : ''}${b.prints ? `, +${b.prints} printed photos` : ''}`;
  const msg = (en ? [
    'Hi RK Studio, I just booked a slot.',
    '',
    `Code: ${b.code}`,
    `Name: ${b.name}`,
    `Package: ${pkgLine}`,
    `Backdrop: ${b.backdrop}`,
    `Time: ${when}`,
    `Total: RM${b.total} (${b.pay === 'qr' ? 'DuitNow QR' : 'cash at the studio'})`,
    b.pay === 'qr' ? '\nHere is my payment receipt:' : '',
  ] : [
    'Salam RK Studio, saya dah tempah slot.',
    '',
    `Kod: ${b.code}`,
    `Nama: ${b.name}`,
    `Pakej: ${pkgLine}`,
    `Backdrop: ${b.backdrop}`,
    `Masa: ${when}`,
    `Jumlah: RM${b.total} (${b.pay === 'qr' ? 'QR DuitNow' : 'tunai di studio'})`,
    b.pay === 'qr' ? '\nIni resit bayaran saya:' : '',
  ]).join('\n');
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics(b))}`;

  return (
    <main className="done">
      <div className="done__flash" aria-hidden="true" />
      <PaperBits />
      <div className="done__card">
        <p className="done__kicker">{tr('Slot dah ditempah', "You're all booked")}</p>
        <h1 className="done__code">{b.code}</h1>
        <p className="done__keep">{tr('Simpan kod ni. Tunjuk kepada kami bila sampai.', 'Keep this code and show it to us when you arrive.')}</p>

        <dl className="done__list">
          <div><dt>{tr('Bila', 'When')}</dt><dd>{when}</dd></div>
          <div><dt>{tr('Pakej', 'Package')}</dt><dd>{pkgLine}</dd></div>
          <div><dt>Backdrop</dt><dd>{b.backdrop}</dd></div>
          <div><dt>{tr('Jumlah', 'Total')}</dt><dd><b>RM{b.total}</b></dd></div>
        </dl>

        {b.pay === 'qr' ? (
          <div className="done__pay">
            <h2>{tr(`Bayar RM${b.total} guna QR`, `Pay RM${b.total} by QR`)}</h2>
            {QR
              ? <img src={QR} alt="QR DuitNow RK Studio" className="done__qr" />
              : <p className="done__noqr">{tr('QR DuitNow akan dihantar di WhatsApp. Tekan butang di bawah.', "We'll send the DuitNow QR on WhatsApp. Tap the button below.")}</p>}
            <p className="done__payee">
              {en
                ? <>Make sure the recipient name is <b>{PAY_NAME}</b>. If it shows another name, don&apos;t pay and contact us.</>
                : <>Pastikan nama penerima ialah <b>{PAY_NAME}</b>. Kalau nama lain, jangan bayar dan hubungi kami.</>}
            </p>
            <p>
              {en
                ? <>Use <b>{b.code}</b> as the reference. After paying, send us the receipt on WhatsApp. Can&apos;t pay by DuitNow? Choose cash at the studio instead.</>
                : <>Masukkan <b>{b.code}</b> sebagai rujukan. Lepas bayar, hantar resit kepada kami di WhatsApp.</>}
            </p>
            <a className="btn btn--dark" href={waLink(msg)} target="_blank" rel="noreferrer"><WaIcon />{tr('Hantar resit di WhatsApp', 'Send receipt on WhatsApp')}</a>
          </div>
        ) : (
          <div className="done__pay">
            <h2>{tr('Bayar tunai di studio', 'Pay cash at the studio')}</h2>
            <p>{tr(`Sediakan RM${b.total} dan bayar sebelum sesi bermula. Tekan butang di bawah supaya kami dapat butiran kamu.`, `Bring RM${b.total} in cash and pay before your session. Tap below so we get your details.`)}</p>
            <a className="btn btn--dark" href={waLink(msg)} target="_blank" rel="noreferrer"><WaIcon />{tr('Hantar butiran di WhatsApp', 'Send details on WhatsApp')}</a>
          </div>
        )}

        <div className="done__more">
          <a className="btn btn--line" href={icsHref} download={`RK-Studio-${b.code}.ics`}>{tr('Simpan dalam kalendar', 'Add to calendar')}</a>
          <Link className="btn btn--line" to="/">{tr('Ke laman utama', 'Back to home')}</Link>
        </div>
      </div>
    </main>
  );
}
