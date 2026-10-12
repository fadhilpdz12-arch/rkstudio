import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import { waLink, WaIcon } from './Bits';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const STEPS = [
  {
    icon: <Icon d={<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h6" /></>} />,
    t: ['Pilih pakej', 'Choose a package'],
    d: ['Ikut berapa orang yang nak bergambar. Pilih juga warna backdrop.', 'Based on how many people are coming. Pick a backdrop colour too.'],
  },
  {
    icon: <Icon d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>} />,
    t: ['Pilih tarikh & masa', 'Pick a date & time'],
    d: ['Tekan tarikh di kalendar, kemudian tekan masa yang masih kosong.', 'Tap a date on the calendar, then tap an open time.'],
  },
  {
    icon: <Icon d={<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>} />,
    t: ['Bayar & datang', 'Pay & come in'],
    d: ['Bayar guna QR atau tunai di studio. Datang ikut masa, tunjuk kod tempahan.', 'Pay by QR or cash at the studio. Come at your time and show your booking code.'],
  },
];

/** Panduan ringkas untuk semua peringkat umur: 3 langkah besar + bantuan WhatsApp. */
export default function QuickGuide() {
  const { lang, tr } = useLang();
  const i = lang === 'en' ? 1 : 0;
  return (
    <section className="guide" aria-labelledby="guide-h">
      <div className="wrap">
        <h2 id="guide-h" className="guide__h">{tr('Cara tempah, 3 langkah je', 'How to book, just 3 steps')}</h2>
        <ol className="guide__steps">
          {STEPS.map((s, n) => (
            <li key={s.t[0]} className="guide__step">
              <span className="guide__n" aria-hidden="true">{n + 1}</span>
              <span className="guide__icon">{s.icon}</span>
              <h3>{s.t[i]}</h3>
              <p>{s.d[i]}</p>
            </li>
          ))}
        </ol>
        <div className="guide__cta">
          <Link to="/tempah" className="btn btn--ivory guide__go">{tr('Mula tempah sekarang', 'Start booking now')}</Link>
          <a className="guide__help" href={waLink(tr('Salam RK Studio, saya nak tempah tapi perlukan bantuan.', 'Hi RK Studio, I would like to book but need some help.'))} target="_blank" rel="noreferrer">
            <WaIcon />
            <span>{tr('Susah guna website? WhatsApp kami, kami tolong tempahkan.', 'Prefer not to use the website? WhatsApp us and we will book for you.')}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
