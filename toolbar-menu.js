// Steuert ausschließlich das Öffnen/Schließen der Toolbar-Dropdowns und des
// mobilen Hamburger-Menüs. Kennt den BlockDiagramEditor nicht und greift nicht
// in dessen Zustand ein - reine UI-Logik, unabhängig von app.js.
(function () {
    function closeAllMenus(except) {
        document.querySelectorAll('.menu-dropdown.open').forEach(function (el) {
            if (el !== except) el.classList.remove('open');
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var toolbarMenus = document.getElementById('toolbarMenus');
        var menuToggle = document.getElementById('btnMenuToggle');

        document.querySelectorAll('.menu-trigger').forEach(function (trigger) {
            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                var dropdown = trigger.closest('.menu-dropdown');
                var isOpen = dropdown.classList.contains('open');
                closeAllMenus();
                if (!isOpen) dropdown.classList.add('open');
            });
        });

        document.addEventListener('click', function () {
            closeAllMenus();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeAllMenus();
        });

        if (menuToggle && toolbarMenus) {
            menuToggle.addEventListener('click', function (e) {
                e.stopPropagation();
                var open = toolbarMenus.classList.toggle('mobile-open');
                menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        }
    });
})();
