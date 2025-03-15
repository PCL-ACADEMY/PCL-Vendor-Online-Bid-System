import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db } from "../firebase-config.js"; 

async function displayAdminName() {
  const docRef = doc(db, "AdminAccount", "PCL IT");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const name = data.name;

    document.getElementById("displayName").textContent = name;
  } else {
    console.log("No such document!");
  }
}

displayAdminName();




const logoutBtnAdmin = document.getElementById('logoutBtnAdmin');

document.addEventListener("DOMContentLoaded", function () {
    fetchVendorData();
    fetchTruckData();
});

if (logoutBtnAdmin) {
    logoutBtnAdmin.addEventListener('click', function() {
        sessionStorage.clear(); 
        localStorage.removeItem('userType'); 
        window.location.href = "../index.html";
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const pathname = window.location.pathname;
    if (pathname.includes('admin/')) {
        const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
        if (userType !== 'admin') {
            window.location.href = '../index.html'; 
        }
    }
});
