/*
 * Цены, номера, туры и расчёт стоимости.
 * Один файл работает и в браузере (window.Pricing), и на сервере (require).
 * Сервер пересчитывает стоимость сам, поэтому цены менять нужно только здесь.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Pricing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- настройки, которые можно менять ---------- */
  var OFFER_LAST_ARRIVAL = [2026, 11, 30]; // «Четвёртая ночь в подарок»: заезд не позже этой даты [год, месяц, день]
  var BREAKFAST_ADULT = 650;               // сом за взрослого в сутки
  var BREAKFAST_CHILD = 325;               // сом за ребёнка в сутки
  var TRANSFER_ONE_WAY = 3000;
  var TRANSFER_ROUND = 5500;
  var CONF_HALF = 12000;
  var CONF_FULL = 22000;

  var ROOMS = [
    { id: 'std', name: 'Стандарт', price: 4500, cap: 2, area: 18, view: 'во двор',
      feat: ['Двуспальная или две односпальные кровати', 'Душ, фен, набор полотенец', 'Wi‑Fi и рабочий стол'] },
    { id: 'cmf', name: 'Комфорт с видом', price: 6800, cap: 3, area: 26, view: 'на хребет',
      feat: ['Балкон с видом на хребет', 'Кровать king-size и диван', 'Чайная зона'] },
    { id: 'fam', name: 'Семейный', price: 9200, cap: 4, area: 42, view: 'на хребет',
      feat: ['Две спальные зоны и гостиная', 'Ванна и душ', 'Детская кроватка по запросу'] },
    { id: 'lux', name: 'Люкс «Ала-Арча»', price: 14500, cap: 4, area: 58, view: 'панорамный',
      feat: ['Панорамные окна на хребет', 'Камин и гостиная', 'Ванна с видом на горы'] }
  ];

  var TOURS = [
    { id: 'aksay', name: 'Водопад Ак-Сай', days: '1 день', walk: '6–8 ч в пути', lvl: 2, price: 3800,
      pts: [2150, 2230, 2380, 2540, 2700, 2810], desc: 'Тропа по ущелью к водопаду, обед на камнях с видом на ледник.' },
    { id: 'skazka', name: 'Каньон Сказка и Иссык-Куль', days: '1 день', walk: '2–3 ч пешком', lvl: 1, price: 4200,
      pts: [1620, 1650, 1710, 1770, 1730, 1640], desc: 'Красные скалы каньона и остановка на берегу озера.' },
    { id: 'jailoo', name: 'Джайлоо с ночёвкой в юрте', days: '2 дня', walk: 'пешком или верхом', lvl: 1, price: 7500,
      pts: [1900, 2150, 2400, 2650, 2900, 3000], desc: 'Ужин с местной кухней, ночь в юрте, рассвет над долиной.' },
    { id: 'pass', name: 'Перевал и ледник', days: '2 дня', walk: '7–9 ч в день', lvl: 3, price: 11800,
      pts: [2150, 2600, 3100, 3500, 3800, 3860], desc: 'Подъём к языку ледника, ночёвка в приюте, спуск по другому склону.' }
  ];

  /* ---------- вспомогательные функции ---------- */
  function nf(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)); }
  function money(n) { return nf(n) + ' сом'; }
  function pl(n, f) {
    var a = Math.abs(n) % 100, b = a % 10;
    return a > 10 && a < 20 ? f[2] : (b > 1 && b < 5 ? f[1] : (b === 1 ? f[0] : f[2]));
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
    return d;
  }
  function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function ru(d) {
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
  }
  function intIn(v, a, b) {
    var n = parseInt(v, 10);
    if (isNaN(n)) n = a;
    return Math.max(a, Math.min(b, n));
  }

  function season(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    if ((m === 12 && day >= 25) || (m === 1 && day <= 10)) return { key: 'ny', name: 'Новогодний сезон', mult: 1.3 };
    if (m === 12 || m === 1 || m === 2 || (m === 3 && day <= 15)) return { key: 'ski', name: 'Лыжный сезон', mult: 1.15 };
    if ((m === 6 && day >= 15) || m === 7 || m === 8) return { key: 'sum', name: 'Летний сезон', mult: 1.2 };
    return { key: 'off', name: 'Межсезонье', mult: 1 };
  }

  /*
   * params: { checkin:'YYYY-MM-DD', checkout:'YYYY-MM-DD', roomId, rooms, adults, children,
   *           breakfast:boolean, transfer:0|1|2, tourId:'0'|id, confType:'0'|'half'|'full', confDays }
   */
  function calc(params) {
    var p = params || {};
    var d1 = parseDate(p.checkin), d2 = parseDate(p.checkout);
    if (!d1 || !d2) return { ok: false, msg: 'Выберите даты заезда и выезда.' };
    var nights = Math.round((d2 - d1) / 864e5);
    if (nights <= 0) return { ok: false, msg: 'Дата выезда должна быть позже даты заезда.' };
    if (nights > 30) return { ok: false, msg: 'Онлайн можно рассчитать до 30 ночей. На более долгий срок позвоните администратору.' };

    var room = ROOMS.filter(function (x) { return x.id === p.roomId; })[0];
    if (!room) return { ok: false, msg: 'Выберите категорию номера.' };

    var rooms = intIn(p.rooms, 1, 4), ad = intIn(p.adults, 1, 8), ch = intIn(p.children, 0, 6);
    var groups = {}, order = [], sum = 0, cheapest = Infinity;
    for (var i = 0; i < nights; i++) {
      var s = season(addDays(d1, i)), price = Math.round(room.price * s.mult) * rooms;
      if (!groups[s.key]) { groups[s.key] = { name: s.name, mult: s.mult, n: 0, sum: 0 }; order.push(s.key); }
      groups[s.key].n++; groups[s.key].sum += price; sum += price;
      if (price < cheapest) cheapest = price;
    }

    var lines = [];
    order.forEach(function (k) {
      var g = groups[k];
      lines.push({
        l: g.n + ' ' + pl(g.n, ['ночь', 'ночи', 'ночей']) + ' · ' + g.name,
        sub: (g.mult !== 1 ? 'коэффициент ×' + String(g.mult).replace('.', ',') : 'базовая цена') + (rooms > 1 ? ' · ' + rooms + ' ном.' : ''),
        a: g.sum
      });
    });

    var lastArrival = new Date(OFFER_LAST_ARRIVAL[0], OFFER_LAST_ARRIVAL[1] - 1, OFFER_LAST_ARRIVAL[2]);
    var autumn = (d1 <= lastArrival && nights >= 4) ? cheapest : 0;
    var longStay = nights >= 5 ? Math.round(sum * 0.1) : 0;
    var discount = 0, discName = '';
    if (autumn >= longStay && autumn > 0) { discount = autumn; discName = 'Четвёртая ночь в подарок'; }
    else if (longStay > 0) { discount = longStay; discName = 'Скидка 10% от пяти ночей'; }
    if (discount > 0) lines.push({ l: discName, a: -discount, disc: true });

    var total = sum - discount, extras = [];

    if (p.breakfast) {
      var b = nights * (ad * BREAKFAST_ADULT + ch * BREAKFAST_CHILD);
      lines.push({ l: 'Завтраки', sub: nights + ' ' + pl(nights, ['сутки', 'суток', 'суток']) + ' · ' + ad + ' взр.' + (ch ? ' + ' + ch + ' дет.' : ''), a: b });
      total += b; extras.push('завтраки');
    }

    var tr = +p.transfer || 0;
    if (tr !== 0 && tr !== 1 && tr !== 2) return { ok: false, msg: 'Неизвестный вариант трансфера.' };
    if (tr) {
      var t = tr === 1 ? TRANSFER_ONE_WAY : TRANSFER_ROUND;
      lines.push({ l: 'Трансфер', sub: tr === 1 ? 'в одну сторону' : 'туда и обратно', a: t });
      total += t; extras.push('трансфер ' + (tr === 1 ? 'в одну сторону' : 'туда и обратно'));
    }

    var tour = null;
    if (p.tourId && p.tourId !== '0') {
      tour = TOURS.filter(function (x) { return x.id === p.tourId; })[0];
      if (!tour) return { ok: false, msg: 'Неизвестный тур.' };
      var ppl = ad + ch * 0.5, tp = Math.round(tour.price * ppl);
      lines.push({ l: 'Тур: ' + tour.name, sub: nf(tour.price) + ' × ' + String(ppl).replace('.', ',') + ' чел. (ребёнок вдвое дешевле)', a: tp });
      total += tp; extras.push('тур «' + tour.name + '»');
    }

    var ct = p.confType || '0';
    if (ct !== '0' && ct !== 'half' && ct !== 'full') return { ok: false, msg: 'Неизвестный формат аренды зала.' };
    if (ct !== '0') {
      var days = intIn(p.confDays, 1, 5), cp = (ct === 'half' ? CONF_HALF : CONF_FULL) * days;
      lines.push({ l: 'Конференц-зал', sub: (ct === 'half' ? 'полдня' : 'целый день') + ' × ' + days, a: cp });
      total += cp; extras.push('конференц-зал (' + (ct === 'half' ? 'полдня' : 'целый день') + ' × ' + days + ')');
    }

    return {
      ok: true, lines: lines, total: total, nights: nights, d1: d1, d2: d2, room: room,
      rooms: rooms, ad: ad, ch: ch, extras: extras, discount: discount
    };
  }

  /* Текст заявки для администратора. */
  function buildText(c, contact, id) {
    return [
      'Заявка на бронирование, Ала-Тоо Inn' + (id ? ' № ' + id : ''),
      'Даты: ' + ru(c.d1) + ' – ' + ru(c.d2) + ' (' + c.nights + ' ' + pl(c.nights, ['ночь', 'ночи', 'ночей']) + ')',
      'Номер: ' + c.room.name + ' × ' + c.rooms,
      'Гости: ' + c.ad + ' взр.' + (c.ch ? ', ' + c.ch + ' дет.' : ''),
      'Дополнительно: ' + (c.extras.length ? c.extras.join(', ') : 'нет'),
      c.discount ? 'Скидка: −' + money(c.discount) : '',
      'Предварительная стоимость: ' + money(c.total),
      'Имя: ' + contact.name,
      'Телефон: ' + contact.phone,
      contact.comment ? 'Пожелания: ' + contact.comment : ''
    ].filter(Boolean).join('\n');
  }

  return {
    ROOMS: ROOMS, TOURS: TOURS, calc: calc, buildText: buildText,
    nf: nf, money: money, pl: pl, season: season, parseDate: parseDate, ru: ru
  };
});
