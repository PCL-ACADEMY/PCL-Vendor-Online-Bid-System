import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

// Function to display the logged-in admin's name
async function displayAdminName() {
  const userType = localStorage.getItem('userType');
  
  if (userType !== 'admin') {
    console.log("No admin logged in!");
    return;
  }
  
  const adminEmail = localStorage.getItem('adminEmail');
  
  if (!adminEmail) {
    console.log("Admin email not found in session!");
    return;
  }
  
  try {
    const adminRef = collection(db, "AdminAccount");
    const q = query(adminRef, where("username", "==", adminEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      const adminName = docData.name || adminEmail;
      
      document.getElementById("displayName").textContent = adminName;
    } else {
      console.log("Admin document not found!");
      document.getElementById("displayName").textContent = "Admin";
    }
  } catch (error) {
    console.error("Error retrieving admin info:", error);
    document.getElementById("displayName").textContent = "Admin";
  }
}

let adminData = [];

async function populateAdminTable() {
  try {
    const adminRef = collection(db, "AdminAccount");
    const adminSnapshot = await getDocs(adminRef);
    
    adminData = [];
    
    if (adminSnapshot.empty) {
      console.log("No admin accounts found");
      renderTable([]);
      return;
    }
    
    adminSnapshot.forEach((doc) => {
      const data = doc.data();
      adminData.push({
        id: doc.id,
        name: data.name || "N/A",
        username: data.username || "N/A",
        password: data.password || ""
      });
    });
    
    renderTable(adminData);
    
  } catch (error) {
    console.error("Error populating admin table:", error);
    renderTable([]);
  }
}

function renderTable(data) {
  const tableBody = document.querySelector("#admin-table-body");

  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center">No matching admin accounts found</td>
      </tr>
    `;
    return;
  }

  let tableHTML = "";
  data.forEach((admin, index) => {
    tableHTML += `
      <tr>
        <td>${admin.name}</td>
        <td>${admin.username}</td>
        <td><button class="btn btn-primary" onclick="updateAdmin('${admin.id}')">Update</button></td>
      </tr>
    `;
  });

  tableBody.innerHTML = tableHTML;
}

function filterTable(searchText) {
  if (!searchText.trim()) {
    renderTable(adminData);
    return;
  }

  const searchLower = searchText.toLowerCase();
  const filteredData = adminData.filter(admin =>
    admin.name.toLowerCase().includes(searchLower) ||
    admin.username.toLowerCase().includes(searchLower)
  );

  renderTable(filteredData);
}

document.addEventListener("DOMContentLoaded", function() {
  displayAdminName();
  populateAdminTable();

  document.getElementById("admin-search").addEventListener("input", function(e) {
    filterTable(e.target.value);
  });
});

const logoutBtnAdmin = document.getElementById('logoutBtnAdmin');
if (logoutBtnAdmin) {
  logoutBtnAdmin.addEventListener('click', function() {
    sessionStorage.clear();
    localStorage.removeItem('userType');
    window.location.href = "../index.html";
  });
}

document.addEventListener("DOMContentLoaded", function() {
  const pathname = window.location.pathname;
  if (pathname.includes('admin/') || pathname.includes('/products')) {
    const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
    if (userType !== 'admin') {
      window.location.href = '../index.html';
    }
  }
});
