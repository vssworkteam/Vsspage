const data = {
  sections: [
    {
      title: "勝部組",
      rounds: [
        {
          title: "勝部第 1 輪",
          matches: [
            { id:"ub1", bo:3, date:"03/27 19:00", state:"未開始",
              a:{ name:"Team A", score:null, win:false },
              b:{ name:"Team B", score:null, win:false }
            },
            { id:"ub2", bo:3, date:"03/27 21:00", state:"未開始",
              a:{ name:"Team C", score:null, win:false },
              b:{ name:"Team D", score:null, win:false }
            }
          ]
        },
        {
          title: "勝部決賽",
          matches: [
            { id:"ubf", bo:3, date:"03/28 19:00", state:"未開始",
              a:{ name:"TBD", score:null, win:false },
              b:{ name:"TBD", score:null, win:false }
            }
          ]
        }
      ]
    },
    {
      title: "敗部組",
      rounds: [
        {
          title: "敗部第 1 輪",
          matches: [
            { id:"lb1", bo:3, date:"03/28 21:00", state:"未開始",
              a:{ name:"TBD", score:null, win:false },
              b:{ name:"TBD", score:null, win:false }
            }
          ]
        },
        {
          title: "敗部決賽",
          matches: [
            { id:"lbf", bo:3, date:"03/29 19:00", state:"未開始",
              a:{ name:"TBD", score:null, win:false },
              b:{ name:"TBD", score:null, win:false }
            }
          ]
        },
        {
          title: "總決賽",
          matches: [
            { id:"gf", bo:5, date:"03/30 19:00", state:"未開始",
              a:{ name:"TBD", score:null, win:false },
              b:{ name:"TBD", score:null, win:false }
            }
          ]
        }
      ]
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

  for (const section of data.sections){
    const sectionEl = document.createElement("section");
    sectionEl.className = "bracketSection";

    const sectionTitle = document.createElement("div");
    sectionTitle.className = "bracketSectionTitle";
    sectionTitle.textContent = section.title;

    const row = document.createElement("div");
    row.className = "bracketRow";

    for (const rd of section.rounds){
      const col = document.createElement("section");
      col.className = "round";

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
        body.appendChild(wrap);
      }

      col.appendChild(title);
      col.appendChild(body);
      row.appendChild(col);
    }

    sectionEl.appendChild(sectionTitle);
    sectionEl.appendChild(row);
    root.appendChild(sectionEl);
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

function positionMatches(){
  document.querySelectorAll(".matchWrap").forEach(w => {
    w.style.transform = "translateY(0px)";
  });

  const toMap = new Map();

  for (const l of data.links){
    if (!toMap.has(l.to)) toMap.set(l.to, []);
    toMap.get(l.to).push(l.from);
  }

  // 這裡依照雙淘汰流程由左到右、由上到下定位
  const order = ["ubf", "lb1", "lbf", "gf"];

  for (const toId of order){
    const fromIds = toMap.get(toId);
    if (!fromIds || fromIds.length < 2) continue;

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
  requestAnimationFrame(() => {
    positionMatches();
    requestAnimationFrame(() => {
      drawWires();
    });
  });
}

render();
reroute();

window.addEventListener("resize", reroute);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(reroute);
}