import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CONTACT } from '../data';
import mark from '../assets/brand/mark.png';
import { useLang, LangSwitch } from '../i18n';

export const waLink = (text) => `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.6-.3Z" />
    </svg>
  );
}

const LINKS = [['#pakej', 'Pakej', 'Packages'], ['#cara', 'Cara guna', 'How it works'], ['#backdrop', 'Backdrop', 'Backdrops'], ['#galeri', 'Galeri', 'Gallery'], ['#lokasi', 'Lokasi', 'Location']];
const hello = (tr) => tr('Salam RK Studio, saya nak tanya.', 'Hi RK Studio, I have a question.');

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const { lang, tr } = useLang();
  const home = pathname === '/';
  const admin = pathname.startsWith('/admin');

  useEffect(() => {
    const on = () => {
      const h = document.querySelector('.hero');
      setSolid(window.scrollY > (h ? h.offsetHeight - window.innerHeight * 1.15 : 10));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; }, [menu]);

  return (
    <>
      <nav className={`nav ${solid || !home ? 'nav--solid' : ''}`} aria-label={tr('Menu utama', 'Main menu')}>
        <Link to="/" className="nav__logo" aria-label={tr('RK Studio, laman utama', 'RK Studio, home')} onClick={() => window.scrollTo(0, 0)}>
          <img src={mark} alt="" /><span>RK Studio</span>
        </Link>
        {home && (
          <ul className="nav__links">
            {LINKS.map(([h, ms, en]) => <li key={h}><a href={h}>{lang === 'en' ? en : ms}</a></li>)}
          </ul>
        )}
        <div className="nav__right">
          {!admin && <LangSwitch />}
          {pathname !== '/tempah' && !admin && <Link to="/tempah" className="btn btn--small nav__book">{tr('Tempah slot', 'Book a slot')}</Link>}
          {home && (
            <button className="nav__burger" type="button" aria-expanded={menu} aria-label={tr('Buka menu', 'Open menu')} onClick={() => setMenu(true)}>
              <i /><i />
            </button>
          )}
        </div>
      </nav>
      {menu && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="sheet__close" type="button" onClick={() => setMenu(false)} aria-label={tr('Tutup menu', 'Close menu')}>×</button>
          <ul>
            {LINKS.map(([h, ms, en]) => <li key={h}><a href={h} onClick={() => setMenu(false)}>{lang === 'en' ? en : ms}</a></li>)}
          </ul>
          <div className="sheet__cta">
            <div className="sheet__lang"><span>{tr('Bahasa', 'Language')}</span><LangSwitch className="lang--big" /></div>
            <Link to="/tempah" className="btn btn--ivory" onClick={() => setMenu(false)}>{tr('Tempah slot', 'Book a slot')}</Link>
            <a className="btn btn--ghost" href={waLink(hello(tr))} target="_blank" rel="noreferrer"><WaIcon />WhatsApp</a>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileBar() {
  const { tr } = useLang();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.6);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className={`mbar ${show ? 'is-on' : ''}`}>
      <Link to="/tempah" className="btn btn--dark">{tr('Tempah slot', 'Book a slot')}</Link>
      <a className="mbar__wa" href={waLink(hello(tr))} target="_blank" rel="noreferrer" aria-label="WhatsApp RK Studio"><WaIcon /></a>
    </div>
  );
}

export function Notes() {
  const { tr } = useLang();
  const items = [
    [tr('Medium shot je', 'Medium shots only'), tr('Kamera dah disetkan untuk gambar separuh badan. Gambar seluruh badan tak dapat.', 'The camera is set for waist-up framing. Full-body shots are not possible.')],
    [tr('Kamu ambil sendiri', 'No photographer, just you'), tr('Ni studio layan diri. Tiada jurugambar dalam bilik, jadi bebas nak buat gaya apa pun.', "It's self-service. No photographer in the room, so pose however you like.")],
    [tr('Ikut masa', 'Sessions are timed'), tr('Sesi bermula dan tamat ikut slot. Kalau ada customer sebelum kamu, mungkin perlu tunggu lebih kurang 5 minit (10 minit jika mereka ada printed photos) untuk kami kemas dan tukar backdrop. Masa sesi kamu tetap penuh.', "Your session runs for the full length of your slot. If there's a group right before you, there may be a short wait of about 5 minutes (10 if they have printed photos) while we tidy up and change the backdrop. You still get your full session time.")],
    [tr('Pandang kamera', 'Look at the camera'), tr('TV tu untuk preview. Masa snap, mata ke kamera supaya gambar nampak terus ke depan.', 'The TV is just for previews. Look into the camera when you shoot.')],
  ];
  return (
    <section className="notes paper paper--pongee">
      <div className="wrap">
        <h2 className="display">{tr('Sebelum datang', 'Before you come')}</h2>
        <dl className="notes__list">
          {items.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
        </dl>
      </div>
    </section>
  );
}

export function FinalCta() {
  const { tr } = useLang();
  return (
    <section className="final">
      <div className="wrap final__in">
        <p className="final__big">{tr('Slot petang ni', 'Ready for')}<br />{tr('masih ada?', 'your close-up?')}</p>
        <p className="lede">{tr('Tengok slot kosong dan tempah dalam satu minit. Bayar guna QR atau tunai di studio.', 'See open slots and book in a minute. Pay by QR or cash at the studio.')}</p>
        <div className="final__cta">
          <Link to="/tempah" className="btn btn--ivory">{tr('Tengok slot kosong', 'See open slots')}</Link>
          <a className="btn btn--ghost" href={waLink(hello(tr))} target="_blank" rel="noreferrer"><WaIcon />{tr('Tanya dulu', 'Ask us first')}</a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { lang, tr } = useLang();
  return (
    <footer className="foot">
      <div className="wrap foot__in">
        <img src={mark} alt="RK Studio" className="foot__mark" />
        <div>
          <p className="foot__tag">Pose it your way</p>
          <p>Self photo studio, {CONTACT.area}</p>
        </div>
        <ul className="foot__links">
          <li><a href={waLink()} target="_blank" rel="noreferrer">WhatsApp {lang === 'en' ? '+60 11-7117 1509' : CONTACT.whatsappDisplay}</a></li>
          <li><a href={CONTACT.tiktok} target="_blank" rel="noreferrer">TikTok {CONTACT.tiktokHandle}</a></li>
          <li><a href={CONTACT.beacons} target="_blank" rel="noreferrer">{tr('Semua link', 'All links')}</a></li>
        </ul>
        <p className="foot__copy">© {new Date().getFullYear()} RK Studio</p>
      </div>
    </footer>
  );
}
