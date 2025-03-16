import { collection, getDocs, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

async function displayVendorName() {
    const userType = localStorage.getItem('userType');
    
    if (userType !== 'vendor') {
        console.log("No vendor logged in!");
        return;
    }
    
    const vendorEmail = localStorage.getItem('vendorEmail');
    
    if (!vendorEmail) {
        console.log("vendor email not found in session!");
        return;
    }
    
    try {
        const vendorRef = collection(db, "VendorAccount");
        const q = query(vendorRef, where("username", "==", vendorEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            const vendorName = docData.Company || vendorEmail;
            
            document.getElementById("displayName").textContent = vendorName;
        } else {
            console.log("vendor document not found!");
            document.getElementById("displayName").textContent = "vendor";
        }
    } catch (error) {
        console.error("Error retrieving vendor info:", error);
        document.getElementById("displayName").textContent = "vendor";
    }
}

let vendorData = [];

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
                status: data.status || "N/A"
            });
        });
        
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
                <td colspan="4" class="text-center">No matching vendor accounts found</td>
            </tr>
        `;
        return;
    }

    let tableHTML = "";
    data.forEach((vendor, index) => {
        tableHTML += `
            <tr>
                <td>${vendor.company}</td>
                <td>${vendor.username}</td>
                <td>${vendor.status}</td>
                <td><button class="btn btn-primary" onclick="updateVendor('${vendor.id}')">Update</button></td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHTML;
}

function filterTable(searchText) {
    if (!searchText.trim()) {
        renderTable(vendorData);
        return;
    }

    const searchLower = searchText.toLowerCase();
    const filteredData = vendorData.filter(vendor =>
        vendor.company.toLowerCase().includes(searchLower) ||
        vendor.username.toLowerCase().includes(searchLower)
    );

    renderTable(filteredData);
}

async function updateVendor(docId) {
    try {
        const vendorRef = doc(db, "VendorAccount", docId);
        await updateDoc(vendorRef, {
            status: "Activated" 
        });
        console.log("Vendor account updated successfully!");
        populateVendorTable();
    } catch (error) {
        console.error("Error updating vendor account:", error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    displayVendorName();
    populateVendorTable();

    document.getElementById("vendor-search").addEventListener("input", function(e) {
        filterTable(e.target.value);
    });
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
