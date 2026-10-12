import { useEffect, useRef, useState, useCallback } from 'react';

const files = import.meta.glob('../assets/gallery/g*.webp', { eager: true, import: 'default' });
const pick = (n, s = '') => files[`../assets/gallery/g${n}${s}.webp`];

const PHOTOS = [
  { n: '05', alt: 'Keluarga berlima berbaju hitam, ketawa', cap: 'Baju sedondon, gaya ikut suka' },
  { n: '11', alt: 'Remaja memakai topi unicorn dan cermin mata besar', cap: 'Prop disediakan. Malu tinggal kat pintu.' },
  { n: '01', alt: 'Pasangan suami isteri berbaju kurung dan baju melayu', cap: 'Klasik berdua' },
  { n: '13', alt: 'Atuk berkot hitam dan cermin mata hitam', cap: 'Atuk paling bergaya hari tu' },
  { n: '03', alt: 'Keluarga memakai cermin mata lucu dan bando hati', cap: 'Bila satu family sepakat nak gila-gila' },
  { n: '09', alt: 'Keluarga besar tiga generasi', cap: 'Tiga generasi, satu frame' },
  { n: '04', alt: 'Ayah mendukung anak kecil sambil tunjuk peace', cap: 'Peace dari ayah dan si kecil' },
  { n: '12', alt: 'Adik beradik berlakon adegan pedang mainan', cap: 'Ada yang datang dengan skrip sendiri' },
  { n: '06', alt: 'Keluarga duduk dan berdiri, tersenyum', cap: 'Senyum yang tak dipaksa' },
  { n: '14', alt: 'Budak kecil dengan bando hati di backdrop biru', cap: 'Backdrop Deep Blue' },
  { n: '10', alt: 'Tiga budak dengan topi arnab dan cermin mata', cap: 'Geng kecil, gaya besar' },
  { n: '08', alt: 'Isteri berdiri di sisi suami yang duduk', cap: 'Pose ala majalah' },
  { n: '02', alt: 'Keluarga lima orang berdiri rapat', cap: 'Raya awal pun boleh' },
  { n: '07', alt: 'Ibu, anak dan ayah duduk rapat', cap: 'Bertiga' },
];

export default function Gallery() {
  const grid = useRef(null);
  const [open, setOpen] = useState(-1);

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
          <h2 className="display">Klik.</h2>
          <p className="lede">Semua gambar di bawah diambil sendiri oleh customer kami. Tiada jurugambar dalam bilik, cuma kamu, remote dan backdrop.</p>
        </header>
        <div className="prints" ref={grid}>
          {PHOTOS.map((p, i) => (
            <figure key={p.n} className="print" style={{ '--r': `${((i * 37) % 7) - 3}deg` }}>
              <button type="button" onClick={() => setOpen(i)} aria-label={`Besarkan: ${p.cap}`}>
                <img src={pick(p.n, '_s')} alt={p.alt} loading="lazy" decoding="async" width="640" height="428" />
              </button>
              <figcaption>{p.cap}</figcaption>
            </figure>
          ))}
        </div>
        <p className="gallery__more">Nak tengok lagi? <a href="https://www.tiktok.com/@rkstudiobesut" target="_blank" rel="noreferrer">TikTok kami ada lagi banyak</a>.</p>
      </div>

      {open >= 0 && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={PHOTOS[open].cap} onClick={close} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={pick(PHOTOS[open].n)} alt={PHOTOS[open].alt} />
            <figcaption>{PHOTOS[open].cap}<span>{open + 1} / {PHOTOS.length}</span></figcaption>
          </figure>
          <button className="lightbox__nav lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Gambar sebelum">‹</button>
          <button className="lightbox__nav lightbox__nav--next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Gambar seterusnya">›</button>
          <button className="lightbox__close" onClick={close} aria-label="Tutup">×</button>
        </div>
      )}
    </section>
  );
}

export { PHOTOS, pick };
