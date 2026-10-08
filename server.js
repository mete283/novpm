const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// public klasöründeki index.html ve statik dosyaları sunar
app.use(express.static(path.join(__dirname, 'public')));

// Proxy Endpoint
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URL parametresi eksik.');

  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: (path, req) => '',
    onProxyReq: (proxyReq) => {
      // Masaüstü Chrome başlıkları enjekte edilir
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
    },
    onProxyRes: (proxyRes) => {
      // Güvenlik başlıkları temizlenir
      delete proxyRes.headers['x-frame-options'];
      delete proxyRes.headers['content-security-policy'];
      delete proxyRes.headers['content-security-policy-report-only'];
      proxyRes.headers['access-control-allow-origin'] = '*';
    },
    onError: (err, req, res) => {
      // Sunucunun çökmesini (502 vermesini) engeller
      console.error('Proxy Hatası:', err);
      res.status(500).send('Hedef siteye bağlanırken bir hata oluştu.');
    }
  })(req, res, next);
});

app.listen(PORT, () => {
  console.log(`noVPN Server ${PORT} portunda aktif.`);
});
