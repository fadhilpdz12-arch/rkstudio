import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Loader from './components/Loader';
import { Nav } from './components/Bits';

const Book = lazy(() => import('./pages/Book'));
const Done = lazy(() => import('./pages/Done'));
const Admin = lazy(() => import('./pages/Admin'));

function seenLoader() {
  try { return sessionStorage.getItem('rk-loader') === '1'; } catch { return false; }
}

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { setTimeout(() => el.scrollIntoView(), 50); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const ready = useRef(false);
  const [loading, setLoading] = useState(pathname === '/' && !seenLoader());

  const done = useCallback(() => {
    setLoading(false);
    try { sessionStorage.setItem('rk-loader', '1'); } catch { /* tak apa */ }
  }, []);

  return (
    <>
      <ScrollTop />
      {loading && <Loader ready={ready} onDone={done} />}
      <Nav />
      <Suspense fallback={<div className="page-wait" />}>
        <Routes>
          <Route path="/" element={<Home onModelReady={() => { ready.current = true; }} />} />
          <Route path="/tempah" element={<Book />} />
          <Route path="/siap/:code" element={<Done />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Home onModelReady={() => { ready.current = true; }} />} />
        </Routes>
      </Suspense>
    </>
  );
}
