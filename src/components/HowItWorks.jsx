import { useEffect, useRef, useState } from 'react';
import { PHOTOS, pick } from './Gallery';
import { useLang } from '../i18n';

const STEPS = [
  {
    t: ['Datang ikut masa tempahan', 'Arrive at your booked time'],
    d: ['Sampai awal sikit dan tunjuk kod tempahan kepada kami. Prop ada disediakan, pilih je.', 'Come a little early and show us your booking code. Props are provided, just pick what you like.'],
  },
  {
    t: ['Masuk studio, pegang remote', 'Step in, grab the remote'],
    d: ['Tekan lama butang remote wireless untuk snap. Snap sebanyak mana pun, tiada had.', 'Press and hold the wireless remote to take a photo. Shoot as many as you want, no limit.'],
  },
  {
    t: ['Tengok preview di TV', 'Check the preview on the TV'],
    d: ['Setiap kali snap, gambar keluar sekejap di TV. Masa bergambar, pandang kamera, bukan TV.', 'Each shot pops up on the TV for a moment. When posing, look at the camera, not the TV.'],
  },
  {
    t: ['Masa tamat, kami ketuk pintu', "Time's up, we knock"],
    d: ['Kami akan ketuk dan ambil kamera bila masa sesi habis. Jadi ikut masa ya.', "We'll knock and collect the camera when your session ends, so keep an eye on the time."],
  },
  {
    t: ['Dapat gambar', 'Get your photos'],
    d: ['Semua gambar digital dihantar melalui link Google Drive. Kalau ada printed photos, tunggu lebih kurang 15 minit.', 'All digital photos are sent via a Google Drive link. If your package has printed photos, they take about 15 minutes.'],
  },
];

const HOLD_MS = 650;

/** Butang remote: tekan lama untuk snap, preview keluar di "TV". */
function Remote() {
  const { lang, tr } = useLang();
  const en = lang === 'en';
  const [hold, setHold] = useState(false);
  const [shot, setShot] = useState(null);
  const [count, setCount] = useState(0);
  const [hint, setHint] = useState('idle'); // idle | holding | snap | again | short
  const timer = useRef(null);
  const hideTimer = useRef(null);
  const next = useRef(0);

  const HINTS = {
    idle: tr('Tekan lama', 'Press & hold'),
    holding: tr('Tahan…', 'Hold…'),
    snap: tr('Snap!', 'Snap!'),
    again: tr('Tekan lama lagi', 'Hold to snap again'),
    short: tr('Tekan lama sikit lagi', 'Hold a bit longer'),
  };

  const fire = () => {
    const p = PHOTOS[next.current % PHOTOS.length];
    next.current += 1;
    setShot(p);
    setCount((c) => c + 1);
    setHint('snap');
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { setShot(null); setHint('again'); }, 1800);
  };
  const start = (e) => {
    if (e.type === 'keydown' && e.repeat) return;
    if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    setHold(true);
    setHint('holding');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setHold(false); fire(); }, HOLD_MS);
  };
  const stop = () => {
    if (!hold) return;
    clearTimeout(timer.current);
    setHold(false);
    setHint('short');
  };
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(hideTimer.current); }, []);

  return (
    <div className="remote">
      <div className={`tv ${shot ? 'tv--on' : ''}`} aria-live="polite">
        <div className="tv__screen">
          {shot
            ? <img src={pick(shot.n, '_s')} alt={`Preview: ${en ? shot.altEn : shot.alt}`} />
            : <span>{tr('Preview keluar di sini', 'Preview shows up here')}</span>}
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
          aria-label={tr('Cuba remote: tekan lama untuk snap', 'Try the remote: press and hold to snap')}
        >
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" /></svg>
          <span>{HINTS[hint]}</span>
        </button>
        <p className="remote__count">
          {count
            ? tr(`${count} snap. Dalam studio, tiada had.`, `${count} ${count > 1 ? 'shots' : 'shot'}. In the studio, there's no limit.`)
            : tr('Cuba remote ni dulu.', 'Give the remote a try.')}
        </p>
      </div>
      <div className={`remote__flash ${shot ? 'is-on' : ''}`} key={count} aria-hidden="true" />
    </div>
  );
}

export default function HowItWorks() {
  const { lang, tr } = useLang();
  const i = lang === 'en' ? 1 : 0;
  return (
    <section className="how paper paper--grey" id="cara">
      <div className="wrap how__grid">
        <div className="how__text">
          <h2 className="display">{tr('Macam mana nak guna', 'How it works')}</h2>
          <p className="lede">{tr('Studio ni kamu yang kendalikan sendiri. Senang je, lima langkah.', 'You run the studio yourself. Five easy steps.')}</p>
          <ol className="steps">
            {STEPS.map((s, n) => (
              <li key={s.t[0]}>
                <span className="steps__n">{n + 1}</span>
                <div><h3>{s.t[i]}</h3><p>{s.d[i]}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <Remote />
      </div>
    </section>
  );
}
