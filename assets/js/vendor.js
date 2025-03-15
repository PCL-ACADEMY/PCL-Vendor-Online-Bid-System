const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('userType');
        window.location.href = "index.html";
    });
}
document.addEventListener('DOMContentLoaded', function() {
    const pathname = window.location.pathname;
    if (pathname.endsWith('vendor.html')) {
        if (localStorage.getItem('userType') !== 'vendor') {
            window.location.href = 'index.html';
        }
    }
});