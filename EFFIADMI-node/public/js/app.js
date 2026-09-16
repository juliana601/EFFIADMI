// ============================================================
// EFFIADMI - Scripts del cliente
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    // ==================== SIDEBAR RESPONSIVE ====================
    const toggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const layout = document.getElementById('appLayout');

    if (toggle && layout) {
        function cerrarMenu() {
            layout.classList.remove('sidebar-open');
        }

        toggle.addEventListener('click', function () {
            layout.classList.toggle('sidebar-open');
        });

        if (overlay) {
            overlay.addEventListener('click', cerrarMenu);
        }

        window.addEventListener('resize', function () {
            if (window.innerWidth > 1024) {
                cerrarMenu();
            }
        });
    }

    // ==================== AUTO-OCULTAR ALERTAS ====================
    const alerts = document.querySelectorAll('.alert, .mensaje');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(function () {
                alert.remove();
            }, 500);
        }, 4000);
    });
});