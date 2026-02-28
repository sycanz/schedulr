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
