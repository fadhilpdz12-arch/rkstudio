import { useEffect, useState } from 'react';
import mark from '../assets/brand/mark.png';

/** Bukaan pertama: tanda RK kabur → fokus, lalu bilah shutter terbuka. */
export default function Loader({ ready, onDone }) {
  const [phase, setPhase] = useState('in'); // in -> focus -> open

  useEffect(() => {
    const t = setTimeout(() => setPhase('focus'), 450);
    return () => clearTimeout(t);
  }, []);

  // tunggu model 3D siap, tapi jangan lebih 2.6s
  useEffect(() => {
    if (phase !== 'focus') return undefined;
    const started = performance.now();
    let id;
    const check = () => {
      if (ready.current || performance.now() - started > 2600) setPhase('open');
      else id = setTimeout(check, 80);
    };
    id = setTimeout(check, 650);
    return () => clearTimeout(id);
  }, [phase, ready]);

  useEffect(() => {
    if (phase !== 'open') return undefined;
    const id = setTimeout(onDone, 900);
    return () => clearTimeout(id);
  }, [phase, onDone]);

  return (
    <div className={`loader loader--${phase}`} role="status" aria-label="Memuatkan RK Studio">
      <div className="loader__blades">
        {Array.from({ length: 6 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}
      </div>
      <div className="loader__frame">
        <img src={mark} alt="" />
        <p>Pose it your way</p>
      </div>
    </div>
  );
}
