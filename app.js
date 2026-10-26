var palette = { Writing:"#3FB59A", Study:"#5B8DEF", Design:"#E0629E", Video:"#F29A4A", Productivity:"#3EB6D8", Career:"#D9A83C", Coding:"#9B7BF0" };
var cats = ["All"];
tools.forEach(function (t) { if (cats.indexOf(t.cat) === -1) cats.push(t.cat); });

function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var cat = "All", onlyFree = load("free") === "1", compact = load("compact") === "1";
var search = document.getElementById("search");
var sug = document.getElementById("sug");
var list = document.getElementById("list");
var root = document.documentElement;

function colorOf(c) { return palette[c] || "#B08528"; }
function tint(h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
function host(link) { try { return new URL(link).hostname; } catch (e) { return ""; } }
function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function matches(t, q) {
  if (!q) return true;
  var n = norm(q);
  return (n && norm(t.name).indexOf(n) !== -1) || (t.name + " " + t.desc + " " + t.cat).toLowerCase().indexOf(q) !== -1;
}
function favicon(link) { return "https://www.google.com/s2/favicons?domain=" + host(link) + "&sz=128"; }

/* settings */
var panel = document.getElementById("panel"), setBtn = document.getElementById("setBtn");
var optDark = document.getElementById("optDark"), optFree = document.getElementById("optFree"), optCompact = document.getElementById("optCompact");
function syncOptions() {
  optDark.checked = root.getAttribute("data-theme") === "dark";
  optFree.checked = onlyFree;
  optCompact.checked = compact;
  list.classList.toggle("compact", compact);
}
setBtn.onclick = function () { panel.hidden = !panel.hidden; setBtn.setAttribute("aria-expanded", String(!panel.hidden)); };
optDark.onchange = function () { var t = optDark.checked ? "dark" : "light"; root.setAttribute("data-theme", t); save("theme", t); };
optFree.onchange = function () { onlyFree = optFree.checked; save("free", onlyFree ? "1" : "0"); drawFilters(); render(); };
optCompact.onchange = function () { compact = optCompact.checked; save("compact", compact ? "1" : "0"); syncOptions(); };
document.addEventListener("click", function (e) {
  if (!e.target.closest(".sbox")) sug.hidden = true;
  if (!e.target.closest(".top .wrap")) panel.hidden = true;
});

/* filters */
function drawFilters() {
  var html = cats.map(function (c) {
    return '<button class="cat" style="--c:' + (c === "All" ? "#B08528" : colorOf(c)) + '" data-cat="' + c + '" aria-pressed="' + (c === cat) + '"><i></i>' + c + '</button>';
  }).join("");
  html += '<button class="cat" id="freeBtn" aria-pressed="' + onlyFree + '"><i></i>Free only</button>';
  document.getElementById("filters").innerHTML = html;
  document.querySelectorAll("[data-cat]").forEach(function (b) {
    b.onclick = function () { cat = b.dataset.cat; drawFilters(); render(); };
  });
  document.getElementById("freeBtn").onclick = function () { onlyFree = !onlyFree; save("free", onlyFree ? "1" : "0"); syncOptions(); drawFilters(); render(); };
}

/* cards */
function letterBadge(av) { av.style.background = av.dataset.color; av.textContent = av.dataset.letter; }
function render() {
  var q = search.value.toLowerCase().trim();
  var out = tools.filter(function (t) {
    return (cat === "All" || t.cat === cat) && (!onlyFree || t.free) && matches(t, q);
  });
  document.getElementById("count").textContent = out.length + (out.length === 1 ? " tool" : " tools");
  list.innerHTML = out.length ? out.map(function (t, i) {
    var c = colorOf(t.cat);
    return '<li class="card" style="--c:' + c + ';--t:' + tint(c, 0.13) + ';--i:' + Math.min(i, 10) + '">' +
      '<div class="head"><div class="av" data-color="' + c + '" data-letter="' + t.name[0] + '">' +
        '<img src="' + favicon(t.link) + '" alt="" loading="lazy"></div>' +
      '<div><span class="nm">' + t.name + '</span><span class="tag' + (t.free ? '' : ' paid') + '">' + (t.free ? 'Free' : 'Paid') + '</span>' +
        '<span class="cn">' + t.cat + '</span></div></div>' +
      '<p class="ds">' + t.desc + '</p>' +
      '<a class="go" href="' + t.link + '" target="_blank" rel="noopener">Open ' + t.name + ' <span>&rarr;</span></a></li>';
  }).join("") : '<li class="empty">No tools match. Try a different word or clear the filters.</li>';
  document.querySelectorAll(".av img").forEach(function (img) {
    img.onerror = function () { letterBadge(img.parentNode); };
    if (img.complete && img.naturalWidth === 0) { letterBadge(img.parentNode); }
  });
}

/* search suggestions */
function suggest() {
  var q = search.value.toLowerCase().trim();
  if (!q) { sug.hidden = true; return; }
  var n = norm(q);
  var hits = tools.filter(function (t) { return matches(t, q); });
  hits.sort(function (a, b) {
    function rank(t) { var i = norm(t.name).indexOf(n); return i === 0 ? 0 : i > 0 ? 1 : 2; }
    return rank(a) - rank(b);
  });
  hits = hits.slice(0, 6);
  if (!hits.length) {
    sug.innerHTML = '<li class="none"></li>';
    sug.firstChild.textContent = 'No tool called "' + search.value.trim() + '" yet. Try another word.';
  } else {
    sug.innerHTML = hits.map(function (t) {
      return '<li data-i="' + tools.indexOf(t) + '"><img src="' + favicon(t.link) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
        '<b>' + t.name + '</b><small>' + t.cat + '</small></li>';
    }).join("");
    sug.querySelectorAll("li").forEach(function (li) {
      li.onclick = function () { window.open(tools[li.dataset.i].link, "_blank", "noopener"); sug.hidden = true; };
    });
  }
  sug.hidden = false;
}
search.addEventListener("input", function () { render(); suggest(); });
search.addEventListener("focus", suggest);
search.addEventListener("keydown", function (e) { if (e.key === "Enter") sug.hidden = true; });

document.querySelectorAll(".tasks button").forEach(function (b) {
  b.onclick = function () { search.value = b.dataset.q; render(); sug.hidden = true; };
});

syncOptions();
drawFilters();
render();
