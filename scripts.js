document.addEventListener("DOMContentLoaded", function () {
    let sections = document.querySelectorAll("section");
    let navLinks = document.querySelectorAll("nav ul li a");

    // 預設顯示第一個 section
    sections.forEach((section) => {
        if (section.id === "about" || section.id === "contact") {
            section.classList.add("active");
            section.style.display = "block";
        } else if (section.id === "clips") {
            section.classList.add("active");
            section.style.display = "block";
        }
    });

    navLinks.forEach((link) => {
        link.addEventListener("click", function (event) {
            event.preventDefault(); // 阻止頁面跳轉

            let targetId = this.getAttribute("href").substring(1);
            let targetSection = document.getElementById(targetId);

            // 隱藏所有 section
            sections.forEach((section) => {
                if (section.id !== "contact" && section.id !== "about") {
                    section.classList.remove("active");
                    section.style.display = "none";
                }
            });

            // 顯示被點擊的 section
            targetSection.classList.add("active");
            targetSection.style.display = "block";
        });
    });
});
