/*
 * Fourth Meridian visit counter, served from https://fourthmeridiangames.com/kit/pulse.js and loaded by kit/more.js
 * (so every game gets it from the hub) and by the hub's own pages.
 *
 * Privacy (the usual bar for consent-free audience measurement):
 *   - No cookies and no ID. This browser keeps one small record, "fm:visits": for each game, the first and last day
 *     it visited and on how many days. It is reset after 13 months.
 *   - At most one report per game per day, and it carries only buckets: new or returning, days since the last visit,
 *     how many days in total, and the referring site's host. The server adds 1 to daily totals and keeps nothing else.
 *   - Skipped entirely on staging, localhost, automated browsers, and browsers that send Do Not Track or Global
 *     Privacy Control. If the browser won't store the record, nothing is sent (it couldn't be counted once a day).
 */
(function () {
  if (window.__fmPulse) return;
  window.__fmPulse = true;
  try {
    if (location.hostname !== 'fourthmeridiangames.com' || /-staging\//.test(location.pathname) || navigator.webdriver) return;
    if (navigator.globalPrivacyControl || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

    var GAME_BY_PATH = { '': 'hub', games: 'hub', about: 'hub', contact: 'hub', trendle: 'trendle', streetle: 'streetle', hatama: 'hatama', glossle: 'glossle' };
    var game = GAME_BY_PATH[location.pathname.split('/')[1] || ''];
    if (!game) return;

    var DAY = 864e5;
    var today = new Date().toISOString().slice(0, 10);
    var now = Date.parse(today);
    var KEY = 'fm:visits';
    var all = {};
    try { all = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { all = {}; }
    var rec = all[game];
    if (rec && !(now - Date.parse(rec.first) <= 395 * DAY)) rec = null; // 13 months, or a damaged record
    if (rec && rec.last === today) return; // already counted today

    var r = 'new', gap = '', days = 1;
    if (rec) {
      r = 'returning';
      var since = Math.round((now - Date.parse(rec.last)) / DAY);
      gap = since <= 1 ? '1d' : since <= 7 ? '2-7d' : since <= 30 ? '8-30d' : '31d+';
      days = (rec.days || 1) + 1;
    }
    all[game] = { first: rec ? rec.first : today, last: today, days: days };
    localStorage.setItem(KEY, JSON.stringify(all));
    if (JSON.parse(localStorage.getItem(KEY))[game].last !== today) return;

    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { ref = ''; }
    var body = JSON.stringify({
      g: game,
      r: r,
      gap: gap,
      days: days === 1 ? '1' : days === 2 ? '2' : days <= 6 ? '3-6' : days <= 29 ? '7-29' : '30+',
      ref: ref,
    });
    var url = 'https://pulse.fourthmeridiangames.com/v1/hit';
    if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) {
      fetch(url, { method: 'POST', body: body, keepalive: true, mode: 'cors', credentials: 'omit' }).catch(function () {});
    }
  } catch (e) {
    // Counting must never break a game.
  }
})();
