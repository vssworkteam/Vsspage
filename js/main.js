async function loadBase() {
  const holder = document.getElementById("site-base");
  if (!holder) return;

  const res = await fetch("/partials/base.html");
  const html = await res.text();
  holder.innerHTML = html;

  // base 載入完成後再初始化功能
  setupMobileMenu();
  setActiveNav();
}

function normalizePage(p) {
  if (!p || p === "/" ) return "/index.html";
  p = p.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return p.split("/").pop() || "/index.html";
}

function setActiveNav() {
  const cur =
    document.body?.dataset?.page ||
    normalizePage(location.pathname);

  document.querySelectorAll("[data-nav]").forEach(a => {
    const link = normalizePage(a.getAttribute("href"));
    a.classList.toggle("active", link === cur);
  });
}

function setupMobileMenu() {
  const btn = document.querySelector("[data-menu-btn]");
  const links = document.querySelector("[data-navlinks]");
  if (!btn || !links) return;
  btn.addEventListener("click", () => links.classList.toggle("open"));
}

document.addEventListener("DOMContentLoaded", loadBase);
