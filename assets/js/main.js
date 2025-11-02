// Active link highlight
const sections = document.querySelectorAll("section, .hero");
const navLinks = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    if (pageYOffset >= sectionTop) {
      current = section.getAttribute("id") || "home";
    }
  });

  navLinks.forEach(a => {
    a.classList.remove("active");
    if (a.getAttribute("href").includes(current)) {
      a.classList.add("active");
    }
  });
});

// Back-to-top button
const backBtn = document.createElement("button");
backBtn.id = "backToTop";
backBtn.textContent = "↑";
document.body.appendChild(backBtn);
backBtn.style.cssText = `
  position: fixed; bottom:1rem; right:1rem;
  padding:0.8rem; border-radius:50%; border:none;
  background:#1e40af; color:white; font-weight:bold;
  cursor:pointer; display:none; z-index:999;
`;
window.addEventListener("scroll", () => backBtn.style.display = window.scrollY>300?"block":"none");
backBtn.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
