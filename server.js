'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const geoip = require('geoip-lite');
const Pricing = require('./public/js/pricing.js');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.jsonl');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || '';

app.disable('x-powered-by');
app.set('trust proxy', 1); // Render стоит за прокси, нужен настоящий IP гостя

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}

function isKyrgyzstanRequest(req) {
  const ip = getClientIp(req);
  if (!ip) return false;
  const normalized = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const location = geoip.lookup(normalized);
  return Boolean(location && location.country === 'KG');
}

/* ---------- ограничение доступа: Кыргызстан — запрет, VPN изменяет IP и доступ открывается ---------- */
app.use((req, res, next) => {
  if (req.path === '/api/health') return next();
  if (isKyrgyzstanRequest(req)) {
    return res.status(403).type('text/html').send(
      '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Доступ ограничен</title></head>' +
      '<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f6f3ef;color:#1e1b1a;">' +
      '<div style="max-width:560px;padding:32px 28px;border-radius:18px;background:#fff;box-shadow:0 12px 30px rgba(0,0,0,.08);text-align:center;">' +
      '<h1 style="margin:0 0 12px;font-size:2rem;">Доступ ограничен</h1>' +
      '<p style="margin:0;line-height:1.6;">Сайт недоступен для запросов из Кыргызстана. Подключите VPN, и доступ будет открыт, если ваш публичный IP будет не из Кыргызстана.</p>' +
      '</div></body></html>'
    );
  }
  next();
});

/* ---------- заголовки безопасности ---------- */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; " +
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  );
  next();
});

app.use(express.json({ limit: '20kb' }));

/* ---------- статические файлы сайта ---------- */
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '10m' }));

/* ---------- проверка работоспособности (для Render) ---------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ---------- ограничение частоты заявок: 5 за 10 минут с одного IP ---------- */
const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) {
    const fresh = list.filter((t) => now - t < 10 * 60 * 1000);
    if (fresh.length) hits.set(ip, fresh);
    else hits.delete(ip);
  }
}, 10 * 60 * 1000).unref();

function clean(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .trim()
    .slice(0, max);
}

async function notifyTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  try {
    const r = await fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text }),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) console.error('Telegram ответил статусом', r.status);
  } catch (e) {
    console.error('Не удалось отправить уведомление в Telegram:', e.message);
  }
}

/* ---------- приём заявки ---------- */
app.post('/api/booking', async (req, res) => {
  if (tooMany(req.ip)) {
    return res.status(429).json({ ok: false, error: 'Слишком много заявок. Попробуйте через несколько минут или позвоните нам.' });
  }
  const b = req.body;
  if (!b || typeof b !== 'object' || Array.isArray(b)) {
    return res.status(400).json({ ok: false, error: 'Некорректные данные заявки.' });
  }

  const contact = { name: clean(b.name, 80), phone: clean(b.phone, 30), comment: clean(b.comment, 500) };
  if (contact.name.length < 2) return res.status(400).json({ ok: false, error: 'Укажите имя.' });
  if (!/^[0-9+()\-\s]{7,30}$/.test(contact.phone) || contact.phone.replace(/\D/g, '').length < 7) {
    return res.status(400).json({ ok: false, error: 'Укажите телефон для связи.' });
  }

  // Стоимость пересчитывается на сервере из тех же правил, что и на странице.
  const c = Pricing.calc({
    checkin: b.checkin,
    checkout: b.checkout,
    roomId: String(b.roomId || ''),
    rooms: b.rooms,
    adults: b.adults,
    children: b.children,
    breakfast: b.breakfast === true,
    transfer: b.transfer,
    tourId: String(b.tourId || '0'),
    confType: String(b.confType || '0'),
    confDays: b.confDays
  });
  if (!c.ok) return res.status(400).json({ ok: false, error: c.msg });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  if (c.d1 < yesterday) {
    return res.status(400).json({ ok: false, error: 'Дата заезда уже прошла. Выберите другую.' });
  }

  const id = 'AT-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
  const text = Pricing.buildText(c, contact, id);
  const record = {
    id,
    createdAt: new Date().toISOString(),
    checkin: b.checkin,
    checkout: b.checkout,
    room: c.room.name,
    total: c.total,
    name: contact.name,
    phone: contact.phone,
    text
  };

  console.log('НОВАЯ ЗАЯВКА\n' + text + '\n');

  // На бесплатном Render файлы стираются при перезапуске. Это резервная копия, основной канал: Telegram и логи.
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(BOOKINGS_FILE, JSON.stringify(record) + '\n');
  } catch (e) {
    console.error('Не удалось записать заявку в файл:', e.message);
  }
  await notifyTelegram(text);

  res.json({ ok: true, id, total: c.total, text });
});

/* ---------- простой список заявок для администратора ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function sha(s) {
  return crypto.createHash('sha256').update(String(s)).digest();
}
app.get('/admin/bookings', (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(404).type('text/plain; charset=utf-8').send('Не найдено');
  const header = req.headers.authorization || '';
  let pass = '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    pass = decoded.slice(decoded.indexOf(':') + 1);
  }
  if (!crypto.timingSafeEqual(sha(pass), sha(ADMIN_PASSWORD))) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Ала-Тоо Inn, заявки", charset="UTF-8"');
    return res.status(401).type('text/plain; charset=utf-8').send('Нужен пароль');
  }
  let rows = [];
  try {
    rows = fs.readFileSync(BOOKINGS_FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).reverse();
  } catch (e) {
    rows = [];
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.type('html').send(
    '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Заявки</title><style>body{font:15px system-ui,sans-serif;margin:16px}table{border-collapse:collapse;width:100%}' +
      'td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}pre{margin:0;white-space:pre-wrap}</style></head><body>' +
      '<h1>Заявки (' + rows.length + ')</h1><p>Файл хранится только до перезапуска сервера на бесплатном Render.</p>' +
      '<div style="overflow-x:auto"><table><tr><th>№</th><th>Когда</th><th>Заявка</th></tr>' +
      rows.map((r) => '<tr><td>' + esc(r.id) + '</td><td>' + esc(r.createdAt) + '</td><td><pre>' + esc(r.text) + '</pre></td></tr>').join('') +
      '</table></div></body></html>'
  );
});

/* ---------- ошибки ---------- */
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'Не найдено' });
});
app.use((req, res) => {
  res.status(404).type('html').send(
    '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Страница не найдена</title></head>' +
      '<body style="font-family:system-ui,sans-serif;padding:32px"><h1>Страница не найдена</h1><p><a href="/">Вернуться на главную</a></p></body></html>'
  );
});
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'Некорректные данные заявки.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, error: 'Слишком большой запрос.' });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: 'Ошибка сервера. Попробуйте позже.' });
});

app.listen(PORT, HOST, () => {
  console.log('Ала-Тоо Inn запущен: http://' + HOST + ':' + PORT);
});
