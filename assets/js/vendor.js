import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('userType');
        window.location.href = "../index.html";
    });
}
document.addEventListener('DOMContentLoaded', function() {
    const pathname = window.location.pathname;
    if (pathname.endsWith('vendor.html')) {
        if (localStorage.getItem('userType') !== 'vendor') {
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
    productsContainer.innerHTML = ""; // Clear any previous data

    for (const collectionName of truckCollections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
    
        if (!querySnapshot.empty) {
            let table = `<div class="col-12">
                <div class="card recent-sales overflow-auto">
                    <div class="card-body">
                        <h5 class="card-title">${collectionName} (${querySnapshot.size})</h5>
                        <table class="table table-borderless datatable">
                            <thead>
                                <tr>
                                    <th scope="col">Units</th>
                                    <th scope="col">Van Type</th>
                                    <th scope="col">Height</th>
                                    <th scope="col">Width</th>
                                    <th scope="col">Length</th>
                                    <th scope="col">Tonnage</th>
                                    <th scope="col">Temperature</th>
                                    <th scope="col">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>`;
    
            querySnapshot.forEach(doc => {
                const data = doc.data();
                table += `<tr>
                    <td>${data.Units || "N/A"}</td>
                    <td>${data.VanType || "N/A"}</td>
                    <td>${data.Height || "N/A"}</td>
                    <td>${data.Width || "N/A"}</td>
                    <td>${data.Length || "N/A"}</td>
                    <td>${data.Tonnage || "N/A"}</td>
                    <td>${data.Temperature || "N/A"}</td>
                    <td>${data.Remarks || "N/A"}</td>
                </tr>`;
            });
    
            table += `</tbody></table></div></div></div>`;
            productsContainer.innerHTML += table;
        } else {
            productsContainer.innerHTML += `<div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${collectionName} (0)</h5>
                        <p>No trucks available in this category.</p>
                    </div>
                </div>
            </div>`;
        }
    }
    
}

document.addEventListener("DOMContentLoaded", fetchTruckData);
