const data = {
  labels: [
    { type:"group", text:"勝部組", x:0, y:0 },
    { type:"round", text:"勝部第 1 輪", x:0, y:38 },
    { type:"round", text:"勝部決賽", x:430, y:38 },

    { type:"group", text:"敗部組", x:0, y:500 },
    { type:"round", text:"敗部第 1 輪", x:0, y:538 },
    { type:"round", text:"敗部決賽", x:430, y:538 },

    { type:"round", text:"總決賽", x:860, y:300 }
  ],

  matches: [
    // 勝部
    { id:"ub1", x:0, y:88, bo:3, date:"05/01 19:00", state:"已結束",
      a:{ name:"NOOB", score:2, win:true },
      b:{ name:"EDGE", score:0, win:false }
    },
    { id:"ub2", x:0, y:288, bo:3, date:"05/01 21:30", state:"已結束",
      a:{ name:"BKS", score:2, win:true },
      b:{ name:"FF", score:0, win:false }
    },
    { id:"ubf", x:430, y:188, bo:3, date:"05/02 21:30", state:"未開始",
      a:{ name:"NOOB", score:null, win:false },
      b:{ name:"BKS", score:null, win:false }
    },

    // 敗部
    { id:"lb1", x:0, y:588, bo:3, date:"05/02 19:00", state:"未開始",
      a:{ name:"EDGE", score:null, win:false },
      b:{ name:"FF", score:null, win:false }
    },
    { id:"lbf", x:430, y:588, bo:3, date:"05/03 19:00", state:"未開始",
      a:{ name:"TBD", score:null, win:false },
      b:{ name:"TBD", score:null, win:false }
    },

    // 總決賽
    { id:"gf", x:860, y:350, bo:5, date:"05/03 21:30", state:"未開始",
      a:{ name:"TBD", score:null, win:false },
      b:{ name:"TBD", score:null, win:false }
    }
  ],

  links: [
    // 勝部第 1 輪勝者 → 勝部決賽
    { from:"ub1", to:"ubf" },
    { from:"ub2", to:"ubf" },

    // 勝部第 1 輪敗者 → 敗部第 1 輪
    { from:"ub1", to:"lb1" },
    { from:"ub2", to:"lb1" },

    // 敗部第 1 輪勝者 + 勝部決賽敗者 → 敗部決賽
    { from:"lb1", to:"lbf" },
    { from:"ubf", to:"lbf" },

    // 勝部冠軍 + 敗部冠軍 → 總決賽
    { from:"ubf", to:"gf" },
    { from:"lbf", to:"gf" }
  ]
};

const root = document.getElementById("bracketRoot");
const wires = document.getElementById("wires");
const stage = document.getElementById("stage");

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function scoreText(v){
  return (v === null || v === undefined) ? "—" : String(v);
}

function render(){
  root.innerHTML = "";

  for (const label of data.labels){
    const el = document.createElement("div");
    el.className = label.type === "group" ? "bracketGroupTitle" : "roundTitle";
    el.textContent = label.text;
    el.style.left = `${label.x}px`;
    el.style.top = `${label.y}px`;
    root.appendChild(el);
  }

  for (const m of data.matches){
    const wrap = document.createElement("div");
    wrap.className = "matchWrap";
    wrap.dataset.matchWrapId = m.id;
    wrap.style.left = `${m.x}px`;
    wrap.style.top = `${m.y}px`;

    const el = document.createElement("article");
    el.className = "match";
    el.dataset.matchId = m.id;

    el.innerHTML = `
      <div class="metaBar">
        <div class="metaLeft">
          <span class="boPill">BO${esc(m.bo)}</span>
          <span class="datePill">${esc(m.date ?? "TBD")}</span>
        </div>
        <span class="state">${esc(m.state ?? "")}</span>
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
    root.appendChild(wrap);
  }
}

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
  return { x: r.right - rs.left, y: midY(matchEl) };
}

function anchorLeft(matchEl){
  const r = matchEl.getBoundingClientRect();
  const rs = stage.getBoundingClientRect();
  return { x: r.left - rs.left, y: midY(matchEl) };
}

function drawWires(){
  wires.innerHTML = "";

  const rs = stage.getBoundingClientRect();
  wires.setAttribute("viewBox", `0 0 ${rs.width} ${rs.height}`);

  const dx = 52;

  for (const link of data.links){
    const fromEl = root.querySelector(`[data-match-id="${CSS.escape(link.from)}"]`);
    const toEl = root.querySelector(`[data-match-id="${CSS.escape(link.to)}"]`);

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
  requestAnimationFrame(drawWires);
}

render();
reroute();

window.addEventListener("resize", reroute);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(reroute);
}