/**
 * 目標：
 * 1) 依照第一輪結果，自動產生第二輪、第三輪的對戰（勝者推進）
 * 2) 每場顯示 BO3/BO5 標籤
 * 3) 搭配 bracket.css 畫彎折連線（上一輪兩場 -> 下一輪一場）
 */

const data = {
  rounds: [
    {
      title: "第1輪",
      // 第一輪你要自己填（或未賽就 score = null）
      matches: [
        { id: "r1m1", bo: 3, a: { name: "G2 Esports", score: 0 }, b: { name: "Paper Rex", score: 2 } },
        { id: "r1m2", bo: 3, a: { name: "Xi Lai Gaming", score: 0 }, b: { name: "Sentinels", score: 2 } },
        { id: "r1m3", bo: 3, a: { name: "Rex Regum Qeon", score: 0 }, b: { name: "WOLVES ESPORTS", score: 2 } },
        { id: "r1m4", bo: 3, a: { name: "FNATIC", score: 1 }, b: { name: "Gen.G", score: 2 } },
      ]
    },
    {
      title: "勝部組複賽",
      matches: [
        // 這輪會自動填入（下面 generateNextRounds 會覆蓋）
        { id: "r2m1", bo: 3, a: null, b: null },
        { id: "r2m2", bo: 3, a: null, b: null },
      ]
    },
    {
      title: "勝部組決賽",
      matches: [
        { id: "r3m1", bo: 5, a: null, b: null }
      ]
    }
  ]
};

// ---------- 邏輯：判定勝者 ----------
function getWinner(teamA, teamB){
  if (!teamA || !teamB) return null;
  const sa = teamA.score, sb = teamB.score;
  if (sa == null || sb == null) return null;
  if (sa === sb) return null;
  return sa > sb ? "A" : "B";
}

function normalizeTeam(t){
  if (!t) return null;
  return { name: t.name ?? "TBD", score: (t.score ?? null) };
}

// ---------- 自動推進：每兩場產生一場 ----------
function generateNextRounds(){
  for (let r = 1; r < data.rounds.length; r++){
    const prev = data.rounds[r - 1];
    const cur = data.rounds[r];

    // 每兩個 prev match 合成一個 cur match
    for (let i = 0; i < cur.matches.length; i++){
      const mPrev1 = prev.matches[i * 2];
      const mPrev2 = prev.matches[i * 2 + 1];

      const w1 = getWinner(mPrev1?.a, mPrev1?.b);
      const w2 = getWinner(mPrev2?.a, mPrev2?.b);

      const team1 = w1 === "A" ? normalizeTeam(mPrev1.a) : w1 === "B" ? normalizeTeam(mPrev1.b) : { name: "TBD", score: null };
      const team2 = w2 === "A" ? normalizeTeam(mPrev2.a) : w2 === "B" ? normalizeTeam(mPrev2.b) : { name: "TBD", score: null };

      cur.matches[i].a = team1;
      cur.matches[i].b = team2;

      // 注意：這裡只填隊名，分數留給你手動更新（或之後接 API）
      cur.matches[i].a.score = cur.matches[i].a.score ?? null;
      cur.matches[i].b.score = cur.matches[i].b.score ?? null;
    }
  }
}

// ---------- UI：渲染 ----------
function teamRowHTML(team, isWin){
  const name = team?.name ?? "TBD";
  const score = (team?.score == null) ? "—" : String(team.score);
  return `
    <div class="team ${isWin ? "win" : ""}">
      <span>${escapeHtml(name)}</span>
      <b>${escapeHtml(score)}</b>
    </div>
  `;
}

function matchHTML(match){
  const a = match.a ?? { name: "TBD", score: null };
  const b = match.b ?? { name: "TBD", score: null };
  const w = getWinner(a, b);
  const state = (a.score == null || b.score == null) ? "未開始" : "已完賽";
  return `
    <div class="match" data-id="${escapeHtml(match.id)}">
      <div class="metaBar">
        <span class="boPill">BO${escapeHtml(String(match.bo || 3))}</span>
        <span class="state">${escapeHtml(state)}</span>
      </div>
      ${teamRowHTML(a, w === "A")}
      ${teamRowHTML(b, w === "B")}
    </div>
  `;
}

/**
 * 連線標記規則（讓 CSS 畫彎折）：
 * - 第一輪每兩個 slot：
 *   slot1: data-join="top"  data-out="1"
 *   slot2: data-join="bottom" data-out="1"
 * - 第二輪的 slot：data-in="1"（接收上一輪）
 *   同理第二輪也要對第三輪輸出：前兩個 slot 再各自標 join/out
 */
function render(){
  const root = document.getElementById("bracketRoot");
  root.innerHTML = "";

  data.rounds.forEach((round, rIndex) => {
    const col = document.createElement("section");
    col.className = "round";

    const title = document.createElement("div");
    title.className = "roundTitle";
    title.textContent = round.title;
    col.appendChild(title);

    round.matches.forEach((m, mIndex) => {
      const slot = document.createElement("div");
      slot.className = "slot";

      // 接收上一輪線
      if (rIndex > 0) slot.dataset.in = "1";

      // 輸出到下一輪線（除了最後一輪）
      if (rIndex < data.rounds.length - 1) slot.dataset.out = "1";

      // 彎折 join（每兩個一組）
      // 在「有下一輪」的輪次才需要 join
      if (rIndex < data.rounds.length - 1){
        if (mIndex % 2 === 0) slot.dataset.join = "top";
        else slot.dataset.join = "bottom";
      }

      slot.innerHTML = matchHTML(m);
      col.appendChild(slot);
    });

    root.appendChild(col);
  });
}

// ---------- utils ----------
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// Run
generateNextRounds();
render();
