
console.log("🔥 MENU FIX SCRIPT LOADED - ROOT DIAGNOSTIC v3 🔥");

(function () {
    const MENU_BTN_SELECTOR = '.nav-menu-btn';
    const OVERLAY_SELECTOR = '#nav-overlay';
    const LINKS_SELECTOR = '.nav-link, .cta-button, [data-target]';
    const CLASS_OPEN = 'menu-open';

    // Inject COMPREHENSIVE Styles (Centered Menu, Full Page Panels)
    const style = document.createElement('style');
    style.innerHTML = `
        /* 1. Full Page & Centered Menu Overlay */
        #nav-overlay {
            background-color: rgba(10, 10, 10, 0.96) !important;
            backdrop-filter: blur(10px);
            
            /* Mandatory Centering */
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 0 !important;
            text-align: center !important;
            
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            z-index: 9000 !important; /* Ultra High */
            
            /* Animation */
            transform: translateY(10%) !important; /* Slight float up instead of huge side slide for centering stability */
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease !important;
        }

        body.menu-open #nav-overlay {
            transform: translateY(0%) !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        }

        .nav-links {
            align-items: center !important;
            width: 100%;
        }

        /* 2. Full Page Content Panels */
        .content-panel {
            position: fixed !important;
            top: 0; left: 0;
            width: 100vw !important;
            height: 100vh !important;
            background: #F4F4F4 !important; /* Ensure background opaque */
            z-index: 10000 !important; /* Above menu */
            overflow-y: auto !important;
            display: none !important; /* Hidden by default */
            padding-top: 5rem !important;
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        .content-panel.active {
            display: block !important;
            opacity: 1 !important;
            animation: fadeIn 0.5s ease forwards;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Neon Proximity Feel */
        .nav-link {
            transition: color 0.3s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .nav-link:hover {
            color: #CCFF00 !important; 
            transform: scale(1.05) !important; /* Center scale */
            text-shadow: 0 0 15px rgba(204, 255, 0, 0.4);
        }
    `;
    document.head.appendChild(style);

    const getElements = () => ({
        btn: document.querySelector(MENU_BTN_SELECTOR),
        overlay: document.querySelector(OVERLAY_SELECTOR),
        links: document.querySelectorAll('.nav-link'),
        text: document.querySelector(MENU_BTN_SELECTOR + ' span')
    });

    const toggleMenu = (forceState) => {
        const els = getElements();
        if (!els.overlay || !els.btn) return;

        const isCurrentlyOpen = document.body.classList.contains(CLASS_OPEN);
        const shouldOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;

        if (shouldOpen) {
            document.body.classList.add(CLASS_OPEN);
            document.body.style.overflow = 'hidden';
            els.btn.classList.add('active');
            if (els.text) els.text.textContent = "CLOSE";

            if (typeof gsap !== 'undefined') {
                gsap.set(els.links, { y: 20, opacity: 0 });
                gsap.to(els.links, {
                    y: 0, opacity: 1, stagger: 0.05, duration: 0.8, ease: "power3.out", delay: 0.1
                });
            }
        } else {
            document.body.classList.remove(CLASS_OPEN);
            document.body.style.overflow = '';
            els.btn.classList.remove('active');
            if (els.text) els.text.textContent = "MENU";
        }
    };

    // Global Click Listener (Toggle)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest(MENU_BTN_SELECTOR);
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        }
    });

    // Navigation & Panel Logic
    document.addEventListener('click', (e) => {
        const link = e.target.closest(LINKS_SELECTOR);
        if (link) {
            const targetId = link.getAttribute('data-target');

            // Close menu if open
            if (document.body.classList.contains(CLASS_OPEN)) {
                toggleMenu(false);
            }

            if (targetId) {
                const panel = document.querySelector(`#panel-${targetId}`);
                if (panel) {
                    e.preventDefault();

                    // Force Full Reset of Panels
                    document.querySelectorAll('.content-panel').forEach(p => {
                        p.classList.remove('active');
                        p.style.display = 'none';
                    });

                    // Activate Target
                    panel.classList.add('active');
                    panel.style.display = 'block'; // Inline override

                    document.body.style.overflow = 'hidden'; // Lock Body
                }
            }
        }
    });

    // Panel Close Logic
    document.addEventListener('click', (e) => {
        if (e.target.closest('.panel-close')) {
            document.querySelectorAll('.content-panel').forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none';
            });
            document.body.style.overflow = ''; // Unlock Body
        }
    });

    // ESC Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleMenu(false);
            // Also close panels
            document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
            document.body.style.overflow = '';
        }
    });

    // Cursor Fix
    const els = getElements();
    if (els.btn) els.btn.style.cursor = 'pointer';

})();
