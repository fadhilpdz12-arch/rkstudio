import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Camera3D from './Camera3D';
import { liveStatus } from '../lib/time';
import posterUrl from '../assets/brand/camera-poster.webp';
import { useLang } from '../i18n';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export default function Hero({ onModelReady }) {
  const section = useRef(null);
  const stage = useRef(null);
  const progress = useRef(0);
  const { lang, tr } = useLang();
  const [, setTick] = useState(0);
  const status = liveStatus(lang);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = section.current.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = clamp(-r.top / total);
      progress.current = p;
      const s = stage.current.style;
      s.setProperty('--p', p.toFixed(4));
      // kilat kamera memuncak sekitar 0.86
      s.setProperty('--flash', clamp(1 - Math.abs(p - 0.86) / 0.07).toFixed(3));
      s.setProperty('--dev', clamp((p - 0.86) / 0.1).toFixed(3));
      s.setProperty('--focus', clamp((p - 0.5) / 0.22).toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="hero" ref={section} aria-label="RK Studio">
      <div className="hero__stage" ref={stage}>
        <div className="hero__spot" />
        <h1 className="hero__type" aria-label="Pose it your way">
          <span>Pose it</span>
          <span>your way</span>
        </h1>

        {fallback
          ? <img className="cam3d cam3d--poster" src={posterUrl} alt="" />
          : <Camera3D progress={progress} onReady={onModelReady} onFail={() => { setFallback(true); onModelReady && onModelReady(); }} />}

        <div className="vf" aria-hidden="true">
          <i className="vf__c vf__c--tl" /><i className="vf__c vf__c--tr" />
          <i className="vf__c vf__c--bl" /><i className="vf__c vf__c--br" />
          <i className="vf__af" />
          <div className="vf__read"><span>1/160</span><span>F4.0</span><span>ISO AUTO</span></div>
          <div className="vf__rec"><b />RK STUDIO</div>
        </div>

        <div className="hero__copy">
          <p className="hero__lead">{tr('Studio gambar layan diri di Limbongan, Besut. Kamu pegang remote, kamu yang tentukan gaya.', 'A self photo studio in Besut, Terengganu. You hold the remote, you call the shots.')}</p>
          <p className={`status ${status.open ? 'is-open' : ''}`}><b />{status.text}</p>
          <div className="hero__cta">
            <Link to="/tempah" className="btn btn--ivory">{tr('Tempah slot', 'Book a slot')}</Link>
            <a href="#pakej" className="btn btn--ghost">{tr('Tengok pakej', 'See packages')}</a>
          </div>
        </div>

        <button type="button" className="hero__more"
          onClick={() => window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' })}>
          <span>{tr('Leret ke bawah untuk tengok lagi', 'Scroll down to see more')}</span>
          <i aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </i>
        </button>
        <div className="hero__flash" aria-hidden="true" />
      </div>
    </section>
  );
}
