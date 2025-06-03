import { collection, getDocs, query, where, doc, updateDoc, setDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
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
                    <div>
                        <label for="eventFilter">Filter by Event:</label>
                        <select id="eventFilter">
                            <option value="">All Events</option>
                        </select>

                        <label for="statusFilter">Filter by Status:</label>
                        <select id="statusFilter">
                            <option value="">All Status</option>
                        </select>
                        <button class="btn btn-success ms-3" onclick="showAddVendorModal()">Add Vendor Account</button>
                    </div>
                </div>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Event</th>
                            <th>Username</th>
                            <th>Status</th>
                            <th>Activity</th>
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
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>  
                        <div class="mb-3">
                            <label for="modalEventSelect" class="form-label">Event</label>
                            <select class="form-select" id="modalEventSelect">
                            </select>
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
}

let allVendorData = []; // Global variable to store all vendor data

async function populateVendorTable() {
    try {
        const vendorRef = collection(db, "CompanyAccounts");
        const vendorSnapshot = await getDocs(vendorRef);

        const vendorData = [];

        if (vendorSnapshot.empty) {
            console.log("No vendor accounts found");
            renderTable([]);
            return;
        }

        for (const vendorDoc of vendorSnapshot.docs) {
            const data = vendorDoc.data();
            let eventName = "N/A";

            if (data.Event) {
                const eventDocRef = doc(db, "Events", data.Event); 
                const eventDoc = await getDoc(eventDocRef);
                if (eventDoc.exists()) {
                    eventName = eventDoc.data().Name || data.Event;
                } else {
                    eventName = data.Event;
                }
            }

            vendorData.push({
                id: vendorDoc.id,
                company: vendorDoc.id,
                event: eventName,
                username: data.Username || "N/A",
                status: data.Status || "N/A",
                activity: data.Activity || "N/A",
                password: data.Password || "N/A"
            });
        }

        allVendorData = vendorData; // Store all data globally
        console.log("Loaded vendor data:", vendorData.length, "records");

        // Load filter options
        loadFilters();

        renderTable(vendorData); // Initial render with all data

    } catch (error) {
        console.error("Error populating vendor table:", error);
        renderTable([]);
    }
}

function loadFilters() {
    const eventFilter = document.getElementById("eventFilter");
    const statusFilter = document.getElementById("statusFilter");

    // Populate event filter
    const events = [...new Set(allVendorData.map(v => v.event))];
    events.forEach(event => {
        eventFilter.innerHTML += `<option value="${event}">${event}</option>`;
    });

    // Populate status filter
    const statuses = [...new Set(allVendorData.map(v => v.status))];
    statuses.forEach(status => {
        statusFilter.innerHTML += `<option value="${status}">${status}</option>`;
    });

    // Add event listeners for the filters
    eventFilter.addEventListener("change", renderTable);
    statusFilter.addEventListener("change", renderTable);
}

function renderTable() {
    const tableBody = document.querySelector("#vendor-table-body");

    const eventFilterValue = document.getElementById("eventFilter").value;
    const statusFilterValue = document.getElementById("statusFilter").value;

    // Filter vendor data based on the selected filters
    let filteredData = [...allVendorData];

    if (eventFilterValue) {
        filteredData = filteredData.filter(vendor => vendor.event === eventFilterValue);
    }

    if (statusFilterValue) {
        filteredData = filteredData.filter(vendor => vendor.status === statusFilterValue);
    }

    tableBody.innerHTML = "";

    if (filteredData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No matching vendor accounts found</td>
            </tr>
        `;
        return;
    }

    let tableHTML = "";
    filteredData.forEach((vendor) => {
        const statusClass = vendor.status === "Active" ? "text-success" : "text-danger";
        const activityColor = vendor.activity === "Online" ? "style='color: blue; font-weight: 500;'" : "";

        tableHTML += `
            <tr>
                <td>${vendor.company}</td>
                <td>${vendor.event}</td>
                <td>${vendor.username}</td>
                <td><span class="${statusClass}">${vendor.status}</span></td>
                <td><span ${activityColor}>${vendor.activity}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="showVendorDetails('${vendor.id}')">Update</button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHTML;
}

window.showVendorDetails = async function (docId) {
    currentVendorId = docId;

    const vendorRef = doc(db, "CompanyAccounts", docId);

    try {
        const docSnap = await getDoc(vendorRef);

        if (docSnap.exists()) {
            const vendor = docSnap.data();

            // Populate modal fields
            document.getElementById("modalTitle").textContent = "Update Vendor Account";
            document.getElementById("modalCompanyInput").value = vendor.CompanyName || docId || "";
            document.getElementById("modalUsernameInput").value = vendor.Username || "";
            document.getElementById("modalPasswordInput").value = "";
            document.getElementById("passwordField").style.display = "block";
            document.getElementById("passwordHelpText").textContent = "Leave blank to keep the current password";

            if (vendor.Status) {
                document.getElementById("modalStatusSelect").value = vendor.Status;
            }

            // Load available events into dropdown
            const eventsSnap = await getDocs(collection(db, "Events"));
            const eventSelect = document.getElementById("modalEventSelect");
            eventSelect.innerHTML = `<option value="">Select Event</option>`;
            eventsSnap.forEach((eventDoc) => {
                const eventData = eventDoc.data();
                const option = document.createElement("option");
                option.value = eventDoc.id;
                option.textContent = eventData.Name || eventDoc.id;
                if (vendor.Event === eventDoc.id) {
                    option.selected = true;
                }
                eventSelect.appendChild(option);
            });

            // Set up buttons
            const saveVendorBtn = document.getElementById("saveVendorBtn");
            saveVendorBtn.textContent = "Save Changes";
            saveVendorBtn.onclick = saveVendorChanges;

            const deleteVendorBtn = document.getElementById("deleteVendorBtn");
            deleteVendorBtn.style.display = "block";
            deleteVendorBtn.onclick = confirmDeleteVendor;

            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById("vendorDetailsModal"));
            modal.show();
        } else {
            console.error("Vendor not found in Firestore");
        }
    } catch (error) {
        console.error("Error getting vendor data:", error);
    }
};

window.saveVendorChanges = async function () {
    if (!currentVendorId) return;

    try {
        const companyName = document.getElementById("modalCompanyInput").value.trim();
        const username = document.getElementById("modalUsernameInput").value.trim();
        const password = document.getElementById("modalPasswordInput").value.trim();
        const status = document.getElementById("modalStatusSelect").value;
        const eventId = document.getElementById("modalEventSelect").value;

        if (!username) {
            alert("Username cannot be empty.");
            return;
        }

        const updateData = {
            CompanyName: companyName,
            Username: username,
            Status: status,
            Event: eventId
        };

        if (password) {
            updateData.Password = password;
        }

        const vendorRef = doc(db, "CompanyAccounts", currentVendorId);
        await updateDoc(vendorRef, updateData);

        console.log("Vendor details updated successfully.");

        const vendorIndex = vendorData.findIndex(v => v.id === currentVendorId);
        if (vendorIndex !== -1) {
            vendorData[vendorIndex].company = companyName;
            vendorData[vendorIndex].username = username;
            vendorData[vendorIndex].status = status;
            renderTable(vendorData);
        }

        const modalElement = document.getElementById("vendorDetailsModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

        alert("Vendor details updated successfully!");
        populateVendorTable();

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
        await deleteDoc(doc(db, "CompanyAccounts", currentVendorId));
        console.log("Vendor account deleted successfully");
        
        vendorData = vendorData.filter(vendor => vendor.id !== currentVendorId);
        renderTable(vendorData);
        
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"));
        if (confirmModal) confirmModal.hide();
        
        populateVendorTable()
        
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
        const username = document.getElementById("modalUsernameInput").value.trim();
        const password = document.getElementById("modalPasswordInput").value.trim();
        const status = document.getElementById("modalStatusSelect").value;
        const companyId = document.getElementById("modalCompanyInput").value.trim(); 
        const eventId = document.getElementById("modalEventSelect").value; // Get the selected event ID

        // Check if necessary fields are filled
        if (!username || !password || !companyId || !eventId) {
            alert("Username, Password, Company ID, and Event are required for a new vendor account.");
            return;
        }

        // Check if username already exists
        const vendorRef = collection(db, "CompanyAccounts");
        const q = query(vendorRef, where("Username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert("This username is already in use. Please choose another one.");
            return;
        }

        // Firestore document structure, including the Event field
        const newVendor = {
            Username: username,
            Password: password,
            Status: status,
            Event: eventId // Add the selected event ID to the vendor document
        };

        // Set the document using the company ID (from modalCompanyInput)
        await setDoc(doc(db, "CompanyAccounts", companyId), newVendor);
        console.log(`New vendor account created for ${companyId}`);

        // Update frontend vendor list (if needed)
        vendorData.push({
            id: companyId,
            Username: username,
            Status: status,
            Event: eventId // Optionally include event in the vendor data to render in the table
        });

        renderTable(vendorData);

        // Close modal
        const modalElement = document.getElementById("vendorDetailsModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

        alert("New vendor account created successfully!");

        // Optionally, reload or update vendor data on the table
        populateVendorTable();

    } catch (error) {
        console.error("Error adding new vendor account:", error);
        alert("Failed to create new vendor account. Please try again.");
    }
};


window.toggleVendorStatus = async function(docId, currentStatus) {
    try {
        const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
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

window.showVendorDetails = showVendorDetails;
window.saveVendorChanges = saveVendorChanges;
window.confirmDeleteVendor = confirmDeleteVendor;
window.deleteVendor = deleteVendor;
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

const logoutBtnAdmin = document.getElementById('logoutBtnAdmin');
if (logoutBtnAdmin) {
  logoutBtnAdmin.addEventListener('click', function() {
    sessionStorage.clear();
    localStorage.removeItem('userType');
    window.location.href = "../index.html";
  });
}

async function loadEvents() {
    try {
        // Reference to the 'Events' collection
        const eventsRef = collection(db, 'Events');
        
        // Fetch all documents from the 'Events' collection
        const snapshot = await getDocs(eventsRef);

        // Reference to the select element
        const eventSelect = document.getElementById('modalEventSelect');
        
        // Clear any existing options in the select element
        eventSelect.innerHTML = '';

        // Loop through each event document and append an option to the select element
        snapshot.forEach(doc => {
            const eventId = doc.id; // Event document ID (e.g., Event1)
            const eventName = doc.data().Name; // Event name from the document

            // Create a new option element
            const option = document.createElement('option');
            option.value = eventId; // Set the value to the event ID
            option.textContent = eventName; // Set the text content to the event name

            // Append the option to the select dropdown
            eventSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Call the function to load events when the page is ready
loadEvents();
