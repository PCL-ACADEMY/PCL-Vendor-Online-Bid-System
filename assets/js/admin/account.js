import { collection, getDocs, query, where, doc, updateDoc, addDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
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
            <input type="text" id="admin-search" class="form-control mb-3" placeholder="Search by name or username..." oninput="filterTable(this.value)">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
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
    
    <!-- Admin Modal -->
    <div class="modal fade" id="adminDetailsModal" tabindex="-1" aria-labelledby="modalTitle" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalTitle">Admin Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="modalNameInput" class="form-label">Name</label>
                        <input type="text" class="form-control" id="modalNameInput" placeholder="Enter admin name">
                    </div>
                    <div class="mb-3">
                        <label for="modalUsernameInput" class="form-label">Username (Email)</label>
                        <input type="email" class="form-control" id="modalUsernameInput" placeholder="Enter admin email">
                    </div>
                    <div class="mb-3">
                        <label for="modalPasswordInput" class="form-label">Password</label>
                        <input type="password" class="form-control" id="modalPasswordInput" placeholder="Enter password">
                        <small class="form-text text-muted">Leave blank to keep existing password when updating</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="deleteAdminBtn" style="display: none;">Delete Account</button>
                    <button type="button" class="btn btn-primary" id="saveAdminBtn">Save</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm Delete</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this admin account? This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>
    `;
}

async function populateAdminTable() {
    try {
        const adminRef = collection(db, "AdminAccounts"); // Ensure correct collection name
        const adminSnapshot = await getDocs(adminRef);

        let adminData = []; // Properly declare the array

        if (adminSnapshot.empty) {
            console.log("No admin accounts found");
            renderTable([]);
            return;
        }

        adminSnapshot.forEach((doc) => {
            const data = doc.data();
            adminData.push({
                id: doc.id, 
                name: data.Name || "N/A", 
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
            <td colspan="4" class="text-center">No matching admin accounts found</td>
        </tr>
        `;
        return;
    }

    let tableHTML = "";
    data.forEach((admin) => {
        tableHTML += `
            <tr>
                <td>${admin.id}</td>
                <td>${admin.name}</td>
                <td>${admin.username}</td>
                <td>
                    <button class="btn btn-primary" onclick="showAdminDetails('${admin.id}')">Update</button>
                </td>
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

window.filterTable = filterTable;

window.showAdminDetails = function(docId) {
    currentAdminId = docId;
    const admin = adminData.find(a => a.id === docId);
    
    if (admin) {
        document.getElementById("modalTitle").textContent = "Update Admin Account";
        document.getElementById("modalNameInput").value = admin.name;
        document.getElementById("modalUsernameInput").value = admin.username;
        document.getElementById("modalPasswordInput").value = "";
        
        const saveAdminBtn = document.getElementById("saveAdminBtn");
        saveAdminBtn.textContent = "Save Changes";
        saveAdminBtn.onclick = saveAdminChanges;
        
        // Show delete button for update mode
        const deleteAdminBtn = document.getElementById("deleteAdminBtn");
        deleteAdminBtn.style.display = "block";
        deleteAdminBtn.onclick = confirmDeleteAdmin;

        const modal = new bootstrap.Modal(document.getElementById("adminDetailsModal"));
        modal.show();
    }
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
            name: name,
            username: username
        };

        if (password) {
            updateData.password = password;
        }

        const adminRef = doc(db, "AdminAccounts", currentAdminId);
        await updateDoc(adminRef, updateData);

        console.log("Admin details updated successfully");

        const adminIndex = adminData.findIndex(a => a.id === currentAdminId);
        if (adminIndex !== -1) {
            adminData[adminIndex].name = name;
            adminData[adminIndex].username = username;
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

window.confirmDeleteAdmin = function() {
    // Close the admin details modal
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById("adminDetailsModal"));
    if (detailsModal) detailsModal.hide();
    
    // Show confirmation modal
    document.getElementById("confirmDeleteBtn").onclick = deleteAdmin;
    const confirmModal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));
    confirmModal.show();
};

window.deleteAdmin = async function() {
    if (!currentAdminId) return;
    
    try {
        // Get current admin's email
        const currentAdminEmail = localStorage.getItem('adminEmail');
        const adminToDelete = adminData.find(a => a.id === currentAdminId);
        
        // Check if admin is trying to delete their own account
        if (adminToDelete && adminToDelete.username === currentAdminEmail) {
            alert("You cannot delete your own account while logged in.");
            
            // Close the confirmation modal
            const confirmModal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"));
            if (confirmModal) confirmModal.hide();
            
            return;
        }
        
        // Delete the admin document
        await deleteDoc(doc(db, "AdminAccounts", currentAdminId));
        console.log("Admin account deleted successfully");
        
        // Update local data
        adminData = adminData.filter(admin => admin.id !== currentAdminId);
        renderTable(adminData);
        
        // Close the confirmation modal
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"));
        if (confirmModal) confirmModal.hide();
        
        alert("Admin account deleted successfully");
        
    } catch (error) {
        console.error("Error deleting admin account:", error);
        alert("Failed to delete admin account. Please try again.");
    }
};

// Function to get the next admin number
async function getNextAdminNumber() {
    try {
        const adminRef = collection(db, "AdminAccounts");
        const adminSnapshot = await getDocs(adminRef);
        
        if (adminSnapshot.empty) {
            return 1; // If no admins exist, start with admin1
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
            return 1; // If no admins with the naming pattern exist, start with admin1
        }
        
        // Get the max number and add 1
        const maxNumber = Math.max(...adminNumbers);
        return maxNumber + 1;
    } catch (error) {
        console.error("Error getting next admin number:", error);
        return Date.now(); // Fallback to timestamp if there's an error
    }
}

window.showAddAdminModal = function() {
    document.getElementById("modalTitle").textContent = "Add New Admin Account";
    document.getElementById("modalNameInput").value = "";
    document.getElementById("modalUsernameInput").value = "";
    document.getElementById("modalPasswordInput").value = "";
    
    const saveAdminBtn = document.getElementById("saveAdminBtn");
    saveAdminBtn.textContent = "Add Account";
    saveAdminBtn.onclick = addNewAdmin;
    
    // Hide delete button for add mode
    document.getElementById("deleteAdminBtn").style.display = "none";

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
        const q = query(adminRef, where("username", "==", username));
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
            name: name,
            username: username,
            password: password
        };

        // Use setDoc instead of addDoc to specify the document ID
        await setDoc(doc(db, "AdminAccounts", docId), newAdmin);
        console.log("New admin account created with ID:", docId);

        // Update the local data and refresh the table
        adminData.push({
            id: docId,
            name: name,
            username: username,
            password: password
        });
        
        renderTable(adminData);

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
window.confirmDeleteAdmin = confirmDeleteAdmin;
window.deleteAdmin = deleteAdmin;

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
