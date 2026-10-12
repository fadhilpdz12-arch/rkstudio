import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n';

const files = import.meta.glob('../assets/gallery/g*.webp', { eager: true, import: 'default' });
const pick = (n, s = '') => files[`../assets/gallery/g${n}${s}.webp`];

const PHOTOS = [
  { n: '05', alt: 'Keluarga berlima berbaju hitam, ketawa', altEn: 'Family of five in black tees, laughing', cap: 'Baju sedondon, gaya ikut suka', capEn: 'Matching outfits, any pose you like' },
  { n: '11', alt: 'Remaja memakai topi unicorn dan cermin mata besar', altEn: 'Teen in a unicorn hat and giant sunglasses', cap: 'Prop disediakan. Malu tinggal kat pintu.', capEn: 'Props provided. Leave the shyness at the door.' },
  { n: '01', alt: 'Pasangan suami isteri berbaju kurung dan baju melayu', altEn: 'Couple in traditional Malay outfits', cap: 'Klasik berdua', capEn: 'A classic for two' },
  { n: '13', alt: 'Atuk berkot hitam dan cermin mata hitam', altEn: 'Grandpa in a black coat and sunglasses', cap: 'Atuk paling bergaya hari tu', capEn: 'Coolest grandpa of the day' },
  { n: '03', alt: 'Keluarga memakai cermin mata lucu dan bando hati', altEn: 'Family wearing funny glasses and heart headbands', cap: 'Bila satu family sepakat nak gila-gila', capEn: 'When the whole family agrees to go silly' },
  { n: '09', alt: 'Keluarga besar tiga generasi', altEn: 'Big family, three generations', cap: 'Tiga generasi, satu frame', capEn: 'Three generations, one frame' },
  { n: '04', alt: 'Ayah mendukung anak kecil sambil tunjuk peace', altEn: 'Dad holding his toddler, both making peace signs', cap: 'Peace dari ayah dan si kecil', capEn: 'Peace from dad and the little one' },
  { n: '12', alt: 'Adik beradik berlakon adegan pedang mainan', altEn: 'Siblings acting out a toy sword scene', cap: 'Ada yang datang dengan skrip sendiri', capEn: 'Some came with their own script' },
  { n: '06', alt: 'Keluarga duduk dan berdiri, tersenyum', altEn: 'Family sitting and standing, smiling', cap: 'Senyum yang tak dipaksa', capEn: 'Smiles nobody had to force' },
  { n: '14', alt: 'Budak kecil dengan bando hati di backdrop biru', altEn: 'Little kid with a heart headband on the blue backdrop', cap: 'Backdrop Deep Blue', capEn: 'Deep Blue backdrop' },
  { n: '10', alt: 'Tiga budak dengan topi arnab dan cermin mata', altEn: 'Three kids with a bunny hat and glasses', cap: 'Geng kecil, gaya besar', capEn: 'Small crew, big style' },
  { n: '08', alt: 'Isteri berdiri di sisi suami yang duduk', altEn: 'Wife standing beside her seated husband', cap: 'Pose ala majalah', capEn: 'Magazine-cover pose' },
  { n: '02', alt: 'Keluarga lima orang berdiri rapat', altEn: 'Family of five standing close', cap: 'Raya awal pun boleh', capEn: 'Festive photos, any time of year' },
  { n: '07', alt: 'Ibu, anak dan ayah duduk rapat', altEn: 'Mum, son and dad sitting close', cap: 'Bertiga', capEn: 'The three of us' },
];

export default function Gallery() {
  const grid = useRef(null);
  const [open, setOpen] = useState(-1);
  const { lang, tr } = useLang();
  const en = lang === 'en';
  const cap = (p) => (en ? p.capEn : p.cap);
  const alt = (p) => (en ? p.altEn : p.alt);

  useEffect(() => {
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('is-dev'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    grid.current.querySelectorAll('.print').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const close = useCallback(() => setOpen(-1), []);
  const step = useCallback((d) => setOpen((i) => (i + d + PHOTOS.length) % PHOTOS.length), []);

  useEffect(() => {
    if (open < 0) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, close, step]);

  // swipe di telefon
  const touch = useRef(null);
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  return (
    <section className="gallery paper paper--pongee" id="galeri">
      <div className="wrap">
        <header className="gallery__head">
          <h2 className="display">{tr('Klik.', 'Click.')}</h2>
          <p className="lede">{tr('Semua gambar di bawah diambil sendiri oleh customer kami. Tiada jurugambar dalam bilik, cuma kamu, remote dan backdrop.', 'Every photo below was taken by our customers themselves. No photographer in the room, just you, a remote and a backdrop.')}</p>
        </header>
        <div className="prints" ref={grid}>
          {PHOTOS.map((p, i) => (
            <figure key={p.n} className="print" style={{ '--r': `${((i * 37) % 7) - 3}deg` }}>
              <button type="button" onClick={() => setOpen(i)} aria-label={`${tr('Besarkan', 'Enlarge')}: ${cap(p)}`}>
                <img src={pick(p.n, '_s')} alt={alt(p)} loading="lazy" decoding="async" width="640" height="428" />
              </button>
              <figcaption>{cap(p)}</figcaption>
            </figure>
          ))}
        </div>
        <p className="gallery__more">{tr('Nak tengok lagi?', 'Want to see more?')} <a href="https://www.tiktok.com/@rkstudiobesut" target="_blank" rel="noreferrer">{tr('TikTok kami ada lagi banyak', 'Find plenty more on our TikTok')}</a>.</p>
      </div>

      {open >= 0 && createPortal(
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={cap(PHOTOS[open])} onClick={close} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={pick(PHOTOS[open].n)} alt={alt(PHOTOS[open])} />
            <figcaption>{cap(PHOTOS[open])}<span>{open + 1} / {PHOTOS.length}</span></figcaption>
          </figure>
          <button className="lightbox__nav lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label={tr('Gambar sebelum', 'Previous photo')}>‹</button>
          <button className="lightbox__nav lightbox__nav--next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label={tr('Gambar seterusnya', 'Next photo')}>›</button>
          <button className="lightbox__close" onClick={close} aria-label={tr('Tutup', 'Close')}>×</button>
        </div>,
        document.body,
      )}
    </section>
  );
}

export { PHOTOS, pick };
