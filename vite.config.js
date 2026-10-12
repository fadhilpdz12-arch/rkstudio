import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';

// Alamat website sebenar. Tukar di Vercel: Settings → Environment Variables → VITE_SITE_URL
const SITE = (process.env.VITE_SITE_URL || 'https://therkstudiobesut.vercel.app').replace(/\/$/, '');

const seo = () => ({
  name: 'rk-seo',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', SITE) },
  closeBundle() {
    const today = new Date().toISOString().slice(0, 10);
    const urls = [['/', '1.0'], ['/?lang=en', '0.9'], ['/tempah', '0.8']];
    writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, pr]) => `  <url><loc>${SITE}${u.replace('&', '&amp;')}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`);
    writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /siap/\n\nSitemap: ${SITE}/sitemap.xml\n`);
  },
});

export default defineConfig({
  plugins: [react(), seo()],
  // header sama macam production supaya boleh uji CSP secara lokal
  preview: { headers: {"Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' blob: data: https://jszfyvquexewkqrcpbfn.supabase.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests", "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()", "Cross-Origin-Opener-Policy": "same-origin"} },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: { three: ['three'], supabase: ['@supabase/supabase-js'] } },
    },
  },
});
