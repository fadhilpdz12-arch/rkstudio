import { useEffect, useRef, useState } from 'react';
import { PHOTOS, pick } from './Gallery';

const STEPS = [
  { t: 'Datang ikut masa tempahan', d: 'Sampai awal sikit dan tunjuk kod tempahan kepada kami. Prop ada disediakan, pilih je.' },
  { t: 'Masuk studio, pegang remote', d: 'Tekan lama butang remote wireless untuk snap. Snap sebanyak mana pun, tiada had.' },
  { t: 'Tengok preview di TV', d: 'Setiap kali snap, gambar keluar sekejap di TV. Masa bergambar, pandang kamera, bukan TV.' },
  { t: 'Masa tamat, kami ketuk pintu', d: 'Kami akan ketuk dan ambil kamera bila masa sesi habis. Jadi ikut masa ya.' },
  { t: 'Dapat gambar', d: 'Semua gambar digital dihantar melalui link Google Drive. Kalau ada printed photos, tunggu lebih kurang 15 minit.' },
];

const HOLD_MS = 650;

/** Butang remote: tekan lama untuk snap, preview keluar di "TV". */
function Remote() {
  const [hold, setHold] = useState(false);
  const [shot, setShot] = useState(null);
  const [count, setCount] = useState(0);
  const [hint, setHint] = useState('Tekan lama');
  const timer = useRef(null);
  const hideTimer = useRef(null);
  const next = useRef(0);

  const fire = () => {
    const p = PHOTOS[next.current % PHOTOS.length];
    next.current += 1;
    setShot(p);
    setCount((c) => c + 1);
    setHint('Snap!');
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { setShot(null); setHint('Tekan lama lagi'); }, 1800);
  };
  const start = (e) => {
    if (e.type === 'keydown' && e.repeat) return;
    if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    setHold(true);
    setHint('Tahan…');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setHold(false); fire(); }, HOLD_MS);
  };
  const stop = () => {
    if (!hold) return;
    clearTimeout(timer.current);
    setHold(false);
    setHint('Tekan lama sikit lagi');
  };
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(hideTimer.current); }, []);

  return (
    <div className="remote">
      <div className={`tv ${shot ? 'tv--on' : ''}`} aria-live="polite">
        <div className="tv__screen">
          {shot
            ? <img src={pick(shot.n, '_s')} alt={`Preview: ${shot.alt}`} />
            : <span>Preview keluar di sini</span>}
          <div className="tv__hud"><span>1/160</span><span>F4.0</span><span>ISO AUTO</span></div>
        </div>
        <div className="tv__stand" />
      </div>
      <div className="remote__pad">
        <button
          type="button"
          className={`remote__btn ${hold ? 'is-holding' : ''}`}
          style={{ '--hold': `${HOLD_MS}ms` }}
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onKeyDown={start}
          onKeyUp={stop}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Cuba remote: tekan lama untuk snap"
        >
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" /></svg>
          <span>{hint}</span>
        </button>
        <p className="remote__count">{count ? `${count} snap. Dalam studio, tiada had.` : 'Cuba remote ni dulu.'}</p>
      </div>
      <div className={`remote__flash ${shot ? 'is-on' : ''}`} key={count} aria-hidden="true" />
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="how paper paper--grey" id="cara">
      <div className="wrap how__grid">
        <div className="how__text">
          <h2 className="display">Macam mana nak guna</h2>
          <p className="lede">Studio ni kamu yang kendalikan sendiri. Senang je, lima langkah.</p>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <span className="steps__n">{i + 1}</span>
                <div><h3>{s.t}</h3><p>{s.d}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <Remote />
      </div>
    </section>
  );
}
