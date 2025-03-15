import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('userType');
        window.location.href = "index.html";
    });
}
document.addEventListener('DOMContentLoaded', function() {
    const pathname = window.location.pathname;
    if (pathname.endsWith('vendor.html')) {
        if (localStorage.getItem('userType') !== 'vendor') {
            window.location.href = 'index.html';
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
    productsContainer.innerHTML = ""; // Clear any previous data

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
            productsContainer.innerHTML += tableHTML; // Append table to the div
        } else {
            productsContainer.innerHTML += `<h2>${collectionName}</h2><p>No data available.</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", fetchTruckData);
