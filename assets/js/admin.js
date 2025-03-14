const logoutBtnAdmin = document.getElementById('logoutBtnAdmin');

if (logoutBtnAdmin) {
    logoutBtnAdmin.addEventListener('click', function() {
        localStorage.removeItem('userType');
        window.location.href = "index.html";
    });
}
document.addEventListener('DOMContentLoaded', function() {
    const pathname = window.location.pathname;
    if (pathname.endsWith('admin.html')) {
        if (localStorage.getItem('userType') !== 'admin') {
            window.location.href = 'index.html';
        }
    }
});