// 1) 自動標記導覽列 active
(() => {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(a => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });
})();

// 2) 手機選單開關
(() => {
  const btn = document.querySelector("[data-menu-btn]");
  const links = document.querySelector("[data-navlinks]");
  if (!btn || !links) return;
  btn.addEventListener("click", () => links.classList.toggle("open"));
})();
