/*
 * "More from Fourth Meridian": the strip of other games that every Fourth Meridian game shows.
 * Served from https://fourthmeridiangames.com/kit/more.js; it reads the live list at /games.json, so a new game
 * shows up in every game's strip as soon as the hub is published, without republishing the games.
 *
 * A game marks where the strip goes with an element carrying data-fm-more="<its id>". The element may already
 * hold a baked copy (written by the hub's kit at the game's build); this script replaces it with the live list.
 * Elements added later (for example by React) are filled as they appear.
 */
(function () {
  if (window.__fmMore) return;
  window.__fmMore = true;
  var SITE = 'https://fourthmeridiangames.com/';
  var MAX = 3;
  var catalog = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function withFrom(url, id) {
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'from=' + encodeURIComponent(id);
  }
  // Same order as the hub's relatedGames(): shared tags (Daily counts half), then the hub's own order.
  function related(games, id) {
    var self = null;
    for (var i = 0; i < games.length; i++) if (games[i].id === id) self = games[i];
    var tags = self ? self.tags : [];
    return games
      .map(function (g, i) {
        var s = 0;
        for (var j = 0; j < g.tags.length; j++) if (tags.indexOf(g.tags[j]) !== -1) s += g.tags[j] === 'Daily' ? 0.5 : 1;
        return { g: g, s: s, i: i };
      })
      .filter(function (x) { return x.g.id !== id; })
      .sort(function (a, b) { return b.s - a.s || a.i - b.i; })
      .slice(0, MAX)
      .map(function (x) { return x.g; });
  }
  function fill(el) {
    var id = el.getAttribute('data-fm-more');
    var games = related(catalog.games, id);
    if (!games.length) return;
    el.classList.add('fm-more');
    el.setAttribute('data-fm-filled', 'live');
    el.innerHTML =
      '<p class="fm-more-title">More from Fourth Meridian</p>' +
      '<ul class="fm-more-list">' +
      games.map(function (g) {
        return '<li><a href="' + esc(withFrom(g.url, id)) + '"><strong>' + esc(g.name) + '</strong><span>' + esc(g.tagline) + '</span></a></li>';
      }).join('') +
      '</ul>' +
      '<a class="fm-more-all" href="' + esc(withFrom(SITE, id)) + '">All games<span aria-hidden="true"> →</span></a>';
  }
  function fillAll() {
    if (!catalog) return;
    var els = document.querySelectorAll('[data-fm-more]:not([data-fm-filled="live"])');
    for (var i = 0; i < els.length; i++) fill(els[i]);
  }
  fetch(SITE + 'games.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.games) return;
      catalog = data;
      fillAll();
      if (window.MutationObserver) new MutationObserver(fillAll).observe(document.body, { childList: true, subtree: true });
    })
    .catch(function () { /* the baked copy (if any) stays */ });
})();
