// 1) 自動標記導覽列 active（更穩：不怕 query/hash/子目錄）
(() => {
  const currentPath = location.pathname.replace(/\/$/, ""); // 去掉結尾 /
  document.querySelectorAll("[data-nav]").forEach(a => {
    const linkPath = new URL(a.getAttribute("href"), location.href).pathname.replace(/\/$/, "");
    // 只比對檔名或路徑尾端（避免 /folder/bracket.html 與 bracket.html 問題）
    const cur = currentPath.split("/").pop();
    const link = linkPath.split("/").pop();
    if (cur && link && cur === link) a.classList.add("active");
  });
})();

// 2) 手機選單開關
(() => {
  const btn = document.querySelector("[data-menu-btn]");
  const links = document.querySelector("[data-navlinks]");
  if (!btn || !links) return;
  btn.addEventListener("click", () => links.classList.toggle("open"));
})();
