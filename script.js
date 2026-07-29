/* =================================================================
   CONFIG
   ================================================================= */
const CONFIG = {
  DISCORD_ID: "1142164320772444281",

  DISCORD_USERNAME: "worldmachine.exist",
};
/* ================================================================= */


/* ---------- year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------- skill bars ---------- */
const skillIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const bar = e.target.querySelector(".bar i");
    bar.style.width = Math.min(100, +e.target.dataset.level || 0) + "%";
    skillIO.unobserve(e.target);
  });
}, { threshold: 0.4 });
document.querySelectorAll(".skill").forEach((el) => skillIO.observe(el));

/* ---------- card spotlight ---------- */
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("pointermove", (ev) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", ev.clientX - r.left + "px");
    card.style.setProperty("--my", ev.clientY - r.top + "px");
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--mx", "-999px");
    card.style.setProperty("--my", "-999px");
  });
});

/* ---------- typewriter ---------- */
(function typewriter() {
  const el = document.querySelector(".typed");
  if (!el) return;
  const words = (el.dataset.words || "hello").split("|").map((s) => s.trim());
  let w = 0, i = 0, deleting = false;

  (function tick() {
    const word = words[w];
    el.textContent = word.slice(0, i);
    let delay = deleting ? 45 : 85;

    if (!deleting && i === word.length) { deleting = true; delay = 1700; }
    else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 320; }
    else i += deleting ? -1 : 1;

    setTimeout(tick, delay);
  })();
})();

/* ---------- starfield ---------- */
(function stars() {
  const c = document.getElementById("stars");
  if (!c) return;
  const ctx = c.getContext("2d");
  let dots = [];

  function resize() {
    c.width = innerWidth;
    c.height = innerHeight;
    const count = Math.min(130, Math.round((innerWidth * innerHeight) / 16000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random(),
      s: Math.random() * 0.012 + 0.003,
      vy: Math.random() * 0.12 + 0.02,
    }));
  }

  function loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const d of dots) {
      d.a += d.s;
      d.y -= d.vy;
      if (d.y < -2) { d.y = c.height + 2; d.x = Math.random() * c.width; }
      ctx.globalAlpha = 0.25 + Math.abs(Math.sin(d.a)) * 0.6;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }

  resize();
  addEventListener("resize", resize);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) loop();
})();


/* =================================================================
   DISCORD  —  live presence via Lanyard (WebSocket + REST fallback)
   ================================================================= */
const box = document.getElementById("discord");
const hint = document.getElementById("discord-hint");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

const mmss = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
};

const STATUS_LABEL = { online: "online", idle: "idle", dnd: "do not disturb", offline: "offline" };

function assetUrl(appId, key) {
  if (!key) return null;
  if (key.startsWith("mp:external/")) return "https://media.discordapp.net/" + key.slice(3);
  if (key.startsWith("mp:")) return "https://media.discordapp.net/" + key.slice(3);
  if (key.startsWith("spotify:")) return "https://i.scdn.co/image/" + key.slice(8);
  return `https://cdn.discordapp.com/app-assets/${appId}/${key}.png`;
}

function showFallback(msg) {
  box.innerHTML = `
    <div class="dc-banner"></div>
    <div class="dc-body">
      <div class="dc-top">
        <div class="dc-avatar-wrap">
          <img class="dc-avatar" alt="" src="https://cdn.discordapp.com/embed/avatars/0.png">
          <span class="dc-status offline"></span>
        </div>
        <div class="dc-names">
          <div class="dc-display">${esc(CONFIG.DISCORD_USERNAME)}</div>
          <div class="dc-tag">@${esc(CONFIG.DISCORD_USERNAME)}</div>
        </div>
      </div>
    </div>`;
  hint.hidden = false;
  hint.innerHTML = msg;
}

let spotifyTimer = null;

function render(d) {
  clearInterval(spotifyTimer);
  hint.hidden = true;

  const u = d.discord_user || {};
  const status = d.discord_status || "offline";
  const avatar = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}${u.avatar.startsWith("a_") ? ".gif" : ".png"}?size=256`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  const banner = d.kv?.banner
    ? `background-image:url('${esc(d.kv.banner)}');background-size:cover;background-position:center`
    : "";

  const display = u.global_name || u.display_name || u.username || CONFIG.DISCORD_USERNAME;

  /* custom status (type 4) */
  const custom = (d.activities || []).find((a) => a.type === 4);
  let customHtml = "";
  if (custom && (custom.state || custom.emoji)) {
    let emo = "";
    if (custom.emoji?.id) {
      emo = `<img src="https://cdn.discordapp.com/emojis/${custom.emoji.id}.${custom.emoji.animated ? "gif" : "png"}?size=32" style="width:18px;height:18px;vertical-align:-3px;margin-right:6px">`;
    } else if (custom.emoji?.name) {
      emo = esc(custom.emoji.name) + " ";
    }
    customHtml = `<div class="dc-block"><div class="dc-block-h">custom status</div>
      <div style="font-size:.9rem;color:#d6d5e4">${emo}${esc(custom.state || "")}</div></div>`;
  }

  /* spotify */
  let spotifyHtml = "";
  if (d.listening_to_spotify && d.spotify) {
    const s = d.spotify;
    spotifyHtml = `<div class="dc-block">
      <div class="dc-block-h">🎵 listening to spotify</div>
      <div class="dc-act">
        <img class="dc-act-img" src="${esc(s.album_art_url || "")}" alt="">
        <div class="dc-act-txt">
          <b>${esc(s.song)}</b>
          <small>by ${esc(s.artist)}</small>
          <small>on ${esc(s.album)}</small>
        </div>
      </div>
      <div class="dc-prog">
        <div class="dc-prog-bar"><i id="sp-fill" style="width:0%"></i></div>
        <div class="dc-prog-time"><span id="sp-now">0:00</span><span>${mmss(s.timestamps.end - s.timestamps.start)}</span></div>
      </div>
    </div>`;
  }

  /* other activities (games / apps / vscode …) */
  const acts = (d.activities || []).filter((a) => a.type !== 4 && a.name !== "Spotify");
  let actsHtml = "";
  if (acts.length) {
    actsHtml = `<div class="dc-block"><div class="dc-block-h">🎮 activity</div>` +
      acts.map((a) => {
        const img = assetUrl(a.application_id, a.assets?.large_image) ||
                    assetUrl(a.application_id, a.assets?.small_image);
        const lines = [a.details, a.state].filter(Boolean).map((l) => `<small>${esc(l)}</small>`).join("");
        return `<div class="dc-act">
          ${img ? `<img class="dc-act-img" src="${esc(img)}" alt="">` : `<div class="dc-act-img"></div>`}
          <div class="dc-act-txt"><b>${esc(a.name)}</b>${lines}</div>
        </div>`;
      }).join("") + `</div>`;
  }

  box.innerHTML = `
    <div class="dc-banner" style="${banner}"></div>
    <div class="dc-body">
      <div class="dc-top">
        <div class="dc-avatar-wrap">
          <img class="dc-avatar" src="${esc(avatar)}" alt="discord avatar">
          <span class="dc-status ${status}" title="${STATUS_LABEL[status]}"></span>
        </div>
        <div class="dc-names">
          <div class="dc-display">${esc(display)}
            <span class="dc-state ${status}">${STATUS_LABEL[status]}</span>
          </div>
          <div class="dc-tag">@${esc(u.username || CONFIG.DISCORD_USERNAME)}</div>
        </div>
      </div>
      ${customHtml}${spotifyHtml}${actsHtml}
    </div>`;

  /* live spotify progress */
  if (d.listening_to_spotify && d.spotify) {
    const { start, end } = d.spotify.timestamps;
    const fill = document.getElementById("sp-fill");
    const now = document.getElementById("sp-now");
    const upd = () => {
      const p = Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
      if (fill) fill.style.width = p * 100 + "%";
      if (now) now.textContent = mmss(Date.now() - start);
    };
    upd();
    spotifyTimer = setInterval(upd, 1000);
  }
}

const NOT_MONITORED = `Lanyard doesn't see this user yet. Join
  <a href="https://discord.gg/lanyard" target="_blank" rel="noopener">discord.gg/lanyard</a>
  once with your account (you can leave later — it keeps working), and make sure
  <code>DISCORD_ID</code> in <code>script.js</code> is your numeric user ID.`;

function connect() {
  if (!/^\d{17,20}$/.test(CONFIG.DISCORD_ID)) {
    showFallback(`Set <code>DISCORD_ID</code> in <code>script.js</code> to your numeric Discord user ID
      (Settings → Advanced → Developer Mode → right-click avatar → Copy User ID).`);
    return;
  }

  // REST first for instant paint
  fetch(`https://api.lanyard.rest/v1/users/${CONFIG.DISCORD_ID}`)
    .then((r) => r.json())
    .then((j) => { if (j.success) render(j.data); else showFallback(NOT_MONITORED); })
    .catch(() => {});

  // then WebSocket for live updates
  let ws, hb, retry = 0;

  const open = () => {
    ws = new WebSocket("wss://api.lanyard.rest/socket");

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.op === 1) {
        clearInterval(hb);
        hb = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op: 3 })),
                         msg.d.heartbeat_interval);
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: CONFIG.DISCORD_ID } }));
      }
      if (msg.op === 0 && msg.d?.discord_user) { retry = 0; render(msg.d); }
    };

    ws.onclose = () => {
      clearInterval(hb);
      retry++;
      if (retry <= 6) setTimeout(open, Math.min(15000, 1200 * retry));
    };
    ws.onerror = () => ws.close();
  };

  open();
}

connect();
