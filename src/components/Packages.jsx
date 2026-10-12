import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PACKAGES, EXTRA_PAX_PRICE, EXTRA_PRINT_PRICE, CONTACT } from '../data';
import { useLang } from '../i18n';

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
  const { lang, tr } = useLang();
  const en = lang === 'en';
  const rec = recommend(pax);
  const unit = (n) => (en ? (n > 1 ? 'people' : 'person') : 'orang');
  const solo = PACKAGES[0].price;
  const rm = (v) => (Number.isInteger(v) ? `RM${v}` : Number.isInteger(v * 2) ? `RM${v.toFixed(2)}` : `±RM${Math.round(v)}`);
  const recTotal = rec ? rec.pkg.price + rec.extra * EXTRA_PAX_PRICE : 0;

  return (
    <section className="packages paper paper--ivory" id="pakej">
      <div className="wrap">
        <header className="packages__head">
          <h2 className="display">{tr('Pakej', 'Packages')}</h2>
          <div className="paxpick">
            <label htmlFor="pax">{tr('Berapa orang nak bergambar?', 'How many people are coming?')}</label>
            <div className="paxpick__row">
              <button type="button" onClick={() => setPax((p) => Math.max(1, p - 1))} aria-label={tr('Kurang seorang', 'One less')}>−</button>
              <output htmlFor="pax" aria-live="polite"><b>{pax}</b> {unit(pax)}</output>
              <button type="button" onClick={() => setPax((p) => Math.min(11, p + 1))} aria-label={tr('Tambah seorang', 'One more')}>+</button>
            </div>
            <input id="pax" type="range" min="1" max="11" value={pax} onChange={(e) => setPax(+e.target.value)} />
            <p className="paxpick__ans">
              {rec
                ? (en
                  ? <>Best fit: <b>{rec.pkg.name}</b>{rec.extra ? ` + ${rec.extra} extra` : ''}, total <b>RM{recTotal}</b>{pax > 1 ? <>, only <b>{rm(recTotal / pax)}</b> per person</> : ''}.</>
                  : <>Paling sesuai: <b>{rec.pkg.name}</b>{rec.extra ? ` + ${rec.extra} orang tambahan` : ''}, jumlah <b>RM{recTotal}</b>{pax > 1 ? <>, cuma <b>{rm(recTotal / pax)}</b> seorang</> : ''}.</>)
                : <>
                  {tr('Lebih 10 orang?', 'More than 10 people?')}{' '}
                  <a href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(tr('Salam RK Studio, saya nak tanya untuk group lebih 10 orang.', 'Hi RK Studio, I would like to ask about a group of more than 10 people.'))}`} target="_blank" rel="noreferrer">{tr('WhatsApp kami', 'WhatsApp us')}</a>
                  {tr(', kita atur.', " and we'll sort it out.")}
                </>}
            </p>
          </div>
        </header>

        <div className="pkgs">
          {PACKAGES.map((p) => {
            const on = rec && rec.pkg.id === p.id;
            const extra = on ? rec.extra : 0;
            const per = p.price / p.pax;
            const save = p.pax * solo - p.price;
            const best = p.id === 'chaoscrew';
            return (
              <article key={p.id} className={`pkg ${on ? 'is-rec' : ''}`}>
                {best && <span className="pkg__badge">{tr('Paling jimat seorang', 'Best value per person')}</span>}
                <div className="pkg__top">
                  <h3>{p.name}</h3>
                  <People n={p.pax} extra={extra} />
                </div>
                <div className="pkg__pricing">
                  <p className="pkg__price"><small>RM</small>{p.price}</p>
                  {p.pax > 1 && <p className="pkg__per">{en ? <>just <b>{rm(per)}</b><br />per person</> : <>cuma <b>{rm(per)}</b><br />seorang</>}</p>}
                </div>
                {save > 0
                  ? <p className="pkg__save">{en ? `Save RM${save} vs ${p.pax} separate Spotlight sessions` : `Jimat RM${save} berbanding ${p.pax} sesi Spotlight`}</p>
                  : <p className="pkg__save pkg__save--plain">{tr('Masa untuk diri sendiri', 'Your own private session')}</p>}
                <p className="pkg__blurb">{en ? p.blurbEn : p.blurb}</p>
                <ul className="pkg__list">
                  <li><b>{tr('Snap tanpa had', 'Unlimited shots')}</b></li>
                  <li>
                    <b>{p.pax}</b> {unit(p.pax)}
                    {p.maxExtra ? (en ? `, add up to ${p.maxExtra} more (RM${EXTRA_PAX_PRICE} each)` : `, boleh tambah ${p.maxExtra} (RM${EXTRA_PAX_PRICE} seorang)`) : ''}
                  </li>
                  <li><b>{p.minutes}</b> {tr('minit sesi', 'minute session')}</li>
                  <li>{tr('Semua gambar digital, tiada caj tambahan', 'All digital photos, no extra charge')}</li>
                  {p.prints
                    ? <li className="pkg__gift"><span className="tag-free">{tr('PERCUMA', 'FREE')}</span> {p.prints} printed photo{p.prints > 1 ? 's' : ''} 4R <small>({tr('bernilai', 'worth')} RM{p.prints * EXTRA_PRINT_PRICE})</small></li>
                    : <li>{tr(`Printed photos RM${EXTRA_PRINT_PRICE} sekeping jika mahu`, `Printed photos RM${EXTRA_PRINT_PRICE} each if you want them`)}</li>}
                  {(en ? p.extrasEn : p.extras).map((x) => <li key={x}>{x}</li>)}
                </ul>
                <Link className={`btn ${on ? 'btn--dark' : 'btn--line'}`} to={`/tempah?pakej=${p.id}${on && extra ? `&tambah=${extra}` : ''}`}>
                  {tr('Tempah', 'Book')} {p.name}
                </Link>
              </article>
            );
          })}
        </div>

        <p className="packages__note">
          {tr(
            `Harga yang kamu nampak ialah harga penuh, tiada caj tersembunyi. Semua gambar medium shot (separuh badan). Tambah printed photos RM${EXTRA_PRINT_PRICE} sekeping.`,
            `The price you see is the full price, no hidden fees. All photos are medium shots (waist up). Extra printed photos RM${EXTRA_PRINT_PRICE} each. Prices in Malaysian Ringgit, pay by DuitNow QR or cash.`,
          )}
        </p>
      </div>
    </section>
  );
}
