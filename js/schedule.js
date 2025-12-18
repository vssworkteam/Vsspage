// ====== 1) 範例資料（你之後可換成 API / JSON 檔） ======
const matches = [
  {
    id: "m1",
    dateLabel: "Thursday 15 Jan 2026",
    time: "2:00 下午",
    tz: "Asia/Taipei",
    teamA: { name: "ENVY", logo: "assets/placeholder-team.png" },
    teamB: { name: "Evil Geniuses", logo: "assets/placeholder-team.png" },
    status: "upcoming", // upcoming | live | done
    scoreA: null,
    scoreB: null,
    event: "VCT 美洲聯賽",
    stage: "淘汰賽",
    bo: "BO3",
    stream: "Twitch / YouTube"
  },
  {
    id: "m2",
    dateLabel: "Friday 16 Jan 2026",
    time: "1:00 上午",
    tz: "Asia/Taipei",
    teamA: { name: "LOUD", logo: "assets/placeholder-team.png" },
    teamB: { name: "Cloud9", logo: "assets/placeholder-team.png" },
    status: "done",
    scoreA: 2,
    scoreB: 1,
    event: "VCT 美洲聯賽",
    stage: "淘汰賽",
    bo: "BO3",
    stream: "VOD"
  },
  {
    id: "m3",
    dateLabel: "Friday 16 Jan 2026",
    time: "10:00 下午",
    tz: "Asia/Taipei",
    teamA: { name: "KRÜ", logo: "assets/placeholder-team.png" },
    teamB: { name: "FURIA", logo: "assets/placeholder-team.png" },
    status: "live",
    scoreA: 1,
    scoreB: 0,
    event: "VCT 美洲聯賽",
    stage: "淘汰賽",
    bo: "BO3",
    stream: "Live"
  }
];

// ====== 2) 小工具：分組 ======
function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
}

function statusText(s){
  if (s === "live") return "進行中";
  if (s === "done") return "已結束";
  return "即將開始";
}

function scoreText(m){
  if (m.scoreA == null || m.scoreB == null) return "—";
  return `${m.scoreA} : ${m.scoreB}`;
}

// ====== 3) 渲染 ======
const root = document.getElementById("scheduleRoot");
const qInput = document.getElementById("q");
let activeFilter = "all";

function render(){
  const q = (qInput.value || "").trim().toLowerCase();

  const filtered = matches.filter(m => {
    const matchFilter = (activeFilter === "all") ? true : (m.status === activeFilter);
    const matchQuery =
      !q ||
      m.teamA.name.toLowerCase().includes(q) ||
      m.teamB.name.toLowerCase().includes(q) ||
      (m.event || "").toLowerCase().includes(q);

    return matchFilter && matchQuery;
  });

  const groups = groupBy(filtered, m => m.dateLabel);

  root.innerHTML = "";
  for (const [dateLabel, items] of groups.entries()){
    const day = document.createElement("section");
    day.className = "dayGroup";

    day.innerHTML = `
      <div class="dayHeader">
        <div class="dayTitle">${dateLabel}</div>
        <div class="dayCount">${items.length} 場</div>
      </div>
      <div class="dayBody"></div>
    `;

    const body = day.querySelector(".dayBody");

    for (const m of items){
      const row = document.createElement("div");
      row.className = "matchRow";
      row.dataset.id = m.id;

      row.innerHTML = `
        <button class="matchBtn" type="button" aria-expanded="false">
          <div class="timeBox">
            <div class="t">${m.time}</div>
            <div class="tz">${m.tz}</div>
          </div>

          <div class="teamsLine">
            <div class="team">
              <img class="logo" src="${m.teamA.logo}" alt="">
              <span class="teamName">${m.teamA.name}</span>
            </div>
            <div class="vs">VS</div>
            <div class="team" style="justify-content:flex-end;">
              <span class="teamName">${m.teamB.name}</span>
              <img class="logo" src="${m.teamB.logo}" alt="">
            </div>
          </div>

          <div class="rightMeta">
            <span class="badge ${m.status === "live" ? "live" : ""}">${statusText(m.status)}</span>
            <div class="score">${scoreText(m)}</div>
          </div>
        </button>

        <div class="matchDetails">
          <div class="detailGrid">
            <div class="detailCard"><div class="k">賽事</div><div class="v">${m.event}</div></div>
            <div class="detailCard"><div class="k">階段</div><div class="v">${m.stage}</div></div>
            <div class="detailCard"><div class="k">賽制</div><div class="v">${m.bo}</div></div>
            <div class="detailCard"><div class="k">轉播</div><div class="v">${m.stream}</div></div>
            <div class="detailCard"><div class="k">Match ID</div><div class="v">${m.id}</div></div>
          </div>
        </div>
      `;

      // 點一下展開/收合（對應網站的「按一下顯示」行為）:contentReference[oaicite:1]{index=1}
      const btn = row.querySelector(".matchBtn");
      btn.addEventListener("click", () => {
        const open = row.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });

      body.appendChild(row);
    }

    root.appendChild(day);
  }

  if (filtered.length === 0){
    root.innerHTML = `
      <section class="dayGroup">
        <div class="dayHeader">
          <div class="dayTitle">沒有符合條件的比賽</div>
          <div class="dayCount">0 場</div>
        </div>
        <div style="padding:14px 16px; color: var(--muted); font-weight:850;">
          試試看切換篩選條件或改搜尋關鍵字。
        </div>
      </section>
    `;
  }
}

// ====== 4) 篩選 + 搜尋 ======
document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    render();
  });
});

qInput.addEventListener("input", render);

// 初次渲染
render();
