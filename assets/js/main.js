document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. MOBILE MENU TOGGLE ---
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }

    // --- 2. HOME PAGE: WORD SWITCHER ---
    const wordElement = document.getElementById('spin-word');
    if (wordElement) {
        const words = ["CODER", "DEVELOPER", "PROGRAMMER", "DESIGNER", "FREELANCER"];
        let i = 0;
        setInterval(() => {
            i = (i + 1) % words.length;
            wordElement.style.opacity = 0;
            setTimeout(() => {
                wordElement.textContent = words[i];
                wordElement.style.opacity = 1;
            }, 300);
        }, 2000);
    }

    // --- 3. ACTIVE LINK HIGHLIGHTER ---
    const currentLocation = location.href;
    const menuItems = document.querySelectorAll('.nav-links a');
    menuItems.forEach(item => {
        if(item.href === currentLocation){
            item.className = "active";
        }
    });
});