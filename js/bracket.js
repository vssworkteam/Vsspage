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
      title: "第1輪",
      roundIndex: 1,
      matches: [
        { id:"r1m1", bo:3, state:"已完賽",
          a:{ name:"G2 Esports", score:0, win:false },
          b:{ name:"Paper Rex", score:2, win:true }
        },
        { id:"r1m2", bo:3, state:"已完賽",
          a:{ name:"Xi Lai Gaming", score:0, win:false },
          b:{ name:"Sentinels", score:2, win:true }
        },
        { id:"r1m3", bo:3, state:"已完賽",
          a:{ name:"Rex Regum Qeon", score:0, win:false },
          b:{ name:"WOLVES ESPORTS", score:2, win:true }
        },
        { id:"r1m4", bo:3, state:"已完賽",
          a:{ name:"FNATIC", score:1, win:false },
          b:{ name:"Gen.G", score:2, win:true }
        },
      ]
    },
    {
      title: "勝部組複賽",
      roundIndex: 2,
      matches: [
        { id:"r2m1", bo:3, state:"已完賽",
          a:{ name:"Paper Rex", score:2, win:false },
          b:{ name:"Sentinels", score:2, win:false }
        },
        { id:"r2m2", bo:3, state:"已完賽",
          a:{ name:"WOLVES ESPORTS", score:2, win:false },
          b:{ name:"Gen.G", score:2, win:false }
        },
      ]
    },
    {
      title: "勝部組決賽",
      roundIndex: 3,
      matches: [
        { id:"r3m1", bo:5, state:"未開始",
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

function scoreText(v){
  return (v === null || v === undefined) ? "—" : String(v);
}

function render(){
  root.innerHTML = "";

  for (const rd of data.rounds){
    const col = document.createElement("section");
    col.className = "round";
    col.dataset.round = String(rd.roundIndex);

    col.innerHTML = `<div class="roundTitle">${esc(rd.title)}</div>`;

    for (const m of rd.matches){
      const el = document.createElement("article");
      el.className = "match";
      el.dataset.matchId = m.id;

      el.innerHTML = `
        <div class="metaBar">
          <span class="boPill">BO${esc(m.bo)}</span>
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

      col.appendChild(el);
    }

    root.appendChild(col);
  }
}

function getMidYBetweenTeams(matchEl){
  const a = matchEl.querySelector('.team[data-side="a"]');
  const b = matchEl.querySelector('.team[data-side="b"]');
  if (!a || !b) return null;

  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  const rs = stage.getBoundingClientRect();

  // 取「A 底部」到「B 頂部」的中點（就是兩隊名字中間那條線的位置）
  const midY = ((ra.bottom + rb.top) / 2) - rs.top;
  return midY;
}

function getAnchorRight(matchEl){
  const r = matchEl.getBoundingClientRect();
  const rs = stage.getBoundingClientRect();
  const y = getMidYBetweenTeams(matchEl);
  return { x: (r.right - rs.left), y };
}

function getAnchorLeft(matchEl){
  const r = matchEl.getBoundingClientRect();
  const rs = stage.getBoundingClientRect();
  const y = getMidYBetweenTeams(matchEl);
  return { x: (r.left - rs.left), y };
}

function drawWires(){
  // 清空
  wires.innerHTML = "";

  // 設定 SVG viewBox 為容器大小
  const rs = stage.getBoundingClientRect();
  wires.setAttribute("viewBox", `0 0 ${rs.width} ${rs.height}`);

  const dx = 46; // 水平延伸距離（像官方那樣先往右，再轉彎）

  for (const link of data.links){
    const fromEl = root.querySelector(`[data-match-id="${CSS.escape(link.from)}"]`);
    const toEl   = root.querySelector(`[data-match-id="${CSS.escape(link.to)}"]`);
    if (!fromEl || !toEl) continue;

    const p1 = getAnchorRight(fromEl);
    const p2 = getAnchorLeft(toEl);
    if (p1.y == null || p2.y == null) continue;

    // 路徑：M 起點 -> H 往右 -> V 對齊目標 y -> H 到目標 x
    const x2 = p2.x;
    const xMid = p1.x + dx;

    const d = `M ${p1.x} ${p1.y} H ${xMid} V ${p2.y} H ${x2}`;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    wires.appendChild(path);
  }
}

// 重新畫線：初次、縮放、字體載入後
function reroute(){
  drawWires();
}

render();
requestAnimationFrame(reroute);
window.addEventListener("resize", () => requestAnimationFrame(reroute));
