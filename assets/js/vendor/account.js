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

let vendorData = [];
let currentVendorId = null;

function createVendorTable() {
    const container = document.getElementById("vendorTableContainer");
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="card-title">Vendor Accounts</h4>
                    <button class="btn btn-success" onclick="showAddVendorModal()">Add Vendor Account</button>
                </div>
                <input type="text" id="vendor-search" class="form-control mb-3" placeholder="Search by company or username..." oninput="filterTable(this.value)">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Company</th>
                            <th>Username</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="vendor-table-body">
                        <!-- Data will be inserted here -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Vendor Modal -->
        <div class="modal fade" id="vendorDetailsModal" tabindex="-1" aria-labelledby="modalTitle" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalTitle">Vendor Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="modalCompanyInput" class="form-label">Company</label>
                            <input type="text" class="form-control" id="modalCompanyInput" placeholder="Enter company name">
                        </div>
                        <div class="mb-3">
                            <label for="modalUsernameInput" class="form-label">Username (Email)</label>
                            <input type="email" class="form-control" id="modalUsernameInput" placeholder="Enter vendor email">
                        </div>
                        <div class="mb-3" id="passwordField">
                            <label for="modalPasswordInput" class="form-label">Password</label>
                            <input type="password" class="form-control" id="modalPasswordInput" placeholder="Enter password">
                            <small class="form-text text-muted" id="passwordHelpText">Leave blank to keep existing password when updating</small>
                        </div>
                        <div class="mb-3">
                            <label for="modalStatusSelect" class="form-label">Status</label>
                            <select class="form-select" id="modalStatusSelect">
                                <option value="Activated">Activated</option>
                                <option value="Deactivated">Deactivated</option>
                            </select>
                        </div>
                        <div id="dateFields" class="mb-3">
                            <div class="row">
                                <div class="col-md-6">
                                    <label class="form-label">Date Created</label>
                                    <p id="modalDateCreated" class="form-control-plaintext"></p>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Expiration Date</label>
                                    <p id="modalExpiration" class="form-control-plaintext"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="deleteVendorBtn" style="display: none;">Delete Account</button>
                        <button type="button" class="btn btn-primary" id="saveVendorBtn">Save</button>
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
                        <p>Are you sure you want to delete this vendor account? This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const searchInput = document.getElementById("vendor-search");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            filterTable(this.value);
        });
    }
}

async function populateVendorTable() {
    try {
        const vendorRef = collection(db, "VendorAccount");
        const vendorSnapshot = await getDocs(vendorRef);
        
        vendorData = [];
        
        if (vendorSnapshot.empty) {
            console.log("No vendor accounts found");
            renderTable([]);
            return;
        }
        
        vendorSnapshot.forEach((doc) => {
            const data = doc.data();
            vendorData.push({
                id: doc.id,
                company: data.Company || "N/A",
                username: data.username || "N/A",
                dateCreated: data.DateCreated || "N/A",
                expiration: data.Expiration || "N/A",
                status: data.status || "N/A",
                password: data.password || "N/A"
            });
        });
        
        console.log("Loaded vendor data:", vendorData.length, "records");
        renderTable(vendorData);
        
    } catch (error) {
        console.error("Error populating vendor table:", error);
        renderTable([]);
    }
}

function renderTable(data) {
    const tableBody = document.querySelector("#vendor-table-body");

    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No matching vendor accounts found</td>
            </tr>
        `;
        return;
    }

    let tableHTML = "";
    data.forEach((vendor) => {
        const statusClass = vendor.status === "Activated" ? "text-success" : "text-danger";
        
        tableHTML += `
            <tr>
                <td>${vendor.id}</td>
                <td>${vendor.company}</td>
                <td>${vendor.username}</td>
                <td><span class="${statusClass}">${vendor.status}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="showVendorDetails('${vendor.id}')">Update</button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHTML;
}

function filterTable(searchText) {
    console.log("Filtering with:", searchText);
    
    if (!searchText.trim()) {
        renderTable(vendorData);
        return;
    }

    const searchLower = searchText.toLowerCase();
    const filteredData = vendorData.filter(vendor =>
        vendor.company.toLowerCase().includes(searchLower) ||
        vendor.username.toLowerCase().includes(searchLower)
    );

    console.log("Filtered data:", filteredData.length, "records");
    renderTable(filteredData);
}

async function getNextCompanyNumber() {
    try {
        const vendorRef = collection(db, "VendorAccount");
        const vendorSnapshot = await getDocs(vendorRef);
        
        if (vendorSnapshot.empty) {
            return 1; 
        }
        
        const companyNumbers = [];
        vendorSnapshot.forEach((doc) => {
            const docId = doc.id;
            const match = docId.match(/^company(\d+)$/);
            if (match) {
                const num = parseInt(match[1]);
                companyNumbers.push(num);
            }
        });
        
        if (companyNumbers.length === 0) {
            return 1;
        }
        
        const maxNumber = Math.max(...companyNumbers);
        return maxNumber + 1;
    } catch (error) {
        console.error("Error getting next company number:", error);
        return Date.now(); 
    }
}

window.showVendorDetails = function(docId) {
    currentVendorId = docId;
    const vendor = vendorData.find(v => v.id === docId);
    
    if (vendor) {
        document.getElementById("modalTitle").textContent = "Update Vendor Account";
        document.getElementById("modalCompanyInput").value = vendor.company;
        document.getElementById("modalUsernameInput").value = vendor.username;
        document.getElementById("modalPasswordInput").value = "";
        document.getElementById("passwordField").style.display = "block";
        document.getElementById("passwordHelpText").textContent = "Leave blank to keep the current password";
        
        document.getElementById("dateFields").style.display = "block";
        document.getElementById("modalDateCreated").textContent = vendor.dateCreated;
        document.getElementById("modalExpiration").textContent = vendor.expiration;
        document.getElementById("modalStatusSelect").value = vendor.status;
        
        const saveVendorBtn = document.getElementById("saveVendorBtn");
        saveVendorBtn.textContent = "Save Changes";
        saveVendorBtn.onclick = saveVendorChanges;
        
        const deleteVendorBtn = document.getElementById("deleteVendorBtn");
        deleteVendorBtn.style.display = "block";
        deleteVendorBtn.onclick = confirmDeleteVendor;
        
        const modal = new bootstrap.Modal(document.getElementById("vendorDetailsModal"));
        modal.show();
    }
};

window.saveVendorChanges = async function() {
    if (!currentVendorId) return;
    
    try {
        const company = document.getElementById("modalCompanyInput").value.trim();
        const username = document.getElementById("modalUsernameInput").value.trim();
        const status = document.getElementById("modalStatusSelect").value;
        const password = document.getElementById("modalPasswordInput").value.trim();
        
        if (!company || !username) {
            alert("Company and Username fields cannot be empty");
            return;
        }
        
        const updateData = {
            Company: company,
            username: username,
            status: status
        };
        
        if (password) {
            updateData.password = password;
        }
        
        const vendorRef = doc(db, "VendorAccount", currentVendorId);
        await updateDoc(vendorRef, updateData);
        
        console.log("Vendor details updated successfully");
        
        const vendorIndex = vendorData.findIndex(v => v.id === currentVendorId);
        if (vendorIndex !== -1) {
            vendorData[vendorIndex].company = company;
            vendorData[vendorIndex].username = username;
            vendorData[vendorIndex].status = status;
            renderTable(vendorData);
        }
        
        const modalElement = document.getElementById("vendorDetailsModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        
        alert("Vendor details updated successfully!");
        
    } catch (error) {
        console.error("Error updating vendor details:", error);
        alert("Failed to update vendor details. Please try again.");
    }
};

window.confirmDeleteVendor = function() {
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById("vendorDetailsModal"));
    if (detailsModal) detailsModal.hide();
    
    document.getElementById("confirmDeleteBtn").onclick = deleteVendor;
    const confirmModal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));
    confirmModal.show();
};

window.deleteVendor = async function() {
    if (!currentVendorId) return;
    
    try {
        await deleteDoc(doc(db, "VendorAccount", currentVendorId));
        console.log("Vendor account deleted successfully");
        
        vendorData = vendorData.filter(vendor => vendor.id !== currentVendorId);
        renderTable(vendorData);
        
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"));
        if (confirmModal) confirmModal.hide();
        
        alert("Vendor account deleted successfully");
        
    } catch (error) {
        console.error("Error deleting vendor account:", error);
        alert("Failed to delete vendor account. Please try again.");
    }
};

window.showAddVendorModal = function() {
    currentVendorId = null;
    
    document.getElementById("modalTitle").textContent = "Add New Vendor Account";
    document.getElementById("modalCompanyInput").value = "";
    document.getElementById("modalUsernameInput").value = "";
    document.getElementById("modalPasswordInput").value = "";
    document.getElementById("passwordField").style.display = "block";
    document.getElementById("passwordHelpText").textContent = "Password is required for new accounts";
    
    document.getElementById("dateFields").style.display = "none";
    
    document.getElementById("modalStatusSelect").value = "Activated";
    
    const saveVendorBtn = document.getElementById("saveVendorBtn");
    saveVendorBtn.textContent = "Add Account";
    saveVendorBtn.onclick = addNewVendor;
    
    document.getElementById("deleteVendorBtn").style.display = "none";
    
    const modal = new bootstrap.Modal(document.getElementById("vendorDetailsModal"));
    modal.show();
};

window.addNewVendor = async function() {
    try {
        const company = document.getElementById("modalCompanyInput").value.trim();
        const username = document.getElementById("modalUsernameInput").value.trim();
        const password = document.getElementById("modalPasswordInput").value.trim();
        const status = document.getElementById("modalStatusSelect").value;
        
        if (!company || !username || !password) {
            alert("All fields are required for a new vendor account");
            return;
        }
        
        const vendorRef = collection(db, "VendorAccount");
        const q = query(vendorRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            alert("This username (email) is already in use. Please choose another one.");
            return;
        }
        
        const currentDate = new Date();
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        
        const currentDateStr = currentDate.toLocaleDateString();
        const expirationDateStr = expirationDate.toLocaleDateString();
        
        const nextCompanyNumber = await getNextCompanyNumber();
        const docId = `company${nextCompanyNumber}`;
        
        const newVendor = {
            Company: company,
            username: username,
            password: password,
            status: status,
            DateCreated: currentDateStr,
            Expiration: expirationDateStr
        };
        
        await setDoc(doc(db, "VendorAccount", docId), newVendor);
        console.log("New vendor account created with ID:", docId);
        
        vendorData.push({
            id: docId,
            company: company,
            username: username,
            dateCreated: currentDateStr,
            expiration: expirationDateStr,
            status: status,
            password: password
        });
        
        renderTable(vendorData);
        
        const modalElement = document.getElementById("vendorDetailsModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
        
        alert("New vendor account created successfully!");
        
    } catch (error) {
        console.error("Error adding new vendor account:", error);
        alert("Failed to create new vendor account. Please try again.");
    }
};

window.toggleVendorStatus = async function(docId, currentStatus) {
    try {
        const newStatus = currentStatus === "Activated" ? "Deactivated" : "Activated";
        const vendorRef = doc(db, "VendorAccount", docId);
        await updateDoc(vendorRef, { status: newStatus });
        console.log(`Vendor status updated to ${newStatus}`);
        
        const vendorIndex = vendorData.findIndex(v => v.id === docId);
        if (vendorIndex !== -1) {
            vendorData[vendorIndex].status = newStatus;
            renderTable(vendorData);
        }
        
    } catch (error) {
        console.error("Error updating vendor status:", error);
        alert("Failed to update vendor status. Please try again.");
    }
};

window.filterTable = filterTable;
window.showVendorDetails = showVendorDetails;
window.saveVendorChanges = saveVendorChanges;
window.confirmDeleteVendor = confirmDeleteVendor;
window.deleteVendor = deleteVendor;
window.showAddVendorModal = showAddVendorModal;
window.addNewVendor = addNewVendor;
window.toggleVendorStatus = toggleVendorStatus;

document.addEventListener("DOMContentLoaded", () => {
    createVendorTable(); 
    displayAdminName(); 
    populateVendorTable();
});




const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        sessionStorage.clear();
        localStorage.clear(); 
        window.location.href = "../index.html";
    });
}



document.addEventListener("DOMContentLoaded", function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log("Logout button clicked!");
            sessionStorage.clear();
            localStorage.removeItem('userType');
            window.location.href = "../index.html";
        });
    } else {
        console.error("Logout button not found!");
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const pathname = window.location.pathname;
    if (pathname.includes('vendor/') || pathname.includes('/products')) {
        const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
        if (userType !== 'vendor') {
            window.location.href = '../index.html';
        }
    }
});






async function fetchTruckData() {
    const productsContainer = document.querySelector(".Products");

    if (!productsContainer) {
        console.error("Products container not found");
        return;
    }

    const truckCollections = ["10WheelerTrucks", "6WheelerTrucks"];
    productsContainer.innerHTML = "";

    for (const collectionName of truckCollections) {
        const querySnapshot = await getDocs(collection(db, collectionName));

        if (!querySnapshot.empty) {
            let tableHTML = `
                <h2>${collectionName}</h2>
                <table border="1">
                    <thead>
                        <tr>
                            <th>Height</th>
                            <th>Length</th>
                            <th>Remarks</th>
                            <th>Temperature</th>
                            <th>Tonnage</th>
                            <th>Units</th>
                            <th>Van Type</th>
                            <th>Width</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                tableHTML += `
                    <tr>
                        <td>${data.Height || 'N/A'}</td>
                        <td>${data.Length || 'N/A'}</td>
                        <td>${data.Remarks || 'N/A'}</td>
                        <td>${data.Temperature || 'N/A'}</td>
                        <td>${data.Tonnage || 'N/A'}</td>
                        <td>${data.Units || 'N/A'}</td>
                        <td>${data.VanType || 'N/A'}</td>
                        <td>${data.Width || 'N/A'}</td>
                    </tr>
                `;
            });

            tableHTML += "</tbody></table>";
            productsContainer.innerHTML += tableHTML;
        } else {
            productsContainer.innerHTML += `<h2>${collectionName}</h2><p>No data available.</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", fetchTruckData);
