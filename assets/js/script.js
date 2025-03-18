// script.js
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnAdmin = document.getElementById('logoutBtnAdmin');

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginbtn");
    const closeBtn = document.querySelector(".close");
    const loginForm = document.getElementById("loginForm");

    function toggleLoginModal() {
        modal.style.display = modal.style.display === "block" ? "none" : "block";
    }

    loginBtn.addEventListener("click", toggleLoginModal);
    closeBtn.addEventListener("click", toggleLoginModal);

    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            toggleLoginModal();
        }
    });

    // Function to validate login
async function validateLogin(event) {
    event.preventDefault();

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    try {
        // Check Vendor Account
        const vendorRef = collection(db, "VendorAccount");
        const vendorSnapshot = await getDocs(vendorRef);
        for (let doc of vendorSnapshot.docs) {
            let data = doc.data();
            if (data.username === email && data.password === password) {
                if (data.status === "Deactivated") {
                    alert("Your account has been deactivated. Please contact support.");
                    return;
                }
                alert("Vendor login successful!");
                localStorage.setItem('vendorType', 'vendor');
                localStorage.setItem('vendorEmail', email);
                localStorage.setItem('vendorDocId', doc.id);
                window.location.href = "vendor/option.html";
                return;
            }
        }

        // Check Admin Account
        const adminRef = collection(db, "AdminAccount");
        const adminSnapshot = await getDocs(adminRef);
        for (let doc of adminSnapshot.docs) {
            let data = doc.data();
            if (data.username === email && data.password === password) {
                alert("Admin login successful!");
                localStorage.setItem('userType', 'admin');
                localStorage.setItem('adminEmail', email);
                localStorage.setItem('adminDocId', doc.id);
                window.location.href = "admin/adminPage.html";
                return;
            }
        }

        alert("Invalid username or password!");

    } catch (error) {
        console.error("Error validating login:", error);
        alert("Error logging in. Please try again.");
    }
}

loginForm.addEventListener("submit", validateLogin);
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('userType');
        window.location.href = "index.html";
    });
}

if (logoutBtnAdmin) {
    logoutBtnAdmin.addEventListener('click', function() {
        localStorage.removeItem('userType');
        window.location.href = "index.html";
    });
}



document.addEventListener('DOMContentLoaded', function() {
    const procureText = document.getElementById('procure');
    const xText = document.querySelector('.x');
    const subtitle = document.querySelector('.subtitle');
    const joinButton = document.querySelector('.join-button');

    function fadeIn() {
        let opacity = 0;
        const fadeInterval = setInterval(function() {
            if (opacity < 1) {
                opacity += 0.03;
                procureText.style.opacity = opacity;
                xText.style.opacity = opacity;
                subtitle.style.opacity = opacity;
                joinButton.style.opacity = opacity;
            } else {
                clearInterval(fadeInterval);
                setTimeout(fadeOut, 5000);
            }
        }, 30);
    }
    
    function fadeOut() {
        let opacity = 1;
        const fadeInterval = setInterval(function() {
            if (opacity > 0) {
                opacity -= 0.03;
                procureText.style.opacity = opacity;
                xText.style.opacity = opacity;
                subtitle.style.opacity = opacity;
                joinButton.style.opacity = opacity;
            } else {
                clearInterval(fadeInterval);
                setTimeout(fadeIn, 0);
            }
        }, 30);
    }
    
    fadeIn();
    
    joinButton.addEventListener('click', function() {
        console.log('Button clicked');
    });
});

