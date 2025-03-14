import { db } from "./firebase-config.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.getElementById("logoutBtnAdmin").addEventListener("click", function () {
    window.location.href = "index.html";
});


document.addEventListener("DOMContentLoaded", function () {
    fetchVendorData();

});

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
