import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginbtn");
    const closeBtn = document.querySelector(".close");
    const loginForm = document.getElementById("loginForm");

    function toggleLoginModal() {
        modal.style.display = (modal.style.display === "block") ? "none" : "block";
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
            const vendorRef = collection(db, "VendorAccount");
            const vendorSnapshot = await getDocs(vendorRef);
            for (let doc of vendorSnapshot.docs) {
                let data = doc.data();
                if (data.username === email && data.password === password) {
                    alert("Vendor login successful!");
                    window.location.href = "vendor.html";
                }
            }

            const adminRef = collection(db, "AdminAccount");
            const adminSnapshot = await getDocs(adminRef);
            for (let doc of adminSnapshot.docs) {
                let data = doc.data();
                if (data.username === email && data.password === password) {
                    alert("Admin login successful!");
                    window.location.href = "admin.html";
                    return;
                }
            }

            // If users found
            alert("Invalid username or password!");

        } catch (error) {
            console.error("Error validating login:", error);
            alert("Error logging in. Please try again.");
        }
    }

    loginForm.addEventListener("submit", validateLogin);
});
