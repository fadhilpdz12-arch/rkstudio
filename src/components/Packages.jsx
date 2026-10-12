import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PACKAGES, EXTRA_PAX_PRICE, EXTRA_PRINT_PRICE, CONTACT } from '../data';

export function recommend(pax) {
  if (pax <= 1) return { pkg: PACKAGES[0], extra: 0 };
  if (pax <= 4) return { pkg: PACKAGES[1], extra: pax - 2 };
  if (pax <= 7) return { pkg: PACKAGES[2], extra: pax - 5 };
  if (pax <= 10) return { pkg: PACKAGES[3], extra: pax - 8 };
  return null;
}

function People({ n, extra }) {
  return (
    <span className="people" aria-hidden="true">
      {Array.from({ length: n + extra }).map((_, i) => <i key={i} className={i >= n ? 'is-extra' : ''} />)}
    </span>
  );
}

export default function Packages() {
  const [pax, setPax] = useState(2);
  const rec = recommend(pax);

  return (
    <section className="packages paper paper--ivory" id="pakej">
      <div className="wrap">
        <header className="packages__head">
          <h2 className="display">Pakej</h2>
          <div className="paxpick">
            <label htmlFor="pax">Berapa orang nak bergambar?</label>
            <div className="paxpick__row">
              <button type="button" onClick={() => setPax((p) => Math.max(1, p - 1))} aria-label="Kurang seorang">−</button>
              <output htmlFor="pax" aria-live="polite"><b>{pax}</b> orang</output>
              <button type="button" onClick={() => setPax((p) => Math.min(11, p + 1))} aria-label="Tambah seorang">+</button>
            </div>
            <input id="pax" type="range" min="1" max="11" value={pax} onChange={(e) => setPax(+e.target.value)} />
            <p className="paxpick__ans">
              {rec
                ? <>Paling sesuai: <b>{rec.pkg.name}</b>{rec.extra ? ` + ${rec.extra} orang tambahan` : ''}, jumlah <b>RM{rec.pkg.price + rec.extra * EXTRA_PAX_PRICE}</b>.</>
                : <>Lebih 10 orang? <a href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('Salam RK Studio, saya nak tanya untuk group lebih 10 orang.')}`} target="_blank" rel="noreferrer">WhatsApp kami</a>, kita atur.</>}
            </p>
          </div>
        </header>

        <div className="pkgs">
          {PACKAGES.map((p) => {
            const on = rec && rec.pkg.id === p.id;
            const extra = on ? rec.extra : 0;
            return (
              <article key={p.id} className={`pkg ${on ? 'is-rec' : ''}`}>
                <div className="pkg__top">
                  <h3>{p.name}</h3>
                  <People n={p.pax} extra={extra} />
                </div>
                <p className="pkg__price"><small>RM</small>{p.price}</p>
                <p className="pkg__blurb">{p.blurb}</p>
                <ul className="pkg__list">
                  <li><b>{p.pax}</b> orang{p.maxExtra ? `, boleh tambah ${p.maxExtra} (RM${EXTRA_PAX_PRICE} seorang)` : ''}</li>
                  <li><b>{p.minutes}</b> minit sesi</li>
                  <li>Semua gambar digital</li>
                  <li>{p.prints ? <><b>{p.prints}</b> printed photo{p.prints > 1 ? 's' : ''} (4R)</> : 'Tiada printed photos'}</li>
                  {p.extras.map((x) => <li key={x}>{x}</li>)}
                </ul>
                <Link className={`btn ${on ? 'btn--dark' : 'btn--line'}`} to={`/tempah?pakej=${p.id}${on && extra ? `&tambah=${extra}` : ''}`}>
                  Tempah {p.name}
                </Link>
              </article>
            );
          })}
        </div>

        <p className="packages__note">
          Semua pakej: snap tanpa had, gambar medium shot (separuh badan). Tambah printed photos RM{EXTRA_PRINT_PRICE} sekeping.
        </p>
      </div>
    </section>
  );
}
