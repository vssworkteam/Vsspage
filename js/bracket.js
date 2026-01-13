/**
 * ✅ 需求 1：三個階段分數都你自己填
 * 這裡不做任何「自動推進分數」或「覆蓋比分」
 * 你要改比分，就改 data.rounds 內的 score
 *
 * ✅ 需求 2：線/區塊對齊
 * 用 SVG 依照 DOM 實際位置畫線，並抓「兩隊名字中間」的 y 當錨點
 */

const data = {
  rounds: [
    {
      title: "小組賽",
      roundIndex: 1,
      matches: [
        { id:"r1m1", bo:1, date:"02/27 19:00", state:"未開始",
          a:{ name:"TBD", score:0, win:false },
          b:{ name:"TBD", score:0, win:false }
        },
        { id:"r1m2", bo:1, date:"02/27 20:00", state:"未開始",
          a:{ name:"TBD", score:0, win:false },
          b:{ name:"TBD", score:0, win:false }
        },
        { id:"r1m3", bo:1, date:"02/27 21:00", state:"未開始",
          a:{ name:"TBD", score:0, win:false },
          b:{ name:"TBD", score:0, win:false }
        },
        { id:"r1m4", bo:1, date:"02/27 22:00", state:"未開始",
          a:{ name:"TBD", score:0, win:false },
          b:{ name:"TBD", score:0, win:false }
        },
      ]
    },
    {
      title: "晉級賽",
      roundIndex: 2,
      matches: [
        { id:"r2m1", bo:3, date:"02/28 19:00", state:"未開始",
          a:{ name:"TBD", score:0, win:false },
          b:{ name:"TBD", score:0, win:false }
        },
        { id:"r2m2", bo:3, date:"02/28 21:30", state:"未開始",
          a:{ name:"TBD", score:0, win:false },
          b:{ name:"TBD", score:0, win:false }
        },
      ]
    },
    {
      title: "決賽",
      roundIndex: 3,
      matches: [
        { id:"r3m1", bo:5, date:"03/01 19:00", state:"未開始",
          a:{ name:"TBD", score:null, win:false },
          b:{ name:"TBD", score:null, win:false }
        }
      ]
    }
  ],

  // ✅ bracket 連線關係（固定淘汰賽結構）
  // r1m1 + r1m2 -> r2m1
  // r1m3 + r1m4 -> r2m2
  // r2m1 + r2m2 -> r3m1
  links: [
    { from:"r1m1", to:"r2m1" },
    { from:"r1m2", to:"r2m1" },
    { from:"r1m3", to:"r2m2" },
    { from:"r1m4", to:"r2m2" },
    { from:"r2m1", to:"r3m1" },
    { from:"r2m2", to:"r3m1" },
  ]
};

const root = document.getElementById("bracketRoot");
const wires = document.getElementById("wires");
const stage = document.getElementById("stage");

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function scoreText(v){ return (v === null || v === undefined) ? "—" : String(v); }

function render(){
  root.innerHTML = "";

  for (const rd of data.rounds){
    const col = document.createElement("section");
    col.className = "round";
    col.dataset.round = String(rd.roundIndex);

    const title = document.createElement("div");
    title.className = "roundTitle";
    title.textContent = rd.title;

    const body = document.createElement("div");
    body.className = "roundBody";

    for (const m of rd.matches){
      const wrap = document.createElement("div");
      wrap.className = "matchWrap";
      wrap.dataset.matchWrapId = m.id;

      const el = document.createElement("article");
      el.className = "match";
      el.dataset.matchId = m.id;

      const dateText = m.date ?? "TBD"; // 沒填就顯示 TBD
      el.innerHTML = `
        <div class="metaBar">
          <div class="metaLeft">
            <span class="boPill">BO${esc(m.bo)}</span>
            <span class="datePill">${esc(dateText)}</span>
          </div>
          <span class="state">${esc(m.state)}</span>
        </div>

        <div class="team ${m.a?.win ? "win" : ""}" data-side="a">
          <span>${esc(m.a?.name || "TBD")}</span>
          <b>${esc(scoreText(m.a?.score))}</b>
        </div>

        <div class="team ${m.b?.win ? "win" : ""}" data-side="b">
          <span>${esc(m.b?.name || "TBD")}</span>
          <b>${esc(scoreText(m.b?.score))}</b>
        </div>
      `;

      wrap.appendChild(el);
      body.appendChild(wrap);
    }

    col.appendChild(title);
    col.appendChild(body);
    root.appendChild(col);
  }
}

/** 取得「兩隊名字中間」的 y（Stage 座標） */
function midY(matchEl){
  const a = matchEl.querySelector('.team[data-side="a"]');
  const b = matchEl.querySelector('.team[data-side="b"]');
  if (!a || !b) return null;

  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  const rs = stage.getBoundingClientRect();
  return ((ra.bottom + rb.top) / 2) - rs.top;
}

function anchorRight(matchEl){
  const r = matchEl.getBoundingClientRect();
  const rs = stage.getBoundingClientRect();
  return { x: (r.right - rs.left), y: midY(matchEl) };
}
function anchorLeft(matchEl){
  const r = matchEl.getBoundingClientRect();
  const rs = stage.getBoundingClientRect();
  return { x: (r.left - rs.left), y: midY(matchEl) };
}

/**
 * ✅ 置中對齊核心：
 * 對每個 to match，找 links 的兩個 from，取它們 midY 平均，讓 to match 的 midY = 平均值
 */
function positionMatches(){
  // 先把所有 translateY 清掉
  document.querySelectorAll(".matchWrap").forEach(w => w.style.transform = "translateY(0px)");

  // 建立：to -> [from, from]
  const toMap = new Map();
  for (const l of data.links){
    if (!toMap.has(l.to)) toMap.set(l.to, []);
    toMap.get(l.to).push(l.from);
  }

  // 依輪次順序處理：先 round2 再 round3（因為 round3 依賴 round2 的位置）
  const order = ["r2", "r3"];

  for (const prefix of order){
    for (const [toId, fromIds] of toMap.entries()){
      if (!toId.startsWith(prefix)) continue;
      if (fromIds.length < 2) continue;

      const toEl = root.querySelector(`[data-match-id="${CSS.escape(toId)}"]`);
      const toWrap = root.querySelector(`[data-match-wrap-id="${CSS.escape(toId)}"]`);
      const fromEl1 = root.querySelector(`[data-match-id="${CSS.escape(fromIds[0])}"]`);
      const fromEl2 = root.querySelector(`[data-match-id="${CSS.escape(fromIds[1])}"]`);
      if (!toEl || !toWrap || !fromEl1 || !fromEl2) continue;

      const y1 = midY(fromEl1);
      const y2 = midY(fromEl2);
      const yt = midY(toEl);
      if (y1 == null || y2 == null || yt == null) continue;

      const target = (y1 + y2) / 2;
      const delta = target - yt;

      toWrap.style.transform = `translateY(${delta}px)`;
    }
  }
}

function drawWires(){
  wires.innerHTML = "";
  const rs = stage.getBoundingClientRect();
  wires.setAttribute("viewBox", `0 0 ${rs.width} ${rs.height}`);

  const dx = 52;

  for (const link of data.links){
    const fromEl = root.querySelector(`[data-match-id="${CSS.escape(link.from)}"]`);
    const toEl   = root.querySelector(`[data-match-id="${CSS.escape(link.to)}"]`);
    if (!fromEl || !toEl) continue;

    const p1 = anchorRight(fromEl);
    const p2 = anchorLeft(toEl);
    if (p1.y == null || p2.y == null) continue;

    const xMid = p1.x + dx;
    const d = `M ${p1.x} ${p1.y} H ${xMid} V ${p2.y} H ${p2.x}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    wires.appendChild(path);
  }
}

function reroute(){
  requestAnimationFrame(() => {
    positionMatches();  // ✅ 先把卡片移到正中間
    requestAnimationFrame(() => {
      drawWires();      // ✅ 再依新位置畫線
    });
  });
}

render();
reroute();

window.addEventListener("resize", reroute);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(reroute);