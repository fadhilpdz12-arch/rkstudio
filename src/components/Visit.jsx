import { CONTACT, HOURS, DAY_NAMES } from '../data';
import { clock, toMin, nowMYT, liveStatus } from '../lib/time';
import road from '../assets/studio/studio_jalan.webp';
import door from '../assets/studio/studio_depan.webp';
import map from '../assets/studio/map.webp';

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Isnin dulu

export default function Visit() {
  const today = nowMYT().dow;
  const st = liveStatus();
  return (
    <section className="visit" id="lokasi">
      <div className="wrap">
        <h2 className="display">Datang sini</h2>
        <div className="visit__grid">
          <figure className="visit__road">
            <img src={road} alt="Bangunan RK Studio dilihat dari jalan, rumah putih berbumbung hitam" loading="lazy" />
            <figcaption>Rumah putih, bumbung hitam, tiang pagar tertulis RK.</figcaption>
          </figure>
          <figure className="visit__door">
            <img src={door} alt="Pintu masuk RK Studio dengan papan tanda RK STUDIO" loading="lazy" />
            <figcaption>Pintu studio. Kalau nampak tulisan ni, kamu dah sampai.</figcaption>
          </figure>

          <div className="visit__map">
            <img src={map} alt="Peta lokasi RK Studio di Lorong Tiara, Limbongan, Besut" loading="lazy" />
            <div className="visit__addr">
              <p><b>RK Studio</b><br />Lorong Tiara, Limbongan, Besut, Terengganu</p>
              <div className="visit__go">
                <a className="btn btn--ivory" href={CONTACT.maps} target="_blank" rel="noreferrer">Buka Google Maps</a>
                <a className="btn btn--ghost" href={CONTACT.waze} target="_blank" rel="noreferrer">Buka Waze</a>
              </div>
            </div>
          </div>

          <div className="visit__hours">
            <h3>Waktu operasi</h3>
            <p className={`status ${st.open ? 'is-open' : ''}`}><b />{st.text}</p>
            <table>
              <tbody>
                {ORDER.map((d) => {
                  const [o, c] = HOURS[d];
                  return (
                    <tr key={d} className={d === today ? 'is-today' : ''}>
                      <th scope="row">{DAY_NAMES[d]}{d === today && <em>hari ini</em>}</th>
                      <td>{clock(toMin(o))} – {clock(toMin(c))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
