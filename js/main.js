function normalizeFileName(pathname) {
  // 只取檔名（最後一段），並去掉結尾 /
  pathname = (pathname || "").replace(/\/+$/, "");
  const last = pathname.split("/").pop();
  return last || "index.html";
}

function setActiveNav() {
  const navLinks = Array.from(document.querySelectorAll("[data-nav]"));
  if (!navLinks.length) return;

  // 1) 先用 pathname 判斷
  let cur = normalizeFileName(location.pathname);

  // 2) 如果是首頁路徑 /，但 body 有指定 data-page，就用 data-page
  const bodyPage = document.body?.dataset?.page;
  if (bodyPage) cur = bodyPage;

  navLinks.forEach(a => {
    const href = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
    const link = href.replace(/\/+$/, "").split("/").pop() || href;
    a.classList.toggle("active", link === cur);
  });
}

function setupMobileMenu() {
  const btn = document.querySelector("[data-menu-btn]");
  const links = document.querySelector("[data-navlinks]");
  if (!btn || !links) return;
  btn.addEventListener("click", () => links.classList.toggle("open"));
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();
  setupMobileMenu();
});
