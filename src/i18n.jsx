import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const LangContext = createContext({ lang: 'ms', setLang: () => {}, tr: (ms) => ms });

function initialLang() {
  // ?lang=en / ?lang=ms dalam URL (untuk link kongsi & Google)
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'ms') return q;
  } catch { /* abaikan */ }
  try {
    const saved = localStorage.getItem('rk-lang');
    if (saved === 'ms' || saved === 'en') return saved;
  } catch { /* storage disekat — guna bahasa pelayar */ }
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'ms';
  // pelawat tempatan (ms/id) dapat BM; pelancong (contoh dari Pulau Perhentian) dapat English
  return /^(ms|id)/i.test(nav) ? 'ms' : 'en';
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('rk-lang', l); } catch { /* tak apa */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'ms';
    document.title = lang === 'en'
      ? 'RK Studio | Self Photo Studio in Besut, Terengganu'
      : 'RK Studio | Self Photo Studio Besut, Terengganu';
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    // tr('Teks BM', 'English text')
    tr: (ms, en) => (lang === 'en' ? en : ms),
  }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Suis bahasa BM | EN — sentiasa nampak di menu atas (telefon & desktop). */
export function LangSwitch({ className = '' }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`lang ${className}`} role="group" aria-label="Bahasa / Language">
      <button type="button" aria-pressed={lang === 'ms'} className={lang === 'ms' ? 'is-on' : ''} onClick={() => setLang('ms')} lang="ms">BM</button>
      <button type="button" aria-pressed={lang === 'en'} className={lang === 'en' ? 'is-on' : ''} onClick={() => setLang('en')} lang="en">EN</button>
      <i aria-hidden="true" className={lang === 'en' ? 'is-en' : ''} />
    </div>
  );
}
