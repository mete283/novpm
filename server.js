const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// public klasöründeki statik dosyaları (index.html, sw.js) dışarı sunar
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint'i
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URL parametresi eksik.');

  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    followRedirects: true,
    pathRewrite: () => '',
    onProxyReq: (proxyReq) => {
      // Tarayıcı başlıklarını taklit eder
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    },
    onProxyRes: (proxyRes) => {
      // iframe engellerini ve CSP kısıtlamalarını temizler
      delete proxyRes.headers['x-frame-options'];
      delete proxyRes.headers['content-security-policy'];
      proxyRes.headers['access-control-allow-origin'] = '*';
    }
  })(req, res, next);
});

app.listen(PORT, () => {
  console.log(`noVPN Server ${PORT} portunda aktif.`);
});
