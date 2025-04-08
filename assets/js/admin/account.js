import { collection, getDocs, query, where, doc, updateDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

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
    const adminRef = collection(db, "AdminAccounts");
    const q = query(adminRef, where("Username", "==", adminEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      const adminName = docData.Name || adminEmail;
        
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
let currentAdminId = null;

function createAdminTable() {
    const container = document.getElementById("adminTableContainer");
    container.innerHTML = `
    <div class="card">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="card-title">Admin Accounts</h4>
                <button class="btn btn-success" onclick="showAddAdminModal()">Add Admin Account</button>
            </div>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="admin-table-body">
                <!-- Data will be inserted here -->
                </tbody>
            </table>
        </div>
    </div>    
    

    `;
}

async function populateAdminTable() {
    try {
        const adminRef = collection(db, "AdminAccounts");
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
                Name: data.Name || "N/A", 
                Username: data.Username || "N/A", 
                Password: data.Password || "" 
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
            <td colspan="4" class="text-center">No matching admin accounts found</td>
        </tr>
        `;
        return;
    }

    let tableHTML = "";
    data.forEach((admin) => {
        tableHTML += `
            <tr>
                <td>${admin.Name}</td>
                <td>${admin.Username}</td>
                <td>
                    <button class="btn btn-primary" onclick="showAdminDetails('${admin.id}')">Update</button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHTML;
}

let pendingDeleteAdminId = null;

window.showAdminDetails = function(docId) {
    currentAdminId = docId;
    const admin = adminData.find(a => a.id === docId);

    if (!admin) {
        console.error("Admin data not found for ID:", docId);
        return;
    }

    document.getElementById("modalTitle").textContent = "Update Admin Account";
    document.getElementById("modalNameInput").value = admin.Name;
    document.getElementById("modalUsernameInput").value = admin.Username;
    document.getElementById("modalPasswordInput").value = "";

    const saveAdminBtn = document.getElementById("saveAdminBtn");
    saveAdminBtn.textContent = "Save Changes";
    saveAdminBtn.onclick = function() {
        saveAdminChanges(docId);
    };

    const deleteAdminBtn = document.getElementById("deleteAdminBtn");
    if (deleteAdminBtn) {
        deleteAdminBtn.style.display = "block"; // <-- This reveals it
        deleteAdminBtn.onclick = function () {
            pendingDeleteAdminId = docId;
            const confirmModal = new bootstrap.Modal(document.getElementById("confirmDeleteAdminModal"));
            confirmModal.show();
        };
    }


    const modalElement = document.getElementById("adminDetailsModal");
    if (!modalElement) {
        console.error("Modal element not found in DOM");
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
};

window.saveAdminChanges = async function() {
    if (!currentAdminId) return;
    
    try {
        const name = document.getElementById("modalNameInput").value.trim();
        const username = document.getElementById("modalUsernameInput").value.trim();
        const password = document.getElementById("modalPasswordInput").value.trim();

        if (!name || !username) {
            alert("Name and Username fields cannot be empty");
            return;
        }

        const updateData = {
            Name: name,
            Username: username
        };

        if (password) {
            updateData.Password = password;
        }

        const adminRef = doc(db, "AdminAccounts", currentAdminId);
        await updateDoc(adminRef, updateData);

        console.log("Admin details updated successfully");

        const adminIndex = adminData.findIndex(a => a.id === currentAdminId);
        if (adminIndex !== -1) {
            adminData[adminIndex].Name = name;
            adminData[adminIndex].Username = username;
            renderTable(adminData);
        }

        const modalElement = document.getElementById("adminDetailsModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

    } catch (error) {
        console.error("Error updating admin details:", error);
        alert("Failed to update admin details. Please try again.");
    }
};

const deleteAdminBtn = document.getElementById("deleteAdminBtn");
if (deleteAdminBtn) {
    deleteAdminBtn.style.display = "block";
    deleteAdminBtn.onclick = function () {
        pendingDeleteAdminId = docId;
        const confirmModal = new bootstrap.Modal(document.getElementById("confirmDeleteAdminModal"));
        confirmModal.show();
    };
}

document.getElementById("confirmDeleteAdminBtn").onclick = function () {
    if (pendingDeleteAdminId) {
        deleteAdminAccount(pendingDeleteAdminId);
        pendingDeleteAdminId = null;
    }
};

function deleteAdminAccount(docId) {
    const adminRef = doc(db, "AdminAccounts", docId);
    deleteDoc(adminRef)
        .then(() => {
            console.log("Admin successfully deleted");
            location.reload();
        })
        .catch((error) => {
            console.error("Error deleting admin:", error);
        });
}


// Function to get the next admin number
async function getNextAdminNumber() {
    try {
        const adminRef = collection(db, "AdminAccounts");
        const adminSnapshot = await getDocs(adminRef);
        
        if (adminSnapshot.empty) {
            return 1; 
        }
        
        // Find admin IDs that match the pattern "admin#"
        const adminNumbers = [];
        adminSnapshot.forEach((doc) => {
            const docId = doc.id;
            const match = docId.match(/^admin(\d+)$/);
            if (match) {
                const num = parseInt(match[1]);
                adminNumbers.push(num);
            }
        });
        
        if (adminNumbers.length === 0) {
            return 1; 
        }
        
        // Get the max number and add 1
        const maxNumber = Math.max(...adminNumbers);
        return maxNumber + 1;
    } catch (error) {
        console.error("Error getting next admin number:", error);
        return Date.now(); 
    }
}

window.showAddAdminModal = function() {
    document.getElementById("modalTitle").textContent = "Add New Admin Account";
    document.getElementById("modalNameInput").value = "";
    document.getElementById("modalUsernameInput").value = "";
    document.getElementById("modalPasswordInput").value = "";
    document.getElementById("deleteAdminBtn").style.display = "none";

    const saveAdminBtn = document.getElementById("saveAdminBtn");
    saveAdminBtn.textContent = "Add Account";
    saveAdminBtn.onclick = addNewAdmin;

    const modal = new bootstrap.Modal(document.getElementById("adminDetailsModal"));
    modal.show();
};

window.addNewAdmin = async function() {
    try {
        const name = document.getElementById("modalNameInput").value.trim();
        const username = document.getElementById("modalUsernameInput").value.trim();
        const password = document.getElementById("modalPasswordInput").value.trim();

        if (!name || !username || !password) {
            alert("All fields are required for a new account");
            return;
        }

        // Check if username (email) already exists
        const adminRef = collection(db, "AdminAccounts");
        const q = query(adminRef, where("Username", "==", username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            alert("This username (email) is already in use. Please choose another one.");
            return;
        }

        // Get the next admin number for the document ID
        const nextAdminNumber = await getNextAdminNumber();
        const docId = `admin${nextAdminNumber}`;

        // Create new admin account with custom ID
        const newAdmin = {
            Name: name,
            Username: username,
            Password: password
        };

        // Use setDoc instead of addDoc to specify the document ID
        await setDoc(doc(db, "AdminAccounts", docId), newAdmin);
        console.log("New admin account created with ID:", docId);

        // Update the local data and refresh the table
        adminData.push({
            id: docId,
            Name: name,
            Username: username,
            Password: password
        });
        
        populateAdminTable();

        // Close the modal
        const modalElement = document.getElementById("adminDetailsModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

        alert("New admin account created successfully!");

    } catch (error) {
        console.error("Error adding new admin account:", error);
        alert("Failed to create new admin account. Please try again.");
    }
};

window.showAdminDetails = showAdminDetails;
window.saveAdminChanges = saveAdminChanges;
window.showAddAdminModal = showAddAdminModal;
window.addNewAdmin = addNewAdmin;

document.addEventListener("DOMContentLoaded", () => {
    createAdminTable();
    displayAdminName();
    populateAdminTable();
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
