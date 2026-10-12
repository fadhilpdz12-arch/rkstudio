import { useState, useRef } from 'react';
import { BACKDROPS } from '../data';

const imgs = import.meta.glob('../assets/backdrop/*.webp', { eager: true, import: 'default' });
export const backdropImg = (id) => imgs[`../assets/backdrop/${id}.webp`];

/** Pilih warna — kertas backdrop "turun" dari gulungan dan tukar warna seluruh bahagian. */
export default function Backdrops() {
  const [cur, setCur] = useState(BACKDROPS[2]);
  const [roll, setRoll] = useState(null);
  const busy = useRef(false);

  const choose = (b) => {
    if (b.id === cur.id || busy.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setCur(b); return; }
    busy.current = true;
    setRoll(b);
    setTimeout(() => { setCur(b); setRoll(null); busy.current = false; }, 700);
  };

  return (
    <section className="backdrops" id="backdrop" style={{ '--bd': cur.hex, '--bd-ink': cur.ink }}>
      <div className="backdrops__rod" aria-hidden="true" />
      {roll && <div className="backdrops__roll" style={{ '--next': roll.hex }} aria-hidden="true" />}
      <div className="wrap backdrops__grid">
        <div className="backdrops__text">
          <h2 className="display">Empat backdrop</h2>
          <p className="lede">Pilih masa buat tempahan. Tekan warna di bawah untuk tengok rupa dia.</p>
          <div className="swatches" role="radiogroup" aria-label="Warna backdrop">
            {BACKDROPS.map((b) => (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={cur.id === b.id}
                className={`swatch ${cur.id === b.id ? 'is-on' : ''}`}
                style={{ '--c': b.hex }}
                onClick={() => choose(b)}
              >
                <i />
                <span>{b.name}</span>
              </button>
            ))}
          </div>
          <p className="backdrops__mood" aria-live="polite"><b>{cur.name}.</b> {cur.mood}</p>
        </div>
        <figure className="backdrops__shot">
          <img key={cur.id} src={backdropImg(cur.id)} alt={`Contoh gambar dengan backdrop ${cur.name}`} />
        </figure>
      </div>
    </section>
  );
}
