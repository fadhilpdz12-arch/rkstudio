import { CONTACT, HOURS, dayNames } from '../data';
import { clock, toMin, nowMYT, liveStatus } from '../lib/time';
import { useLang } from '../i18n';
import road from '../assets/studio/studio_jalan.webp';
import door from '../assets/studio/studio_depan.webp';
import map from '../assets/studio/map.webp';

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Isnin dulu

export default function Visit() {
  const { lang, tr } = useLang();
  const today = nowMYT().dow;
  const st = liveStatus(lang);
  const days = dayNames(lang);
  return (
    <section className="visit" id="lokasi">
      <div className="wrap">
        <h2 className="display">{tr('Datang sini', 'Find us')}</h2>
        <p className="visit__trip">
          {tr(
            'Nak ke Pulau Perhentian? Kami di Besut, daerah yang sama dengan jeti Kuala Besut. Singgah bergambar sebelum atau selepas trip pulau.',
            "Heading to Pulau Perhentian? We're in Besut, the same district as the Kuala Besut jetty. Drop by for a photo session before or after your island trip.",
          )}
        </p>
        <div className="visit__grid">
          <figure className="visit__road">
            <img src={road} alt={tr('Bangunan RK Studio dilihat dari jalan, rumah putih berbumbung hitam', 'RK Studio seen from the road: a white house with a black roof')} loading="lazy" />
            <figcaption>{tr('Rumah putih, bumbung hitam, tiang pagar tertulis RK.', 'White house, black roof, "RK" on the gate pillar.')}</figcaption>
          </figure>
          <figure className="visit__door">
            <img src={door} alt={tr('Pintu masuk RK Studio dengan papan tanda RK STUDIO', 'RK Studio entrance with the RK STUDIO sign')} loading="lazy" />
            <figcaption>{tr('Pintu studio. Kalau nampak tulisan ni, kamu dah sampai.', "The studio door. See this sign? You've made it.")}</figcaption>
          </figure>

          <div className="visit__map">
            <img src={map} alt={tr('Peta lokasi RK Studio di Lorong Tiara, Limbongan, Besut', 'Map showing RK Studio on Lorong Tiara, Limbongan, Besut')} loading="lazy" />
            <div className="visit__addr">
              <p><b>RK Studio</b><br />Lorong Tiara, Limbongan, Besut, Terengganu</p>
              <div className="visit__go">
                <a className="btn btn--ivory" href={CONTACT.maps} target="_blank" rel="noreferrer">{tr('Buka Google Maps', 'Open Google Maps')}</a>
                <a className="btn btn--ghost" href={CONTACT.waze} target="_blank" rel="noreferrer">{tr('Buka Waze', 'Open Waze')}</a>
              </div>
            </div>
          </div>

          <div className="visit__hours">
            <h3>{tr('Waktu operasi', 'Opening hours')}</h3>
            <p className={`status ${st.open ? 'is-open' : ''}`}><b />{st.text}</p>
            <table>
              <tbody>
                {ORDER.map((d) => {
                  const [o, c] = HOURS[d];
                  return (
                    <tr key={d} className={d === today ? 'is-today' : ''}>
                      <th scope="row">{days[d]}{d === today && <em>{tr('hari ini', 'today')}</em>}</th>
                      <td>{clock(toMin(o), lang)} – {clock(toMin(c), lang)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="visit__tz">{tr('Waktu Malaysia (GMT+8).', 'Malaysia time (GMT+8).')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
