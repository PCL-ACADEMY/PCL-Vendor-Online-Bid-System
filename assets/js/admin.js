import { db } from "./firebase-config.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const logoutBtnAdmin = document.getElementById('logoutBtnAdmin');

// Fetch ng data sa Firebase
document.addEventListener("DOMContentLoaded", function () {
    fetchVendorData();
    fetchTruckData()
});


// Logout
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

// Sidebar Function
document.addEventListener("DOMContentLoaded", function () {
    const adminUserContainer = document.querySelector(".admin-user-container");
    const adminProductContainer = document.querySelector(".admin-product-container");
    const truckTablesContainer = document.getElementById("truckTables");
    const sidebarButtons = document.querySelectorAll(".side-bar button");

    let truckDataCache = null;

    sidebarButtons.forEach(button => {
        button.addEventListener("click", async function () {
            sidebarButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            if (this.id === "productsBtn") { 
                adminUserContainer.style.display = "none";
                truckTablesContainer.style.display = "block";
                adminProductContainer.style.display = "none"; 

                if (!truckDataCache) {
                    truckTablesContainer.innerHTML = "<p>Loading data...</p>";
                    truckDataCache = await fetchTruckData();
                    truckTablesContainer.innerHTML = truckDataCache;
                }

                adminProductContainer.style.display = "block";
            } else if (this.id === "userBtn") { 
                adminUserContainer.style.display = "block";
                adminProductContainer.style.display = "none";
                truckTablesContainer.style.display = "none";
            } else {
                adminUserContainer.style.display = "none";
                adminProductContainer.style.display = "none";
                truckTablesContainer.style.display = "none";
            }
        });
    });
});


// Product Function
async function fetchTruckData() {
    let content = "";
    const truckCollections = [
        { name: "10 Wheeler Trucks", collectionName: "10WheelerTrucks" },
        { name: "6 Wheeler Trucks", collectionName: "6WheelerTrucks" }
    ];

    for (const truckType of truckCollections) {
        const querySnapshot = await getDocs(collection(db, truckType.collectionName));

        if (!querySnapshot.empty) {
            let table = `<h2>${truckType.name}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Units</th>
                            <th>Van Type</th>
                            <th>Height</th>
                            <th>Width</th>
                            <th>Length</th>
                            <th>Tonnage</th>
                            <th>Temperature</th>
                            <th>Ceiling Price</th>
                            <th>Start Time</th>
                            <th>Duration (Seconds)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>`;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const startTime = data.StartTime ? new Date(data.StartTime.seconds * 1000).toLocaleString() : "N/A";
                const duration = data.Duration ? `${data.Duration} sec` : "N/A";

                table += `<tr>
                    <td>${data.Units || "N/A"}</td>
                    <td>${data.VanType || "N/A"}</td>
                    <td>${data.Height || "N/A"}</td>
                    <td>${data.Width || "N/A"}</td>
                    <td>${data.Length || "N/A"}</td>
                    <td>${data.Tonnage || "N/A"}</td>
                    <td>${data.Temperature || "N/A"}</td>
                    <td>${data.CeilingPrice || "N/A"}</td>
                    <td>${startTime}</td>
                    <td>${duration}</td>
                    <td>
                        <button class="start-btn" data-id="${doc.id}" data-collection="${truckType.collectionName}">Start</button>
                        <button class="remove-btn" data-id="${doc.id}" data-collection="${truckType.collectionName}">Remove</button>
                    </td>
                </tr>`;
            });

            table += `</tbody></table>`;
            content += table;
        }
    }

    return content || "<p>No available items.</p>";
}



// User Function

// Add vendor button event listener
document.getElementById("addVendorBtn").addEventListener("click", function () {
     alert("Add Vendor Button Clicked! Implement logic here.");
});

// Function to fetch and display vendor data
async function fetchVendorData() {
    const vendorTableBody = document.getElementById("vendorTableBody");
    vendorTableBody.innerHTML = "";

    const vendorRef = collection(db, "VendorAccount");
    const querySnapshot = await getDocs(vendorRef);

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${data.username}</td>
            <td>${data.Company}</td>
            <td>${data.DateCreated}</td>
            <td>${data.Expiration}</td>
            <td>
                <button class="edit-btn" data-id="${doc.id}">Edit</button>
                <button class="delete-btn" data-id="${doc.id}">Delete</button>
                <button class="deactivate-btn" data-id="${doc.id}">Deactivate</button>
            </td>
        `;

        vendorTableBody.appendChild(row);
    });

    // Attach event listeners to the action buttons
    vendorTableBody.addEventListener("click", async (event) => {
        if (event.target.classList.contains("edit-btn")) {
            editVendor(event.target.getAttribute("data-id"));
        } else if (event.target.classList.contains("delete-btn")) {
            deleteVendor(event.target.getAttribute("data-id"));
        } else if (event.target.classList.contains("deactivate-btn")) {
            deactivateVendor(event.target.getAttribute("data-id"));
        }
    });
}

// Function to handle "Edit"
function editVendor(vendorId) {
    alert(`Edit vendor: ${vendorId}`);
    // Implement edit logic here
}

// Function to handle "Delete"
async function deleteVendor(vendorId) {
    if (confirm("Are you sure you want to delete this vendor?")) {
        await deleteDoc(doc(db, "VendorAccount", vendorId));
        alert("Vendor deleted successfully!");
        fetchVendorData();
    }
}

// Function to handle "Deactivate"
function deactivateVendor(vendorId) {
    if (confirm("Are you sure you want to deactivate this vendor?")) {
        alert(`Vendor ${vendorId} deactivated`);
        // Implement deactivation logic here
    }
}
