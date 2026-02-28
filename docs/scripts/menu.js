/**
 * Hamburger menu toggle for mobile navigation.
 */
(function () {
    const menuIcon = document.getElementById('menuIcon');
    const navLinks = document.getElementById('navLinks');

    if (!menuIcon || !navLinks) return;

    function toggleMenu() {
        const isOpen = navLinks.classList.toggle('show');
        menuIcon.classList.toggle('open', isOpen);
        menuIcon.setAttribute('aria-expanded', String(isOpen));
    }

    menuIcon.addEventListener('click', toggleMenu);

    // Also support keyboard activation (Enter / Space)
    menuIcon.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
        }
    });

    // Close menu when a nav link is clicked (mobile UX)
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('show');
            menuIcon.classList.remove('open');
            menuIcon.setAttribute('aria-expanded', 'false');
        });
    });

    // TNG QR Modal
    const qrModal = document.getElementById('qrModal');
    const qrModalBackdrop = document.getElementById('qrModalBackdrop');
    const qrModalClose = document.getElementById('qrModalClose');

    function openQrModal(e) {
        if (e) e.preventDefault();
        if (qrModal) qrModal.classList.add('open');
    }

    function closeQrModal() {
        if (qrModal) qrModal.classList.remove('open');
    }

    // Wire up all support triggers on the page (nav + footer)
    document.querySelectorAll('[id^="support"]').forEach(function (el) {
        el.addEventListener('click', openQrModal);
    });

    if (qrModalBackdrop) qrModalBackdrop.addEventListener('click', closeQrModal);
    if (qrModalClose) qrModalClose.addEventListener('click', closeQrModal);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeQrModal();
    });

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const answer = btn.nextElementSibling;
            const isOpen = answer.classList.contains('open');

            // Close all open answers
            document.querySelectorAll('.faq-answer').forEach(function (a) {
                a.classList.remove('open');
            });
            document.querySelectorAll('.faq-question').forEach(function (b) {
                b.setAttribute('aria-expanded', 'false');
            });

            // Toggle clicked one
            if (!isOpen) {
                answer.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
})();
